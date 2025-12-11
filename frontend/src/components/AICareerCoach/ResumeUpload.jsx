import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ResumeUpload({ onComplete }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRedirectedRef = useRef(false);
  const tab = searchParams.get('tab');

  useEffect(() => {
    // If URL already indicates we should be on goal-setting, skip redirect
    // This prevents loops when returning from upload page
    if (tab === 'goal-setting') {
      // We're already past this step, just mark it complete and move on
      onComplete({ resumeUploaded: true });
      return;
    }

    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    
    // Mark this step as complete before redirecting
    // This ensures the onboarding flow knows we've moved past resume-upload
    onComplete({ resumeUploaded: true });
    
    // Small delay to ensure state updates before navigation
    setTimeout(() => {
      navigate(`/upload?type=resume&from=onboarding&returnTo=/career-coach?tab=goal-setting`, { replace: true });
    }, 100);
  }, [navigate, onComplete, tab]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-gray-900 dark:to-gray-800 text-center px-6">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-file-upload text-2xl text-white"></i>
          </div>
      <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-200 mb-4">
        Redirecting you to upload
          </h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-lg mb-6">
        Your resume helps Ivo tailor every insight. We’ll open the secure upload workspace in just a moment. If nothing happens, use the button below.
                </p>
                <button
        onClick={() => navigate(`/upload?type=resume&from=onboarding&returnTo=/career-coach?tab=goal-setting`, { replace: true })}
        className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-xl transition"
                >
        Go to Uploads
                </button>
    </div>
  );
}

export default ResumeUpload;
