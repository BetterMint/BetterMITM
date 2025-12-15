import * as React from "react";
import { useState, useEffect } from "react";
import { fetchApi } from "../../utils";

interface Shortcut {
    id?: string;
    action: string;
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled: boolean;
}

interface Macro {
    id?: string;
    name: string;
    actions: string[];
    enabled: boolean;
}

export default function KeyboardShortcuts() {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [macros, setMacros] = useState<Macro[]>([]);
    const [recording, setRecording] = useState(false);
    const [recordedActions, setRecordedActions] = useState<string[]>([]);
    const [newMacroName, setNewMacroName] = useState("");

    useEffect(() => {
        
        const defaultShortcuts: Shortcut[] = [
            { action: "Switch to Capture tab", key: "1", ctrl: true, enabled: true },
            { action: "Switch to Flow List tab", key: "2", ctrl: true, enabled: true },
            { action: "Switch to Analytics tab", key: "3", ctrl: true, enabled: true },
            { action: "Switch to Tools tab", key: "4", ctrl: true, enabled: true },
            { action: "Open keyboard shortcuts", key: "K", ctrl: true, enabled: true },
            { action: "View selected flow details", key: "Enter", enabled: true },
            { action: "Replay selected flow", key: "R", enabled: true },
            { action: "Duplicate flow", key: "D", enabled: true },
            { action: "Delete selected flow(s)", key: "Delete", enabled: true },
            { action: "Bookmark selected flow", key: "B", enabled: true },
            { action: "Add tag to selected flow", key: "T", enabled: true },
            { action: "Toggle interception for selected flow", key: "I", enabled: true },
            { action: "Pause/Resume intercepted flow", key: "P", enabled: true },
            { action: "Modify intercepted flow", key: "M", enabled: true },
            { action: "Focus search/filter input", key: "F", ctrl: true, enabled: true },
            { action: "Clear search/filter", key: "Esc", enabled: true },
            { action: "Zoom in", key: "+", ctrl: true, enabled: true },
            { action: "Zoom out", key: "-", ctrl: true, enabled: true },
            { action: "Reset zoom", key: "0", ctrl: true, enabled: true },
            { action: "Toggle dark mode", key: "D", ctrl: true, enabled: true },
        ];

        fetchApi("/shortcuts")
            .then((res) => res.json())
            .then((data) => setShortcuts(data && data.length > 0 ? data : defaultShortcuts))
            .catch((err) => {
                console.error("Failed to load shortcuts:", err);
                setShortcuts(defaultShortcuts);
            });

        fetchApi("/macros")
            .then((res) => res.json())
            .then((data) => setMacros(data || []))
            .catch((err) => {
                console.error("Failed to load macros:", err);
                setMacros([]);
            });
    }, []);

    const saveShortcut = async (shortcut: Shortcut) => {
        try {
            await fetchApi("/shortcuts", {
                method: shortcut.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(shortcut),
            });
            const updated = await fetchApi("/shortcuts").then((r) => r.json());
            setShortcuts(updated);
        } catch (error) {
            console.error("Failed to save shortcut:", error);
        }
    };

    const startRecording = () => {
        setRecording(true);
        setRecordedActions([]);
    };

    const stopRecording = () => {
        setRecording(false);
    };

    const saveMacro = async () => {
        if (!newMacroName || recordedActions.length === 0) {
            alert("Please provide a name and record some actions");
            return;
        }

        try {
            await fetchApi("/macros", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newMacroName,
                    actions: recordedActions,
                    enabled: true,
                }),
            });
            const updated = await fetchApi("/macros").then((r) => r.json());
            setMacros(updated);
            setNewMacroName("");
            setRecordedActions([]);
        } catch (error) {
            console.error("Failed to save macro:", error);
        }
    };

    const playMacro = async (macro: Macro) => {
        try {
            await fetchApi(`/macros/${macro.id}/play`, {
                method: "POST",
            });
        } catch (error) {
            console.error("Failed to play macro:", error);
        }
    };

    return (
        <div className="keyboard-shortcuts-display">
            <div className="shortcuts-grid">
                <div className="card-sleek glint-effect" style={{ padding: "clamp(20px, 2.5vw, 28px)", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                    <h2 style={{ marginBottom: "clamp(20px, 2.5vw, 24px)", fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", color: "var(--text-primary)" }}>Keyboard Shortcuts</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 2vw, 20px)", maxHeight: "60vh", overflowY: "auto", paddingRight: "clamp(8px, 1vw, 12px)" }}>
                        {shortcuts.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                <i className="fa fa-keyboard-o" style={{ fontSize: "48px", opacity: 0.3, marginBottom: "16px" }}></i>
                                <p>No shortcuts configured</p>
                            </div>
                        ) : (
                            shortcuts.map((shortcut, index) => (
                                <div
                                    key={index}
                                    className="shortcut-item glint-effect"
                                    style={{
                                        padding: "clamp(16px, 2vw, 20px)",
                                        minHeight: "clamp(70px, 8vh, 90px)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "clamp(16px, 2vw, 20px)",
                                        backgroundColor: "var(--bg-secondary)",
                                        borderRadius: "12px",
                                        border: "2px solid var(--border-color)",
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "clamp(10px, 1.2vh, 12px)" }}>
                                        <div className="shortcut-action" style={{ fontSize: "clamp(14px, 1.6vw, 16px)", fontWeight: "600", color: "var(--text-primary)", marginBottom: "clamp(8px, 1vh, 10px)" }}>{shortcut.action}</div>
                                        <div className="shortcut-keys" style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 0.8vw, 8px)", flexWrap: "wrap" }}>
                                            {[shortcut.ctrl && "Ctrl", shortcut.shift && "Shift", shortcut.alt && "Alt", shortcut.key]
                                                .filter(Boolean)
                                                .map((key, i, arr) => (
                                                    <React.Fragment key={i}>
                                                        <kbd className="shortcut-key" style={{ 
                                                            padding: "clamp(8px, 1vh, 10px) clamp(12px, 1.5vw, 16px)",
                                                            fontSize: "clamp(13px, 1.5vw, 15px)",
                                                            fontWeight: "600",
                                                            backgroundColor: "var(--bg-primary)",
                                                            border: "2px solid var(--border-color)",
                                                            borderRadius: "6px",
                                                            color: "var(--text-primary)",
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                            minWidth: "clamp(40px, 5vw, 50px)",
                                                            textAlign: "center",
                                                            display: "inline-block"
                                                        }}>{key}</kbd>
                                                        {i < arr.length - 1 && <span className="shortcut-separator" style={{ fontSize: "clamp(16px, 2vw, 18px)", color: "var(--text-secondary)", fontWeight: "600", padding: "0 clamp(4px, 0.5vw, 6px)" }}>+</span>}
                                                    </React.Fragment>
                                                ))}
                                        </div>
                                    </div>
                                    <button
                                        className={`btn-sleek glint-effect ${shortcut.enabled ? "btn-sleek-success" : ""}`}
                                        onClick={() => saveShortcut({ ...shortcut, enabled: !shortcut.enabled })}
                                        style={{ 
                                            padding: "clamp(10px, 1.2vh, 12px) clamp(16px, 2vw, 20px)", 
                                            fontSize: "clamp(12px, 1.4vw, 14px)", 
                                            borderRadius: "8px", 
                                            flexShrink: 0,
                                            minWidth: "clamp(80px, 10vw, 100px)"
                                        }}
                                    >
                                        {shortcut.enabled ? "Enabled" : "Disabled"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card-sleek glint-effect" style={{ padding: "20px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                    <h2 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>Macros</h2>
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                            <input
                                type="text"
                                className="input-sleek"
                                value={newMacroName}
                                onChange={(e) => setNewMacroName(e.target.value)}
                                placeholder="Macro name"
                                style={{ flex: 1 }}
                            />
                            <button
                                className={`btn-sleek ${recording ? "btn-sleek-danger" : "btn-sleek-success"}`}
                                onClick={recording ? stopRecording : startRecording}
                                style={{ padding: "6px 12px" }}
                            >
                                {recording ? "Stop Recording" : "Start Recording"}
                            </button>
                        </div>
                        {recording && (
                            <div style={{ padding: "8px", backgroundColor: "var(--error-bg, #fee)", borderRadius: "4px", marginBottom: "12px" }}>
                                Recording... Perform actions to record them.
                            </div>
                        )}
                        {recordedActions.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                                <strong>Recorded Actions:</strong> {recordedActions.length}
                                <button className="btn-sleek" onClick={saveMacro} style={{ marginLeft: "8px", padding: "4px 8px" }}>
                                    Save Macro
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
                        {macros.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                <i className="fa fa-code" style={{ fontSize: "48px", opacity: 0.3, marginBottom: "16px" }}></i>
                                <p>No macros saved</p>
                            </div>
                        ) : (
                            macros.map((macro, index) => (
                                <div
                                    key={index}
                                    className="glint-effect"
                                    style={{
                                        padding: "14px",
                                        backgroundColor: macro.enabled ? "var(--bg-secondary)" : "var(--bg-tertiary)",
                                        borderRadius: "8px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid var(--border-color)",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                                        e.currentTarget.style.transform = "translateX(4px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border-color)";
                                        e.currentTarget.style.transform = "translateX(0)";
                                    }}
                                >
                                <div>
                                    <strong>{macro.name}</strong>
                                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                        {macro.actions.length} action(s)
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    <button
                                        className="btn-sleek btn-sleek-success"
                                        onClick={() => playMacro(macro)}
                                        style={{ padding: "4px 8px", fontSize: "11px" }}
                                    >
                                        <i className="fa fa-play"></i>
                                    </button>
                                    <button
                                        className={`btn-sleek ${macro.enabled ? "btn-sleek-success" : ""}`}
                                        style={{ padding: "4px 8px", fontSize: "11px" }}
                                    >
                                        {macro.enabled ? "Enabled" : "Disabled"}
                                    </button>
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

