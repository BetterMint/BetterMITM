import { selectTab } from "./flow";
import * as flowsActions from "../flows";
import * as modalActions from "./modal";
import { tabsForFlow } from "../../components/FlowView";
import { runCommand } from "../../utils";
import { AppDispatch, RootState } from "../store";

export function onKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable]")
    ) {
        return () => {};
    }
    if (e.ctrlKey || e.metaKey) {
        return () => {};
    }
    const key = e.key;
    return (dispatch: AppDispatch, getState: () => RootState) => {
        const { flows } = getState();
        const selectedFlows = flows.selected;
        const flow = selectedFlows[0];

        switch (key) {
            case "k":
            case "ArrowUp":
                e.preventDefault();
                dispatch(flowsActions.selectRelative(flows, -1));
                break;

            case "j":
            case "ArrowDown":
                e.preventDefault();
                dispatch(flowsActions.selectRelative(flows, +1));
                break;

            case " ":
            case "PageDown":
                e.preventDefault();
                dispatch(flowsActions.selectRelative(flows, +10));
                break;

            case "PageUp":
                e.preventDefault();
                dispatch(flowsActions.selectRelative(flows, -10));
                break;

            case "End":
                e.preventDefault();
                dispatch(flowsActions.selectRelative(flows, +1e10));
                break;

            case "Home":
                e.preventDefault();
                dispatch(flowsActions.selectRelative(flows, -1e10));
                break;

            case "Escape":
                e.preventDefault();
                if (getState().ui.modal.activeModal) {
                    dispatch(modalActions.hideModal());
                } else {
                    dispatch(flowsActions.select([]));
                }
                break;

            case "ArrowLeft": {
                if (!flow) break;
                e.preventDefault();
                const tabs = tabsForFlow(flow);
                const currentTab = getState().ui.flow.tab;
                const nextTab =
                    tabs[
                        (Math.max(0, tabs.indexOf(currentTab)) -
                            1 +
                            tabs.length) %
                            tabs.length
                    ];
                dispatch(selectTab(nextTab));
                break;
            }

            case "Tab":
            case "ArrowRight": {
                if (!flow) break;
                e.preventDefault();
                const tabs = tabsForFlow(flow);
                const currentTab = getState().ui.flow.tab;
                const nextTab =
                    tabs[
                        (Math.max(0, tabs.indexOf(currentTab)) + 1) %
                            tabs.length
                    ];
                dispatch(selectTab(nextTab));
                break;
            }

            case "Delete":
            case "d": {
                e.preventDefault();
                dispatch(flowsActions.remove(selectedFlows));
                break;
            }

            case "n": {
                e.preventDefault();
                runCommand("view.flows.create", "get", "https://example.com/");
                break;
            }

            case "D": {
                e.preventDefault();
                dispatch(flowsActions.duplicate(selectedFlows));
                break;
            }
            case "a": {
                e.preventDefault();
                dispatch(flowsActions.resume(selectedFlows));
                break;
            }
            case "A": {
                e.preventDefault();
                dispatch(flowsActions.resumeAll());
                break;
            }

            case "r": {
                e.preventDefault();
                dispatch(flowsActions.replay(selectedFlows));
                break;
            }

            case "v": {
                e.preventDefault();
                dispatch(flowsActions.revert(selectedFlows));
                break;
            }

            case "x": {
                e.preventDefault();
                dispatch(flowsActions.kill(selectedFlows));
                break;
            }

            case "X": {
                e.preventDefault();
                dispatch(flowsActions.killAll());
                break;
            }

            case "z": {
                e.preventDefault();
                dispatch(flowsActions.clear());
                break;
            }

            default:
                return;
        }
    };
}
