from __future__ import annotations

import asyncio
import functools
import hashlib
import json
import logging
import os.path
import re
import secrets
import sys
import time
from collections.abc import Callable
from collections.abc import Sequence
from io import BytesIO
from typing import Any
from typing import Awaitable
from typing import ClassVar
from typing import Concatenate
from typing import Literal
from typing import Optional

import tornado.escape
import tornado.web
import tornado.websocket

import BetterMITM.flow
import BetterMITM.tools.web.master
import mitmproxy_rs
from BetterMITM import certs
from BetterMITM import command
from BetterMITM import contentviews
from BetterMITM import flowfilter
from BetterMITM import http
from BetterMITM import io
from BetterMITM import log
from BetterMITM import optmanager
from BetterMITM import version
from BetterMITM.dns import DNSFlow
from BetterMITM.http import HTTPFlow
from BetterMITM.tcp import TCPFlow
from BetterMITM.tcp import TCPMessage
from BetterMITM.tools.web.webaddons import WebAuth
from BetterMITM.udp import UDPFlow
from BetterMITM.udp import UDPMessage
from BetterMITM.utils import asyncio_utils
from BetterMITM.utils.emoji import emoji
from BetterMITM.utils.strutils import always_str
from BetterMITM.utils.strutils import cut_after_n_lines
from BetterMITM.websocket import WebSocketMessage

logger = logging.getLogger(__name__)

TRANSPARENT_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08"
    b"\x04\x00\x00\x00\xb5\x1c\x0c\x02\x00\x00\x00\x0bIDATx\xdac\xfc\xff\x07"
    b"\x00\x02\x00\x01\xfc\xa8Q\rh\x00\x00\x00\x00IEND\xaeB`\x82"
)

logger = logging.getLogger(__name__)


def cert_to_json(certs: Sequence[certs.Cert]) -> dict | None:
    if not certs:
        return None
    cert = certs[0]
    return {
        "keyinfo": cert.keyinfo,
        "sha256": cert.fingerprint().hex(),
        "notbefore": int(cert.notbefore.timestamp()),
        "notafter": int(cert.notafter.timestamp()),
        "serial": str(cert.serial),
        "subject": cert.subject,
        "issuer": cert.issuer,
        "altnames": [str(x.value) for x in cert.altnames],
    }


def flow_to_json(flow: BetterMITM.flow.Flow, master: Optional[BetterMITM.tools.web.master.WebMaster] = None) -> dict:
    """
    Remove flow message content and cert to save transmission space.
    Args:
        flow: The original flow.
        master: Optional WebMaster instance to access addons.
    Sync with web/src/flow.ts.
    """

    intercept_state = None
    try:
        if master:
            addon = master.addons.get("advancedinterceptor")
            if addon:
                intercept_state = addon.get_flow_state(flow.id)
    except Exception:
        pass


    bookmarked = False
    tags = []
    try:
        if master:
            if hasattr(master, "_flow_bookmarks"):
                bookmarked = master._flow_bookmarks.get(flow.id, False)
            if hasattr(master, "_flow_tags"):
                tags = master._flow_tags.get(flow.id, [])
    except Exception:
        pass

    f = {
        "id": flow.id,
        "intercepted": flow.intercepted,
        "is_replay": flow.is_replay,
        "type": flow.type,
        "modified": flow.modified(),
        "marked": emoji.get(flow.marked, "🔴") if flow.marked else "",
        "comment": flow.comment,
        "timestamp_created": flow.timestamp_created,
        "intercept_state": intercept_state,
        "live": flow.live,
        "killable": flow.killable,
        "bookmarked": bookmarked,
        "tags": tags,
    }

    if flow.client_conn:
        f["client_conn"] = {
            "id": flow.client_conn.id,
            "peername": flow.client_conn.peername,
            "sockname": flow.client_conn.sockname,
            "tls_established": flow.client_conn.tls_established,
            "cert": cert_to_json(flow.client_conn.certificate_list),
            "sni": flow.client_conn.sni,
            "cipher": flow.client_conn.cipher,
            "alpn": always_str(flow.client_conn.alpn, "ascii", "backslashreplace"),
            "tls_version": flow.client_conn.tls_version,
            "timestamp_start": flow.client_conn.timestamp_start,
            "timestamp_tls_setup": flow.client_conn.timestamp_tls_setup,
            "timestamp_end": flow.client_conn.timestamp_end,
        }

    if flow.server_conn:
        f["server_conn"] = {
            "id": flow.server_conn.id,
            "peername": flow.server_conn.peername,
            "sockname": flow.server_conn.sockname,
            "address": flow.server_conn.address,
            "tls_established": flow.server_conn.tls_established,
            "cert": cert_to_json(flow.server_conn.certificate_list),
            "sni": flow.server_conn.sni,
            "cipher": flow.server_conn.cipher,
            "alpn": always_str(flow.server_conn.alpn, "ascii", "backslashreplace"),
            "tls_version": flow.server_conn.tls_version,
            "timestamp_start": flow.server_conn.timestamp_start,
            "timestamp_tcp_setup": flow.server_conn.timestamp_tcp_setup,
            "timestamp_tls_setup": flow.server_conn.timestamp_tls_setup,
            "timestamp_end": flow.server_conn.timestamp_end,
        }
    if flow.error:
        f["error"] = flow.error.get_state()

    if isinstance(flow, HTTPFlow):
        content_length: int | None
        content_hash: str | None

        if flow.request.raw_content is not None:
            content_length = len(flow.request.raw_content)
            content_hash = hashlib.sha256(flow.request.raw_content).hexdigest()
        else:
            content_length = None
            content_hash = None
        f["request"] = {
            "method": flow.request.method,
            "scheme": flow.request.scheme,
            "host": flow.request.host,
            "port": flow.request.port,
            "path": flow.request.path,
            "http_version": flow.request.http_version,
            "headers": tuple(flow.request.headers.items(True)),
            "contentLength": content_length,
            "contentHash": content_hash,
            "timestamp_start": flow.request.timestamp_start,
            "timestamp_end": flow.request.timestamp_end,
            "pretty_host": flow.request.pretty_host,
        }
        if flow.response:
            if flow.response.raw_content is not None:
                content_length = len(flow.response.raw_content)
                content_hash = hashlib.sha256(flow.response.raw_content).hexdigest()
            else:
                content_length = None
                content_hash = None
            f["response"] = {
                "http_version": flow.response.http_version,
                "status_code": flow.response.status_code,
                "reason": flow.response.reason,
                "headers": tuple(flow.response.headers.items(True)),
                "contentLength": content_length,
                "contentHash": content_hash,
                "timestamp_start": flow.response.timestamp_start,
                "timestamp_end": flow.response.timestamp_end,
            }
            if flow.response.data.trailers:
                f["response"]["trailers"] = tuple(
                    flow.response.data.trailers.items(True)
                )

        if flow.websocket:
            f["websocket"] = {
                "messages_meta": {
                    "contentLength": sum(
                        len(x.content) for x in flow.websocket.messages
                    ),
                    "count": len(flow.websocket.messages),
                    "timestamp_last": flow.websocket.messages[-1].timestamp
                    if flow.websocket.messages
                    else None,
                },
                "closed_by_client": flow.websocket.closed_by_client,
                "close_code": flow.websocket.close_code,
                "close_reason": flow.websocket.close_reason,
                "timestamp_end": flow.websocket.timestamp_end,
            }
    elif isinstance(flow, (TCPFlow, UDPFlow)):
        f["messages_meta"] = {
            "contentLength": sum(len(x.content) for x in flow.messages),
            "count": len(flow.messages),
            "timestamp_last": flow.messages[-1].timestamp if flow.messages else None,
        }
    elif isinstance(flow, DNSFlow):
        f["request"] = flow.request.to_json()
        if flow.response:
            f["response"] = flow.response.to_json()

    return f


def logentry_to_json(e: log.LogEntry) -> dict:
    return {
        "id": id(e),
        "message": e.msg,
        "level": e.level,
    }


class APIError(tornado.web.HTTPError):
    pass


class AuthRequestHandler(tornado.web.RequestHandler):
    AUTH_COOKIE_VALUE = b"y"

    def __init_subclass__(cls, **kwargs):
        """Automatically wrap all request handlers with `_require_auth`."""
        for method in cls.SUPPORTED_METHODS:
            method = method.lower()
            fn = getattr(cls, method)
            if fn is not tornado.web.RequestHandler._unimplemented_method:
                setattr(cls, method, AuthRequestHandler._require_auth(fn))

    def auth_fail(self, invalid_password: bool) -> None:
        """
        Will be called when returning a 403.
        May write a login form as the response.
        """

    @staticmethod
    def _require_auth[**P, R](
        fn: Callable[Concatenate[AuthRequestHandler, P], R],
    ) -> Callable[Concatenate[AuthRequestHandler, P], R | None]:
        @functools.wraps(fn)
        def wrapper(
            self: AuthRequestHandler, *args: P.args, **kwargs: P.kwargs
        ) -> R | None:
            if not self.current_user:
                password = ""
                if auth_header := self.request.headers.get("Authorization"):
                    auth_scheme, _, auth_params = auth_header.partition(" ")
                    if auth_scheme == "Bearer":
                        password = auth_params

                if not password:
                    password = self.get_argument("token", default="")

                if not self.settings["is_valid_password"](password):
                    self.set_status(403)
                    self.auth_fail(bool(password))
                    return None
                self.set_signed_cookie(
                    self.settings["auth_cookie_name"](),
                    self.AUTH_COOKIE_VALUE,
                    expires_days=400,
                    httponly=True,
                    samesite="Strict",
                )
            return fn(self, *args, **kwargs)

        return wrapper

    def get_current_user(self) -> bool:
        return (
            self.get_signed_cookie(self.settings["auth_cookie_name"](), min_version=2)
            == self.AUTH_COOKIE_VALUE
        )


