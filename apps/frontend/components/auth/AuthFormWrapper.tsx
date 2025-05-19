import React from "react";
import { AlertCircle } from "lucide-react";

interface AuthFormWrapperProps {
  title: string;
  error?: string | null;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export default function AuthFormWrapper({
  title,
  error,
  children,
  footerContent,
}: AuthFormWrapperProps) {
  return (
    <div className="max-w-md w-full mx-auto mt-12 p-8 bg-[#D8CDBA] rounded-2xl shadow-lg">
      <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center font-serif">
        {title}
      </h2>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-6 p-2 bg-red-50 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {children}

      {footerContent && (
        <div className="mt-6 text-center text-sm text-gray-900 font-serif">
          {footerContent}
        </div>
      )}
    </div>
  );
}
