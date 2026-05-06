import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Chroma Aura",
  description: "Privacy Policy for Chroma Aura AI.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-6 max-w-4xl py-24 pt-32">
      <div className="prose prose-invert max-w-none">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold font-heading mb-8">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">1. Information We Collect</h2>
          <p className="text-text-muted">
            We collect information you provide directly to us, such as when you create an account, update your profile, 
            or communicate with us. We may also collect technical data automatically when you use our platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">2. How We Use Your Information</h2>
          <p className="text-text-muted">
            We use the information we collect to operate, maintain, and provide the features of our service. 
            This includes personalizing your experience, processing payments, and analyzing usage patterns.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">3. Information Sharing</h2>
          <p className="text-text-muted">
            We do not sell your personal data. We may share information with third-party service providers (such as payment processors and AI hosting providers) 
            solely to the extent necessary to provide our services.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">4. Data Security</h2>
          <p className="text-text-muted">
            We implement reasonable security measures to protect your personal information. However, no method of transmission 
            over the Internet or electronic storage is 100% secure.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">5. Cookies and Tracking</h2>
          <p className="text-text-muted">
            We may use cookies and similar tracking technologies to track activity on our service and hold certain information 
            to improve your experience.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">6. Your Rights</h2>
          <p className="text-text-muted">
            Depending on your location, you may have rights to access, correct, or delete your personal information. 
            Please contact us to exercise these rights.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 mt-8">7. Contact Us</h2>
          <p className="text-text-muted">
            For any questions or concerns regarding your privacy, please contact us at <a href="mailto:ttterminating@gmail.com" className="text-primary hover:underline">ttterminating@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
