// components/AuthUI.tsx
"use client";

import React from "react";
import Navbar from "./Navbar";

type AuthUIProps = {
  initialSignIn?: boolean;
};

/**
 * Improved AuthUI — single-file TypeScript component with refined styles
 * - Keeps the original overlay/slide behaviour and route-driven visibility
 * - No external LoginForm/RegisterForm calls — both forms live here
 * - Polished inputs, spacing, accessible labels, and subtle micro-interactions
 */
const AuthUI: React.FC<AuthUIProps> = ({ initialSignIn = true }) => {
  const [signIn, setSignIn] = React.useState<boolean>(initialSignIn);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");

  const onSubmitSignIn = (e?: React.FormEvent) => {
    e?.preventDefault();
    // UI-only: later hook to auth API
    console.log("Sign in", { email, password });
  };

  const onSubmitSignUp = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("Sign up", { name, email, password });
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-[url('/img/bg1.svg')] bg-cover bg-center p-6">
        <div className="relative overflow-hidden rounded-2xl shadow-2xl w-[760px] max-w-full min-h-[480px] bg-transparent">
          {/* Subtle glass card */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/6 to-white/3 backdrop-blur-md border border-white/6 pointer-events-none" />

          {/* Left: Sign Up panel (visually left but logically "signup") */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-500 ease-in-out ${
              signIn ? "opacity-0 z-10 translate-x-0" : "opacity-100 z-30 translate-x-full"
            }`}
            aria-hidden={signIn}
          >
            <form
              onSubmit={onSubmitSignUp}
              className="h-full flex flex-col items-center justify-center p-10 bg-white rounded-l-2xl"
            >
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">Create account</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-[260px] text-center">Join InfoTracer to record and track provenance for online claims.</p>

              <label className="sr-only">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mb-3 px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm shadow-sm"
                placeholder="Full name"
                aria-label="Full name"
              />

              <label className="sr-only">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full mb-3 px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm shadow-sm"
                placeholder="you@company.com"
                aria-label="Email"
              />

              <label className="sr-only">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full mb-4 px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm shadow-sm"
                placeholder="Choose a secure password"
                aria-label="Password"
              />

              <button
                type="submit"
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-[#1466ff] to-[#00c2c7] text-white py-3 font-semibold tracking-wide shadow hover:scale-[0.997] active:scale-95 transition-transform"
              >
                Create account
              </button>

              <div className="mt-4 text-xs text-slate-500">By signing up you agree to our <a href="#" className="underline">terms</a>.</div>
            </form>
          </div>

          {/* Right: Sign In panel */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-500 ease-in-out z-20 ${
              signIn ? "translate-x-0" : "translate-x-full"
            }`}
            aria-hidden={!signIn}
          >
            <form onSubmit={onSubmitSignIn} className="h-full flex flex-col items-center justify-center p-10 bg-gradient-to-b from-white/80 to-white/90 rounded-r-2xl">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">Welcome back</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-[260px] text-center">Sign in to access InfoTracer and continue tracking claims.</p>

              <label className="sr-only">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full mb-3 px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm shadow-sm"
                placeholder="you@company.com"
                aria-label="Email"
              />

              <label className="sr-only">Password</label>
              <div className="relative w-full mb-3">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm shadow-sm"
                  placeholder="••••••••"
                  aria-label="Password"
                />
                <button type="button" className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Show</button>
              </div>

              <div className="w-full flex items-center justify-between mb-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300" /> Remember
                </label>
                <a href="#" className="text-sm text-emerald-600 hover:underline">Forgot?</a>
              </div>

              <button
                type="submit"
                className="cursor-pointer w-full rounded-full bg-gradient-to-r from-[#1466ff] to-[#00c2c7] text-white py-3 font-semibold tracking-wide shadow hover:scale-[0.997] active:scale-95 transition-transform"
              >
                Sign in
              </button>

              <div className="mt-4 text-sm">
                <span className="text-slate-600">New here? </span>
                <button
                  onClick={() => setSignIn(false)}
                  className="cursor-pointer text-emerald-600 font-medium hover:underline ml-1"
                >
                  Create account
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
                backgroundImage: "linear-gradient(90deg, rgba(10,132,255,0.95) 0%, rgba(0,194,199,0.9) 45%, rgba(10,132,255,0.85) 100%)",
              }}
            >
              <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-in-out ${signIn ? "-translate-x-1/6" : "translate-x-0"}`}>
                <h3 className="text-2xl font-bold text-white">Welcome</h3>
                <p className="text-sm text-white/90 mt-3 mb-6 max-w-[240px]">To keep connected with us please login with your personal info.</p>
                <button onClick={() => setSignIn(true)} className="cursor-pointer rounded-full px-6 py-2 border border-white bg-white/10 text-white font-medium hover:bg-white/20 focus:outline-none">Sign In</button>
              </div>

              <div className={`absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-in-out ${signIn ? "translate-x-0" : "translate-x-1/6"}`}>
                <h3 className="text-2xl font-bold text-white">Hi! 🙂</h3>
                <p className="text-sm text-white/90 mt-3 mb-6 max-w-[240px]">Enter your personal details and start a journey with us.</p>
                <button onClick={() => setSignIn(false)} className="cursor-pointer rounded-full px-6 py-2 border border-white bg-white/10 text-white font-medium hover:bg-white/20 focus:outline-none">Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthUI;
