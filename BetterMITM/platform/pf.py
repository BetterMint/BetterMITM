import re
import sys


def lookup(address, port, s):
    """
    Parse the pfctl state output s, to look up the destination host
    matching the client (address, port).

    Returns an (address, port) tuple, or None.
    """


    address = re.sub(r"^::ffff:(?=\d+.\d+.\d+.\d+$)", "", address)
    s = s.decode()


    specv4 = f"{address}:{port}"


    specv6 = f"{address}[{port}]"

    for i in s.split("\n"):
        if "ESTABLISHED:ESTABLISHED" in i and specv4 in i:
            s = i.split()
            if len(s) > 4:
                if sys.platform.startswith("freebsd"):

                    s = s[3][1:-1].split(":")
                else:
                    s = s[4].split(":")

                if len(s) == 2:
                    return s[0], int(s[1])
        elif "ESTABLISHED:ESTABLISHED" in i and specv6 in i:
            s = i.split()
            if len(s) > 4:
                s = s[4].split("[")
                port = s[1].split("]")
                port = port[0]
                return s[0], int(port)
    raise RuntimeError("Could not resolve original destination.")
