"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/divination", label: "Divination" },
    { href: "/dashboard/change-password", label: "Change Password" },
  ];

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Button variant="destructive" onClick={handleLogout} size="sm">
            Logout
          </Button>
        </div>
      </nav>
      <main className="flex-grow">{children}</main>
    </div>
  );
}
