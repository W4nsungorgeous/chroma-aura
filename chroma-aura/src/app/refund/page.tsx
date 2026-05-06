import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Refund Policy - Chroma Aura",
  description: "Refund Policy for Chroma Aura AI.",
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-6 max-w-4xl py-24 pt-32">
      <div className="prose prose-invert max-w-none">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold font-heading mb-8">Refund Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">1. General Policy</h2>
          <p className="text-text-muted mb-4">
            At Chroma Aura, we strive to ensure our users are satisfied with our AI generation tools. 
            Because our service provides digital products and instant access to compute resources, our refund policies are strict.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">2. Subscription Plans</h2>
          <p className="text-text-muted">
            For recurring subscription plans, we generally do not offer refunds for partial months or unused time. 
            You can cancel your subscription at any time, and you will retain access to the service until the end of your current billing cycle.
            If you experience technical issues that completely prevent you from using the service, please contact support within 7 days of your charge.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">3. Pay-As-You-Go Credits</h2>
          <p className="text-text-muted">
            Purchases of permanent or Pay-As-You-Go credits are final and non-refundable. 
            Once credits have been added to your account, they cannot be exchanged back into fiat currency. 
            If a generation fails due to a system error on our end, the credits will not be deducted, or we will manually refund the credits to your account balance.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">4. Exceptions and Dispute Resolution</h2>
          <p className="text-text-muted">
            We may grant refunds in exceptional circumstances at our sole discretion. 
            If you believe you have been incorrectly charged, please contact us before initiating a chargeback with your bank, 
            as we are happy to resolve legitimate billing errors promptly.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">5. Paddle Integration</h2>
          <p className="text-text-muted">
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
            Paddle provides all customer service inquiries and handles returns in accordance with our policy above.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">6. Contact for Refunds</h2>
          <p className="text-text-muted">
            To request a refund or report a billing issue, please reach out to us at <a href="mailto:ttterminating@gmail.com" className="text-primary hover:underline">ttterminating@gmail.com</a> with your account details and order receipt.
          </p>
        </section>
      </div>
    </div>
  );
}
