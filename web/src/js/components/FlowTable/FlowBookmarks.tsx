import * as React from "react";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../ducks";
import { Flow } from "../../flow";
import { fetchApi } from "../../utils";
import * as flowActions from "../../ducks/flows";

export default function FlowBookmarks() {
    const dispatch = useAppDispatch();
    const flows = useAppSelector((state) => state.flows.list);
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [newTag, setNewTag] = useState("");

    useEffect(() => {
        const allTags = new Set<string>();
        flows.forEach((flow) => {
            if (flow.tags) {
                flow.tags.forEach((tag) => allTags.add(tag));
            }
        });
        setTags(Array.from(allTags).sort());
    }, [flows]);

    const bookmarkedFlows = flows.filter((f) => f.bookmarked);
    const filteredFlows = selectedTag
        ? flows.filter((f) => f.tags && f.tags.includes(selectedTag))
        : bookmarkedFlows;

    const toggleBookmark = async (flow: Flow) => {
        try {
            await fetchApi(`/flows/${flow.id}/bookmark`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookmarked: !flow.bookmarked }),
            });
            dispatch(flowActions.update(flow, { bookmarked: !flow.bookmarked }));
        } catch (error) {
            console.error("Failed to toggle bookmark:", error);
        }
    };

    const addTag = async (flow: Flow, tag: string) => {
        if (!tag.trim()) return;
        const currentTags = flow.tags || [];
        if (currentTags.includes(tag)) return;
        const newTags = [...currentTags, tag];
        try {
            await fetchApi(`/flows/${flow.id}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            dispatch(flowActions.update(flow, { tags: newTags }));
        } catch (error) {
            console.error("Failed to add tag:", error);
        }
    };

    const removeTag = async (flow: Flow, tag: string) => {
        const currentTags = flow.tags || [];
        const newTags = currentTags.filter((t) => t !== tag);
        try {
            await fetchApi(`/flows/${flow.id}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            dispatch(flowActions.update(flow, { tags: newTags }));
        } catch (error) {
            console.error("Failed to remove tag:", error);
        }
    };

    const createTag = () => {
        if (!newTag.trim()) return;
        setTags([...tags, newTag.trim()].sort());
        setNewTag("");
    };

    return (
        <div style={{ padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <strong>Filter:</strong>
                    <button
                        className={`btn-sleek ${selectedTag === null ? "btn-sleek-success" : ""}`}
                        onClick={() => setSelectedTag(null)}
                        style={{ padding: "4px 12px", fontSize: "12px" }}
                    >
                        Bookmarks ({bookmarkedFlows.length})
                    </button>
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            className={`btn-sleek ${selectedTag === tag ? "btn-sleek-success" : ""}`}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            style={{ padding: "4px 12px", fontSize: "12px" }}
                        >
                            {tag} ({flows.filter((f) => f.tags?.includes(tag)).length})
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
                    <input
                        type="text"
                        className="input-sleek"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && createTag()}
                        placeholder="New tag..."
                        style={{ width: "150px", padding: "4px 8px" }}
                    />
                    <button className="btn-sleek" onClick={createTag} style={{ padding: "4px 12px", fontSize: "12px" }}>
                        <i className="fa fa-plus"></i>
                    </button>
                </div>
            </div>
            {selectedTag && (
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Showing {filteredFlows.length} flows with tag: <strong>{selectedTag}</strong>
                </div>
            )}
        </div>
    );
}

export function BookmarkButton({ flow }: { flow: Flow }) {
    const dispatch = useAppDispatch();
    const toggleBookmark = async () => {
        try {
            await fetchApi(`/flows/${flow.id}/bookmark`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookmarked: !flow.bookmarked }),
            });
            dispatch(flowActions.update(flow, { bookmarked: !flow.bookmarked }));
        } catch (error) {
            console.error("Failed to toggle bookmark:", error);
        }
    };

    return (
        <button
            className={`btn-sleek ${flow.bookmarked ? "btn-sleek-success" : ""}`}
            onClick={toggleBookmark}
            title={flow.bookmarked ? "Remove bookmark" : "Add bookmark"}
            style={{ padding: "4px 8px" }}
        >
            <i className={`fa fa-${flow.bookmarked ? "bookmark" : "bookmark-o"}`}></i>
        </button>
    );
}

export function TagEditor({ flow }: { flow: Flow }) {
    const dispatch = useAppDispatch();
    const [showEditor, setShowEditor] = useState(false);
    const [newTag, setNewTag] = useState("");

    const addTag = async () => {
        if (!newTag.trim()) return;
        const currentTags = flow.tags || [];
        if (currentTags.includes(newTag.trim())) {
            setNewTag("");
            return;
        }
        const newTags = [...currentTags, newTag.trim()];
        try {
            await fetchApi(`/flows/${flow.id}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            dispatch(flowActions.update(flow, { tags: newTags }));
            setNewTag("");
        } catch (error) {
            console.error("Failed to add tag:", error);
        }
    };

    const removeTag = async (tag: string) => {
        const currentTags = flow.tags || [];
        const newTags = currentTags.filter((t) => t !== tag);
        try {
            await fetchApi(`/flows/${flow.id}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            dispatch(flowActions.update(flow, { tags: newTags }));
        } catch (error) {
            console.error("Failed to remove tag:", error);
        }
    };

    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {flow.tags && flow.tags.map((tag) => (
                <span
                    key={tag}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 6px",
                        backgroundColor: "var(--accent-primary)",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "11px",
                    }}
                >
                    {tag}
                    <button
                        onClick={() => removeTag(tag)}
                        style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0 }}
                    >
                        <i className="fa fa-times" style={{ fontSize: "10px" }}></i>
                    </button>
                </span>
            ))}
            {showEditor ? (
                <div style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                    <input
                        type="text"
                        className="input-sleek"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                        onBlur={() => setShowEditor(false)}
                        autoFocus
                        placeholder="Tag name"
                        style={{ width: "100px", padding: "2px 6px", fontSize: "11px" }}
                    />
                    <button className="btn-sleek" onClick={addTag} style={{ padding: "2px 6px", fontSize: "11px" }}>
                        <i className="fa fa-check"></i>
                    </button>
                    <button className="btn-sleek" onClick={() => setShowEditor(false)} style={{ padding: "2px 6px", fontSize: "11px" }}>
                        <i className="fa fa-times"></i>
                    </button>
                </div>
            ) : (
                <button
                    className="btn-sleek"
                    onClick={() => setShowEditor(true)}
                    style={{ padding: "2px 6px", fontSize: "11px" }}
                    title="Add tag"
                >
                    <i className="fa fa-plus"></i>
                </button>
            )}
        </div>
    );
}

