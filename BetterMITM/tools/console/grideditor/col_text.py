"""
Welcome to the encoding dance!

In a nutshell, text columns are actually a proxy class for byte columns,
which just encode/decodes contents.
"""

from BetterMITM.tools.console import signals
from BetterMITM.tools.console.grideditor import col_bytes


class Column(col_bytes.Column):
    def __init__(self, heading, encoding="utf8", errors="surrogateescape"):
        super().__init__(heading)
        self.encoding_args = encoding, errors

    def Display(self, data):
        return TDisplay(data, self.encoding_args)

    def Edit(self, data):
        return TEdit(data, self.encoding_args)

    def blank(self):
        return ""



class EncodingMixin:
    def __init__(self, data, encoding_args):
        self.encoding_args = encoding_args
        super().__init__(str(data).encode(*self.encoding_args))

    def get_data(self):
        data = super().get_data()
        try:
            return data.decode(*self.encoding_args)
        except ValueError:
            signals.status_message.send(message="Invalid encoding.")
            raise



class TDisplay(EncodingMixin, col_bytes.Display):
    pass


class TEdit(EncodingMixin, col_bytes.Edit):
    pass
