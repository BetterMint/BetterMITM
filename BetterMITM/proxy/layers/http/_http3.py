import time
from abc import abstractmethod
from typing import assert_never

from aioquic.h3.connection import ErrorCode as H3ErrorCode
from aioquic.h3.connection import FrameUnexpected as H3FrameUnexpected
from aioquic.h3.events import DataReceived
from aioquic.h3.events import HeadersReceived
from aioquic.h3.events import PushPromiseReceived

from . import ErrorCode
from . import RequestData
from . import RequestEndOfMessage
from . import RequestHeaders
from . import RequestProtocolError
from . import RequestTrailers
from . import ResponseData
from . import ResponseEndOfMessage
from . import ResponseHeaders
from . import ResponseProtocolError
from . import ResponseTrailers
from ._base import format_error
from ._base import HttpConnection
from ._base import HttpEvent
from ._base import ReceiveHttp
from ._http2 import format_h2_request_headers
from ._http2 import format_h2_response_headers
from ._http2 import parse_h2_request_headers
from ._http2 import parse_h2_response_headers
from ._http_h3 import LayeredH3Connection
from ._http_h3 import StreamClosed
from ._http_h3 import TrailersReceived
from BetterMITM import connection
from BetterMITM import http
from BetterMITM import version
from BetterMITM.proxy import commands
from BetterMITM.proxy import context
from BetterMITM.proxy import events
from BetterMITM.proxy import layer
from BetterMITM.proxy.layers.quic import error_code_to_str
from BetterMITM.proxy.layers.quic import QuicConnectionClosed
from BetterMITM.proxy.layers.quic import QuicStreamEvent
from BetterMITM.proxy.utils import expect


class Http3Connection(HttpConnection):
    h3_conn: LayeredH3Connection

    ReceiveData: type[RequestData | ResponseData]
    ReceiveEndOfMessage: type[RequestEndOfMessage | ResponseEndOfMessage]
    ReceiveProtocolError: type[RequestProtocolError | ResponseProtocolError]
    ReceiveTrailers: type[RequestTrailers | ResponseTrailers]

    def __init__(self, context: context.Context, conn: connection.Connection):
        super().__init__(context, conn)
        self.h3_conn = LayeredH3Connection(
            self.conn, is_client=self.conn is self.context.server
        )

    def _handle_event(self, event: events.Event) -> layer.CommandGenerator[None]:
        if isinstance(event, events.Start):
            yield from self.h3_conn.transmit()


        elif isinstance(event, HttpEvent):
            try:
                if isinstance(event, (RequestData, ResponseData)):
                    self.h3_conn.send_data(event.stream_id, event.data)
                elif isinstance(event, (RequestHeaders, ResponseHeaders)):
                    headers = yield from (
                        format_h2_request_headers(self.context, event)
                        if isinstance(event, RequestHeaders)
                        else format_h2_response_headers(self.context, event)
                    )
                    self.h3_conn.send_headers(
                        event.stream_id, headers, end_stream=event.end_stream
                    )
                elif isinstance(event, (RequestTrailers, ResponseTrailers)):
                    self.h3_conn.send_trailers(
                        event.stream_id, [*event.trailers.fields]
                    )
                elif isinstance(event, (RequestEndOfMessage, ResponseEndOfMessage)):
                    self.h3_conn.end_stream(event.stream_id)
                elif isinstance(event, (RequestProtocolError, ResponseProtocolError)):
                    status = event.code.http_status_code()
                    if (
                        isinstance(event, ResponseProtocolError)
                        and not self.h3_conn.has_sent_headers(event.stream_id)
                        and status is not None
                    ):
                        self.h3_conn.send_headers(
                            event.stream_id,
                            [
                                (b":status", b"%d" % status),
                                (b"server", version.BetterMITM.encode()),
                                (b"content-type", b"text/html"),
                            ],
                        )
                        self.h3_conn.send_data(
                            event.stream_id,
                            format_error(status, event.message),
                            end_stream=True,
                        )
                    else:
                        match event.code:
                            case ErrorCode.CANCEL | ErrorCode.CLIENT_DISCONNECTED:
                                error_code = H3ErrorCode.H3_REQUEST_CANCELLED
                            case ErrorCode.KILL:
                                error_code = H3ErrorCode.H3_INTERNAL_ERROR
                            case ErrorCode.HTTP_1_1_REQUIRED:
                                error_code = H3ErrorCode.H3_VERSION_FALLBACK
                            case ErrorCode.PASSTHROUGH_CLOSE:

                                error_code = H3ErrorCode.H3_REQUEST_CANCELLED
                            case (
                                ErrorCode.GENERIC_CLIENT_ERROR
                                | ErrorCode.GENERIC_SERVER_ERROR
                                | ErrorCode.REQUEST_TOO_LARGE
                                | ErrorCode.RESPONSE_TOO_LARGE
                                | ErrorCode.CONNECT_FAILED
                                | ErrorCode.DESTINATION_UNKNOWN
                                | ErrorCode.REQUEST_VALIDATION_FAILED
                                | ErrorCode.RESPONSE_VALIDATION_FAILED
                            ):
                                error_code = H3ErrorCode.H3_INTERNAL_ERROR
                            case other:
                                assert_never(other)
                        self.h3_conn.close_stream(event.stream_id, error_code.value)
                else:
                    raise AssertionError(f"Unexpected event: {event!r}")

            except H3FrameUnexpected as e:

                yield commands.Log(f"Received {event!r} unexpectedly: {e}")

            else:

                yield from self.h3_conn.transmit()


        elif isinstance(event, QuicStreamEvent):
            h3_events = self.h3_conn.handle_stream_event(event)
            for h3_event in h3_events:
                if isinstance(h3_event, StreamClosed):
                    err_str = error_code_to_str(h3_event.error_code)
                    match h3_event.error_code:
                        case H3ErrorCode.H3_REQUEST_CANCELLED:
                            err_code = ErrorCode.CANCEL
                        case H3ErrorCode.H3_VERSION_FALLBACK:
                            err_code = ErrorCode.HTTP_1_1_REQUIRED
                        case _:
                            err_code = self.ReceiveProtocolError.code
                    yield ReceiveHttp(
                        self.ReceiveProtocolError(
                            h3_event.stream_id,
                            f"stream closed by client ({err_str})",
                            code=err_code,
                        )
                    )
                elif isinstance(h3_event, DataReceived):
                    if h3_event.data:
                        yield ReceiveHttp(
                            self.ReceiveData(h3_event.stream_id, h3_event.data)
                        )
                    if h3_event.stream_ended:
                        yield ReceiveHttp(self.ReceiveEndOfMessage(h3_event.stream_id))
                elif isinstance(h3_event, HeadersReceived):
                    try:
                        receive_event = self.parse_headers(h3_event)
                    except ValueError as e:
                        self.h3_conn.close_connection(
                            error_code=H3ErrorCode.H3_GENERAL_PROTOCOL_ERROR,
                            reason_phrase=f"Invalid HTTP/3 request headers: {e}",
                        )
                    else:
                        yield ReceiveHttp(receive_event)
                        if h3_event.stream_ended:
                            yield ReceiveHttp(
                                self.ReceiveEndOfMessage(h3_event.stream_id)
                            )
                elif isinstance(h3_event, TrailersReceived):
                    yield ReceiveHttp(
                        self.ReceiveTrailers(
                            h3_event.stream_id, http.Headers(h3_event.trailers)
                        )
                    )
                    if h3_event.stream_ended:
                        yield ReceiveHttp(self.ReceiveEndOfMessage(h3_event.stream_id))
                elif isinstance(h3_event, PushPromiseReceived):
                    self.h3_conn.close_connection(
                        error_code=H3ErrorCode.H3_GENERAL_PROTOCOL_ERROR,
                        reason_phrase=f"Received HTTP/3 push promise, even though we signalled no support.",
                    )
                else:
                    raise AssertionError(f"Unexpected event: {event!r}")
            yield from self.h3_conn.transmit()


        elif isinstance(event, QuicConnectionClosed):
            self._handle_event = self.done
            self.h3_conn.handle_connection_closed(event)
            msg = event.reason_phrase or error_code_to_str(event.error_code)
            for stream_id in self.h3_conn.get_open_stream_ids():
                yield ReceiveHttp(
                    self.ReceiveProtocolError(
                        stream_id, msg, self.ReceiveProtocolError.code
                    )
                )

        else:
            raise AssertionError(f"Unexpected event: {event!r}")

    @expect(HttpEvent, QuicStreamEvent, QuicConnectionClosed)
    def done(self, _) -> layer.CommandGenerator[None]:
        yield from ()

    @abstractmethod
    def parse_headers(self, event: HeadersReceived) -> RequestHeaders | ResponseHeaders:
        pass


