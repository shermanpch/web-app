"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function LogoutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <Button variant="destructive" onClick={handleLogout} size="sm">
      Logout
    </Button>
  );
}
