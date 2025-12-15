import * as React from "react";
import { Flow } from "../../flow";

type FlowFilterProps = {
    onFilterChange: (filter: FlowFilterState) => void;
};

export type FlowFilterState = {
    types: Set<string>;
    directions: Set<string>;
};

const allFlowTypes = ["http", "tcp", "udp", "dns"];

const defaultFilter: FlowFilterState = {
    types: new Set(allFlowTypes),
    directions: new Set(["both"]),
};

export default function FlowFilters({ onFilterChange }: FlowFilterProps) {
    const [filter, setFilter] = React.useState<FlowFilterState>(defaultFilter);
    const [isTypesOpen, setIsTypesOpen] = React.useState(false);
    const typesRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typesRef.current && !typesRef.current.contains(event.target as Node)) {
                setIsTypesOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleType = (type: string) => {
        const newTypes = new Set(filter.types);
        if (newTypes.has(type)) {
            newTypes.delete(type);
        } else {
            newTypes.add(type);
        }
        const newFilter = { ...filter, types: newTypes };
        setFilter(newFilter);
        onFilterChange(newFilter);
    };

    const handleDirectionChange = (direction: string) => {
        const newFilter = { ...filter, directions: new Set([direction]) };
        setFilter(newFilter);
        onFilterChange(newFilter);
    };

    const selectAll = () => {
        const newFilter = {
            types: new Set(allFlowTypes),
            directions: new Set(["both"]),
        };
        setFilter(newFilter);
        onFilterChange(newFilter);
    };

    const typeLabels: { [key: string]: string } = {
        http: "HTTP",
        tcp: "TCP",
        udp: "UDP",
        dns: "DNS",
    };

    const selectedTypesText = Array.from(filter.types)
        .map((t: string) => typeLabels[t] || t)
        .join(", ") || "None";

    const selectedDirection = Array.from(filter.directions)[0] || "both";

    return (
        <div
            style={{
                padding: "6px 12px",
                backgroundColor: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                fontSize: "12px",
            }}
        >
            <span style={{ fontWeight: "bold", marginRight: "4px", color: "var(--text-primary)" }}>Filter:</span>
            
            <div ref={typesRef} style={{ position: "relative", display: "inline-block" }}>
                <button
                    className="btn-sleek btn-sleek-secondary"
                    onClick={() => setIsTypesOpen(!isTypesOpen)}
                    style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        minWidth: "120px",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span>Types: {selectedTypesText}</span>
                    <i className={`fa fa-chevron-${isTypesOpen ? "up" : "down"}`} style={{ marginLeft: "8px", fontSize: "10px" }}></i>
                </button>
                {isTypesOpen && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            marginTop: "4px",
                            backgroundColor: "var(--bg-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "6px",
                            boxShadow: "var(--shadow-md)",
                            zIndex: 1000,
                            minWidth: "150px",
                            padding: "4px",
                        }}
                    >
                        {allFlowTypes.map((type) => (
                            <label
                                key={type}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    padding: "6px 8px",
                                    borderRadius: "4px",
                                    backgroundColor: filter.types.has(type) ? "var(--bg-tertiary)" : "transparent",
                                    color: "var(--text-primary)",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!filter.types.has(type)) {
                                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!filter.types.has(type)) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={filter.types.has(type)}
                                    onChange={() => toggleType(type)}
                                    style={{ marginRight: "8px", cursor: "pointer" }}
                                />
                                {typeLabels[type]}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Direction:</span>
                <select
                    className="select-sleek"
                    value={selectedDirection}
                    onChange={(e) => handleDirectionChange(e.target.value)}
                    style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        minWidth: "100px",
                    }}
                >
                    <option value="both">Both</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                </select>
            </div>

            <button
                className="btn-sleek btn-sleek-secondary glint-effect"
                onClick={selectAll}
                style={{
                    padding: "3px 10px",
                    fontSize: "11px",
                }}
            >
                All
            </button>
        </div>
    );
}

export function filterFlows(flows: Flow[], filter: FlowFilterState): Flow[] {
    return flows.filter((flow) => {
        if (!filter.types.has(flow.type)) {
            return false;
        }

        if (flow.type === "http") {
            const hasRequest = !!flow.request;
            const hasResponse = !!flow.response;
            
            if (filter.directions.has("both")) {
                return true;
            }
            if (filter.directions.has("outbound") && hasRequest && !hasResponse) {
                return true;
            }
            if (filter.directions.has("inbound") && hasResponse) {
                return true;
            }
            return false;
        }

        return true;
    });
}

