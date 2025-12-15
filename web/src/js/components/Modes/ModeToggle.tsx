import * as React from "react";

type ModeToggleProps = React.PropsWithChildren<{
    value: boolean;
    label: string;
    onChange: (e: React.ChangeEvent) => void;
}>;

export function ModeToggle({
    value,
    onChange,
    children,
    label,
}: ModeToggleProps) {
    const id = React.useId();

    return (
        <div className="mode-entry">
            <label
                className="checkbox-sleek"
                htmlFor={`mode-checkbox-${id}`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 0,
                    fontWeight: "normal",
                    cursor: "pointer",
                    marginRight: "10px",
                }}
            >
                <input
                    type="checkbox"
                    name={`mode-checkbox-${id}`}
                    id={`mode-checkbox-${id}`}
                    checked={value}
                    onChange={onChange}
                />
                <span className="checkmark"></span>
            </label>
            <label
                htmlFor={`mode-checkbox-${id}`}
                style={{
                    marginBottom: 0,
                    fontWeight: "normal",
                    cursor: "pointer",
                    flex: 1,
                }}
            >
                {label}
            </label>
            {children}
        </div>
    );
}
