# Profile Data Schema Verification

## Overview
This document verifies that all profile page data is being saved correctly according to the database schema.

## Data Storage Structure

### 1. User Profile (User.userProfile)
Stored in: `User` collection, `userProfile` field  
Schema: `jobSeekerProfileSchema`  
Controller: `updateUserProfile` in `user.controller.js`

#### Fields Verified:
- ✅ `name` - String, required
- ✅ `location` - String
- ✅ `primaryRole` - String
- ✅ `yearsOfExperience` - String
- ✅ `bio` - String
- ✅ `profilePicture` - String
- ✅ `skills` - Array of Strings
- ✅ `education` - Array of `educationSchema`
  - `institution` - String
  - `degree` - String
  - `fieldOfStudy` - String
  - `startYear` - String
  - `endYear` - String
- ✅ `workExperience` - Array of `workExperienceSchema`
  - `jobTitle` - String
  - `company.name` - String
  - `company.logoUrl` - String
  - `company.domain` - String
  - `startMonth` - Date
  - `endMonth` - Date
  - `currentJob` - Boolean
  - `description` - String
- ✅ `socialProfiles` - `socialProfilesSchema`
  - `portfolioWebsite` - String
  - `linkedin` - String
  - `twitter` - String
  - `github` - String
- ✅ `doneOnboarding` - Boolean

**Status:** All fields match the schema correctly. The `updateUserProfile` controller validates and saves these fields properly.

### 2. Career Goals (UserCareerProfile.career_goals)
Stored in: `UserCareerProfile` collection (separate from User)  
Schema: `userCareerProfileSchema`  
Controller: `setCareerGoals` in `enhancedAICareerCoach.service.js`  
Route: `POST /api/v1/enhanced-ai-career-coach/goals`

#### Schema Expected Format:
```javascript
career_goals: {
  short_term: [{
    goal: String,        // The goal text
    timeline: String,    // Timeline description
    priority: Number     // 1-10
  }],
  long_term: [{
    goal: String,
    timeline: String,
    priority: Number
  }],
  priority_areas: [{
    area: String,
    weight: Number       // 0-100
  }],
  timeline: String       // '6-months', '1-year', '2-years', '5-years'
}
```

#### Frontend Sends:
```javascript
{
  short_term: [{
    title: String,              // Maps to 'goal'
    description: String,        // Maps to 'timeline'
    target_date: String,        // Alternative for 'timeline'
    priority: Number,
    specific_actions: Array,   // Not stored in schema
    market_relevance: String    // Not stored in schema
  }],
  long_term: [...],             // Same format
  priority_areas: [...],
  timeline: String
}
```

#### Fix Applied:
✅ **Backend transformation added** in `enhancedAICareerCoach.service.js`:
- Transforms `title` → `goal`
- Transforms `description` or `target_date` → `timeline`
- Preserves `priority`
- Handles both formats (frontend format and schema format)

**Status:** Fixed. The backend now correctly transforms frontend data to match the schema.

## Data Flow

### Profile Page → Backend
1. **Regular Profile Fields** (About, Social, Experience, Education, Skills):
   - Frontend: `EditProfile.jsx` → `userService.updateUserProfile()`
   - Backend: `POST /api/v1/users/profile` → `updateUserProfile` controller
   - Storage: `User.userProfile` (jobSeekerProfileSchema)

2. **Career Goals**:
   - Frontend: `EnhancedGoalSetting.jsx` → `POST /api/v1/enhanced-ai-career-coach/goals`
   - Backend: `setCareerGoals` service method
   - Storage: `UserCareerProfile.career_goals` (userCareerProfileSchema)

### Onboarding → Backend
1. **Career Goals from Onboarding**:
   - Uses same `EnhancedGoalSetting` component
   - Same transformation applied
   - Same storage location

## Verification Checklist

- [x] Profile fields (name, location, bio, etc.) match `jobSeekerProfileSchema`
- [x] Work experience structure matches `workExperienceSchema`
- [x] Education structure matches `educationSchema`
- [x] Social profiles structure matches `socialProfilesSchema`
- [x] Career goals format transformation implemented
- [x] Career goals saved to correct collection (`UserCareerProfile`)
- [x] All allowed fields in `updateUserProfile` controller match schema

## Notes

1. **Career Goals are stored separately** from the main user profile. This is intentional as they're part of the AI Career Coach feature.

2. **The transformation handles both formats** - if data is already in the correct schema format, it's preserved as-is. If it's in the frontend format, it's transformed.

3. **Additional fields** like `specific_actions` and `market_relevance` from the frontend are not stored in the schema but are used for UI purposes.

4. **Onboarding and Profile Page** use the same component (`EnhancedGoalSetting`), so both save data consistently.

## Testing Recommendations

1. Test saving career goals from profile page
2. Test saving career goals from onboarding
3. Verify data is retrievable and correctly formatted
4. Check that existing goals (in old format) are still readable
5. Verify all profile fields save correctly























