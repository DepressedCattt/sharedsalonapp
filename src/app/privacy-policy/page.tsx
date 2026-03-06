import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Shared Salon",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

      <section className="space-y-8 text-base leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Who We Are</h2>
          <p>
            Shared Salon (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the platform at{" "}
            <strong>sharedsalon.com.au</strong>, which connects freelance beauty
            professionals with salon venues for chair rentals and bookings.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account information:</strong> name, email address, and profile
              photo — collected when you sign up via Google, Facebook, or email.
            </li>
            <li>
              <strong>Profile data:</strong> business name, bio, location, and listing
              details you provide.
            </li>
            <li>
              <strong>Booking data:</strong> dates, times, and payment details
              processed securely through Stripe.
            </li>
            <li>
              <strong>Usage data:</strong> pages visited, actions taken, and device
              information collected via analytics tools.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account</li>
            <li>To process bookings and payments</li>
            <li>To enable communication between venues and freelancers</li>
            <li>To send transactional emails (booking confirmations, receipts)</li>
            <li>To improve our platform and services</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Facebook Login</h2>
          <p>
            If you choose to sign in with Facebook, we receive your public profile
            information (name, profile picture) and email address as permitted by
            Facebook. We do not post to your Facebook account or access your friends
            list. You can revoke this access at any time via your Facebook settings at{" "}
            <a
              href="https://www.facebook.com/settings?tab=applications"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              facebook.com/settings
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We share data only with
            third-party services necessary to operate the platform (Stripe for
            payments, Google Maps for location, Vercel for hosting). Each provider
            operates under their own privacy policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request
            deletion of your account and associated data at any time — see our{" "}
            <a href="/data-deletion" className="text-blue-600 underline">
              Data Deletion page
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. To
            exercise these rights, email us at{" "}
            <a
              href="mailto:support@sharedsalon.com.au"
              className="text-blue-600 underline"
            >
              support@sharedsalon.com.au
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Significant changes will be
            communicated via email or a notice on the platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
          <p>
            Questions about this policy? Contact us at{" "}
            <a
              href="mailto:support@sharedsalon.com.au"
              className="text-blue-600 underline"
            >
              support@sharedsalon.com.au
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
