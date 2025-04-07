"use client";

import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import PageLayout from "@/components/layout/PageLayout";

export default function SettingsPage() {
  return (
    <PageLayout>
      <div className="flex min-h-screen">
        <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 font-serif">
            Change Password
          </h1>
          
          <ChangePasswordForm />
        </div>
      </div>
    </PageLayout>
  );
}
