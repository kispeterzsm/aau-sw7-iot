"use client";

import React from "react";
import Link from "next/link";
import DarkModeToggle from "./ModeToggle";

const Navbar: React.FC = () => {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
                {/* Logo and Branding */}
                <Link href="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
                    {/* Animated Logo Box */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                            IOT
                        </div>
                    </div>

                    {/* Text Branding */}
                    <div className="hidden sm:block">
                        <div className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Information Origin Tracker
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 tracking-wide">
                            Provenance & Origin Analysis
                        </div>
                    </div>
                </Link>

                {/* Right Section - Navigation and Actions */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Auth & Dark Mode */}
                    <div className="flex items-center gap-3">
                        {/* Log In Button */}
                        <Link
                            href="/login"
                            className="text-sm px-4 py-2 rounded-lg border border-slate-600/50 text-slate-300 hover:text-slate-100 hover:border-slate-500/50 hover:bg-slate-800/50 transition-all backdrop-blur-sm font-medium"
                        >
                            Log in
                        </Link>

                        {/* Sign Up Button - Gradient */}
                        <Link
                            href="/register"
                            className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all"
                        >
                            Sign up
                        </Link>

                        {/* Dark Mode Toggle */}
                        <div className="pl-2 border-l border-slate-700/50">
                            <DarkModeToggle />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Gradient Divider */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
        </header>
    );
};

export default Navbar;