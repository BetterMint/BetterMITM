from mitmproxy import contentviews


class SwapCase(contentviews.Contentview):
    def prettify(self, data: bytes, metadata: contentviews.Metadata) -> str:
        return data.swapcase().decode()

    def render_priority(self, data: bytes, metadata: contentviews.Metadata) -> float:
        if metadata.content_type and metadata.content_type.startswith("text/example"):
            return 2
        else:
            return 0


contentviews.add(SwapCase)
