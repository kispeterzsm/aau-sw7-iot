"use client";

import React from "react";
import { signIn as nextAuthSignIn, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Navbar from "./Navbar";
import { validateSignUp, validateSignIn } from "../../lib/validators";
import { registerUser } from "../actions/actions"; 

type AuthUIProps = {
  initialSignIn?: boolean;
};

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
}

const AuthUI: React.FC<AuthUIProps> = ({ initialSignIn = true }) => {
  const [isSignInMode, setIsSignInMode] = React.useState<boolean>(initialSignIn); // Renamed to avoid conflict
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState({
    email: false,
    password: false,
    name: false,
  });

  const router = useRouter();

  const validateForm = () => {
    setErrors({});
    
    if (isSignInMode) { // Use renamed variable
      const result = validateSignIn({ email, password });
      if (!result.success) {
        const newErrors: FormErrors = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          newErrors[field as keyof FormErrors] = issue.message;
        });
        setErrors(newErrors);
        return false;
      }
    } else {
      const result = validateSignUp({ name, email, password });
      if (!result.success) {
        const newErrors: FormErrors = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          newErrors[field as keyof FormErrors] = issue.message;
        });
        setErrors(newErrors);
        return false;
      }
    }
    
    return true;
  };

  const handleBlur = (field: "email" | "password" | "name") => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Updated sign in handler using server action
  const onSubmitSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched({ email: true, password: true, name: true });
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error;
        
        if (errorMessage.includes(" - ")) {
          const [title, description] = errorMessage.split(" - ");
          toast.error(title, {
            description: description,
          });
        } else {
          toast.error("Sign in failed", {
            description: errorMessage,
          });
        }
      } else {
        toast.success("Welcome back!", {
          description: "You have been successfully signed in.",
        });
        router.push("/");
      }
    } catch (error) {
      toast.error("Sign in error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated sign up handler using server action
  const onSubmitSignUp = async (e?: React.FormEvent) => {
  e?.preventDefault();
  setTouched({ email: true, password: true, name: true });
  
  if (!validateForm()) return;

  setIsLoading(true);

  try {
    const result = await registerUser({ email, password, name });
    
    if (result.success) {
      toast.success(result.message);
      
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.warning("Account created", {
          description: "Your account was created successfully. Please sign in to continue.",
        });
        setIsSignInMode(true);
      } else {
        toast.success("Welcome to InfoTracer!", {
          description: "Your account has been created and you're now signed in.",
        });
        router.push("/");
      }
    } else {
      toast.error(result.message, {
        description: result.error, // This comes from the server action
      });
    }
  } catch (error: any) {
    console.error("Unexpected registration error:", error);
    toast.error("Registration failed", {
      description: "An unexpected error occurred. Please try again.",
    });
  } finally {
    setIsLoading(false);
  }
};

  const switchMode = (isSignIn: boolean) => {
    setIsSignInMode(isSignIn);
    setErrors({});
    setTouched({ email: false, password: false, name: false });
    if (isSignIn) {
      setName("");
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse dark:bg-emerald-500/10"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative overflow-hidden rounded-3xl shadow-2xl w-[800px] max-w-full min-h-[520px] bg-transparent">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/40 dark:to-slate-900/20 backdrop-blur-md border border-slate-200/10 dark:border-slate-700/50 pointer-events-none" />

          {/* Left: Sign Up panel */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-500 ease-in-out ${isSignInMode ? "opacity-0 z-10 translate-x-0" : "opacity-100 z-30 translate-x-full"}`}
            aria-hidden={isSignInMode}
          >
            <form
              onSubmit={onSubmitSignUp} // Use the new onSubmitSignUp
              className="h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-l-3xl"
              noValidate
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Create Account
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-400 max-w-[280px]">
                  Join InfoTracer to trace and verify online claims
                </p>
              </div>

              <div className="w-full mb-4">
                <label className="sr-only">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 dark:bg-white/50 dark:text-slate-900 dark:placeholder-slate-400 focus:ring-2 focus:outline-none text-sm shadow-sm transition-all ${
                    errors.name
                      ? "border-red-300 focus:border-red-400 focus:ring-red-400/50 dark:border-red-400"
                      : "border-slate-200 dark:border-slate-300/50 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50"
                  }`}
                  placeholder="Full name"
                  aria-label="Full name"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div className="w-full mb-4">
                <label className="sr-only">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  type="email"
                  required
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 dark:bg-white/50 dark:text-slate-900 dark:placeholder-slate-400 focus:ring-2 focus:outline-none text-sm shadow-sm transition-all ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-400/50 dark:border-red-400"
                      : "border-slate-200 dark:border-slate-300/50 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50"
                  }`}
                  placeholder="you@company.com"
                  aria-label="Email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="w-full mb-6">
                <label className="sr-only">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  type="password"
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 dark:bg-white/50 dark:text-slate-900 dark:placeholder-slate-400 focus:ring-2 focus:outline-none text-sm shadow-sm transition-all ${
                    errors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-400/50 dark:border-red-400"
                      : "border-slate-200 dark:border-slate-300/50 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50"
                  }`}
                  placeholder="Choose a secure password (min. 8 characters)"
                  aria-label="Password"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white py-3 font-semibold tracking-wide shadow-lg hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="mt-6 text-xs text-slate-700 dark:text-slate-400 text-center max-w-[260px]">
                By signing up you agree to our{" "}
                <a href="#" className="underline text-emerald-600 dark:text-emerald-600 hover:text-emerald-500 dark:hover:text-emerald-700 transition-colors">
                  terms
                </a>{" "}
                and{" "}
                <a href="#" className="underline text-emerald-600 dark:text-emerald-600 hover:text-emerald-500 dark:hover:text-emerald-700 transition-colors">
                  privacy policy
                </a>
              </div>
            </form>
          </div>

          {/* Right: Sign In panel */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-500 ease-in-out z-20 ${isSignInMode ? "translate-x-0" : "translate-x-full"}`}
            aria-hidden={!isSignInMode}
          >
            <form
              onSubmit={onSubmitSignIn}
              className="h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-r-3xl"
              noValidate
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-400 max-w-[280px]">
                  Sign in to continue tracing information origins
                </p>
              </div>

              <div className="w-full mb-4">
                <label className="sr-only">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  type="email"
                  required
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 dark:bg-white/50 dark:text-slate-900 dark:placeholder-slate-400 focus:ring-2 focus:outline-none text-sm shadow-sm transition-all ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-400/50 dark:border-red-400"
                      : "border-slate-200 dark:border-slate-300/50 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50"
                  }`}
                  placeholder="you@company.com"
                  aria-label="Email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="w-full mb-4">
                <label className="sr-only">Password</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    type={showPassword ? "text" : "password"}
                    required
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 dark:bg-white/50 dark:text-slate-900 dark:placeholder-slate-400 focus:ring-2 focus:outline-none text-sm shadow-sm transition-all pr-10 ${
                      errors.password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-400/50 dark:border-red-400"
                        : "border-slate-200 dark:border-slate-300/50 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-emerald-400/50 dark:focus:ring-emerald-600/50"
                    }`}
                    placeholder="••••••••"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              <div className="w-full flex items-center justify-between mb-6 text-sm">
                <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 bg-white cursor-pointer accent-emerald-500 dark:border-slate-400 dark:bg-white dark:accent-emerald-600"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-emerald-600 dark:text-emerald-600 hover:text-emerald-500 dark:hover:text-emerald-700 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white py-3 font-semibold tracking-wide shadow-lg hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>

              <div className="mt-6 text-sm text-slate-700 dark:text-slate-400">
                <span>Don't have an account?{" "}</span>
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className="cursor-pointer text-emerald-600 dark:text-emerald-600 font-semibold hover:text-emerald-500 dark:hover:text-emerald-700 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>

          <div
            className={`absolute top-0 left-1/2 h-full w-1/2 overflow-hidden transition-transform duration-500 ease-in-out z-40 ${isSignInMode ? "transform translate-x-0" : "transform -translate-x-full"}`}
          >
            <div
              className={`relative left-[-100%] h-full w-[200%] transform transition-transform duration-500 ease-in-out ${isSignInMode ? "translate-x-0" : "translate-x-[50%]"}`}
              style={{
                backgroundImage: "linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(6,182,212,0.9) 50%, rgba(16,185,129,0.85) 100%)",
              }}
            >
              <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-in-out ${isSignInMode ? "-translate-x-1/6" : "translate-x-0"}`}>
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2">Welcome Back! 👋</h3>
                  <div className="h-1 w-12 bg-white/40 rounded-full mx-auto"></div>
                </div>
                <p className="text-base text-white/90 mb-8 max-w-[240px]">
                  Sign in to your account and continue tracing information origins
                </p>
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className="cursor-pointer rounded-full px-8 py-3 border-2 border-white bg-white/10 text-white font-semibold hover:bg-white/20 focus:outline-none transition-all hover:scale-105"
                >
                  Sign In
                </button>
              </div>

              <div className={`absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-in-out ${isSignInMode ? "translate-x-0" : "translate-x-1/6"}`}>
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2">New Here? 🚀</h3>
                  <div className="h-1 w-12 bg-white/40 rounded-full mx-auto"></div>
                </div>
                <p className="text-base text-white/90 mb-8 max-w-[240px]">
                  Create an account and start tracing information across the web
                </p>
                <button
                  type="button"
                  onClick={() => switchMode(false)}
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