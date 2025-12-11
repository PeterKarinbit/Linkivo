# Research Deck: How It Knows Your Industry & Target Role

## Overview
The Research Deck queries external websites (via Serper API) to find career growth resources tailored to **your exact industry and aspiring role**. Here's how it works:

---

## 1. **How Industry & Target Role Are Captured**

### **Primary Source: Persona Assessment (Onboarding)**
When you complete the Career Inbox onboarding:
- **Step 3** asks: "What role do you aspire to?"
  - You enter your target role (e.g., "Senior Software Engineer", "Product Manager")
  - This is saved to `persona_profile.target_role`

### **Industry Derivation**
The system automatically derives your industry from your target role:
- **Technology**: Software Engineer, Developer, Data Scientist, AI Engineer
- **Product**: Product Manager, Product Designer
- **Marketing**: Marketing Manager, Growth Hacker, Brand Manager
- **Finance**: Financial Analyst, Accountant, Investment Banker
- **Operations**: Operations Manager, Project Manager
- **Sales**: Sales Manager, Account Executive
- **Design**: UX Designer, UI Designer
- **Human Resources**: HR Manager, Recruiter
- **Consulting**: Consultant, Business Analyst
- **Default**: Technology (if no match)

### **Storage**
Both values are stored in `UserCareerProfile.persona_profile`:
```javascript
{
  target_role: "Senior Software Engineer",
  industry: "Technology"  // Auto-derived or explicitly set
}
```

---

## 2. **How Research Queries Use Your Data**

### **Query Building Process**
When the Research Deck refreshes (every 24 hours), it:

1. **Fetches your profile data:**
   ```javascript
   const targetRole = profile?.persona_profile?.target_role || '';
   const industry = profile?.persona_profile?.industry || '';
   ```

2. **Determines which categories to query** (based on day/time):
   - **Sunday**: Industry + Salary
   - **Monday**: Skills + Interview
   - **Tuesday**: Industry + Skills
   - **Wednesday**: Interview + Salary
   - **Thursday**: Industry + Interview
   - **Friday**: Skills + Salary
   - **Saturday**: All categories

3. **Builds specific search queries** using your exact values:
   ```javascript
   // Example queries generated:
   "Technology industry Senior Software Engineer career growth trends 2025"
   "Senior Software Engineer Technology salary range 2025"
   "Senior Software Engineer Technology interview questions tips"
   "JavaScript React skill development guide 2025"
   ```

4. **Executes searches via Serper API** on legitimate websites:
   - **Industry**: Forbes, HBR, TechCrunch, Bloomberg
   - **Skills**: Coursera, Udemy, Skillshare, Medium
   - **Salary**: Glassdoor, PayScale, Indeed
   - **Interview**: Indeed, LinkedIn, The Muse

---

## 3. **What Gets Displayed**

### **Research Deck Shows:**
- **Title**: Article/resource title
- **Summary**: First 200 characters (snippet from search)
- **Clickable Link**: "Read full article" button → Opens original article
- **Source**: Website name (e.g., "LinkedIn", "Forbes")
- **Tags**: Category tags (industry, skills, salary, interview)
- **Date**: When it was added/updated

### **Example Display:**
```
Title: "10 Career Growth Tips for Senior Software Engineers in 2025"
Summary: "The tech industry is evolving rapidly. Here are the key skills..."
[Read full article →] • Forbes
Tags: #industry #career_growth
Updated: 12/9/2025
```

---

## 4. **Scheduling System**

### **Day-Based Schedule:**
- **Sunday**: Industry insights + Salary data
- **Monday**: Skills development + Interview prep
- **Tuesday**: Industry trends + Skills
- **Wednesday**: Interview prep + Salary benchmarks
- **Thursday**: Industry insights + Interview tips
- **Friday**: Skills development + Salary data
- **Saturday**: All categories (catch-up day)

### **Time-Based Priorities:**
- **Morning (6 AM - 11 AM)**: Focus on Industry & Career Growth
- **Afternoon (12 PM - 5 PM)**: Skills & Interview Prep
- **Evening (6 PM - 11 PM)**: Salary Data & General Insights

### **Refresh Logic:**
- Refreshes every **24 hours** (prevents too frequent API calls)
- Stores `lastResearchRefreshAt` timestamp
- Next refresh scheduled for **6 AM next day**
- Only queries if 24+ hours have passed

---

## 5. **Fallback & Error Handling**

### **If Target Role Missing:**
- Uses skills from resume analysis
- Queries generic career growth resources
- Falls back to Wikipedia if Serper API unavailable

### **If Industry Missing:**
- Derives from target role using mapping function
- Saves derived industry back to persona_profile
- Uses "Technology" as default

### **If Serper API Unavailable:**
- Falls back to Wikipedia search
- Logs warning but continues gracefully

---

## 6. **Data Flow Summary**

```
User Onboarding
    ↓
Persona Assessment (target_role entered)
    ↓
Industry Auto-Derived from target_role
    ↓
Saved to UserCareerProfile.persona_profile
    ↓
Research Deck Refresh (every 24h)
    ↓
Fetches target_role + industry from profile
    ↓
Scheduler determines categories (day/time)
    ↓
Builds queries: "{industry} industry {target_role} career growth..."
    ↓
Serper API searches legitimate websites
    ↓
Results saved to KnowledgeBase with URLs
    ↓
Research Deck displays with clickable links
```

---

## 7. **Key Files**

- **`backend/src/utils/ai/enhancedAICareerCoach.service.js`**
  - `_mapRoleToIndustry()`: Derives industry from target role
  - `_sanitizePersonaAssessment()`: Saves target_role + industry
  - `refreshKnowledgeBase()`: Triggers research queries

- **`backend/src/utils/ai/enhancedResearch.service.js`**
  - `searchCareerGrowthResources()`: Executes Serper API searches
  - Uses exact `targetRole` and `industry` in queries

- **`backend/src/utils/ai/researchScheduler.service.js`**
  - `getCategoriesForToday()`: Determines which categories to query
  - `buildQueriesForCategories()`: Builds queries with user data

- **`backend/src/models/aiCareerCoach.model.js`**
  - `persona_profile` schema: Stores `target_role` and `industry`

---

## 8. **Example: Real User Journey**

**User enters onboarding:**
- Target Role: "Senior Software Engineer"
- System derives: Industry = "Technology"

**Next day, Research Deck refreshes:**
- Fetches: `target_role = "Senior Software Engineer"`, `industry = "Technology"`
- Scheduler: Monday → Categories: `['skills', 'interview']`
- Queries generated:
  1. "JavaScript React skill development guide 2025" (skills)
  2. "Senior Software Engineer Technology interview questions tips" (interview)
- Serper searches: Coursera, Udemy, Indeed, LinkedIn
- Results saved with clickable URLs
- Research Deck displays: "10 Interview Tips for Senior Software Engineers" → [Read full article →]

---

## Summary

The Research Deck **knows your exact industry and target role** because:
1. ✅ You provide it during onboarding (target role)
2. ✅ System derives industry from target role automatically
3. ✅ Both are stored in `persona_profile`
4. ✅ Research queries use these exact values
5. ✅ Results are tailored to your specific career path

The system queries **legitimate websites** (Forbes, HBR, LinkedIn, Coursera, etc.) and displays **summaries with clickable links** to the full articles, helping you grow in your specific industry and role.











