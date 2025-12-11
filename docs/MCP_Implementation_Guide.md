# MCP Implementation Guide for Linkivo

## 🎯 **Top 3 MCPs to Start With**

Based on your suggestions.log and maximum impact, here are the 3 MCPs to implement first:

---

## 1. 🗄️ **Baserow MCP** - Your Data Foundation

### **Why Start Here**:
- **Immediate Value**: Store user progress, assessments, skill metrics
- **Low Cost**: $10-50/month
- **Easy Setup**: No complex database management
- **Perfect for**: "Which users improved AI Adaptation Quotient by >30%?"

### **Setup Steps**:

#### Step 1: Create Baserow Account
1. Go to [baserow.io](https://baserow.io)
2. Create free account
3. Create new database: "Linkivo Career Coach Data"

#### Step 2: Design Your Tables
```sql
-- Users Table
CREATE TABLE users (
  id PRIMARY KEY,
  email VARCHAR,
  name VARCHAR,
  created_at TIMESTAMP,
  last_active TIMESTAMP,
  ai_adaptation_quotient INTEGER,
  industry VARCHAR,
  experience_level VARCHAR
);

-- Assessments Table  
CREATE TABLE assessments (
  id PRIMARY KEY,
  user_id FOREIGN KEY,
  assessment_type VARCHAR, -- 'baseline', 'reassessment', 'skill_check'
  ai_quotient INTEGER,
  communication_score INTEGER,
  technical_score INTEGER,
  leadership_score INTEGER,
  assessment_date TIMESTAMP,
  improvement_rate DECIMAL
);

-- Recommendations Table
CREATE TABLE recommendations (
  id PRIMARY KEY,
  user_id FOREIGN KEY,
  recommendation_type VARCHAR, -- 'skill_development', 'networking', 'certification'
  title VARCHAR,
  description TEXT,
  priority VARCHAR, -- 'high', 'medium', 'low'
  status VARCHAR, -- 'pending', 'in_progress', 'completed'
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### Step 3: Install Baserow MCP
```bash
# In your backend directory
npm install @mcpservers/baserow

# Add to your .env file
BASEROW_API_KEY=your_api_key_here
BASEROW_BASE_URL=https://your-baserow-instance.com
```

#### Step 4: Create Baserow MCP Service
```javascript
// backend/src/services/baserowMCP.js
import { BaserowMCP } from '@mcpservers/baserow';

class BaserowMCPService {
  constructor() {
    this.client = new BaserowMCP({
      apiKey: process.env.BASEROW_API_KEY,
      baseUrl: process.env.BASEROW_BASE_URL
    });
  }

  // Store user assessment
  async storeAssessment(userId, assessmentData) {
    return await this.client.createRecord('assessments', {
      user_id: userId,
      assessment_type: assessmentData.type,
      ai_quotient: assessmentData.aiQuotient,
      communication_score: assessmentData.communication,
      technical_score: assessmentData.technical,
      leadership_score: assessmentData.leadership,
      assessment_date: new Date().toISOString(),
      improvement_rate: assessmentData.improvementRate
    });
  }

  // Get user progress
  async getUserProgress(userId) {
    const assessments = await this.client.queryRecords('assessments', {
      filter: `user_id = "${userId}"`,
      sort: 'assessment_date DESC'
    });
    return assessments;
  }

  // Benchmark users (your key use case!)
  async getTopPerformers(improvementThreshold = 30) {
    return await this.client.queryRecords('assessments', {
      filter: `improvement_rate > ${improvementThreshold}`,
      sort: 'improvement_rate DESC',
      limit: 10
    });
  }

  // Store recommendation
  async storeRecommendation(userId, recommendation) {
    return await this.client.createRecord('recommendations', {
      user_id: userId,
      recommendation_type: recommendation.type,
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }
}

export default new BaserowMCPService();
```

---

## 2. 🔍 **Apify MCP** - Real-time Market Intelligence

### **Why This MCP**:
- **3,000+ Scrapers**: Pre-built for job sites, salary data
- **Real-time Data**: Always current market trends
- **Perfect for**: "Find current job postings requiring AI skills in healthcare"

### **Setup Steps**:

#### Step 1: Create Apify Account
1. Go to [apify.com](https://apify.com)
2. Create free account (1000 free credits/month)
3. Get API key from settings

#### Step 2: Install Apify MCP
```bash
npm install @mcpservers/apify

# Add to .env
APIFY_API_KEY=your_apify_api_key
```

#### Step 3: Create Apify MCP Service
```javascript
// backend/src/services/apifyMCP.js
import { ApifyMCP } from '@mcpservers/apify';

class ApifyMCPService {
  constructor() {
    this.client = new ApifyMCP({
      apiKey: process.env.APIFY_API_KEY
    });
  }

  // Get current AI job postings
  async getAIJobPostings(skills = ['AI', 'Machine Learning'], location = 'United States') {
    const searchQuery = skills.join(' OR ');
    
    const result = await this.client.runActor('linkedin-jobs-scraper', {
      searchQuery,
      location,
      maxResults: 100,
      datePosted: 'past_week' // Fresh data
    });

    return result.items.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      skills: this.extractSkills(job.description),
      salary: job.salary,
      postedDate: job.postedDate,
      url: job.url
    }));
  }

  // Get salary trends
  async getSalaryTrends(jobTitle, location) {
    const result = await this.client.runActor('glassdoor-salary-scraper', {
      jobTitle,
      location,
      maxResults: 50
    });

    return {
      average: result.averageSalary,
      range: result.salaryRange,
      trend: result.trend, // 'increasing', 'stable', 'decreasing'
      dataPoints: result.salaries.length
    };
  }

  // Get industry trends
  async getIndustryTrends(industry) {
    const result = await this.client.runActor('indeed-jobs-scraper', {
      searchQuery: `${industry} AI skills`,
      maxResults: 200
    });

    return this.analyzeTrends(result.items);
  }

  // Extract skills from job description
  extractSkills(description) {
    const skillKeywords = [
      'Python', 'TensorFlow', 'PyTorch', 'Machine Learning',
      'Deep Learning', 'NLP', 'Computer Vision', 'Data Science',
      'SQL', 'AWS', 'Azure', 'Docker', 'Kubernetes'
    ];
    
    return skillKeywords.filter(skill => 
      description.toLowerCase().includes(skill.toLowerCase())
    );
  }

  // Analyze trends from job data
  analyzeTrends(jobs) {
    const skillCounts = {};
    const salaryRanges = [];
    
    jobs.forEach(job => {
      // Count skills
      this.extractSkills(job.description).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
      
      // Collect salary data
      if (job.salary) {
        salaryRanges.push(job.salary);
      }
    });

    return {
      topSkills: Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      averageSalary: salaryRanges.length > 0 
        ? salaryRanges.reduce((a, b) => a + b, 0) / salaryRanges.length 
        : null,
      totalJobs: jobs.length
    };
  }
}

