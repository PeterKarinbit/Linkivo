import React, { useState, useEffect } from 'react';
import { FaUser, FaClipboardList, FaEdit } from 'react-icons/fa';

function KnowledgeBaseProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/v1/enhanced-ai-career-coach/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    const questions = profile?.knowledge_base_questions || [];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-green-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <FaClipboardList size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Career DNA</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Preferences and values shaping your AI recommendations
                        </p>
                    </div>
                </div>

                {questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No preference data found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {questions.map((q, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white text-sm pr-4">
                                        {q.question}
                                    </h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${q.answer >= 70 ? 'bg-green-100 text-green-700' :
                                            q.answer >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {q.answerLabel}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                                    <div
                                        className={`h-1.5 rounded-full ${q.answer >= 70 ? 'bg-green-500' :
                                                q.answer >= 40 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ width: `${q.answer}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default KnowledgeBaseProfile;
