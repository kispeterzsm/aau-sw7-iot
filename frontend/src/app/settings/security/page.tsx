"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { setEmailMfaEnabled, requestEmailOtp, verifyEmailOtp, getUserHistory, changeUserPassword } from "../../actions/actions";
import HistoryPanel from "@/app/components/HistoryPanel";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8999";

type View = "security" | "change-password";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const sessionUserId = (session as any)?.user?.id as string | undefined;
  const sessionEmail = (session as any)?.user?.email as string | undefined;

  const [activeView, setActiveView] = useState<View>("security");

  const [userId, setUserId] = useState<string | undefined>(sessionUserId);
  const [email, setEmail] = useState<string | undefined>(sessionEmail);


  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [requestSent, setRequestSent] = useState<boolean>(() => {
    try { return sessionStorage.getItem("mfa_request_sent") === "1"; } catch { return false; }
  });
  const [otpCode, setOtpCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Password change state
  const [curPassword, setCurPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
      setEmail(session.user.email);
      setMfaEnabled(session.user.mfa_email_enabled || false);
    }
  }, [session]);


  const [userHistory, setUserHistory] = useState<{
    id: number;
    user_id: number;
    cache_id: number;
    url: string;
    view_count: number;
    created_at: string;
  }[]>([]);

  useEffect(() => {
    if ((session as any)?.user?.id) {
      (async () => {
        try {
          const hist = await getUserHistory((session as any).user.id);
          setUserHistory(hist || []);
        } catch (err) {
          console.error("Failed to load history:", err);
        }
      })();
    }
  }, [session]);


  async function handleEnableMfa() {
    if (!userId) return toast.error("Please sign in first");
    setIsProcessing(true);
    try {
      await setEmailMfaEnabled(userId, true);
      await requestEmailOtp(userId);
      toast("Verification code sent to your email ✉️");
      setMfaEnabled(false); 
      setRequestSent(true);
      try { sessionStorage.setItem("mfa_request_sent", "1"); } catch {}
    } catch (err: any) {
      toast.error("Unable to enable MFA", { description: err?.message || "Try again" });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRequestOtp() {
    if (!userId) return toast.error("Please sign in first");
    setIsRequesting(true);
    try {
      await requestEmailOtp(userId);
      toast("A new verification code was sent to your email.");
      setRequestSent(true);
      try { sessionStorage.setItem("mfa_request_sent", "1"); } catch {}
    } catch (err: any) {
      toast.error("Unable to send code", { description: err?.message || "Try again" });
    } finally {
      setIsRequesting(false);
    }
  }

async function handleVerifyOtp() {
    if (!userId) return toast.error("Please sign in first");
    if (!otpCode || otpCode.trim().length < 4) return toast.error("Enter the code");
    setIsProcessing(true);
    try {
      await verifyEmailOtp(userId, otpCode.trim());
      
      setMfaEnabled(true);
      setOtpCode("");
      setRequestSent(false);
      try { sessionStorage.removeItem("mfa_request_sent"); } catch {}
      
      await update({ mfa_email_enabled: true }); 

      toast.success("MFA enabled - verification succeeded");
    } catch (err: any) {
      toast.error("Invalid code", { description: err?.message });
    } finally {
      setIsProcessing(false);
    }
  }

async function handleDisableMfa() {
    if (!userId) return toast.error("Please sign in first");
    setIsProcessing(true);
    try {
      await setEmailMfaEnabled(userId, false);
      
      setMfaEnabled(false);
      setRequestSent(false);
      try { sessionStorage.removeItem("mfa_request_sent"); } catch {}

      await update({ mfa_email_enabled: false });

      toast.success("Email MFA disabled");
    } catch (err: any) {
      toast.error("Unable to disable MFA", { description: err?.message });
    } finally {
      setIsProcessing(false);
    }
  }

  /* -------- Change password -------- */

  function validateNewPassword() {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return false;
    }
    return true;
  }

  async function handleChangePassword(e?: React.FormEvent) {
    e?.preventDefault();
    if (!userId) return toast.error("Please sign in first");
    if (!curPassword || !newPassword) return toast.error("Fill all fields");
    if (!validateNewPassword()) return;

    setChangingPassword(true);
    
    try {
      const result = await changeUserPassword(userId, curPassword, newPassword);

      if (result.success) {
        toast.success(result.message);
        setCurPassword("");
        setNewPassword("");
     
      } else {
        toast.error(result.message, { 
          description: result.error 
        });
      }
    } catch (err: any) {
      toast.error("Change failed", { description: "An unexpected error occurred" });
    } finally {
      setChangingPassword(false);
    }
  }
  if (status === "loading") {
    return (
      <>
        <Navbar onShowHistory={() => setShowHistory(true)} />
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
          <div className="rounded-3xl p-6 bg-gradient-to-br from-white to-slate-50 shadow-2xl text-center">Loading…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onShowHistory={() => setShowHistory(true)} />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl p-4 border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50">
                <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Account Settings
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Manage security, password and preferences
                </p>

                <nav className="mt-6 space-y-2">
                  <button
                    onClick={() => setActiveView("security")}
                    className={`w-full cursor-pointer text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeView === "security"
                      ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200/30 shadow-sm text-emerald-700 dark:text-emerald-300"
                      : "hover:bg-slate-100/50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-emerald-100/50 flex items-center justify-center text-emerald-600">🔒</span>
                    <div>
                      <div className="text-sm font-semibold">Security</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Two-factor & account safety</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveView("change-password")}
                    className={`w-full cursor-pointer text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeView === "change-password"
                      ? "bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200/30 shadow-sm text-emerald-700 dark:text-emerald-300"
                      : "hover:bg-slate-100/50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-cyan-100/50 flex items-center justify-center text-cyan-600">🔑</span>
                    <div>
                      <div className="text-sm font-semibold">Change password</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Update your login password</div>
                    </div>
                  </button>
                </nav>

                <div className="mt-6 border-t pt-4 text-xs text-slate-600 dark:text-slate-400">
                  <div>Signed in as</div>
                  <div className="font-medium text-slate-900 dark:text-white truncate">{email ?? "—"}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {activeView === "security" ? "Security" : "Change password"}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {activeView === "security"
                      ? "Manage two-factor authentication and account security settings."
                      : "Change your account password - choose a strong, unique password."
                    }
                  </p>
                </div>
              </div>

              {/* View content */}
              {activeView === "security" ? (
                <section>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="p-4 rounded-xl border border-slate-200/50 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Email MFA</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Add an extra layer of protection: logins require a one-time code sent to your email.
                          </p>
                        </div>

                        <div className="text-sm">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
                          <div className={`font-semibold ${mfaEnabled ? "text-emerald-600" : "text-amber-500"}`}>
                            {mfaEnabled ? "Enabled" : "Disabled"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        {!mfaEnabled ? (
                          <>
                            <button
                              onClick={handleEnableMfa}
                              disabled={isProcessing}
                              className="rounded-full cursor-pointer bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-white font-semibold shadow hover:scale-[1.02] transition-transform disabled:opacity-50"
                            >
                              {isProcessing ? "Processing…" : "Enable Email MFA"}
                            </button>

                          </>
                        ) : (
                          <button
                            onClick={handleDisableMfa}
                            disabled={isProcessing}
                            className="rounded-full cursor-pointer px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            {isProcessing ? "Processing…" : "Disable Email MFA"}
                          </button>
                        )}
                      </div>

                      {/* verification input displayed only when a request is outstanding AND MFA is not yet enabled */}
                      {requestSent && !mfaEnabled && (
                        <div className="mt-4">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Verification code</label>
                          <div className="flex gap-2">
                            <input
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="123456"
                              className="flex-1 px-3 py-2 rounded-lg border bg-white text-sm"
                            />
                            <button
                              onClick={handleVerifyOtp}
                              disabled={isProcessing}
                              className="rounded-full cursor-pointer bg-emerald-500 px-4 py-2 text-white font-semibold"
                            >
                              {isProcessing ? "Verifying…" : "Verify"}
                            </button>
                            {/* <button
                              onClick={handleRequestOtp}
                              disabled={isRequesting}
                              className="ml-2 rounded-full px-3 py-2 border text-sm"
                            >
                              {isRequesting ? "Sending…" : "Resend"}
                            </button> */}
                          </div>
                          <p className="text-xs text-slate-500 mt-2">If you didn’t receive the code, click <button className="underline cursor-pointer hover:scale-105" onClick={handleRequestOtp}>Resend</button>.</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/50 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Security tips</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <li>• Use a strong, unique password - at least 12 characters when possible.</li>
                        <li>• Enable Email MFA for additional protection.</li>
                        <li>• Consider backup/recovery options (contact support if you lose access).</li>
                        <li>• Monitor login activity and report suspicious attempts.</li>
                      </ul>
                    </div>
                  </div>
                </section>
              ) : (
                <section>
                  <form onSubmit={handleChangePassword} className="max-w-xl space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Current password</label>
                      <input
                        type="password"
                        value={curPassword}
                        onChange={(e) => setCurPassword(e.target.value)}
                        className="w-full mt-2 px-4 py-2 rounded-lg border bg-white text-sm focus:outline-none"
                        placeholder="Enter current password"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full mt-2 px-4 py-2 rounded-lg border bg-white text-sm focus:outline-none"
                        placeholder="Choose a new password (min 8 chars)"
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="rounded-full cursor-pointer bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-white font-semibold shadow hover:scale-[1.02] transition-transform disabled:opacity-50"
                      >
                        {changingPassword ? "Changing…" : "Change password"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="rounded-full cursor-pointer px-4 py-2 border border-slate-200/50 text-sm"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      Tip: Use a password manager to create and store a strong password.
                    </div>
                  </form>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>

  <HistoryPanel
    history={userHistory}
    isOpen={showHistory}
    onClose={() => setShowHistory(false)}
    onSelectHistory={(url) => {
      setShowHistory(false);
      router.push(`/?q=${encodeURIComponent(url)}`);
    }}
  />
    </>
  );
}