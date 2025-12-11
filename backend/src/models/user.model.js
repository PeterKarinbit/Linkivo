import mongoose, { Schema } from "mongoose";
import { jobSeekerProfileSchema } from "./jobSeekerProfile.model.js";
import { CompanyProfile } from "./companyProfile.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for Clerk users
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    clerkId: { type: String, unique: true, sparse: true }, // Clerk user ID
    refreshToken: String,
    deletedAt: { type: Date }, // For soft delete
    userProfile: jobSeekerProfileSchema,
    dailyStreak: {
      count: { type: Number, default: 0 },
      lastUpdate: { type: Date }
    },
    aiCoachState: {
      lastKbRefreshAt: { type: Date },
      lastRoadmapRefreshAt: { type: Date },
      roadmapVersion: { type: Number, default: 0 },
      roadmapStatus: { type: String, enum: ['idle', 'generating', 'completed', 'failed'], default: 'idle' }
    },
    aiCoachConsent: {
      enabled: { type: Boolean, default: false },
      // What data the user allows the AI to use proactively
      scopes: {
        resume: { type: Boolean, default: false },
        journals: { type: Boolean, default: false },
        goals: { type: Boolean, default: false },
        tasks: { type: Boolean, default: false },
        applications: { type: Boolean, default: false },
        knowledgeBase: { type: Boolean, default: false }
      },
      schedule: {
        cadence: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'off'], default: 'weekly' },
        windowLocalTime: { type: String, default: '09:00' }, // HH:mm local
        timezone: { type: String, default: 'UTC' }
      },
      lastUpdatedAt: { type: Date },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '6h', // Default to 6 hours
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '6h', // Default to 6 hours
    }
  );
};

export const User = mongoose.model("User", userSchema);
