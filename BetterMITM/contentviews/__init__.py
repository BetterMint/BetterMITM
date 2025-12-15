"""
mitmproxy includes a set of content views which can be used to
format/decode/highlight/reencode data. While they are mostly used for HTTP message
bodies, the may be used in other contexts, e.g. to decode WebSocket messages.

See "Custom Contentviews" in the mitmproxy documentation for examples.
"""

import logging
import sys
import traceback
import warnings
from dataclasses import dataclass

from ..addonmanager import cut_traceback
from ._api import Contentview
from ._api import InteractiveContentview
from ._api import Metadata
from ._api import SyntaxHighlight
from ._compat import get
from ._compat import LegacyContentview
from ._compat import remove
from ._registry import ContentviewRegistry
from ._utils import ContentviewMessage
from ._utils import get_data
from ._utils import make_metadata
from ._view_css import css
from ._view_dns import dns
from ._view_graphql import graphql
from ._view_http3 import http3
from ._view_image import image
from ._view_javascript import javascript
from ._view_json import json_view
from ._view_mqtt import mqtt
from ._view_multipart import multipart
from ._view_query import query
from ._view_raw import raw
from ._view_socketio import socket_io
from ._view_urlencoded import urlencoded
from ._view_wbxml import wbxml
from ._view_xml_html import xml_html
from .base import View
import mitmproxy_rs.contentviews
from BetterMITM import flow
from BetterMITM.utils import strutils

logger = logging.getLogger(__name__)


@dataclass
class ContentviewResult:
    text: str
    syntax_highlight: SyntaxHighlight
    view_name: str | None
    description: str


registry = ContentviewRegistry()


def prettify_message(
    message: ContentviewMessage,
    flow: flow.Flow,
    view_name: str = "auto",
    registry: ContentviewRegistry = registry,
) -> ContentviewResult:
    data, enc = get_data(message)
    if data is None:
        return ContentviewResult(
            text="Content is missing.",
            syntax_highlight="error",
            description="",
            view_name=None,
        )


    metadata = make_metadata(message, flow)
    view = registry.get_view(data, metadata, view_name)


    try:
        ret = ContentviewResult(
            text=view.prettify(data, metadata),
            syntax_highlight=view.syntax_highlight,
            view_name=view.name,
            description=enc,
        )
    except Exception as e:
        logger.debug(f"Contentview {view.name!r} failed: {e}", exc_info=True)
        if view_name == "auto":

            ret = ContentviewResult(
                text=raw.prettify(data, metadata),
                syntax_highlight=raw.syntax_highlight,
                view_name=raw.name,
                description=f"{enc}[failed to parse as {view.name}]",
            )
        else:

            exc, value, tb = sys.exc_info()
            tb_cut = cut_traceback(tb, "prettify_message")
            if (
                tb_cut == tb
            ):
                tb_cut = None

            err = "".join(traceback.format_exception(exc, value=value, tb=tb_cut))
            ret = ContentviewResult(
                text=f"Couldn't parse as {view.name}:\n{err}",
                syntax_highlight="error",
                view_name=view.name,
                description=enc,
            )

    ret.text = strutils.escape_control_characters(ret.text)
    return ret


def reencode_message(
    prettified: str,
    message: ContentviewMessage,
    flow: flow.Flow,
    view_name: str,
) -> bytes:
    metadata = make_metadata(message, flow)
    view = registry[view_name.lower()]
    if not isinstance(view, InteractiveContentview):
        raise ValueError(f"Contentview {view.name} is not interactive.")
    return view.reencode(prettified, metadata)


_views: list[Contentview] = [
    css,
    dns,
    graphql,
    http3,
    image,
    javascript,
    json_view,
    mqtt,
    multipart,
    query,
    raw,
    socket_io,
    urlencoded,
    wbxml,
    xml_html,
]
for view in _views:
    registry.register(view)
for name in mitmproxy_rs.contentviews.__all__:
    if name.startswith("_"):
        continue
    cv = getattr(mitmproxy_rs.contentviews, name)
    if isinstance(cv, Contentview) and not isinstance(cv, type):
        registry.register(cv)


def add(contentview: Contentview | type[Contentview]) -> None:
    """
    Register a contentview for use in BetterMITM.

    You may pass a `Contentview` instance or the class itself.
    When passing the class, its constructor will be invoked with no arguments.
    """
    if isinstance(contentview, View):
        warnings.warn(
            f"`BetterMITM.contentviews.View` is deprecated since mitmproxy 12, "
            f"migrate {contentview.__class__.__name__} to `BetterMITM.contentviews.Contentview` instead.",
            stacklevel=2,
        )
        contentview = LegacyContentview(contentview)
    registry.register(contentview)



SyntaxHighlight = SyntaxHighlight
"""
Syntax highlighting formats currently supported by BetterMITM.
Note that YAML is a superset of JSON; so if you'd like to highlight JSON, pick the YAML highlighter.

*If you have a concrete use case for additional formats, please open an issue.*
"""


__all__ = [

    "Contentview",
    "InteractiveContentview",
    "SyntaxHighlight",
    "add",
    "Metadata",
]
