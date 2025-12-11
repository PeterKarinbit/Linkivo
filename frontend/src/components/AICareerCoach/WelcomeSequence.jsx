import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../store/authSlice';
import { FaRocket, FaChartLine, FaLightbulb, FaMapMarkedAlt, FaMountain, FaCompass, FaSearch, FaRobot, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import IvoGuideImg from '../assets/media/Ivo_Guide.png';
import { userService } from '../../services/userService';
import { marketIntelligenceService } from '../../services/marketIntelligenceService';
import './WelcomeSequence.css';

// ============================================================================
// ARCHETYPE DEFINITIONS - AFRICA-FOCUSED FOR AGES 16-25
// ============================================================================
const archetypeCards = [
  {
    id: 'explorer',
    title: 'The Explorer',
    icon: FaMapMarkedAlt,
    description: 'You\'re curious about many things and want to try different skills before choosing a path',
    examples: 'Perfect for: University students trying out design, coding, and marketing • Recent graduates exploring freelance writing, social media, and video editing • High school students learning photography, web design, and content creation',
    insight: 'Companies across Africa are hiring people with multiple digital skills',
    lightcastMetric: 'Being good at 2-3 things makes you more valuable',
    serperMetric: 'Digital skills in high demand across African markets',
    llmMetric: 'Start with one free course this week',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    iconBg: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    realExamples: [
      'A university student in Nairobi taking free courses in graphic design, coding, and marketing to see what clicks',
      'A recent graduate in Lagos trying out freelance writing, social media management, and video editing',
      'A high school student in Accra learning photography, web design, and content creation on weekends'
    ],
    nextStep: 'Pick one skill you\'re curious about and complete a free 1-week course on YouTube or Coursera. Don\'t worry about being perfect—just start.',
    marketInsight: 'Companies across Africa are hiring people with multiple digital skills. Being good at 2-3 things makes you more valuable than being average at one.'
  },
  {
    id: 'builder',
    title: 'The Builder',
    icon: FaMountain,
    description: 'You have a skill or interest you want to grow into something real—maybe a job, a side hustle, or your own thing',
    examples: 'Perfect for: College students good at design who want paid clients • Graduates who love coding and are building portfolios for tech jobs • Young people making great content who want to turn it into a business',
    insight: 'African startups need skilled people who can deliver practical results',
    lightcastMetric: 'Show what you can do to stand out',
    serperMetric: 'Portfolio beats certificates in African job market',
    llmMetric: 'Create one piece of work to share this week',
    gradient: 'from-green-500 via-emerald-600 to-teal-700',
    iconBg: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    realExamples: [
      'A college student in Kigali who\'s good at graphic design and wants to start getting paid clients',
      'A graduate in Johannesburg who loves coding and is building a portfolio to apply for tech jobs',
      'A young person in Kampala who makes great content and wants to turn it into a business or career'
    ],
    nextStep: 'Create one piece of work you can show people—a design, a website, a video, or a written piece. Post it online or share it with someone who could hire you.',
    marketInsight: 'African startups and small businesses need skilled people who can deliver results. If you can show what you can do, you\'ll stand out from people who only have certificates.'
  },
  {
    id: 'connector',
    title: 'The Connector',
    icon: FaCompass,
    description: 'You\'re good with people and want to work in roles where you help, teach, sell, or bring people together',
    examples: 'Perfect for: Students who love organizing events and want to work in marketing • Graduates great at explaining things interested in sales or training • Young people who enjoy helping others exploring HR, teaching, or community work',
    insight: 'People skills are always in demand across Africa',
    lightcastMetric: 'Every company needs relationship builders',
    serperMetric: 'These roles often don\'t require a specific degree',
    llmMetric: 'Volunteer to organize something this week',
    gradient: 'from-teal-500 via-emerald-600 to-green-700',
    iconBg: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    realExamples: [
      'A student in Dar es Salaam who loves organizing events and wants to work in marketing or event planning',
      'A graduate in Abuja who\'s great at explaining things and is interested in sales, customer service, or training',
      'A young person in Nairobi who enjoys helping others and is exploring careers in HR, teaching, or community work'
    ],
    nextStep: 'Volunteer to help organize something—a small event, a community project, or even a group chat for people with similar interests. Practice bringing people together.',
    marketInsight: 'People skills are always in demand. Every company needs someone who can talk to customers, manage teams, or build relationships. These roles often don\'t require a specific degree.'
  }
];

// ============================================================================
// ARCHETYPE DETAILS - DEEP DIVE CONTENT
// ============================================================================
const archetypeDetails = {
  explorer: {
    title: 'The Explorer Path 🔍',
    subtitle: 'Curiosity is your superpower',
    description: 'You\'re in the best possible position: you get to try things without pressure. The goal isn\'t to pick "the one thing" forever, but to find "the next thing" for now.',
    whyItMatters: 'Companies across Africa are hiring people with multiple digital skills. Being good at 2-3 things (like writing + design, or coding + marketing) makes you more valuable than being average at just one.',
    thisWeek: 'Pick one skill you\'re curious about and complete a free 1-week course on YouTube or Coursera. Don\'t worry about being perfect—just start.',
    quote: 'The best way to predict the future is to create it, one experiment at a time.'
  },
  builder: {
    title: 'The Builder Path 🛠️',
    subtitle: 'Your work speaks louder than a CV',
    description: 'You have a special advantage: you can create value from nothing. Whether it\'s code, design, or content, your ability to "make" is what sets you apart.',
    whyItMatters: 'African startups and small businesses need skilled people who can deliver immediate value. If you can show what you can do (a portfolio), you\'ll stand out from people who only have certificates.',
    thisWeek: 'Create one piece of work you can show people—a design, a website, a video, or a written piece. Post it online or share it with someone who could hire you.',
    quote: 'Don\'t wait to be picked. Pick yourself and start building.'
  },
  connector: {
    title: 'The Connector Path 🤝',
    subtitle: 'Your network is your net worth',
    description: 'You have the most timeless skill of all: dealing with people. In a world of AI and tech, the ability to understand, persuade, and organize humans is becoming rare and valuable.',
    whyItMatters: 'People skills are always in demand. Every company needs someone who can talk to customers, manage teams, or build relationships. These roles often don\'t require a specific degree.',
    thisWeek: 'Volunteer to help organize something—a small event, a community project, or even a group chat for people with similar interests. Practice bringing people together.',
    quote: 'If you want to go fast, go alone. If you want to go far, go together.'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const toolOrder = ['lightcast', 'serper', 'llm'];
const defaultIntelContext = { industry: 'Technology', skills: [], location: 'global' };

const normalizeSkillName = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.name || value.skill || value.title || value.label || null;
  }
  return null;
};

const mapRoleToIndustry = (role = '') => {
  const normalized = role?.toString().toLowerCase() || '';
  if (!normalized) return 'Technology';
  if (normalized.includes('data') || normalized.includes('ai') || normalized.includes('software') || normalized.includes('dev')) return 'Technology';
  if (normalized.includes('product')) return 'Product';
  if (normalized.includes('marketing') || normalized.includes('growth') || normalized.includes('brand')) return 'Marketing';
  if (normalized.includes('finance') || normalized.includes('account') || normalized.includes('investment')) return 'Finance';
  if (normalized.includes('operations') || normalized.includes('project')) return 'Operations';
  if (normalized.includes('sales') || normalized.includes('customer')) return 'Sales';
  return 'Technology';
};

const deriveIntelContextFromUser = (user) => {
  if (!user) return { ...defaultIntelContext };
  const profile = user.userProfile || {};
  const skillSet = new Set();
  const addSkill = (value) => {
    const skill = normalizeSkillName(value);
    if (skill) skillSet.add(skill);
  };

  (profile.skills || user.skills || []).forEach(addSkill);
  if (profile.resume_analysis?.skills_heat_map) {
    Object.keys(profile.resume_analysis.skills_heat_map).forEach(addSkill);
  }
  if (Array.isArray(profile.prioritySkills)) {
    profile.prioritySkills.forEach(addSkill);
  }

  return {
    industry: profile.industry || mapRoleToIndustry(profile.primaryRole || user.primaryRole || ''),
    skills: Array.from(skillSet).slice(0, 6),
    location: profile.location || user.location || 'global'
  };
};

const getPayloadData = (response) => response?.data ?? response ?? null;

const formatNumber = (value) => {
  if (typeof value !== 'number') return null;
  return new Intl.NumberFormat('en-US').format(value);
};

// Get currency based on user location
const getCurrencyFromLocation = (location) => {
  if (!location) return 'USD';
  const loc = location.toString().toUpperCase();
  // East African countries use KES
  if (loc.includes('KENYA') || loc.includes('KE') ||
    loc.includes('UGANDA') || loc.includes('UG') ||
    loc.includes('TANZANIA') || loc.includes('TZ') ||
    loc.includes('RWANDA') || loc.includes('RW')) {
    return 'KES';
  }
  // Default to USD for other locations
  return 'USD';
};

const formatSalaryRange = (range, userLocation) => {
  if (!range) return null;
  const currency = range.currency || getCurrencyFromLocation(userLocation);
  const min = range.min ?? 0;
  const max = range.max ?? 0;
  return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`;
};

const sortSkillsByDemand = (skills = {}) =>
  Object.entries(skills).sort(([, a], [, b]) => (b?.demand_percentage || 0) - (a?.demand_percentage || 0));

const safeHostname = (link) => {
  if (!link) return null;
  try {
    const url = new URL(link);
    return url.hostname.replace('www.', '');
  } catch (_) {
    return null;
  }
};

// ============================================================================
// DATA ENRICHMENT FUNCTIONS
// ============================================================================
const buildArchetypeData = (cards, overview, summary, latest, userLocation) => {
  const hotSkills = overview?.hot_skills || [];
  const topTrend = latest?.latest_insights?.[0];
  const secondTrend = latest?.latest_insights?.[1];
  const salaryRange = summary?.salary_range;
  const alignment = summary?.skills_alignment_score;
  const industryGrowth = overview?.industry_growth;
  const activeJobs = overview?.active_jobs;

  return cards.reduce((acc, card) => {
    const overrides = { ...card };
    switch (card.id) {
      case 'explorer': {
        const hotSkill = hotSkills[0];
        if (hotSkill) {
          overrides.insight = `Explorers leaning into ${hotSkill.name} see ${Math.max(hotSkill.growth || 0, 12)}% month-on-month demand`;
          overrides.lightcastMetric = `${hotSkill.demand || 95}% demand momentum`;
        }
        if (topTrend?.title) overrides.serperMetric = topTrend.title;
        if (industryGrowth) overrides.llmMetric = `${industryGrowth} industry pulse`;
        break;
      }
      case 'builder': {
        if (industryGrowth) {
          overrides.insight = `Builders are seeing ${industryGrowth} growth in opportunities across the sector`;
        } else {
          overrides.insight = `Builders with practical portfolios are highly sought after by top companies`;
        }

        if (activeJobs) {
          overrides.lightcastMetric = `${formatNumber(activeJobs)} active roles`;
        }

        if (alignment !== undefined) overrides.llmMetric = `${alignment}% market alignment score`;
        if (secondTrend?.title) overrides.serperMetric = secondTrend.title;
        break;
      }
      case 'connector': {
        if (activeJobs) overrides.lightcastMetric = `${formatNumber(activeJobs)} live roles`;
        if (industryGrowth) overrides.insight = `Connectors in this market enjoy ${industryGrowth} hiring activity`;
        if (latest?.total_insights) overrides.serperMetric = `${latest.total_insights} verified opportunities`;
        break;
      }
      default:
        break;
    }
    acc[card.id] = overrides;
    return acc;
  }, {});
};

// Get archetype-specific takeaways
const getArchetypeTakeaway = (cardId, source) => {
  if (source === 'serper') {
    switch (cardId) {
      case 'explorer':
        return 'As an Explorer, this trend represents a new frontier worth investigating. Consider how this aligns with your curiosity-driven goals.';
      case 'climber':
        return 'As a Climber, this opportunity could accelerate your upward trajectory. Evaluate how it fits your advancement strategy.';
      case 'navigator':
        return 'As a Navigator, this trend might signal a viable transition path. Map how your current skills connect to this opportunity.';
      default:
        return 'This aligns with your growth trajectory. Explore roles requiring these skills.';
    }
  }
  return '';
};

// STRICT filtering - only show tech/career relevant content, exclude ALL news articles
const isCareerRelevant = (title, snippet) => {
  if (!title && !snippet) return false;
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();

  // STRICT EXCLUSIONS - filter out news, government, tourism, magazines, etc.
  const excludePatterns = [
    'tourism', 'regulatory authority', 'magazine', 'announces', 'releases',
    'issue', 'edition', 'advertises', 'application process', 'vacancies',
    'market barriers', 'foreign investment', 'world bank', 'anti-competitive',
    'economic policy', 'government', 'political', 'reforms', 'barriers cost',
    'scare off', 'restrictive globally', 'driver', 'jobs for drivers',
    'kenya engineer magazine', 'tourism regulatory', 'msn.com', 'africa24tv'
  ];

  // If it contains ANY exclusion pattern, reject it
  if (excludePatterns.some(pattern => text.includes(pattern))) {
    return false;
  }

  // STRICT INCLUSIONS - must contain tech/career keywords
  const includePatterns = [
    'software engineer', 'developer', 'programming', 'tech job', 'tech role',
    'hiring developer', 'software developer', 'web developer', 'full stack',
    'frontend', 'backend', 'data scientist', 'ai engineer', 'ml engineer',
    'career growth', 'tech skills', 'coding', 'programming language',
    'tech industry', 'software industry', 'tech career'
  ];

  // Must contain at least one inclusion pattern AND be about tech/career
  return includePatterns.some(pattern => text.includes(pattern));
};

const buildLiveInsightsFromData = (cardId, dataset = {}, context = defaultIntelContext, name = 'you') => {
  const { overview, summary, latest, skills } = dataset;
  const insights = [];

  // REMOVED: Serper trends - they're showing irrelevant news articles
  // Only use Serper if we have STRICT career-relevant content (rarely)
  const allSerperTrends = latest?.latest_insights || [];
  const careerRelevantTrends = allSerperTrends.filter(item =>
    isCareerRelevant(item.title, item.snippet)
  ).slice(0, 1); // Only show 1 if it's truly relevant

  // Only add Serper insight if it's genuinely career-relevant
  if (careerRelevantTrends.length > 0) {
    const item = careerRelevantTrends[0];
    const relatedSkills = item.related_skills || [];
    const skillText = relatedSkills.length > 0
      ? `Skills in demand: ${relatedSkills.slice(0, 3).join(', ')}`
      : null;

    insights.push({
      id: `${cardId}-serper-0`,
      title: item.title || `Career opportunity in ${context.industry}`,
      attribution: 'Market trends (live)',
      source: 'serper',
      message: item.snippet || `New opportunities emerging in ${context.industry}.`,
      metrics: [
        skillText,
        item.link ? `Source: ${safeHostname(item.link)}` : null
      ].filter(Boolean),
      takeaway: getArchetypeTakeaway(cardId, 'serper'),
      confidence: 85
    });
  }

  // Archetype-specific skill insights
  const sortedSkills = sortSkillsByDemand(skills || {});

  // Different insights for each archetype
  if (cardId === 'explorer') {
    // Explorer: Focus on emerging/hot skills (top 2)
    const emergingSkills = sortedSkills.slice(0, 2);
    emergingSkills.forEach(([skillName, value], index) => {
      const demandPercent = value?.demand_percentage ? Math.round(value.demand_percentage) : 0;
      const growthRate = value?.growth_rate ? Math.round(value.growth_rate) : 0;

      if (demandPercent > 0 || growthRate > 0) {
        insights.push({
          id: `${cardId}-skill-${index}`,
          title: `Explore: ${skillName}`,
          attribution: 'Lightcast labor market data',
          source: 'lightcast',
          message: `${skillName} is emerging as a high-demand skill in ${context.industry}. ${demandPercent}% of roles require it, with ${growthRate}% year-over-year growth.`,
          metrics: [
            `Demand percentile: ${demandPercent}%`,
            growthRate > 0 ? `Growth: ${growthRate}% YoY` : null,
            value?.has_skill ? '✓ You already have this' : '→ New opportunity to explore'
          ].filter(Boolean),
          takeaway: value?.has_skill
            ? `Great! You're ahead of the curve with ${skillName}. Build projects showcasing this skill to stand out.`
            : `As an Explorer, ${skillName} represents a frontier worth exploring. Start with a small project or tutorial to test your interest.`,
          confidence: 92
        });
      }
    });
  } else if (cardId === 'builder') {
    // Builder: Focus on practical/creation skills (top 2)
    const buildingSkills = sortedSkills.slice(0, 2);
    buildingSkills.forEach(([skillName, value], index) => {
      const demandPercent = value?.demand_percentage ? Math.round(value.demand_percentage) : 0;
      const growthRate = value?.growth_rate ? Math.round(value.growth_rate) : 0;

      if (demandPercent > 0 || growthRate > 0) {
        insights.push({
          id: `${cardId}-skill-${index}`,
          title: `Build with: ${skillName}`,
          attribution: 'Lightcast labor market data',
          source: 'lightcast',
          message: `${skillName} is a key skill for creators and builders in ${context.industry}. ${demandPercent}% of roles value practical application of this skill.`,
          metrics: [
            `Required in ${demandPercent}% of roles`,
            growthRate > 0 ? `Growing ${growthRate}% annually` : null,
            value?.has_skill ? '✓ You have this' : '→ Skill to build with'
          ].filter(Boolean),
          takeaway: value?.has_skill
            ? `Excellent! ${skillName} is perfect for your portfolio. Create a project that shows off your ability to use this skill.`
            : `To be a Builder, master ${skillName}. It's the tool you need to turn your ideas into reality.`,
          confidence: 92
        });
      }
    });
  } else if (cardId === 'connector') {
    // Connector: Focus on communication/people skills (top 2)
    const peopleSkills = sortedSkills.slice(0, 2);
    peopleSkills.forEach(([skillName, value], index) => {
      const demandPercent = value?.demand_percentage ? Math.round(value.demand_percentage) : 0;
      const growthRate = value?.growth_rate ? Math.round(value.growth_rate) : 0;

      if (demandPercent > 0 || growthRate > 0) {
        insights.push({
          id: `${cardId}-skill-${index}`,
          title: `Connect with: ${skillName}`,
          attribution: 'Lightcast labor market data',
          source: 'lightcast',
          message: `${skillName} is highly valued for roles involving people and coordination. ${demandPercent}% of roles in ${context.industry} require it.`,
          metrics: [
            `Industry demand: ${demandPercent}%`,
            growthRate > 0 ? `Growth: ${growthRate}% YoY` : null,
            value?.has_skill ? '✓ You have this' : '→ Skill to develop'
          ].filter(Boolean),
          takeaway: value?.has_skill
            ? `Perfect! ${skillName} is your superpower for connecting with others. Use it to organize teams or manage relationships.`
            : `${skillName} is key for Connectors. Developing this will help you bring people together and lead effectively.`,
          confidence: 92
        });
      }
    });
  }

  // Market overview insights from Lightcast
  if (overview) {
    const hotSkills = overview.hot_skills || [];
    const activeJobs = overview.active_jobs;
    const industryGrowth = overview.industry_growth;

    if (hotSkills.length > 0 && cardId === 'explorer') {
      const topHotSkill = hotSkills[0];
      insights.push({
        id: `${cardId}-hot-skill`,
        title: `Emerging Skill: ${topHotSkill.name}`,
        attribution: 'Lightcast market intelligence',
        source: 'lightcast',
        message: `${topHotSkill.name} is rapidly growing in ${context.industry}, with ${topHotSkill.growth || 0}% month-over-month increase in job postings.`,
        metrics: [
          `Demand momentum: ${topHotSkill.demand || 95}%`,
          activeJobs ? `${formatNumber(activeJobs)} active roles in ${context.industry}` : null
        ].filter(Boolean),
        takeaway: `Early adoption of ${topHotSkill.name} positions you ahead of the curve. Consider building a project or certification.`,
        confidence: 90
      });
    }

    if (activeJobs && cardId === 'navigator') {
      insights.push({
        id: `${cardId}-job-market`,
        title: `Active Job Market in ${context.industry}`,
        attribution: 'Lightcast labor market data',
        source: 'lightcast',
        message: `There are currently ${formatNumber(activeJobs)} active job postings in ${context.industry}, indicating strong hiring activity.`,
        metrics: [
          industryGrowth ? `Industry growth: ${industryGrowth}` : null,
          `Your location: ${context.location || 'Global'}`
        ].filter(Boolean),
        takeaway: `The market is active - perfect timing for your transition. Update your resume and start applying to roles that match your skills.`,
        confidence: 88
      });
    }
  }

  // Salary insights for climbers
  if (summary?.salary_range && cardId === 'climber') {
    const salaryRange = summary.salary_range;
    const currency = getCurrencyFromLocation(context.location);
    const formattedRange = formatSalaryRange(salaryRange, context.location);

    insights.push({
      id: `${cardId}-salary`,
      title: `Salary Range in ${context.industry}`,
      attribution: 'Lightcast compensation data',
      source: 'lightcast',
      message: `Current salary ranges for roles matching your profile: ${formattedRange}`,
      metrics: [
        `Currency: ${currency}`,
        summary.skills_alignment_score ? `Your alignment: ${summary.skills_alignment_score}%` : null
      ].filter(Boolean),
      takeaway: summary.skills_alignment_score > 70
        ? `You're well-positioned to target roles in the upper range. Focus on roles requiring your top skills.`
        : `Build the skills gap to access higher-paying roles. Target roles requiring ${context.skills.slice(0, 2).join(' and ')}.`,
      confidence: 90
    });
  }

  // AI-generated alignment insight - improved messaging
  if (summary?.skills_alignment_score !== undefined) {
    const alignment = summary.skills_alignment_score;
    const userSkills = context.skills || [];

    insights.push({
      id: `${cardId}-alignment`,
      title: `Your Career Market Fit`,
      attribution: 'AI Analysis',
      source: 'llm',
      message: `Your current skill profile shows ${alignment}% alignment with high-growth roles in ${context.industry}.`,
      metrics: [
        `Industry focus: ${context.industry}`,
        userSkills.length > 0 ? `Your skills: ${userSkills.slice(0, 4).join(', ')}` : 'No skills detected',
        overview?.active_jobs ? `${formatNumber(overview.active_jobs)} roles available` : null
      ].filter(Boolean),
      takeaway: alignment > 70
        ? `Excellent! You're well-positioned. Focus on roles that leverage ${userSkills.slice(0, 2).join(' and ')} for maximum impact.`
        : alignment > 40
          ? `Good foundation! Add 2-3 key skills from the top demand list above to reach 70%+ alignment and unlock more opportunities.`
          : `Let's build your skill foundation. Start with the high-demand skills listed above - each one adds 10-15% to your market fit.`,
      confidence: 88
    });
  }

  // Return archetype-specific insights (no generic fallbacks)
  return insights.slice(0, 4); // Return top 4 insights
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function WelcomeSequence({ onComplete }) {
  const authUser = useSelector((state) => state.auth?.userData);
  const dispatch = useDispatch();
  const [resolvedUser, setResolvedUser] = useState(authUser || null);
  const [phase, setPhase] = useState('greeting');
  const [nameInput, setNameInput] = useState('');
  const [userName, setUserName] = useState('');
  const [displayedGreeting, setDisplayedGreeting] = useState([]);
  const [activeGreetingLine, setActiveGreetingLine] = useState(0);
  const [isTypingGreeting, setIsTypingGreeting] = useState(false);
  const [canAdvanceFromGreeting, setCanAdvanceFromGreeting] = useState(false);
  const [intelContext, setIntelContext] = useState(() => deriveIntelContextFromUser(authUser) || defaultIntelContext);
  const [marketOverview, setMarketOverview] = useState(null);
  const [marketSummary, setMarketSummary] = useState(null);
  const [latestIntel, setLatestIntel] = useState(null);
  const [skillsDemand, setSkillsDemand] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [toolStatus, setToolStatus] = useState({ lightcast: 'idle', serper: 'idle', llm: 'idle' });
  const [insights, setInsights] = useState([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingArchetypeData, setIsLoadingArchetypeData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ivoBreathing, setIvoBreathing] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // ============================================================================
  // INITIALIZATION EFFECTS
  // ============================================================================
  useEffect(() => {
    // Restore saved onboarding data if user returns from upload or refreshes
    const savedName = localStorage.getItem('ivo-onboarding-name');
    const savedPhase = localStorage.getItem('ivo-onboarding-phase');
    const savedArchetype = localStorage.getItem('ivo-onboarding-archetype');

    if (savedName) {
      setUserName(savedName);
      setNameInput(savedName);
    }

    if (savedPhase && savedPhase !== 'greeting') {
      setPhase(savedPhase);
    }

    if (savedArchetype) {
      setSelectedArchetype(savedArchetype);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      setResolvedUser(authUser);
    }
  }, [authUser]);

  useEffect(() => {
    if (resolvedUser) {
      setIntelContext(deriveIntelContextFromUser(resolvedUser));
      return;
    }
    if (!localStorage.getItem('accessToken')) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await userService.getCurrentUser();
        if (!cancelled) {
          setResolvedUser(response?.data || response || null);
        }
      } catch (error) {
        console.warn('[WelcomeSequence] Failed to hydrate user profile:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedUser, authUser]);

  // ============================================================================
  // GREETING ANIMATION LOGIC
  // ============================================================================
  const greetingLines = useMemo(() => {
    if (!userName) {
      return [
        `Welcome! I'm Ivo, your career companion with real-time market intelligence.`,
        `Before we begin, what should I call you?`
      ];
    }
    return [
      `Lovely to meet you, ${userName}! I have access to live job market data from Lightcast.`,
      `Let's use this data to discover paths that fit your unique strengths.`
    ];
  }, [userName]);

  useEffect(() => {
    let cancelled = false;
    const lines = greetingLines.length ? greetingLines : [''];
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    setDisplayedGreeting(lines.map(() => ''));
    setActiveGreetingLine(0);

    const runTyping = async () => {
      setIsTypingGreeting(true);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (cancelled) return;
        const line = lines[lineIndex];
        setActiveGreetingLine(lineIndex);

        for (let charIndex = 0; charIndex <= line.length; charIndex++) {
          if (cancelled) return;
          const slice = line.slice(0, charIndex);
          setDisplayedGreeting((prev) => {
            const next = [...prev];
            next[lineIndex] = slice;
            return next;
          });
          await sleep(18);
        }
        await sleep(450);
      }
      if (!cancelled) {
        setIsTypingGreeting(false);
        setActiveGreetingLine(-1);
      }
    };

    runTyping();

    return () => {
      cancelled = true;
    };
  }, [greetingLines]);

  useEffect(() => {
    if (userName && !isTypingGreeting) {
      const timer = setTimeout(() => setCanAdvanceFromGreeting(true), 400);
      return () => clearTimeout(timer);
    }
    setCanAdvanceFromGreeting(false);
  }, [userName, isTypingGreeting]);

  // Pre-fetch market data when entering archetype phase
  useEffect(() => {
    if (phase !== 'archetype') return;
    if (marketOverview && marketSummary && latestIntel) return; // Already loaded

    let cancelled = false;
    setIsLoadingArchetypeData(true);

    (async () => {
      try {
        setToolStatus({ lightcast: 'loading', serper: 'loading', llm: 'idle' });

        const [overviewRes, summaryRes, latestRes] = await Promise.allSettled([
          marketIntelligenceService.fetchOverview(intelContext),
          marketIntelligenceService.fetchSummary(intelContext),
          marketIntelligenceService.fetchLatest(intelContext)
        ]);

        if (cancelled) return;

        const overview = overviewRes.status === 'fulfilled' ? getPayloadData(overviewRes.value) : null;
        const summary = summaryRes.status === 'fulfilled' ? getPayloadData(summaryRes.value) : null;
        const latest = latestRes.status === 'fulfilled' ? getPayloadData(latestRes.value) : null;

        setMarketOverview(overview);
        setMarketSummary(summary);
        setLatestIntel(latest);

        setToolStatus({
          lightcast: overview || summary ? 'success' : 'error',
          serper: latest ? 'success' : 'error',
          llm: 'idle'
        });
      } catch (error) {
        console.error('[WelcomeSequence] Pre-fetch market data error:', error);
        if (!cancelled) {
          setToolStatus({ lightcast: 'error', serper: 'error', llm: 'idle' });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingArchetypeData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, intelContext, marketOverview, marketSummary, latestIntel]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleNameSubmit = (event) => {
    event.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    localStorage.setItem('ivo-onboarding-name', trimmed);
  };

  const handleStartJourney = () => {
    if (!canAdvanceFromGreeting) return;
    setPhase('archetype');
    localStorage.setItem('ivo-onboarding-phase', 'archetype');
  };

  const handleBack = () => {
    if (phase === 'archetype') {
      setPhase('greeting');
      localStorage.setItem('ivo-onboarding-phase', 'greeting');
    } else if (phase === 'insights') {
      setPhase('archetype');
      localStorage.setItem('ivo-onboarding-phase', 'archetype');
    }
  };

  const handleArchetypeSelect = useCallback((archetypeId) => {
    setSelectedArchetype(archetypeId);
    setPhase('insights');
    localStorage.setItem('ivo-onboarding-phase', 'insights');
    localStorage.setItem('ivo-onboarding-archetype', archetypeId);

    // No need to fetch market data anymore - we show the detailed archetype content
    setIsLoadingInsights(false);
  }, []);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    // Save the name and archetype to the backend
    try {
      const updates = {};

      // Save the name entered during onboarding
      if (userName) {
        updates.name = userName;
      }

      // Save the career archetype for personalization
      if (selectedArchetype) {
        updates.careerArchetype = selectedArchetype;
      }

      // Only call the API if we have updates
      if (Object.keys(updates).length > 0) {
        const response = await userService.updateUserProfile(updates);
        console.log('[WelcomeSequence] Saved onboarding data to profile:', updates);

        // Update Redux store with the fresh user data so dashboard shows correct info
        if (response?.data) {
          dispatch(updateUser({ userData: response.data }));
          console.log('[WelcomeSequence] Updated Redux store with new user data');
        }
      }
    } catch (error) {
      console.error('[WelcomeSequence] Failed to save onboarding data:', error);
      // Continue anyway - don't block completion
    }

    // Clear onboarding state from localStorage since it's complete
    localStorage.removeItem('ivo-onboarding-name');
    localStorage.removeItem('ivo-onboarding-phase');
    localStorage.removeItem('ivo-onboarding-archetype');

    if (onComplete) onComplete();
  };

  const archetypeData = useMemo(() => {
    return buildArchetypeData(archetypeCards, marketOverview, marketSummary, latestIntel, intelContext.location);
  }, [marketOverview, marketSummary, latestIntel, intelContext.location]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  const renderToolBadge = (tool, status) => {
    const IconComponents = {
      lightcast: FaChartLine,
      serper: FaSearch,
      llm: FaRobot
    };
    const labels = {
      lightcast: 'Lightcast',
      serper: 'Serper',
      llm: 'AI Analysis'
    };
    const statusColors = {
      idle: 'bg-gray-500/20 text-gray-400',
      loading: 'bg-blue-500/20 text-blue-400 animate-pulse',
      success: 'bg-green-500/20 text-green-400',
      error: 'bg-red-500/20 text-red-400'
    };
    const Icon = IconComponents[tool] || FaChartLine;

    return (
      <div className={`tool-badge ${statusColors[status]}`}>
        <span className="tool-icon">
          <Icon size={16} />
        </span>
        <span className="tool-label">{labels[tool]}</span>
        {status === 'loading' && <span className="loading-spinner">⏳</span>}
        {status === 'success' && <span className="success-check">✓</span>}
        {status === 'error' && <span className="error-mark">✗</span>}
      </div>
    );
  };

  const renderInsightCard = (insight, index = 0) => {
    const SourceIconComponents = {
      lightcast: FaChartLine,
      serper: FaSearch,
      llm: FaRobot
    };
    const SourceIcon = SourceIconComponents[insight.source] || FaChartLine;

    // Archetype-specific colors
    const archetypeColors = {
      explorer: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.3)',
        accent: '#10b981'
      },
      builder: {
        bg: 'rgba(34, 197, 94, 0.1)',
        border: 'rgba(34, 197, 94, 0.3)',
        accent: '#22c55e'
      },
      connector: {
        bg: 'rgba(20, 184, 166, 0.1)',
        border: 'rgba(20, 184, 166, 0.3)',
        accent: '#14b8a6'
      }
    };

    const colors = archetypeColors[selectedArchetype] || archetypeColors.explorer;

    return (
      <div
        key={insight.id}
        className="insight-card"
        style={{
          animationDelay: `${index * 0.15}s`,
          background: colors.bg,
          borderLeft: `4px solid ${colors.accent}`,
          borderColor: colors.border
        }}
      >
        <div className="insight-header">
          <div className="insight-title-row">
            <span className="insight-source-icon">
              <SourceIcon size={20} />
            </span>
            <h3 className="insight-title">{insight.title}</h3>
          </div>
          <span className="insight-attribution">{insight.attribution}</span>
        </div>
        <p className="insight-message">{insight.message}</p>
        {insight.metrics && insight.metrics.length > 0 && (
          <ul className="insight-metrics">
            {insight.metrics.map((metric, idx) => (
              <li key={idx}>{metric}</li>
            ))}
          </ul>
        )}
        <div className="insight-footer">
          <p className="insight-takeaway">{insight.takeaway}</p>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div className="welcome-sequence-container">
      {/* Background Data Particles */}
      <div className="data-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }} />
        ))}
      </div>

      {/* Greeting Phase */}
      {phase === 'greeting' && (
        <div className="greeting-phase fade-in">
          <div className={`ivo-avatar ${ivoBreathing ? 'breathing' : ''}`}>
            <div className="avatar-glow" />
            <img src={IvoGuideImg} alt="Ivo Guide" />
            <div className="data-pulse-rings">
              <div className="pulse-ring" />
              <div className="pulse-ring" />
              <div className="pulse-ring" />
            </div>
          </div>

          <div className="greeting-content">
            {displayedGreeting.map((line, idx) => (
              <p
                key={idx}
                className={`greeting-line ${activeGreetingLine === idx ? 'typing' : ''} ${idx < activeGreetingLine ? 'complete' : ''}`}
              >
                {line}
                {activeGreetingLine === idx && <span className="typing-cursor">|</span>}
              </p>
            ))}

            {!userName && !isTypingGreeting && (
              <form onSubmit={handleNameSubmit} className="name-input-form">
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    className="name-input"
                    autoFocus
                  />
                  <button type="submit" className="submit-name-btn">
                    Continue →
                  </button>
                </div>
              </form>
            )}

            {canAdvanceFromGreeting && (
              <div className="tool-preview">
                <p className="tool-preview-text">Powered by real-time data from:</p>
                <div className="tool-badges-preview">
                  {renderToolBadge('lightcast', 'idle')}
                </div>
                <button onClick={handleStartJourney} className="start-journey-btn">
                  Let's Begin 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {phase !== 'greeting' && (
        <div className="progress-indicator">
          <div className="progress-steps">
            <div className={`progress-step ${phase === 'greeting' ? 'active' : phase === 'archetype' ? 'active' : 'completed'}`}>
              <div className="step-number">1</div>
              <span className="step-label">Meet Ivo</span>
            </div>
            <div className={`progress-step ${phase === 'archetype' ? 'active' : phase === 'insights' ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <span className="step-label">Choose Path</span>
            </div>
            <div className={`progress-step ${phase === 'insights' ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span className="step-label">Get Insights</span>
            </div>
          </div>
        </div>
      )}

      {/* Archetype Selection Phase */}
      {phase === 'archetype' && (
        <div className="archetype-phase fade-in">
          <button onClick={handleBack} className="back-button">
            <FaArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="phase-header">
            <h2 className="phase-title">Choose Your Career Archetype</h2>
            <p className="phase-subtitle">
              {isLoadingArchetypeData
                ? 'Loading personalized market data for your profile...'
                : 'Each path is backed by live market data from Lightcast'}
            </p>
          </div>

          {isLoadingArchetypeData && (
            <div className="archetype-loading-indicator">
              <div className="loading-animation">
                <div className="ivo-avatar-small breathing">
                  <img src={IvoGuideImg} alt="Ivo" />
                </div>
                <p className="loading-text">Fetching real-time market intelligence...</p>
              </div>
              <div className="tool-status-grid">
                {renderToolBadge('lightcast', toolStatus.lightcast)}
                {renderToolBadge('serper', toolStatus.serper)}
              </div>
            </div>
          )}

          <div className={`archetype-cards ${isLoadingArchetypeData ? 'loading' : ''}`}>
            {archetypeCards.map((card) => {
              const data = archetypeData[card.id] || card;
              const hasRealData = marketOverview || marketSummary || latestIntel;
              return (
                <div
                  key={card.id}
                  className={`archetype-card ${card.borderColor} ${isLoadingArchetypeData ? 'data-loading' : ''}`}
                  onClick={() => !isLoadingArchetypeData && handleArchetypeSelect(card.id)}
                >
                  <div className={`card-icon ${card.iconBg}`}>
                    <card.icon className="card-icon-svg" size={40} />
                  </div>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-description">{card.description}</p>
                  <p className="card-examples">{card.examples}</p>

                  <div className={`card-gradient-bar bg-gradient-to-r ${card.gradient}`} />

                  <p className="card-insight">
                    {isLoadingArchetypeData && !hasRealData ? (
                      <span className="loading-placeholder">Loading personalized insights...</span>
                    ) : (
                      data.insight
                    )}
                  </p>



                  <div className="card-cta">
                    <span>Select this path</span>
                    <span className="cta-arrow">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights Phase - Now Archetype Detail Phase */}
      {phase === 'insights' && selectedArchetype && (
        <div className="insights-phase fade-in">
          <button onClick={handleBack} className="back-button">
            <FaArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="archetype-detail-container">
            {(() => {
              const details = archetypeDetails[selectedArchetype];
              const card = archetypeCards.find(c => c.id === selectedArchetype);

              return (
                <>
                  <div className="detail-header">
                    <div className={`detail-icon-wrapper ${card?.iconBg}`}>
                      {card?.icon && <card.icon size={48} className={card?.borderColor?.replace('border', 'text')} />}
                    </div>
                    <h2 className="detail-title">{details.title}</h2>
                    <p className="detail-subtitle">{details.subtitle}</p>
                  </div>

                  <div className="detail-content">
                    <div className="detail-section description-section">
                      <p className="detail-text">{details.description}</p>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-card why-matters">
                        <div className="detail-card-header">
                          <FaChartLine className="detail-card-icon" />
                          <h3>Why This Matters</h3>
                        </div>
                        <p>{details.whyItMatters}</p>
                      </div>

                      <div className="detail-card this-week">
                        <div className="detail-card-header">
                          <FaCheckCircle className="detail-card-icon" />
                          <h3>Do This Week</h3>
                        </div>
                        <p>{details.thisWeek}</p>
                      </div>
                    </div>

                    <div className="detail-quote">
                      <blockquote>"{details.quote}"</blockquote>
                    </div>
                  </div>

                  <div className="completion-section">
                    <div className="completion-message">
                      <h3>Ready to start your journey, {userName}?</h3>
                      <p>Let's build your personalized career roadmap as a {details.title.split(' ')[1]}.</p>
                    </div>
                    <button
                      onClick={handleComplete}
                      className="complete-btn"
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                          Starting...
                        </span>
                      ) : (
                        'Start Your Journey 🚀'
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomeSequence;
