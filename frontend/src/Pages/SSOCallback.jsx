import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginAction } from "../store/authSlice";
import { userService } from "../services/userService";
import useUpdateUserData from "../hooks/useUpdateUserData";

function SSOCallback() {
    const navigate = useNavigate();
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const updateUser = useUpdateUserData();
    const { userData } = useSelector((store) => store.auth);

    useEffect(() => {
        const handleRedirect = async () => {
            // Wait for Clerk to load
            if (!isLoaded) return;

            // If not signed in, go to login
            if (!isSignedIn) {
                navigate('/login');
                return;
            }

            // Get Clerk session token and prime backend auth
            try {
                let clerkToken = await getToken();

                // Retry getting token if null initially
                if (!clerkToken) {
                    await new Promise(r => setTimeout(r, 500));
                    clerkToken = await getToken();
                }

                if (clerkToken) {
                    localStorage.setItem("accessToken", clerkToken);

                    // Pull backend profile (middleware will create Clerk user if missing)
                    const profileResponse = await userService.getCurrentUser();
                    const profileWrapper = profileResponse.data || profileResponse;
                    // profileWrapper usually { success: true, data: { ... } }
                    const actualUser = profileWrapper.data || profileWrapper;

                    if (actualUser) {
                        dispatch(loginAction({ userData: actualUser }));

                        // Check onboarding status from fresh backend data
                        const hasCompletedOnboarding =
                            actualUser?.userProfile?.doneOnboarding ||
                            user?.publicMetadata?.doneOnboarding ||
                            false;

                        if (hasCompletedOnboarding) {
                            navigate('/home-logged-in');
                        } else {
                            navigate('/user-onboarding');
                        }
                    } else {
                        // Fallback if no user data returned
                        navigate('/user-onboarding');
                    }
                } else {
                    console.error("Clerk token missing during SSO callback");
                    navigate('/login');
                }
            } catch (tokenErr) {
                console.error("Failed to sync Clerk session to backend:", tokenErr);
                // On error, default to onboarding to be safe
                navigate('/user-onboarding');
            }
        };

        handleRedirect();
    }, [isLoaded, isSignedIn, user, navigate, getToken, dispatch]);

    // Loading state
    return (
        <div className="sso-callback-container">
            <div className="callback-card">
                <div className="spinner-large"></div>
                <h2>Completing sign in...</h2>
                <p>Please wait while we set up your account</p>
            </div>

            <style>{`
        .sso-callback-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0f0d 0%, #051f1a 100%);
        }

        .callback-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          text-align: center;
          max-width: 400px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 100px rgba(16, 185, 129, 0.15);
        }

        .spinner-large {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(16, 185, 129, 0.2);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .callback-card h2 {
          color: #f0fdf4;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .callback-card p {
          color: #bbf7d0;
          font-size: 0.95rem;
        }
      `}</style>
        </div>
    );
}

export default SSOCallback;
