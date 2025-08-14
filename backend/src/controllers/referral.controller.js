import Referral from '../models/referral.model.js';
import crypto from 'crypto';

export const generateReferralLink = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate unique referral code
    const referralCode = crypto.randomBytes(6).toString('hex');
    
    // Create or update referral document
    let referral = await Referral.findOne({ referrerId: userId });
    
    if (!referral) {
      referral = await Referral.create({
        referrerId: userId,
        referralCode
      });
    }

    const referralLink = `${process.env.FRONTEND_URL}/signup?ref=${referralCode}`;
    
    res.status(200).json({
      success: true,
      referralLink,
      referralCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating referral link"
    });
  }
};

export const trackReferral = async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code"
      });
    }

    // Check if user is already referred
    const alreadyReferred = referral.referredUsers.some(user => 
      user.userId.toString() === newUserId
    );

    if (alreadyReferred) {
      return res.status(400).json({
        success: false,
        message: "User already referred"
      });
    }

    referral.referredUsers.push({
      userId: newUserId
    });
    await referral.save();

    res.status(200).json({
      success: true,
      message: "Referral tracked successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error tracking referral"
    });
  }
};

export const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const referral = await Referral.findOne({ referrerId: userId })
      .populate('referredUsers.userId', 'name email');
    
    if (!referral) {
      return res.status(200).json({
        success: true,
        stats: {
          totalReferred: 0,
          totalUpgraded: 0,
          rewardsEarned: 0,
          referredUsers: []
        }
      });
    }

    const stats = {
      totalReferred: referral.referredUsers.length,
      totalUpgraded: referral.referredUsers.filter(user => user.tierUpgraded).length,
      rewardsEarned: referral.rewardsEarned,
      referredUsers: referral.referredUsers
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching referral stats"
    });
  }
};
