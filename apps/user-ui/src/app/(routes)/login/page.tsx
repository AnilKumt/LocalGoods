"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff, Mail, ArrowLeft, Loader2, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { AxiosError } from "axios";
import { toast } from "sonner";

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRemeberMe] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const loginMutation = useMutation({
    mutationFn: async(data: FormData)=>{
      const response = await axiosInstance.post(`/api/login-user`, data, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess:(data) =>{
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success("Welcome back! You've been logged in successfully.");
      router.push("/");
    },
    onError:(error:AxiosError)=>{
      const errorMessage = (error.response?.data as {message?: string})?.message ||
      "Invalid credentials!"; 
      setServerError(errorMessage);
      toast.error(errorMessage);
    }
  });

  const handleGoogleLogin = () => {
    toast("Google OAuth will be implemented soon! Please use email login for now.", {
      description: "We're working on integrating Google authentication.",
      duration: 4000,
    });
  };

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your LocalGoods account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._]+\.[a-zA-Z]{2,4}$/,
                    message: "Please enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={16} />
                  {String(errors.email.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {passwordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={16} />
                  {String(errors.password.message)}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  checked={rememberMe}
                  onChange={() => setRemeberMe(!rememberMe)}
                />
                <span className="ml-2">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-900 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Server Error Display */}
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <XCircle size={16} />
                  {serverError}
                </p>
              </div>
            )}
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-gray-900 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
