import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiCopy, FiShare2 } from 'react-icons/fi';

const ReferFriend = () => {
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referral/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateLink = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setReferralLink(data.referralLink);
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Refer a Friend</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Share the Knowledge!</h2>
        <p className="mb-6">
          Invite your friends to join Linkivo and earn rewards when they upgrade their subscription tier.
          For each successful referral that upgrades, you'll receive special benefits!
        </p>

        <div className="space-y-4">
          <button
            onClick={generateLink}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            {loading ? 'Generating...' : 'Generate Referral Link'}
          </button>

          {referralLink && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={copyLink}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition duration-200 flex items-center gap-2"
              >
                <FiCopy /> Copy
              </button>
              <button
                onClick={shareLink}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 flex items-center gap-2"
              >
                <FiShare2 /> Share
              </button>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-600">Total Referred</p>
              <p className="text-2xl font-bold">{stats.totalReferred}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-600">Upgraded Users</p>
              <p className="text-2xl font-bold">{stats.totalUpgraded}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-600">Rewards Earned</p>
              <p className="text-2xl font-bold">{stats.rewardsEarned}</p>
            </div>
          </div>

          {stats.referredUsers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Referrals</h3>
              <div className="space-y-2">
                {stats.referredUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{user.userId.name}</p>
                      <p className="text-sm text-gray-600">{user.userId.email}</p>
                    </div>
                    <div>
                      {user.tierUpgraded ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          Upgraded
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferFriend;
