
import React, { useState } from 'react';
import { AiOutlineWarning, AiOutlineClose } from 'react-icons/ai';

const BetaBanner = () => {
    const [isVisible, setIsVisible] = useState(() => {
        return localStorage.getItem('ivo-beta-banner-dismissed') !== 'true';
    });

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('ivo-beta-banner-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 relative shadow-md z-50">
            <div className="container mx-auto max-w-7xl flex items-center justify-center text-sm md:text-base font-medium">
                <AiOutlineWarning className="text-xl mr-2 flex-shrink-0 animate-pulse" />
                <p className="text-center mr-8">
                    <span className="font-bold">BETA ACCESS:</span> We are currently in beta testing.
                    If you experience any issues, please contact support at{' '}
                    <a
                        href="mailto:support@linkivo.tech"
                        className="underline decoration-white/50 hover:decoration-white hover:text-white transition-all"
                    >
                        support@linkivo.tech
                    </a>
                </p>
                <button
                    onClick={handleDismiss}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Close banner"
                >
                    <AiOutlineClose className="text-lg" />
                </button>
            </div>
        </div>
    );
};

export default BetaBanner;
