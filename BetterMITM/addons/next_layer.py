"""
This addon determines the next protocol layer in our proxy stack.
Whenever a protocol layer in the proxy wants to pass a connection to a child layer and isn't sure which protocol comes
next, it calls the `next_layer` hook, which ends up here.
For example, if mitmproxy runs as a regular proxy, we first need to determine if
new clients start with a TLS handshake right away (Secure Web Proxy) or send a plaintext HTTP CONNECT request.
This addon here peeks at the incoming bytes and then makes a decision based on proxy mode, mitmproxy options, etc.

For a typical HTTPS request, this addon is called a couple of times: First to determine that we start with an HTTP layer
which processes the `CONNECT` request, a second time to determine that the client then starts negotiating TLS, and a
third time when we check if the protocol within that TLS stream is actually HTTP or something else.

Sometimes it's useful to hardcode specific logic in next_layer when one wants to do fancy things.
In that case it's not necessary to modify mitmproxy's source, adding a custom addon with a next_layer event hook
that sets nextlayer.layer works just as well.
"""

from __future__ import annotations

import logging
import re
import sys
from collections.abc import Iterable
from collections.abc import Sequence
from typing import Any
from typing import cast

from BetterMITM import ctx
from BetterMITM.connection import Address
from BetterMITM.net.tls import starts_like_dtls_record
from BetterMITM.net.tls import starts_like_tls_record
from BetterMITM.proxy import layer
from BetterMITM.proxy import layers
from BetterMITM.proxy import mode_specs
from BetterMITM.proxy import tunnel
from BetterMITM.proxy.context import Context
from BetterMITM.proxy.layer import Layer
from BetterMITM.proxy.layers import ClientQuicLayer
from BetterMITM.proxy.layers import ClientTLSLayer
from BetterMITM.proxy.layers import DNSLayer
from BetterMITM.proxy.layers import HttpLayer
from BetterMITM.proxy.layers import modes
from BetterMITM.proxy.layers import RawQuicLayer
from BetterMITM.proxy.layers import ServerQuicLayer
from BetterMITM.proxy.layers import ServerTLSLayer
from BetterMITM.proxy.layers import TCPLayer
from BetterMITM.proxy.layers import UDPLayer
from BetterMITM.proxy.layers.http import HTTPMode
from BetterMITM.proxy.layers.quic import quic_parse_client_hello_from_datagrams
from BetterMITM.proxy.layers.tls import dtls_parse_client_hello
from BetterMITM.proxy.layers.tls import HTTP_ALPNS
from BetterMITM.proxy.layers.tls import parse_client_hello
from BetterMITM.tls import ClientHello

if sys.version_info < (3, 11):
    from typing_extensions import assert_never
else:
    from typing import assert_never

logger = logging.getLogger(__name__)


def stack_match(
    context: Context, layers: Sequence[type[Layer] | tuple[type[Layer], ...]]
) -> bool:
    if len(context.layers) != len(layers):
        return False
    return all(
        expected is Any or isinstance(actual, expected)
        for actual, expected in zip(context.layers, layers)
    )


class NeedsMoreData(Exception):
    """Signal that the decision on which layer to put next needs to be deferred within the NextLayer addon."""


