import * as React from "react";
import { useState } from "react";
import { fetchApi } from "../../utils";

interface MockResponse {
    id?: string;
    name: string;
    pattern: string;
    statusCode: number;
    headers: Array<{ key: string; value: string }>;
    body: string;
    bodyType: "json" | "html" | "xml" | "text" | "raw";
    enabled: boolean;
    priority?: number;
    matchMode?: "regex" | "exact" | "contains";
    delay?: number;
    conditions?: Array<{ type: "method" | "header" | "body"; key?: string; value: string; operator: "equals" | "contains" | "matches" }>;
}

export default function MockResponseCreator() {
    const [responses, setResponses] = useState<MockResponse[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentResponse, setCurrentResponse] = useState<MockResponse>({
        name: "",
        pattern: "",
        statusCode: 200,
        headers: [{ key: "Content-Type", value: "application/json" }],
        body: "",
        bodyType: "json",
        enabled: true,
        priority: 0,
        matchMode: "regex",
        delay: 0,
        conditions: [],
    });

    const statusCodes = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];

    const updateHeader = (index: number, field: "key" | "value", value: string) => {
        const newHeaders = [...currentResponse.headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };
        setCurrentResponse({ ...currentResponse, headers: newHeaders });
    };

    const addHeader = () => {
        setCurrentResponse({
            ...currentResponse,
            headers: [...currentResponse.headers, { key: "", value: "" }],
        });
    };

    const removeHeader = (index: number) => {
        const newHeaders = currentResponse.headers.filter((_, i) => i !== index);
        setCurrentResponse({ ...currentResponse, headers: newHeaders });
    };

    const saveResponse = async () => {
        if (!currentResponse.name || !currentResponse.pattern) {
            alert("Name and pattern are required");
            return;
        }

        try {
            const response = await fetchApi("/mock-responses", {
                method: editingIndex !== null ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentResponse,
                    id: editingIndex !== null ? responses[editingIndex].id : undefined,
                }),
            });

            if (response.ok) {
                const saved = await response.json();
                if (editingIndex !== null) {
                    const newResponses = [...responses];
                    newResponses[editingIndex] = saved;
                    setResponses(newResponses);
                } else {
                    setResponses([...responses, saved]);
                }
                setCurrentResponse({
                    name: "",
                    pattern: "",
                    statusCode: 200,
                    headers: [{ key: "Content-Type", value: "application/json" }],
                    body: "",
                    bodyType: "json",
                    enabled: true,
                    priority: 0,
                    matchMode: "regex",
                    delay: 0,
                    conditions: [],
                });
                setEditingIndex(null);
            }
        } catch (error) {
            console.error("Failed to save mock response:", error);
            alert("Failed to save mock response");
        }
    };

    const deleteResponse = async (index: number) => {
        const response = responses[index];
        if (!response.id) {
            setResponses(responses.filter((_, i) => i !== index));
            return;
        }

        try {
            await fetchApi(`/mock-responses/${response.id}`, { method: "DELETE" });
            setResponses(responses.filter((_, i) => i !== index));
        } catch (error) {
            console.error("Failed to delete mock response:", error);
        }
    };

    const editResponse = (index: number) => {
        setCurrentResponse(responses[index]);
        setEditingIndex(index);
    };

    const toggleEnabled = async (index: number) => {
        const response = responses[index];
        const updated = { ...response, enabled: !response.enabled };
        try {
            await fetchApi(`/mock-responses/${response.id || index}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            const newResponses = [...responses];
            newResponses[index] = updated;
            setResponses(newResponses);
        } catch (error) {
            console.error("Failed to update mock response:", error);
        }
    };

    const [autoGenerate, setAutoGenerate] = useState(false);
    const [pattern, setPattern] = useState("");

    React.useEffect(() => {
        fetchApi("/mock-responses")
            .then((res) => res.json())
            .then((data) => setResponses(data || []))
            .catch((err) => console.error("Failed to load mock responses:", err));
    }, []);

    const generateResponse = async () => {
        if (!pattern) {
            alert("Please provide a URL pattern");
            return;
        }

        try {
            const response = await fetchApi("/mock-responses/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pattern }),
            });
            const generated = await response.json();
            setCurrentResponse({
                ...currentResponse,
                pattern: generated.pattern,
                statusCode: generated.status_code || 200,
                body: generated.body || "",
                bodyType: generated.body_type || "json",
            });
        } catch (error) {
            console.error("Failed to generate response:", error);
        }
    };

    return (
        <div className="mock-response-creator" style={{ padding: "32px", maxWidth: "1920px", margin: "0 auto", height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
            <div className="card-sleek glint-effect" style={{ marginBottom: "24px", padding: "20px", background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <i className="fa fa-magic" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                    Mock Response Creator
                </h2>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Create and manage mock responses for testing and development
                </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1, minHeight: 0 }}>
                <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                    <h2 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                        <i className="fa fa-plus-circle" style={{ color: "var(--accent-primary)" }}></i>
                        {editingIndex !== null ? "Edit Mock Response" : "Create Mock Response"}
                    </h2>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Name:</label>
                        <input
                            type="text"
                            className="input-sleek"
                            value={currentResponse.name}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, name: e.target.value })}
                            placeholder="My Mock Response"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">URL Pattern:</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                                type="text"
                                className="input-sleek"
                                value={currentResponse.pattern}
                                onChange={(e) => setCurrentResponse({ ...currentResponse, pattern: e.target.value })}
                                placeholder=".*api\.example\.com/.*"
                                style={{ flex: 1 }}
                            />
                            <select
                                className="select-sleek"
                                value={currentResponse.matchMode || "regex"}
                                onChange={(e) => setCurrentResponse({ ...currentResponse, matchMode: e.target.value as any })}
                                style={{ width: "120px" }}
                                title="Match mode"
                            >
                                <option value="regex">Regex</option>
                                <option value="exact">Exact</option>
                                <option value="contains">Contains</option>
                            </select>
                        </div>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Priority:</label>
                        <input
                            type="number"
                            className="input-sleek"
                            value={currentResponse.priority || 0}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, priority: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            style={{ width: "150px" }}
                            title="Higher priority mocks are matched first"
                        />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                            Higher = matched first
                        </span>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Response Delay (ms):</label>
                        <input
                            type="number"
                            className="input-sleek"
                            value={currentResponse.delay || 0}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, delay: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            style={{ width: "150px" }}
                            title="Delay before sending response"
                        />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                            Simulate network delay
                        </span>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Status Code:</label>
                        <select
                            className="select-sleek"
                            value={currentResponse.statusCode}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, statusCode: parseInt(e.target.value) })}
                            style={{ width: "150px" }}
                        >
                            {statusCodes.map((code) => (
                                <option key={code} value={code}>
                                    {code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Body Type:</label>
                        <select
                            className="select-sleek"
                            value={currentResponse.bodyType}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, bodyType: e.target.value as any })}
                            style={{ width: "150px" }}
                        >
                            <option value="json">JSON</option>
                            <option value="html">HTML</option>
                            <option value="xml">XML</option>
                            <option value="text">Text</option>
                            <option value="raw">Raw</option>
                            <option value="javascript">JavaScript</option>
                            <option value="css">CSS</option>
                            <option value="form">Form Data</option>
                            <option value="multipart">Multipart</option>
                        </select>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Response Charset:</label>
                        <select
                            className="select-sleek"
                            value={(currentResponse as any).charset || "utf-8"}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, charset: e.target.value } as any)}
                            style={{ width: "150px" }}
                        >
                            <option value="utf-8">UTF-8</option>
                            <option value="utf-16">UTF-16</option>
                            <option value="iso-8859-1">ISO-8859-1</option>
                            <option value="ascii">ASCII</option>
                        </select>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="checkbox-sleek" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                checked={(currentResponse as any).appendTimestamp || false}
                                onChange={(e) => setCurrentResponse({ ...currentResponse, appendTimestamp: e.target.checked } as any)}
                            />
                            <span>Append timestamp to response</span>
                        </label>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="checkbox-sleek" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                checked={(currentResponse as any).randomizeResponse || false}
                                onChange={(e) => setCurrentResponse({ ...currentResponse, randomizeResponse: e.target.checked } as any)}
                            />
                            <span>Randomize response (for A/B testing)</span>
                        </label>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Response Template Variables:</label>
                        <textarea
                            className="textarea-sleek"
                            value={(currentResponse as any).templateVars || ""}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, templateVars: e.target.value } as any)}
                            placeholder='{"userId": "123", "timestamp": "{{timestamp}}"}'
                            rows={4}
                            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px" }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                            JSON object with variables to use in body template (e.g., {"{{userId}}"} will be replaced)
                        </span>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Headers:</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {currentResponse.headers.map((header, index) => (
                                <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        className="input-sleek"
                                        value={header.key}
                                        onChange={(e) => updateHeader(index, "key", e.target.value)}
                                        placeholder="Header name"
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="text"
                                        className="input-sleek"
                                        value={header.value}
                                        onChange={(e) => updateHeader(index, "value", e.target.value)}
                                        placeholder="Header value"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="btn-sleek btn-sleek-danger"
                                        onClick={() => removeHeader(index)}
                                        style={{ padding: "6px 12px" }}
                                    >
                                        <i className="fa fa-times"></i>
                                    </button>
                                </div>
                            ))}
                            <button className="btn-sleek" onClick={addHeader} style={{ alignSelf: "flex-start", padding: "6px 12px" }}>
                                <i className="fa fa-plus"></i> Add Header
                            </button>
                        </div>
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Body:</label>
                        <textarea
                            className="textarea-sleek"
                            value={currentResponse.body}
                            onChange={(e) => setCurrentResponse({ ...currentResponse, body: e.target.value })}
                            placeholder={currentResponse.bodyType === "json" ? '{"message": "Hello World"}' : "Response body"}
                            rows={12}
                            style={{ width: "100%", fontFamily: "monospace" }}
                        />
                    </div>

                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="checkbox-sleek" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                checked={autoGenerate}
                                onChange={(e) => setAutoGenerate(e.target.checked)}
                            />
                            <span>Auto-generate from pattern</span>
                        </label>
                    </div>
                    {autoGenerate && (
                        <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                            <label className="label-sleek">URL Pattern for Auto-generation:</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    type="text"
                                    className="input-sleek"
                                    value={pattern}
                                    onChange={(e) => setPattern(e.target.value)}
                                    placeholder=".*api\.example\.com/.*"
                                    style={{ flex: 1 }}
                                />
                                <button className="btn-sleek" onClick={generateResponse} style={{ padding: "6px 12px" }}>
                                    Generate
                                </button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                        <button className="btn-sleek btn-sleek-success glint-effect" onClick={saveResponse}>
                            <i className="fa fa-save"></i> {editingIndex !== null ? "Update" : "Save"} Response
                        </button>
                        {editingIndex !== null && (
                            <button className="btn-sleek" onClick={() => setEditingIndex(null)}>
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                            <i className="fa fa-list" style={{ color: "var(--accent-primary)" }}></i>
                            Saved Mock Responses
                        </h2>
                        <span style={{ padding: "6px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                            {responses.length} {responses.length === 1 ? "response" : "responses"}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {responses.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                                <i className="fa fa-magic" style={{ fontSize: "48px", opacity: 0.3, marginBottom: "16px" }}></i>
                                <p style={{ fontSize: "14px" }}>No mock responses saved yet</p>
                                <p style={{ fontSize: "12px", marginTop: "4px" }}>Create your first mock response on the left</p>
                            </div>
                        ) : (
                            responses.map((response, index) => (
                                <div
                                    key={index}
                                    className="glint-effect"
                                    style={{
                                        padding: "16px",
                                        backgroundColor: response.enabled ? "rgba(74, 158, 255, 0.05)" : "var(--bg-secondary)",
                                        borderRadius: "10px",
                                        border: response.enabled ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                                <strong style={{ fontSize: "15px" }}>{response.name}</strong>
                                                {response.enabled && (
                                                    <span style={{ padding: "2px 8px", backgroundColor: "var(--accent-secondary)", color: "white", borderRadius: "10px", fontSize: "10px", fontWeight: "600" }}>
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontFamily: "monospace", wordBreak: "break-all" }}>
                                                Pattern: {response.pattern}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                                <span style={{ padding: "4px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px" }}>
                                                    <i className="fa fa-code"></i> {response.statusCode}
                                                </span>
                                                <span style={{ padding: "4px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px" }}>
                                                    <i className="fa fa-file-text"></i> {response.bodyType}
                                                </span>
                                                <span style={{ padding: "4px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px" }}>
                                                    <i className="fa fa-header"></i> {response.headers.length} header{response.headers.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
                                            <button
                                                className={`btn-sleek glint-effect ${response.enabled ? "btn-sleek-success" : ""}`}
                                                onClick={() => toggleEnabled(index)}
                                                style={{ padding: "8px 12px", fontSize: "12px" }}
                                                title={response.enabled ? "Disable" : "Enable"}
                                            >
                                                <i className={`fa fa-${response.enabled ? "check-circle" : "circle-o"}`}></i>
                                            </button>
                                            <button
                                                className="btn-sleek glint-effect"
                                                onClick={() => editResponse(index)}
                                                style={{ padding: "8px 12px", fontSize: "12px" }}
                                                title="Edit"
                                            >
                                                <i className="fa fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-sleek btn-sleek-danger glint-effect"
                                                onClick={() => {
                                                    if (confirm(`Delete mock response "${response.name}"?`)) {
                                                        deleteResponse(index);
                                                    }
                                                }}
                                                style={{ padding: "8px 12px", fontSize: "12px" }}
                                                title="Delete"
                                            >
                                                <i className="fa fa-trash"></i>
                                            </button>
                                        </div>
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

