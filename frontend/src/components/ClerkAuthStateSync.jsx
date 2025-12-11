import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, logout, setLoadingFalse } from "../store/authSlice";

const ClerkAuthStateSync = () => {
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();

    useEffect(() => {
        const syncAuth = async () => {
            if (!isLoaded) return;

            if (isSignedIn && user) {
                try {
                    // Get the JWT token from Clerk
                    const token = await getToken();

                    if (token) {
                        // 1. Sync token to LocalStorage so apiBase.js can find it
                        localStorage.setItem('accessToken', token);

                        // 2. Sync user data to Redux Store
                        // Map Clerk user data to your app's user structure
                        const userData = {
                            _id: userId,
                            clerkId: userId,
                            email: user.primaryEmailAddress?.emailAddress,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            name: user.fullName,
                            profilePicture: user.imageUrl,
                            role: user.publicMetadata?.role || 'jobSeeker',
                            username: user.username,
                            // Add other fields if your app relies on them being in Redux
                        };

                        dispatch(login({ userData, token }));
                    }
                } catch (error) {
                    console.error("Error syncing Clerk auth:", error);
                    // If we can't get a token, we might need to force logout or retry
                }
            } else if (!isSignedIn && isLoaded) {
                // If not signed in via Clerk, ensure local state is cleared
                // But be careful not to create a loop if you have other auth persistence
                const storedToken = localStorage.getItem('accessToken');
                if (storedToken) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    dispatch(logout());
                }
            }

            // Always mark loading as done once Clerk is loaded
            dispatch(setLoadingFalse());
        };

        syncAuth();

        // Set up periodic token refresh (Clerk tokens are short-lived, ~60s)
        // We refresh every 50s to ensure apiBase.js always has a valid token in localStorage
        const intervalId = setInterval(async () => {
            if (isSignedIn && user) {
                try {
                    const token = await getToken();
                    if (token) {
                        localStorage.setItem('accessToken', token);
                        // Optionally update Redux if needed, but LS is key for apiBase
                        // dispatch(updateToken({ token }));
                    }
                } catch (err) {
                    console.error("Error refreshing Clerk token:", err);
                }
            }
        }, 50000);

        return () => clearInterval(intervalId);
    }, [isLoaded, isSignedIn, user, getToken, dispatch, userId]);

    return null;
};

export default ClerkAuthStateSync;
