import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import api from "../services/api";
import { FiHelpCircle } from "react-icons/fi";

// Import new Dashboard components
import HeroSection from "../components/Home/Dashboard/HeroSection";
import KeyMetrics from "../components/Home/Dashboard/KeyMetrics";
import LearningPath from "../components/Home/Dashboard/LearningPath";
import CareerCoachCard from "../components/Home/Dashboard/CareerCoachCard";
import RecentActivity from "../components/Home/Dashboard/RecentActivity";
import Tour from "../components/Tour/Tour";
import { useTour } from "../context/TourContext";
import StreakCelebration, { StreakLostModal, StreakFreezeModal } from "../components/Home/Dashboard/StreakCelebration";


function HomeLoggedIn() {
  const { userData } = useSelector((store) => store.auth);
  const userProfile = userData?.userProfile || {};
  const { startTour, resetTour } = useTour();


  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showStreakLost, setShowStreakLost] = useState(false);
  const [showStreakFreeze, setShowStreakFreeze] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      profileStrength: { score: 0, change: "+0 this week" },
      applications: { applied: 0, interviews: 0 },
      streak: { days: 0, message: "Start your streak!", tier: 'none', best: 0, freezes: 0 }
    },
    careerGoal: { title: null, targetDate: null },
    activities: []
  });

  // Track login streak
  const trackStreak = useCallback(async () => {
    try {
      const response = await api.post('/api/v1/users/streak');
      if (response.data.success) {
        const data = response.data.data;
        setStreakData(data);

        // Show appropriate modal based on what happened
        if (data.streakLost && data.streakLostValue > 1) {
          // Show streak lost modal
          setShowStreakLost(true);
        } else if (data.usedFreeze) {
          // Show freeze used modal
          setShowStreakFreeze(true);
        } else if (data.newTierUnlocked || (data.streakUpdated && [3, 7, 14, 30].includes(data.current_streak))) {
          // Show celebration
          setShowCelebration(true);
        }

        return data;
      }
    } catch (error) {
      // Silently handle 404 errors (endpoint may not exist yet)
      if (error.response?.status === 404) {
        // Streak endpoint doesn't exist, return null silently
        return null;
      }
      console.error('Error tracking streak:', error);
      // Try GET if POST fails (and it's not a 404)
      try {
        const getResponse = await api.get('/api/v1/users/streak');
        if (getResponse.data.success) {
          setStreakData(getResponse.data.data);
          return getResponse.data.data;
        }
      } catch (e) {
        // Silently handle 404 errors
        if (e.response?.status !== 404) {
          console.error('Error getting streak:', e);
        }
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Track login streak first
        const streak = await trackStreak();

        // Parallel data fetching
        const [appStatsRes, shelfRes, overviewRes, uploadsRes] = await Promise.allSettled([
          api.get('/api/v1/applications/stats'),
          api.get('/api/v1/enhanced-ai-career-coach/knowledge-base/shelf'),
          api.get('/api/v1/enhanced-ai-career-coach/dashboard/overview'),
          api.get('/api/v1/users/profile/uploads')
        ]);

        // Process Application Stats
        const appStats = appStatsRes.status === 'fulfilled' ? appStatsRes.value.data.data : { applied: 0, interviews: 0 };

        // Process Overview (Activities + Tasks)
        const overviewData = overviewRes.status === 'fulfilled' ? overviewRes.value.data.data : { activities: [], nextTasks: [] };

        // Process Shelf Data (Progress)
        const shelfData = shelfRes.status === 'fulfilled' ? shelfRes.value.data.data : {};
        const progressData = shelfData.progressData || {};

        // Process Uploads
        const uploads = uploadsRes.status === 'fulfilled' ? (uploadsRes.value.data.data || []) : [];
        const hasUploadedResume = uploads.length > 0;

        // Process Profile/Goal
        const goalTitle = userProfile.targetRole || progressData.targetRole || null;

        // Calculate Profile Strength & Missing Fields
        const profileFields = [
          { key: 'name', label: 'Full Name', value: userProfile.name, link: '/profile' },
          { key: 'location', label: 'Location', value: userProfile.location, link: '/profile' },
          { key: 'primaryRole', label: 'Primary Role', value: userProfile.primaryRole, link: '/profile' },
          { key: 'resume', label: 'Resume', value: userProfile.resume || hasUploadedResume, link: '/profile' }, // Or /upload if you have one
          { key: 'skills', label: 'Skills', value: userProfile.skills && userProfile.skills.length > 0, link: '/profile' },
          { key: 'bio', label: 'Bio', value: userProfile.bio, link: '/profile' }
        ];

        const filledFields = profileFields.filter(f => Boolean(f.value));
        const missingFields = profileFields.filter(f => !Boolean(f.value)).map(f => ({ label: f.label, link: f.link }));
        const strengthScore = Math.round((filledFields.length / profileFields.length) * 100);

        // Streak message based on tier
        const getStreakMessage = (tier, days) => {
          switch (tier) {
            case 'legend': return '🏆 Legendary!';
            case 'champion': return '🥇 Champion!';
            case 'dedicated': return '🔥 On fire!';
            case 'consistent': return '⭐ Keep going!';
            case 'starter': return '🌱 Good start!';
            default: return days > 0 ? 'Building momentum!' : 'Log in daily!';
          }
        };

        setDashboardData({
          metrics: {
            profileStrength: {
              score: strengthScore,
              change: missingFields.length > 0 ? `${missingFields.length} steps left` : "All set!",
              missingFields: missingFields
            },
            applications: { applied: appStats.applied || 0, interviews: appStats.interviews || 0 },
            streak: {
              days: streak?.current_streak || 0,
              message: getStreakMessage(streak?.streak_tier, streak?.current_streak),
              tier: streak?.streak_tier || 'none',
              best: streak?.best_streak || 0,
              freezes: streak?.freezesAvailable || 0
            }
          },
          careerGoal: { title: goalTitle, targetDate: progressData?.targetDate || (goalTitle ? "6 months" : null) },
          activities: overviewData.activities || [], // from new endpoint
          tasks: overviewData.nextTasks || [], // from new endpoint
          progressData
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchDashboardData();
    }
  }, [userData, trackStreak]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Take Tour Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              resetTour('dashboard');
              setTimeout(() => startTour('dashboard'), 100);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
          >
            <FiHelpCircle className="text-lg" />
            Take Tour
          </button>
        </div>

        <div className="hero-section">
          <HeroSection
            userProfile={userProfile}
            careerGoal={dashboardData.careerGoal}
            progress={dashboardData?.metrics?.profileStrength?.score || 0}
          />
        </div>

        <div className="key-metrics">
          <KeyMetrics metrics={dashboardData.metrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="learning-path">
              <LearningPath tasks={dashboardData.tasks} />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="recent-activity">
              <RecentActivity activities={dashboardData.activities} />
            </div>
            <CareerCoachCard />
          </div>
        </div>


      </div>

      {/* Tour Component - Only auto-start if not completed */}
      <Tour tourId="dashboard" autoStart={false} />

      {/* Streak Lost Modal */}
      {showStreakLost && streakData && (
        <StreakLostModal
          lostStreak={streakData.streakLostValue}
          onClose={() => setShowStreakLost(false)}
        />
      )}

      {/* Streak Freeze Used Modal */}
      {showStreakFreeze && streakData && (
        <StreakFreezeModal
          currentStreak={streakData.current_streak}
          freezesLeft={streakData.freezesAvailable}
          onClose={() => setShowStreakFreeze(false)}
        />
      )}

      {/* Streak Celebration Modal */}
      {showCelebration && streakData && !showStreakLost && !showStreakFreeze && (
        <StreakCelebration
          streak={streakData.current_streak}
          tier={streakData.streak_tier}
          bestStreak={streakData.best_streak}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}

export default HomeLoggedIn;
