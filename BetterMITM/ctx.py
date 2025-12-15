from __future__ import annotations

import typing

if typing.TYPE_CHECKING:
    import BetterMITM.log
    import BetterMITM.master
    import BetterMITM.options

master: BetterMITM.master.Master
options: BetterMITM.options.Options

log: BetterMITM.log.Log
"""Deprecated: Use Python's builtin `logging` module instead."""
