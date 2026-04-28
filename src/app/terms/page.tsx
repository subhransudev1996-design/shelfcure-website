import React from "react";

export default function TermsOfService() {
  return (
    <div style={{ paddingTop: "6rem", paddingBottom: "3rem", background: "white", minHeight: "100vh" }}>
      <div className="section-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--color-on-surface)" }}>Terms of Service</h1>
        <p style={{ color: "var(--color-outline)", marginBottom: "3rem", fontSize: "0.9rem" }}>Last Updated: October 2024</p>
        
        <div style={{ color: "var(--color-on-surface-variant)", lineHeight: 1.8, fontSize: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            Welcome to ShelfCure. By registering an account or using our applications (web, mobile, or desktop), you agree to these Terms of Service. Please read them carefully.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>1. Acceptance of Terms</h2>
          <p>
            By accessing ShelfCure, you acknowledge that you are authorized to operate your pharmacy business and accept these terms on behalf of your entity. If you do not agree to all terms, you may not use the service.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>2. Provision of Service</h2>
          <p>
            ShelfCure provides a cloud-synced, offline-first pharmacy ERP system. While we strive for 99.9% uptime, we do not guarantee uninterrupted service. The offline functionality acts as a fallback; it is your responsibility to ensure intermittent internet connectivity to sync data to the cloud.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>3. User Obligations and Compliance</h2>
          <p>
            You agree to use ShelfCure strictly in accordance with local laws governing pharmaceuticals, including prescription fulfillment, taxation (GST), and data privacy laws. ShelfCure provides the tools to aid operational compliance but does not assume legal responsibility for the prescriptions dispensed or prices charged at your pharmacy.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>4. Subscription and Billing</h2>
          <p>
            Certain features of ShelfCure are provided via a paid subscription. Billing occurs on a recurring basis as outlined in your selected plan. Failure to pay may result in temporary suspension of cloud sync and OCR capabilities, though basic local billing access may remain minimally functional to prevent business blockage during disputes.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>5. Limitation of Liability</h2>
          <p>
            In no event will ShelfCure or its developers be liable for direct, indirect, incidental, or consequential damages resulting from the use or inability to use the software, including inventory discrepancies, lost profits, or data loss.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account if you violate these terms, engage in illegal pharmaceutical activities, or misuse our API resources. You may terminate your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
