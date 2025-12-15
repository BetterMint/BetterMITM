import os
import subprocess
import sys

VERSION = "13.0.0.dev"
MITMPROXY = "mitmproxy " + VERSION



FLOW_FORMAT_VERSION = 21


def get_dev_version() -> str:
    """
    Return a detailed version string, sourced either from VERSION or obtained dynamically using git.
    """

    mitmproxy_version = VERSION

    here = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    try:


        subprocess.run(
            ["git", "cat-file", "-e", "cb0e3287090786fad566feb67ac07b8ef361b2c3"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=here,
            check=True,
        )
        git_describe = subprocess.check_output(
            ["git", "describe", "--tags", "--long"],
            stderr=subprocess.STDOUT,
            cwd=here,
        )
        last_tag, tag_dist_str, commit = git_describe.decode().strip().rsplit("-", 2)
        commit = commit.lstrip("g")[:7]
        tag_dist = int(tag_dist_str)
    except Exception:
        pass
    else:

        if tag_dist > 0:
            mitmproxy_version += f" (+{tag_dist}, commit {commit})"


    if getattr(sys, "frozen", False):
        mitmproxy_version += " binary"

    return mitmproxy_version


if __name__ == "__main__":
    print(VERSION)
