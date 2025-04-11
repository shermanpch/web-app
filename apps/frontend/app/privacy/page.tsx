import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function PrivacyPolicyPage() {
  return (
    <PageLayout>
      <ContentContainer className="max-w-4xl">
        <Heading>Privacy Policy</Heading>
        <p className="text-xl text-gray-200 font-serif text-center mt-4">
          How we collect, use, and protect your information
        </p>

        {/* Privacy Content */}
        <div className="bg-[#D8CDBA] rounded-2xl p-8 shadow-lg mt-8">
          <div className="prose prose-lg max-w-none text-gray-800">
            <p className="lead">
              This Privacy Policy describes how deltao.ai
              (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects,
              uses, and discloses your personal information when you use our
              website and services.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              1. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold mt-6 mb-4 font-serif">
              1.1 Personal Information
            </h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Name (if provided)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-4 font-serif">
              1.2 Usage Information
            </h3>
            <p>When you use our service, we may collect:</p>
            <ul>
              <li>Your divination queries</li>
              <li>Results of your readings</li>
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information (device type, operating system)</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>
                Send administrative information, such as updates or security
                alerts
              </li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Personalize your experience with our service</li>
              <li>Monitor usage patterns for research and analysis</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              3. Information Sharing and Disclosure
            </h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal
              information to outside parties except in the following
              circumstances:
            </p>
            <ul>
              <li>
                With service providers who assist in our operations (payment
                processors, hosting services)
              </li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>
                In connection with a business transfer (merger, acquisition,
                etc.)
              </li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              4. Data Security
            </h2>
            <p>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission
              over the Internet or electronic storage is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              5. Your Choices
            </h2>
            <p>
              You can access, update, or delete your account information by
              logging into your account settings. You may also contact us
              directly to request access to, correction of, or deletion of any
              personal information we have about you.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              6. Cookies
            </h2>
            <p>
              We use cookies and similar tracking technologies to track activity
              on our Service and hold certain information. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              7. Children&apos;s Privacy
            </h2>
            <p>
              Our Service is not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected personal information
              from children without verification of parental consent, we take
              steps to remove that information.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              8. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              9. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at:
              <br />
              <a
                href="mailto:support@deltao.ai"
                className="text-[#B88A6A] hover:text-[#a87a5a]"
              >
                support@deltao.ai
              </a>
            </p>

            <p className="mt-12 text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