class Http3Server(Http3Connection):
    ReceiveData = RequestData
    ReceiveEndOfMessage = RequestEndOfMessage
    ReceiveProtocolError = RequestProtocolError
    ReceiveTrailers = RequestTrailers

    def __init__(self, context: context.Context):
        super().__init__(context, context.client)

    def parse_headers(self, event: HeadersReceived) -> RequestHeaders | ResponseHeaders:

        (
            host,
            port,
            method,
            scheme,
            authority,
            path,
            headers,
        ) = parse_h2_request_headers(event.headers)
        request = http.Request(
            host=host,
            port=port,
            method=method,
            scheme=scheme,
            authority=authority,
            path=path,
            http_version=b"HTTP/3",
            headers=headers,
            content=None,
            trailers=None,
            timestamp_start=time.time(),
            timestamp_end=None,
        )
        return RequestHeaders(event.stream_id, request, end_stream=event.stream_ended)


class Http3Client(Http3Connection):
    ReceiveData = ResponseData
    ReceiveEndOfMessage = ResponseEndOfMessage
    ReceiveProtocolError = ResponseProtocolError
    ReceiveTrailers = ResponseTrailers

    our_stream_id: dict[int, int]
    their_stream_id: dict[int, int]

    def __init__(self, context: context.Context):
        super().__init__(context, context.server)
        self.our_stream_id = {}
        self.their_stream_id = {}

    def _handle_event(self, event: events.Event) -> layer.CommandGenerator[None]:



        if isinstance(event, HttpEvent):
            ours = self.our_stream_id.get(event.stream_id, None)
            if ours is None:
                ours = self.h3_conn.get_next_available_stream_id()
                self.our_stream_id[event.stream_id] = ours
                self.their_stream_id[ours] = event.stream_id
            event.stream_id = ours

        for cmd in super()._handle_event(event):
            if isinstance(cmd, ReceiveHttp):
                cmd.event.stream_id = self.their_stream_id[cmd.event.stream_id]
            yield cmd

    def parse_headers(self, event: HeadersReceived) -> RequestHeaders | ResponseHeaders:

        status_code, headers = parse_h2_response_headers(event.headers)
        response = http.Response(
            http_version=b"HTTP/3",
            status_code=status_code,
            reason=b"",
            headers=headers,
            content=None,
            trailers=None,
            timestamp_start=time.time(),
            timestamp_end=None,
        )
        return ResponseHeaders(event.stream_id, response, event.stream_ended)


__all__ = [
    "Http3Client",
    "Http3Server",
]
