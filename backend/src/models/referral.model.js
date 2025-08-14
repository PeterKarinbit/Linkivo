import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tierUpgraded: {
      type: Boolean,
      default: false
    },
    dateReferred: {
      type: Date,
      default: Date.now
    }
  }],
  rewardsEarned: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Referral", referralSchema);
