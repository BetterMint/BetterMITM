
from pprint import pprint

import click

from mitmproxy.io import tnetstring


def read_tnetstring(input):



    if not input.read(1):
        return None
    else:
        input.seek(-1, 1)
    return tnetstring.load(input)


@click.command()
@click.argument("input", type=click.File("rb"))
def inspect(input):
    """
    pretty-print a dumpfile
    """
    while True:
        data = read_tnetstring(input)
        if not data:
            break
        pprint(data)


if __name__ == "__main__":
    inspect()