export default new ApifyMCPService();
```

---

## 3. 📧 **Custom Email MCP** - Retention & Personalization

### **Why Custom**:
- **Perfect Personalization**: Tailored to your user data
- **Integration**: Works with your existing user system
- **Cost Effective**: Use your existing email service

### **Setup Steps**:

#### Step 1: Choose Email Service
- **SendGrid** (recommended): $15/month for 40k emails
- **Mailgun**: $35/month for 50k emails
- **AWS SES**: $0.10 per 1000 emails

#### Step 2: Install Email Service
```bash
# For SendGrid
npm install @sendgrid/mail

# Add to .env
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@linkivo.com
```

#### Step 3: Create Custom Email MCP
```javascript
// backend/src/services/emailMCP.js
import sgMail from '@sendgrid/mail';

class EmailMCPService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  // Send personalized progress report
  async sendProgressReport(userId, userData, progressData) {
    const template = this.generateProgressReportTemplate(userData, progressData);
    
    const msg = {
      to: userData.email,
      from: process.env.FROM_EMAIL,
      subject: `Your Career Progress Report - ${new Date().toLocaleDateString()}`,
      html: template
    };

    return await sgMail.send(msg);
  }

  // Send coaching nudge
  async sendCoachingNudge(userId, nudgeType, userData) {
    const templates = {
      skill_improvement: this.generateSkillImprovementNudge(userData),
      goal_reminder: this.generateGoalReminderNudge(userData),
      market_opportunity: this.generateMarketOpportunityNudge(userData)
    };

    const template = templates[nudgeType];
    if (!template) return;

    const msg = {
      to: userData.email,
      from: process.env.FROM_EMAIL,
      subject: template.subject,
      html: template.html
    };

    return await sgMail.send(msg);
  }

  // Send weekly digest
  async sendWeeklyDigest(userId, userData, weeklyData) {
    const template = this.generateWeeklyDigestTemplate(userData, weeklyData);
    
    const msg = {
      to: userData.email,
      from: process.env.FROM_EMAIL,
      subject: `Your Weekly Career Update - ${weeklyData.weekOf}`,
      html: template
    };

    return await sgMail.send(msg);
  }

  // Generate progress report template
  generateProgressReportTemplate(userData, progressData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Hi ${userData.name}! 👋</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b;">Your Progress This Month</h3>
          <p><strong>AI Adaptation Quotient:</strong> ${progressData.aiQuotient}% 
             <span style="color: ${progressData.aiQuotientChange > 0 ? 'green' : 'red'};">
               (${progressData.aiQuotientChange > 0 ? '+' : ''}${progressData.aiQuotientChange}%)
             </span>
          </p>
          <p><strong>Communication Score:</strong> ${progressData.communication}%</p>
          <p><strong>Technical Skills:</strong> ${progressData.technical}%</p>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #065f46;">🎯 Your Next Steps</h3>
          <ul>
            ${progressData.recommendations.map(rec => 
              `<li>${rec.title} - ${rec.description}</li>`
            ).join('')}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/career-coach" 
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Full Dashboard
          </a>
        </div>
      </div>
    `;
  }

  // Generate skill improvement nudge
  generateSkillImprovementNudge(userData) {
    return {
      subject: `🚀 Your ${userData.skillToImprove} skills are improving!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Great progress, ${userData.name}! 🎉</h2>
          <p>Your ${userData.skillToImprove} skills improved by ${userData.improvement}% this week!</p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3>💡 Quick Tips to Keep Improving:</h3>
            <ul>
              <li>Practice ${userData.skillToImprove} for 15 minutes daily</li>
              <li>Join our ${userData.skillToImprove} community discussion</li>
              <li>Try the new ${userData.skillToImprove} challenge</li>
            </ul>
          </div>
        </div>
      `
    };
  }

  // Generate weekly digest template
  generateWeeklyDigestTemplate(userData, weeklyData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Your Weekly Career Update 📈</h2>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📊 This Week's Highlights</h3>
          <p>• Completed ${weeklyData.completedGoals} goals</p>
          <p>• Spent ${weeklyData.learningHours} hours learning</p>
          <p>• Connected with ${weeklyData.newConnections} new professionals</p>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🎯 Market Insights</h3>
          <p>${weeklyData.marketInsights}</p>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🚀 Next Week's Focus</h3>
          <ul>
            ${weeklyData.nextWeekGoals.map(goal => `<li>${goal}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }
}

