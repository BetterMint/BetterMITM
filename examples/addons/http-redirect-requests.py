"""Redirect HTTP requests to another server."""

from mitmproxy import http


def request(flow: http.HTTPFlow) -> None:



    if flow.request.pretty_host == "example.org":
        flow.request.host = "mitmproxy.org"
