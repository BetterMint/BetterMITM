import * as React from "react";
import { useState, useEffect } from "react";
import { fetchApi } from "../../utils";

export default function CertificateManagement() {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [selectedCert, setSelectedCert] = useState<string | null>(null);

    useEffect(() => {
        fetchApi("/certificates")
            .then((res) => res.json())
            .then((data) => setCertificates(data || []))
            .catch((err) => console.error("Failed to load certificates:", err));
    }, []);

    const importCertificate = async (file: File) => {
        const formData = new FormData();
        formData.append("cert", file);
        try {
            await fetchApi("/certificates/import", {
                method: "POST",
                body: formData,
            });
            alert("Certificate imported successfully");
        } catch (error) {
            console.error("Failed to import certificate:", error);
            alert("Failed to import certificate");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <div className="card-sleek" style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "16px" }}>Certificate Management</h3>
                <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                    <label className="label-sleek">Import Custom CA Certificate:</label>
                    <input
                        type="file"
                        accept=".pem,.crt,.cer"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) importCertificate(file);
                        }}
                        style={{ width: "100%" }}
                    />
                </div>
            </div>

            <div className="card-sleek">
                <h3 style={{ marginBottom: "16px" }}>Certificate Chain</h3>
                <p style={{ color: "var(--text-secondary)" }}>Certificate management features coming soon...</p>
            </div>
        </div>
    );
}

