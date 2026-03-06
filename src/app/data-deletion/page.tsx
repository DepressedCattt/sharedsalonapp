import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — Shared Salon",
};

export default function DataDeletionPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Data Deletion Instructions</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

      <section className="space-y-8 text-base leading-relaxed">
        <div>
          <p>
            If you used Facebook to sign in to Shared Salon and would like us to
            delete your data, you can do so in one of the following ways:
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Option 1 — Delete from within the app</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log in to your Shared Salon account</li>
            <li>
              Go to <strong>Settings → Account</strong>
            </li>
            <li>
              Click <strong>&quot;Delete my account&quot;</strong>
            </li>
            <li>Confirm the deletion</li>
          </ol>
          <p className="mt-3 text-gray-600">
            This will permanently remove your account, profile, listings, bookings,
            and all associated personal data from our systems within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Option 2 — Email us</h2>
          <p>
            Send a deletion request to{" "}
            <a
              href="mailto:support@sharedsalon.com.au"
              className="text-blue-600 underline"
            >
              support@sharedsalon.com.au
            </a>{" "}
            with the subject line <strong>&quot;Data Deletion Request&quot;</strong> and include
            the email address associated with your account. We will process your
            request and confirm deletion within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">What gets deleted</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your account and login credentials</li>
            <li>Your profile information (name, photo, bio)</li>
            <li>Your listings and booking history</li>
            <li>Your messages and conversations</li>
            <li>Any other personal data associated with your account</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Revoking Facebook access</h2>
          <p>
            You can also remove Shared Salon&apos;s access to your Facebook account at any
            time without deleting your Shared Salon account. To do this, visit{" "}
            <a
              href="https://www.facebook.com/settings?tab=applications"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook App Settings
            </a>{" "}
            and remove Shared Salon from your connected apps.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Questions?</h2>
          <p>
            Contact us at{" "}
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
