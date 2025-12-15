import * as React from "react";
import { CommandBarToggle, EventlogToggle, OptionsToggle } from "./MenuToggle";
import Button from "../common/Button";
import DocsLink from "../common/DocsLink";
import HideInStatic from "../common/HideInStatic";
import * as modalActions from "../../ducks/ui/modal";
import { useAppDispatch } from "../../ducks";
import KeyboardShortcuts from "../Settings/KeyboardShortcuts";

OptionMenu.title = "Options";

export default function OptionMenu() {
    const dispatch = useAppDispatch();
    const openOptions = () => modalActions.setActiveModal("OptionModal");
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = React.useState(false);

    return (
        <div>
            <HideInStatic>
                <div className="menu-group">
                    <div className="menu-content">
                        <Button
                            title="Open Options"
                            icon="fa-cogs text-primary"
                            onClick={() => dispatch(openOptions())}
                        >
                            Edit Options <sup>alpha</sup>
                        </Button>
                    </div>
                    <div className="menu-legend">Options Editor</div>
                </div>

                <div className="menu-group">
                    <div className="menu-content">
                        <OptionsToggle name="anticache">
                            Strip cache headers{" "}
                            <DocsLink resource="overview/features/#anticache" />
                        </OptionsToggle>
                        <OptionsToggle name="showhost">
                            Use host header for display{" "}
                            <DocsLink resource="concepts/options/#showhost" />
                        </OptionsToggle>
                        <OptionsToggle name="ssl_insecure">
                            Don&apos;t verify server certificates{" "}
                            <DocsLink resource="concepts/options/#ssl_insecure" />
                        </OptionsToggle>
                    </div>
                    <div className="menu-legend">Quick Options</div>
                </div>

                <div className="menu-group">
                    <div className="menu-content">
                        <Button
                            title="Keyboard Shortcuts & Macros"
                            icon="fa-keyboard-o text-primary"
                            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                        >
                            Keyboard Shortcuts & Macros
                        </Button>
                    </div>
                    <div className="menu-legend">Settings</div>
                </div>
            </HideInStatic>

            <div className="menu-group">
                <div className="menu-content">
                    <EventlogToggle />
                    <CommandBarToggle />
                </div>
                <div className="menu-legend">View Options</div>
            </div>

            {showKeyboardShortcuts && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }} onClick={() => setShowKeyboardShortcuts(false)}>
                    <div style={{
                        backgroundColor: "var(--bg-primary)",
                        padding: "20px",
                        borderRadius: "8px",
                        maxWidth: "1200px",
                        maxHeight: "90vh",
                        overflow: "auto",
                        width: "90%",
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3>Keyboard Shortcuts & Macros</h3>
                            <button
                                className="btn-sleek"
                                onClick={() => setShowKeyboardShortcuts(false)}
                                style={{ padding: "4px 8px" }}
                            >
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                        <KeyboardShortcuts />
                    </div>
                </div>
            )}
        </div>
    );
}
