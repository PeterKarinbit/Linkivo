import { clerkClient, requireAuth } from '@clerk/express';

// Middleware to verify Clerk JWT and attach user to request
export const clerkAuth = requireAuth({
    onError: (error) => {
        console.error('[Clerk Auth] Error:', error);
        return {
            status: 401,
            message: 'Unauthorized - Invalid Clerk token'
        };
    }
});

// Middleware to optionally check Clerk auth (doesn't block if not authenticated)
export const clerkAuthOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Verify the Clerk session token
            const session = await clerkClient.sessions.verifySession(token);
            if (session && session.userId) {
                req.clerkUserId = session.userId;
            }
        }
    } catch (error) {
        // Not authenticated via Clerk, that's okay - might be legacy auth
        console.log('[Clerk Optional Auth] No valid Clerk token');
    }
    next();
};

// Get Clerk user info
export const getClerkUser = async (userId) => {
    try {
        const user = await clerkClient.users.getUser(userId);
        return user;
    } catch (error) {
        console.error('[Clerk] Failed to get user:', error);
        return null;
    }
};

export default {
    clerkAuth,
    clerkAuthOptional,
    getClerkUser
};
