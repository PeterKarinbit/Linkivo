import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBriefcase } from 'react-icons/fi';

const Careers = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
                    <FiArrowLeft className="mr-2" /> Back to Home
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FiBriefcase size={32} />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Join Our Team
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        We're currently building the future of career development. While we don't have any open positions right now, we're always looking for talented individuals who share our vision.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 max-w-lg mx-auto">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Build with us</h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                            Send us your portfolio and tell us why you want to join Linkivo.
                        </p>
                        <a
                            href="mailto:support@linkivo.tech"
                            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Email Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Careers;
