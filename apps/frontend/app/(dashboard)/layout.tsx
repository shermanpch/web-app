import React from "react";
import Link from "next/link";

// Import components
import LogoutButton from "@/components/auth/logout-button";
import UserDisplay from "@/app/(dashboard)/_components/UserDisplay";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/divination", label: "Divination" },
    { href: "/dashboard/change-password", label: "Change Password" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))]"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <UserDisplay />
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="flex-grow">{children}</main>
    </div>
  );
}
