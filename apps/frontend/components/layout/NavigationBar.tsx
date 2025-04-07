'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Settings, LogOut, History } from 'lucide-react';
import { authApi } from '@/lib/api/endpoints/auth';
import { User as AuthUser } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NavigationBar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (pathname !== '/login') {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="flex justify-between items-center py-4 px-8 w-full">
      <div className="flex items-center space-x-8 font-serif">
        <Link href="/" className="text-gray-200 hover:text-white transition-colors text-lg">
          Home
        </Link>
        <Link href="/about" className="text-gray-200 hover:text-white transition-colors text-lg">
          About
        </Link>
        <Link href="/try-now" className="text-gray-200 hover:text-white transition-colors text-lg">
          Try Now
        </Link>
        <Link href="/how-it-works" className="text-gray-200 hover:text-white transition-colors text-lg">
          How It Works
        </Link>
        <Link href="/pricing" className="text-gray-200 hover:text-white transition-colors text-lg">
          Pricing
        </Link>
      </div>

      <div className="font-serif">
        {!isLoading && user && pathname !== '/login' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-gray-200 hover:text-white hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-serif p-0 h-auto font-normal text-lg">
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-4 bg-[#F0E6D6]" align="end">
              <DropdownMenuItem asChild className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6]">
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6]">
                <Link href="/readings" className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  <span>Readings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6]">
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-300" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-gray-800 focus:bg-[#e0d6c6] flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
} 