"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Settings, LogOut, History, Menu, X } from "lucide-react";
import { authApi } from "@/lib/api/endpoints/auth";
import { User as AuthUser } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/endpoints/user";

interface NavigationBarProps {
  user: AuthUser | null;
}

export default function NavigationBar({
  user: initialUser,
}: NavigationBarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch user data client-side with better error handling
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null; // Return null on error to avoid breaking the UI
      }
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: 1, // Retry once if fetch fails
    initialData: initialUser,
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
      // Invalidate the user query
      queryClient.setQueryData(["currentUser"], null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/try-now", label: "Try Now" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-900/80 backdrop-blur-sm">
      <div className="flex justify-between items-center py-4 px-4 md:px-6 w-full">
        {/* Logo or Brand - can be added here */}
        <div className="flex items-center">
          {/* Hamburger menu button - only visible on mobile */}
          <button
            className="md:hidden text-gray-200 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Desktop navigation - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-8 font-serif">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-200 hover:text-white transition-colors text-lg"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Account dropdown - aligned right on desktop */}
        <div className="font-serif">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Avatar className="h-10 w-10">
                    {user.image && (
                      <AvatarImage
                        src={user.image}
                        alt={user.name || user.email}
                      />
                    )}
                    <AvatarFallback className="bg-gray-700 text-gray-200">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#F0E6D6]" align="end">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6]"
                >
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6]"
                >
                  <Link href="/readings" className="flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>Readings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6]"
                >
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-300" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6] flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile menu - slides down when hamburger is clicked */}
      <div
        className={`md:hidden fixed top-[60px] left-0 right-0 bg-gray-900/95 backdrop-blur-sm transition-all duration-300 z-40 ${
          isMobileMenuOpen ? "max-h-screen py-4" : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col space-y-4 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-200 hover:text-white transition-colors text-lg font-serif"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
