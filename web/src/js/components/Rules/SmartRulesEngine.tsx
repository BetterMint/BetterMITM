import * as React from "react";
import { useState, useEffect } from "react";
import { fetchApi } from "../../utils";

interface Rule {
    id?: string;
    name: string;
    priority: number;
    action: "intercept" | "block" | "modify" | "redirect";
    conditions: Array<{
        type: "url" | "method" | "header" | "status_code" | "body";
        operator: "equals" | "contains" | "matches" | "regex";
        name?: string;
        value: string;
    }>;
    modifications?: {
        headers?: Array<{ name: string; value: string; action: "add" | "remove" | "modify" }>;
        body?: string;
        method?: string;
    };
    enabled: boolean;
}

export default function SmartRulesEngine() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentRule, setCurrentRule] = useState<Rule>({
        name: "",
        priority: 0,
        action: "intercept",
        conditions: [],
        enabled: true,
    });
    const [configMode, setConfigMode] = useState<"visual" | "json" | "yaml">("visual");
    const [rawConfig, setRawConfig] = useState("");

    useEffect(() => {
        fetchApi("/smart-rules")
            .then((res) => res.json())
            .then((data) => {
                setRules(data || []);
                setRawConfig(JSON.stringify(data || [], null, 2));
            })
            .catch((err) => console.error("Failed to load rules:", err));
    }, []);

    const addCondition = () => {
        setCurrentRule({
            ...currentRule,
            conditions: [
                ...currentRule.conditions,
                { type: "url", operator: "contains", value: "" },
            ],
        });
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const newConditions = [...currentRule.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setCurrentRule({ ...currentRule, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        const newConditions = currentRule.conditions.filter((_, i) => i !== index);
        setCurrentRule({ ...currentRule, conditions: newConditions });
    };

    const saveRule = async () => {
        try {
            const response = await fetchApi("/smart-rules", {
                method: editingIndex !== null ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentRule,
                    id: editingIndex !== null ? rules[editingIndex].id : undefined,
                }),
            });

            if (response.ok) {
                const saved = await response.json();
                if (editingIndex !== null) {
                    const newRules = [...rules];
                    newRules[editingIndex] = saved;
                    setRules(newRules);
                } else {
                    setRules([...rules, saved]);
                }
                setCurrentRule({
                    name: "",
                    priority: 0,
                    action: "intercept",
                    conditions: [],
                    enabled: true,
                });
                setEditingIndex(null);
            }
        } catch (error) {
            console.error("Failed to save rule:", error);
            alert("Failed to save rule");
        }
    };

    const saveConfig = async () => {
        try {
            let parsed;
            if (configMode === "json") {
                parsed = JSON.parse(rawConfig);
            } else {
                const yaml = await import("yaml");
                parsed = yaml.parse(rawConfig);
            }
            await fetchApi("/smart-rules/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: parsed, format: configMode }),
            });
            setRules(parsed);
            alert("Configuration saved!");
        } catch (error: any) {
            alert(`Failed to save config: ${error.message}`);
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
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
                            <i className="fa fa-sitemap" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                            Smart Rules Engine
                        </h2>
                        <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                            Create intelligent rules to automatically intercept, modify, or block traffic
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                            className={`btn-sleek glint-effect ${configMode === "visual" ? "btn-sleek-success" : ""}`}
                            onClick={() => setConfigMode("visual")}
                            style={{ 
                                padding: "10px 20px", 
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                                transform: configMode === "visual" ? "scale(1.05)" : "scale(1)"
                            }}
                        >
                            <i className="fa fa-eye"></i> Visual
                        </button>
                        <button
                            className={`btn-sleek glint-effect ${configMode === "json" ? "btn-sleek-success" : ""}`}
                            onClick={() => setConfigMode("json")}
                            style={{ 
                                padding: "10px 20px", 
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                                transform: configMode === "json" ? "scale(1.05)" : "scale(1)"
                            }}
                        >
                            <i className="fa fa-code"></i> JSON
                        </button>
                        <button
                            className={`btn-sleek glint-effect ${configMode === "yaml" ? "btn-sleek-success" : ""}`}
                            onClick={() => setConfigMode("yaml")}
                            style={{ 
                                padding: "10px 20px", 
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                                transform: configMode === "yaml" ? "scale(1.05)" : "scale(1)"
                            }}
                        >
                            <i className="fa fa-file-text"></i> YAML
                        </button>
                    </div>
                </div>
            </div>

            {}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {configMode === "visual" ? (
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
                            padding: "clamp(16px, 2vw, 24px)", 
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                            display: "flex", 
                            flexDirection: "column", 
                            overflow: "hidden",
                            borderRadius: "16px",
                            animation: "slideInLeft 0.4s ease-out",
                            minWidth: 0
                        }}>
                            <h3 style={{ 
                                marginBottom: "20px", 
                                fontSize: "clamp(18px, 2vw, 22px)", 
                                fontWeight: "600", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "10px",
                                flexShrink: 0
                            }}>
                                <i className="fa fa-plus-circle" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                                {editingIndex !== null ? "Edit Rule" : "Create Rule"}
                            </h3>
                            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 150px", gap: "12px", marginBottom: "20px" }}>
                                    <div>
                                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Rule Name:</label>
                                        <input
                                            type="text"
                                            className="input-sleek"
                                            value={currentRule.name}
                                            onChange={(e) => setCurrentRule({ ...currentRule, name: e.target.value })}
                                            placeholder="My Rule"
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", transition: "all 0.2s" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Priority:</label>
                                        <input
                                            type="number"
                                            className="input-sleek"
                                            value={currentRule.priority}
                                            onChange={(e) => setCurrentRule({ ...currentRule, priority: parseInt(e.target.value) || 0 })}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Action:</label>
                                        <select
                                            className="select-sleek"
                                            value={currentRule.action}
                                            onChange={(e) => setCurrentRule({ ...currentRule, action: e.target.value as any })}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
                                        >
                                            <option value="intercept">Intercept</option>
                                            <option value="block">Block</option>
                                            <option value="modify">Modify</option>
                                            <option value="redirect">Redirect</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginBottom: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <label className="label-sleek" style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Conditions:</label>
                                        <button
                                            className="btn-sleek btn-sleek-success glint-effect"
                                            onClick={addCondition}
                                            style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "8px" }}
                                        >
                                            <i className="fa fa-plus" style={{ marginRight: "6px" }}></i>
                                            Add Condition
                                        </button>
                                    </div>
                                    {currentRule.conditions.length === 0 && (
                                        <div style={{
                                            padding: "24px",
                                            textAlign: "center",
                                            backgroundColor: "var(--bg-secondary)",
                                            borderRadius: "12px",
                                            border: "2px dashed var(--border-color)",
                                            color: "var(--text-secondary)",
                                            fontSize: "13px"
                                        }}>
                                            <i className="fa fa-info-circle" style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}></i>
                                            No conditions added. Click "Add Condition" to create a condition.
                                        </div>
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {currentRule.conditions.map((condition, index) => (
                                            <div 
                                                key={index} 
                                                className="glint-effect" 
                                                style={{ 
                                                    padding: "16px", 
                                                    backgroundColor: "var(--bg-secondary)", 
                                                    borderRadius: "12px", 
                                                    border: "2px solid var(--border-color)",
                                                    transition: "all 0.3s ease",
                                                    animation: "fadeIn 0.3s ease-in"
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
                                                <div style={{ display: "grid", gridTemplateColumns: "140px 140px 1fr auto", gap: "10px", marginBottom: condition.type === "header" ? "10px" : "0" }}>
                                                    <select
                                                        className="select-sleek"
                                                        value={condition.type}
                                                        onChange={(e) => updateCondition(index, "type", e.target.value)}
                                                        style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                    >
                                                        <option value="url">URL</option>
                                                        <option value="method">Method</option>
                                                        <option value="header">Header</option>
                                                        <option value="status_code">Status Code</option>
                                                        <option value="body">Body</option>
                                                    </select>
                                                    <select
                                                        className="select-sleek"
                                                        value={condition.operator}
                                                        onChange={(e) => updateCondition(index, "operator", e.target.value)}
                                                        style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                    >
                                                        <option value="equals">Equals</option>
                                                        <option value="contains">Contains</option>
                                                        <option value="matches">Matches (Regex)</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        className="input-sleek"
                                                        value={condition.value}
                                                        onChange={(e) => updateCondition(index, "value", e.target.value)}
                                                        placeholder={
                                                            condition.type === "url" ? "Enter URL pattern (e.g., /api/.*)" :
                                                            condition.type === "method" ? "Enter HTTP method (e.g., GET, POST)" :
                                                            condition.type === "header" ? "Enter header value" :
                                                            condition.type === "status_code" ? "Enter status code (e.g., 200, 404)" :
                                                            condition.type === "body" ? "Enter body pattern to match" :
                                                            "Enter value"
                                                        }
                                                        style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                    />
                                                    <button
                                                        className="btn-sleek btn-sleek-danger glint-effect"
                                                        onClick={() => removeCondition(index)}
                                                        style={{ padding: "10px 14px", fontSize: "13px", borderRadius: "8px", transition: "all 0.2s" }}
                                                        title="Remove condition"
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                    >
                                                        <i className="fa fa-times"></i>
                                                    </button>
                                                </div>
                                                {condition.type === "header" && (
                                                    <div style={{ marginTop: "10px" }}>
                                                        <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                                                            Header Name:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="input-sleek"
                                                            value={condition.name || ""}
                                                            onChange={(e) => updateCondition(index, "name", e.target.value)}
                                                            placeholder="Enter header name (e.g., Content-Type, Authorization, User-Agent)"
                                                            style={{ width: "100%", padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                        />
                                                    </div>
                                                )}
                                                {condition.type === "body" && (
                                                    <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                                                        <i className="fa fa-info-circle" style={{ marginRight: "4px" }}></i>
                                                        Body matching searches in request/response body content. Use regex for pattern matching.
                                                    </div>
                                                )}
                                                {condition.operator === "matches" && (
                                                    <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                                                        <i className="fa fa-info-circle" style={{ marginRight: "4px" }}></i>
                                                        Regex mode: Use regular expressions for pattern matching (e.g., ^/api/.*$)
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <button 
                                            className="btn-sleek glint-effect" 
                                            onClick={addCondition} 
                                            style={{ 
                                                alignSelf: "flex-start", 
                                                padding: "12px 20px", 
                                                fontSize: "14px",
                                                borderRadius: "8px",
                                                transition: "all 0.3s ease"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 158, 255, 0.3)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <i className="fa fa-plus"></i> Add Condition
                                        </button>
                                    </div>
                                </div>
                                {(currentRule.action === "modify" || currentRule.action === "redirect") && (
                                    <div style={{ marginTop: "24px", padding: "clamp(16px, 2vw, 20px)", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", border: "2px solid var(--border-color)" }}>
                                        <h4 style={{ fontSize: "clamp(15px, 1.8vw, 17px)", fontWeight: "600", marginBottom: "clamp(12px, 1.5vw, 16px)", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <i className="fa fa-edit" style={{ color: "var(--accent-primary)" }}></i>
                                            Modifications
                                        </h4>
                                        {currentRule.action === "redirect" && (
                                            <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Redirect URL:</label>
                                                <input
                                                    type="text"
                                                    className="input-sleek"
                                                    value={currentRule.modifications?.redirect_url || ""}
                                                    onChange={(e) => setCurrentRule({ 
                                                        ...currentRule, 
                                                        modifications: { ...currentRule.modifications, redirect_url: e.target.value } 
                                                    })}
                                                    placeholder="https://new-domain.com/path"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
                                                />
                                            </div>
                                        )}
                                        <div style={{ marginBottom: "16px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                <label className="label-sleek" style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Header Modifications:</label>
                                                <button
                                                    className="btn-sleek btn-sleek-success glint-effect"
                                                    onClick={() => {
                                                        const headers = currentRule.modifications?.headers || [];
                                                        setCurrentRule({ 
                                                            ...currentRule, 
                                                            modifications: { ...currentRule.modifications, headers: [...headers, { name: "", value: "", action: "add" }] } 
                                                        });
                                                    }}
                                                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px" }}
                                                >
                                                    <i className="fa fa-plus" style={{ marginRight: "4px" }}></i> Add Header
                                                </button>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {(currentRule.modifications?.headers || []).map((header, index) => (
                                                    <div key={index} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                                                        <select
                                                            className="select-sleek"
                                                            value={header.action}
                                                            onChange={(e) => {
                                                                const headers = [...(currentRule.modifications?.headers || [])];
                                                                headers[index] = { ...headers[index], action: e.target.value as any };
                                                                setCurrentRule({ ...currentRule, modifications: { ...currentRule.modifications, headers } });
                                                            }}
                                                            style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                        >
                                                            <option value="add">Add</option>
                                                            <option value="modify">Modify</option>
                                                            <option value="remove">Remove</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            className="input-sleek"
                                                            value={header.name}
                                                            onChange={(e) => {
                                                                const headers = [...(currentRule.modifications?.headers || [])];
                                                                headers[index] = { ...headers[index], name: e.target.value };
                                                                setCurrentRule({ ...currentRule, modifications: { ...currentRule.modifications, headers } });
                                                            }}
                                                            placeholder="Header name"
                                                            style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                        />
                                                        {header.action !== "remove" && (
                                                            <input
                                                                type="text"
                                                                className="input-sleek"
                                                                value={header.value}
                                                                onChange={(e) => {
                                                                    const headers = [...(currentRule.modifications?.headers || [])];
                                                                    headers[index] = { ...headers[index], value: e.target.value };
                                                                    setCurrentRule({ ...currentRule, modifications: { ...currentRule.modifications, headers } });
                                                                }}
                                                                placeholder="Header value"
                                                                style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                            />
                                                        )}
                                                        <button
                                                            className="btn-sleek btn-sleek-danger glint-effect"
                                                            onClick={() => {
                                                                const headers = (currentRule.modifications?.headers || []).filter((_, i) => i !== index);
                                                                setCurrentRule({ ...currentRule, modifications: { ...currentRule.modifications, headers } });
                                                            }}
                                                            style={{ padding: "10px 14px", fontSize: "13px", borderRadius: "8px" }}
                                                        >
                                                            <i className="fa fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Body Modification:</label>
                                            <textarea
                                                className="textarea-sleek"
                                                value={currentRule.modifications?.body || ""}
                                                onChange={(e) => setCurrentRule({ 
                                                    ...currentRule, 
                                                    modifications: { ...currentRule.modifications, body: e.target.value } 
                                                })}
                                                placeholder="Enter new body content (leave empty to keep original)"
                                                rows={6}
                                                style={{ width: "100%", padding: "12px", fontSize: "13px", borderRadius: "8px", fontFamily: "monospace", resize: "vertical" }}
                                            />
                                        </div>
                                        <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                                            <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Method Modification:</label>
                                            <select
                                                className="select-sleek"
                                                value={currentRule.modifications?.method || ""}
                                                onChange={(e) => setCurrentRule({ 
                                                    ...currentRule, 
                                                    modifications: { ...currentRule.modifications, method: e.target.value || undefined } 
                                                })}
                                                style={{ width: "100%", padding: "12px", fontSize: "13px", borderRadius: "8px" }}
                                            >
                                                <option value="">Keep Original</option>
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="DELETE">DELETE</option>
                                                <option value="PATCH">PATCH</option>
                                                <option value="HEAD">HEAD</option>
                                                <option value="OPTIONS">OPTIONS</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "auto", paddingTop: "20px", flexShrink: 0 }}>
                                <button 
                                    className="btn-sleek btn-sleek-success glint-effect" 
                                    onClick={saveRule} 
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
                                    <i className="fa fa-save"></i> {editingIndex !== null ? "Update" : "Save"} Rule
                                </button>
                                {editingIndex !== null && (
                                    <button 
                                        className="btn-sleek glint-effect" 
                                        onClick={() => {
                                            setEditingIndex(null);
                                            setCurrentRule({ name: "", priority: 0, action: "intercept", conditions: [], enabled: true });
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
                        <div className="card-sleek glint-effect" style={{ 
                            padding: "clamp(16px, 2vw, 24px)", 
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                            display: "flex", 
                            flexDirection: "column", 
                            overflow: "hidden",
                            borderRadius: "16px",
                            animation: "slideInRight 0.4s ease-out",
                            minWidth: 0
                        }}>
                            <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center", 
                                marginBottom: "20px",
                                flexShrink: 0
                            }}>
                                <h3 style={{ 
                                    fontSize: "clamp(18px, 2vw, 22px)", 
                                    fontWeight: "600", 
                                    margin: 0, 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "10px" 
                                }}>
                                    <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                                    Saved Rules
                                </h3>
                                <span style={{ 
                                    padding: "8px 16px", 
                                    backgroundColor: "var(--bg-tertiary)", 
                                    borderRadius: "12px", 
                                    fontSize: "14px", 
                                    fontWeight: "600",
                                    color: "var(--accent-primary)"
                                }}>
                                    {rules.length} {rules.length === 1 ? "rule" : "rules"}
                                </span>
                            </div>
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                gap: "16px", 
                                flex: 1, 
                                minHeight: 0, 
                                overflowY: "auto", 
                                paddingRight: "8px"
                            }}>
                                {rules.length === 0 ? (
                                    <div style={{ 
                                        textAlign: "center", 
                                        padding: "60px 20px", 
                                        color: "var(--text-secondary)",
                                        animation: "fadeIn 0.5s ease-in"
                                    }}>
                                        <i className="fa fa-filter" style={{ fontSize: "64px", opacity: 0.3, marginBottom: "20px" }}></i>
                                        <p style={{ fontSize: "16px", fontWeight: "500" }}>No rules saved yet</p>
                                        <p style={{ fontSize: "13px", marginTop: "8px" }}>Create your first rule on the left</p>
                                    </div>
                                ) : (
                                    rules.map((rule, index) => (
                                        <div
                                            key={index}
                                            className="glint-effect"
                                            style={{
                                                padding: "20px",
                                                backgroundColor: rule.enabled ? "rgba(74, 158, 255, 0.08)" : "var(--bg-secondary)",
                                                borderRadius: "12px",
                                                border: rule.enabled ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                                transition: "all 0.3s ease",
                                                animation: "fadeIn 0.3s ease-in",
                                                cursor: "pointer"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-4px)";
                                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                                                        <strong style={{ fontSize: "16px", fontWeight: "600" }}>{rule.name}</strong>
                                                        {rule.enabled && (
                                                            <span style={{ 
                                                                padding: "4px 10px", 
                                                                backgroundColor: "var(--accent-secondary)", 
                                                                color: "white", 
                                                                borderRadius: "12px", 
                                                                fontSize: "11px", 
                                                                fontWeight: "600",
                                                                animation: "pulse 2s infinite"
                                                            }}>
                                                                ACTIVE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                                        <span style={{ padding: "6px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <i className="fa fa-sort-numeric-asc"></i> Priority: {rule.priority}
                                                        </span>
                                                        <span style={{ padding: "6px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <i className="fa fa-bolt"></i> {rule.action}
                                                        </span>
                                                        <span style={{ padding: "6px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <i className="fa fa-filter"></i> {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "8px", marginLeft: "12px", flexShrink: 0 }}>
                                                    <button
                                                        className={`btn-sleek glint-effect ${rule.enabled ? "btn-sleek-success" : ""}`}
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const updated = { ...rule, enabled: !rule.enabled };
                                                            await fetchApi(`/smart-rules/${rule.id || index}`, {
                                                                method: "PUT",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify(updated),
                                                            });
                                                            const newRules = [...rules];
                                                            newRules[index] = updated;
                                                            setRules(newRules);
                                                        }}
                                                        style={{ padding: "10px 14px", fontSize: "13px", borderRadius: "8px", transition: "all 0.2s" }}
                                                        title={rule.enabled ? "Disable" : "Enable"}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                    >
                                                        <i className={`fa fa-${rule.enabled ? "check-circle" : "circle-o"}`}></i>
                                                    </button>
                                                    <button
                                                        className="btn-sleek glint-effect"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCurrentRule(rule);
                                                            setEditingIndex(index);
                                                        }}
                                                        style={{ padding: "10px 14px", fontSize: "13px", borderRadius: "8px", transition: "all 0.2s" }}
                                                        title="Edit"
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                    >
                                                        <i className="fa fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className="btn-sleek btn-sleek-danger glint-effect"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete rule "${rule.name}"?`)) {
                                                                await fetchApi(`/smart-rules/${rule.id || index}`, { method: "DELETE" });
                                                                setRules(rules.filter((_, i) => i !== index));
                                                                if (editingIndex === index) {
                                                                    setEditingIndex(null);
                                                                    setCurrentRule({ name: "", priority: 0, action: "intercept", conditions: [], enabled: true });
                                                                }
                                                            }
                                                        }}
                                                        style={{ padding: "10px 14px", fontSize: "13px", borderRadius: "8px", transition: "all 0.2s" }}
                                                        title="Delete"
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
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
                ) : (
                    <div className="card-sleek glint-effect" style={{ 
                        padding: "clamp(16px, 2vw, 24px)", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        borderRadius: "16px",
                        animation: "fadeIn 0.4s ease-in"
                    }}>
                        <div style={{ marginBottom: "20px" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "10px", fontSize: "15px", fontWeight: "600" }}>
                                Configuration ({configMode.toUpperCase()}):
                            </label>
                            <textarea
                                className="textarea-sleek"
                                value={rawConfig}
                                onChange={(e) => setRawConfig(e.target.value)}
                                rows={25}
                                style={{ 
                                    width: "100%", 
                                    fontFamily: "monospace", 
                                    padding: "16px",
                                    borderRadius: "12px",
                                    fontSize: "13px",
                                    lineHeight: "1.6"
                                }}
                            />
                        </div>
                        <button 
                            className="btn-sleek btn-sleek-success glint-effect" 
                            onClick={saveConfig}
                            style={{ 
                                padding: "14px 28px", 
                                fontSize: "15px",
                                fontWeight: "600",
                                borderRadius: "10px",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            <i className="fa fa-save"></i> Save Configuration
                        </button>
                    </div>
                )}
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
