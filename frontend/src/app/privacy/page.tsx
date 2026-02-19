import { Layout } from '../../shared/layout';

export default function PrivacyPage() {
  return (
    <Layout maxWidth="lg">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-neutral-600 mb-8">Last updated: February 2024</p>

        <div className="prose prose-neutral max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Introduction</h2>
            <p className="text-neutral-600 mb-4">
              CalorieTracker (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Data We Collect</h2>
            <h3 className="text-lg font-medium text-neutral-900 mb-2 mt-4">Account Information</h3>
            <ul className="list-disc pl-6 text-neutral-600 mb-4">
              <li>Email address</li>
              <li>Display name</li>
              <li>Password (encrypted)</li>
            </ul>

            <h3 className="text-lg font-medium text-neutral-900 mb-2">Health & Nutrition Data</h3>
            <ul className="list-disc pl-6 text-neutral-600 mb-4">
              <li>Food logs (what you eat, when, and how much)</li>
              <li>Calorie goals</li>
              <li>Meal preferences</li>
              <li>Weight (if you choose to log it)</li>
            </ul>

            <h3 className="text-lg font-medium text-neutral-900 mb-2">Technical Data</h3>
            <ul className="list-disc pl-6 text-neutral-600">
              <li>Device information</li>
              <li>IP address (hashed)</li>
              <li>Usage analytics (optional)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">How We Use Your Data</h2>
            <p className="text-neutral-600 mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 text-neutral-600">
              <li>Provide and improve our service</li>
              <li>Track your nutrition progress</li>
              <li>Send you notifications (with your consent)</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns (with opt-in consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Data Sharing</h2>
            <p className="text-neutral-600 mb-4">
              We do not sell your personal data. We may share data only when:
            </p>
            <ul className="list-disc pl-6 text-neutral-600">
              <li>Required by law</li>
              <li>To protect our rights or property</li>
              <li>With service providers who assist our operations (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Data Security</h2>
            <p className="text-neutral-600 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 text-neutral-600">
              <li>Encryption in transit and at rest</li>
              <li>Secure authentication</li>
              <li>Regular security audits</li>
              <li>Access controls and monitoring</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Your GDPR Rights</h2>
            <p className="text-neutral-600 mb-4">
              Under the GDPR, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Object:</strong> Object to processing of your data</li>
              <li><strong>Restrict:</strong> Limit how we process your data</li>
              <li><strong>Withdraw Consent:</strong> Revoke consent at any time</li>
            </ul>
            <p className="text-neutral-600 mt-4">
              To exercise these rights, use the options in Settings or contact us at privacy@calorietracker.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Data Retention</h2>
            <p className="text-neutral-600 mb-4">
              We retain your personal data only as long as necessary for the purposes outlined in this policy.
              When you delete your account, we will permanently remove your data within 30 days, except where required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Children's Privacy</h2>
            <p className="text-neutral-600">
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Changes to This Policy</h2>
            <p className="text-neutral-600">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
            <p className="text-neutral-600">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-neutral-600 mt-2">
              Email: privacy@calorietracker.com<br />
              Address: [Your Address]
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
