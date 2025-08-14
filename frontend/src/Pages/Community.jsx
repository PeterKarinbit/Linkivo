import React, { useState, useEffect, useRef } from "react";
import CommunityLoading from "./CommunityLoading";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import { FaHome, FaSearch, FaEnvelope, FaBell, FaPlusCircle, FaUser, FaTimes, FaBold, FaItalic, FaUnderline, FaListUl, FaGoogleDrive, FaUserFriends, FaRocket, FaCog, FaUsers } from "react-icons/fa";

const ComingSoon = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-b from-primary-100 to-primary-50 dark:from-gray-900 dark:to-gray-800">
    <div className="space-y-8 max-w-3xl">
      <div className="animate-bounce">
        <FaRocket className="text-6xl text-primary-600 dark:text-primary-400 mx-auto" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
        Community Hub Coming Soon!
      </h1>
      <p className="text-xl text-gray-700 dark:text-gray-200 font-medium">
        We're building something special - a place where job seekers and professionals connect, share experiences, and grow together.
      </p>
      <div className="flex justify-center gap-8 py-8">
        <div className="text-center">
          <FaUsers className="text-3xl text-primary-500 dark:text-primary-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">Network Building</p>
        </div>
        <div className="text-center">
          <FaCog className="text-3xl text-primary-500 dark:text-primary-400 mx-auto mb-3 animate-spin-slow" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">In Development</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-8 font-medium">
        Want to be notified when we launch? Stay tuned!
      </p>
    </div>
  </div>
);

const NAV_ITEMS = [
  { label: "Home", icon: <FaHome />, tab: "Main" },
  { label: "Search", icon: <FaSearch />, tab: "Search" },
  { label: "Messages", icon: <FaEnvelope />, tab: "Messages" },
  { label: "Notifications", icon: <FaBell />, tab: "Notifications" },
  { label: "Create", icon: <FaPlusCircle />, tab: "Create" },
  { label: "Connections", icon: <FaUserFriends />, tab: "Connections" },
  { label: "Profile", icon: <FaUser />, tab: "Profile/Settings" },
];

const STORIES = [
  { id: 1, name: "Alice", img: "https://randomuser.me/api/portraits/women/1.jpg" },
  { id: 2, name: "Bob", img: "https://randomuser.me/api/portraits/men/2.jpg" },
  { id: 3, name: "Carol", img: "https://randomuser.me/api/portraits/women/3.jpg" },
  { id: 4, name: "Dan", img: "https://randomuser.me/api/portraits/men/4.jpg" },
  { id: 5, name: "Eve", img: "https://randomuser.me/api/portraits/women/5.jpg" },
  { id: 6, name: "Frank", img: "https://randomuser.me/api/portraits/men/6.jpg" },
  { id: 7, name: "Grace", img: "https://randomuser.me/api/portraits/women/7.jpg" },
  { id: 8, name: "Heidi", img: "https://randomuser.me/api/portraits/women/8.jpg" },
];

const FEED_POSTS = [
  {
    id: 1,
    user: { name: "Alice Johnson", title: "UI/UX Designer", location: "Nairobi", img: "https://randomuser.me/api/portraits/women/1.jpg" },
    time: "2h",
    content: "Excited to share my latest design project!",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    video: null,
    likes: 12,
    comments: 3,
    shares: 1,
  },
  {
    id: 2,
    user: { name: "Bob Smith", title: "Frontend Developer", location: "Remote", img: "https://randomuser.me/api/portraits/men/2.jpg" },
    time: "4h",
    content: "Check out this cool animation I built in React!",
    image: null,
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 8,
    comments: 2,
    shares: 0,
  },
  {
    id: 3,
    user: { name: "Carol Lee", title: "Product Manager", location: "London", img: "https://randomuser.me/api/portraits/women/3.jpg" },
    time: "1d",
    content: "Had a great time at the product meetup yesterday!",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    video: null,
    likes: 20,
    comments: 5,
    shares: 2,
  },
];

const SUGGESTIONS = [
  { id: 1, name: "Diana Prince", img: "https://randomuser.me/api/portraits/women/9.jpg" },
  { id: 2, name: "Ethan Hunt", img: "https://randomuser.me/api/portraits/men/10.jpg" },
  { id: 3, name: "Fiona Glenanne", img: "https://randomuser.me/api/portraits/women/11.jpg" },
];

