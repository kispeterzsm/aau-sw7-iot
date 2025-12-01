"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import DarkModeToggle from "./ModeToggle";

interface Props {
  onShowHistory: () => void;
}

const Navbar: React.FC<Props> = ({ onShowHistory }) => {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    setShowDropdown(false);
  };

  const getUserInitial = () => {
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-gradient-to-r from-white via-slate-50 to-white backdrop-blur-lg dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
              IOT
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Information Origin Tracker
            </div>
            <div className="text-xs text-slate-700 mt-0.5 tracking-wide dark:text-slate-400">
              Provenance & Origin Analysis
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
              </div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200/50 hover:border-slate-300/50 hover:bg-slate-100/50 transition-all backdrop-blur-sm font-medium dark:text-slate-300 dark:hover:text-slate-100 dark:border-slate-700/50 dark:hover:bg-slate-900/50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                    {getUserInitial()}
                  </div>
                  <span className="hidden sm:block text-sm">
                    {session.user.email}
                  </span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200/50 bg-white/90 backdrop-blur-lg shadow-lg z-50 dark:bg-slate-900/90 dark:border-slate-700/50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50">
                        Signed in as
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {session.user.email}
                        </div>
                      </div>
                      {session && (
              <button
                onClick={onShowHistory}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                📚 History
              </button>
            )}
                      <Link href="/settings/security" className="w-full cursor-pointer text-left px-3 my-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-900/50">
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full cursor-pointer text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm px-4 py-2 rounded-lg border border-slate-200/50 text-slate-700 hover:text-slate-900 hover:border-slate-300/50 hover:bg-slate-100/50 transition-all backdrop-blur-sm font-medium dark:text-slate-300 dark:hover:text-slate-100 dark:border-slate-700/50 dark:hover:bg-slate-900/50"
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all"
                >
                  Sign up
                </Link>
              </>
            )}

            <div className="pl-2 border-l border-slate-200/50 dark:border-slate-700/50">
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"></div>


      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Navbar;