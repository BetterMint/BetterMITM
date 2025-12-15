import * as React from "react";
import { useState } from "react";
import { fetchApi } from "../../utils";

interface RequestData {
    method: string;
    url: string;
    headers: Array<{ key: string; value: string }>;
    body: string;
    bodyType: "none" | "raw" | "json" | "form" | "xml";
}

export default function RequestBuilder() {
    const [requestData, setRequestData] = useState<RequestData>({
        method: "GET",
        url: "",
        headers: [{ key: "", value: "" }],
        body: "",
        bodyType: "none",
    });
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<RequestData[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [timeout, setTimeout] = useState(30000);
    const [followRedirects, setFollowRedirects] = useState(true);
    const [maxRedirects, setMaxRedirects] = useState(5);
    const [verifySSL, setVerifySSL] = useState(false);
    const [saveToHistory, setSaveToHistory] = useState(true);

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE", "CONNECT"];

    const updateHeader = (index: number, field: "key" | "value", value: string) => {
        const newHeaders = [...requestData.headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };
        setRequestData({ ...requestData, headers: newHeaders });
    };

    const addHeader = () => {
        setRequestData({
            ...requestData,
            headers: [...requestData.headers, { key: "", value: "" }],
        });
    };

    const removeHeader = (index: number) => {
        const newHeaders = requestData.headers.filter((_, i) => i !== index);
        setRequestData({ ...requestData, headers: newHeaders });
    };

    const sendRequest = async () => {
        if (!requestData.url.trim()) {
            setError("URL is required");
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const headers: Record<string, string> = {};
            requestData.headers.forEach((h) => {
                if (h.key.trim()) {
                    headers[h.key.trim()] = h.value.trim();
                }
            });

            if (requestData.bodyType === "json" && requestData.body) {
                headers["Content-Type"] = "application/json";
            } else if (requestData.bodyType === "form") {
                headers["Content-Type"] = "application/x-www-form-urlencoded";
            } else if (requestData.bodyType === "xml" && requestData.body) {
                headers["Content-Type"] = "application/xml";
            }

            const response = await fetchApi("/request-builder/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    method: requestData.method,
                    url: requestData.url,
                    headers,
                    body: requestData.bodyType !== "none" ? requestData.body : undefined,
                    timeout,
                    followRedirects,
                    maxRedirects,
                    verifySSL,
                }),
            });

            const result = await response.json();
            setResponse(result);
            if (saveToHistory) {
                setHistory([requestData, ...history.slice(0, 9)]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    const loadFromHistory = (req: RequestData) => {
        setRequestData(req);
    };

    const saveAsTemplate = () => {
        const templates = JSON.parse(localStorage.getItem("requestTemplates") || "[]");
        templates.push({ ...requestData, name: `Template ${templates.length + 1}` });
        localStorage.setItem("requestTemplates", JSON.stringify(templates));
        alert("Template saved!");
    };

    return (
        <div className="request-builder" style={{ 
            padding: "32px", 
            maxWidth: "1920px", 
            margin: "0 auto", 
            height: "calc(100vh - 180px)", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden"
        }}>
            <div className="card-sleek glint-effect" style={{ 
                marginBottom: "24px", 
                padding: "20px", 
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
                flexShrink: 0
            }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <i className="fa fa-paper-plane" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                    Request Builder
                </h2>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Build and send custom HTTP requests with full control over headers, body, and method
                </p>
            </div>

            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "24px", 
                flex: 1, 
                minHeight: 0,
                overflow: "hidden"
            }}>
                {}
                <div className="card-sleek glint-effect" style={{ 
                    padding: "24px", 
                    boxShadow: "var(--shadow-md)", 
                    display: "flex", 
                    flexDirection: "column", 
                    overflow: "hidden"
                }}>
                    <h2 style={{ 
                        marginBottom: "24px", 
                        fontSize: "20px", 
                        fontWeight: "600", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px"
                    }}>
                        <i className="fa fa-edit" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                        Build Request
                    </h2>

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                        <div className="compact-spacing" style={{ marginBottom: "20px" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Method:</label>
                            <select
                                className="select-sleek"
                                value={requestData.method}
                                onChange={(e) => setRequestData({ ...requestData, method: e.target.value })}
                                style={{ width: "150px", padding: "10px" }}
                            >
                                {methods.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="compact-spacing" style={{ marginBottom: "20px" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>URL:</label>
                            <input
                                type="text"
                                className="input-sleek"
                                value={requestData.url}
                                onChange={(e) => setRequestData({ ...requestData, url: e.target.value })}
                                placeholder="https://example.com/api/endpoint"
                                style={{ width: "100%", padding: "10px" }}
                            />
                        </div>

                        <div className="compact-spacing" style={{ marginBottom: "20px" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Headers:</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {requestData.headers.map((header, index) => (
                                    <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        <input
                                            type="text"
                                            className="input-sleek"
                                            value={header.key}
                                            onChange={(e) => updateHeader(index, "key", e.target.value)}
                                            placeholder="Header name"
                                            style={{ flex: 1, padding: "10px" }}
                                        />
                                        <input
                                            type="text"
                                            className="input-sleek"
                                            value={header.value}
                                            onChange={(e) => updateHeader(index, "value", e.target.value)}
                                            placeholder="Header value"
                                            style={{ flex: 1, padding: "10px" }}
                                        />
                                        <button
                                            className="btn-sleek btn-sleek-danger glint-effect"
                                            onClick={() => removeHeader(index)}
                                            style={{ padding: "10px 14px", minWidth: "44px" }}
                                            title="Remove header"
                                        >
                                            <i className="fa fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    className="btn-sleek glint-effect" 
                                    onClick={addHeader} 
                                    style={{ alignSelf: "flex-start", padding: "10px 16px" }}
                                >
                                    <i className="fa fa-plus"></i> Add Header
                                </button>
                            </div>
                        </div>

                        <div className="compact-spacing" style={{ marginBottom: "20px" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Body Type:</label>
                            <select
                                className="select-sleek"
                                value={requestData.bodyType}
                                onChange={(e) => setRequestData({ ...requestData, bodyType: e.target.value as any })}
                                style={{ width: "200px", padding: "10px" }}
                            >
                                <option value="none">None</option>
                                <option value="raw">Raw</option>
                                <option value="json">JSON</option>
                                <option value="form">Form Data</option>
                                <option value="xml">XML</option>
                            </select>
                        </div>

                        {requestData.bodyType !== "none" && (
                            <div className="compact-spacing" style={{ marginBottom: "20px" }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Body:</label>
                                <textarea
                                    className="textarea-sleek"
                                    value={requestData.body}
                                    onChange={(e) => setRequestData({ ...requestData, body: e.target.value })}
                                    placeholder={requestData.bodyType === "json" ? '{"key": "value"}' : "Request body"}
                                    rows={12}
                                    style={{ width: "100%", fontFamily: "monospace", padding: "12px", resize: "vertical" }}
                                />
                            </div>
                        )}

                        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                style={{
                                    padding: "10px 16px",
                                    fontSize: "13px",
                                    width: "100%",
                                }}
                            >
                                <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`}></i> {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </button>
                        </div>

                        {showAdvanced && (
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                gap: "16px", 
                                marginBottom: "20px", 
                                padding: "20px", 
                                backgroundColor: "var(--bg-secondary)", 
                                borderRadius: "10px",
                                border: "1px solid var(--border-color)"
                            }}>
                                <div className="compact-spacing">
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Timeout (ms):</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={timeout}
                                        onChange={(e) => setTimeout(parseInt(e.target.value) || 30000)}
                                        min={1000}
                                        max={300000}
                                        step={1000}
                                        style={{ width: "100%", padding: "10px" }}
                                    />
                                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "6px" }}>
                                        Request timeout in milliseconds (default: 30000)
                                    </small>
                                </div>

                                <div className="compact-spacing">
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={followRedirects}
                                            onChange={(e) => setFollowRedirects(e.target.checked)}
                                        />
                                        <span style={{ fontSize: "13px", fontWeight: "500" }}>Follow Redirects</span>
                                    </label>
                                </div>

                                {followRedirects && (
                                    <div className="compact-spacing">
                                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Max Redirects:</label>
                                        <input
                                            type="number"
                                            className="input-sleek"
                                            value={maxRedirects}
                                            onChange={(e) => setMaxRedirects(parseInt(e.target.value) || 5)}
                                            min={1}
                                            max={20}
                                            style={{ width: "100%", padding: "10px" }}
                                        />
                                        <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "6px" }}>
                                            Maximum number of redirects to follow (default: 5)
                                        </small>
                                    </div>
                                )}

                                <div className="compact-spacing">
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={verifySSL}
                                            onChange={(e) => setVerifySSL(e.target.checked)}
                                        />
                                        <span style={{ fontSize: "13px", fontWeight: "500" }}>Verify SSL Certificate</span>
                                    </label>
                                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "6px" }}>
                                        When unchecked, SSL certificate verification is disabled (useful for testing)
                                    </small>
                                </div>

                                <div className="compact-spacing">
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={saveToHistory}
                                            onChange={(e) => setSaveToHistory(e.target.checked)}
                                        />
                                        <span style={{ fontSize: "13px", fontWeight: "500" }}>Save to History</span>
                                    </label>
                                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "6px" }}>
                                        Automatically save successful requests to history
                                    </small>
                                </div>

                                <div className="compact-spacing">
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Custom User-Agent:</label>
                                    <input
                                        type="text"
                                        className="input-sleek"
                                        value={requestData.headers.find(h => h.key.toLowerCase() === "user-agent")?.value || ""}
                                        onChange={(e) => {
                                            const headers = [...requestData.headers];
                                            const uaIndex = headers.findIndex(h => h.key.toLowerCase() === "user-agent");
                                            if (uaIndex >= 0) {
                                                headers[uaIndex] = { key: "User-Agent", value: e.target.value };
                                            } else {
                                                headers.push({ key: "User-Agent", value: e.target.value });
                                            }
                                            setRequestData({ ...requestData, headers });
                                        }}
                                        placeholder="Mozilla/5.0..."
                                        style={{ width: "100%", padding: "10px" }}
                                    />
                                </div>

                                <div className="compact-spacing">
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Request Charset:</label>
                                    <select
                                        className="select-sleek"
                                        value={requestData.headers.find(h => h.key.toLowerCase() === "content-type")?.value?.includes("charset") ? requestData.headers.find(h => h.key.toLowerCase() === "content-type")?.value.split("charset=")[1]?.split(";")[0] || "utf-8" : "utf-8"}
                                        onChange={(e) => {
                                            const headers = [...requestData.headers];
                                            const ctIndex = headers.findIndex(h => h.key.toLowerCase() === "content-type");
                                            const charset = e.target.value;
                                            if (ctIndex >= 0) {
                                                const ctValue = headers[ctIndex].value;
                                                if (ctValue.includes("charset=")) {
                                                    headers[ctIndex] = { key: "Content-Type", value: ctValue.replace(/charset=[^;]+/, `charset=${charset}`) };
                                                } else {
                                                    headers[ctIndex] = { key: "Content-Type", value: `${ctValue}; charset=${charset}` };
                                                }
                                            }
                                            setRequestData({ ...requestData, headers });
                                        }}
                                        style={{ width: "100%", padding: "10px" }}
                                    >
                                        <option value="utf-8">UTF-8</option>
                                        <option value="utf-16">UTF-16</option>
                                        <option value="iso-8859-1">ISO-8859-1</option>
                                        <option value="windows-1252">Windows-1252</option>
                                    </select>
                                </div>

                                <div className="compact-spacing">
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Compression:</label>
                                    <select
                                        className="select-sleek"
                                        value={requestData.headers.find(h => h.key.toLowerCase() === "accept-encoding")?.value || "none"}
                                        onChange={(e) => {
                                            const headers = [...requestData.headers];
                                            const aeIndex = headers.findIndex(h => h.key.toLowerCase() === "accept-encoding");
                                            if (e.target.value === "none") {
                                                if (aeIndex >= 0) {
                                                    headers.splice(aeIndex, 1);
                                                }
                                            } else {
                                                if (aeIndex >= 0) {
                                                    headers[aeIndex] = { key: "Accept-Encoding", value: e.target.value };
                                                } else {
                                                    headers.push({ key: "Accept-Encoding", value: e.target.value });
                                                }
                                            }
                                            setRequestData({ ...requestData, headers });
                                        }}
                                        style={{ width: "100%", padding: "10px" }}
                                    >
                                        <option value="none">None</option>
                                        <option value="gzip">Gzip</option>
                                        <option value="deflate">Deflate</option>
                                        <option value="br">Brotli</option>
                                        <option value="gzip, deflate, br">All (gzip, deflate, br)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "20px" }}>
                            <button 
                                className="btn-sleek btn-sleek-success glint-effect" 
                                onClick={sendRequest} 
                                disabled={loading}
                                style={{ flex: 1, padding: "12px 20px", fontSize: "14px", fontWeight: "600" }}
                            >
                                <i className="fa fa-paper-plane"></i> {loading ? "Sending..." : "Send Request"}
                            </button>
                            <button 
                                className="btn-sleek glint-effect" 
                                onClick={saveAsTemplate}
                                style={{ padding: "12px 20px", fontSize: "14px" }}
                            >
                                <i className="fa fa-save"></i> Save Template
                            </button>
                        </div>
                    </div>
                </div>

                {}
                <div className="card-sleek glint-effect" style={{ 
                    padding: "24px", 
                    boxShadow: "var(--shadow-md)", 
                    display: "flex", 
                    flexDirection: "column", 
                    overflow: "hidden"
                }}>
                    {error && (
                        <div className="glint-effect" style={{ 
                            padding: "20px", 
                            marginBottom: "20px", 
                            backgroundColor: "rgba(220, 53, 69, 0.1)", 
                            border: "2px solid var(--accent-danger)", 
                            borderRadius: "10px", 
                            boxShadow: "var(--shadow-md)" 
                        }}>
                            <h3 style={{ 
                                color: "var(--accent-danger)", 
                                marginBottom: "12px", 
                                fontSize: "18px", 
                                fontWeight: "600", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "10px" 
                            }}>
                                <i className="fa fa-exclamation-circle" style={{ fontSize: "20px" }}></i> Error
                            </h3>
                            <p style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.6" }}>{error}</p>
                        </div>
                    )}

                    {response && (
                        <div style={{ marginBottom: "24px", flexShrink: 0 }}>
                            <h3 style={{ 
                                marginBottom: "20px", 
                                fontSize: "20px", 
                                fontWeight: "600", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "10px" 
                            }}>
                                <i className="fa fa-check-circle" style={{ 
                                    color: response.status >= 200 && response.status < 300 ? "var(--accent-secondary)" : response.status >= 400 ? "var(--accent-danger)" : "var(--accent-warning)", 
                                    fontSize: "22px" 
                                }}></i>
                                Response
                            </h3>
                            <div style={{ marginBottom: "16px", padding: "14px", backgroundColor: "var(--bg-secondary)", borderRadius: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>Status:</span>
                                    <span style={{ 
                                        padding: "8px 14px", 
                                        backgroundColor: response.status >= 200 && response.status < 300 ? "var(--accent-secondary)" : response.status >= 400 ? "var(--accent-danger)" : "var(--accent-warning)", 
                                        color: "white", 
                                        borderRadius: "8px", 
                                        fontWeight: "600", 
                                        fontSize: "14px" 
                                    }}>
                                        {response.status} {response.statusText}
                                    </span>
                                </div>
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <strong style={{ fontSize: "14px", fontWeight: "600" }}>Headers:</strong>
                                    <button 
                                        className="btn-sleek glint-effect" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(response.headers, null, 2));
                                        }} 
                                        style={{ padding: "6px 12px", fontSize: "12px" }}
                                    >
                                        <i className="fa fa-copy"></i> Copy
                                    </button>
                                </div>
                                <pre style={{ 
                                    backgroundColor: "var(--bg-secondary)", 
                                    padding: "14px", 
                                    borderRadius: "10px", 
                                    overflow: "auto", 
                                    maxHeight: "200px", 
                                    fontSize: "12px", 
                                    fontFamily: "monospace", 
                                    border: "1px solid var(--border-color)",
                                    margin: 0
                                }}>
                                    {JSON.stringify(response.headers, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <strong style={{ fontSize: "14px", fontWeight: "600" }}>Body:</strong>
                                    <button 
                                        className="btn-sleek glint-effect" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(typeof response.body === "string" ? response.body : JSON.stringify(response.body, null, 2));
                                        }} 
                                        style={{ padding: "6px 12px", fontSize: "12px" }}
                                    >
                                        <i className="fa fa-copy"></i> Copy
                                    </button>
                                </div>
                                <pre style={{ 
                                    backgroundColor: "var(--bg-secondary)", 
                                    padding: "14px", 
                                    borderRadius: "10px", 
                                    overflow: "auto", 
                                    maxHeight: "400px", 
                                    fontSize: "12px", 
                                    fontFamily: "monospace", 
                                    border: "1px solid var(--border-color)", 
                                    whiteSpace: "pre-wrap", 
                                    wordBreak: "break-word",
                                    margin: 0
                                }}>
                                    {typeof response.body === "string" ? response.body : JSON.stringify(response.body, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {history.length > 0 && (
                        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 }}>
                                <h3 style={{ 
                                    fontSize: "20px", 
                                    fontWeight: "600", 
                                    margin: 0, 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "10px" 
                                }}>
                                    <i className="fa fa-history" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                                    Request History
                                </h3>
                                <button 
                                    className="btn-sleek glint-effect" 
                                    onClick={() => setHistory([])} 
                                    style={{ padding: "8px 14px", fontSize: "13px" }}
                                >
                                    <i className="fa fa-trash"></i> Clear
                                </button>
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
                                {history.map((req, index) => (
                                    <div
                                        key={index}
                                        className="glint-effect"
                                        style={{
                                            padding: "14px",
                                            backgroundColor: "var(--bg-secondary)",
                                            borderRadius: "10px",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            border: "2px solid var(--border-color)",
                                            transition: "all 0.2s",
                                        }}
                                        onClick={() => loadFromHistory(req)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                            e.currentTarget.style.borderColor = "var(--accent-primary)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                            e.currentTarget.style.borderColor = "var(--border-color)";
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                                <span style={{ 
                                                    padding: "6px 12px", 
                                                    backgroundColor: "var(--accent-primary)", 
                                                    color: "white", 
                                                    borderRadius: "6px", 
                                                    fontSize: "12px", 
                                                    fontWeight: "600" 
                                                }}>
                                                    {req.method}
                                                </span>
                                                <span style={{ 
                                                    fontSize: "13px", 
                                                    fontFamily: "monospace", 
                                                    overflow: "hidden", 
                                                    textOverflow: "ellipsis", 
                                                    whiteSpace: "nowrap" 
                                                }}>
                                                    {req.url}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                                {req.headers.length} header{req.headers.length !== 1 ? "s" : ""} | {req.bodyType !== "none" ? `${req.bodyType} body` : "no body"}
                                            </div>
                                        </div>
                                        <button 
                                            className="btn-sleek glint-effect" 
                                            style={{ padding: "8px 14px", fontSize: "12px", marginLeft: "12px" }}
                                        >
                                            <i className="fa fa-arrow-left"></i> Load
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!error && !response && history.length === 0 && (
                        <div style={{ 
                            flex: 1, 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "center", 
                            justifyContent: "center",
                            color: "var(--text-secondary)",
                            textAlign: "center",
                            padding: "40px"
                        }}>
                            <i className="fa fa-paper-plane" style={{ fontSize: "64px", opacity: 0.3, marginBottom: "16px" }}></i>
                            <p style={{ fontSize: "16px", fontWeight: "500", margin: 0 }}>Send a request to see the response here</p>
                            <p style={{ fontSize: "13px", marginTop: "8px", margin: 0 }}>Request history will appear below</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
