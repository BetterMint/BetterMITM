from __future__ import annotations

from collections.abc import Callable
from typing import Union

from BetterMITM.utils import signals

StatusMessage = Union[tuple[str, str], str]




def _status_message(message: StatusMessage, expire: int = 5) -> None: ...


status_message = signals.SyncSignal(_status_message)



def _status_prompt(
    prompt: str, text: str | None, callback: Callable[[str], None]
) -> None: ...


status_prompt = signals.SyncSignal(_status_prompt)



def _status_prompt_onekey(
    prompt: str, keys: list[tuple[str, str]], callback: Callable[[str], None]
) -> None: ...


status_prompt_onekey = signals.SyncSignal(_status_prompt_onekey)



def _status_prompt_command(partial: str = "", cursor: int | None = None) -> None: ...


status_prompt_command = signals.SyncSignal(_status_prompt_command)



def _call_in(seconds: float, callback: Callable[[], None]) -> None: ...


call_in = signals.SyncSignal(_call_in)


focus = signals.SyncSignal(lambda section: None)


update_settings = signals.SyncSignal(lambda: None)


flow_change = signals.SyncSignal(lambda flow: None)


pop_view_state = signals.SyncSignal(lambda: None)


window_refresh = signals.SyncSignal(lambda: None)


keybindings_change = signals.SyncSignal(lambda: None)
