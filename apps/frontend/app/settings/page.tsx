"use client";

import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function SettingsPage() {
  return (
    <PageLayout>
      <ContentContainer className="max-w-3xl">
        <Heading>Change Password</Heading>
        <div className="mt-8">
          <ChangePasswordForm />
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
