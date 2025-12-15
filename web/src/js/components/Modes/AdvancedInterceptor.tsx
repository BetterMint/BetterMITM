import * as React from "react";
import { ModeToggle } from "./ModeToggle";
import { useAppDispatch, useAppSelector } from "../../ducks";
import { update } from "../../ducks/options";
import { fetchApi } from "../../utils";

export default function AdvancedInterceptor() {
    const dispatch = useAppDispatch();
    const enabled = useAppSelector(
        (state) => state.options.advanced_intercept_enabled,
    );
    const inbound = useAppSelector(
        (state) => state.options.advanced_intercept_inbound,
    );
    const outbound = useAppSelector(
        (state) => state.options.advanced_intercept_outbound,
    );
    const interceptUrls = useAppSelector(
        (state) => state.options.advanced_intercept_urls,
    );
    const blockUrls = useAppSelector(
        (state) => state.options.advanced_block_urls,
    );
    const mode = useAppSelector(
        (state) => state.options.advanced_intercept_mode,
    );
    
    const skipDomainsFromOptions = useAppSelector(
        (state) => (state.options as any).advanced_skip_domains || "",
    );
    const [skipDomains, setSkipDomains] = React.useState(skipDomainsFromOptions);
    const [showAdvanced, setShowAdvanced] = React.useState(false);
    
    
    const matchModeFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_match_mode || "regex",
    );
    const caseSensitiveFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_case_sensitive || false,
    );
    const interceptMethodsFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_methods || "",
    );
    const interceptStatusCodesFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_status_codes || "",
    );
    const maxQueueFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_max_queue || 100,
    );
    const autoResumeFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_auto_resume || 0,
    );
    const logInterceptionsFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_log !== false,
    );
    const headerFiltersFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_header_filters || "",
    );
    const bodyPatternsFromOptions = useAppSelector(
        (state) => (state.options as any)?.advanced_intercept_body_patterns || "",
    );
    
    
    const [matchMode, setMatchMode] = React.useState(matchModeFromOptions);
    const [caseSensitive, setCaseSensitive] = React.useState(caseSensitiveFromOptions);
    const [interceptMethods, setInterceptMethods] = React.useState(interceptMethodsFromOptions);
    const [interceptStatusCodes, setInterceptStatusCodes] = React.useState(interceptStatusCodesFromOptions);
    const [maxQueue, setMaxQueue] = React.useState(maxQueueFromOptions);
    const [autoResume, setAutoResume] = React.useState(autoResumeFromOptions);
    const [logInterceptions, setLogInterceptions] = React.useState(logInterceptionsFromOptions);
    const [headerFilters, setHeaderFilters] = React.useState(headerFiltersFromOptions);
    const [bodyPatterns, setBodyPatterns] = React.useState(bodyPatternsFromOptions);
    const [pausedConnections, setPausedConnections] = React.useState<string[]>([]);
    
    React.useEffect(() => {
        setSkipDomains(skipDomainsFromOptions);
    }, [skipDomainsFromOptions]);
    
    
    React.useEffect(() => {
        if (enabled) {
            fetchApi("/advanced-intercept-rules/paused-connections")
                .then((res) => res.json())
                .then((data) => setPausedConnections(data.paused_connections || []))
                .catch((err) => console.error("Failed to load paused connections:", err));
        }
    }, [enabled]);
    
    
    React.useEffect(() => {
        setMatchMode(matchModeFromOptions);
    }, [matchModeFromOptions]);
    
    React.useEffect(() => {
        setCaseSensitive(caseSensitiveFromOptions);
    }, [caseSensitiveFromOptions]);
    
    React.useEffect(() => {
        setInterceptMethods(interceptMethodsFromOptions);
    }, [interceptMethodsFromOptions]);
    
    React.useEffect(() => {
        setInterceptStatusCodes(interceptStatusCodesFromOptions);
    }, [interceptStatusCodesFromOptions]);
    
    React.useEffect(() => {
        setMaxQueue(maxQueueFromOptions);
    }, [maxQueueFromOptions]);
    
    React.useEffect(() => {
        setAutoResume(autoResumeFromOptions);
    }, [autoResumeFromOptions]);
    
    React.useEffect(() => {
        setLogInterceptions(logInterceptionsFromOptions);
    }, [logInterceptionsFromOptions]);
    
    React.useEffect(() => {
        setHeaderFilters(headerFiltersFromOptions);
    }, [headerFiltersFromOptions]);
    
    React.useEffect(() => {
        setBodyPatterns(bodyPatternsFromOptions);
    }, [bodyPatternsFromOptions]);

    const handleToggle = async (e: React.ChangeEvent) => {
        const newEnabled = !enabled;
        dispatch(update("advanced_intercept_enabled", newEnabled));
        
        
        if (newEnabled && interceptUrls && interceptUrls.trim()) {
            try {
                await fetchApi("/advanced-intercept-rules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        enabled: true,
                        inbound: inbound,
                        outbound: outbound,
                        intercept_urls: interceptUrls,
                        block_urls: blockUrls,
                        mode: mode || "pause", 
                        skip_domains: skipDomains,
                        match_mode: matchMode,
                        case_sensitive: caseSensitive,
                        intercept_methods: interceptMethods,
                        intercept_status_codes: interceptStatusCodes,
                        max_queue: maxQueue,
                        auto_resume: autoResume,
                        log: logInterceptions,
                        header_filters: headerFilters,
                        body_patterns: bodyPatterns,
                    }),
                });
            } catch (error) {
                console.error("Failed to save intercept rules:", error);
            }
        }
    };

    const handleInboundToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(update("advanced_intercept_inbound", e.target.checked));
    };

    const handleOutboundToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(update("advanced_intercept_outbound", e.target.checked));
    };

    const interceptUrlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    React.useEffect(() => {
        return () => {
            if (interceptUrlsTimeoutRef.current) {
                clearTimeout(interceptUrlsTimeoutRef.current);
            }
        };
    }, []);
    
    const handleInterceptUrlsChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const value = e.target.value;
        dispatch(update("advanced_intercept_urls", value));
        
        if (interceptUrlsTimeoutRef.current) {
            clearTimeout(interceptUrlsTimeoutRef.current);
        }
        interceptUrlsTimeoutRef.current = setTimeout(async () => {
            if (value && value.trim()) {
                try {
                    const shouldEnable = enabled || value.trim().length > 0;
                    await fetchApi("/advanced-intercept-rules", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            enabled: shouldEnable,
                            intercept_urls: value,
                        }),
                    });
                    if (shouldEnable && !enabled) {
                        dispatch(update("advanced_intercept_enabled", true));
                    }
                } catch (error) {
                    console.error("Failed to auto-save intercept URLs:", error);
                }
            }
        }, 500);
    };

    const handleBlockUrlsChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        dispatch(update("advanced_block_urls", e.target.value));
    };

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(update("advanced_intercept_mode", e.target.value));
    };

    const handleSaveRules = async () => {
        try {
            
            const shouldEnable = enabled || (interceptUrls && interceptUrls.trim()) || (blockUrls && blockUrls.trim());
            
            const response = await fetchApi("/advanced-intercept-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    enabled: shouldEnable,
                    inbound: shouldEnable ? (inbound !== false) : inbound,
                    outbound: shouldEnable ? (outbound !== false) : outbound,
                    intercept_urls: interceptUrls,
                    block_urls: blockUrls,
                    mode,
                    skip_domains: skipDomains,
                    match_mode: matchMode,
                    case_sensitive: caseSensitive,
                    intercept_methods: interceptMethods,
                    intercept_status_codes: interceptStatusCodes,
                    max_queue: maxQueue,
                    auto_resume: autoResume,
                    log: logInterceptions,
                    header_filters: headerFilters,
                    body_patterns: bodyPatterns,
                }),
            });
            
            
            if (shouldEnable && !enabled) {
                dispatch(update("advanced_intercept_enabled", true));
            }

            if (response.ok) {
                alert("Intercept rules saved successfully!");
            } else {
                const errorText = await response.text();
                alert(`Failed to save rules: ${errorText}`);
            }
        } catch (error) {
            alert(`Failed to save rules: ${error}`);
        }
    };

    return (
        <div>
            <h4 className="mode-title">Advanced Interceptor</h4>
            <p className="mode-description">
                Intercept and control both inbound (response) and outbound
                (request) traffic with URL pattern matching, pause, and block
                capabilities. When a flow is paused, you can edit headers,
                content, method (e.g., POST to GET), User-Agent, and more in
                the Flow detail view, then resume to continue with your
                modifications.
            </p>
            <div className="mode-local">
                <ModeToggle
                    value={enabled}
                    label="Advanced Interceptor"
                    onChange={handleToggle}
                >
                    <div
                        className="card-sleek"
                        style={{
                            marginTop: "12px",
                            opacity: enabled ? 1 : 0.6,
                            transition: "opacity 0.3s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            width: "100%",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: enabled ? "pointer" : "not-allowed",
                                    margin: 0,
                                    width: "100%",
                                    gap: "12px",
                                }}
                            >
                                <span className="checkbox-sleek" style={{ flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={inbound}
                                        onChange={handleInboundToggle}
                                        disabled={!enabled}
                                    />
                                    <span className="checkmark"></span>
                                </span>
                                <span style={{ fontSize: "12px", flex: "1", minWidth: 0 }}>Intercept Inbound (Responses)</span>
                            </label>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: enabled ? "pointer" : "not-allowed",
                                    margin: 0,
                                    width: "100%",
                                    gap: "12px",
                                }}
                            >
                                <span className="checkbox-sleek" style={{ flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={outbound}
                                        onChange={handleOutboundToggle}
                                        disabled={!enabled}
                                    />
                                    <span className="checkmark"></span>
                                </span>
                                <span style={{ fontSize: "12px", flex: "1", minWidth: 0 }}>Intercept Outbound (Requests)</span>
                            </label>
                        </div>

                        <div className="compact-spacing" style={{ width: "100%" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "6px" }}>
                                Interception Mode:
                            </label>
                            <select
                                className="select-sleek"
                                value={mode}
                                onChange={handleModeChange}
                                disabled={!enabled}
                                style={{ width: "100%" }}
                            >
                                <option value="pause">
                                    Pause (wait for user action)
                                </option>
                                <option value="block">
                                    Block (kill connection)
                                </option>
                            </select>
                        </div>

                        <div className="compact-spacing" style={{ width: "100%" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "6px",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <label className="label-sleek" style={{ marginBottom: 0, flex: "1 1 auto", minWidth: "150px" }}>
                                    URL Patterns to Intercept:
                                </label>
                                <button
                                    className="btn-sleek btn-sleek-danger glint-effect"
                                    onClick={() => {
                                        dispatch(update("advanced_intercept_urls", ""));
                                    }}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: "11px",
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}
                                    title="Clear all intercept URLs"
                                >
                                    Clear
                                </button>
                            </div>
                            <textarea
                                className="textarea-sleek"
                                value={interceptUrls || ""}
                                onChange={handleInterceptUrlsChange}
                                onInput={handleInterceptUrlsChange}
                                disabled={!enabled}
                                placeholder="example.com, api.*\.com, https://.*\.example\.com/.*"
                                rows={3}
                                style={{ 
                                    width: "100%", 
                                    boxSizing: "border-box",
                                    resize: "vertical",
                                    minHeight: "60px",
                                }}
                            />
                        </div>

                        <div className="compact-spacing" style={{ width: "100%" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "6px",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <label className="label-sleek" style={{ marginBottom: 0, flex: "1 1 auto", minWidth: "150px" }}>
                                    URL Patterns to Block:
                                </label>
                                <button
                                    className="btn-sleek btn-sleek-danger glint-effect"
                                    onClick={() => {
                                        dispatch(update("advanced_block_urls", ""));
                                    }}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: "11px",
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}
                                    title="Clear all block URLs"
                                >
                                    Clear
                                </button>
                            </div>
                            <textarea
                                className="textarea-sleek"
                                value={blockUrls || ""}
                                onChange={handleBlockUrlsChange}
                                onInput={handleBlockUrlsChange}
                                disabled={!enabled}
                                placeholder="ads.example.com, tracking.*"
                                rows={3}
                                style={{ 
                                    width: "100%", 
                                    boxSizing: "border-box",
                                    resize: "vertical",
                                    minHeight: "60px",
                                }}
                            />
                        </div>

                        <div className="compact-spacing" style={{ width: "100%" }}>
                            <label className="label-sleek">
                                Skip N Connections:
                            </label>
                            <input
                                type="text"
                                className="input-sleek"
                                value={skipDomains || ""}
                                onChange={(e) => setSkipDomains(e.target.value)}
                                onInput={(e) => setSkipDomains((e.target as HTMLInputElement).value)}
                                disabled={!enabled}
                                placeholder="example.com:5, api.example.com:10"
                                style={{ 
                                    width: "100%", 
                                    boxSizing: "border-box",
                                }}
                            />
                            <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                                Format: domain:count (e.g., "example.com:5" skips 5, then intercepts)
                            </small>
                        </div>

                        <div style={{ marginTop: "8px", width: "100%" }}>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    width: "100%",
                                }}
                            >
                                <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`}></i> {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </button>
                        </div>

                        {showAdvanced && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "8px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Match Mode:</label>
                                    <select
                                        className="select-sleek"
                                        value={matchMode}
                                        onChange={(e) => setMatchMode(e.target.value)}
                                        disabled={!enabled}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="regex">Regex</option>
                                        <option value="exact">Exact</option>
                                        <option value="contains">Contains</option>
                                    </select>
                                </div>

                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: enabled ? "pointer" : "not-allowed" }}>
                                    <input
                                        type="checkbox"
                                        checked={caseSensitive}
                                        onChange={(e) => setCaseSensitive(e.target.checked)}
                                        disabled={!enabled}
                                    />
                                    <span style={{ fontSize: "12px" }}>Case Sensitive Matching</span>
                                </label>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">HTTP Methods to Intercept (empty = all):</label>
                                    <input
                                        type="text"
                                        className="input-sleek"
                                        value={interceptMethods}
                                        onChange={(e) => setInterceptMethods(e.target.value)}
                                        disabled={!enabled}
                                        placeholder="GET,POST,PUT (empty = all methods)"
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Status Codes to Intercept (empty = all):</label>
                                    <input
                                        type="text"
                                        className="input-sleek"
                                        value={interceptStatusCodes}
                                        onChange={(e) => setInterceptStatusCodes(e.target.value)}
                                        disabled={!enabled}
                                        placeholder="200,404,500 (empty = all codes)"
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Max Intercept Queue Size:</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={maxQueue}
                                        onChange={(e) => setMaxQueue(parseInt(e.target.value) || 100)}
                                        disabled={!enabled}
                                        min={1}
                                        max={10000}
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Auto-Resume After (seconds, 0 = never):</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={autoResume}
                                        onChange={(e) => setAutoResume(parseFloat(e.target.value) || 0)}
                                        disabled={!enabled}
                                        min={0}
                                        step={0.1}
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: enabled ? "pointer" : "not-allowed" }}>
                                    <input
                                        type="checkbox"
                                        checked={logInterceptions}
                                        onChange={(e) => setLogInterceptions(e.target.checked)}
                                        disabled={!enabled}
                                    />
                                    <span style={{ fontSize: "12px" }}>Log Interception Events</span>
                                </label>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Header-Based Interception:</label>
                                    <input
                                        type="text"
                                        className="input-sleek"
                                        value={headerFilters}
                                        onChange={(e) => setHeaderFilters(e.target.value)}
                                        disabled={!enabled}
                                        placeholder="User-Agent:Bot,Content-Type:json"
                                        style={{ width: "100%" }}
                                    />
                                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                                        Format: header:value pairs (comma-separated)
                                    </small>
                                </div>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Body Content Patterns:</label>
                                    <textarea
                                        className="textarea-sleek"
                                        value={bodyPatterns}
                                        onChange={(e) => setBodyPatterns(e.target.value)}
                                        disabled={!enabled}
                                        placeholder=".*password.*,.*token.*"
                                        rows={2}
                                        style={{ width: "100%" }}
                                    />
                                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                                        Regex patterns to match in request body (comma-separated)
                                    </small>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end", width: "100%" }}>
                            <button
                                className="btn-sleek btn-sleek-success glint-effect"
                                onClick={handleSaveRules}
                                style={{
                                    padding: "8px 16px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                }}
                            >
                                💾 Save Rules
                            </button>
                        </div>
                    </div>
                </ModeToggle>
            </div>
        </div>
    );
}
