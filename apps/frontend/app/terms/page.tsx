"use client";

import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function TermsOfServicePage() {
  return (
    <PageLayout>
      <ContentContainer className="max-w-4xl">
        <Heading>Terms of Service</Heading>
        <p className="text-xl text-gray-200 font-serif text-center mt-4">
          Please read these terms carefully before using our service
        </p>

        {/* Terms Content */}
        <div className="bg-[#D8CDBA] rounded-2xl p-8 shadow-lg mt-8">
          <div className="prose prose-lg max-w-none text-gray-800">
            <h2 className="text-2xl font-semibold mb-6 font-serif">
              1. Introduction
            </h2>
            <p>
              Welcome to I Ching Divination. These Terms of Service govern your
              use of our website and services. By accessing or using our service,
              you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              2. Definitions
            </h2>
            <p>
              <strong>Service</strong> refers to the I Ching Divination website
              and related services.
              <br />
              <strong>User</strong> refers to individuals who access or use our
              Service.
              <br />
              <strong>Account</strong> means a unique account created for you to
              access our Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              3. User Accounts
            </h2>
            <p>
              When you create an account with us, you must provide information
              that is accurate, complete, and current at all times. Failure to do
              so constitutes a breach of the Terms, which may result in immediate
              termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to
              access the Service and for any activities or actions under your
              password.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              4. Subscription Services
            </h2>
            <p>
              Some parts of the Service are billed on a subscription basis. You
              will be billed in advance on a recurring and periodic basis,
              depending on the type of subscription plan you select.
            </p>
            <p>
              At the end of each period, your subscription will automatically
              renew under the exact same conditions unless you cancel it or we
              cancel it.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              5. Content
            </h2>
            <p>
              Our Service allows you to receive divination readings based on
              ancient I Ching principles. The interpretations provided are for
              entertainment and educational purposes only and should not be
              considered as professional advice.
            </p>
            <p>
              By using our Service, you grant us the right to store and process
              your queries and the results of your divination readings.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              6. Limitation of Liability
            </h2>
            <p>
              In no event shall I Ching Divination, nor its directors, employees,
              partners, agents, suppliers, or affiliates, be liable for any
              indirect, incidental, special, consequential or punitive damages,
              including without limitation, loss of profits, data, use, goodwill,
              or other intangible losses, resulting from your access to or use of
              or inability to access or use the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              7. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will try to
              provide at least 30 days&apos; notice prior to any new terms taking
              effect. What constitutes a material change will be determined at our
              sole discretion.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-6 font-serif">
              8. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              <a
                href="mailto:support@ichingdivination.com"
                className="text-[#B88A6A] hover:text-[#a87a5a]"
              >
                support@ichingdivination.com
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
