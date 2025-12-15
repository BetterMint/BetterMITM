import * as React from "react";
import { ModeToggle } from "./ModeToggle";
import { useAppDispatch, useAppSelector } from "../../ducks";
import FileChooser from "../common/FileChooser";
import { update } from "../../ducks/options";
import { fetchApi } from "../../utils";

export default function ProtobufInterceptor() {
    const dispatch = useAppDispatch();
    const enabled = useAppSelector(
        (state) => state.options.protobuf_interceptor_enabled,
    );

    const handleToggle = (e: React.ChangeEvent) => {
        dispatch(update("protobuf_interceptor_enabled", !enabled));
    };

    const handleFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetchApi("/protobuf-file", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                dispatch(update("protobuf_file", result.path));
            } else {
                const errorText = await response.text();
                alert(`Failed to upload protobuf file: ${errorText}`);
            }
        } catch (error) {
            alert(`Failed to upload protobuf file: ${error}`);
        }
    };

    return (
        <div>
            <h4 className="mode-title">Vanguard Protobuf Interceptor</h4>
            <p className="mode-description">
                Intercept and modify protobuf POST requests to *.vg.ac.pvp.net
                (all Vanguard domains). When a flow is paused, you can edit the
                protobuf content, headers, method, and more in the Flow detail view.
            </p>
            <div className="mode-local">
                <ModeToggle
                    value={enabled}
                    label="Vanguard Protobuf Interceptor"
                    onChange={handleToggle}
                >
                    <div
                        className="card-sleek"
                        style={{
                            marginTop: "10px",
                            opacity: enabled ? 1 : 0.6,
                            transition: "opacity 0.3s ease",
                        }}
                    >
                        <FileChooser
                            icon="fa-file-text"
                            text="&nbsp;Select Protobuf File"
                            onOpenFile={handleFileUpload}
                            title={
                                enabled
                                    ? "Select protobuf.txt file"
                                    : "Enable interceptor first"
                            }
                        />
                    </div>
                </ModeToggle>
            </div>
        </div>
    );
}