export default new EmailMCPService();
```

---

## 🔗 **Integration with Your AI Agents**

### **Update Your AI Agents to Use External MCPs**:

```javascript
// backend/src/services/aiAgents/EnhancedCareerAssessmentAgent.js
import baserowMCP from '../baserowMCP.js';
import apifyMCP from '../apifyMCP.js';
import emailMCP from '../emailMCP.js';

class EnhancedCareerAssessmentAgent extends BaseAgent {
  async assessUserProgress(userId, timeframe) {
    // Get current assessment
    const progress = await this.calculateProgress(userId, timeframe);
    
    // Store in Baserow
    await baserowMCP.storeAssessment(userId, {
      type: 'reassessment',
      aiQuotient: progress.aiQuotient,
      communication: progress.communication,
      technical: progress.technical,
      leadership: progress.leadership,
      improvementRate: progress.improvementRate
    });

    // Get market data for context
    const marketData = await apifyMCP.getAIJobPostings(['AI', 'Machine Learning']);
    
    // Generate enhanced recommendations with market context
    const recommendations = await this.generateMarketAwareRecommendations(
      progress, 
      marketData
    );

    // Store recommendations
    for (const rec of recommendations) {
      await baserowMCP.storeRecommendation(userId, rec);
    }

    // Send progress email
    const userData = await this.getUserData(userId);
    await emailMCP.sendProgressReport(userId, userData, progress);

    return { progress, recommendations, marketContext: marketData };
  }

  async generateMarketAwareRecommendations(progress, marketData) {
    const recommendations = [];
    
    // Analyze market demand
    const topSkills = marketData.analyzeTrends().topSkills;
    const userSkills = [progress.communication, progress.technical, progress.leadership];
    
    // Generate recommendations based on market demand
    if (topSkills.includes('Python') && progress.technical < 80) {
      recommendations.push({
        type: 'skill_development',
        title: 'Master Python for AI Development',
        description: 'Python is in high demand for AI roles. Boost your technical score!',
        priority: 'high'
      });
    }

    return recommendations;
  }
}
```

---

## 🚀 **Quick Start Implementation**

### **Week 1: Baserow MCP**
1. Set up Baserow account and tables
2. Install and configure Baserow MCP
3. Update your AI agents to store data
4. Test data persistence

### **Week 2: Apify MCP**
1. Set up Apify account
2. Install and configure Apify MCP
3. Add market intelligence to recommendations
4. Test real-time data integration

### **Week 3: Email MCP**
1. Set up SendGrid account
2. Create email templates
3. Integrate with user progress
4. Test automated emails

### **Week 4: Full Integration**
1. Connect all MCPs together
2. Test end-to-end workflows
3. Monitor performance and costs
4. Deploy to production

---

## 📊 **Expected Results**

### **After Week 1 (Baserow)**:
- ✅ User data persists across sessions
- ✅ Can benchmark users against each other
- ✅ AI agents have memory

### **After Week 2 (Apify)**:
- ✅ Recommendations feel current and relevant
- ✅ Market data drives personalization
- ✅ Users trust the "freshness" of advice

### **After Week 3 (Email)**:
- ✅ Users get personalized touchpoints
- ✅ Retention improves significantly
- ✅ Feels like a human coach

### **After Week 4 (Full Integration)**:
- ✅ Complete AI-powered career coaching
- ✅ Real-time market intelligence
- ✅ Automated retention at scale
- ✅ Data-driven personalization

---

**Ready to transform Linkivo? Start with Baserow MCP this week! 🚀**
