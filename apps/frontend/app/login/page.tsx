"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { authApi } from "@/lib/api/endpoints/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginCredentials } from "@/types/auth";
import { userApi } from "@/lib/api/endpoints/user";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import AuthInput from "@/components/auth/AuthInput";
import AuthFormWrapper from "@/components/auth/AuthFormWrapper";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      // Update the user data in the cache
      queryClient.setQueryData(["currentUser"], response.data.user);

      // Force a refetch of the current user
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Prefetch user profile status immediately after login
      queryClient.prefetchQuery({
        queryKey: ["userProfileStatus"],
        queryFn: userApi.getUserProfileStatus,
        staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
      });

      // Prefetch first page of readings data immediately after login
      queryClient.prefetchQuery({
        queryKey: ["userReadings", 1],
        queryFn: () => userApi.getUserReadings({ page: 1, limit: 5 }),
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

  const footerContent = (
    <>
      Don&apos;t have an account?{" "}
      <Link
        href="/register"
        className="text-[#B88A6A] hover:text-[#a87a5a] font-medium"
      >
        Register Now
      </Link>
    </>
  );

  return (
    <PageLayout>
      <ContentContainer>
        {/* Header */}
        <div className="mb-8">
          <Heading>deltao.ai</Heading>
          <p className="text-xl text-gray-300 font-serif text-center">
            Your personal Deltao AI oracle rooted in 3000 years of ancient Chinese Philosophy
          </p>
        </div>

        <AuthFormWrapper
          title="Welcome Back!"
          error={
            loginMutation.error ? (loginMutation.error as Error).message : null
          }
          footerContent={footerContent}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <AuthInput
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your Email here"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
            />

            <AuthInput
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your Password here"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
            />

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
          </form>
        </AuthFormWrapper>
      </ContentContainer>
    </PageLayout>
  );
}
