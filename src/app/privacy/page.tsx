import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{ paddingTop: "8rem", paddingBottom: "5rem", background: "white", minHeight: "100vh" }}>
      <div className="section-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--color-on-surface)" }}>Privacy Policy</h1>
        <p style={{ color: "var(--color-outline)", marginBottom: "3rem", fontSize: "0.9rem" }}>Last Updated: October 2024</p>
        
        <div style={{ color: "var(--color-on-surface-variant)", lineHeight: 1.8, fontSize: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            At ShelfCure, we take your privacy incredibly seriously. This Privacy Policy details how we collect, use, store, and protect the information of pharmacists, their patients, and other users of the ShelfCure platform.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>1. Information We Collect</h2>
          <p>
            When you use ShelfCure, we may collect the following types of information:
          </p>
          <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li><strong>Account Information:</strong> Name, pharmacy name, business registration, email, and billing records.</li>
            <li><strong>Operational Data:</strong> Inventory counts, wholesale invoices, GST bills uploaded for OCR scanning, and transaction histories.</li>
            <li><strong>Patient Information:</strong> Prescription records and patient profiles entered by your pharmacy, which are strictly isolated and encrypted.</li>
            <li><strong>Usage Data:</strong> System interactions, diagnostic data, and access logs used to improve performance and security.</li>
          </ul>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>2. How We Use Your Information</h2>
          <p>
            The data we collect is solely used to provide and enhance the ShelfCure service:
          </p>
          <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>To extract text and automate tax splits via our Gemini OCR engine.</li>
            <li>To synchronize your offline local database (SQLite) with our secure cloud servers.</li>
            <li>To provide business analytics and low stock alerts.</li>
            <li>To comply with regulatory and legal requirements including auditing.</li>
          </ul>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>3. Data Security and Encryption</h2>
          <p>
            ShelfCure employs industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your operational data, especially Patient Health Information (PHI), is siloed logically, and cross-tenant access is strictly prohibited at the database level.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>4. Third-Party Sharing</h2>
          <p>
            We do not sell your personal or operational data to third parties. We may share necessary diagnostic and processing information strictly with trusted infrastructure partners (e.g., cloud hosts, OCR processors) under strict confidentiality agreements.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>5. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, your data rights, or need to export your pharmacy data, contact our support team at <strong>info@shelfcure.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
