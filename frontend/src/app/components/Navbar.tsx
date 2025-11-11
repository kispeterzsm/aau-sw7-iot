// components/Navbar.tsx
"use client";

import React from "react";
import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";

const Navbar: React.FC = () => {
    return (
        <header className="sticky top-0 z-40 border-b border-gray-300 dark:border-slate-700 bg-background/80 backdrop-blur">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-3xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                        IOT
                    </div>
                    <div>
                        <div className="text-xl font-semibold tracking-tight">Information Origin Tracker</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Provenance & origin tracker for online claims
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    {/* <nav className="hidden sm:flex items-center gap-3">
            <Link href="/about" className="text-sm text-slate-600 dark:text-slate-300 hover:underline">
              About
            </Link>
            <Link href="/docs" className="text-sm text-slate-600 dark:text-slate-300 hover:underline">
              Docs
            </Link>
          </nav> */}

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Log in
                        </Link>

                        <Link
                            href="/register"
                            className="text-sm px-3 py-2 rounded-md bg-emerald-600 text-white hover:brightness-95 shadow-sm"
                        >
                            Sign up
                        </Link>

                        <DarkModeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