function Community() {
  // Return the Coming Soon component instead of the full community implementation
  return <ComingSoon />;
  
  // TODO: Uncomment the code below when ready to enable full community features
  /*
  const [showLoading, setShowLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  const [useMainProfile, setUseMainProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [interests, setInterests] = useState("");
  const [activeTab, setActiveTab] = useState("Main");
  const [feedPosts, setFeedPosts] = useState(FEED_POSTS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", image: null, video: null });
  const feedRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [connections, setConnections] = useState([1, 2]); // user IDs of connected users (demo)
  const [pendingConnections, setPendingConnections] = useState([]); // user IDs of pending requests
  const [messages, setMessages] = useState({
    1: [ // Diana Prince
      { from: 'them', text: 'Hi there! 👋', time: '2h' },
      { from: 'me', text: 'Hello Diana!', time: '1h' },
    ],
    2: [ // Ethan Hunt
      { from: 'them', text: 'Ready for the next mission?', time: '3h' },
    ],
  });
  const [selectedChat, setSelectedChat] = useState(1); // user ID
  const [newMessage, setNewMessage] = useState("");
  const [myProfile, setMyProfile] = useState({
    img: "https://randomuser.me/api/portraits/men/12.jpg",
    name: "You",
    title: "Job Seeker",
    location: "",
    skills: ["React", "UI/UX", "Networking"],
    interests: "Career growth, Design, Tech",
    bio: "Passionate about connecting with professionals and finding new opportunities.",
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(myProfile);
  
  useEffect(() => {
    setShowLoading(true);
  }, []);
  
  const handleLoadingFinish = () => {
    setShowLoading(false);
    // Only show onboarding if not already completed in this session
    if (!sessionStorage.getItem("communityOnboarded")) {
      setShowOnboarding(true);
    }
  };
  */

  const handleConsent = (consent) => {
    setUseMainProfile(consent);
    if (consent) {
      setShowOnboarding(false);
      sessionStorage.setItem("communityOnboarded", "true");
    } else {
      setOnboardingStep(1);
    }
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    setShowOnboarding(false);
    sessionStorage.setItem("communityOnboarded", "true");
  };

  const handleCancel = () => {
    setShowOnboarding(false);
    navigate("/", { replace: true });
  };

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current || loadingMore) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        setLoadingMore(true);
        setTimeout(() => {
          // Simulate loading more posts (repeat placeholder data with new ids)
          const nextId = feedPosts.length + 1;
          const more = FEED_POSTS.map((p, i) => ({ ...p, id: nextId + i }));
          setFeedPosts(prev => [...prev, ...more]);
          setLoadingMore(false);
        }, 1200);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line
  }, [feedPosts, loadingMore]);

  // Handle new post modal
  const handleOpenPostModal = () => setShowPostModal(true);
  const handleClosePostModal = () => {
    setShowPostModal(false);
    setNewPost({ content: "", image: null, video: null });
  };
  const handleNewPostChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      setNewPost((prev) => ({ ...prev, image: URL.createObjectURL(files[0]), video: null }));
    } else if (name === "video" && files && files[0]) {
      setNewPost((prev) => ({ ...prev, video: URL.createObjectURL(files[0]), image: null }));
    } else {
      setNewPost((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handlePostSubmit = (e) => {
    e.preventDefault();
    const post = {
      id: Date.now(),
      user: { name: "You", title: "Job Seeker", location: "", img: "https://randomuser.me/api/portraits/men/12.jpg" },
      time: "now",
      content: newPost.content,
      image: newPost.image,
      video: newPost.video,
      likes: 0,
      comments: 0,
      shares: 0,
    };
    setFeedPosts([post, ...feedPosts]);
    handleClosePostModal();
  };

  // --- User Profile Modal/Page ---
  const handleOpenProfile = (user) => {
    setProfileUser(user);
    setShowProfileModal(true);
  };
  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setProfileUser(null);
  };

  // --- Onboarding Modal ---
  const OnboardingModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${darkMode ? "bg-black bg-opacity-80" : "bg-white bg-opacity-80"}`}>
      <div className={`rounded-2xl shadow-xl p-8 w-full max-w-md border transition-all duration-500 ${darkMode ? "bg-gray-900 border-green-700" : "bg-white border-green-500"}`} style={{ minHeight: 380 }}>
        {onboardingStep === 0 && (
          <div className="transition-all duration-500">
            <h2 className={`text-2xl font-bold mb-3 text-center ${darkMode ? "text-green-500" : "text-green-600"}`}>Welcome to the Community!</h2>
            <p className={`${darkMode ? "text-white" : "text-gray-800"} text-center mb-4`}>
              <span className={`font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>What is the Community?</span><br/>
              The Community is a space to connect, share, and grow with other job seekers and professionals. Post updates, join discussions, explore connections, and more!
            </p>
            <p className={`${darkMode ? "text-gray-200" : "text-gray-700"} text-center mb-6`}>Would you like to use your main profile information (bio, skills, etc.) for your Community profile?</p>
            <div className="flex gap-4 justify-center mb-4">
              <button
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                onClick={() => handleConsent(true)}
              >
                Yes, use my profile
              </button>
              <button
                className={`px-6 py-2 ${darkMode ? "bg-gray-700 hover:bg-gray-800" : "bg-gray-200 hover:bg-gray-300"} text-black dark:text-white rounded-lg font-semibold transition-colors`}
                onClick={() => handleConsent(false)}
              >
                No, I'll add new info
              </button>
            </div>
            <button
              className="w-full mt-2 px-6 py-2 bg-gray-500 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
        {onboardingStep === 1 && (
          <form onSubmit={handleInfoSubmit} className="transition-all duration-500">
            <h2 className={`text-2xl font-bold mb-3 text-center ${darkMode ? "text-green-500" : "text-green-600"}`}>Set Up Your Community Profile</h2>
            <div className="mb-3">
              <label className={`block mb-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Bio</label>
              <textarea
                className={`w-full p-2 rounded ${darkMode ? "bg-gray-800 text-white border-green-700" : "bg-gray-100 text-black border-green-500"} border`}
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                required
              />
            </div>
            <div className="mb-3">
              <label className={`block mb-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Skills (comma separated)</label>
              <input
                className={`w-full p-2 rounded ${darkMode ? "bg-gray-800 text-white border-green-700" : "bg-gray-100 text-black border-green-500"} border`}
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="e.g. UX Design, React, Node.js"
                required
              />
            </div>
            <div className="mb-3">
              <label className={`block mb-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Location</label>
              <input
                className={`w-full p-2 rounded ${darkMode ? "bg-gray-800 text-white border-green-700" : "bg-gray-100 text-black border-green-500"} border`}
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Nairobi, Remote"
                required
              />
            </div>
            <div className="mb-3">
              <label className={`block mb-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Job Title</label>
              <input
                className={`w-full p-2 rounded ${darkMode ? "bg-gray-800 text-white border-green-700" : "bg-gray-100 text-black border-green-500"} border`}
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                required
              />
            </div>
            <div className="mb-4">
              <label className={`block mb-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Interests (comma separated)</label>
              <input
                className={`w-full p-2 rounded ${darkMode ? "bg-gray-800 text-white border-green-700" : "bg-gray-100 text-black border-green-500"} border`}
                value={interests}
                onChange={e => setInterests(e.target.value)}
                placeholder="e.g. AI, Startups, Design"
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold mt-2 transition-colors"
              >
                Save and Continue
              </button>
              <button
                type="button"
                className="w-full px-6 py-2 bg-gray-500 hover:bg-gray-700 text-white rounded-lg font-semibold mt-2 transition-colors"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // --- Mini-page Components ---
  const CommunityFeed = () => (
    <div className="w-full max-w-xl flex flex-col gap-8 py-8" ref={feedRef}>
      {feedPosts.map(post => (
        <div key={post.id} className={`rounded-2xl shadow-lg p-6 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
          {/* Post Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 cursor-pointer" onClick={() => handleOpenProfile(post.user)}>
              <img src={post.user.img} alt={post.user.name} className="object-cover w-full h-full" />
            </div>
            <div className="flex flex-col cursor-pointer" onClick={() => handleOpenProfile(post.user)}>
              <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{post.user.name}</span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{post.user.title} • {post.user.location}</span>
            </div>
            <span className={`ml-auto text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{post.time}</span>
          </div>
          {/* Post Content */}
          <div className="mb-3">
            <p className={`mb-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{post.content}</p>
            {post.image && (
              <img src={post.image} alt="Post" className="rounded-xl w-full max-h-96 object-cover mb-2" />
            )}
            {post.video && (
              <video controls className="rounded-xl w-full max-h-96 mb-2">
                <source src={post.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          {/* Post Actions */}
          <div className="flex items-center gap-6 text-lg mb-2">
            <button className="hover:text-green-500 transition-colors">👍 {post.likes}</button>
            <button className="hover:text-green-500 transition-colors">💬 {post.comments}</button>
            <button className="hover:text-green-500 transition-colors">🔗 {post.shares}</button>
            <button className="ml-auto hover:text-green-500 transition-colors">💾 Save</button>
          </div>
          {/* Comment Input */}
          <input
            type="text"
            placeholder="Add a comment..."
            className={`w-full mt-2 p-2 rounded-lg border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-black border-gray-300"}`}
          />
        </div>
      ))}
      {loadingMore && (
        <div className="flex justify-center py-4 text-green-600 font-semibold">Loading more posts...</div>
      )}
    </div>
  );

  const CommunitySearch = () => {
    // Demo users for search
    const users = [
      ...SUGGESTIONS,
      { id: 4, name: "Alice Johnson", img: "https://randomuser.me/api/portraits/women/1.jpg", title: "UI/UX Designer", skills: ["UI/UX", "Figma", "Design"], location: "Nairobi" },
      { id: 5, name: "Bob Smith", img: "https://randomuser.me/api/portraits/men/2.jpg", title: "Frontend Developer", skills: ["React", "JS", "CSS"], location: "Remote" },
    ];
    const [search, setSearch] = useState("");
    const [skill, setSkill] = useState("");
    const filtered = users.filter(u =>
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        (skill && u.skills && u.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))))
    );
    return (
      <div className={`w-full max-w-xl py-8 ${darkMode ? "text-white" : "text-gray-900"}`}>
        <h2 className="text-2xl font-bold mb-4">Search</h2>
        <input className="w-full p-2 rounded border mb-2" placeholder="Search users by name..." value={search} onChange={e => setSearch(e.target.value)} />
        <input className="w-full p-2 rounded border mb-4" placeholder="Filter by skill (e.g. React)" value={skill} onChange={e => setSkill(e.target.value)} />
        <div className="flex flex-col gap-3">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-green-50 dark:hover:bg-gray-800" onClick={() => handleOpenProfile(u)}>
              <img src={u.img} alt={u.name} className="w-10 h-10 rounded-full border-2 border-green-500" />
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-gray-500">{u.title || "Member"} {u.skills && u.skills.length > 0 && `• ${u.skills.join(", ")}`}</div>
              </div>
              <div className="ml-auto text-xs text-gray-400">{u.location || "-"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CommunityConnections = () => {
    // Demo connections
    const connections = [
      { id: 1, name: "Diana Prince", img: "https://randomuser.me/api/portraits/women/9.jpg", title: "Product Designer", location: "London", skills: ["Design", "UX"] },
      { id: 2, name: "Ethan Hunt", img: "https://randomuser.me/api/portraits/men/10.jpg", title: "Backend Dev", location: "Remote", skills: ["Node.js", "APIs"] },
    ];
    return (
      <div className={`w-full max-w-xl py-8 ${darkMode ? "text-white" : "text-gray-900"}`}>
        <h2 className="text-2xl font-bold mb-4">Connections</h2>
        <div className="flex flex-col gap-3">
          {connections.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-green-50 dark:hover:bg-gray-800" onClick={() => handleOpenProfile(u)}>
              <img src={u.img} alt={u.name} className="w-10 h-10 rounded-full border-2 border-green-500" />
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-gray-500">{u.title || "Member"} {u.skills && u.skills.length > 0 && `• ${u.skills.join(", ")}`}</div>
              </div>
              <div className="ml-auto text-xs text-gray-400">{u.location || "-"}</div>
              <button className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs">Message</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Messaging Logic ---
  const handleSelectChat = (userId) => setSelectedChat(userId);
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), { from: 'me', text: newMessage, time: 'now' }],
    }));
    setNewMessage("");
  };
  // Demo unread count: count messages from 'them' not replied to by 'me'
  const unreadCount = Object.values(messages).reduce((acc, msgs) => acc + (msgs.filter(m => m.from === 'them').length - msgs.filter(m => m.from === 'me').length), 0);

  // --- CommunityMessages Component ---
  const CommunityMessages = () => {
    // Demo connections
    const chatUsers = [
      { id: 1, name: "Diana Prince", img: "https://randomuser.me/api/portraits/women/9.jpg", title: "Product Designer" },
      { id: 2, name: "Ethan Hunt", img: "https://randomuser.me/api/portraits/men/10.jpg", title: "Backend Dev" },
    ].filter(u => connections.includes(u.id));
    const currentMsgs = messages[selectedChat] || [];
    const currentUser = chatUsers.find(u => u.id === selectedChat);
    return (
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 py-8">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border-r pr-4">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="flex flex-col gap-2">
            {chatUsers.map(u => (
              <div key={u.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${selectedChat === u.id ? 'bg-green-100 dark:bg-gray-800' : 'hover:bg-green-50 dark:hover:bg-gray-800'}`} onClick={() => handleSelectChat(u.id)}>
                <img src={u.img} alt={u.name} className="w-10 h-10 rounded-full border-2 border-green-500" />
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.title}</div>
                </div>
                {/* Unread badge (demo) */}
                {messages[u.id] && messages[u.id].some(m => m.from === 'them') && (
                  <span className="ml-auto bg-green-600 text-white text-xs rounded-full px-2 py-0.5">{messages[u.id].filter(m => m.from === 'them').length - (messages[u.id].filter(m => m.from === 'me').length)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Chat Window */}
        <div className="w-full md:w-2/3 flex flex-col">
          {currentUser ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <img src={currentUser.img} alt={currentUser.name} className="w-10 h-10 rounded-full border-2 border-green-500" />
                <div>
                  <div className="font-semibold">{currentUser.name}</div>
                  <div className="text-xs text-gray-500">{currentUser.title}</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2 mb-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                {currentMsgs.length === 0 ? <div className="text-gray-400">No messages yet.</div> : currentMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 rounded-lg max-w-xs ${m.from === 'me' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>{m.text}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  className="flex-1 p-2 rounded border"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">Send</button>
              </form>
            </>
          ) : <div className="text-gray-400">Select a conversation to start chatting.</div>}
        </div>
      </div>
    );
  };

  const CommunityNotifications = () => (
    <div className={`w-full max-w-xl py-8 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="text-gray-400">(Your recent notifications will appear here.)</div>
    </div>
  );

  const handleEditProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "img" && files && files[0]) {
      setEditProfile((prev) => ({ ...prev, img: URL.createObjectURL(files[0]) }));
    } else if (name === "skills") {
      setEditProfile((prev) => ({ ...prev, skills: value.split(",").map(s => s.trim()) }));
    } else {
      setEditProfile((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleEditProfileSave = (e) => {
    e.preventDefault();
    setMyProfile(editProfile);
    setShowEditProfile(false);
  };
  const handleEditProfileOpen = () => {
    setEditProfile(myProfile);
    setShowEditProfile(true);
  };
  const handleEditProfileClose = () => setShowEditProfile(false);

  const CommunityProfileSettings = () => (
    <div className={`w-full max-w-xl py-8 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <h2 className="text-2xl font-bold mb-4">Profile & Settings</h2>
      <div className="flex items-center gap-6 mb-6">
        <img src={myProfile.img} alt={myProfile.name} className="w-24 h-24 rounded-full border-4 border-green-500" />
        <div>
          <div className="text-xl font-bold">{myProfile.name}</div>
          <div className="text-sm text-gray-400">{myProfile.title} {myProfile.location && `• ${myProfile.location}`}</div>
          <div className="flex flex-wrap gap-2 mt-2">{myProfile.skills.map(s => <span key={s} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{s}</span>)}</div>
        </div>
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-1">Bio</div>
        <div className="text-gray-300">{myProfile.bio}</div>
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-1">Interests</div>
        <div className="text-gray-300">{myProfile.interests}</div>
      </div>
      <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold" onClick={handleEditProfileOpen}>Edit Profile</button>
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <form className={`relative w-full max-w-lg p-8 rounded-2xl shadow-xl ${darkMode ? "bg-gray-900 border border-green-700" : "bg-white border border-green-500"}`} onSubmit={handleEditProfileSave}>
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl" onClick={handleEditProfileClose}><FaTimes /></button>
            <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span>Avatar</span>
                <input type="file" accept="image/*" name="img" onChange={handleEditProfileChange} />
                {editProfile.img && <img src={editProfile.img} alt="Preview" className="w-16 h-16 rounded-full mt-2" />}
              </label>
              <label className="flex flex-col gap-1">
                <span>Name</span>
                <input type="text" name="name" value={editProfile.name} onChange={handleEditProfileChange} className="p-2 rounded border" required />
              </label>
              <label className="flex flex-col gap-1">
                <span>Title</span>
                <input type="text" name="title" value={editProfile.title} onChange={handleEditProfileChange} className="p-2 rounded border" />
              </label>
              <label className="flex flex-col gap-1">
                <span>Location</span>
                <input type="text" name="location" value={editProfile.location} onChange={handleEditProfileChange} className="p-2 rounded border" />
              </label>
              <label className="flex flex-col gap-1">
                <span>Skills (comma separated)</span>
                <input type="text" name="skills" value={editProfile.skills.join(", ")} onChange={handleEditProfileChange} className="p-2 rounded border" />
              </label>
              <label className="flex flex-col gap-1">
                <span>Interests</span>
                <input type="text" name="interests" value={editProfile.interests} onChange={handleEditProfileChange} className="p-2 rounded border" />
              </label>
              <label className="flex flex-col gap-1">
                <span>Bio</span>
                <textarea name="bio" value={editProfile.bio} onChange={handleEditProfileChange} className="p-2 rounded border" rows={3} />
              </label>
            </div>
            <button type="submit" className="mt-6 w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">Save Changes</button>
          </form>
        </div>
      )}
    </div>
  );

  // --- Create Tab: Rich Post Creation ---
  const [createContent, setCreateContent] = useState("");
  const [createImage, setCreateImage] = useState(null);
  const [createVideo, setCreateVideo] = useState(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  const handleCreateInput = (e) => setCreateContent(e.target.value);
  const handleCreateImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCreateImage(URL.createObjectURL(e.target.files[0]));
      setCreateVideo(null);
    }
  };
  const handleCreateVideo = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCreateVideo(URL.createObjectURL(e.target.files[0]));
      setCreateImage(null);
    }
  };
  const handleCreateFormat = (type) => {
    let tag;
    if (type === "bold") tag = "<b></b>";
    if (type === "italic") tag = "<i></i>";
    if (type === "underline") tag = "<u></u>";
    if (type === "ul") tag = "<ul><li></li></ul>";
    setCreateContent((prev) => prev + tag);
  };
  const handleCreateDrive = () => {
    setShowDrivePicker(true);
    setTimeout(() => setShowDrivePicker(false), 1500); // Placeholder for Google Drive picker
  };
  const handleCreatePost = (e) => {
    e.preventDefault();
    const post = {
      id: Date.now(),
      user: { name: "You", title: "Job Seeker", location: "", img: "https://randomuser.me/api/portraits/men/12.jpg" },
      time: "now",
      content: createContent,
      image: createImage,
      video: createVideo,
      likes: 0,
      comments: 0,
      shares: 0,
    };
    setFeedPosts([post, ...feedPosts]);
    setCreateContent("");
    setCreateImage(null);
    setCreateVideo(null);
    setActiveTab("Main");
  };
  const CommunityCreate = () => (
    <div className={`w-full max-w-xl py-8 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <h2 className="text-2xl font-bold mb-4">Create a Post</h2>
      <form onSubmit={handleCreatePost}>
        <div className="flex gap-2 mb-2">
          <button type="button" className="p-2 rounded hover:bg-green-100 dark:hover:bg-gray-800" onClick={() => handleCreateFormat("bold")} title="Bold"><FaBold /></button>
          <button type="button" className="p-2 rounded hover:bg-green-100 dark:hover:bg-gray-800" onClick={() => handleCreateFormat("italic")} title="Italic"><FaItalic /></button>
          <button type="button" className="p-2 rounded hover:bg-green-100 dark:hover:bg-gray-800" onClick={() => handleCreateFormat("underline")} title="Underline"><FaUnderline /></button>
          <button type="button" className="p-2 rounded hover:bg-green-100 dark:hover:bg-gray-800" onClick={() => handleCreateFormat("ul")} title="List"><FaListUl /></button>
          <button type="button" className="p-2 rounded hover:bg-green-100 dark:hover:bg-gray-800" onClick={handleCreateDrive} title="Google Drive"><FaGoogleDrive /></button>
        </div>
        <textarea
          className={`w-full p-2 rounded mb-3 ${darkMode ? "bg-gray-800 text-white border-green-700" : "bg-gray-100 text-black border-green-500"} border`}
          rows={4}
          value={createContent}
          onChange={handleCreateInput}
          placeholder="What's on your mind? Use <b>, <i>, <u>, <ul> for formatting."
          required
        />
        <div className="flex gap-2 mb-3">
          <label className="flex flex-col items-center cursor-pointer">
            <span className="text-xs mb-1">Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCreateImage} />
          </label>
          <label className="flex flex-col items-center cursor-pointer">
            <span className="text-xs mb-1">Video</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleCreateVideo} />
          </label>
        </div>
        {createImage && <img src={createImage} alt="Preview" className="rounded-xl w-full max-h-60 object-cover mb-2" />}
        {createVideo && <video controls className="rounded-xl w-full max-h-60 mb-2"><source src={createVideo} type="video/mp4" /></video>}
        {showDrivePicker && <div className="mb-2 text-green-500">(Google Drive picker coming soon...)</div>}
        <button type="submit" className="w-full mt-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors">Post</button>
      </form>
    </div>
  );

  // --- User Profile Modal ---
  const UserProfileModal = () => {
    if (!profileUser) return null;
    // Demo posts for the user
    const userPosts = feedPosts.filter(p => p.user.name === profileUser.name);
    // Demo mutual connections
    const allUsers = [
      { id: 1, name: "Diana Prince", img: "https://randomuser.me/api/portraits/women/9.jpg" },
      { id: 2, name: "Ethan Hunt", img: "https://randomuser.me/api/portraits/men/10.jpg" },
      { id: 3, name: "Fiona Glenanne", img: "https://randomuser.me/api/portraits/women/11.jpg" },
      { id: 4, name: "Alice Johnson", img: "https://randomuser.me/api/portraits/women/1.jpg" },
      { id: 5, name: "Bob Smith", img: "https://randomuser.me/api/portraits/men/2.jpg" },
    ];
    const mutuals = allUsers.filter(u => u.id !== profileUser.id && connections.includes(u.id));

    // Helper functions for connection management
    const isConnected = (user) => connections.includes(user.id);
    const isPending = (user) => pendingConnections.includes(user.id);
    const handleConnect = (user) => {
      setPendingConnections([...pendingConnections, user.id]);
      // In a real app, this would send a connection request to the backend
    };
    const handleDisconnect = (user) => {
      setConnections(connections.filter(id => id !== user.id));
      // In a real app, this would remove the connection via backend
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
        <div className={`relative w-full max-w-lg p-8 rounded-2xl shadow-xl ${darkMode ? "bg-gray-900 border border-green-700" : "bg-white border border-green-500"}`}>
          <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl" onClick={handleCloseProfile}><FaTimes /></button>
          <div className="flex items-center gap-4 mb-4">
            <img src={profileUser.img} alt={profileUser.name} className="w-20 h-20 rounded-full border-4 border-green-500" />
            <div>
              <div className="text-xl font-bold">{profileUser.name}</div>
              <div className="text-sm text-gray-400">{profileUser.title || "Member"} {profileUser.location && `• ${profileUser.location}`}</div>
              {profileUser.skills && <div className="flex flex-wrap gap-2 mt-2">{profileUser.skills.map(s => <span key={s} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{s}</span>)}</div>}
            </div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Bio</div>
            <div className="text-gray-300">{profileUser.bio || "No bio provided."}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Interests</div>
            <div className="text-gray-300">{profileUser.interests || "No interests provided."}</div>
          </div>
          <div className="mb-4 flex gap-2 flex-wrap">
            {isConnected(profileUser) ? (
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded font-semibold" onClick={() => handleDisconnect(profileUser)}>Disconnect</button>
            ) : isPending(profileUser) ? (
              <button className="px-4 py-2 bg-yellow-500 text-white rounded font-semibold" disabled>Pending...</button>
            ) : (
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold" onClick={() => handleConnect(profileUser)}>Connect</button>
            )}
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded font-semibold">Message</button>
          </div>
          {mutuals.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold mb-1">Mutual Connections</div>
              <div className="flex flex-wrap gap-2">
                {mutuals.map(u => (
                  <div key={u.id} className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                    <img src={u.img} alt={u.name} className="w-5 h-5 rounded-full" /> {u.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="font-semibold mb-2">Posts</div>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
              {userPosts.length === 0 ? <div className="text-gray-400">No posts yet.</div> : userPosts.map(p => (
                <div key={p.id} className="rounded-lg border p-3 bg-gray-800 text-white">
                  <div className="text-sm mb-1">{p.content}</div>
                  {p.image && <img src={p.image} alt="Post" className="rounded mb-1 max-h-32" />}
                  {p.video && <video controls className="rounded mb-1 max-h-32"><source src={p.video} type="video/mp4" /></video>}
                  <div className="text-xs text-gray-400">{p.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Content Switch ---
  const MainContent = () => {
    switch(activeTab) {
      case "Main":
        return <CommunityFeed />;
      case "Search":
        return <CommunitySearch />;
      case "Connections":
        return <CommunityConnections />;
      case "Messages":
        return <CommunityMessages />;
      case "Notifications":
        return <CommunityNotifications />;
      case "Create":
        return <CommunityCreate />;
      case "Profile/Settings":
        return <CommunityProfileSettings />;
      default:
        return <div className="w-full max-w-xl py-8 text-gray-400">(Page not found)</div>;
    }
  };

  if (showLoading) {
    return <CommunityLoading onFinish={handleLoadingFinish} />;
  }
  if (showOnboarding) {
    return <OnboardingModal />;
  }

  const navWithBadges = NAV_ITEMS.map(item => {
    if (item.tab === "Messages") {
      return { ...item, badge: unreadCount > 0 ? unreadCount : null };
    }
    if (item.tab === "Notifications") {
      return { ...item, badge: 3 }; // Demo: always 3 notifications
    }
    return item;
  });

  return (
    <div className={`min-h-screen w-full flex ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Left Sidebar (enlarged) */}
      <aside className={`hidden md:flex flex-col items-center py-8 px-2 w-72 min-h-screen border-r ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className="mb-10 text-2xl font-bold text-green-600"></div>
        <nav className="flex flex-col gap-2 w-full">
          {navWithBadges.map(item => (
            <button
              key={item.label}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-lg transition-colors duration-200 w-full text-left ${activeTab === item.tab ? "bg-green-600 text-white" : darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}
              onClick={() => setActiveTab(item.tab)}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
              {item.badge && <span className="ml-auto bg-green-600 text-white text-xs rounded-full px-2 py-0.5">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center min-h-screen pb-20" style={{marginTop: '72px'}}>
        {/* Stories Bar (only on Feed/Main) */}
        {activeTab === "Main" && (
          <div className="w-full flex gap-4 overflow-x-auto py-6 px-4 border-b border-gray-800 bg-opacity-80" style={{background: darkMode ? "#18181b" : "#f9fafb"}}>
            {STORIES.map(story => (
              <div key={story.id} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-green-500 flex-shrink-0 overflow-hidden mb-1">
                  <img src={story.img} alt={story.name} className="object-cover w-full h-full" />
                </div>
                <span className={`text-xs ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{story.name}</span>
              </div>
            ))}
          </div>
        )}
        {/* Main Content Switch */}
        <MainContent />
        {/* Floating Action Button (not on Create/Messages/Profile/Settings) */}
        {!["Create", "Messages", "Profile/Settings"].includes(activeTab) && (
          <button
            className="fixed bottom-8 right-8 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-5 text-3xl flex items-center justify-center transition-colors"
            title="Create New Post"
            onClick={() => setActiveTab("Create")}
          >
            <FaPlusCircle />
          </button>
        )}
        {/* User Profile Modal */}
        {showProfileModal && <UserProfileModal />}
      </main>
      {/* Right Sidebar */}
      <aside className={`hidden lg:flex flex-col py-8 px-4 w-80 min-h-screen border-l ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className="mb-6 text-lg font-bold text-green-600">Suggested for you</div>
        <div className="flex flex-col gap-4">
          {SUGGESTIONS.map(s => (
            <div key={s.id} className="flex items-center gap-3 cursor-pointer" onClick={() => handleOpenProfile(s)}>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500">
                <img src={s.img} alt={s.name} className="object-cover w-full h-full" />
              </div>
              <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{s.name}</span>
              <button className="ml-auto px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold">Follow</button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default Community;