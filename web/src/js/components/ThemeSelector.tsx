import * as React from "react";

const getSystemTheme = (): "dark" | "light" => {
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
};

const getScheduledTheme = (): string | null => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 6 ? "dark" : "light";
};

export default function ThemeSelector() {
    const [theme, setTheme] = React.useState(() => {
        return localStorage.getItem("theme") || "light";
    });
    const [isOpen, setIsOpen] = React.useState(false);
    const [autoSwitch, setAutoSwitch] = React.useState(() => {
        return localStorage.getItem("theme_auto_switch") === "true";
    });
    const [autoSwitchMode, setAutoSwitchMode] = React.useState<"system" | "schedule">(() => {
        return (localStorage.getItem("theme_auto_switch_mode") as "system" | "schedule") || "system";
    });
    const popupRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    React.useEffect(() => {
        if (!autoSwitch) return;

        const updateTheme = () => {
            if (autoSwitchMode === "system") {
                const systemTheme = getSystemTheme();
                setTheme((currentTheme) => {
                    if (systemTheme !== currentTheme) {
                        return systemTheme;
                    }
                    return currentTheme;
                });
            } else {
                const scheduledTheme = getScheduledTheme();
                setTheme((currentTheme) => {
                    if (scheduledTheme && scheduledTheme !== currentTheme) {
                        return scheduledTheme;
                    }
                    return currentTheme;
                });
            }
        };

        updateTheme();

        if (autoSwitchMode === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => updateTheme();
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        } else {
            const interval = setInterval(updateTheme, 60000);
            return () => clearInterval(interval);
        }
    }, [autoSwitch, autoSwitchMode]);

    React.useEffect(() => {
        localStorage.setItem("theme_auto_switch", autoSwitch.toString());
        localStorage.setItem("theme_auto_switch_mode", autoSwitchMode);
    }, [autoSwitch, autoSwitchMode]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const themes = [
        { value: "light", label: "☀️ Light", icon: "☀️" },
        { value: "dark", label: "🌙 Dark", icon: "🌙" },
        { value: "blue", label: "💙 Blue", icon: "💙" },
        { value: "purple", label: "💜 Purple", icon: "💜" },
        { value: "green", label: "💚 Green", icon: "💚" },
        { value: "red", label: "❤️ Red", icon: "❤️" },
        { value: "orange", label: "🧡 Orange", icon: "🧡" },
        { value: "cyber", label: "🤖 Cyber", icon: "🤖" },
        { value: "midnight", label: "🌃 Midnight", icon: "🌃" },
        { value: "ocean", label: "🌊 Ocean", icon: "🌊" },
    ];

    return (
        <div
            ref={popupRef}
            style={{
                position: "fixed",
                top: "10px",
                right: "10px",
                zIndex: 999,
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
            }}
        >
            <a
                href="https://discord.gg/bettermint-development-1098267851732815932"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sleek glint-effect"
                style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "var(--shadow-sm)",
                    textDecoration: "none",
                    flexShrink: 0,
                }}
                title="Join Discord Server"
            >
                <i className="fa fa-comments"></i>
                <span>Discord</span>
            </a>
            <div style={{ position: "relative" }}>
            <button
                className="btn-sleek glint-effect"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "var(--shadow-sm)",
                }}
                title="Select Theme"
            >
                <i className="fa fa-paint-brush"></i>
                <span>Theme</span>
                <i className={`fa fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: "10px" }}></i>
            </button>
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "6px",
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        boxShadow: "var(--shadow-lg)",
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        minWidth: "200px",
                    }}
                >
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px", paddingBottom: "6px", borderBottom: "1px solid var(--border-color)" }}>
                        Select Theme:
                    </div>
                    <div style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                        <button
                            type="button"
                            onClick={() => setAutoSwitch(!autoSwitch)}
                            className="btn-sleek glint-effect"
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                fontSize: "12px",
                                backgroundColor: autoSwitch ? "var(--accent-primary)" : "var(--bg-tertiary)",
                                color: autoSwitch ? "white" : "var(--text-primary)",
                                border: `2px solid ${autoSwitch ? "var(--accent-primary)" : "var(--border-color)"}`,
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                fontWeight: "500",
                            }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <i className={`fa fa-${autoSwitch ? "toggle-on" : "toggle-off"}`} style={{ fontSize: "14px" }}></i>
                                <span>Auto-switch Theme</span>
                            </span>
                            {autoSwitch && <i className="fa fa-check" style={{ fontSize: "10px" }}></i>}
                        </button>
                        {autoSwitch && (
                            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                <button
                                    type="button"
                                    onClick={() => setAutoSwitchMode("system")}
                                    className="btn-sleek glint-effect"
                                    style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        fontSize: "11px",
                                        backgroundColor: autoSwitchMode === "system" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                                        color: autoSwitchMode === "system" ? "white" : "var(--text-primary)",
                                        border: `2px solid ${autoSwitchMode === "system" ? "var(--accent-primary)" : "var(--border-color)"}`,
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        textAlign: "left",
                                    }}
                                >
                                    <i className={`fa fa-${autoSwitchMode === "system" ? "check-circle" : "circle-o"}`} style={{ fontSize: "12px" }}></i>
                                    <span>Follow System Preference</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAutoSwitchMode("schedule")}
                                    className="btn-sleek glint-effect"
                                    style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        fontSize: "11px",
                                        backgroundColor: autoSwitchMode === "schedule" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                                        color: autoSwitchMode === "schedule" ? "white" : "var(--text-primary)",
                                        border: `2px solid ${autoSwitchMode === "schedule" ? "var(--accent-primary)" : "var(--border-color)"}`,
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        textAlign: "left",
                                    }}
                                >
                                    <i className={`fa fa-${autoSwitchMode === "schedule" ? "check-circle" : "circle-o"}`} style={{ fontSize: "12px" }}></i>
                                    <span>Schedule (Dark 8PM-6AM)</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
                        {themes.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setTheme(t.value);
                                    setIsOpen(false);
                                }}
                                className="btn-sleek glint-effect"
                                style={{
                                    padding: "6px 10px",
                                    fontSize: "11px",
                                    backgroundColor:
                                        theme === t.value ? "var(--accent-primary)" : "var(--bg-tertiary)",
                                    color: theme === t.value ? "white" : "var(--text-primary)",
                                    border: theme === t.value ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                }}
                                title={t.label}
                            >
                                <span>{t.icon}</span>
                                <span>{t.label.replace(/^[^\s]+\s/, "")}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

