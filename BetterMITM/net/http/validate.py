import logging
import re
import typing

from BetterMITM.http import Message
from BetterMITM.http import Request
from BetterMITM.http import Response

logger = logging.getLogger(__name__)



_valid_header_name = re.compile(rb"^[!#$%&'*+\-.^_`|~0-9a-zA-Z]+$")

_valid_content_length = re.compile(rb"^(?:0|[1-9][0-9]*)$")
_valid_content_length_str = re.compile(r"^(?:0|[1-9][0-9]*)$")









TransferEncoding = typing.Literal[
    "chunked",
    "compress,chunked",
    "deflate,chunked",
    "gzip,chunked",
    "compress",
    "deflate",
    "gzip",
    "identity",
]
_HTTP_1_1_TRANSFER_ENCODINGS = frozenset(typing.get_args(TransferEncoding))


def parse_content_length(value: str | bytes) -> int:
    """Parse a content-length header value, or raise a ValueError if it is invalid."""
    if isinstance(value, str):
        valid = bool(_valid_content_length_str.match(value))
    else:
        valid = bool(_valid_content_length.match(value))
    if not valid:
        raise ValueError(f"invalid content-length header: {value!r}")
    return int(value)


def parse_transfer_encoding(value: str | bytes) -> TransferEncoding:
    """Parse a transfer-encoding header value, or raise a ValueError if it is invalid or unknown."""

    if not value.isascii():
        raise ValueError(f"invalid transfer-encoding header: {value!r}")
    if isinstance(value, str):
        te = value
    else:
        te = value.decode()
    te = te.lower()
    te = re.sub(r"[\t ]*,[\t ]*", ",", te)
    if te not in _HTTP_1_1_TRANSFER_ENCODINGS:
        raise ValueError(f"unknown transfer-encoding header: {value!r}")
    return typing.cast(TransferEncoding, te)


def validate_headers(message: Message) -> None:
    """
    Validate HTTP message headers to avoid request smuggling attacks.

    Raises a ValueError if they are malformed.
    """

    te = []
    cl = []

    for name, value in message.headers.fields:
        if not _valid_header_name.match(name):
            raise ValueError(f"invalid header name: {name!r}")
        match name.lower():
            case b"transfer-encoding":
                te.append(value)
            case b"content-length":
                cl.append(value)

    if te and cl:





        raise ValueError(
            "message with both transfer-encoding and content-length headers"
        )
    elif te:
        if len(te) > 1:
            raise ValueError(f"multiple transfer-encoding headers: {te!r}")









        if not message.is_http11:
            raise ValueError(
                f"unexpected HTTP transfer-encoding {te[0]!r} for {message.http_version}"
            )


        if isinstance(message, Response) and (
            100 <= message.status_code <= 199 or message.status_code == 204
        ):
            raise ValueError(
                f"unexpected HTTP transfer-encoding {te[0]!r} for response with status code {message.status_code}"
            )



        te_parsed = parse_transfer_encoding(te[0])
        match te_parsed:
            case "chunked" | "compress,chunked" | "deflate,chunked" | "gzip,chunked":
                pass
            case "compress" | "deflate" | "gzip" | "identity":
                if isinstance(message, Request):
                    raise ValueError(
                        f"unexpected HTTP transfer-encoding {te_parsed!r} for request"
                    )
            case other:
                typing.assert_never(other)
    elif cl:






        if len(cl) > 1:
            raise ValueError(f"multiple content-length headers: {cl!r}")
        parse_content_length(cl[0])