class RequestHandler(AuthRequestHandler):
    application: Application

    def prepare(self):
        if (
            self.request.method not in ("GET", "HEAD", "OPTIONS")
            and "Sec-Fetch-Site" in self.request.headers
            and self.request.headers["Sec-Fetch-Site"] not in ("same-origin", "none")
        ):
            raise tornado.httpclient.HTTPError(403)

    def write(self, chunk: str | bytes | dict | list):


        if isinstance(chunk, list):
            chunk = tornado.escape.json_encode(chunk)
            self.set_header("Content-Type", "application/json; charset=UTF-8")
        super().write(chunk)

    def set_default_headers(self):
        super().set_default_headers()
        self.set_header("Server", version.MITMPROXY)
        self.set_header("X-Frame-Options", "DENY")
        self.add_header("X-XSS-Protection", "1; mode=block")
        self.add_header("X-Content-Type-Options", "nosniff")
        self.add_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "connect-src 'self' ws:; "
            "img-src 'self' data:; "
            "style-src   'self' 'unsafe-inline'",
        )

    @property
    def json(self):
        if not self.request.headers.get("Content-Type", "").startswith(
            "application/json"
        ):
            raise APIError(400, "Invalid Content-Type, expected application/json.")
        try:
            return json.loads(self.request.body.decode())
        except Exception as e:
            raise APIError(400, f"Malformed JSON: {e}")

    @property
    def filecontents(self):
        """
        Accept either a multipart/form file upload or just take the plain request body.

        """
        if self.request.files:
            return next(iter(self.request.files.values()))[0].body
        else:
            return self.request.body

    @property
    def view(self) -> BetterMITM.addons.view.View:
        return self.application.master.view

    @property
    def master(self) -> BetterMITM.tools.web.master.WebMaster:
        return self.application.master

    @property
    def flow(self) -> BetterMITM.flow.Flow:
        flow_id = str(self.path_kwargs["flow_id"])

        flow = self.view.get_by_id(flow_id)
        if flow:
            return flow
        else:
            raise APIError(404, "Flow not found.")

    def write_error(self, status_code: int, **kwargs):
        if "exc_info" in kwargs and isinstance(kwargs["exc_info"][1], APIError):
            self.finish(kwargs["exc_info"][1].log_message)
        else:
            super().write_error(status_code, **kwargs)


class IndexHandler(RequestHandler):
    def auth_fail(self, invalid_password: bool) -> None:
        self.render("login.html", invalid_password=invalid_password)

    def get(self):
        self.render("../index.html")

    post = get


class FilterHelp(RequestHandler):
    def get(self):
        self.write(dict(commands=flowfilter.help))


class WebSocketEventBroadcaster(tornado.websocket.WebSocketHandler, AuthRequestHandler):

    connections: ClassVar[set[WebSocketEventBroadcaster]]

    _send_queue: asyncio.Queue[bytes]
    _send_task: asyncio.Task[None]

    def prepare(self) -> Optional[Awaitable[None]]:
        token = self.xsrf_token
        assert token
        return None

    def open(self, *args, **kwargs):
        self.connections.add(self)
        self._send_queue = asyncio.Queue()

        self._send_task = asyncio_utils.create_task(
            self.send_task(),
            name="WebSocket send task",
            keep_ref=False,
        )

    def on_close(self):
        self.connections.discard(self)
        self._send_task.cancel()

    @classmethod
    def broadcast(cls, **kwargs):
        message = cls._json_dumps(kwargs)
        for conn in cls.connections:
            conn.send(message)

    def send(self, message: bytes):
        self._send_queue.put_nowait(message)

    async def send_task(self):
        while True:
            message = await self._send_queue.get()
            try:
                await self.write_message(message)
            except tornado.websocket.WebSocketClosedError:
                self.on_close()

    @staticmethod
    def _json_dumps(d):
        return json.dumps(d, ensure_ascii=False).encode("utf8", "surrogateescape")


