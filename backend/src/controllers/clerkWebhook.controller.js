import { Webhook } from 'svix';
import User from '../models/user.model.js';

/**
 * Clerk Webhook Handler
 * Syncs Clerk users to MongoDB when they sign up, update profile, or delete account
 */
export const handleClerkWebhook = async (req, res) => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
        }

        // Get headers
        const headers = {
            'svix-id': req.headers['svix-id'],
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature'],
        };

        // Verify webhook signature
        const wh = new Webhook(WEBHOOK_SECRET);
        let evt;

        try {
            evt = wh.verify(JSON.stringify(req.body), headers);
        } catch (err) {
            console.error('[Clerk Webhook] Verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Handle different event types
        const { id, ...attributes } = evt.data;
        const eventType = evt.type;

        console.log(`[Clerk Webhook] Received ${eventType} for user ${id}`);

        switch (eventType) {
            case 'user.created':
                await handleUserCreated(id, attributes);
                break;

            case 'user.updated':
                await handleUserUpdated(id, attributes);
                break;

            case 'user.deleted':
                await handleUserDeleted(id);
                break;

            default:
                console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[Clerk Webhook] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Handle user.created event - Create MongoDB user
 */
async function handleUserCreated(clerkUserId, attributes) {
    try {
        const email = attributes.email_addresses?.[0]?.email_address;
        const firstName = attributes.first_name || '';
        const lastName = attributes.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || email?.split('@')[0];

        // Check if user already exists (by Clerk ID or email)
        const existingUser = await User.findOne({
            $or: [
                { 'clerkId': clerkUserId },
                { 'email': email }
            ]
        });

        if (existingUser) {
            console.log(`[Clerk Webhook] User already exists: ${email}`);
            // Update Clerk ID if missing
            if (!existingUser.clerkId) {
                existingUser.clerkId = clerkUserId;
                await existingUser.save();
            }
            return;
        }

        // Create new user in MongoDB
        const newUser = new User({
            clerkId: clerkUserId,
            username: email?.split('@')[0] || `user_${Date.now()}`,
            email: email,
            role: 'jobSeeker', // Default role
            userProfile: {
                name: fullName,
                email: email,
                profilePicture: attributes.image_url || attributes.profile_image_url,
            },
            connectedAccounts: {
                clerk: {
                    userId: clerkUserId,
                    email: email,
                }
            }
        });

        await newUser.save();
        console.log(`[Clerk Webhook] Created user in MongoDB: ${email}`);
    } catch (error) {
        console.error('[Clerk Webhook] Error creating user:', error);
        throw error;
    }
}

/**
 * Handle user.updated event - Update MongoDB user
 */
async function handleUserUpdated(clerkUserId, attributes) {
    try {
        const user = await User.findOne({ clerkId: clerkUserId });

        if (!user) {
            console.log(`[Clerk Webhook] User not found for update: ${clerkUserId}`);
            return;
        }

        // Update user profile
        const email = attributes.email_addresses?.[0]?.email_address;
        const firstName = attributes.first_name || '';
        const lastName = attributes.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();

        if (fullName) user.userProfile.name = fullName;
        if (email) user.email = email;
        if (attributes.image_url || attributes.profile_image_url) {
            user.userProfile.profilePicture = attributes.image_url || attributes.profile_image_url;
        }

        await user.save();
        console.log(`[Clerk Webhook] Updated user in MongoDB: ${email}`);
    } catch (error) {
        console.error('[Clerk Webhook] Error updating user:', error);
        throw error;
    }
}

/**
 * Handle user.deleted event - Mark user as deleted (soft delete)
 */
async function handleUserDeleted(clerkUserId) {
    try {
        const user = await User.findOne({ clerkId: clerkUserId });

        if (!user) {
            console.log(`[Clerk Webhook] User not found for deletion: ${clerkUserId}`);
            return;
        }

        // Soft delete: Mark as deleted but keep data
        user.deletedAt = new Date();
        user.clerkId = null; // Remove Clerk association
        await user.save();

        console.log(`[Clerk Webhook] Soft-deleted user: ${user.email}`);
    } catch (error) {
        console.error('[Clerk Webhook] Error deleting user:', error);
        throw error;
    }
}

export default handleClerkWebhook;
