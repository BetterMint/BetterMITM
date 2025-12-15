import * as React from "react";
import { useState } from "react";
import { useAppSelector } from "../../ducks";

export default function AuthTools() {
    const flows = useAppSelector((state) => state.flows.list);
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [jwtToken, setJwtToken] = useState("");
    const [decodedJWT, setDecodedJWT] = useState<any>(null);

    const decodeJWT = (token: string) => {
        try {
            const parts = token.split(".");
            if (parts.length !== 3) {
                alert("Invalid JWT format");
                return;
            }
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            setDecodedJWT({ header, payload });
        } catch (error: any) {
            alert(`Failed to decode JWT: ${error.message}`);
        }
    };

    const extractTokens = (flow: any) => {
        const tokens: string[] = [];
        if (flow.request?.headers) {
            Object.entries(flow.request.headers).forEach(([key, value]: [string, any]) => {
                if (key.toLowerCase() === "authorization" && value.startsWith("Bearer ")) {
                    tokens.push(value.substring(7));
                }
            });
        }
        if (flow.response?.headers) {
            Object.entries(flow.response.headers).forEach(([key, value]: [string, any]) => {
                if (key.toLowerCase() === "set-cookie") {
                    const match = value.match(/token=([^;]+)/);
                    if (match) tokens.push(match[1]);
                }
            });
        }
        return tokens;
    };

    const httpFlows = flows.filter((f) => f.type === "http");
    const selectedFlowObj = selectedFlow ? httpFlows.find((f) => f.id === selectedFlow) : null;
    const extractedTokens = selectedFlowObj ? extractTokens(selectedFlowObj) : [];

    return (
        <div style={{ padding: "20px", height: "100%", overflowY: "auto" }}>
            <div className="card-sleek" style={{ marginBottom: "20px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px" }}>JWT Token Decoder</h3>
                <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                    <label className="label-sleek">JWT Token:</label>
                    <textarea
                        className="textarea-sleek"
                        value={jwtToken}
                        onChange={(e) => setJwtToken(e.target.value)}
                        placeholder="Paste JWT token here"
                        rows={3}
                        style={{ width: "100%" }}
                    />
                </div>
                <button className="btn-sleek btn-sleek-success" onClick={() => decodeJWT(jwtToken)} style={{ padding: "8px 16px" }}>
                    Decode JWT
                </button>
                {decodedJWT && (
                    <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>
                        <div style={{ marginBottom: "12px" }}>
                            <strong>Header:</strong>
                            <pre style={{ marginTop: "4px", fontSize: "12px" }}>{JSON.stringify(decodedJWT.header, null, 2)}</pre>
                        </div>
                        <div>
                            <strong>Payload:</strong>
                            <pre style={{ marginTop: "4px", fontSize: "12px" }}>{JSON.stringify(decodedJWT.payload, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>

            <div className="card-sleek" style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "16px" }}>Token Extraction</h3>
                <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                    <label className="label-sleek">Select Flow:</label>
                    <select
                        className="select-sleek"
                        value={selectedFlow || ""}
                        onChange={(e) => setSelectedFlow(e.target.value || null)}
                        style={{ width: "100%" }}
                    >
                        <option value="">Select a flow...</option>
                        {httpFlows.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.type} - {f.id.substring(0, 8)} - {f.request?.path || ""}
                            </option>
                        ))}
                    </select>
                </div>
                {extractedTokens.length > 0 && (
                    <div>
                        <strong>Extracted Tokens:</strong>
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {extractedTokens.map((token, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "8px",
                                        backgroundColor: "var(--bg-secondary)",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {token}
                                    <button
                                        className="btn-sleek"
                                        onClick={() => {
                                            setJwtToken(token);
                                            decodeJWT(token);
                                        }}
                                        style={{ marginLeft: "8px", padding: "2px 6px", fontSize: "11px" }}
                                    >
                                        Decode
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

