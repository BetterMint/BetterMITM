import * as React from "react";
import { useState, useEffect } from "react";
import { fetchApi } from "../../utils";
import CodeEditor from "../contentviews/CodeEditor";
import { SyntaxHighlight } from "../../backends/consts";

interface Script {
    id?: string;
    name: string;
    language: "javascript" | "python";
    code: string;
    enabled: boolean;
    trigger: "request" | "response" | "both";
    priority?: number;
    timeout?: number;
    retry_on_error?: boolean;
    retry_count?: number;
    log_output?: boolean;
    condition?: {
        type: "url" | "method" | "header" | "domain";
        operator?: "equals" | "contains" | "matches";
        value: string;
    };
    error_handling?: "continue" | "stop" | "retry";
}

export default function ScriptsView() {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentScript, setCurrentScript] = useState<Script>({
        name: "",
        language: "javascript",
        code: "",
        enabled: true,
        trigger: "both",
        priority: 0,
        timeout: 5000,
        retry_on_error: false,
        retry_count: 0,
        log_output: true,
        error_handling: "continue",
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [output, setOutput] = useState<string>("");
    const [selectedScript, setSelectedScript] = useState<string | null>(null);
    const [showApiDocs, setShowApiDocs] = useState(true);

    useEffect(() => {
        fetchApi("/scripts")
            .then((res) => res.json())
            .then((data) => setScripts(data || []))
            .catch((err) => console.error("Failed to load scripts:", err));
    }, []);

    const saveScript = async () => {
        if (!currentScript.name.trim()) {
            alert("Script name is required");
            return;
        }
        try {
            const response = await fetchApi("/scripts", {
                method: editingIndex !== null ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentScript,
                    id: editingIndex !== null ? scripts[editingIndex].id : undefined,
                }),
            });

            if (response.ok) {
                const saved = await response.json();
                if (editingIndex !== null) {
                    const newScripts = [...scripts];
                    newScripts[editingIndex] = saved;
                    setScripts(newScripts);
                } else {
                    setScripts([...scripts, saved]);
                }
                setCurrentScript({
                    name: "",
                    language: "javascript",
                    code: "",
                    enabled: true,
                    trigger: "both",
                    priority: 0,
                    timeout: 5000,
                    retry_on_error: false,
                    retry_count: 0,
                    log_output: true,
                    error_handling: "continue",
                });
                setEditingIndex(null);
                setOutput("");
            }
        } catch (error) {
            console.error("Failed to save script:", error);
            alert("Failed to save script");
        }
    };

    const testScript = async () => {
        if (!currentScript.code.trim()) {
            alert("Please enter some code to test");
            return;
        }
        try {
            const response = await fetchApi("/scripts/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentScript),
            });
            const result = await response.json();
            setOutput(result.output || result.error || "No output");
        } catch (error: any) {
            setOutput(`Error: ${error.message}`);
        }
    };

    const loadScript = (script: Script, index: number) => {
        setCurrentScript(script);
        setEditingIndex(index);
        setSelectedScript(script.id || index.toString());
        setOutput("");
    };

    return (
        <div className="scripts-view" style={{ 
            padding: "20px", 
            maxWidth: "100%", 
            margin: "0 auto", 
            height: "calc(100vh - 180px)", 
            overflow: "hidden",
            gap: "20px"
        }}>
            {}
            <div className="card-sleek glint-effect" style={{ 
                padding: "20px", 
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", 
                flexShrink: 0,
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                animation: "fadeIn 0.3s ease-in",
                marginBottom: "20px"
            }}>
                <h2 style={{ 
                    fontSize: "clamp(20px, 2.5vw, 28px)", 
                    fontWeight: "700", 
                    margin: 0, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}>
                    <i className="fa fa-code" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                    Scriptable Interception
                </h2>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                    Write custom JavaScript or Python scripts to control interception logic dynamically
                </p>
            </div>

            {}
            <div className="scripts-main-content" style={{
                flex: 1,
                minHeight: 0,
                overflow: "visible"
            }}>
                {}
                <div className="scripts-sidebar card-sleek glint-effect" style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: "12px",
                    animation: "slideInLeft 0.4s ease-out"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 }}>
                        <h3 style={{ fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                            <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                            Scripts
                        </h3>
                        <span style={{ padding: "8px 16px", backgroundColor: "var(--bg-tertiary)", borderRadius: "12px", fontSize: "14px", fontWeight: "600", color: "var(--accent-primary)" }}>
                            {scripts.length}
                        </span>
                    </div>
                    <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        paddingRight: "8px"
                    }}>
                        {scripts.length === 0 ? (
                            <div style={{ 
                                textAlign: "center", 
                                padding: "clamp(30px, 6vw, 60px)", 
                                color: "var(--text-secondary)",
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                animation: "fadeIn 0.5s ease-in"
                            }}>
                                <i className="fa fa-code" style={{ fontSize: "clamp(40px, 8vw, 64px)", opacity: 0.3, marginBottom: "20px" }}></i>
                                <p style={{ fontSize: "clamp(14px, 2vw, 16px)", fontWeight: "500" }}>No scripts saved yet</p>
                                <p style={{ fontSize: "clamp(12px, 1.5vw, 14px)", marginTop: "8px" }}>Create your first script in the editor</p>
                            </div>
                        ) : (
                            scripts.map((script, index) => (
                                <button
                                    key={index}
                                    className={`btn-sleek glint-effect ${selectedScript === (script.id || index.toString()) ? "btn-sleek-success" : ""}`}
                                    onClick={() => loadScript(script, index)}
                                    style={{
                                        textAlign: "left",
                                        padding: "16px",
                                        borderRadius: "12px",
                                        border: selectedScript === (script.id || index.toString()) ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                        backgroundColor: selectedScript === (script.id || index.toString()) ? "var(--bg-secondary)" : "transparent",
                                        transition: "all 0.3s ease",
                                        animation: `fadeIn 0.3s ease-in ${index * 0.05}s both`
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedScript !== (script.id || index.toString())) {
                                            e.currentTarget.style.transform = "translateX(4px)";
                                            e.currentTarget.style.borderColor = "var(--accent-primary)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedScript !== (script.id || index.toString())) {
                                            e.currentTarget.style.transform = "translateX(0)";
                                            e.currentTarget.style.borderColor = "var(--border-color)";
                                        }
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                                        <i className={`fa fa-${script.language === "javascript" ? "js" : "python"}`} style={{ fontSize: "18px", color: "var(--accent-primary)" }}></i>
                                        <strong style={{ fontSize: "15px", fontWeight: "600" }}>{script.name}</strong>
                                        {script.enabled && (
                                            <span style={{ padding: "4px 8px", backgroundColor: "var(--accent-secondary)", color: "white", borderRadius: "10px", fontSize: "10px", fontWeight: "600", animation: "pulse 2s infinite" }}>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
                                        <span><i className="fa fa-tag"></i> {script.language}</span>
                                        <span><i className="fa fa-bolt"></i> {script.trigger}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {}
                <div className="scripts-editor-panel card-sleek glint-effect" style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    overflow: "hidden",
                    borderRadius: "12px",
                    animation: "fadeIn 0.5s ease-out"
                }}>
                    <h3 style={{ fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <i className="fa fa-edit" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                        {editingIndex !== null ? "Edit Script" : "Create Script"}
                    </h3>
                    
                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px", marginBottom: "16px" }}>
                        <div className="scripts-form-grid">
                            <div className="scripts-form-field">
                                <label className="label-sleek">Name:</label>
                                <input
                                    type="text"
                                    className="input-sleek"
                                    value={currentScript.name}
                                    onChange={(e) => setCurrentScript({ ...currentScript, name: e.target.value })}
                                    placeholder="My Script"
                                />
                            </div>
                            <div className="scripts-form-field">
                                <label className="label-sleek">Language:</label>
                                <select
                                    className="select-sleek"
                                    value={currentScript.language}
                                    onChange={(e) => setCurrentScript({ ...currentScript, language: e.target.value as any })}
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                </select>
                            </div>
                            <div className="scripts-form-field">
                                <label className="label-sleek">Trigger:</label>
                                <select
                                    className="select-sleek"
                                    value={currentScript.trigger}
                                    onChange={(e) => setCurrentScript({ ...currentScript, trigger: e.target.value as any })}
                                >
                                    <option value="request">Request</option>
                                    <option value="response">Response</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                style={{
                                    padding: "10px 16px",
                                    fontSize: "13px",
                                    width: "100%",
                                    borderRadius: "8px",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`}></i> {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="scripts-advanced-panel">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Priority:</label>
                                        <input
                                            type="number"
                                            className="input-sleek"
                                            value={currentScript.priority || 0}
                                            onChange={(e) => setCurrentScript({ ...currentScript, priority: parseInt(e.target.value) || 0 })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Timeout (ms):</label>
                                        <input
                                            type="number"
                                            className="input-sleek"
                                            value={currentScript.timeout || 5000}
                                            onChange={(e) => setCurrentScript({ ...currentScript, timeout: parseInt(e.target.value) || 5000 })}
                                            min={100}
                                            max={60000}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Error Handling:</label>
                                    <select
                                        className="select-sleek"
                                        value={currentScript.error_handling || "continue"}
                                        onChange={(e) => setCurrentScript({ ...currentScript, error_handling: e.target.value as any })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                    >
                                        <option value="continue">Continue (ignore errors)</option>
                                        <option value="stop">Stop (halt execution)</option>
                                        <option value="retry">Retry on Error</option>
                                    </select>
                                </div>

                                {currentScript.error_handling === "retry" && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Retry Count:</label>
                                            <input
                                                type="number"
                                                className="input-sleek"
                                                value={currentScript.retry_count || 0}
                                                onChange={(e) => setCurrentScript({ ...currentScript, retry_count: parseInt(e.target.value) || 0 })}
                                                min={0}
                                                max={10}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Retry Delay (ms):</label>
                                            <input
                                                type="number"
                                                className="input-sleek"
                                                value={(currentScript as any).retry_delay || 1000}
                                                onChange={(e) => setCurrentScript({ ...currentScript, retry_delay: parseInt(e.target.value) || 1000 } as any)}
                                                min={100}
                                                max={10000}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={currentScript.retry_on_error || false}
                                            onChange={(e) => setCurrentScript({ ...currentScript, retry_on_error: e.target.checked })}
                                            style={{ width: "18px", height: "18px" }}
                                        />
                                        <span style={{ fontSize: "13px" }}>Retry on Error</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={currentScript.log_output !== false}
                                            onChange={(e) => setCurrentScript({ ...currentScript, log_output: e.target.checked })}
                                            style={{ width: "18px", height: "18px" }}
                                        />
                                        <span style={{ fontSize: "13px" }}>Log Script Output</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: "16px", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", flexShrink: 0 }}>Code:</label>
                            <div style={{ border: "2px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", flex: 1, minHeight: "400px" }}>
                                <CodeEditor
                                    initialContent={currentScript.code}
                                    onChange={(code) => setCurrentScript({ ...currentScript, code })}
                                    language={currentScript.language === "javascript" ? SyntaxHighlight.JAVASCRIPT : null}
                                    showControls={true}
                                />
                            </div>
                        </div>

                        {output && (
                            <div className="scripts-output-panel glint-effect">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <strong style={{ fontSize: "14px", fontWeight: "600" }}>Output:</strong>
                                    <button className="btn-sleek" onClick={() => setOutput("")} style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px" }}>
                                        <i className="fa fa-times"></i>
                                    </button>
                                </div>
                                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "12px", fontFamily: "monospace", lineHeight: "1.6" }}>{output}</pre>
                            </div>
                        )}
                    </div>

                    <div className="scripts-actions">
                        <button 
                            className="btn-sleek btn-sleek-success glint-effect" 
                            onClick={saveScript} 
                            style={{ 
                                flex: 1, 
                                padding: "14px 24px", 
                                fontSize: "15px",
                                fontWeight: "600",
                                borderRadius: "10px",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            <i className="fa fa-save"></i> {editingIndex !== null ? "Update" : "Save"} Script
                        </button>
                        <button 
                            className="btn-sleek glint-effect" 
                            onClick={testScript} 
                            style={{ 
                                padding: "14px 24px", 
                                fontSize: "15px",
                                borderRadius: "10px",
                                transition: "all 0.3s ease"
                            }}
                        >
                            <i className="fa fa-play"></i> Test
                        </button>
                        {editingIndex !== null && (
                            <button 
                                className="btn-sleek glint-effect" 
                                onClick={() => {
                                    setEditingIndex(null);
                                    setCurrentScript({ name: "", language: "javascript", code: "", enabled: true, trigger: "both" });
                                    setSelectedScript(null);
                                    setOutput("");
                                }} 
                                style={{ 
                                    padding: "14px 24px", 
                                    fontSize: "15px",
                                    borderRadius: "10px",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <i className="fa fa-times"></i> Cancel
                            </button>
                        )}
                    </div>
                </div>

                {}
                <div className="scripts-api-panel card-sleek glint-effect" style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: "12px",
                    animation: "slideInRight 0.4s ease-out"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 }}>
                        <h3 style={{ fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                            <i className="fa fa-book" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                            API Reference
                        </h3>
                        <button
                            className="btn-sleek glint-effect"
                            onClick={() => setShowApiDocs(!showApiDocs)}
                            style={{ padding: "8px 14px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                        >
                            <i className={`fa fa-${showApiDocs ? "chevron-up" : "chevron-down"}`}></i>
                        </button>
                    </div>
                    
                    {showApiDocs && (
                        <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: "16px",
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                            paddingRight: "8px"
                        }}>
                            {[
                                { title: "flow Object", icon: "code", items: [
                                    { code: "flow", desc: "The current HTTP flow" },
                                    { code: "flow.id", desc: "Unique flow identifier" },
                                    { code: "flow.type", desc: 'Flow type: "http", "tcp", "udp", "dns"' },
                                    { code: "flow.timestamp_created", desc: "Creation timestamp" },
                                    { code: "flow.intercepted", desc: "Check if flow is intercepted (boolean)" },
                                    { code: "flow.live", desc: "Check if flow is live (boolean)" },
                                    { code: "flow.killable", desc: "Check if flow can be killed (boolean)" },
                                    { code: "flow.marked", desc: "Flow marker/emoji (string)" },
                                    { code: "flow.comment", desc: "Flow comment (string)" }
                                ]},
                                { title: "flow.request", icon: "arrow-right", items: [
                                    { code: "flow.request.method", desc: "HTTP method (GET, POST, etc.)" },
                                    { code: "flow.request.url", desc: "Full request URL (string)" },
                                    { code: "flow.request.scheme", desc: 'URL scheme: "http" or "https"' },
                                    { code: "flow.request.host", desc: "Request host (string)" },
                                    { code: "flow.request.port", desc: "Request port (number)" },
                                    { code: "flow.request.path", desc: "Request path (string)" },
                                    { code: "flow.request.http_version", desc: 'HTTP version: "HTTP/1.1", "HTTP/2"' },
                                    { code: "flow.request.headers", desc: "Request headers (object/dict)" },
                                    { code: "flow.request.content", desc: "Request body content (bytes)" },
                                    { code: "flow.request.text", desc: "Request body as text (string)" },
                                    { code: "flow.request.json", desc: "Request body as JSON (object)" },
                                    { code: "flow.request.pretty_host", desc: "Hostname (string)" }
                                ]},
                                { title: "flow.response", icon: "arrow-left", items: [
                                    { code: "flow.response.status_code", desc: "HTTP status code (number)" },
                                    { code: "flow.response.reason", desc: "Status reason phrase (string)" },
                                    { code: "flow.response.http_version", desc: "HTTP version (string)" },
                                    { code: "flow.response.headers", desc: "Response headers (object/dict)" },
                                    { code: "flow.response.content", desc: "Response body content (bytes)" },
                                    { code: "flow.response.text", desc: "Response body as text (string)" },
                                    { code: "flow.response.json", desc: "Response body as JSON (object)" }
                                ]},
                                { title: "Connection Objects", icon: "plug", items: [
                                    { code: "flow.client_conn.address", desc: "Client IP address [host, port]" },
                                    { code: "flow.client_conn.tls_established", desc: "TLS established (boolean)" },
                                    { code: "flow.server_conn.address", desc: "Server IP address [host, port]" },
                                    { code: "flow.server_conn.tls_established", desc: "TLS established (boolean)" },
                                    { code: "flow.server_conn.sni", desc: "Server Name Indication (string)" }
                                ]},
                                { title: "Flow Modification", icon: "edit", items: [
                                    { code: "flow.request.method = 'POST'", desc: "Change HTTP method" },
                                    { code: "flow.request.url = 'https://...'", desc: "Change URL" },
                                    { code: "flow.request.headers['X-Custom'] = 'value'", desc: "Add/modify header" },
                                    { code: "flow.request.content = 'new body'", desc: "Set body as string" },
                                    { code: "flow.request.json = {key: 'value'}", desc: "Set body as JSON" },
                                    { code: "flow.response.status_code = 200", desc: "Change status code" },
                                    { code: "flow.response.headers['X-Custom'] = 'value'", desc: "Add/modify response header" },
                                    { code: "flow.response.content = 'new body'", desc: "Set response body" },
                                    { code: "flow.intercept()", desc: "Pause flow for manual review" },
                                    { code: "flow.kill()", desc: "Kill/block the flow" },
                                    { code: "flow.resume()", desc: "Resume intercepted flow" },
                                    { code: "flow.marked = '🔴'", desc: "Set flow marker" },
                                    { code: "flow.comment = 'Important'", desc: "Set flow comment" }
                                ]},
                                { title: "Utility Functions", icon: "wrench", items: [
                                    { code: "console.log(message, data)", desc: "Log message" },
                                    { code: "console.error(error)", desc: "Log error" },
                                    { code: "console.warn(warning)", desc: "Log warning" },
                                    { code: "console.debug(debug)", desc: "Log debug info" },
                                    { code: "fetch(url, options)", desc: "Make HTTP request" },
                                    { code: "crypto.createHash('sha256')", desc: "Create hash" },
                                    { code: "crypto.randomBytes(32)", desc: "Generate random bytes" },
                                    { code: "JSON.parse(jsonString)", desc: "Parse JSON" },
                                    { code: "JSON.stringify(object)", desc: "Stringify object" },
                                    { code: "new URL(url)", desc: "Parse URL" },
                                    { code: "Buffer.from(text).toString('base64')", desc: "Encode to base64" },
                                    { code: "string.match(/pattern/)", desc: "Match regex" },
                                    { code: "string.replace(/pattern/, 'new')", desc: "Replace regex" }
                                ]},
                                { title: "Advanced API Functions", icon: "rocket", items: [
                                    { code: "flow.request.addHeader(name, value)", desc: "Add header (alternative)" },
                                    { code: "flow.request.removeHeader(name)", desc: "Remove header" },
                                    { code: "flow.request.hasHeader(name)", desc: "Check if header exists" },
                                    { code: "flow.request.getHeader(name)", desc: "Get header value" },
                                    { code: "flow.request.getContentType()", desc: "Get content type" },
                                    { code: "flow.request.setContentType(type)", desc: "Set content type" },
                                    { code: "flow.request.isJSON()", desc: "Check if content is JSON" },
                                    { code: "flow.request.getJSON()", desc: "Get JSON (returns null if invalid)" },
                                    { code: "flow.request.setJSON(obj)", desc: "Set JSON body" },
                                    { code: "flow.request.getQueryParams()", desc: "Get query parameters as object" },
                                    { code: "flow.request.setQueryParam(key, value)", desc: "Set query parameter" },
                                    { code: "flow.response.addHeader(name, value)", desc: "Add response header" },
                                    { code: "flow.response.removeHeader(name)", desc: "Remove response header" },
                                    { code: "flow.response.hasHeader(name)", desc: "Check if response header exists" },
                                    { code: "flow.response.getHeader(name)", desc: "Get response header value" },
                                    { code: "flow.response.isSuccess()", desc: "Check if status is 2xx" },
                                    { code: "flow.response.isClientError()", desc: "Check if status is 4xx" },
                                    { code: "flow.response.isServerError()", desc: "Check if status is 5xx" },
                                    { code: "flow.getDuration()", desc: "Get flow duration in milliseconds" },
                                    { code: "flow.getSize()", desc: "Get total flow size in bytes" },
                                    { code: "flow.isSecure()", desc: "Check if flow uses HTTPS/TLS" }
                                ]},
                                { title: "ctx (Context)", icon: "cog", items: [
                                    { code: "ctx.log(message)", desc: "Log a message" },
                                    { code: "ctx.flows", desc: "Access all flows" },
                                    { code: "ctx.options", desc: "Access BetterMITM options" }
                                ]},
                                { title: "Examples", icon: "lightbulb-o", isCode: true, code: `// Example 1: Add Authentication Header
if (flow.request.host === "api.example.com") {
    flow.request.headers["Authorization"] = "Bearer " + getToken();
}

// Example 2: Modify JSON Request Body
if (flow.request.headers["content-type"]?.includes("json")) {
    const body = flow.request.json;
    body.userId = "12345";
    body.timestamp = Date.now();
    flow.request.json = body;
}

// Example 3: Block Specific URLs
const blockedPatterns = [/\\/admin/, /\\/private/];
if (blockedPatterns.some(pattern => pattern.test(flow.request.path))) {
    flow.kill();
    console.log("Blocked:", flow.request.url);
}

// Example 4: Modify Response Based on Status
if (flow.response.status_code >= 500) {
    flow.response.status_code = 200;
    flow.response.json = {error: false, message: "Handled server error"};
}

// Example 5: Rate Limiting
const rateLimiter = new Map();
const maxRequests = 10;
const windowMs = 60000; // 1 minute
const key = flow.client_conn.address[0];
const now = Date.now();
const requests = rateLimiter.get(key) || [];
const recent = requests.filter(time => now - time < windowMs);
if (recent.length >= maxRequests) {
    flow.kill();
    console.log("Rate limit exceeded for", key);
} else {
    recent.push(now);
    rateLimiter.set(key, recent);
}` }
                            ].map((section, idx) => (
                                <div key={idx} style={{ 
                                    padding: "16px", 
                                    backgroundColor: "var(--bg-secondary)", 
                                    borderRadius: "12px", 
                                    border: "1px solid var(--border-color)",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.3s ease-in ${idx * 0.1}s both`
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-primary)"}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                                >
                                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <i className={`fa fa-${section.icon}`}></i> {section.title}
                                    </div>
                                    {section.isCode ? (
                                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                                            {section.code}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.7" }}>
                                            {section.items?.map((item, i) => (
                                                <div key={i} style={{ marginBottom: "8px" }}>
                                                    <code style={{ color: "var(--accent-primary)", fontWeight: "600" }}>{item.code}</code> - {item.desc}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {editingIndex !== null && scripts[editingIndex] && (
                                <>
                                    <div style={{ marginTop: "8px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "12px" }}>
                                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: "600" }}>Script Details</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {[
                                                { label: "Status", value: scripts[editingIndex].enabled ? "Enabled" : "Disabled", color: scripts[editingIndex].enabled ? "var(--accent-secondary)" : "var(--text-secondary)" },
                                                { label: "Language", value: scripts[editingIndex].language },
                                                { label: "Trigger", value: scripts[editingIndex].trigger }
                                            ].map((detail, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{detail.label}:</span>
                                                    <span style={{ fontSize: "13px", fontWeight: "600", color: detail.color || "var(--text-primary)" }}>{detail.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <button
                                            className={`btn-sleek glint-effect ${scripts[editingIndex].enabled ? "" : "btn-sleek-success"}`}
                                            onClick={async () => {
                                                const updated = { ...scripts[editingIndex], enabled: !scripts[editingIndex].enabled };
                                                await fetchApi(`/scripts/${scripts[editingIndex].id || editingIndex}`, {
                                                    method: "PUT",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify(updated),
                                                });
                                                const newScripts = [...scripts];
                                                newScripts[editingIndex] = updated;
                                                setScripts(newScripts);
                                            }}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", transition: "all 0.3s ease" }}
                                        >
                                            <i className={`fa fa-${scripts[editingIndex].enabled ? "pause" : "play"}`}></i> {scripts[editingIndex].enabled ? "Disable" : "Enable"} Script
                                        </button>
                                        <button
                                            className="btn-sleek btn-sleek-danger glint-effect"
                                            onClick={async () => {
                                                if (confirm(`Delete script "${scripts[editingIndex].name}"?`)) {
                                                    await fetchApi(`/scripts/${scripts[editingIndex].id || editingIndex}`, { method: "DELETE" });
                                                    setScripts(scripts.filter((_, i) => i !== editingIndex));
                                                    setEditingIndex(null);
                                                    setCurrentScript({ name: "", language: "javascript", code: "", enabled: true, trigger: "both" });
                                                    setSelectedScript(null);
                                                }
                                            }}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", transition: "all 0.3s ease" }}
                                        >
                                            <i className="fa fa-trash"></i> Delete Script
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @media (max-width: 1024px) {
                    div[style*="gridTemplateColumns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
