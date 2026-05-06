import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Chroma Aura",
  description: "Terms of Service for Chroma Aura AI.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-6 max-w-4xl py-24 pt-32">
      <div className="prose prose-invert max-w-none">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold font-heading mb-8">Terms of Service</h1>
        <p className="text-text-muted mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">1. Introduction</h2>
          <p className="text-text-muted">
            Welcome to Chroma Aura. By accessing or using our website, you agree to be bound by these Terms of Service. 
            Please read them carefully.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">2. Use of Service</h2>
          <p className="text-text-muted">
            Our platform provides AI-driven coloring experiences. You agree not to misuse our services or help anyone else to do so.
            You are responsible for any activity that occurs through your account.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">3. Intellectual Property</h2>
          <p className="text-text-muted">
            The generated images and content may be subject to specific licensing terms. Unless otherwise stated, 
            you retain the rights to the content you create, but grant us a license to operate our services.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">4. Purchases and Payments</h2>
          <p className="text-text-muted">
            We use third-party payment processors (like Paddle) to handle transactions. By making a purchase, 
            you agree to their terms as well. You are responsible for all applicable taxes and fees.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">5. Termination</h2>
          <p className="text-text-muted">
            We reserve the right to suspend or terminate your access to the service at any time, with or without cause or notice.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">6. Changes to Terms</h2>
          <p className="text-text-muted">
            We may modify these terms at any time. We will provide notice of any material changes by posting the new Terms on the site.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">7. Contact Us</h2>
          <p className="text-text-muted">
            If you have any questions about these Terms, please contact us at <a href="mailto:ttterminating@gmail.com" className="text-primary hover:underline">ttterminating@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
