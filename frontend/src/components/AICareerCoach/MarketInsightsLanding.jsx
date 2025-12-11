import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiTarget, FiBarChart2, FiArrowRight } from 'react-icons/fi';

function MarketInsightsLanding() {
  const navigate = useNavigate();

  const insights = [
    {
      id: 'career-paths',
      title: 'Career Paths',
      description: 'Explore personalized career progression paths based on your skills and goals',
      icon: FiTrendingUp,
      color: 'from-blue-500 to-cyan-500',
      route: '/career-coach/career-paths'
    },
    {
      id: 'skill-gaps',
      title: 'Skill Gap Analysis',
      description: 'Identify skills you need to develop for your target role',
      icon: FiTarget,
      color: 'from-purple-500 to-pink-500',
      route: '/career-coach/skill-gaps'
    },
    {
      id: 'industry-trends',
      title: 'Industry Trends',
      description: 'Discover emerging trends, technologies, and opportunities in your industry',
      icon: FiBarChart2,
      color: 'from-green-500 to-emerald-500',
      route: '/career-coach/industry-trends'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-tour="market-insights-content">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Market Insights</h1>
          <p className="text-gray-600 text-lg">
            Explore career paths, skill gaps, and industry trends powered by Lightcast and Serper
          </p>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div
                key={insight.id}
                onClick={() => navigate(insight.route)}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${insight.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{insight.title}</h2>
                <p className="text-gray-600 mb-4">{insight.description}</p>
                <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Explore</span>
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">How it works</h3>
          <p className="text-gray-700">
            Our market insights are powered by real-time data from Lightcast and Serper APIs, 
            combined with your personal profile, resume, and journal entries to provide 
            personalized career intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MarketInsightsLanding;





