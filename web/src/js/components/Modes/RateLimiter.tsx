import * as React from "react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import { fetchApi } from "../../utils";
import * as optionsActions from "../../ducks/options";
import { ModeToggle } from "./ModeToggle";

export default function RateLimiter() {
    const dispatch = useAppDispatch();
    
    
    
    const enabled = useAppSelector(
        (state) => {
            try {
                
                if (state == null) return false;
                if (typeof state !== 'object') return false;
                if (!state.options) return false;
                return (state.options as any)?.rate_limit_enabled ?? false;
            } catch {
                return false;
            }
        }
    );
    const rateLimitConfig = useAppSelector(
        (state) => {
            try {
                
                if (state == null) return "";
                if (typeof state !== 'object') return "";
                if (!state.options) return "";
                return (state.options as any)?.rate_limit_config || "";
            } catch {
                return "";
            }
        }
    );
    const connectionPoolConfig = useAppSelector(
        (state) => {
            try {
                
                if (state == null) return "";
                if (typeof state !== 'object') return "";
                if (!state.options) return "";
                return (state.options as any)?.connection_pool_config || "";
            } catch {
                return "";
            }
        }
    );
    const throttleConfig = useAppSelector(
        (state) => {
            try {
                
                if (state == null) return "";
                if (typeof state !== 'object') return "";
                if (!state.options) return "";
                return (state.options as any)?.throttle_config || "";
            } catch {
                return "";
            }
        }
    );
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [rateLimitInput, setRateLimitInput] = useState(rateLimitConfig || "");
    const [poolConfigInput, setPoolConfigInput] = useState(connectionPoolConfig || "");
    const [throttleInput, setThrottleInput] = useState(throttleConfig || "");
    const [globalRateLimit, setGlobalRateLimit] = useState("");
    const [globalThrottle, setGlobalThrottle] = useState(0);
    const [burstConfig, setBurstConfig] = useState("");
    const [queueSizeConfig, setQueueSizeConfig] = useState("");
    const [timeout, setTimeout] = useState(30.0);
    const [logRateLimits, setLogRateLimits] = useState(true);
    const [strategy, setStrategy] = useState("drop");
    const [maxQueue, setMaxQueue] = useState(100);
    const [queueTimeout, setQueueTimeout] = useState(60.0);

    useEffect(() => {
        setRateLimitInput(rateLimitConfig);
        setPoolConfigInput(connectionPoolConfig);
        setThrottleInput(throttleConfig);
    }, [rateLimitConfig, connectionPoolConfig, throttleConfig]);

    const handleSave = async () => {
        try {
            await fetchApi("/options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rate_limit_enabled: enabled,
                    rate_limit_config: rateLimitInput,
                    rate_limit_global: globalRateLimit,
                    connection_pool_config: poolConfigInput,
                    throttle_config: throttleInput,
                    throttle_global: globalThrottle,
                    rate_limit_burst: burstConfig,
                    rate_limit_queue_size: queueSizeConfig,
                    rate_limit_timeout: timeout,
                    rate_limit_log: logRateLimits,
                    rate_limit_strategy: strategy,
                    rate_limit_max_queue: maxQueue,
                    rate_limit_queue_timeout: queueTimeout,
                }),
            });
            alert("Rate limiting configuration saved!");
        } catch (error) {
            console.error("Failed to save rate limiting config:", error);
            alert("Failed to save configuration");
        }
    };

    return (
        <div className="card-sleek" style={{ marginTop: "12px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Connection Pooling & Rate Limiting</h3>
                <ModeToggle
                    value={enabled}
                    label="Enable Rate Limiting"
                    onChange={async (e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        try {
                            await fetchApi("/options", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ rate_limit_enabled: checked }),
                            });
                        } catch (error) {
                            console.error("Failed to update rate limit enabled:", error);
                        }
                    }}
                />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="compact-spacing">
                    <label className="label-sleek">Rate Limit Configuration (per domain):</label>
                    <textarea
                        className="textarea-sleek"
                        rows={3}
                        value={rateLimitInput}
                        onChange={(e) => setRateLimitInput(e.target.value)}
                        placeholder="example.com:10:60, api.example.com:5:30"
                        style={{ width: "100%", resize: "vertical" }}
                    />
                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                        Format: domain:requests:seconds (e.g., "example.com:10:60" = 10 requests per 60 seconds)
                    </small>
                </div>

                <div className="compact-spacing">
                    <label className="label-sleek">Global Rate Limit:</label>
                    <input
                        type="text"
                        className="input-sleek"
                        value={globalRateLimit}
                        onChange={(e) => setGlobalRateLimit(e.target.value)}
                        placeholder="100:60 (100 requests per 60 seconds globally)"
                        style={{ width: "100%" }}
                    />
                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                        Format: requests:seconds (applies to all domains)
                    </small>
                </div>

                <div className="compact-spacing">
                    <label className="label-sleek">Connection Pool Configuration:</label>
                    <textarea
                        className="textarea-sleek"
                        rows={3}
                        value={poolConfigInput}
                        onChange={(e) => setPoolConfigInput(e.target.value)}
                        placeholder="example.com:5, api.example.com:10"
                        style={{ width: "100%", resize: "vertical" }}
                    />
                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                        Format: domain:pool_size (e.g., "example.com:5" = max 5 connections)
                    </small>
                </div>

                <div className="compact-spacing">
                    <label className="label-sleek">Throttle Configuration (per domain):</label>
                    <textarea
                        className="textarea-sleek"
                        rows={3}
                        value={throttleInput}
                        onChange={(e) => setThrottleInput(e.target.value)}
                        placeholder="example.com:100, api.example.com:200"
                        style={{ width: "100%", resize: "vertical" }}
                    />
                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                        Format: domain:delay_ms (e.g., "example.com:100" = 100ms delay per request)
                    </small>
                </div>

                <div className="compact-spacing">
                    <label className="label-sleek">Global Throttle (ms):</label>
                    <input
                        type="number"
                        className="input-sleek"
                        value={globalThrottle}
                        onChange={(e) => setGlobalThrottle(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min={0}
                        step={10}
                        style={{ width: "100%" }}
                    />
                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                        Global delay applied to all requests (milliseconds)
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
                        <div className="compact-spacing">
                            <label className="label-sleek">Burst Allowance:</label>
                            <textarea
                                className="textarea-sleek"
                                rows={2}
                                value={burstConfig}
                                onChange={(e) => setBurstConfig(e.target.value)}
                                placeholder="example.com:5, api.example.com:10"
                                style={{ width: "100%", resize: "vertical" }}
                            />
                            <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                                Format: domain:burst_size (extra requests allowed beyond rate limit)
                            </small>
                        </div>

                        <div className="compact-spacing">
                            <label className="label-sleek">Queue Size (per domain):</label>
                            <textarea
                                className="textarea-sleek"
                                rows={2}
                                value={queueSizeConfig}
                                onChange={(e) => setQueueSizeConfig(e.target.value)}
                                placeholder="example.com:10, api.example.com:20"
                                style={{ width: "100%", resize: "vertical" }}
                            />
                            <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                                Format: domain:size (max queued requests when using queue strategy)
                            </small>
                        </div>

                        <div className="compact-spacing">
                            <label className="label-sleek">Connection Timeout (seconds):</label>
                            <input
                                type="number"
                                className="input-sleek"
                                value={timeout}
                                onChange={(e) => setTimeout(parseFloat(e.target.value) || 30.0)}
                                min={1}
                                max={300}
                                step={1}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="compact-spacing">
                            <label className="label-sleek">Rate Limit Strategy:</label>
                            <select
                                className="select-sleek"
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value)}
                                style={{ width: "100%" }}
                            >
                                <option value="drop">Drop (kill requests)</option>
                                <option value="queue">Queue (queue requests)</option>
                                <option value="delay">Delay (slow down requests)</option>
                            </select>
                        </div>

                        <div className="compact-spacing">
                            <label className="label-sleek">Max Queue Size:</label>
                            <input
                                type="number"
                                className="input-sleek"
                                value={maxQueue}
                                onChange={(e) => setMaxQueue(parseInt(e.target.value) || 100)}
                                min={1}
                                max={10000}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="compact-spacing">
                            <label className="label-sleek">Queue Timeout (seconds):</label>
                            <input
                                type="number"
                                className="input-sleek"
                                value={queueTimeout}
                                onChange={(e) => setQueueTimeout(parseFloat(e.target.value) || 60.0)}
                                min={1}
                                max={300}
                                step={1}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                checked={logRateLimits}
                                onChange={(e) => setLogRateLimits(e.target.checked)}
                            />
                            <span style={{ fontSize: "12px" }}>Log Rate Limit Events</span>
                        </label>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button className="btn-sleek btn-sleek-success glint-effect" onClick={handleSave} style={{ padding: "8px 16px" }}>
                        <i className="fa fa-save"></i> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
