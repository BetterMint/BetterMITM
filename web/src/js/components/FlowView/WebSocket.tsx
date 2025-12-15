import * as React from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import { HTTPFlow } from "../../flow";
import { fetchApi } from "../../utils";
import * as flowActions from "../../ducks/flows";
import CodeEditor from "../contentviews/CodeEditor";
import { SyntaxHighlight } from "../../backends/consts";

export default function WebSocket({ flow }: { flow: HTTPFlow }) {
    const dispatch = useAppDispatch();
    const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
    const [messageContent, setMessageContent] = useState("");
    const [injectMessage, setInjectMessage] = useState("");

    if (!flow.websocket) {
        return (
            <div style={{ padding: "20px" }}>
                <p>No WebSocket messages in this flow.</p>
            </div>
        );
    }

    const messages = (flow.websocket as any).messages || [];

    const modifyMessage = async (index: number) => {
        try {
            await fetchApi(`/flows/${flow.id}/websocket/${index}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: messageContent }),
            });
            dispatch(flowActions.update(flow, {}));
            alert("Message modified");
        } catch (error) {
            console.error("Failed to modify message:", error);
            alert("Failed to modify message");
        }
    };

    const injectNewMessage = async (direction: "client" | "server") => {
        try {
            await fetchApi(`/flows/${flow.id}/websocket/inject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: injectMessage, direction }),
            });
            dispatch(flowActions.update(flow, {}));
            setInjectMessage("");
            alert("Message injected");
        } catch (error) {
            console.error("Failed to inject message:", error);
            alert("Failed to inject message");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <div className="card-sleek" style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "16px" }}>WebSocket Messages</h3>
                <div style={{ maxHeight: "400px", overflow: "auto", marginBottom: "16px" }}>
                    <table style={{ width: "100%", fontSize: "12px" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px" }}>#</th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Direction</th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Content</th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((msg: any, index: number) => (
                                <tr
                                    key={index}
                                    style={{
                                        backgroundColor: selectedMessage === index ? "var(--bg-secondary)" : "transparent",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => {
                                        setSelectedMessage(index);
                                        setMessageContent(msg.content || "");
                                    }}
                                >
                                    <td style={{ padding: "8px" }}>{index + 1}</td>
                                    <td style={{ padding: "8px" }}>{msg.from_client ? "Client →" : "← Server"}</td>
                                    <td style={{ padding: "8px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {typeof msg.content === "string" ? msg.content.substring(0, 50) : JSON.stringify(msg.content).substring(0, 50)}
                                    </td>
                                    <td style={{ padding: "8px" }}>
                                        <button
                                            className="btn-sleek"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMessage(index);
                                                setMessageContent(msg.content || "");
                                            }}
                                            style={{ padding: "4px 8px", fontSize: "11px" }}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedMessage !== null && (
                <div className="card-sleek" style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "16px" }}>Edit Message {selectedMessage + 1}</h3>
                    <div style={{ marginBottom: "16px" }}>
                        <label className="label-sleek">Content:</label>
                        <div style={{ height: "200px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                            <CodeEditor
                                initialContent={messageContent}
                                onChange={setMessageContent}
                                showControls={true}
                            />
                        </div>
                    </div>
                    <button
                        className="btn-sleek btn-sleek-success"
                        onClick={() => modifyMessage(selectedMessage)}
                        style={{ padding: "8px 16px" }}
                    >
                        <i className="fa fa-save"></i> Save Changes
                    </button>
                </div>
            )}

            <div className="card-sleek">
                <h3 style={{ marginBottom: "16px" }}>Inject Message</h3>
                <div style={{ marginBottom: "16px" }}>
                    <label className="label-sleek">Message Content:</label>
                    <div style={{ height: "150px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                        <CodeEditor
                            initialContent={injectMessage}
                            onChange={setInjectMessage}
                            showControls={true}
                        />
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        className="btn-sleek btn-sleek-success"
                        onClick={() => injectNewMessage("client")}
                        style={{ padding: "8px 16px" }}
                    >
                        Inject to Client
                    </button>
                    <button
                        className="btn-sleek btn-sleek-success"
                        onClick={() => injectNewMessage("server")}
                        style={{ padding: "8px 16px" }}
                    >
                        Inject to Server
                    </button>
                </div>
            </div>
        </div>
    );
}

WebSocket.displayName = "WebSocket";
