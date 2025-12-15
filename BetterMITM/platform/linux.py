import socket
import struct


SO_ORIGINAL_DST = 80
SOL_IPV6 = 41


def original_addr(csock: socket.socket) -> tuple[str, int]:












    is_ipv4 = "." in csock.getsockname()[0]
    if is_ipv4:


        dst = csock.getsockopt(socket.SOL_IP, SO_ORIGINAL_DST, 16)
        port, raw_ip = struct.unpack_from("!2xH4s", dst)
        ip = socket.inet_ntop(socket.AF_INET, raw_ip)
    else:
        dst = csock.getsockopt(SOL_IPV6, SO_ORIGINAL_DST, 28)
        port, raw_ip = struct.unpack_from("!2xH4x16s", dst)
        ip = socket.inet_ntop(socket.AF_INET6, raw_ip)
    return ip, port
