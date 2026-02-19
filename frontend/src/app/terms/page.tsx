import { Layout } from '../../shared/layout';

export default function TermsPage() {
  return (
    <Layout maxWidth="lg">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-neutral-600 mb-8">Last updated: February 2024</p>

        <div className="prose prose-neutral max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-neutral-600 mb-4">
              By accessing and using CalorieTracker (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">2. Description of Service</h2>
            <p className="text-neutral-600 mb-4">
              CalorieTracker is a nutrition tracking application that allows users to log food intake, set goals, and track progress.
              The service is provided free of charge unless otherwise specified.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">3. User Responsibilities</h2>
            <p className="text-neutral-600 mb-4">As a user, you agree to:</p>
            <ul className="list-disc pl-6 text-neutral-600">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not share your account with others</li>
              <li>Use the service for lawful purposes only</li>
              <li>Not attempt to reverse engineer or exploit the service</li>
              <li>Respect the rights and privacy of other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">4. Health-Related Disclaimer</h2>
            <p className="text-neutral-600 mb-4">
              CalorieTracker is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p className="text-neutral-600 mb-4">
              Always seek the advice of your physician or other qualified health provider with any questions you may have regarding your health or diet.
              Never disregard professional medical advice or delay in seeking it because of something you have read or used in this service.
            </p>
            <p className="text-neutral-600">
              CalorieTracker makes no representations or warranties about the accuracy, completeness, or suitability of the nutrition information provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">5. Account Termination</h2>
            <p className="text-neutral-600 mb-4">
              We reserve the right to suspend or terminate your account at any time, with or without cause, with or without notice.
            </p>
            <p className="text-neutral-600">
              You may delete your account at any time through the app settings or by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">6. Intellectual Property</h2>
            <p className="text-neutral-600 mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of CalorieTracker and its licensors.
            </p>
            <p className="text-neutral-600">
              You may not reproduce, modify, create derivative works, or publicly display any content from the Service without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-neutral-600 mb-4">
              To the maximum extent permitted by law, CalorieTracker shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>
            <p className="text-neutral-600">
              Our total liability to you for all claims shall not exceed the amount you paid, if any, for using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">8. Indemnification</h2>
            <p className="text-neutral-600">
              You agree to indemnify and hold CalorieTracker harmless from any claims, damages, or expenses arising from your use of the Service or your violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">9. Privacy Policy</h2>
            <p className="text-neutral-600">
              Your use of the Service is also governed by our Privacy Policy, which describes how we collect and use your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">10. Governing Law</h2>
            <p className="text-neutral-600">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">11. Changes to Terms</h2>
            <p className="text-neutral-600">
              We may modify these Terms at any time. We will notify users of significant changes via email or through the app.
              Your continued use of the Service after such modifications constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">12. Contact Information</h2>
            <p className="text-neutral-600">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-neutral-600 mt-2">
              Email: legal@calorietracker.com<br />
              Address: [Your Address]
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
