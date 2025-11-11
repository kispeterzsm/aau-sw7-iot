// components/AuthUI.tsx
"use client";

import React from "react";

type AuthUIProps = {
    initialSignIn?: boolean;
};

const AuthUI: React.FC<AuthUIProps> = ({ initialSignIn = true }) => {
    const [signIn, setSignIn] = React.useState<boolean>(initialSignIn);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/img/bg1.jpg')] bg-cover p-6">
            <div className="relative overflow-hidden rounded-xl shadow-2xl w-[678px] max-w-full min-h-[400px] bg-[#6f79e6]">
                {/* Sign Up (left) */}
                <div
                    className={
                        "absolute top-0 left-0 h-full w-1/2 transition-all duration-600 ease-in-out " +
                        (signIn ? "opacity-0 z-10 translate-x-0" : "opacity-100 z-30 translate-x-full")
                    }
                >
                    <form className="h-full flex flex-col items-center justify-center p-12 bg-[#d0cece] text-center">
                        <h1 className="text-2xl font-bold mb-4">Create Account</h1>
                        <input className="w-full mb-3 px-4 py-3 rounded border border-black bg-white" placeholder="Name" />
                        <input className="w-full mb-3 px-4 py-3 rounded border border-black bg-white" type="email" placeholder="Email" />
                        <input className="w-full mb-4 px-4 py-3 rounded border border-black bg-white" type="password" placeholder="Password" />
                        <button
                            type="button"
                            className="rounded-full border-2 border-black bg-[#244cff] text-white font-bold tracking-wider px-12 py-3 uppercase active:scale-95 focus:outline-none"
                        >
                            Sign Up
                        </button>
                    </form>
                </div>

                {/* Sign In (right) */}
                <div
                    className={
                        "absolute top-0 left-0 h-full w-1/2 transition-all duration-600 ease-in-out z-20 " +
                        (signIn ? "translate-x-0" : "translate-x-full")
                    }
                >
                    <form className="h-full flex flex-col items-center justify-center p-12 bg-[#d0cece] text-center">
                        <h1 className="text-2xl font-bold mb-4">Sign in</h1>
                        <input className="w-full mb-3 px-4 py-3 rounded border border-black bg-white" type="email" placeholder="Email" />
                        <input className="w-full mb-3 px-4 py-3 rounded border border-black bg-white" type="password" placeholder="Password" />
                        <a className="text-sm text-[#333] my-3" href="#">Forgot your password?</a>
                        <button
                            type="button"
                            className="rounded-full border-2 border-black bg-[#244cff] text-white font-bold tracking-wider px-12 py-3 uppercase active:scale-95 focus:outline-none"
                        >
                            Sign In
                        </button>
                    </form>
                </div>

                {/* Overlay container */}
                <div
                    className={
                        "absolute top-0 left-1/2 h-full w-1/2 overflow-hidden transition-transform duration-600 ease-in-out z-40 " +
                        (signIn ? "transform translate-x-0" : "transform -translate-x-full")
                    }
                >
                    <div
                        className={
                            "relative left-[-100%] h-full w-[200%] transform transition-transform duration-600 ease-in-out " +
                            (signIn ? "translate-x-0" : "translate-x-[50%]")
                        }
                        style={{
                            backgroundImage: 'linear-gradient(to right, #ff4b2b, #ff416c)',
                        }}
                    >
                        {/* Left overlay panel (shown when signIn=true) */}
                        <div
                            className={
                                "absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center p-10 text-center transition-transform duration-600 ease-in-out " +
                                (signIn ? "-translate-x-1/5" : "translate-x-0")
                            }
                        >
                            <h1 className="text-2xl font-bold text-white">Welcome</h1>
                            <p className="text-sm font-light text-white leading-6 mt-4 mb-6">
                                To keep connected with us please login with your personal info
                            </p>
                            <button
                                onClick={() => setSignIn(true)}
                                className="rounded-full border border-white bg-transparent text-white px-8 py-3 font-bold hover:opacity-90 focus:outline-none"
                            >
                                Sign In
                            </button>
                        </div>

                        {/* Right overlay panel (shown when signIn=false) */}
                        <div
                            className={
                                "absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center p-10 text-center transition-transform duration-600 ease-in-out " +
                                (signIn ? "translate-x-0" : "translate-x-1/5")
                            }
                        >
                            <h1 className="text-2xl font-bold text-white">Hello 🙂</h1>
                            <p className="text-sm font-light text-white leading-6 mt-4 mb-6">
                                Enter your personal details and start journey with us
                            </p>
                            <button
                                onClick={() => setSignIn(false)}
                                className="rounded-full border border-white bg-transparent text-white px-8 py-3 font-bold hover:opacity-90 focus:outline-none"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthUI;
