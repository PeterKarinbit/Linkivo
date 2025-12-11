# Settings Page Functionality Guide

This document outlines which settings in the Settings page are **functional** (actually work) versus **irrelevant/placeholder** (not yet implemented or just UI).

## ✅ Functional Settings

### Account Security Tab
1. **Change Password** ✅
   - **Status**: Fully functional
   - **Backend**: Calls `userService.changePassword()`
   - **Validation**: Requires current password, new password (min 6 chars), confirmation
   - **Action**: Updates password in database

2. **Update Email** ✅
   - **Status**: Fully functional
   - **Backend**: Calls `userService.updateEmail()`
   - **Validation**: Email format validation, requires current password
   - **Action**: Updates email in database

3. **Delete Account** ✅
   - **Status**: Fully functional
   - **Backend**: Calls `userService.deleteAccount()`
   - **Action**: Permanently deletes user account and data
   - **Warning**: Cannot be undone

### Appearance Tab
1. **Dark Mode Toggle** ✅
   - **Status**: Fully functional
   - **Implementation**: Uses `useDarkMode()` context hook
   - **Storage**: Saved to localStorage
   - **Action**: Immediately applies dark/light theme across the app

### Notifications Tab
1. **Email Job Alerts** ⚠️
   - **Status**: Partially functional (saves preference)
   - **Storage**: Saved to localStorage as `emailAlerts`
   - **Backend**: Not connected to actual email service yet
   - **Note**: Preference is saved but emails may not be sent

2. **Application Updates** ⚠️
   - **Status**: Partially functional (saves preference)
   - **Storage**: Saved to localStorage as `appStatusUpdates`
   - **Backend**: Not connected to notification system yet
   - **Note**: Preference is saved but notifications may not be sent

3. **Instant Job Alerts** ⚠️
   - **Status**: Partially functional (saves preference)
   - **Storage**: Saved to localStorage as `jobAlerts`
   - **Backend**: Not connected to real-time notification system yet
   - **Note**: Preference is saved but alerts may not be sent

### AI & Privacy Tab
1. **AI Data Usage** ⚠️
   - **Status**: Partially functional (saves preference)
   - **Storage**: Saved to localStorage as `aiConsent`
   - **Backend**: Not enforced in AI services yet
   - **Note**: Preference is saved but AI may still use data

2. **Personalized Insights** ⚠️
   - **Status**: Partially functional (saves preference)
   - **Storage**: Saved to localStorage as `personalization`
   - **Backend**: Not enforced in AI recommendations yet
   - **Note**: Preference is saved but may not affect recommendations

3. **Data Access Scopes** ❌
   - **Status**: Not functional (UI only)
   - **Storage**: Saved to localStorage but not used
   - **Backend**: No enforcement of these scopes
   - **Note**: These are placeholder settings for future implementation
   - **Scopes**:
     - Resume & CV
     - Career Journals
     - Goals & Targets
     - Job Applications
     - Knowledge Base

4. **Auto-lock Timer** ⚠️
   - **Status**: Partially functional (saves preference)
   - **Storage**: Saved to localStorage as `autoLock`
   - **Backend**: Not implemented in app security yet
   - **Note**: Preference is saved but auto-lock feature not active

## ❌ Irrelevant/Placeholder Settings

### AI & Privacy Tab - Data Access Scopes
All the individual scope toggles (Resume & CV, Career Journals, Goals & Targets, Job Applications, Knowledge Base) are **not functional**. They save to localStorage but are not enforced anywhere in the application.

## Summary

| Setting | Status | Notes |
|---------|--------|-------|
| Change Password | ✅ Functional | Fully working |
| Update Email | ✅ Functional | Fully working |
| Delete Account | ✅ Functional | Fully working |
| Dark Mode | ✅ Functional | Fully working |
| Email Job Alerts | ⚠️ Partial | Saves preference, no backend |
| Application Updates | ⚠️ Partial | Saves preference, no backend |
| Instant Job Alerts | ⚠️ Partial | Saves preference, no backend |
| AI Data Usage | ⚠️ Partial | Saves preference, not enforced |
| Personalized Insights | ⚠️ Partial | Saves preference, not enforced |
| Data Access Scopes | ❌ Not Functional | UI only, not enforced |
| Auto-lock Timer | ⚠️ Partial | Saves preference, not implemented |

## Recommendations

1. **Remove or hide non-functional settings** until they're implemented
2. **Add visual indicators** (badges/icons) to show which settings are active vs placeholder
3. **Connect notification preferences** to actual notification service
4. **Implement AI consent enforcement** in AI services
5. **Implement auto-lock feature** or remove the setting
6. **Remove data access scopes** until backend enforcement is ready

## Future Implementation Priority

1. **High Priority**: Connect notification preferences to backend
2. **Medium Priority**: Enforce AI consent settings
3. **Low Priority**: Implement data access scopes with backend enforcement
4. **Low Priority**: Implement auto-lock timer feature

