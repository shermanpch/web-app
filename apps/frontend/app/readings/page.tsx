"use client";

import PageLayout from "@/components/layout/PageLayout";

export default function ReadingsPage() {
  return (
    <PageLayout>
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 font-serif text-center">
          Readings
        </h1>
        <div className="bg-[#EDE6D6] rounded-2xl p-8 shadow-lg w-full">
          <p className="text-gray-800 text-justify font-serif">
            Your I Ching reading history will appear here.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