class NextLayer:
    ignore_hosts: Sequence[re.Pattern] = ()
    allow_hosts: Sequence[re.Pattern] = ()
    tcp_hosts: Sequence[re.Pattern] = ()
    udp_hosts: Sequence[re.Pattern] = ()

    def configure(self, updated):
        if "tcp_hosts" in updated:
            self.tcp_hosts = [
                re.compile(x, re.IGNORECASE) for x in ctx.options.tcp_hosts
            ]
        if "udp_hosts" in updated:
            self.udp_hosts = [
                re.compile(x, re.IGNORECASE) for x in ctx.options.udp_hosts
            ]
        if "allow_hosts" in updated or "ignore_hosts" in updated:
            self.ignore_hosts = [
                re.compile(x, re.IGNORECASE) for x in ctx.options.ignore_hosts
            ]
            self.allow_hosts = [
                re.compile(x, re.IGNORECASE) for x in ctx.options.allow_hosts
            ]

    def next_layer(self, nextlayer: layer.NextLayer):
        if nextlayer.layer:
            return
        try:
            nextlayer.layer = self._next_layer(
                nextlayer.context,
                nextlayer.data_client(),
                nextlayer.data_server(),
            )
        except NeedsMoreData:
            logger.debug(
                f"Deferring layer decision, not enough data: {nextlayer.data_client().hex()!r}"
            )

    def _next_layer(
        self, context: Context, data_client: bytes, data_server: bytes
    ) -> Layer | None:
        assert context.layers

        def s(*layers):
            return stack_match(context, layers)

        tcp_based = context.client.transport_protocol == "tcp"
        udp_based = context.client.transport_protocol == "udp"


        if self._ignore_connection(context, data_client, data_server):
            return (
                layers.TCPLayer(context, ignore=not ctx.options.show_ignored_hosts)
                if tcp_based
                else layers.UDPLayer(context, ignore=not ctx.options.show_ignored_hosts)
            )



        if s(modes.ReverseProxy):
            return self._setup_reverse_proxy(context, data_client)

        if s((modes.HttpProxy, modes.HttpUpstreamProxy)):
            return self._setup_explicit_http_proxy(context, data_client)



        is_tls_or_dtls = (
            tcp_based
            and starts_like_tls_record(data_client)
            or udp_based
            and starts_like_dtls_record(data_client)
        )
        if is_tls_or_dtls:
            server_tls = ServerTLSLayer(context)
            server_tls.child_layer = ClientTLSLayer(context)
            return server_tls

        if udp_based and _starts_like_quic(data_client, context.server.address):
            server_quic = ServerQuicLayer(context)
            server_quic.child_layer = ClientQuicLayer(context)
            return server_quic


        if tcp_based and self._is_destination_in_hosts(context, self.tcp_hosts):
            return layers.TCPLayer(context)
        if udp_based and self._is_destination_in_hosts(context, self.udp_hosts):
            return layers.UDPLayer(context)



        if context.client.alpn:
            if context.client.alpn in HTTP_ALPNS:
                return layers.HttpLayer(context, HTTPMode.transparent)
            elif context.client.tls_version == "QUICv1":

                return layers.RawQuicLayer(context, force_raw=True)

        if context.server.address and context.server.address[1] in (53, 5353):
            return layers.DNSLayer(context)

        if udp_based:
            return layers.UDPLayer(context)

        probably_no_http = (

            len(data_client) < 3

            or b" " not in data_client

            or (data_client.find(b" ") > data_client.find(b"\n"))
            or not data_client[:3].isalpha()

            or data_server
            or data_client.startswith(b"SSH")
        )
        if ctx.options.rawtcp and probably_no_http:
            return layers.TCPLayer(context)

        return layers.HttpLayer(context, HTTPMode.transparent)

    def _ignore_connection(
        self,
        context: Context,
        data_client: bytes,
        data_server: bytes,
    ) -> bool | None:
        """
        Returns:
            True, if the connection should be ignored.
            False, if it should not be ignored.

        Raises:
            NeedsMoreData, if we need to wait for more input data.
        """
        if not ctx.options.ignore_hosts and not ctx.options.allow_hosts:
            return False

        if isinstance(
            context.client.proxy_mode, mode_specs.WireGuardMode
        ) and context.server.address == ("10.0.0.53", 53):
            return False
        hostnames: list[str] = []
        if context.server.peername:
            host, port, *_ = context.server.peername
            hostnames.append(f"{host}:{port}")
        if context.server.address:
            host, port, *_ = context.server.address
            hostnames.append(f"{host}:{port}")




            if host_header := self._get_host_header(context, data_client, data_server):
                if not re.search(r":\d+$", host_header):
                    host_header = f"{host_header}:{port}"
                hostnames.append(host_header)
            if (
                client_hello := self._get_client_hello(context, data_client)
            ) and client_hello.sni:
                hostnames.append(f"{client_hello.sni}:{port}")
            if context.client.sni:

                hostnames.append(f"{context.client.sni}:{port}")

        if not hostnames:
            return False

        if ctx.options.allow_hosts:
            not_allowed = not any(
                re.search(rex, host, re.IGNORECASE)
                for host in hostnames
                for rex in ctx.options.allow_hosts
            )
            if not_allowed:
                return True

        if ctx.options.ignore_hosts:
            ignored = any(
                re.search(rex, host, re.IGNORECASE)
                for host in hostnames
                for rex in ctx.options.ignore_hosts
            )
            if ignored:
                return True

        return False

    @staticmethod
    def _get_host_header(
        context: Context,
        data_client: bytes,
        data_server: bytes,
    ) -> str | None:
        """
        Try to read a host header from data_client.

        Returns:
            The host header value, or None, if no host header was found.

        Raises:
            NeedsMoreData, if the HTTP request is incomplete.
        """
        if context.client.transport_protocol != "tcp" or data_server:
            return None

        host_header_expected = re.match(
            rb"[A-Z]{3,}.+HTTP/", data_client, re.IGNORECASE
        )
        if host_header_expected:
            if m := re.search(
                rb"\r\n(?:Host:\s+(.+?)\s*)?\r\n", data_client, re.IGNORECASE
            ):
                if host := m.group(1):
                    return host.decode("utf-8", "surrogateescape")
                else:
                    return None
            else:
                raise NeedsMoreData
        else:
            return None

    @staticmethod
    def _get_client_hello(context: Context, data_client: bytes) -> ClientHello | None:
        """
        Try to read a TLS/DTLS/QUIC ClientHello from data_client.

        Returns:
            A complete ClientHello, or None, if no ClientHello was found.

        Raises:
            NeedsMoreData, if the ClientHello is incomplete.
        """
        match context.client.transport_protocol:
            case "tcp":
                if starts_like_tls_record(data_client):
                    try:
                        ch = parse_client_hello(data_client)
                    except ValueError:
                        pass
                    else:
                        if ch is None:
                            raise NeedsMoreData
                        return ch
                return None
            case "udp":
                try:
                    return quic_parse_client_hello_from_datagrams([data_client])
                except ValueError:
                    pass

                try:
                    ch = dtls_parse_client_hello(data_client)
                except ValueError:
                    pass
                else:
                    if ch is None:
                        raise NeedsMoreData
                    return ch
                return None
            case _:
                assert_never(context.client.transport_protocol)

    @staticmethod
    def _setup_reverse_proxy(context: Context, data_client: bytes) -> Layer:
        spec = cast(mode_specs.ReverseMode, context.client.proxy_mode)
        stack = tunnel.LayerStack()

        match spec.scheme:
            case "http":
                if starts_like_tls_record(data_client):
                    stack /= ClientTLSLayer(context)
                stack /= HttpLayer(context, HTTPMode.transparent)
            case "https":
                if context.client.transport_protocol == "udp":
                    stack /= ServerQuicLayer(context)
                    stack /= ClientQuicLayer(context)
                    stack /= HttpLayer(context, HTTPMode.transparent)
                else:
                    stack /= ServerTLSLayer(context)
                    if starts_like_tls_record(data_client):
                        stack /= ClientTLSLayer(context)
                    stack /= HttpLayer(context, HTTPMode.transparent)

            case "tcp":
                if starts_like_tls_record(data_client):
                    stack /= ClientTLSLayer(context)
                stack /= TCPLayer(context)
            case "tls":
                stack /= ServerTLSLayer(context)
                if starts_like_tls_record(data_client):
                    stack /= ClientTLSLayer(context)
                stack /= TCPLayer(context)

            case "udp":
                if starts_like_dtls_record(data_client):
                    stack /= ClientTLSLayer(context)
                stack /= UDPLayer(context)
            case "dtls":
                stack /= ServerTLSLayer(context)
                if starts_like_dtls_record(data_client):
                    stack /= ClientTLSLayer(context)
                stack /= UDPLayer(context)

            case "dns":








                stack /= DNSLayer(context)

            case "http3":
                stack /= ServerQuicLayer(context)
                stack /= ClientQuicLayer(context)
                stack /= HttpLayer(context, HTTPMode.transparent)
            case "quic":
                stack /= ServerQuicLayer(context)
                stack /= ClientQuicLayer(context)
                stack /= RawQuicLayer(context, force_raw=True)

            case _:
                assert_never(spec.scheme)

        return stack[0]

    @staticmethod
    def _setup_explicit_http_proxy(context: Context, data_client: bytes) -> Layer:
        stack = tunnel.LayerStack()

        if context.client.transport_protocol == "udp":
            stack /= layers.ClientQuicLayer(context)
        elif starts_like_tls_record(data_client):
            stack /= layers.ClientTLSLayer(context)

        if isinstance(context.layers[0], modes.HttpUpstreamProxy):
            stack /= layers.HttpLayer(context, HTTPMode.upstream)
        else:
            stack /= layers.HttpLayer(context, HTTPMode.regular)

        return stack[0]

    @staticmethod
    def _is_destination_in_hosts(context: Context, hosts: Iterable[re.Pattern]) -> bool:
        return any(
            (context.server.address and rex.search(context.server.address[0]))
            or (context.client.sni and rex.search(context.client.sni))
            for rex in hosts
        )



KNOWN_QUIC_VERSIONS = {
    0x00000001,
    0x51303433,
    0x51303436,
    0x51303530,
    0x6B3343CF,
    0x709A50C4,
}

TYPICAL_QUIC_PORTS = {80, 443, 8443}


def _starts_like_quic(data_client: bytes, server_address: Address | None) -> bool:
    """
    Make an educated guess on whether this could be QUIC.
    This turns out to be quite hard in practice as 1-RTT packets are hardly distinguishable from noise.

    Returns:
        True, if the passed bytes could be the start of a QUIC packet.
        False, otherwise.
    """

    if len(data_client) < 18:
        return False
    if starts_like_dtls_record(data_client):
        return False



    if data_client[0] & 0x80:
        version = int.from_bytes(data_client[1:5], "big")
        if version in KNOWN_QUIC_VERSIONS:
            return True


        if version & 0x0F0F0F0F == 0x0A0A0A0A:
            return True
    else:


        pass

    return bool(server_address and server_address[1] in TYPICAL_QUIC_PORTS)
