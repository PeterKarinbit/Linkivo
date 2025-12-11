import React from 'react';
import { SignUp } from '@clerk/clerk-react';

function ClerkSignUp() {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Gradient Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-600 to-blue-800">
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-repeat"></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Top Quote Label */}
                    <div className="uppercase tracking-widest text-xs font-light opacity-80">
                        START YOUR JOURNEY
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight">
                            Your Career<br />
                            Starts<br />
                            Here
                        </h1>
                        <p className="text-lg font-light max-w-md opacity-90">
                            Join thousands of professionals transforming their careers
                            with AI-powered guidance and personalized insights.
                        </p>
                    </div>

                    {/* Bottom Gradient Accent */}
                    <div className="h-1 w-32 bg-gradient-to-r from-pink-400 to-transparent rounded-full"></div>
                </div>

                {/* Decorative Flowing Lines */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <svg className="absolute w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                        <path d="M0,300 Q250,200 500,300 T1000,300 L1000,0 L0,0 Z" fill="rgba(255,255,255,0.05)" />
                        <path d="M0,500 Q250,400 500,500 T1000,500 L1000,0 L0,0 Z" fill="rgba(255,255,255,0.03)" />
                    </svg>
                </div>
            </div>

            {/* Right Side - Clean White Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-md">
                    {/* Clerk Sign-Up Component */}
                    <SignUp
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-none bg-transparent",
                                headerTitle: "text-4xl font-serif font-bold text-gray-900",
                                headerSubtitle: "text-sm text-gray-600 mt-2",
                                socialButtonsBlockButton: "hidden", // Hide social buttons including GitHub
                                socialButtonsBlockButtonText: "hidden",
                                dividerLine: "hidden",
                                dividerText: "hidden",
                                formFieldLabel: "text-sm font-medium text-gray-900",
                                formFieldInput: "rounded-lg border-gray-200 focus:border-gray-900 focus:ring-gray-900",
                                formButtonPrimary: "bg-black hover:bg-gray-900 text-white rounded-lg py-3 normal-case text-base font-medium",
                                footerActionLink: "text-black hover:text-gray-700 font-medium",
                                identityPreviewText: "text-gray-900",
                                formResendCodeLink: "text-black hover:text-gray-700",
                                otpCodeFieldInput: "border-gray-200 focus:border-gray-900",
                            },
                            layout: {
                                socialButtonsPlacement: "none", // Completely remove social buttons section
                                socialButtonsVariant: "none",
                            }
                        }}
                        routing="path"
                        path="/clerk-sign-up"
                        signInUrl="/clerk-sign-in"
                        afterSignUpUrl="/user-onboarding"
                        redirectUrl="/user-onboarding"
                        forceRedirectUrl="/user-onboarding"
                    />
                </div>
            </div>
        </div>
    );
}

export default ClerkSignUp;
