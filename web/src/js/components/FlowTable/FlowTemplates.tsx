import * as React from "react";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../ducks";
import { Flow } from "../../flow";
import { fetchApi } from "../../utils";
import * as flowActions from "../../ducks/flows";

interface Template {
    id?: string;
    name: string;
    flow_data: any;
    variables: Array<{ name: string; value: string; default?: string }>;
}

export default function FlowTemplates() {
    const dispatch = useAppDispatch();
    const flows = useAppSelector((state) => state.flows.list);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchApi("/templates")
            .then((res) => res.json())
            .then((data) => setTemplates(data || []))
            .catch((err) => console.error("Failed to load templates:", err));
    }, []);

    const createTemplate = async () => {
        if (!selectedFlow || !templateName) {
            alert("Please select a flow and provide a template name");
            return;
        }

        const flow = flows.find((f) => f.id === selectedFlow);
        if (!flow) return;

        try {
            await fetchApi("/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateName,
                    flow_data: flow,
                    variables: [],
                }),
            });
            const updated = await fetchApi("/templates").then((r) => r.json());
            setTemplates(updated);
            setTemplateName("");
            setSelectedFlow(null);
            alert("Template created!");
        } catch (error) {
            console.error("Failed to create template:", error);
            alert("Failed to create template");
        }
    };

    const applyTemplate = async (template: Template) => {
        try {
            const response = await fetchApi("/templates/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template_id: template.id,
                    variables: variableValues,
                }),
            });
            const newFlow = await response.json();
            dispatch(flowActions.update(newFlow, {}));
            alert("Template applied! New flow created.");
        } catch (error) {
            console.error("Failed to apply template:", error);
            alert("Failed to apply template");
        }
    };

    return (
        <div style={{ padding: "32px", maxWidth: "1920px", margin: "0 auto", height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
            <div className="card-sleek glint-effect" style={{ marginBottom: "24px", padding: "20px", background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", flexShrink: 0 }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <i className="fa fa-file-text" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                    Flow Templates
                </h2>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Create and apply flow templates for reusable request patterns
                </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1, minHeight: 0 }}>
                <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                    <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                        <i className="fa fa-plus-circle" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                        Create Template from Flow
                    </h3>
                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Template Name:</label>
                        <input
                            type="text"
                            className="input-sleek"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="My Template"
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Select Flow:</label>
                        <select
                            className="select-sleek"
                            value={selectedFlow || ""}
                            onChange={(e) => setSelectedFlow(e.target.value || null)}
                            style={{ width: "100%" }}
                        >
                            <option value="">Select a flow...</option>
                            {flows.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.type} - {f.id.substring(0, 8)} - {f.type === "http" ? f.request?.path : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="btn-sleek btn-sleek-success glint-effect" onClick={createTemplate} style={{ padding: "8px 16px" }}>
                        <i className="fa fa-save"></i> Create Template
                    </button>
                </div>

                <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                            <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                            Template Library
                        </h3>
                        <span style={{ padding: "6px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "12px", fontSize: "13px", fontWeight: "600" }}>
                            {templates.length} {templates.length === 1 ? "template" : "templates"}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, minHeight: 0, overflowY: "auto" }}>
                        {templates.length === 0 ? (
                            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>
                                No templates saved yet
                            </p>
                        ) : (
                            templates.map((template, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: "12px",
                                        backgroundColor: "var(--bg-secondary)",
                                        borderRadius: "6px",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <strong>{template.name}</strong>
                                        <button
                                            className="btn-sleek btn-sleek-success"
                                            onClick={() => {
                                                setSelectedTemplate(template.id || index.toString());
                                                setVariableValues({});
                                            }}
                                            style={{ padding: "4px 8px", fontSize: "11px" }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {template.variables && template.variables.length > 0 && (
                                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                            {template.variables.length} variable(s)
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedTemplate && (
                <div className="card-sleek glint-effect" style={{ marginTop: "24px", padding: "24px", boxShadow: "var(--shadow-md)", flexShrink: 0 }}>
                    <h3 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                        <i className="fa fa-check-circle" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                        Apply Template
                    </h3>
                    <p style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
                        Configure template variables (if any) and apply to create a new flow.
                    </p>
                    <button
                        className="btn-sleek btn-sleek-success glint-effect"
                        onClick={() => {
                            const template = templates.find((t) => t.id === selectedTemplate);
                            if (template) applyTemplate(template);
                        }}
                        style={{ padding: "8px 16px" }}
                    >
                        <i className="fa fa-check"></i> Apply Template
                    </button>
                </div>
            )}
        </div>
    );
}

