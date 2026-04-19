import React from "react";

export default function RefundPolicy() {
  return (
    <div style={{ paddingTop: "8rem", paddingBottom: "5rem", background: "white", minHeight: "100vh" }}>
      <div className="section-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--color-on-surface)" }}>Refund Policy</h1>
        <p style={{ color: "var(--color-outline)", marginBottom: "3rem", fontSize: "0.9rem" }}>Last Updated: October 2024</p>
        
        <div style={{ color: "var(--color-on-surface-variant)", lineHeight: 1.8, fontSize: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            At ShelfCure, we believe in giving our users the confidence to try our software risk-free. This Refund Policy describes the conditions under which refunds are issued for our paid subscriptions.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>1. Free Trial</h2>
          <p>
            We offer a 7-day free trial on our premium tiers. During this period, you have full access to our OCR engine, offline-first mechanisms, and advanced analytics without requiring a credit card or upfront payment. We strongly encourage all pharmacies to test the software extensively during this time.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>2. Monthly Subscriptions</h2>
          <p>
            Since the free trial provides a substantial opportunity to evaluate ShelfCure, <strong>payments for monthly subscriptions are strictly non-refundable</strong>. You may cancel your subscription at any time; your premium access will continue until the end of your current billing cycle, after which you will not be charged again.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>3. Annual Subscriptions</h2>
          <p>
            If you enroll in an annual plan and decide it isn't for you, we offer a <strong>14-day money-back guarantee</strong> from the date of the initial annual charge. If you contact our support team within 14 days of your purchase, we will refund your payment in full. Following this 14-day grace period, annual subscription fees become non-refundable.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>4. Service Interruptions & Exceptions</h2>
          <p>
            In the highly unlikely event of prolonged, globally recognized service failures on our end that significantly disrupt your pharmacy operations, we may, at our sole discretion, issue prorated credits to your account for future billing cycles.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "1rem" }}>5. How to Request a Refund</h2>
          <p>
            To request a refund under the annual subscription guarantee, or if you believe you have been accidentally charged, please contact us immediately at <strong>info@shelfcure.com</strong>. Include your account email, pharmacy name, and invoice ID so we can expedite your request.
          </p>
        </div>
      </div>
    </div>
  );
}
