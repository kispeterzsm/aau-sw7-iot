"use client";

import React from "react";
import Navbar from "./Navbar";

type AuthUIProps = {
  initialSignIn?: boolean;
};

const AuthUI: React.FC<AuthUIProps> = ({ initialSignIn = true }) => {
  const [signIn, setSignIn] = React.useState<boolean>(initialSignIn);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const onSubmitSignIn = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("Sign in", { email, password });
  };

  const onSubmitSignUp = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("Sign up", { name, email, password });
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-white dark:via-slate-50 dark:to-white p-6 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative overflow-hidden rounded-3xl shadow-2xl w-[800px] max-w-full min-h-[520px] bg-transparent">
          {/* Subtle glass card backdrop */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/6 to-white/3 dark:from-slate-900/40 dark:to-slate-900/20 backdrop-blur-md border border-white/10 dark:border-slate-700/50 pointer-events-none" />

          {/* Left: Sign Up panel */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-500 ease-in-out ${
              signIn ? "opacity-0 z-10 translate-x-0" : "opacity-100 z-30 translate-x-full"
            }`}
            aria-hidden={signIn}
          >
            <form
              onSubmit={onSubmitSignUp}
              className="h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100 rounded-l-3xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600 bg-clip-text text-transparent mb-2">
                  Create Account
                </h2>
                <p className="text-sm text-slate-400 dark:text-slate-600 max-w-[280px]">
                  Join InfoTracer to trace and verify online claims
                </p>
              </div>

              {/* Name Input */}
              <div className="w-full mb-4">
                <label className="sr-only">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 dark:border-slate-300/50 bg-slate-800/50 dark:bg-white/50 text-slate-100 dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50 focus:outline-none text-sm shadow-sm transition-all"
                  placeholder="Full name"
                  aria-label="Full name"
                />
              </div>

              {/* Email Input */}
              <div className="w-full mb-4">
                <label className="sr-only">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 dark:border-slate-300/50 bg-slate-800/50 dark:bg-white/50 text-slate-100 dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50 focus:outline-none text-sm shadow-sm transition-all"
                  placeholder="you@company.com"
                  aria-label="Email"
                />
              </div>

              {/* Password Input */}
              <div className="w-full mb-6">
                <label className="sr-only">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 dark:border-slate-300/50 bg-slate-800/50 dark:bg-white/50 text-slate-100 dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50 focus:outline-none text-sm shadow-sm transition-all"
                  placeholder="Choose a secure password"
                  aria-label="Password"
                />
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white py-3 font-semibold tracking-wide shadow-lg hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Create Account
              </button>

              <div className="mt-6 text-xs text-slate-400 dark:text-slate-600 text-center max-w-[260px]">
                By signing up you agree to our{" "}
                <a href="#" className="underline text-emerald-400 dark:text-emerald-600 hover:text-emerald-300 dark:hover:text-emerald-700 transition-colors">
                  terms
                </a>{" "}
                and{" "}
                <a href="#" className="underline text-emerald-400 dark:text-emerald-600 hover:text-emerald-300 dark:hover:text-emerald-700 transition-colors">
                  privacy policy
                </a>
              </div>
            </form>
          </div>

          {/* Right: Sign In panel */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-500 ease-in-out z-20 ${
              signIn ? "translate-x-0" : "translate-x-full"
            }`}
            aria-hidden={!signIn}
          >
            <form
              onSubmit={onSubmitSignIn}
              className="h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100 rounded-r-3xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-400 dark:text-slate-600 max-w-[280px]">
                  Sign in to continue tracing information origins
                </p>
              </div>

              {/* Email Input */}
              <div className="w-full mb-4">
                <label className="sr-only">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 dark:border-slate-300/50 bg-slate-800/50 dark:bg-white/50 text-slate-100 dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50 focus:outline-none text-sm shadow-sm transition-all"
                  placeholder="you@company.com"
                  aria-label="Email"
                />
              </div>

              {/* Password Input with Show/Hide */}
              <div className="w-full mb-4">
                <label className="sr-only">Password</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600/50 dark:border-slate-300/50 bg-slate-800/50 dark:bg-white/50 text-slate-100 dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50 focus:outline-none text-sm shadow-sm transition-all pr-10"
                    placeholder="••••••••"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-600 hover:text-slate-300 dark:hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="w-full flex items-center justify-between mb-6 text-sm">
                <label className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-600 cursor-pointer hover:text-slate-300 dark:hover:text-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-500 dark:border-slate-400 bg-slate-800 dark:bg-white cursor-pointer accent-emerald-500 dark:accent-emerald-600"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-emerald-400 dark:text-emerald-600 hover:text-emerald-300 dark:hover:text-emerald-700 transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white py-3 font-semibold tracking-wide shadow-lg hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Sign In
              </button>

              <div className="mt-6 text-sm text-slate-400 dark:text-slate-600">
                <span>Don't have an account?{" "}</span>
                <button
                  onClick={() => setSignIn(false)}
                  className="cursor-pointer text-emerald-400 dark:text-emerald-600 font-semibold hover:text-emerald-300 dark:hover:text-emerald-700 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>

          {/* Overlay container (center) */}
          <div
            className={`absolute top-0 left-1/2 h-full w-1/2 overflow-hidden transition-transform duration-500 ease-in-out z-40 ${
              signIn ? "transform translate-x-0" : "transform -translate-x-full"
            }`}
          >
            <div
              className={`relative left-[-100%] h-full w-[200%] transform transition-transform duration-500 ease-in-out ${
                signIn ? "translate-x-0" : "translate-x-[50%]"
              }`}
              style={{
                backgroundImage: "linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(6,182,212,0.9) 50%, rgba(16,185,129,0.85) 100%)",
              }}
            >
              {/* Left overlay - Sign In prompt */}
              <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-in-out ${signIn ? "-translate-x-1/6" : "translate-x-0"}`}>
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2">Welcome Back! 👋</h3>
                  <div className="h-1 w-12 bg-white/40 rounded-full mx-auto"></div>
                </div>
                <p className="text-base text-white/90 mb-8 max-w-[240px]">
                  Sign in to your account and continue tracing information origins
                </p>
                <button
                  onClick={() => setSignIn(true)}
                  className="cursor-pointer rounded-full px-8 py-3 border-2 border-white bg-white/10 text-white font-semibold hover:bg-white/20 focus:outline-none transition-all hover:scale-105"
                >
                  Sign In
                </button>
              </div>

              {/* Right overlay - Sign Up prompt */}
              <div className={`absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-in-out ${signIn ? "translate-x-0" : "translate-x-1/6"}`}>
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2">New Here? 🚀</h3>
                  <div className="h-1 w-12 bg-white/40 rounded-full mx-auto"></div>
                </div>
                <p className="text-base text-white/90 mb-8 max-w-[240px]">
                  Create an account and start tracing information across the web
                </p>
                <button
                  onClick={() => setSignIn(false)}
                  className="cursor-pointer rounded-full px-8 py-3 border-2 border-white bg-white/10 text-white font-semibold hover:bg-white/20 focus:outline-none transition-all hover:scale-105"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthUI;