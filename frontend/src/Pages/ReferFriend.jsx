import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiCopy, FiShare2, FiClock, FiUsers } from 'react-icons/fi';
import { FaDiscord, FaInstagram, FaLinkedin, FaRocket } from 'react-icons/fa';

const ReferFriend = () => {
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/v1/referral/stats', {
        credentials: 'include'
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateLink = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setReferralLink(data.referralLink);
        toast.success('Referral link generated successfully!');
      }
    } catch (error) {
      toast.error('Error generating referral link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Linkivo',
          text: 'Check out this amazing job hunting platform!',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-20">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Refer a Friend</h1>
      
      <div className="relative bg-white rounded-lg shadow-md p-8 mb-6 overflow-hidden min-h-[700px] border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Share the Knowledge!</h2>
        <p className="mb-6 text-gray-700">
          Invite your friends to join Linkivo and earn rewards when they upgrade their subscription tier.
          For each successful referral that upgrades, you'll receive special benefits!
        </p>

        <div className="space-y-4">
          <button
            onClick={generateLink}
            disabled={loading || showComingSoon}
            className={`bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50 ${showComingSoon ? 'cursor-not-allowed' : ''}`}
          >
            {loading ? 'Generating...' : 'Generate Referral Link'}
          </button>

          {referralLink && !showComingSoon && (
            <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-md">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 p-2 border rounded bg-white"
              />
              <button
                onClick={copyLink}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition duration-200 flex items-center gap-2"
              >
                <FiCopy /> Copy
              </button>
              <button
                onClick={shareLink}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200 flex items-center gap-2"
              >
                <FiShare2 /> Share
              </button>
            </div>
          )}
        </div>

        {/* Coming Soon Overlay */}
        {showComingSoon && (
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-green-50 bg-opacity-95 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden p-8">
            <div className="relative text-center p-6 max-w-4xl mx-auto w-full space-y-10">
              
              {/* Header Section */}
              <div>
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-ping"></div>
                  <FaRocket className="relative w-24 h-24 text-green-500 mx-auto animate-bounce" />
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm px-4 py-2 rounded-full font-bold animate-pulse shadow-xl">
                    SOON
                  </div>
                </div>
                
                <h3 className="text-5xl font-bold text-gray-800 mb-4">
                  🎯 Referral Rewards
                </h3>
                
                <div className="flex items-center justify-center gap-3 text-green-600 mb-6">
                  <FiClock className="w-7 h-7 animate-spin" />
                  <span className="text-2xl font-semibold">Almost Ready!</span>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <p className="text-gray-800 text-2xl font-medium">
                  <span className="text-green-600 font-bold">Share the love, earn rewards!</span>
                </p>
                <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                  Our referral system will let you invite friends to join Linkivo and earn amazing rewards when they upgrade their accounts. Think exclusive perks, special access, and more!
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-6 text-lg text-gray-700 mt-8">
                  <span className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-xl">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    Generate links
                  </span>
                  <span className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-xl">
                    <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></span>
                    Track referrals
                  </span>
                  <span className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-xl">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-500"></span>
                    Earn rewards
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 text-gray-800">
                  <FiUsers className="w-7 h-7 animate-pulse" />
                  <span className="font-bold text-xl">Join our community while you wait:</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <a
                    href="https://discord.gg/linkivo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-5"
                  >
                    <FaDiscord className="w-10 h-10 group-hover:animate-bounce flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-xl">Join Discord</div>
                      <div className="text-base opacity-90">Connect with job seekers & get early updates</div>
                    </div>
                  </a>
                  
                  <a
                    href="https://instagram.com/linkivo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-5"
                  >
                    <FaInstagram className="w-10 h-10 group-hover:animate-bounce flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-xl">Follow Instagram</div>
                      <div className="text-base opacity-90">Behind-the-scenes & feature previews</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferFriend;