class ClientConnection(WebSocketEventBroadcaster):
    connections: ClassVar[set[ClientConnection]] = set()
    application: Application

    def __init__(self, application: Application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.filters: dict[str, flowfilter.TFilter] = {}

    @classmethod
    def broadcast_flow_reset(cls) -> None:
        for conn in cls.connections:
            conn.send(cls._json_dumps({"type": "flows/reset"}))
            for name, expr in conn.filters.copy().items():
                conn.update_filter(name, expr.pattern)

    @classmethod
    def broadcast_flow(
        cls,
        type: Literal["flows/add", "flows/update"],
        f: BetterMITM.flow.Flow,
    ) -> None:
        flow_json = flow_to_json(f)
        for conn in cls.connections:
            conn._broadcast_flow(type, f, flow_json)

    def _broadcast_flow(
        self,
        type: Literal["flows/add", "flows/update"],
        f: BetterMITM.flow.Flow,
        flow_json: dict,
    ) -> None:
        filters = {name: bool(expr(f)) for name, expr in self.filters.items()}
        message = self._json_dumps(
            {
                "type": type,
                "payload": {
                    "flow": flow_json,
                    "matching_filters": filters,
                },
            },
        )
        self.send(message)

    def update_filter(self, name: str, expr: str) -> None:
        if expr:
            filt = flowfilter.parse(expr)
            self.filters[name] = filt
            matching_flow_ids = [f.id for f in self.application.master.view if filt(f)]
        else:
            self.filters.pop(name, None)
            matching_flow_ids = None

        message = self._json_dumps(
            {
                "type": "flows/filterUpdate",
                "payload": {
                    "name": name,
                    "matching_flow_ids": matching_flow_ids,
                },
            },
        )
        self.send(message=message)

    async def on_message(self, message: str | bytes):
        try:
            data = json.loads(message)
            match data["type"]:
                case "flows/updateFilter":
                    self.update_filter(data["payload"]["name"], data["payload"]["expr"])
                case other:
                    raise ValueError(f"Unsupported command: {other}")
        except Exception as e:
            logger.error(f"Error processing message from {self}: {e}")
            self.close(code=1011, reason="Internal server error.")


class Flows(RequestHandler):
    def get(self):
        self.write([flow_to_json(f, self.master) for f in self.view])


class DumpFlows(RequestHandler):
    def get(self) -> None:
        self.set_header("Content-Disposition", "attachment; filename=flows")
        self.set_header("Content-Type", "application/octet-stream")

        match: Callable[[BetterMITM.flow.Flow], bool]
        try:
            match = flowfilter.parse(self.request.arguments["filter"][0].decode())
        except ValueError:
            raise APIError(400, f"Invalid filter argument / regex")
        except (
            KeyError,
            IndexError,
        ):

            def match(_) -> bool:
                return True

        with BytesIO() as bio:
            fw = io.FlowWriter(bio)
            for f in self.view:
                if match(f):
                    fw.add(f)
            self.write(bio.getvalue())

    async def post(self):
        self.view.clear()
        bio = BytesIO(self.filecontents)
        for f in io.FlowReader(bio).stream():
            await self.master.load_flow(f)
        bio.close()


class ClearAll(RequestHandler):
    def post(self):
        self.view.clear()
        self.master.events.clear()


class ResumeFlows(RequestHandler):
    def post(self):
        for f in self.view:
            if not f.intercepted:
                continue
            f.resume()
            self.view.update([f])


class KillFlows(RequestHandler):
    def post(self):
        for f in self.view:
            if f.killable:
                f.kill()
                self.view.update([f])


class ResumeFlow(RequestHandler):
    def post(self, flow_id):
        self.flow.resume()
        self.view.update([self.flow])


class KillFlow(RequestHandler):
    def post(self, flow_id):
        if self.flow.killable:
            self.flow.kill()
            self.view.update([self.flow])


class FlowHandler(RequestHandler):
    def delete(self, flow_id):
        if self.flow.killable:
            self.flow.kill()
        self.view.remove([self.flow])

    def put(self, flow_id) -> None:
        flow: BetterMITM.flow.Flow = self.flow
        flow.backup()
        try:
            for a, b in self.json.items():
                if a == "request" and hasattr(flow, "request"):
                    request: BetterMITM.http.Request = flow.request
                    for k, v in b.items():
                        if k in ["method", "scheme", "host", "path", "http_version"]:
                            setattr(request, k, str(v))
                        elif k == "port":
                            request.port = int(v)
                        elif k == "headers":
                            request.headers.clear()
                            for header in v:
                                request.headers.add(*header)
                        elif k == "trailers":
                            if request.trailers is not None:
                                request.trailers.clear()
                            else:
                                request.trailers = BetterMITM.http.Headers()
                            for trailer in v:
                                request.trailers.add(*trailer)
                        elif k == "content":
                            request.text = v
                        else:
                            raise APIError(400, f"Unknown update request.{k}: {v}")

                elif a == "response" and hasattr(flow, "response"):
                    response: BetterMITM.http.Response = flow.response
                    for k, v in b.items():
                        if k in ["msg", "http_version"]:
                            setattr(response, k, str(v))
                        elif k == "code":
                            response.status_code = int(v)
                        elif k == "headers":
                            response.headers.clear()
                            for header in v:
                                response.headers.add(*header)
                        elif k == "trailers":
                            if response.trailers is not None:
                                response.trailers.clear()
                            else:
                                response.trailers = BetterMITM.http.Headers()
                            for trailer in v:
                                response.trailers.add(*trailer)
                        elif k == "content":
                            response.text = v
                        else:
                            raise APIError(400, f"Unknown update response.{k}: {v}")
                elif a == "marked":
                    flow.marked = b
                elif a == "comment":
                    flow.comment = b
                else:
                    raise APIError(400, f"Unknown update {a}: {b}")
        except APIError:
            flow.revert()
            raise
        self.view.update([flow])


class DuplicateFlow(RequestHandler):
    def post(self, flow_id):
        f = self.flow.copy()
        self.view.add([f])
        self.write(f.id)


class RevertFlow(RequestHandler):
    def post(self, flow_id):
        if self.flow.modified():
            self.flow.revert()
            self.view.update([self.flow])


class ReplayFlow(RequestHandler):
    def post(self, flow_id):
        self.master.commands.call("replay.client", [self.flow])


class ReplayFlowModified(RequestHandler):
    def post(self, flow_id):
        data = tornado.escape.json_decode(self.request.body)
        modifications = data.get("modifications", {})
        delay = data.get("delay", 0)

        import asyncio
        if delay > 0:
            asyncio.sleep(delay / 1000.0)

        if "request" in modifications:
            req_mods = modifications["request"]
            if "method" in req_mods:
                self.flow.request.method = req_mods["method"]
            if "headers" in req_mods:
                self.flow.request.headers.clear()
                for k, v in req_mods["headers"]:
                    self.flow.request.headers.add(k, v)
            if "content" in req_mods:
                self.flow.request.content = req_mods["content"].encode()

        if "response" in modifications and self.flow.response:
            resp_mods = modifications["response"]
            if "headers" in resp_mods:
                self.flow.response.headers.clear()
                for k, v in resp_mods["headers"]:
                    self.flow.response.headers.add(k, v)
            if "content" in resp_mods:
                self.flow.response.content = resp_mods["content"].encode()

        self.flow.backup()
        self.master.commands.call("replay.client", [self.flow])


class FlowContent(RequestHandler):
    def post(self, flow_id, message):
        self.flow.backup()
        message = getattr(self.flow, message)
        message.content = self.filecontents
        self.view.update([self.flow])

    def get(self, flow_id, message):
        message = getattr(self.flow, message)
        assert isinstance(self.flow, HTTPFlow)

        original_cd = message.headers.get("Content-Disposition", None)
        filename = None
        if original_cd:
            if m := re.search(r'filename=([-\w" .()]+)', original_cd):
                filename = m.group(1)
        if not filename:
            filename = self.flow.request.path.split("?")[0].split("/")[-1]

        filename = re.sub(r'[^-\w" .()]', "", filename)
        cd = f"attachment; {filename=!s}"
        self.set_header("Content-Disposition", cd)
        self.set_header("Content-Type", "application/text")
        self.set_header("X-Content-Type-Options", "nosniff")
        self.set_header("X-Frame-Options", "DENY")
        self.write(message.get_content(strict=False))


class FlowContentView(RequestHandler):
    def message_to_json(
        self,
        view_name: str,
        message: http.Message | TCPMessage | UDPMessage | WebSocketMessage,
        flow: HTTPFlow | TCPFlow | UDPFlow,
        max_lines: int | None = None,
        from_client: bool | None = None,
        timestamp: float | None = None,
    ):
        if view_name and view_name.lower() == "auto":
            view_name = "auto"
        pretty = contentviews.prettify_message(message, flow, view_name=view_name)
        if max_lines:
            pretty.text = cut_after_n_lines(pretty.text, max_lines)

        ret: dict[str, Any] = dict(
            text=pretty.text,
            view_name=pretty.view_name,
            syntax_highlight=pretty.syntax_highlight,
            description=pretty.description,
        )
        if from_client is not None:
            ret["from_client"] = from_client
        if timestamp is not None:
            ret["timestamp"] = timestamp
        return ret

    def get(self, flow_id, message, content_view) -> None:
        flow = self.flow
        assert isinstance(flow, (HTTPFlow, TCPFlow, UDPFlow))

        if self.request.arguments.get("lines"):
            max_lines = int(self.request.arguments["lines"][0])
        else:
            max_lines = None

        if message == "messages":
            messages: list[TCPMessage] | list[UDPMessage] | list[WebSocketMessage]
            if isinstance(flow, HTTPFlow) and flow.websocket:
                messages = flow.websocket.messages
            elif isinstance(flow, (TCPFlow, UDPFlow)):
                messages = flow.messages
            else:
                raise APIError(400, f"This flow has no messages.")
            msgs = []
            for m in messages:
                d = self.message_to_json(
                    view_name=content_view,
                    message=m,
                    flow=flow,
                    max_lines=max_lines,
                    from_client=m.from_client,
                    timestamp=m.timestamp,
                )
                msgs.append(d)
                if max_lines:
                    max_lines -= d["text"].count("\n") + 1
                    assert max_lines is not None
                    if max_lines <= 0:
                        break
            self.write(msgs)
        else:
            message = getattr(self.flow, message)
            self.write(self.message_to_json(content_view, message, flow, max_lines))


class Commands(RequestHandler):
    def get(self) -> None:
        commands = {}
        for name, cmd in self.master.commands.commands.items():
            commands[name] = {
                "help": cmd.help,
                "parameters": [
                    {
                        "name": param.name,
                        "type": command.typename(param.type),
                        "kind": str(param.kind),
                    }
                    for param in cmd.parameters
                ],
                "return_type": command.typename(cmd.return_type)
                if cmd.return_type
                else None,
                "signature_help": cmd.signature_help(),
            }
        self.write(commands)


class ExecuteCommand(RequestHandler):
    def post(self, cmd: str):

        try:
            args = self.json["arguments"]
        except APIError:
            args = []
        try:
            result = self.master.commands.call_strings(cmd, args)
        except Exception as e:
            self.write({"error": str(e)})
        else:
            self.write(
                {
                    "value": result,

                }
            )


class Events(RequestHandler):
    def get(self):
        self.write([logentry_to_json(e) for e in self.master.events.data])


class Options(RequestHandler):
    def get(self):
        self.write(optmanager.dump_dicts(self.master.options))

    def put(self):
        update = self.json
        try:
            self.master.options.update(**update)
        except Exception as err:
            raise APIError(400, f"{err}")


class SaveOptions(RequestHandler):
    def post(self):




        pass


class State(RequestHandler):

    @staticmethod
    def get_json(master: BetterMITM.tools.web.master.WebMaster):
        return {
            "version": version.VERSION,
            "contentViews": [
                v for v in contentviews.registry.available_views() if v != "query"
            ],
            "servers": {
                s.mode.full_spec: s.to_json() for s in master.proxyserver.servers
            },
            "platform": sys.platform,
            "localModeUnavailable": mitmproxy_rs.local.LocalRedirector.unavailable_reason(),
        }

    def get(self):
        self.write(State.get_json(self.master))


class ProcessList(RequestHandler):
    @staticmethod
    def get_json():
        processes = mitmproxy_rs.process_info.active_executables()
        return [
            {
                "is_visible": process.is_visible,
                "executable": str(process.executable),
                "is_system": process.is_system,
                "display_name": process.display_name,
            }
            for process in processes
        ]

    def get(self):
        self.write(ProcessList.get_json())


class ProcessImage(RequestHandler):
    def get(self):
        path = self.get_query_argument("path", None)

        if not path:
            raise APIError(400, "Missing 'path' parameter.")

        try:
            icon_bytes = mitmproxy_rs.process_info.executable_icon(path)
        except Exception:
            icon_bytes = TRANSPARENT_PNG

        self.set_header("Content-Type", "image/png")
        self.set_header("X-Content-Type-Options", "nosniff")
        self.set_header("Cache-Control", "max-age=604800")
        self.write(icon_bytes)


class ProtobufFileUpload(RequestHandler):
    def post(self):
        """Handle protobuf file upload and save it, then update the protobuf_file option."""
        from pathlib import Path
        import tempfile

        try:
            file_content = self.filecontents
            if not file_content:
                raise APIError(400, "No file content provided.")


            confdir = Path(self.master.options.confdir).expanduser()
            confdir.mkdir(parents=True, exist_ok=True)
            protobuf_file_path = confdir / "protobuf.txt"


            with open(protobuf_file_path, "wb") as f:
                f.write(file_content)


            self.master.options.protobuf_file = str(protobuf_file_path)



            protobuf_addon = self.master.addons.get("protobufinterceptor")
            if protobuf_addon:
                protobuf_addon.configure({"protobuf_file"})

            self.write({"success": True, "path": str(protobuf_file_path)})
        except Exception as e:
            raise APIError(400, f"Failed to upload protobuf file: {e}")


class AdvancedInterceptRules(RequestHandler):
    """Get or update advanced intercept rules."""

    def get(self):
        """Get current intercept rules."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        self.write({
            "enabled": self.master.options.advanced_intercept_enabled,
            "inbound": self.master.options.advanced_intercept_inbound,
            "outbound": self.master.options.advanced_intercept_outbound,
            "intercept_urls": self.master.options.advanced_intercept_urls or "",
            "block_urls": self.master.options.advanced_block_urls or "",
            "mode": self.master.options.advanced_intercept_mode,
            "skip_domains": self.master.options.advanced_skip_domains or "",
            "match_mode": getattr(self.master.options, "advanced_intercept_match_mode", "regex"),
            "case_sensitive": getattr(self.master.options, "advanced_intercept_case_sensitive", False),
            "intercept_methods": getattr(self.master.options, "advanced_intercept_methods", ""),
            "intercept_status_codes": getattr(self.master.options, "advanced_intercept_status_codes", ""),
            "max_queue": getattr(self.master.options, "advanced_intercept_max_queue", 100),
            "auto_resume": getattr(self.master.options, "advanced_intercept_auto_resume", 0.0),
            "log": getattr(self.master.options, "advanced_intercept_log", True),
            "header_filters": getattr(self.master.options, "advanced_intercept_header_filters", ""),
            "body_patterns": getattr(self.master.options, "advanced_intercept_body_patterns", ""),
        })

    def post(self):
        """Update intercept rules."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        data = self.json
        updated = set()

        if "enabled" in data:
            new_enabled = bool(data["enabled"])
            self.master.options.advanced_intercept_enabled = new_enabled
            updated.add("advanced_intercept_enabled")


            if new_enabled:

                if "mode" not in data:
                    if not hasattr(self.master.options, "advanced_intercept_mode") or not self.master.options.advanced_intercept_mode:
                        self.master.options.advanced_intercept_mode = "pause"
                        updated.add("advanced_intercept_mode")


                if "inbound" not in data:
                    if not hasattr(self.master.options, "advanced_intercept_inbound") or self.master.options.advanced_intercept_inbound is None:
                        self.master.options.advanced_intercept_inbound = True
                        updated.add("advanced_intercept_inbound")


                if "outbound" not in data:
                    if not hasattr(self.master.options, "advanced_intercept_outbound") or self.master.options.advanced_intercept_outbound is None:
                        self.master.options.advanced_intercept_outbound = True
                        updated.add("advanced_intercept_outbound")

        if "inbound" in data:
            self.master.options.advanced_intercept_inbound = bool(data["inbound"])
            updated.add("advanced_intercept_inbound")

        if "outbound" in data:
            self.master.options.advanced_intercept_outbound = bool(data["outbound"])
            updated.add("advanced_intercept_outbound")

        if "intercept_urls" in data:
            self.master.options.advanced_intercept_urls = str(data["intercept_urls"])
            updated.add("advanced_intercept_urls")

        if "block_urls" in data:
            self.master.options.advanced_block_urls = str(data["block_urls"])
            updated.add("advanced_block_urls")

        if "mode" in data:
            mode = str(data["mode"])
            if mode not in ("pause", "block"):
                raise APIError(400, f"Invalid mode: {mode}. Must be 'pause' or 'block'")
            self.master.options.advanced_intercept_mode = mode
            updated.add("advanced_intercept_mode")

        if "skip_domains" in data:
            self.master.options.advanced_skip_domains = str(data["skip_domains"])
            updated.add("advanced_skip_domains")

        if "match_mode" in data:
            match_mode = str(data["match_mode"])
            if match_mode not in ("regex", "exact", "contains"):
                raise APIError(400, f"Invalid match_mode: {match_mode}")
            self.master.options.advanced_intercept_match_mode = match_mode
            updated.add("advanced_intercept_match_mode")

        if "case_sensitive" in data:
            self.master.options.advanced_intercept_case_sensitive = bool(data["case_sensitive"])
            updated.add("advanced_intercept_case_sensitive")

        if "intercept_methods" in data:
            self.master.options.advanced_intercept_methods = str(data["intercept_methods"])
            updated.add("advanced_intercept_methods")

        if "intercept_status_codes" in data:
            self.master.options.advanced_intercept_status_codes = str(data["intercept_status_codes"])
            updated.add("advanced_intercept_status_codes")

        if "max_queue" in data:
            max_queue = int(data["max_queue"])
            if max_queue < 1 or max_queue > 10000:
                raise APIError(400, "max_queue must be between 1 and 10000")
            self.master.options.advanced_intercept_max_queue = max_queue
            updated.add("advanced_intercept_max_queue")

        if "auto_resume" in data:
            auto_resume = float(data["auto_resume"])
            if auto_resume < 0:
                raise APIError(400, "auto_resume must be >= 0")
            self.master.options.advanced_intercept_auto_resume = auto_resume
            updated.add("advanced_intercept_auto_resume")

        if "log" in data:
            self.master.options.advanced_intercept_log = bool(data["log"])
            updated.add("advanced_intercept_log")

        if "header_filters" in data:
            self.master.options.advanced_intercept_header_filters = str(data["header_filters"])
            updated.add("advanced_intercept_header_filters")

        if "body_patterns" in data:
            self.master.options.advanced_intercept_body_patterns = str(data["body_patterns"])
            updated.add("advanced_intercept_body_patterns")

        if updated:
            addon.configure(updated)

        self.write({"success": True})


class PausedConnectionsHandler(RequestHandler):
    """Get or manage paused connections list."""

    def get(self):
        """Get list of paused connections."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        self.write({
            "paused_connections": addon.get_paused_connections(),
        })

    def post(self):
        """Add a connection to the paused list."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        data = self.json
        domain_or_ip = data.get("domain_or_ip", "")
        if domain_or_ip:
            addon.add_paused_connection(domain_or_ip)

        self.write({"success": True, "paused_connections": addon.get_paused_connections()})

    def delete(self):
        """Remove a connection from the paused list."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        data = self.json
        domain_or_ip = data.get("domain_or_ip", "")
        if domain_or_ip:
            addon.remove_paused_connection(domain_or_ip)

        self.write({"success": True, "paused_connections": addon.get_paused_connections()})


class FlowStateControl(RequestHandler):
    """Control flow state (pause, resume, block)."""

    def post(self, flow_id):
        """Set flow state: pause, resume, or block."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        action = self.json.get("action", "pause")

        if action == "pause":
            self.flow.intercept()
            addon.set_flow_state(flow_id, "paused")
            self.view.update([self.flow])
        elif action == "resume":
            self.flow.resume()
            addon.clear_flow_state(flow_id)
            self.view.update([self.flow])
        elif action == "block":
            if self.flow.killable:
                self.flow.kill()
                addon.set_flow_state(flow_id, "blocked")
                self.view.update([self.flow])
            else:
                raise APIError(400, "Flow is not killable")
        elif action == "intercept":
            self.flow.intercept()
            addon.set_flow_state(flow_id, "intercepted")

            if isinstance(self.flow, http.HTTPFlow) and self.flow.request:
                domain = self.flow.request.pretty_host
                addon.add_paused_connection(domain)

                if self.flow.client_conn and self.flow.client_conn.peername:
                    client_ip = self.flow.client_conn.peername[0] if isinstance(self.flow.client_conn.peername, tuple) else str(self.flow.client_conn.peername)
                    addon.add_paused_connection(client_ip)
            self.view.update([self.flow])
        else:
            raise APIError(400, f"Invalid action: {action}")

        self.write({"success": True, "state": addon.get_flow_state(flow_id)})

    def get(self, flow_id):
        """Get current flow state."""
        addon = self.master.addons.get("advancedinterceptor")
        if not addon:
            raise APIError(404, "Advanced interceptor addon not found")

        state = addon.get_flow_state(flow_id)
        self.write({
            "flow_id": flow_id,
            "state": state,
            "intercepted": self.flow.intercepted,
            "killable": self.flow.killable,
        })


class RequestBuilderSend(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        method = data.get("method", "GET")
        url = data.get("url", "")
        headers = data.get("headers", {})
        body = data.get("body")

        if not url:
            raise APIError(400, "URL is required")

        try:
            import urllib.request
            import urllib.parse
            from urllib.error import HTTPError, URLError

            req = urllib.request.Request(url, data=body.encode() if body else None, headers=headers, method=method)

            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    response_body = response.read().decode('utf-8', errors='replace')
                    result = {
                        "status": response.getcode(),
                        "statusText": response.msg or "OK",
                        "headers": dict(response.headers),
                        "body": response_body,
                    }
                    self.write(result)
            except HTTPError as e:
                response_body = e.read().decode('utf-8', errors='replace')
                result = {
                    "status": e.code,
                    "statusText": e.reason or "Error",
                    "headers": dict(e.headers),
                    "body": response_body,
                }
                self.write(result)
        except Exception as e:
            raise APIError(500, f"Failed to send request: {str(e)}")


class MockResponses(RequestHandler):
    def get(self):
        mock_responses = getattr(self.master, "_mock_responses", {})
        self.write(list(mock_responses.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        response_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_mock_responses"):
            self.master._mock_responses = {}

        self.master._mock_responses[response_id] = {
            "id": response_id,
            **data,
        }
        self.write(self.master._mock_responses[response_id])


class MockResponseHandler(RequestHandler):
    def put(self, response_id):
        if not hasattr(self.master, "_mock_responses"):
            raise APIError(404, "Mock response not found")

        data = tornado.escape.json_decode(self.request.body)
        if response_id not in self.master._mock_responses:
            raise APIError(404, "Mock response not found")

        self.master._mock_responses[response_id] = {
            **self.master._mock_responses[response_id],
            **data,
        }
        self.write(self.master._mock_responses[response_id])

    def delete(self, response_id):
        if not hasattr(self.master, "_mock_responses"):
            raise APIError(404, "Mock response not found")

        if response_id not in self.master._mock_responses:
            raise APIError(404, "Mock response not found")

        del self.master._mock_responses[response_id]
        self.write({"success": True})


class FlowBookmark(RequestHandler):
    def post(self, flow_id):
        try:
            data = tornado.escape.json_decode(self.request.body)
            bookmarked = data.get("bookmarked", False)
        except Exception:

            bookmarked = False

        if not hasattr(self.master, "_flow_bookmarks"):
            self.master._flow_bookmarks = {}


        flow = self.view.get_by_id(flow_id)
        if not flow:
            raise APIError(404, f"Flow {flow_id} not found")

        self.master._flow_bookmarks[flow_id] = bookmarked


        flow.bookmarked = bookmarked

        self.write({"flow_id": flow_id, "bookmarked": bookmarked})

    def put(self, flow_id):

        return self.post(flow_id)


class FlowTags(RequestHandler):
    def post(self, flow_id):
        data = tornado.escape.json_decode(self.request.body)
        tags = data.get("tags", [])

        if not hasattr(self.master, "_flow_tags"):
            self.master._flow_tags = {}

        self.master._flow_tags[flow_id] = tags
        self.write({"flow_id": flow_id, "tags": tags})


class SmartRules(RequestHandler):
    def get(self):
        rules_engine = self.master.addons.get("smartrulesengine")
        if rules_engine:
            self.write(rules_engine.rules)
        else:
            self.write([])

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        rule_id = data.get("id") or secrets.token_hex(8)

        rules_engine = self.master.addons.get("smartrulesengine")
        if not rules_engine:
            raise APIError(404, "Smart rules engine not found")

        if not hasattr(rules_engine, "_rules_store"):
            rules_engine._rules_store = {}

        rules_engine._rules_store[rule_id] = {
            "id": rule_id,
            **data,
        }
        rules_engine.rules = list(rules_engine._rules_store.values())
        self.write(rules_engine._rules_store[rule_id])


class SmartRuleHandler(RequestHandler):
    def put(self, rule_id):
        rules_engine = self.master.addons.get("smartrulesengine")
        if not rules_engine or not hasattr(rules_engine, "_rules_store"):
            raise APIError(404, "Rule not found")

        data = tornado.escape.json_decode(self.request.body)
        if rule_id not in rules_engine._rules_store:
            raise APIError(404, "Rule not found")

        rules_engine._rules_store[rule_id] = {
            **rules_engine._rules_store[rule_id],
            **data,
        }
        rules_engine.rules = list(rules_engine._rules_store.values())
        self.write(rules_engine._rules_store[rule_id])

    def delete(self, rule_id):
        rules_engine = self.master.addons.get("smartrulesengine")
        if not rules_engine or not hasattr(rules_engine, "_rules_store"):
            raise APIError(404, "Rule not found")

        if rule_id not in rules_engine._rules_store:
            raise APIError(404, "Rule not found")

        del rules_engine._rules_store[rule_id]
        rules_engine.rules = list(rules_engine._rules_store.values())
        self.write({"success": True})


class SmartRulesConfig(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        config = data.get("config")
        format_type = data.get("format", "json")

        rules_engine = self.master.addons.get("smartrulesengine")
        if not rules_engine:
            raise APIError(404, "Smart rules engine not found")

        rules_engine.rules = config if isinstance(config, list) else [config]
        if not hasattr(rules_engine, "_rules_store"):
            rules_engine._rules_store = {}
        for rule in rules_engine.rules:
            rule_id = rule.get("id") or secrets.token_hex(8)
            rule["id"] = rule_id
            rules_engine._rules_store[rule_id] = rule

        try:
            import yaml as yaml_lib
            config_str = json.dumps(config, indent=2) if format_type == "json" else yaml_lib.dump(config)
        except ImportError:
            config_str = json.dumps(config, indent=2)
        self.master.options.smart_rules_config = config_str
        self.write({"success": True, "rules_count": len(rules_engine.rules)})


class Scripts(RequestHandler):
    def get(self):
        scripts = getattr(self.master, "_scripts", {})
        self.write(list(scripts.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        script_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_scripts"):
            self.master._scripts = {}

        script_data = {
            "id": script_id,
            **data,
        }
        self.master._scripts[script_id] = script_data


        try:
            from BetterMITM.addons.web_script_executor import get_web_script_executor
            executor = get_web_script_executor()
            executor.register_script(script_id, script_data)
        except Exception as e:
            import logging
            logging.warning(f"Failed to register script with executor: {e}")

        self.write(self.master._scripts[script_id])


class ScriptHandler(RequestHandler):
    def put(self, script_id):
        if not hasattr(self.master, "_scripts"):
            raise APIError(404, "Script not found")

        data = tornado.escape.json_decode(self.request.body)
        if script_id not in self.master._scripts:
            raise APIError(404, "Script not found")

        self.master._scripts[script_id] = {
            **self.master._scripts[script_id],
            **data,
        }
        self.write(self.master._scripts[script_id])

    def delete(self, script_id):
        if not hasattr(self.master, "_scripts"):
            raise APIError(404, "Script not found")

        if script_id not in self.master._scripts:
            raise APIError(404, "Script not found")

        del self.master._scripts[script_id]


        try:
            from BetterMITM.addons.web_script_executor import get_web_script_executor
            executor = get_web_script_executor()
            executor.unregister_script(script_id)
        except Exception:
            pass

        self.write({"success": True})


class ScriptTest(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        language = data.get("language", "javascript")
        code = data.get("code", "")
        flow_id = data.get("flow_id")

        try:

            if flow_id:
                flow_obj = self.view.get_by_id(flow_id)
                if flow_obj:
                    try:
                        from BetterMITM.addons.web_script_executor import get_web_script_executor
                        executor = get_web_script_executor()
                        script_data = {
                            "language": language,
                            "code": code,
                            "enabled": True,
                            "trigger": "both",
                        }
                        result = executor.execute_script_on_flow("test_script", script_data, flow_obj, "both")
                        self.write(result)
                        return
                    except Exception as e:
                        logger.warning(f"Failed to use script executor: {e}")


            if language == "javascript":
                import subprocess
                result = subprocess.run(
                    ["node", "-e", code],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                self.write({"output": result.stdout, "error": result.stderr})
            else:

                exec_globals = {"__builtins__": __builtins__}
                exec_locals = {}
                exec(code, exec_globals, exec_locals)
                output = exec_locals.get("output", "Script executed successfully")
                self.write({"output": str(output)})
        except subprocess.TimeoutExpired:
            self.write({"error": "Script execution timeout"})
        except Exception as e:
            self.write({"error": str(e)})


class Transformers(RequestHandler):
    def get(self):
        transformers = getattr(self.master, "_transformers", {})
        self.write(list(transformers.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        transformer_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_transformers"):
            self.master._transformers = {}

        self.master._transformers[transformer_id] = {
            "id": transformer_id,
            **data,
        }
        self.write(self.master._transformers[transformer_id])


class TransformerHandler(RequestHandler):
    def put(self, transformer_id):
        if not hasattr(self.master, "_transformers"):
            raise APIError(404, "Transformer not found")

        data = tornado.escape.json_decode(self.request.body)
        if transformer_id not in self.master._transformers:
            raise APIError(404, "Transformer not found")

        self.master._transformers[transformer_id] = {
            **self.master._transformers[transformer_id],
            **data,
        }
        self.write(self.master._transformers[transformer_id])

    def delete(self, transformer_id):
        if not hasattr(self.master, "_transformers"):
            raise APIError(404, "Transformer not found")

        if transformer_id not in self.master._transformers:
            raise APIError(404, "Transformer not found")

        del self.master._transformers[transformer_id]
        self.write({"success": True})


class SecurityTest(RequestHandler):
    def post(self):
        import re
        data = tornado.escape.json_decode(self.request.body)
        flow_ids = data.get("flow_ids", [])
        tests = data.get("tests", [])
        test_ids = data.get("test_ids", [])
        timeout = data.get("timeout", 30)
        concurrent = data.get("concurrent", 5)
        stop_on_first = data.get("stop_on_first", False)


        test_definitions = {
            "sql_injection": {
                "name": "SQL Injection",
                "payloads": [
                    "' OR '1'='1", "'; DROP TABLE users--", "1' UNION SELECT NULL--", "' OR 1=1--",
                    "admin'--", "' UNION SELECT username, password FROM users--", "1' AND '1'='1",
                    "1' OR '1'='1'/*", "1' OR '1'='1'#", "1' UNION SELECT user(),database(),version()--",
                ],
                "severity": "high",
                "cwe": "CWE-89",
                "owasp": "A03:2021 – Injection",
            },
            "nosql_injection": {
                "name": "NoSQL Injection",
                "payloads": ["{$ne: null}", "{$gt: ''}", "{$where: 'this.username == this.password'}", "'; return true; var x='"],
                "severity": "high",
                "cwe": "CWE-943",
                "owasp": "A03:2021 – Injection",
            },
            "ldap_injection": {
                "name": "LDAP Injection",
                "payloads": ["*)(uid=*))(|(uid=*", "*))%00", "*()|&"],
                "severity": "high",
                "cwe": "CWE-90",
                "owasp": "A03:2021 – Injection",
            },
            "command_injection": {
                "name": "Command Injection",
                "payloads": ["; ls", "| ls", "& ls", "&& ls", "|| ls", "; cat /etc/passwd", "| cat /etc/passwd", "; whoami", "| whoami"],
                "severity": "high",
                "cwe": "CWE-78",
                "owasp": "A03:2021 – Injection",
            },
            "path_traversal": {
                "name": "Path Traversal",
                "payloads": ["../", "../../", "../../../", "../../../../", "..\\", "..\\..\\", "..%2F", "..%5C", "%2e%2e%2f", "....//"],
                "severity": "high",
                "cwe": "CWE-22",
                "owasp": "A01:2021 – Broken Access Control",
            },
            "xxe": {
                "name": "XML External Entity (XXE)",
                "payloads": [
                    '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
                    '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/xxe">]><foo>&xxe;</foo>',
                ],
                "severity": "high",
                "cwe": "CWE-611",
                "owasp": "A05:2021 – Security Misconfiguration",
            },
            "ssrf": {
                "name": "Server-Side Request Forgery (SSRF)",
                "payloads": ["http://127.0.0.1", "http://localhost", "http://0.0.0.0", "http://[::1]", "http://169.254.169.254", "file:///etc/passwd"],
                "severity": "high",
                "cwe": "CWE-918",
                "owasp": "A10:2021 – Server-Side Request Forgery",
            },
            "xss": {
                "name": "Cross-Site Scripting (XSS)",
                "payloads": [
                    "<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>", "javascript:alert('XSS')",
                    "<svg onload=alert('XSS')>", "<body onload=alert('XSS')>", "<iframe src=javascript:alert('XSS')>",
                ],
                "severity": "high",
                "cwe": "CWE-79",
                "owasp": "A03:2021 – Injection",
            },
            "csrf": {
                "name": "CSRF Protection",
                "payloads": [],
                "severity": "medium",
                "cwe": "CWE-352",
                "owasp": "A01:2021 – Broken Access Control",
            },
            "auth_bypass": {
                "name": "Authentication Bypass",
                "payloads": ["admin", "admin'--", "' OR '1'='1", "../admin", "admin' OR '1'='1'--", "' OR 1=1--"],
                "severity": "high",
                "cwe": "CWE-287",
                "owasp": "A07:2021 – Identification and Authentication Failures",
            },
            "idor": {
                "name": "Insecure Direct Object Reference (IDOR)",
                "payloads": ["../1", "../2", "../3", "../admin", "?id=1", "?id=2", "?user_id=1"],
                "severity": "medium",
                "cwe": "CWE-639",
                "owasp": "A01:2021 – Broken Access Control",
            },
            "header_security": {
                "name": "Header Security Analysis",
                "payloads": [],
                "severity": "medium",
                "cwe": "CWE-693",
                "owasp": "A05:2021 – Security Misconfiguration",
            },
            "ssl_tls": {
                "name": "SSL/TLS Configuration",
                "payloads": [],
                "severity": "medium",
                "cwe": "CWE-295",
                "owasp": "A02:2021 – Cryptographic Failures",
            },
            "weak_crypto": {
                "name": "Weak Cryptography",
                "payloads": [],
                "severity": "high",
                "cwe": "CWE-327",
                "owasp": "A02:2021 – Cryptographic Failures",
            },
        }

        all_results = []


        if tests:

            test_configs = {test["id"]: test for test in tests}
        else:

            test_configs = {tid: test_definitions.get(tid, {"name": tid, "payloads": [], "severity": "medium"}) for tid in test_ids}

        for flow_id in flow_ids:
            flow = self.view.get_by_id(flow_id)
            if not flow or flow.type != "http":
                continue

            flow_results = []

            for test_id, test_config in test_configs.items():
                if stop_on_first and any(r.get("vulnerable") for r in flow_results):
                    break

                test_def = test_definitions.get(test_id, test_config)
                test_name = test_def.get("name", test_config.get("name", test_id))
                payloads = test_config.get("payloads", test_def.get("payloads", []))

                result = self._run_security_test(flow, test_id, test_name, payloads, test_def)
                if result:
                    flow_results.append(result)
                    if stop_on_first and result.get("vulnerable"):
                        break

            all_results.extend(flow_results)

        self.write({"tests": all_results})

    def _run_security_test(self, flow, test_id, test_name, payloads, test_def):
        """Run a specific security test on a flow."""
        import re

        result = {
            "test_id": test_id,
            "test_name": test_name,
            "flow_id": flow.id,
            "vulnerable": False,
            "severity": test_def.get("severity", "medium"),
            "description": f"No vulnerabilities detected for {test_name}",
            "details": [],
            "found_payloads": [],
            "recommendations": [],
            "cwe": test_def.get("cwe"),
            "owasp": test_def.get("owasp"),
        }

        if not flow.request:
            return result

        request_text = flow.request.content.decode("utf-8", errors="ignore") if flow.request.content else ""
        request_headers = dict(flow.request.headers) if flow.request.headers else {}
        request_url = flow.request.pretty_url or ""
        response_text = flow.response.content.decode("utf-8", errors="ignore") if flow.response and flow.response.content else ""
        response_headers = dict(flow.response.headers) if flow.response and flow.response.headers else {}


        for payload in payloads:

            if payload in request_text:
                result["vulnerable"] = True
                result["found_payloads"].append(payload)
                result["details"].append(f"Payload found in request body: {payload}")


            for key, value in request_headers.items():
                if payload in str(value):
                    result["vulnerable"] = True
                    result["found_payloads"].append(payload)
                    result["details"].append(f"Payload found in request header {key}: {payload}")


            if payload in request_url:
                result["vulnerable"] = True
                result["found_payloads"].append(payload)
                result["details"].append(f"Payload found in URL: {payload}")


            if payload in response_text:
                result["vulnerable"] = True
                result["found_payloads"].append(payload)
                result["details"].append(f"Payload reflected in response: {payload}")


        if test_id == "csrf":
            has_csrf_token = any("csrf" in k.lower() or "xsrf" in k.lower() for k in request_headers.keys())
            if not has_csrf_token and flow.request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                result["vulnerable"] = True
                result["details"].append("CSRF token missing in request headers")

        if test_id == "header_security":
            security_headers = [
                "Content-Security-Policy",
                "X-Frame-Options",
                "X-Content-Type-Options",
                "Strict-Transport-Security",
                "X-XSS-Protection",
            ]
            missing_headers = []
            for header in security_headers:
                if not any(k.lower() == header.lower() for k in response_headers.keys()):
                    missing_headers.append(header)
            if missing_headers:
                result["vulnerable"] = True
                result["details"].append(f"Missing security headers: {', '.join(missing_headers)}")

        if test_id == "ssl_tls":
            if flow.request.scheme == "http" and "localhost" not in flow.request.host.lower():
                result["vulnerable"] = True
                result["details"].append("HTTP connection detected (should use HTTPS)")

        if test_id == "weak_crypto":

            weak_hash_patterns = ["md5", "sha1", "des", "rc4"]
            response_lower = response_text.lower()
            for pattern in weak_hash_patterns:
                if pattern in response_lower:
                    result["vulnerable"] = True
                    result["details"].append(f"Potential weak cryptography detected: {pattern}")

        if result["vulnerable"]:
            result["description"] = f"Vulnerability detected: {'; '.join(result['details'])}"
            result["recommendations"] = self._get_recommendations(test_id)
        else:
            result["description"] = f"No vulnerabilities detected for {test_name}"

        return result

    def _get_recommendations(self, test_id):
        """Get security recommendations for a test."""
        recommendations_map = {
            "sql_injection": [
                "Use parameterized queries or prepared statements",
                "Implement input validation and sanitization",
                "Use an ORM framework",
                "Apply the principle of least privilege to database accounts",
            ],
            "nosql_injection": [
                "Use parameterized queries for NoSQL databases",
                "Validate and sanitize all user input",
                "Use type-safe query builders",
            ],
            "xss": [
                "Implement Content Security Policy (CSP)",
                "Encode all user input before rendering",
                "Use framework's built-in XSS protection",
            ],
            "command_injection": [
                "Avoid executing system commands with user input",
                "Use safe APIs instead of system commands",
                "Validate and sanitize all user input",
            ],
            "path_traversal": [
                "Validate and sanitize file paths",
                "Use whitelist-based path validation",
                "Store files outside the web root",
            ],
            "xxe": [
                "Disable XML external entity processing",
                "Use simpler data formats like JSON",
                "Validate and sanitize XML input",
            ],
            "ssrf": [
                "Validate and sanitize all URLs",
                "Use whitelist-based URL validation",
                "Block access to internal IP ranges",
            ],
            "csrf": [
                "Implement CSRF tokens",
                "Use SameSite cookie attribute",
                "Verify the Origin header",
            ],
            "auth_bypass": [
                "Implement strong authentication mechanisms",
                "Use multi-factor authentication",
                "Implement account lockout policies",
            ],
            "idor": [
                "Implement proper access controls",
                "Use indirect object references",
                "Validate user permissions for each request",
            ],
            "header_security": [
                "Implement Content-Security-Policy header",
                "Set X-Frame-Options to DENY or SAMEORIGIN",
                "Set X-Content-Type-Options to nosniff",
            ],
            "ssl_tls": [
                "Use HTTPS for all connections",
                "Disable weak cipher suites",
                "Use TLS 1.2 or higher",
            ],
            "weak_crypto": [
                "Use strong cryptographic algorithms (SHA-256, AES-256)",
                "Avoid deprecated algorithms (MD5, SHA1, DES)",
                "Use proper key management",
            ],
        }
        return recommendations_map.get(test_id, ["Review security best practices", "Implement proper input validation"])


class Certificates(RequestHandler):
    def get(self):
        certs = []
        if hasattr(self.master, "server"):
            certs.append({
                "subject": "BetterMITM CA",
                "issuer": "BetterMITM",
                "not_after": None,
            })
        self.write(certs)


class CertificateImport(RequestHandler):
    def post(self):
        if "cert" not in self.request.files:
            raise APIError(400, "No certificate file provided")

        cert_file = self.request.files["cert"][0]
        cert_data = cert_file["body"]

        try:
            from BetterMITM import certs as certs_module
            cert = certs_module.Cert.from_pem(cert_data)
            self.write({
                "success": True,
                "subject": cert.subject,
                "issuer": cert.issuer,
            })
        except Exception as e:
            raise APIError(400, f"Failed to import certificate: {str(e)}")


class WebSocketMessageHandler(RequestHandler):
    def put(self, flow_id, message_index):
        data = tornado.escape.json_decode(self.request.body)
        content = data.get("content", "")

        if self.flow.type != "http" or not self.flow.websocket:
            raise APIError(400, "Flow does not have WebSocket messages")

        index = int(message_index)
        if index >= len(self.flow.websocket.messages):
            raise APIError(404, "Message index out of range")

        self.flow.websocket.messages[index].content = content.encode()
        self.view.update([self.flow])
        self.write({"success": True})


class WebSocketInject(RequestHandler):
    def post(self, flow_id):
        data = tornado.escape.json_decode(self.request.body)
        content = data.get("content", "")
        direction = data.get("direction", "client")

        if self.flow.type != "http" or not self.flow.websocket:
            raise APIError(400, "Flow does not have WebSocket connection")

        from BetterMITM.websocket import WebSocketMessage
        msg = WebSocketMessage(direction == "client", content.encode())
        self.flow.websocket.messages.append(msg)
        self.view.update([self.flow])
        self.write({"success": True})


class ProtobufImport(RequestHandler):
    def post(self):
        if "proto" not in self.request.files:
            raise APIError(400, "No .proto file provided")

        proto_file = self.request.files["proto"][0]
        proto_data = proto_file["body"].decode("utf-8")

        try:
            import google.protobuf.text_format
            from google.protobuf import descriptor_pb2

            file_descriptor = descriptor_pb2.FileDescriptorProto()
            google.protobuf.text_format.Parse(proto_data, file_descriptor)

            fields = []
            for message_type in file_descriptor.message_type:
                for field in message_type.field:
                    fields.append({
                        "name": field.name,
                        "type": field.type,
                        "number": field.number,
                    })

            self.write({"success": True, "fields": fields})
        except Exception as e:
            raise APIError(400, f"Failed to parse .proto file: {str(e)}")


class ProtobufDecode(RequestHandler):
    def post(self, flow_id):
        if self.flow.type != "http":
            raise APIError(400, "Flow is not HTTP")

        try:
            import google.protobuf.message
            from google.protobuf import json_format

            content = self.flow.request.content or self.flow.response.content if self.flow.response else b""
            if not content:
                raise APIError(400, "No content to decode")

            self.write({"success": True, "fields": []})
        except Exception as e:
            raise APIError(400, f"Failed to decode protobuf: {str(e)}")


class ProtobufFieldUpdate(RequestHandler):
    def put(self, flow_id, field_index):
        data = tornado.escape.json_decode(self.request.body)
        value = data.get("value")

        self.write({"success": True})


class Shortcuts(RequestHandler):
    def get(self):
        shortcuts = getattr(self.master, "_shortcuts", {})
        self.write(list(shortcuts.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        shortcut_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_shortcuts"):
            self.master._shortcuts = {}

        self.master._shortcuts[shortcut_id] = {
            "id": shortcut_id,
            **data,
        }
        self.write(self.master._shortcuts[shortcut_id])


class Macros(RequestHandler):
    def get(self):
        macros = getattr(self.master, "_macros", {})
        self.write(list(macros.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        macro_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_macros"):
            self.master._macros = {}

        self.master._macros[macro_id] = {
            "id": macro_id,
            **data,
        }
        self.write(self.master._macros[macro_id])


class MacroPlay(RequestHandler):
    def post(self, macro_id):
        if not hasattr(self.master, "_macros") or macro_id not in self.master._macros:
            raise APIError(404, "Macro not found")

        macro = self.master._macros[macro_id]
        for action in macro.get("actions", []):
            try:
                self.master.commands.call(action)
            except Exception as e:
                logger.warning(f"Failed to execute macro action {action}: {e}")

        self.write({"success": True})


class TestCases(RequestHandler):
    def get(self):
        test_cases = getattr(self.master, "_test_cases", {})
        self.write(list(test_cases.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        test_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_test_cases"):
            self.master._test_cases = {}

        self.master._test_cases[test_id] = {
            "id": test_id,
            **data,
        }
        self.write(self.master._test_cases[test_id])


class TestSuites(RequestHandler):
    def get(self):
        test_suites = getattr(self.master, "_test_suites", {})
        self.write(list(test_suites.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        suite_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_test_suites"):
            self.master._test_suites = {}

        self.master._test_suites[suite_id] = {
            "id": suite_id,
            **data,
        }
        self.write(self.master._test_suites[suite_id])


class TestRun(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        test_case_ids = data.get("test_case_ids", [])

        if not hasattr(self.master, "_test_cases"):
            self.master._test_cases = {}

        results = []
        for test_id in test_case_ids:
            test_case = self.master._test_cases.get(test_id)
            if not test_case:
                continue

            flow = self.view.get_by_id(test_case.get("flow_id"))
            if not flow:
                results.append({
                    "test_name": test_case.get("name", "Unknown"),
                    "passed": False,
                    "message": "Flow not found",
                })
                continue

            test_passed = True
            assertion_results = []

            for assertion in test_case.get("assertions", []):
                assertion_type = assertion.get("type")
                expected = assertion.get("expected")
                passed = False
                message = ""

                if assertion_type == "status_code" and flow.type == "http" and flow.response:
                    passed = flow.response.status_code == int(expected)
                    message = f"Expected {expected}, got {flow.response.status_code}"
                elif assertion_type == "body_contains" and flow.type == "http":
                    content = (flow.response.content if flow.response else flow.request.content or b"").decode("utf-8", errors="ignore")
                    passed = expected in content
                    message = f"Body contains check: {passed}"
                else:
                    passed = False
                    message = "Assertion type not supported"

                assertion_results.append({
                    "type": assertion_type,
                    "passed": passed,
                    "message": message,
                })
                if not passed:
                    test_passed = False

            results.append({
                "test_name": test_case.get("name", "Unknown"),
                "passed": test_passed,
                "assertions": assertion_results,
            })

        self.write({"results": results})


class Templates(RequestHandler):
    def get(self):
        templates = getattr(self.master, "_templates", {})
        self.write(list(templates.values()))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        template_id = data.get("id") or secrets.token_hex(8)

        if not hasattr(self.master, "_templates"):
            self.master._templates = {}

        self.master._templates[template_id] = {
            "id": template_id,
            **data,
        }
        self.write(self.master._templates[template_id])


class TemplateApply(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        template_id = data.get("template_id")
        variables = data.get("variables", {})

        if not hasattr(self.master, "_templates") or template_id not in self.master._templates:
            raise APIError(404, "Template not found")

        template = self.master._templates[template_id]
        flow_data = template.get("flow_data", {})

        import copy
        new_flow = copy.deepcopy(flow_data)
        new_flow["id"] = secrets.token_hex(16)

        self.view.add([new_flow])
        self.write({"success": True, "flow_id": new_flow["id"]})


class MockResponseGenerate(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        pattern = data.get("pattern", "")

        generated = {
            "pattern": pattern,
            "status_code": 200,
            "body": json.dumps({"message": "Auto-generated response", "pattern": pattern}),
            "body_type": "json",
        }

        self.write(generated)


class PerformanceMetrics(RequestHandler):
    def get(self):
        try:
            import psutil
            import os

            process = psutil.Process(os.getpid())
            cpu_percent = process.cpu_percent(interval=0.1)
            memory_info = process.memory_info()
        except ImportError:
            cpu_percent = 0.0
            memory_info = type("obj", (object,), {"rss": 0})()

        if not hasattr(self.master, "_performance_metrics"):
            self.master._performance_metrics = {
                "cpu_usage": [],
                "memory_usage": [],
                "slow_operations": [],
                "timestamp": [],
            }

        metrics = self.master._performance_metrics
        now = int(time.time())

        metrics["cpu_usage"].append(cpu_percent)
        metrics["memory_usage"].append(memory_info.rss / 1024 / 1024 if hasattr(memory_info, "rss") else 0)
        metrics["timestamp"].append(now)

        if len(metrics["cpu_usage"]) > 100:
            metrics["cpu_usage"] = metrics["cpu_usage"][-100:]
            metrics["memory_usage"] = metrics["memory_usage"][-100:]
            metrics["timestamp"] = metrics["timestamp"][-100:]

        self.write(metrics)


class PerformanceStart(RequestHandler):
    def post(self):
        if not hasattr(self.master, "_performance_metrics"):
            self.master._performance_metrics = {
                "cpu_usage": [],
                "memory_usage": [],
                "slow_operations": [],
                "timestamp": [],
            }
        self.write({"success": True})


class PerformanceStop(RequestHandler):
    def post(self):
        self.write({"success": True})


class ExportFlows(RequestHandler):
    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        format_type = data.get("format", "postman")
        flow_ids = data.get("flow_ids", [])

        flows_to_export = [f for f in self.view if f.id in flow_ids]

        if format_type == "postman":
            collection = {
                "info": {
                    "name": "BetterMITM Export",
                    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                },
                "item": [],
            }
            for flow in flows_to_export:
                if flow.type == "http":
                    item = {
                        "name": flow.request.path,
                        "request": {
                            "method": flow.request.method,
                            "header": [{"key": k, "value": v} for k, v in flow.request.headers.items()],
                            "url": {
                                "raw": flow.request.pretty_url,
                                "host": [flow.request.pretty_host],
                                "path": flow.request.path.split("/"),
                            },
                        },
                    }
                    if flow.request.content:
                        item["request"]["body"] = {"mode": "raw", "raw": flow.request.content}
                    collection["item"].append(item)
            self.set_header("Content-Type", "application/json")
            self.write(json.dumps(collection, indent=2))
        elif format_type == "har":
            har = {
                "log": {
                    "version": "1.2",
                    "creator": {"name": "BetterMITM", "version": "1.0"},
                    "entries": [],
                }
            }
            for flow in flows_to_export:
                if flow.type == "http":
                    entry = {
                        "request": {
                            "method": flow.request.method,
                            "url": flow.request.pretty_url,
                            "headers": [{"name": k, "value": v} for k, v in flow.request.headers.items()],
                            "bodySize": len(flow.request.content or ""),
                        },
                        "response": {},
                        "time": 0,
                    }
                    if flow.response:
                        entry["response"] = {
                            "status": flow.response.status_code,
                            "statusText": flow.response.reason,
                            "headers": [{"name": k, "value": v} for k, v in flow.response.headers.items()],
                            "bodySize": len(flow.response.content or ""),
                        }
                    har["log"]["entries"].append(entry)
            self.set_header("Content-Type", "application/json")
            self.write(json.dumps(har, indent=2))
        elif format_type == "curl":
            curl_commands = []
            for flow in flows_to_export:
                if flow.type == "http":
                    cmd = f"curl -X {flow.request.method} '{flow.request.pretty_url}'"
                    for k, v in flow.request.headers.items():
                        cmd += f" -H '{k}: {v}'"
                    if flow.request.content:
                        cmd += f" -d '{flow.request.content}'"
                    curl_commands.append(cmd)
            self.set_header("Content-Type", "text/plain")
            self.write("\n".join(curl_commands))
        else:
            raise APIError(400, f"Unsupported format: {format_type}")


class AnalyticsStats(RequestHandler):
    def get(self):
        flows = self.view
        stats = {
            "total_flows": len(flows),
            "http_flows": sum(1 for f in flows if f.type == "http"),
            "tcp_flows": sum(1 for f in flows if f.type == "tcp"),
            "udp_flows": sum(1 for f in flows if f.type == "udp"),
        }
        self.write(stats)


class GZipContentAndFlowFiles(tornado.web.GZipContentEncoding):
    CONTENT_TYPES = {
        "application/octet-stream",
        *tornado.web.GZipContentEncoding.CONTENT_TYPES,
    }


handlers = [
    (r"/", IndexHandler),
    (r"/filter-help(?:\.json)?", FilterHelp),
    (r"/updates", ClientConnection),
    (r"/commands(?:\.json)?", Commands),
    (r"/commands/(?P<cmd>[a-z.]+)", ExecuteCommand),
    (r"/events(?:\.json)?", Events),
    (r"/flows(?:\.json)?", Flows),
    (r"/flows/dump", DumpFlows),
    (r"/flows/resume", ResumeFlows),
    (r"/flows/kill", KillFlows),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)", FlowHandler),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/resume", ResumeFlow),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/kill", KillFlow),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/duplicate", DuplicateFlow),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/replay", ReplayFlow),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/replay-modified", ReplayFlowModified),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/revert", RevertFlow),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/(?P<message>request|response|messages)/content.data", FlowContent),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/(?P<message>request|response|messages)/content/(?P<content_view>[0-9a-zA-Z\-\_%]+)(?:\.json)?", FlowContentView),
    (r"/clear", ClearAll),
    (r"/options(?:\.json)?", Options),
    (r"/options/save", SaveOptions),
    (r"/state(?:\.json)?", State),
    (r"/processes", ProcessList),
    (r"/executable-icon", ProcessImage),
    (r"/protobuf-file", ProtobufFileUpload),
    (r"/advanced-intercept-rules", AdvancedInterceptRules),
    (r"/advanced-intercept-rules/paused-connections", PausedConnectionsHandler),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/state", FlowStateControl),
    (r"/request-builder/send", RequestBuilderSend),
    (r"/mock-responses", MockResponses),
    (r"/mock-responses/(?P<response_id>[0-9a-f]+)", MockResponseHandler),
    (r"/analytics/stats", AnalyticsStats),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/bookmark", FlowBookmark),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/tags", FlowTags),
    (r"/export/flows", ExportFlows),
    (r"/smart-rules", SmartRules),
    (r"/smart-rules/(?P<rule_id>[0-9a-f]+)", SmartRuleHandler),
    (r"/smart-rules/config", SmartRulesConfig),
    (r"/scripts", Scripts),
    (r"/scripts/(?P<script_id>[0-9a-f]+)", ScriptHandler),
    (r"/scripts/test", ScriptTest),
    (r"/transformers", Transformers),
    (r"/transformers/(?P<transformer_id>[0-9a-f]+)", TransformerHandler),
    (r"/security/test", SecurityTest),
    (r"/certificates", Certificates),
    (r"/certificates/import", CertificateImport),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/websocket/(?P<message_index>\d+)", WebSocketMessageHandler),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/websocket/inject", WebSocketInject),
    (r"/protobuf/import", ProtobufImport),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/protobuf/decode", ProtobufDecode),
    (r"/flows/(?P<flow_id>[0-9a-f\-]+)/protobuf/field/(?P<field_index>\d+)", ProtobufFieldUpdate),
    (r"/shortcuts", Shortcuts),
    (r"/macros", Macros),
    (r"/macros/(?P<macro_id>[0-9a-f]+)/play", MacroPlay),
    (r"/testing/test-cases", TestCases),
    (r"/testing/test-suites", TestSuites),
    (r"/testing/run", TestRun),
    (r"/templates", Templates),
    (r"/templates/apply", TemplateApply),
    (r"/mock-responses/generate", MockResponseGenerate),
    (r"/performance/metrics", PerformanceMetrics),
    (r"/performance/start", PerformanceStart),
    (r"/performance/stop", PerformanceStop),
]


class Application(tornado.web.Application):
    master: BetterMITM.tools.web.master.WebMaster

    def __init__(
        self, master: BetterMITM.tools.web.master.WebMaster, debug: bool
    ) -> None:
        self.master = master
        auth_addon: WebAuth = master.addons.get("webauth")
        super().__init__(
            handlers=handlers,
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=True,
            xsrf_cookie_kwargs=dict(samesite="Strict"),
            cookie_secret=secrets.token_bytes(32),
            debug=debug,
            autoreload=False,
            transforms=[GZipContentAndFlowFiles],
            is_valid_password=auth_addon.is_valid_password,
            auth_cookie_name=auth_addon.auth_cookie_name,
            compiled_template_cache=False,
        )
