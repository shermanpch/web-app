"use client";

import { useRouter, usePathname } from "next/navigation";
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
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface NavigationBarProps {
  user: AuthUser | null;
}

export default function NavigationBar({
  user: initialUser,
}: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch user data client-side with better error handling
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const userData = await authApi.getCurrentUser();
        // If we get null from the API, invalidate the query to ensure proper state
        if (!userData) {
          queryClient.setQueryData(["currentUser"], null);
        }
        return userData;
      } catch (error) {
        console.error("Error fetching user data:", error);
        // On error, invalidate the query and return null
        queryClient.setQueryData(["currentUser"], null);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // Reduce cache time to 5 minutes for more frequent checks
    refetchOnMount: true, // Changed from "always" to respect staleTime
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting to network
    retry: 2, // Retry twice if fetch fails
    retryDelay: 1000, // Wait 1 second between retries
    initialData: initialUser,
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
      // Clear all queries to ensure clean state
      queryClient.clear();
      // Specifically invalidate user query
      queryClient.setQueryData(["currentUser"], null);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      // Navigate and refresh
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if server logout fails, clear client state
      queryClient.setQueryData(["currentUser"], null);
      router.push("/login");
      router.refresh();
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/try-now", label: "Try Now" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/pricing", label: "Pricing" },
  ];

  // If the current path is /try-now/consulting, don't render the navigation bar
  if (pathname === "/try-now/consulting") {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      {/* Gradient background to match ContentContainer */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-[#1a1812]/70 to-black/80 border-b border-[rgba(218,165,32,0.3)]"></div>

      <div className="flex justify-between items-center py-4 px-4 md:px-6 w-full relative">
        {/* Logo or Brand - can be added here */}
        <div className="flex items-center">
          {/* Hamburger menu button - only visible on mobile */}
          <button
            className="md:hidden text-[#EDE6D6] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md p-1"
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
              className="text-[#EDE6D6] hover:text-white hover:border-b hover:border-[rgba(218,165,32,0.6)] pb-1 transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
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
                  className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Avatar className="h-10 w-10">
                    {user.image && (
                      <AvatarImage
                        src={user.image}
                        alt={user.name || user.email}
                      />
                    )}
                    <AvatarFallback className="bg-[#1a1812] text-[#EDE6D6] border border-[rgba(218,165,32,0.3)]">
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
        className={`md:hidden fixed top-[60px] left-0 right-0 transition-all duration-300 z-40 ${
          isMobileMenuOpen ? "max-h-screen py-4" : "max-h-0 overflow-hidden"
        }`}
      >
        {/* Gradient background for mobile menu */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-[#1a1812]/70 to-black/80 border-b border-[rgba(218,165,32,0.3)]"></div>

        <div className="flex flex-col space-y-4 px-4 relative">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#EDE6D6] hover:text-white hover:border-b hover:border-[rgba(218,165,32,0.6)] pb-1 transition-colors text-lg font-serif"
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
