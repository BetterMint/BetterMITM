import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { yaml } from "@codemirror/lang-yaml";
import { python } from "@codemirror/lang-python";
import { search } from "@codemirror/search";
import { EditorView } from "@codemirror/view";
import { SyntaxHighlight } from "../../backends/consts";

type CodeEditorProps = {
    initialContent: string;
    onChange: (content: string) => void;
    readonly?: boolean;
    language?: SyntaxHighlight | null;
    showControls?: boolean;
};

export default function CodeEditor({
    initialContent,
    onChange,
    language,
    readonly = false,
    showControls = true,
}: CodeEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [searchQuery, setSearchQuery] = useState("");
    const [replaceQuery, setReplaceQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [viewRef, setViewRef] = useState<EditorView | null>(null);

    const stopPropagation = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => e.stopPropagation(),
        [],
    );

    const formatJSON = useCallback(() => {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            setContent(formatted);
            onChange(formatted);
        } catch (e) {
            alert("Invalid JSON");
        }
    }, [content, onChange]);

    const validateJSON = useCallback(() => {
        try {
            JSON.parse(content);
            alert("Valid JSON");
        } catch (e: any) {
            alert(`Invalid JSON: ${e.message}`);
        }
    }, [content]);

    const extensions = useMemo(() => {
        const baseExtensions = [
            search(), 
            EditorView.lineWrapping,
            EditorView.theme({
                "&": {
                    backgroundColor: "#1e1e1e !important",
                    color: "#d4d4d4 !important",
                },
                ".cm-content": {
                    backgroundColor: "#1e1e1e !important",
                    color: "#d4d4d4 !important",
                    caretColor: "#aeafad",
                    fontSize: "14px",
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                },
                ".cm-focused": {
                    outline: "none",
                },
                ".cm-gutters": {
                    backgroundColor: "#252526 !important",
                    color: "#858585",
                    border: "none",
                },
                ".cm-lineNumbers .cm-gutterElement": {
                    color: "#858585",
                },
                ".cm-activeLineGutter": {
                    backgroundColor: "#2a2d2e",
                },
                ".cm-activeLine": {
                    backgroundColor: "#2a2d2e",
                },
                ".cm-selectionBackground": {
                    backgroundColor: "#264f78",
                },
                ".cm-keyword": { color: "#569cd6" },
                ".cm-string": { color: "#ce9178" },
                ".cm-number": { color: "#b5cea8" },
                ".cm-comment": { color: "#6a9955" },
                ".cm-function": { color: "#dcdcaa" },
                ".cm-variable": { color: "#9cdcfe" },
                ".cm-property": { color: "#9cdcfe" },
                ".cm-operator": { color: "#d4d4d4" },
            }, { dark: true })
        ];
        switch (language) {
            case SyntaxHighlight.PYTHON:
                return [...baseExtensions, python()];
            case SyntaxHighlight.YAML:
                return [...baseExtensions, yaml()];
            case SyntaxHighlight.XML:
                return [...baseExtensions, html()];
                case SyntaxHighlight.JAVASCRIPT:
                    return [...baseExtensions, javascript()];
            case SyntaxHighlight.CSS:
                return [...baseExtensions, css()];
            case undefined:
            case null:
            case SyntaxHighlight.NONE:
            case SyntaxHighlight.ERROR:
                return baseExtensions;
            default: {
                if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
                    try {
                        JSON.parse(content);
                        return [...baseExtensions, json()];
                    } catch {
                        return baseExtensions;
                    }
                }
                return baseExtensions;
            }
        }
    }, [language, content]);

    const handleChange = useCallback((value: string) => {
        setContent(value);
        onChange(value);
    }, [onChange]);

    return (
        <div className="codeeditor" onKeyDown={stopPropagation}>
            {showControls && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px", padding: "8px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>
                    <button
                        className="btn-sleek"
                        onClick={() => setShowSearch(!showSearch)}
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                    >
                        <i className="fa fa-search"></i> Search
                    </button>
                    {(content.trim().startsWith("{") || content.trim().startsWith("[")) && (
                        <>
                            <button
                                className="btn-sleek"
                                onClick={formatJSON}
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                                <i className="fa fa-code"></i> Format JSON
                            </button>
                            <button
                                className="btn-sleek"
                                onClick={validateJSON}
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                                <i className="fa fa-check"></i> Validate JSON
                            </button>
                        </>
                    )}
                </div>
            )}
            {showSearch && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px", padding: "8px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px", alignItems: "center" }}>
                    <input
                        type="text"
                        className="input-sleek"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        style={{ flex: 1, padding: "4px 8px" }}
                    />
                    <input
                        type="text"
                        className="input-sleek"
                        value={replaceQuery}
                        onChange={(e) => setReplaceQuery(e.target.value)}
                        placeholder="Replace..."
                        style={{ flex: 1, padding: "4px 8px" }}
                    />
                    <button
                        className="btn-sleek"
                        onClick={() => {
                            if (searchQuery) {
                                const newContent = content.replace(new RegExp(searchQuery, "g"), replaceQuery);
                                setContent(newContent);
                                onChange(newContent);
                            }
                        }}
                        style={{ padding: "4px 8px" }}
                    >
                        Replace All
                    </button>
                    <button
                        className="btn-sleek"
                        onClick={() => setShowSearch(false)}
                        style={{ padding: "4px 8px" }}
                    >
                        <i className="fa fa-times"></i>
                    </button>
                </div>
            )}
            <CodeMirror
                value={content}
                onChange={handleChange}
                readOnly={readonly}
                extensions={extensions}
                onCreateEditor={(view) => setViewRef(view)}
            />
        </div>
    );
}
