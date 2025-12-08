"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestPasswordResetOtp, resetPasswordWithOtp } from "../../actions/actions"; 
import { ArrowLeft, KeyRound, Mail, Lock } from "lucide-react";
import Navbar from "@/app/components/Navbar";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<"email" | "reset">("email");
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setIsLoading(true);
    try {
      const result = await requestPasswordResetOtp(email);
      if (result.success) {
        toast.success("Code sent!", { description: "Check your inbox for the verification code." });
        setStep("reset");
      } else {
        toast.error("Request failed", { description: result.message });
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error("Please fill all fields");
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setIsLoading(true);
    try {
      const result = await resetPasswordWithOtp({
        email,
        code: otp,
        newPassword
      });

      if (result.success) {
        toast.success("Password Reset!", { description: "Your password has been updated. Please log in." });
        router.push("/login");
      } else {
        toast.error("Reset failed", { description: result.message });
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 relative overflow-hidden">
        {/* Background Blobs (Matches your Login UI) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse dark:bg-emerald-500/10"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative w-[480px] max-w-full">
          {/* Glass Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-8">
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 mb-4 text-emerald-600 dark:text-emerald-400">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {step === "email" ? "Forgot Password?" : "Reset Password"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {step === "email" 
                  ? "Enter your email address and we'll send you a code to reset your password." 
                  : `Enter the code sent to ${email} and your new password.`}
              </p>
            </div>

            {step === "email" ? (
              /* --- STEP 1: REQUEST OTP --- */
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white py-3 font-semibold shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending Code..." : "Send Reset Code"}
                </button>
              </form>
            ) : (
              /* --- STEP 2: VERIFY & RESET --- */
              <form onSubmit={handleResetPassword} className="space-y-4">
                 <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="e.g. 523991"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all text-center tracking-widest font-mono text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full cursor-pointer rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white py-3 font-semibold shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="w-full mt-3 text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
                  >
                    Wrong email? Go back
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}