"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff, User, ArrowLeft, Loader2, XCircle } from "lucide-react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type FormData = {
  email: string;
  password: string;
  name: string;
};

const Signup = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const startResendTimer = () => {
    setCanResend(false);
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axiosInstance.post(`/api/user-registration`, data);
      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      startResendTimer();
      toast.success("OTP sent to your email successfully!");
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message ||
        "Failed to create account. Please try again!";
      setServerError(errorMessage);
      toast.error(errorMessage);
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) return;
      const response = await axiosInstance.post(`/api/verify-user`, {
        ...userData,
        otp: otp.join("")
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Account created successfully! Please login.");
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message ||
        "Invalid OTP. Please try again!";
      toast.error(errorMessage);
    }
  });

  const onSubmit = (data: FormData) => {
    console.log(data)
    signupMutation.mutate(data);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[(index + 1)]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    if (userData && canResend) {
      signupMutation.mutate(userData);
    }
  };

  const handleGoogleSignup = () => {
    toast("Google OAuth will be implemented soon! Please use email signup for now.", {
      description: "We're working on integrating Google authentication.",
      duration: 4000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showOtp ? "Verify Your Account" : "Create Account"}
          </h1>
          <p className="text-gray-600">
            {showOtp 
              ? "Enter the verification code sent to your email"
              : "Join LocalGoods and start shopping"
            }
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {!showOtp ? (
            <>
              {/* Google Signup Button */}
              <button
                onClick={handleGoogleSignup}
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

              {/* Email Signup Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    {...register("name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <XCircle size={16} />
                      {String(errors.name.message)}
                    </p>
                  )}
                </div>

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
                      placeholder="Create a strong password"
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

                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
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

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-gray-900 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* OTP Verification */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-sm text-gray-600">
                  We sent a 4-digit code to <span className="font-medium">{userData?.email}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg font-semibold"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              <button
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={verifyOtpMutation.isPending || otp.some(digit => !digit)}
                onClick={() => verifyOtpMutation.mutate()}
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className="text-gray-900 font-medium hover:underline"
                    >
                      Resend Code
                    </button>
                  ) : (
                    `Resend code in ${timer}s`
                  )}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowOtp(false)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back to Signup
                </button>
              </div>

              {/* OTP Error Display */}
              {verifyOtpMutation?.isError && verifyOtpMutation.error instanceof AxiosError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <XCircle size={16} />
                    {(verifyOtpMutation.error.response?.data as { message?: string })?.message ||
                      "Verification failed. Please try again."}
                  </p>
                </div>
              )}
            </div>
          )}
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

export default Signup;
