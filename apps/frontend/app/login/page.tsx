"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginCredentials } from "@/types/auth";
import { userApi } from "@/lib/api/endpoints/user";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      console.log("Login successful:", response);

      // Update the user data in the cache
      queryClient.setQueryData(["currentUser"], response.data.user);

      // Force a refetch of the current user
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Prefetch first page of readings data immediately after login
      queryClient.prefetchQuery({
        queryKey: ["userReadings", 1],
        queryFn: () => userApi.getUserReadings({ page: 1, limit: 5 }),
        staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
      });

      // Prefetch user quota/profile data immediately after login
      queryClient.prefetchQuery({
        queryKey: ["userQuota"],
        queryFn: userApi.getUserQuota,
        staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
      });

      // Navigate using Next.js router
      router.push("/try-now");
      router.refresh();
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const credentials: LoginCredentials = { email, password, rememberMe };
    loginMutation.mutate(credentials);
  };

  return (
    <PageLayout>
      <ContentContainer>
        {/* Header */}
        <div className="mb-8">
          <Heading>I Ching Divination</Heading>
          <p className="text-xl text-gray-300 font-serif text-center">
            AI Powered oracle rooted in 3000 years of ancient Chinese Philosophy
          </p>
        </div>

        {/* Login Form */}
        <div className="max-w-md w-full mx-auto mt-12 p-8 bg-[#D8CDBA] rounded-2xl shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center font-serif">
            Welcome Back!
          </h2>

          {loginMutation.error && (
            <p className="text-sm text-red-600 text-center font-medium mb-6">
              {(loginMutation.error as Error).message}
            </p>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-serif">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your Email here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-serif">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your Password here"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
                />
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean | string) =>
                    setRememberMe(Boolean(checked))
                  }
                  className="border-gray-400 data-[state=checked]:bg-[#B88A6A] data-[state=checked]:border-[#B88A6A]"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-700 font-serif"
                >
                  Remember Me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-[#B88A6A] hover:text-[#a87a5a] font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#B88A6A] hover:bg-[#a87a5a] text-white font-semibold py-6 rounded-lg text-lg mt-8 h-auto disabled:opacity-50"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>

            {/* Register Link */}
            <p className="mt-6 text-center text-sm text-gray-700 font-serif">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
              >
                Register Now
              </Link>
            </p>
          </form>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
