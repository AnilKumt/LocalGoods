"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { AxiosError } from "axios";
import { Eye, EyeOff, ArrowLeft, Mail, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

type FormData = {
  email: string;
  password: string;
};

const ForgotPassword = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState("");
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [serverError, setServerError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
        } else {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axiosInstance.post(
        `/api/forgot-password-user`,
        { email }
      );
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep("otp");
      setServerError(null);
      setCanResend(false);
      startResendTimer();
      toast.success("OTP sent to your email successfully!");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Failed to send OTP. Please try again!";
      setServerError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axiosInstance.post(
        `/api/verify-forgot-password-user`,
        { email: userEmail, otp: otp.join("") }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
      toast.success("OTP verified successfully!");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP. Try again!";
      setServerError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!password) return;
      const response = await axiosInstance.post(
        `/api/reset-password-user`,
        { email: userEmail, newPassword: password }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("email");
      toast.success("Password reset successfully! Please login with your new password.");
      setServerError(null);
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Failed to reset password. Try again!";
      setServerError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
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

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate({ email });
  };

  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };

  const resendOtp = () => {
    if (canResend && userEmail) {
      requestOtpMutation.mutate({ email: userEmail });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && "Enter the verification code sent to your email"}
            {step === "reset" && "Create a new password for your account"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {["email", "otp", "reset"].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName
                    ? "bg-gray-900 text-white"
                    : step === "email" && index === 0
                    ? "bg-gray-900 text-white"
                    : step === "otp" && index <= 1
                    ? "bg-gray-900 text-white"
                    : step === "reset" && index <= 2
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step === "email" && index === 0 && <Mail size={16} />}
                {step === "otp" && index === 1 && <CheckCircle size={16} />}
                {step === "reset" && index === 2 && <Shield size={16} />}
                {!(step === stepName) && index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    step === "email" && index === 0
                      ? "bg-gray-900"
                      : step === "otp" && index <= 1
                      ? "bg-gray-900"
                      : step === "reset" && index <= 2
                      ? "bg-gray-900"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === "email" && (
            <div className="space-y-6">
              <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {requestOtpMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link href="/login" className="text-gray-900 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-sm text-gray-600">
                  We sent a 4-digit code to <span className="font-medium">{userEmail}</span>
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
                  "Verify Code"
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
                  onClick={() => setStep("email")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back to Email
                </button>
              </div>
            </div>
          )}

          {step === "reset" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Create New Password
                </h3>
                <p className="text-sm text-gray-600">
                  Enter a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Enter your new password"
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
                  disabled={resetPasswordMutation.isPending}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setStep("otp")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back to Verification
                </button>
              </div>
            </div>
          )}

          {/* Server Error Display */}
          {serverError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <XCircle size={16} />
                {serverError}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <Link href="/contact" className="text-gray-900 font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
