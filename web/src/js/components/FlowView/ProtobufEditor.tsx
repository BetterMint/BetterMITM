import * as React from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import { HTTPFlow, Flow } from "../../flow";
import { fetchApi } from "../../utils";
import * as flowActions from "../../ducks/flows";

function ProtobufEditor({ flow }: { flow: Flow }) {
    const dispatch = useAppDispatch();
    const [protoFile, setProtoFile] = useState<File | null>(null);
    const [decodedFields, setDecodedFields] = useState<any[]>([]);
    const [editingField, setEditingField] = useState<number | null>(null);

    const handleProtoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProtoFile(file);
        const formData = new FormData();
        formData.append("proto", file);

        try {
            const response = await fetchApi("/protobuf/import", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            setDecodedFields(result.fields || []);
        } catch (error) {
            console.error("Failed to import proto file:", error);
            alert("Failed to import .proto file");
        }
    };

    const decodeProtobuf = async () => {
        try {
            const response = await fetchApi(`/flows/${httpFlow.id}/protobuf/decode`, {
                method: "POST",
            });
            const result = await response.json();
            setDecodedFields(result.fields || []);
        } catch (error) {
            console.error("Failed to decode protobuf:", error);
            alert("Failed to decode protobuf");
        }
    };

    const updateField = async (index: number, value: any) => {
        try {
            await fetchApi(`/flows/${flow.id}/protobuf/field/${index}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value }),
            });
            dispatch(flowActions.update(flow, {}));
        } catch (error) {
            console.error("Failed to update field:", error);
        }
    };

    if (flow.type !== "http") {
        return (
            <div style={{ padding: "20px" }}>
                <p>Protobuf editor is only available for HTTP flows.</p>
            </div>
        );
    }

    const httpFlow = flow as HTTPFlow;

    return (
        <div style={{ padding: "20px" }}>
            <div className="card-sleek" style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "16px" }}>gRPC/Protobuf Enhanced Support</h3>
                <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                    <label className="label-sleek">Import .proto File:</label>
                    <input
                        type="file"
                        accept=".proto"
                        onChange={handleProtoUpload}
                        style={{ width: "100%" }}
                    />
                </div>
                <button
                    className="btn-sleek btn-sleek-success"
                    onClick={decodeProtobuf}
                    style={{ padding: "8px 16px", marginBottom: "16px" }}
                >
                    <i className="fa fa-code"></i> Decode Protobuf
                </button>
            </div>

            {decodedFields.length > 0 && (
                <div className="card-sleek">
                    <h3 style={{ marginBottom: "16px" }}>Protobuf Fields</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {decodedFields.map((field, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: "12px",
                                    backgroundColor: "var(--bg-secondary)",
                                    borderRadius: "4px",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <div>
                                        <strong>{field.name}</strong>
                                        <span style={{ marginLeft: "8px", color: "var(--text-secondary)", fontSize: "12px" }}>
                                            {field.type}
                                        </span>
                                    </div>
                                    <button
                                        className="btn-sleek"
                                        onClick={() => setEditingField(editingField === index ? null : index)}
                                        style={{ padding: "4px 8px", fontSize: "11px" }}
                                    >
                                        {editingField === index ? "Cancel" : "Edit"}
                                    </button>
                                </div>
                                {editingField === index ? (
                                    <div>
                                        <input
                                            type="text"
                                            className="input-sleek"
                                            defaultValue={field.value}
                                            onBlur={(e) => updateField(index, e.target.value)}
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                        {JSON.stringify(field.value)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

ProtobufEditor.displayName = "Protobuf";

export default ProtobufEditor;

