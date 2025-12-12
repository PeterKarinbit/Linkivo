import React, { useEffect, useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "./assets/media/JobHunter.png";
import { useDispatch, useSelector } from "react-redux";
import { userService } from "../services/userService";
import { logout } from "../store/authSlice";
import { contentService } from "../services/contentService";
import { notificationsService } from "../services/notificationsService";
import { useDarkMode } from "../context/DarkModeContext";
import { useUser, useClerk, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

function Navbar() {
  const navLinks = [
    {
      title: "Home",
      path: "/",
    },
    {
      title: "Upload",
      path: "/upload",
    },
    {
      title: "Career Hub",
      path: "/career-coach",
    },
    //{
    //title: "Onboarding",
    //path: "/user-onboarding",
    //},
    {
      title: "Community",
      path: "/companies",
    },
    //{
    //title: "Refer a Friend",
    //path: "/refer-friend",
    //},
    {
      title: "Settings",
      path: "/settings",
    },
    {
      title: "Upgrade",
      path: "/upgrade",
    },
  ];
  const dispatch = useDispatch();
  const { status, userData } = useSelector((store) => store.auth);
  const [open, setOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notes, setNotes] = useState([]);
  const [aiRecommendationsCount, setAiRecommendationsCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState(
    "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"
  );
  const { darkMode } = useDarkMode();

  // Clerk auth state
  const { isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Support both legacy and Clerk auth
  const isAuthenticated = status || isSignedIn;
  const currentUser = clerkUser || userData;

  const [greeting, setGreeting] = useState("");
  const [localTime, setLocalTime] = useState("");

  const computeGreeting = () => {
    const hour = new Date().getHours();
    const nextGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
    const formattedTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
    setGreeting(nextGreeting);
    setLocalTime(formattedTime);
  };

  useEffect(() => {
    computeGreeting();
    const id = setInterval(computeGreeting, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const profilePicture =
      userData?.userProfile?.profilePicture ||
      userData?.userProfile?.companyLogo;
    setProfilePicture(profilePicture);
  }, [userData]);

  // Notifications: load initial list and subscribe to SSE
  useEffect(() => {
    let unsubscribe = null;
    const userId = userData?._id;
    (async () => {
      try {
        const resp = await notificationsService.list(userId);
        if (resp?.success) {
          setNotes(resp.notifications || []);
          const unread = (resp.notifications || []).filter(n => !n.readAt).length;
          setUnreadCount(unread);
        }
      } catch (_) { }
      unsubscribe = notificationsService.subscribe({
        userId,
        onEvent: (evt) => {
          if (evt?.type === 'notification' && evt.data) {
            setNotes((prev) => [evt.data, ...prev]);
            setUnreadCount((c) => c + 1);
          }
        },
      });
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userData?._id]);

  // Listen for AI recommendations updates
  useEffect(() => {
    const handleAiRecommendationsUpdate = (event) => {
      const { count, type } = event.detail;
      if (type === 'recommendations') {
        setAiRecommendationsCount(count);
      }
    };

    const handleNewRecommendations = (event) => {
      const { count } = event.detail;
      setAiRecommendationsCount(prev => prev + count);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New AI Recommendations', {
          body: `You have ${count} new career recommendations from your AI Coach`,
          icon: '/favicon.ico',
          tag: 'ai-recommendations'
        });
      }
    };

    window.addEventListener('aiRecommendationsUpdate', handleAiRecommendationsUpdate);
    window.addEventListener('newRecommendations', handleNewRecommendations);

    return () => {
      window.removeEventListener('aiRecommendationsUpdate', handleAiRecommendationsUpdate);
      window.removeEventListener('newRecommendations', handleNewRecommendations);
    };
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  const toggleProfileDropdown = () => {
    setIsProfileOpen((prev) => !prev);
    if (!isProfileOpen) setIsNotificationsOpen(false);
  };

  const handleLogout = async () => {
    try {
      // If using Clerk, sign out from Clerk
      if (isSignedIn) {
        await signOut();
        window.location.href = "/";
        return;
      }

      // Legacy logout
      await userService.logout();
      dispatch(logout());
      window.location.href = "/";
    } catch (error) {
      // Fallback: clear state and redirect
      if (isSignedIn) {
        await signOut();
      }
      dispatch(logout());
      window.location.href = "/login";
    }
  };

  const navigate = useNavigate();

  const activeStyle = "text-green-700 pb-4 border-b-2 border-green-700";

  return (
    <div className="border-b w-full fixed top-0 left-0 font-Nunito z-50 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow">
      <div className="max-w-[1920px] mx-auto w-full lg:flex items-center justify-between bg-white dark:bg-gray-900 py-2.5 lg:px-10 px-7">
        <div className="font-bold text-2xl cursor-pointer flex items-center text-gray-900 dark:text-gray-100">
          <Link to="/" className="flex items-center font-Poppins">
            <img
              src={logo}
              className="w-10 rounded-lg mr-3"
              alt="Linkivo Logo"
            />
            <span className="font-bold">Linkivo</span>
          </Link>
        </div>

        <div
          onClick={() => setOpen((pre) => !pre)}
          className="text-3xl absolute right-8 top-3 cursor-pointer lg:hidden"
        >
          <i
            className={open ? "fa-solid fa-x" : "fa-solid fa-bars"}
            style={{ color: "#3fb337" }}
          ></i>
        </div>
        <ul
          className={`lg:flex lg:items-center lg:pb-0 pb-12 absolute lg:static bg-white dark:bg-gray-900 lg:z-auto z-[-1] left-0 w-full lg:w-auto lg:pl-0 pl-9 transition-all duration-500 ease-in ${open ? "top-20 " : "top-[-490px]"
            }`}
        >
          {/* Time-of-day Greeting Chip (placed before Home) */}
          <li className="hidden lg:flex items-center lg:ml-8 lg:my-0 my-7">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 text-sm font-medium">
              {greeting}
              {userData?.userProfile?.name || userData?.userProfile?.companyName ? `, ${userData.userProfile.name || userData.userProfile.companyName}` : ""}
              {localTime ? ` • ${localTime}` : ""}
            </span>
          </li>
          {/* Home link */}
          <li className="lg:ml-8 text-base font-semibold lg:my-0 my-7">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? activeStyle
                  : "text-gray-600 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium relative group transition-all duration-300 ease-in-out hover:scale-105"
              }
            >
              <span className="relative z-10">Home</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:w-full transition-all duration-300 ease-out"></div>
            </NavLink>
          </li>
          {/* Only show Login and Sign Up when not logged in */}
          {!isAuthenticated ? (
            <>
              {/* Contact visible when logged out */}
              <li className="lg:ml-8 text-base font-semibold lg:my-0 my-7">
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    isActive
                      ? activeStyle
                      : "text-gray-600 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium relative group transition-all duration-300 ease-in-out hover:scale-105 px-3 py-2 rounded-lg"
                  }
                >
                  <span className="relative z-10">Contact</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:w-full transition-all duration-300 ease-out"></div>
                </NavLink>
              </li>
              <div className=" lg:flex ">
                {/* Original green auth pages */}
                <Link to="/login">
                  <button className="border-2 border-green-500 text-green-600 dark:text-green-400 font-bold py-1.5 px-5 rounded-md lg:ml-32 lg:ml-7 lg:shadow xl:ml-36 hover:bg-green-50 dark:hover:bg-green-900/20 duration-500 mr-2 lg:hover:scale-105 relative group overflow-hidden">
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-1.5 px-5 rounded-md hover:from-green-700 hover:to-emerald-700 duration-500 lg:hover:scale-105 lg:shadow relative group overflow-hidden">
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </button>
                </Link>
              </div>
            </>
          ) : (
            // Show all navLinks except Home, Login, and Sign Up when logged in
            <>
              {navLinks.map((link, index) => {
                if (link.title === "Home") return null;
                return (
                  <li
                    key={index}
                    className="lg:ml-8 text-base font-semibold lg:my-0 my-7"
                  >
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        isActive
                          ? activeStyle
                          : "text-gray-600 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 font-medium relative group transition-all duration-300 ease-in-out hover:scale-105 px-3 py-2 rounded-lg"
                      }
                    >
                      <span className="relative z-10">{link.title}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:w-full transition-all duration-300 ease-out"></div>

                      {/* Special effects for Career Hub */}
                      {link.title === "Career Hub" && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
                        </>
                      )}

                      {/* Special effects for Upgrade */}
                      {link.title === "Upgrade" && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce"></div>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
              <div className="px-20 flex gap-8 items-center justify-center">
                <div className="relative">
                  <button
                    type="button"
                    className="relative"
                    onClick={() => {
                      setIsNotificationsOpen((v) => !v);
                      setIsProfileOpen(false);
                    }}
                    aria-label="Notifications"
                  >
                    <i className="fa-solid fa-bell text-xl text-gray-600 dark:text-gray-300"></i>
                    {(unreadCount > 0 || aiRecommendationsCount > 0) && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        {unreadCount + aiRecommendationsCount}
                      </span>
                    )}
                  </button>
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700 z-50">
                      <div className="py-2 max-h-96 overflow-auto">
                        {/* AI Recommendations Section */}
                        {aiRecommendationsCount > 0 && (
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Recommendations</span>
                              </div>
                              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium px-2 py-1 rounded-full">
                                {aiRecommendationsCount}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              You have {aiRecommendationsCount} unread career recommendations
                            </div>
                            <button
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                window.location.href = '/career-coach?tab=proactive-recommendations';
                              }}
                              className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                            >
                              View Recommendations →
                            </button>
                          </div>
                        )}

                        {/* Regular Notifications */}
                        {notes.length === 0 && aiRecommendationsCount === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">No notifications</div>
                        ) : (
                          notes.map((n) => (
                            <div key={n.id} className="px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
                              <div className="flex items-start gap-2">
                                <div className={`mt-1 w-2 h-2 rounded-full ${n.readAt ? 'bg-gray-300' : 'bg-emerald-500'}`}></div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</div>
                                  {n.body && <div className="text-sm text-gray-700 dark:text-gray-300">{n.body}</div>}
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notes.some(n => !n.readAt) && (
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                          <button
                            className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
                            onClick={async () => {
                              const unreadIds = notes.filter(n => !n.readAt).map(n => n.id);
                              try { await notificationsService.markRead(unreadIds, userData?._id); } catch (_) { }
                              setNotes(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
                              setUnreadCount(0);
                            }}
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative shado">
                  <div
                    className="rounded-full h-9 w-9 hover:cursor-pointer overflow-hidden flex justify-center items-center border border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      if (userData?.role !== "employer") {
                        toggleProfileDropdown();
                      } else {
                        navigate("/dashboard/home");
                      }
                    }}
                  >
                    <img src={profilePicture} className="object-cover" />
                  </div>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700">
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
                          role="menuitem"
                          onClick={toggleProfileDropdown}
                        >
                          Edit Profile
                        </Link>
                        <Link
                          to="/saved-jobs"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
                          role="menuitem"
                          onClick={toggleProfileDropdown}
                        >

                        </Link>
                        <p
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer"
                          role="menuitem"
                          onClick={() => {
                            handleLogout();
                            toggleProfileDropdown();
                          }}
                        >
                          Logout
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </ul>
      </div>
    </div>
  );
}

export default Navbar;
