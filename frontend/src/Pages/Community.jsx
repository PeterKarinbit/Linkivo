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
      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
        Want to be notified when we launch? Join the waitlist below.
      </p>
      {/* Notify form mini component */}
      <NotifyForm />
    </div>
  </div>
);

function NotifyForm() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | sending | sent | error
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      // Post to backend if available; fallback to localStorage capture
      const resp = await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, list: 'community_waitlist' })
      }).catch(() => null);
      if (!resp || !resp.ok) {
        const list = JSON.parse(localStorage.getItem('community_waitlist') || '[]');
        if (!list.includes(email)) list.push(email);
        localStorage.setItem('community_waitlist', JSON.stringify(list));
      }
      setStatus('sent');
    } catch (_) {
      setStatus('error');
      setError('Failed to submit. Please try again later.');
    }
  };

  if (status === 'sent') {
    return <div className="mx-auto w-full max-w-md text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">Thanks! We will notify you when Community launches.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md flex items-center gap-2 mt-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3"
        required
      />
      <button type="submit" disabled={status === 'sending'} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold">
        {status === 'sending' ? 'Submitting…' : 'Notify me'}
      </button>
      {error && <div className="w-full text-left text-sm text-red-500 mt-2">{error}</div>}
    </form>
  );
}

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
}

// TODO: The rest of the code was unreachable and has been commented out or removed to fix build errors.
// Once full community features are ready, the implementation logic can be restored here.

export default Community;
