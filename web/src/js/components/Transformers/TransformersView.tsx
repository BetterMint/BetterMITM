import * as React from "react";
import { useState, useEffect } from "react";
import { fetchApi } from "../../utils";

interface Transformer {
    id?: string;
    name: string;
    type: "request" | "response" | "both";
    action: "json_path" | "header_inject" | "header_remove" | "url_rewrite" | "body_encrypt" | "body_decrypt" | "base64_encode" | "base64_decode" | "json_validate" | "custom";
    config: any;
    condition?: {
        type: "url" | "header" | "method" | "status_code" | "domain" | "body";
        operator?: "equals" | "contains" | "matches" | "starts_with" | "ends_with";
        value: string;
        case_sensitive?: boolean;
    };
    enabled: boolean;
    priority: number;
    chain_with?: string[];  
    execution_order?: "before" | "after" | "replace";
    timeout?: number;  
    retry_count?: number;
    retry_delay?: number;
    log_transformations?: boolean;
}

export default function TransformersView() {
    const [transformers, setTransformers] = useState<Transformer[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentTransformer, setCurrentTransformer] = useState<Transformer>({
        name: "",
        type: "both",
        action: "header_inject",
        config: {},
        enabled: true,
        priority: 0,
        timeout: 5000,
        retry_count: 0,
        retry_delay: 1000,
        log_transformations: true,
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        fetchApi("/transformers")
            .then((res) => res.json())
            .then((data) => setTransformers(data || []))
            .catch((err) => console.error("Failed to load transformers:", err));
    }, []);

    const saveTransformer = async () => {
        try {
            const response = await fetchApi("/transformers", {
                method: editingIndex !== null ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentTransformer,
                    id: editingIndex !== null ? transformers[editingIndex].id : undefined,
                }),
            });

            if (response.ok) {
                const saved = await response.json();
                if (editingIndex !== null) {
                    const newTransformers = [...transformers];
                    newTransformers[editingIndex] = saved;
                    setTransformers(newTransformers);
                } else {
                    setTransformers([...transformers, saved]);
                }
                setCurrentTransformer({
                    name: "",
                    type: "both",
                    action: "header_inject",
                    config: {},
                    enabled: true,
                    priority: 0,
                    timeout: 5000,
                    retry_count: 0,
                    retry_delay: 1000,
                    log_transformations: true,
                });
                setEditingIndex(null);
            }
        } catch (error) {
            console.error("Failed to save transformer:", error);
            alert("Failed to save transformer");
        }
    };

    return (
        <div style={{ 
            padding: "20px", 
            maxWidth: "100%", 
            margin: "0 auto", 
            height: "calc(100vh - 180px)", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden",
            gap: "20px"
        }}>
            <div className="card-sleek glint-effect" style={{ 
                marginBottom: "20px", 
                padding: "20px", 
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", 
                flexShrink: 0,
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <i className="fa fa-exchange" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                    Request/Response Transformers
                </h2>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Create and manage transformers to modify requests and responses on the fly
                </p>
            </div>
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "20px", 
                flex: 1, 
                minHeight: 0,
                overflow: "hidden"
            }}>
                <div className="card-sleek glint-effect" style={{ 
                    padding: "20px", 
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                    display: "flex", 
                    flexDirection: "column", 
                    overflow: "hidden",
                    borderRadius: "16px",
                    marginBottom: "20px"
                }}>
                    <h2 style={{ 
                        marginBottom: "20px", 
                        fontSize: "20px", 
                        fontWeight: "600", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px",
                        flexShrink: 0
                    }}>
                        <i className="fa fa-plus-circle" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                        {editingIndex !== null ? "Edit Transformer" : "Create Transformer"}
                    </h2>
                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Name:</label>
                        <input
                            type="text"
                            className="input-sleek"
                            value={currentTransformer.name}
                            onChange={(e) => setCurrentTransformer({ ...currentTransformer, name: e.target.value })}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Type:</label>
                        <select
                            className="select-sleek"
                            value={currentTransformer.type}
                            onChange={(e) => setCurrentTransformer({ ...currentTransformer, type: e.target.value as any })}
                            style={{ width: "200px" }}
                        >
                            <option value="request">Request</option>
                            <option value="response">Response</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Action:</label>
                        <select
                            className="select-sleek"
                            value={currentTransformer.action}
                            onChange={(e) => setCurrentTransformer({ ...currentTransformer, action: e.target.value as any, config: {} })}
                            style={{ width: "100%" }}
                        >
                            <option value="json_path">JSON Path Modification</option>
                            <option value="header_inject">Header Injection</option>
                            <option value="header_remove">Header Removal</option>
                            <option value="url_rewrite">URL Rewrite</option>
                            <option value="base64_encode">Base64 Encode</option>
                            <option value="base64_decode">Base64 Decode</option>
                            <option value="json_validate">JSON Validation</option>
                            <option value="body_replace">Body Text Replace</option>
                            <option value="body_transform">Body Transform (Regex)</option>
                            <option value="query_param_add">Add Query Parameter</option>
                            <option value="query_param_remove">Remove Query Parameter</option>
                            <option value="query_param_modify">Modify Query Parameter</option>
                            <option value="custom">Custom (JavaScript/Python)</option>
                        </select>
                    </div>
                    {currentTransformer.action && (
                        <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>
                                Configuration:
                                <small style={{ display: "block", marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "400" }}>
                                    {currentTransformer.action === "json_path" && "Enter JSON path (e.g., $.user.name) and new value"}
                                    {currentTransformer.action === "header_inject" && "Enter header name and value (JSON: {\"name\": \"X-Custom\", \"value\": \"test\"})"}
                                    {currentTransformer.action === "header_remove" && "Enter header name to remove"}
                                    {currentTransformer.action === "url_rewrite" && "Enter pattern and replacement (JSON: {\"pattern\": \"/old\", \"replacement\": \"/new\"})"}
                                    {currentTransformer.action === "body_replace" && "Enter find and replace text (JSON: {\"find\": \"old\", \"replace\": \"new\"})"}
                                    {currentTransformer.action === "body_transform" && "Enter regex pattern and replacement (JSON: {\"pattern\": \"regex\", \"replacement\": \"text\"})"}
                                    {currentTransformer.action === "query_param_add" && "Enter parameter name and value (JSON: {\"name\": \"param\", \"value\": \"value\"})"}
                                    {currentTransformer.action === "query_param_remove" && "Enter parameter name to remove"}
                                    {currentTransformer.action === "query_param_modify" && "Enter old name, new name, and value (JSON: {\"old\": \"old\", \"new\": \"new\", \"value\": \"value\"})"}
                                    {currentTransformer.action === "custom" && "Enter JavaScript or Python code"}
                                    {!["json_path", "header_inject", "header_remove", "url_rewrite", "body_replace", "body_transform", "query_param_add", "query_param_remove", "query_param_modify", "custom"].includes(currentTransformer.action) && "Enter configuration as JSON"}
                                </small>
                            </label>
                            <textarea
                                className="textarea-sleek"
                                value={typeof currentTransformer.config === "string" ? currentTransformer.config : JSON.stringify(currentTransformer.config || {}, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setCurrentTransformer({ ...currentTransformer, config: parsed });
                                    } catch {
                                        setCurrentTransformer({ ...currentTransformer, config: e.target.value });
                                    }
                                }}
                                placeholder={currentTransformer.action === "custom" ? "// JavaScript or Python code\nif (flow.request) {\n    flow.request.headers['X-Custom'] = 'value';\n}" : "{\n  \"key\": \"value\"\n}"}
                                rows={currentTransformer.action === "custom" ? 12 : 6}
                                style={{ width: "100%", fontFamily: "monospace", padding: "12px", resize: "vertical", fontSize: "13px" }}
                            />
                        </div>
                    )}
                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Priority:</label>
                        <input
                            type="number"
                            className="input-sleek"
                            value={currentTransformer.priority}
                            onChange={(e) => setCurrentTransformer({ ...currentTransformer, priority: parseInt(e.target.value) || 0 })}
                            style={{ width: "100px" }}
                        />
                    </div>
                    <div style={{ marginTop: "12px", width: "100%" }}>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "12px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Execution Order:</label>
                                    <select
                                        className="select-sleek"
                                        value={currentTransformer.execution_order || "after"}
                                        onChange={(e) => setCurrentTransformer({ ...currentTransformer, execution_order: e.target.value as any })}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="before">Before Other Transformers</option>
                                        <option value="after">After Other Transformers</option>
                                        <option value="replace">Replace (Stop Chain)</option>
                                    </select>
                                </div>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Timeout (ms):</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={currentTransformer.timeout || 5000}
                                        onChange={(e) => setCurrentTransformer({ ...currentTransformer, timeout: parseInt(e.target.value) || 5000 })}
                                        min={100}
                                        max={60000}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Retry Count:</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={currentTransformer.retry_count || 0}
                                        onChange={(e) => setCurrentTransformer({ ...currentTransformer, retry_count: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        max={10}
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <div className="compact-spacing" style={{ width: "100%" }}>
                                    <label className="label-sleek">Retry Delay (ms):</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={currentTransformer.retry_delay || 1000}
                                        onChange={(e) => setCurrentTransformer({ ...currentTransformer, retry_delay: parseInt(e.target.value) || 1000 })}
                                        min={100}
                                        max={10000}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: "8px", padding: "12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontWeight: "600", fontSize: "13px" }}>
                                    <input
                                        type="checkbox"
                                        checked={!!currentTransformer.condition}
                                        onChange={(e) => setCurrentTransformer({ 
                                            ...currentTransformer, 
                                            condition: e.target.checked ? { type: "url", operator: "contains", value: "", case_sensitive: false } : undefined 
                                        })}
                                    />
                                    <span>Apply Condition (Only transform if condition matches)</span>
                                </label>
                                {currentTransformer.condition && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
                                        <select
                                            className="select-sleek"
                                            value={currentTransformer.condition.type}
                                            onChange={(e) => setCurrentTransformer({ 
                                                ...currentTransformer, 
                                                condition: { ...currentTransformer.condition!, type: e.target.value as any } 
                                            })}
                                            style={{ width: "100%" }}
                                        >
                                            <option value="url">URL</option>
                                            <option value="header">Header</option>
                                            <option value="method">Method</option>
                                            <option value="status_code">Status Code</option>
                                            <option value="domain">Domain</option>
                                            <option value="body">Body</option>
                                        </select>
                                        <select
                                            className="select-sleek"
                                            value={currentTransformer.condition.operator || "contains"}
                                            onChange={(e) => setCurrentTransformer({ 
                                                ...currentTransformer, 
                                                condition: { ...currentTransformer.condition!, operator: e.target.value as any } 
                                            })}
                                            style={{ width: "100%" }}
                                        >
                                            <option value="equals">Equals</option>
                                            <option value="contains">Contains</option>
                                            <option value="matches">Matches (Regex)</option>
                                            <option value="starts_with">Starts With</option>
                                            <option value="ends_with">Ends With</option>
                                        </select>
                                        <input
                                            type="text"
                                            className="input-sleek"
                                            placeholder="Value"
                                            value={currentTransformer.condition.value}
                                            onChange={(e) => setCurrentTransformer({ 
                                                ...currentTransformer, 
                                                condition: { ...currentTransformer.condition!, value: e.target.value } 
                                            })}
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                        type="checkbox"
                                        checked={currentTransformer.log_transformations !== false}
                                        onChange={(e) => setCurrentTransformer({ ...currentTransformer, log_transformations: e.target.checked })}
                                    />
                                    <span style={{ fontSize: "12px" }}>Log Transformations</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                        type="checkbox"
                                        checked={currentTransformer.condition?.case_sensitive || false}
                                        onChange={(e) => setCurrentTransformer({ 
                                            ...currentTransformer, 
                                            condition: currentTransformer.condition ? { ...currentTransformer.condition, case_sensitive: e.target.checked } : undefined 
                                        })}
                                    />
                                    <span style={{ fontSize: "12px" }}>Case Sensitive</span>
                                </label>
                            </div>
                        </div>
                    )}

                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "20px", flexShrink: 0 }}>
                        <button 
                            className="btn-sleek btn-sleek-success glint-effect" 
                            onClick={saveTransformer}
                            style={{ flex: 1, padding: "12px 20px", fontSize: "14px", fontWeight: "600" }}
                        >
                            <i className="fa fa-save"></i> {editingIndex !== null ? "Update" : "Save"} Transformer
                        </button>
                        {editingIndex !== null && (
                            <button 
                                className="btn-sleek glint-effect" 
                                onClick={() => setEditingIndex(null)}
                                style={{ padding: "12px 20px", fontSize: "14px" }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                <div className="card-sleek glint-effect" style={{ 
                    padding: "20px", 
                    boxShadow: "var(--shadow-md)", 
                    display: "flex", 
                    flexDirection: "column", 
                    overflow: "hidden"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                            <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                            Saved Transformers
                        </h2>
                        <span style={{ padding: "6px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "12px", fontSize: "13px", fontWeight: "600" }}>
                            {transformers.length} {transformers.length === 1 ? "transformer" : "transformers"}
                        </span>
                    </div>
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                gap: "14px", 
                                flex: 1, 
                                minHeight: 0, 
                                overflowY: "auto",
                                paddingRight: "8px"
                            }}>
                        {transformers.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                                <i className="fa fa-exchange" style={{ fontSize: "48px", opacity: 0.3, marginBottom: "16px" }}></i>
                                <p style={{ fontSize: "14px" }}>No transformers saved yet</p>
                                <p style={{ fontSize: "12px", marginTop: "4px" }}>Create your first transformer on the left</p>
                            </div>
                        ) : (
                            transformers.map((transformer, index) => (
                                <div
                                    key={index}
                                    className="glint-effect"
                                    style={{
                                        padding: "16px",
                                        backgroundColor: transformer.enabled ? "rgba(74, 158, 255, 0.05)" : "var(--bg-secondary)",
                                        borderRadius: "10px",
                                        border: transformer.enabled ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                                <strong style={{ fontSize: "15px" }}>{transformer.name}</strong>
                                                {transformer.enabled && (
                                                    <span style={{ padding: "2px 8px", backgroundColor: "var(--accent-secondary)", color: "white", borderRadius: "10px", fontSize: "10px", fontWeight: "600" }}>
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                                <span style={{ padding: "4px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px" }}>
                                                    <i className="fa fa-tag"></i> {transformer.type}
                                                </span>
                                                <span style={{ padding: "4px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px" }}>
                                                    <i className="fa fa-cog"></i> {transformer.action.replace(/_/g, " ")}
                                                </span>
                                                <span style={{ padding: "4px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px" }}>
                                                    <i className="fa fa-sort-numeric-asc"></i> Priority: {transformer.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
                                            <button
                                                className={`btn-sleek glint-effect ${transformer.enabled ? "btn-sleek-success" : ""}`}
                                                onClick={async () => {
                                                    const updated = { ...transformer, enabled: !transformer.enabled };
                                                    await fetchApi(`/transformers/${transformer.id || index}`, {
                                                        method: "PUT",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify(updated),
                                                    });
                                                    const newTransformers = [...transformers];
                                                    newTransformers[index] = updated;
                                                    setTransformers(newTransformers);
                                                }}
                                                style={{ padding: "8px 12px", fontSize: "12px" }}
                                                title={transformer.enabled ? "Disable" : "Enable"}
                                            >
                                                <i className={`fa fa-${transformer.enabled ? "check-circle" : "circle-o"}`}></i>
                                            </button>
                                            <button
                                                className="btn-sleek glint-effect"
                                                onClick={() => {
                                                    setCurrentTransformer(transformer);
                                                    setEditingIndex(index);
                                                }}
                                                style={{ padding: "8px 12px", fontSize: "12px" }}
                                                title="Edit"
                                            >
                                                <i className="fa fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-sleek btn-sleek-danger glint-effect"
                                                onClick={async () => {
                                                    if (confirm(`Delete transformer "${transformer.name}"?`)) {
                                                        await fetchApi(`/transformers/${transformer.id || index}`, { method: "DELETE" });
                                                        setTransformers(transformers.filter((_, i) => i !== index));
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
