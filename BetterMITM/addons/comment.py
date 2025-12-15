from collections.abc import Sequence

from BetterMITM import command
from BetterMITM import ctx
from BetterMITM import flow
from BetterMITM.hooks import UpdateHook


class Comment:
    @command.command("flow.comment")
    def comment(self, flow: Sequence[flow.Flow], comment: str) -> None:
        "Add a comment to a flow"

        updated = []
        for f in flow:
            f.comment = comment
            updated.append(f)

        ctx.master.addons.trigger(UpdateHook(updated))
