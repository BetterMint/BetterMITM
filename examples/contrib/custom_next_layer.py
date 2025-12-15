"""
This addon demonstrates how to override next_layer to modify the protocol in use.
In this example, we are forcing connections to example.com:443 to instead go as plaintext
to example.com:80.

Example usage:

    - mitmdump -s custom_next_layer.py
    - curl -x localhost:8080 -k https://example.com
"""

import logging

from mitmproxy import ctx
from mitmproxy.proxy import layer
from mitmproxy.proxy import layers


def running():


    ctx.options.connection_strategy = "lazy"


def next_layer(nextlayer: layer.NextLayer):
    logging.info(
        f"{nextlayer.context=}\n"
        f"{nextlayer.data_client()[:70]=}\n"
        f"{nextlayer.data_server()[:70]=}\n"
    )

    if nextlayer.context.server.address == ("example.com", 443):
        nextlayer.context.server.address = ("example.com", 80)



        nextlayer.context.client.alpn = b""



        nextlayer.layer = layers.ClientTLSLayer(nextlayer.context)
        nextlayer.layer.child_layer = layers.TCPLayer(nextlayer.context)
