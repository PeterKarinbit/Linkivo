import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TourContext = createContext();

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};

export const TourProvider = ({ children }) => {
    const [activeTour, setActiveTour] = useState(null);
    const [tourProgress, setTourProgress] = useState({});
    const [showHelpMenu, setShowHelpMenu] = useState(false);
    const [hasCheckedNewUser, setHasCheckedNewUser] = useState(false);

    // Load tour progress from localStorage on mount
    useEffect(() => {
        try {
            const savedProgress = localStorage.getItem('tour-progress');
            if (savedProgress) {
                setTourProgress(JSON.parse(savedProgress));
            }
        } catch (error) {
            console.error('Failed to load tour progress:', error);
        }
    }, []);

    // Check if user is new and auto-start dashboard tour
    useEffect(() => {
        if (hasCheckedNewUser) return;
        
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setHasCheckedNewUser(true);
                return;
            }

            // Check if this is a new user (no tour progress at all)
            const savedProgress = localStorage.getItem('tour-progress');
            const tourProgressObj = savedProgress ? JSON.parse(savedProgress) : {};
            const isNewUser = !savedProgress || Object.keys(tourProgressObj).length === 0;
            
            // Also check if user account was created recently (within last 7 days)
            // Try to get from localStorage or check if first login
            const userCreatedAt = localStorage.getItem('userCreatedAt');
            const firstLogin = localStorage.getItem('firstLogin');
            const isRecentlyCreated = userCreatedAt && (Date.now() - parseInt(userCreatedAt)) < 7 * 24 * 60 * 60 * 1000;
            const isFirstLogin = firstLogin === 'true';
            
            // Mark as checked to prevent multiple checks
            setHasCheckedNewUser(true);
            
            // Auto-start dashboard tour for new users
            if (isNewUser || isRecentlyCreated || isFirstLogin) {
                // Store that we've shown the tour to prevent showing again
                if (isFirstLogin) {
                    localStorage.setItem('firstLogin', 'false');
                }
                
                // Auto-start dashboard tour after a short delay
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath === '/' || currentPath === '/home' || currentPath === '/home-logged-in') {
                        setActiveTour('dashboard');
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to check new user status:', error);
            setHasCheckedNewUser(true);
        }
    }, [hasCheckedNewUser]);

    // Save tour progress to localStorage whenever it changes
    const saveTourProgress = useCallback((tourId, completed = true) => {
        setTourProgress(prev => {
            const updated = {
                ...prev,
                [tourId]: {
                    completed,
                    completedAt: new Date().toISOString()
                }
            };
            try {
                localStorage.setItem('tour-progress', JSON.stringify(updated));
            } catch (error) {
                console.error('Failed to save tour progress:', error);
            }
            return updated;
        });
    }, []);

    // Start a tour
    const startTour = useCallback((tourId) => {
        setActiveTour(tourId);
    }, []);

    // End the current tour
    const endTour = useCallback((completed = true) => {
        if (activeTour) {
            saveTourProgress(activeTour, completed);
        }
        setActiveTour(null);
    }, [activeTour, saveTourProgress]);

    // Check if a tour has been completed
    const isTourCompleted = useCallback((tourId) => {
        return tourProgress[tourId]?.completed === true;
    }, [tourProgress]);

    // Reset all tours
    const resetAllTours = useCallback(() => {
        setTourProgress({});
        try {
            localStorage.removeItem('tour-progress');
        } catch (error) {
            console.error('Failed to reset tours:', error);
        }
    }, []);

    // Reset specific tour
    const resetTour = useCallback((tourId) => {
        setTourProgress(prev => {
            const updated = { ...prev };
            delete updated[tourId];
            try {
                localStorage.setItem('tour-progress', JSON.stringify(updated));
            } catch (error) {
                console.error('Failed to reset tour:', error);
            }
            return updated;
        });
    }, []);

    const value = {
        activeTour,
        tourProgress,
        showHelpMenu,
        setShowHelpMenu,
        startTour,
        endTour,
        isTourCompleted,
        resetAllTours,
        resetTour,
        saveTourProgress
    };

    return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
