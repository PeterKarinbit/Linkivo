import { User } from '../../models/user.model.js';
import EnhancedAICareerCoachService from './enhancedAICareerCoach.service.js';

function parseTimeToMinutes(hhmm) {
  const [h, m] = (hhmm || '09:00').split(':').map(Number);
  return (h % 24) * 60 + (m % 60);
}

function isQuarterStart(date) {
  const month = date.getMonth() + 1; // 1-12
  const isStartMonth = month === 1 || month === 4 || month === 7 || month === 10;
  return isStartMonth && date.getDate() === 1;
}

function shouldRunToday(cadence, now) {
  switch (cadence) {
    case 'daily':
      return true;
    case 'weekly':
      return now.getDay() === 1; // Monday
    case 'monthly':
      return now.getDate() === 1;
    case 'quarterly':
      return isQuarterStart(now);
    default:
      return false;
  }
}

async function generateForUser(userId) {
  try {
    await EnhancedAICareerCoachService.generateProactiveRecommendations(userId, 'proactive');
    await User.updateOne(
      { _id: userId },
      { $set: { 'aiCoachConsent.lastUpdatedAt': new Date() } }
    );
  } catch (e) {
    console.error('Scheduler: failed to generate recommendations for', userId?.toString?.() || userId, e?.message || e);
  }
}

export function startProactiveScheduler() {
  const tickMinutes = parseInt(process.env.AI_SCHEDULER_INTERVAL_MIN || '5');
  let lastMinuteChecked = null;
  let lastKbBatchAt = 0;

  const tick = async () => {
    try {
      const now = new Date();

      // Avoid duplicate work if scheduler ticks multiple times within the same minute
      const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
      if (lastMinuteChecked === minuteKey) return;
      lastMinuteChecked = minuteKey;

      // Load opted-in users
      const users = await User.find({ 'aiCoachConsent.enabled': true }).select('aiCoachConsent aiCoachState').lean();
      if (!users || users.length === 0) return;

      for (const u of users) {
        const cadence = u?.aiCoachConsent?.schedule?.cadence || 'weekly';
        if (cadence === 'off') continue;
        if (!shouldRunToday(cadence, now)) continue;

        // Calculate user's local minute of day using timezone offset
        const tz = u?.aiCoachConsent?.schedule?.timezone || 'UTC';
        const preferred = parseTimeToMinutes(u?.aiCoachConsent?.schedule?.windowLocalTime || '09:00');
        const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
        const currentMinuteOfDay = nowInTz.getHours() * 60 + nowInTz.getMinutes();
        if (currentMinuteOfDay !== preferred) continue;

        await generateForUser(u._id);
      }

      // Every ~6 hours, run KB refresh batch (gated by consent and per-user lastKbRefreshAt)
      const nowMs = Date.now();
      if (nowMs - lastKbBatchAt > 6 * 60 * 60 * 1000) {
        lastKbBatchAt = nowMs;
        for (const u of users) {
          const scopes = u?.aiCoachConsent?.scopes || {};
          if (!u?.aiCoachConsent?.enabled || !scopes.knowledgeBase) continue;
          try {
            await EnhancedAICareerCoachService.refreshKnowledgeBase(u._id);
          } catch (e) {
            console.error('KB refresh failed for user', u._id?.toString?.() || u._id, e?.message || e);
          }
        }
      }
    } catch (e) {
      console.error('Scheduler tick error:', e?.message || e);
    }
  };

  // Initial delay to allow server warm-up
  setTimeout(() => {
    tick();
    setInterval(tick, Math.max(1, tickMinutes) * 60 * 1000);
  }, 5000);

  console.log(`Proactive AI scheduler started. Interval: ${tickMinutes} min.`);
}


