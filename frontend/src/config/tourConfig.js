// Tour configurations for different pages
export const tourConfigs = {
    dashboard: {
        id: 'dashboard',
        title: 'Dashboard Tour',
        description: 'Learn how to navigate your career dashboard',
        steps: [
            {
                target: 'body',
                content: 'Welcome to Linkivo! Your career growth companion. Let me show you around your dashboard.',
                placement: 'center',
                disableBeacon: true,
            },
            {
                target: '.hero-section',
                content: 'Track your career goal and progress here. Set targets and see how you\'re advancing toward your dream role.',
                placement: 'bottom',
            },
            {
                target: '.key-metrics',
                content: 'Key Metrics: Monitor your profile strength, job applications, and daily activity streaks. Consistency is key!',
                placement: 'bottom',
            },
            {
                target: '.learning-path',
                content: 'Learning Path: Your personalized roadmap with recommended tasks and skills to develop.',
                placement: 'top',
            },
            {
                target: '.recent-activity',
                content: 'Recent Activity: See your latest journal entries, document uploads, and AI recommendations.',
                placement: 'left',
            },
            {
                target: '[data-tour="help-menu"]',
                content: 'Need help? Click the help button anytime to access guided tours and learn about new features.',
                placement: 'left',
            },
        ],
    },


    aiCoach: {
        id: 'aiCoach',
        title: 'AI Career Coach Tour',
        description: 'Discover how your AI Career Coach helps you grow',
        steps: [
            {
                target: 'body',
                content: 'Welcome to your AI Career Coach! Let me show you around the powerful features that will help accelerate your career growth.',
                placement: 'center',
                disableBeacon: true,
            },
            {
                target: '[data-tour="ai-coach-sidebar"]',
                content: 'This sidebar is your navigation hub. Click any icon to explore different sections of your career coach.',
                placement: 'right',
            },
            {
                target: '[data-tour="ai-coach-content-main-dashboard"]',
                content: 'Start here! Your dashboard shows quick stats, tips, and shortcuts to key features. Use the sidebar to navigate.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="memories-content"]',
                content: 'Memories: Journal your career thoughts, wins, and reflections. AI analyzes these to provide personalized insights.',
                placement: 'left',
            },
            {
                target: '[data-tour="ai-inbox-content"]',
                content: 'AI Inbox: Get personalized career recommendations based on your roadmap, journal entries, and goals. Check daily!',
                placement: 'left',
            },
            {
                target: '[data-tour="knowledge-base-content"]',
                content: 'Knowledge Base: Upload resumes, documents, and certificates. AI processes them into insights stored in your Research Deck.',
                placement: 'left',
            },
            {
                target: '[data-tour="research-deck"]',
                content: 'Research Deck: Your curated collection of market insights, job roles, courses, and articles based on your career goals.',
                placement: 'left',
            },
            {
                target: '[data-tour="market-insights-content"]',
                content: 'Market Insights: Track industry trends, salary data, and skill demand for your target role.',
                placement: 'left',
            },
            {
                target: '[data-tour="memory-usage"]',
                content: 'Memory Usage: Track how much of your AI memory you\'ve used. Keep journaling and uploading to improve recommendations!',
                placement: 'top',
            },
        ],
    },

    upload: {
        id: 'upload',
        title: 'Document Upload Tour',
        description: 'Learn how to upload and analyze your documents',
        steps: [
            {
                target: 'body',
                content: 'Upload your resume, CV, or portfolio for AI-powered analysis!',
                placement: 'center',
                disableBeacon: true,
            },
            {
                target: '[data-tour="upload-zone"]',
                content: 'Drag and drop your documents here, or click to browse. Supported formats: PDF, DOC, DOCX for resumes and cover letters.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="upload-history"]',
                content: 'View your upload history and analysis results here. Click on any file to see detailed feedback.',
                placement: 'top',
            },
        ],
    },

    community: {
        id: 'community',
        title: 'Community Tour',
        description: 'Connect with other professionals',
        steps: [
            {
                target: 'body',
                content: 'Welcome to the Linkivo Community! This feature is coming soon - a place where job seekers and professionals connect, share experiences, and grow together.',
                placement: 'center',
                disableBeacon: true,
            },
        ],
    },

    settings: {
        id: 'settings',
        title: 'Settings Tour',
        description: 'Customize your Linkivo experience',
        steps: [
            {
                target: 'body',
                content: 'Personalize your Linkivo experience in Settings! Use the tabs below to navigate between different settings sections.',
                placement: 'center',
                disableBeacon: true,
            },
            {
                target: '[data-tour="general-tab"]',
                content: 'General Tab: Configure notifications, appearance, and general preferences.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="notifications"]',
                content: 'Notifications: Choose which notifications you want to receive - AI Coach nudges, career insights, and goal reminders.',
                placement: 'left',
            },
            {
                target: '[data-tour="ai-coach-tab"]',
                content: 'AI Coach Tab: Manage your AI Coach preferences, nudge times, and data permissions.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="ai-consent"]',
                content: 'AI Consent: Control what data your AI Coach can access for personalized insights - resume, journals, goals, and more.',
                placement: 'left',
            },
            {
                target: '[data-tour="account-tab"]',
                content: 'Account Tab: Update your password, email, and manage your account security. Profile editing is also available here.',
                placement: 'bottom',
            },
        ],
    },

    profile: {
        id: 'profile',
        title: 'Profile Tour',
        description: 'Manage your professional profile',
        steps: [
            {
                target: 'body',
                content: 'Build a compelling professional profile! Your profile helps AI generate better career recommendations.',
                placement: 'center',
                disableBeacon: true,
            },
            {
                target: '[data-tour="profile-content"]',
                content: 'Use the tabs above to navigate between About, Social, Experience, Education, Skills, and Goals sections.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="account-tab"]',
                content: 'Tip: You can also access profile settings from Settings > Account tab.',
                placement: 'top',
            },
        ],
    },
};

// Get tour steps by ID
export const getTourSteps = (tourId) => {
    return tourConfigs[tourId]?.steps || [];
};

// Get all available tours
export const getAllTours = () => {
    return Object.values(tourConfigs);
};

// Get tour by ID
export const getTourById = (tourId) => {
    return tourConfigs[tourId];
};
