import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.service.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { analyzeDocument, getResumeImprovementSuggestions } from "../utils/ai/resumeAnalysis.service.js";
import OpenAI from "openai";
import { getRewordedResume } from "../utils/ai/deepseek.service.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import EnhancedAICareerCoachService from "../utils/ai/enhancedAICareerCoach.service.js";
import { logger } from "../utils/logger.js";
import { validatePassword } from "../utils/passwordPolicy.js";
import {
  sanitizeFilename,
  validateFileExtension,
  validateFileContent,
  validateFileSize,
  normalizeSkill,
  validateSkillName
} from "../utils/uploadSecurity.utils.js";
// import { PRODUCTION_URL } from "../constants.js";
import { createClerkClient } from '@clerk/express';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});


// Testing endpoints
const ping = (req, res) => {
  res.send("User API is working");
};
const authPing = (req, res) => {
  res.send("User Auth is working");
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  // Remove domain property for development to allow cookies on localhost and network IPs
  // domain: process.env.NODE_ENV === "production" ? "noobnarayan.in" : "localhost",
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while generating referesh and access token: ${error}`
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, role, userProfile } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const username = email.split("@")[0];

  const existingUserByUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUserByUsername) {
    throw new ApiError(409, "Username is already taken");
  }

  try {
    // Modern password policy: len>=8, disallow common/breached, no composition rules
    const pwCheck = await validatePassword(password, { email, name: userProfile?.name });
    if (!pwCheck.ok) {
      throw new ApiError(400, pwCheck.message);
    }
    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      role,
      userProfile,
      aiCoachConsent: {
        enabled: true,
        scopes: {
          resume: true,
          journals: true,
          goals: true,
          tasks: true,
          applications: true,
          knowledgeBase: true
        },
        schedule: {
          cadence: 'weekly',
          windowLocalTime: '09:00',
          timezone: 'UTC'
        },
        lastUpdatedAt: new Date()
      }
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshtoken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Initialize user career profile and seed KB/vectorization (best-effort)
    try {
      await EnhancedAICareerCoachService.getUserCareerProfile(user._id);

      // Auto-enable AI Coach consent if not set
      if (!user.aiCoachConsent?.enabled) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'aiCoachConsent.enabled': true,
            'aiCoachConsent.scopes.knowledgeBase': true,
            'aiCoachConsent.scopes.resume': true,
            'aiCoachConsent.scopes.journals': true,
            'aiCoachConsent.scopes.goals': true
          }
        });
        console.log(`[AI Coach] Auto-enabled consent for user ${user._id}`);
      }

      await EnhancedAICareerCoachService.refreshKnowledgeBase(user._id);
    } catch (e) {
      console.warn('Post-signup init failed:', e?.message || e);
    }

    // Issue auth tokens on signup to keep user logged in
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    // Fetch populated user (exclude sensitive fields)
    const populatedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(new ApiResponse(201, { user: populatedUser, accessToken, refreshToken }, "User registered successfully"));
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.status(500).json(new ApiError(500, error.message));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      logger.warn(`Invalid password for user: ${email}`);
      throw new ApiError(401, "Invalid user credentials");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    // Fetch the user again to populate the profile, excluding sensitive fields
    const populatedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    logger.info(`User ${email} logged in successfully`);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { user: populatedUser, accessToken, refreshToken },
          "User login successful"
        )
      );
  } catch (error) {
    logger.error(`Error in loginUser controller: ${error.message}`, error);
    // Ensure a proper error response is sent
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  // Invalidate tokens and disable AI Coach consent autonomously
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
      $set: { 'aiCoachConsent.enabled': false }
    },
    { new: true }
  );

  // Remove maxAge from cookieOptions for clearCookie
  const { maxAge, ...clearCookieOptions } = cookieOptions;

  return res
    .status(200)
    .clearCookie("accessToken", clearCookieOptions)
    .clearCookie("refreshToken", clearCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// Refresh access token using refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }

    // Verify the refresh token
    const jwt = await import('jsonwebtoken');
    let decodedToken;
    try {
      decodedToken = jwt.default.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Find the user
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Check if the refresh token matches
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been used");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

    logger.info(`Token refreshed for user: ${user.email}`);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetch successful"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "contactNumber",
    "address",
    "dateOfBirth",
    "gender",
    "nationality",
    "savedJobs",
    "profilePicture",
    "resume",
    "certifications",
    "languages",
    "interests",
    "projectExperience",
    "name",
    "location",
    "primaryRole",
    "yearsOfExperience",
    "bio",
    "skills",
    "education",
    "workExperience",
    "applications",
    "socialProfiles",
    "publicProfile",
    "jobPreferences",
    "doneOnboarding",
    "companyName",
    "companyDescription",
    "contactNumber",
    "address",
    "companySize",
    "companyLogo",
    "companySocialProfiles",
  ];
  const nonValidOperations = [];
  const isValidOperation = updates.every((update) => {
    if (allowedUpdates.includes(update)) {
      return true;
    } else {
      nonValidOperations.push(update);
      return false;
    }
  });

  if (!isValidOperation) {
    return res
      .status(400)
      .send({ error: `Invalid updates! ${nonValidOperations.toString()}` });
  }

  const userProfileUpdates = {};
  updates.forEach(
    (update) => (userProfileUpdates[`userProfile.${update}`] = req.body[update])
  );

  const user = await User.findByIdAndUpdate(req.user._id, userProfileUpdates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return res.status(404).send();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetch successful"));
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  const profilePictureLocalPath = req.file?.path;

  if (!profilePictureLocalPath) {
    throw new ApiError(400, "Profile Picture file is missing");
  }

  let user = await User.findById(req.user._id);

  let oldProfilePictureUrl = user?.userProfile?.profilePicture;

  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
  if (!profilePicture?.url) {
    throw new ApiError(400, "Error while uploading profile picture");
  }

  if (user.role === "jobSeeker") {
    user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "userProfile.profilePicture": profilePicture.url,
        },
      },
      { new: true }
    ).select("-password");
  } else if (user.role === "employer") {
    user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "userProfile.companyLogo": profilePicture.url,
        },
      },
      { new: true }
    ).select("-password");
  }

  if (
    oldProfilePictureUrl &&
    oldProfilePictureUrl !=
    "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"
  ) {
    try {
      const splitUrl = oldProfilePictureUrl.split("/");
      const filenameWithExtension = splitUrl[splitUrl.length - 1];
      const imageId = filenameWithExtension.split(".")[0];
      const res = await deleteFromCloudinary(imageId);
    } catch (error) {
      throw new ApiError(
        304,
        `Error deleting profile picture: ${error.message}`
      );
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User profile picture updated successfully")
    );
});

const addSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }

  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.skills.push(skill);
  user.markModified("userProfile.skills");
  await user.save();

  const updatedUser = await User.findById(req.user._id);
  console.log(updatedUser.userProfile.skills);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser.userProfile.skills,
        "Skills updated successfully"
      )
    );
});

const removeSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }
  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.skills = user.userProfile.skills.filter((s) => s !== skill);
  user.markModified("userProfile.skills");
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Skills removed successfully"));
});

const updateResume = asyncHandler(async (req, res) => {
  const { resume } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }
  if (!resume) {
    throw new ApiError(400, "Resume is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.resume = resume;
  user.markModified("userProfile.resume");
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Resume updated successfully"));
});

const userPublicProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select(
    "email _id userProfile.profilePicture userProfile.address userProfile.bio userProfile.location userProfile.yearsOfExperience userProfile.socialProfiles userProfile.workExperience userProfile.education userProfile.skills userProfile.name userProfile.resume"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetch successful"));
});

const analyzeDocumentHandler = asyncHandler(async (req, res) => {
  try {
    console.log('--- analyzeDocumentHandler called ---');
    // File upload via multer
    const file = req.file;
    const { jobDescription } = req.body;
    console.log('File:', file);
    console.log('Job Description:', jobDescription);
    if (!file || !jobDescription) {
      console.error('Missing file or job description');
      throw new ApiError(400, "File and job description are required");
    }
    // Read file buffer
    const fileBuffer = fs.readFileSync(file.path);
    const filename = file.originalname;
    console.log('Read file buffer, filename:', filename);
    // Analyze document
    const result = await analyzeDocument(fileBuffer, filename, jobDescription);
    console.log('AI analysis result:', result);
    // Optionally, delete temp file
    fs.unlinkSync(file.path);
    return res.status(200).json(new ApiResponse(200, result, "Document analyzed successfully"));
  } catch (err) {
    console.error('Error in analyzeDocumentHandler:', err);
    throw err;
  }
});

const getResumeImprovementSuggestionsHandler = asyncHandler(async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      throw new ApiError(400, "resumeText and jobDescription are required");
    }
    const suggestions = await getResumeImprovementSuggestions(resumeText, jobDescription);
    return res.status(200).json(new ApiResponse(200, { suggestions }, "Resume improvement suggestions generated successfully"));
  } catch (err) {
    console.error('Error in getResumeImprovementSuggestionsHandler:', err);
    throw err;
  }
});

// New: Analyze and reword document handler
const analyzeAndRewordHandler = asyncHandler(async (req, res) => {
  try {
    console.log('[AI ANALYSIS] analyzeAndRewordHandler called');
    const file = req.file;
    if (!file) {
      console.error('[AI ANALYSIS] No file uploaded');
      throw new ApiError(400, "File is required");
    }
    console.log(`[AI ANALYSIS] File uploaded: ${file.originalname}, path: ${file.path}`);
    const fileBuffer = fs.readFileSync(file.path);
    const filename = file.originalname;
    // 1. Extract text using document analysis
    const { docText } = await analyzeDocument(fileBuffer, filename, "");
    console.log('[AI ANALYSIS] Extracted text length:', docText.length);
    // 2. Reword using DeepSeek GenAI
    const rewordedText = await getRewordedResume(docText);
    console.log('[AI ANALYSIS] Reworded text length:', rewordedText.length);
    // 3. Return reworded text
    return res.status(200).json(new ApiResponse(200, { rewordedText }, "Document analyzed and reworded"));
  } catch (err) {
    console.error('[AI ANALYSIS] Error in analyzeAndRewordHandler:', err);
    throw err;
  }
});

// Enhanced: Analyze uploaded document using Enhanced AI Career Coach pipeline
const analyzeUploadedDocumentAndRecommend = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(400, "File is required");

  try {
    console.log(`[ENHANCED AI] Analyzing uploaded document: ${file.originalname}`);

    // Read buffer and extract text using document analysis pipeline
    const fileBuffer = fs.readFileSync(file.path);
    const filename = file.originalname;
    const { docText } = await analyzeDocument(fileBuffer, filename, "");

    // Clean up tmp file
    try { fs.unlinkSync(file.path); } catch (_) { }

    // Import Enhanced AI Career Coach service (default export is an instance)
    const aiCoach = (await import('../utils/ai/enhancedAICareerCoach.service.js')).default;

    // Get user ID for context
    const userId = req.user?._id?.toString() || 'anonymous';

    // Determine document type
    const documentType = filename.toLowerCase().includes('resume') ? 'resume' :
      filename.toLowerCase().includes('cv') ? 'cv' :
        filename.toLowerCase().includes('cover') ? 'cover-letter' : 'portfolio';

    // Use Enhanced AI Career Coach to analyze the document
    const analysisResult = await aiCoach.analyzeDocumentContent(docText, userId, {
      documentType: documentType,
      filename: filename
    });

    // Extract and add skills to user profile
    if (analysisResult.skills && analysisResult.skills.length > 0 && userId !== 'anonymous') {
      try {
        const user = await User.findById(userId);
        if (user && user.userProfile) {
          const existingSkills = new Set((user.userProfile.skills || []).map(s => s.toLowerCase()));
          let skillsAdded = 0;

          for (const skillData of analysisResult.skills) {
            const skillName = skillData.name || skillData;
            if (skillName && typeof skillName === 'string' && skillName.trim()) {
              const normalizedSkill = skillName.trim();
              if (!existingSkills.has(normalizedSkill.toLowerCase())) {
                if (!user.userProfile.skills) user.userProfile.skills = [];
                user.userProfile.skills.push(normalizedSkill);
                existingSkills.add(normalizedSkill.toLowerCase());
                skillsAdded++;
              }
            }
          }

          if (skillsAdded > 0) {
            user.markModified('userProfile.skills');
            await user.save();
            console.log(`[ENHANCED AI] Added ${skillsAdded} new skills to user profile`);
          }
        }
      } catch (skillError) {
        console.warn('[ENHANCED AI] Failed to add skills to profile:', skillError?.message || skillError);
      }
    }

    // Generate comprehensive recommendations
    const recommendationsResult = await aiCoach.generateDocumentRecommendations(docText, userId, {
      documentType: documentType,
      analysisResult: analysisResult,
      jobDescription: req.body.jobDescription || '' // Pass job description if provided
    });
    const recommendations = Array.isArray(recommendationsResult)
      ? recommendationsResult
      : (recommendationsResult?.recommendations || []);

    // Persist updates to the Knowledge Base (both MCP file-based and MongoDB)
    try {
      // 1. Update MCP file-based KB
      const { default: mcpKB } = await import('../services/mcpKnowledgeBaseService.js');
      await mcpKB.updateKnowledgeBase(userId, {
        recentJournalEntries: [
          { content: `Uploaded ${filename}. Key findings: ${analysisResult?.summary || 'N/A'}`, timestamp: new Date().toISOString() }
        ],
        researchData: (recommendations || []).map((rec) => ({
          title: rec.title || 'Recommendation',
          summary: rec.rationale || '',
          impact: 'positive',
          relevance: 'high',
          date: new Date().toISOString(),
          actionItems: rec.actions || []
        }))
      }, 'document_upload');

      // 2. Update MongoDB KnowledgeBase via Enhanced AI Coach
      await aiCoach.refreshKnowledgeBase(userId);
      console.log(`[KB] Successfully updated both MCP and MongoDB knowledge bases for user ${userId}`);

      // 3. Store upload summary in KB (processed insights section)
      if (userId !== 'anonymous') {
        try {
          const { KnowledgeBase } = await import('../models/aiCareerCoach.model.js');
          const vectorDB = await aiCoach._getVectorDB();

          // Save upload summary as processed insight
          if (analysisResult?.summary) {
            const summaryText = typeof analysisResult.summary === 'string'
              ? analysisResult.summary
              : JSON.stringify(analysisResult.summary);
            const summaryTitle = `Upload Analysis: ${filename}`;
            // Format skills properly - handle both string arrays and object arrays
            const skillsText = analysisResult.skills && analysisResult.skills.length > 0
              ? analysisResult.skills.map(s => typeof s === 'string' ? s : (s?.name || s?.skill || s?.keyword || JSON.stringify(s))).join(', ')
              : 'N/A';
            const summaryContent = `Document: ${filename} (${documentType})\n\nSummary: ${summaryText}\n\nKey Themes: ${analysisResult.summary?.key_themes?.join(', ') || 'N/A'}\nSkills: ${skillsText}`;
            const summaryVector = await vectorDB.generateEmbedding(summaryContent);
            const summaryContentId = `kb_${userId}_upload_summary_${Buffer.from(filename).toString('base64').slice(0, 24)}`;

            await KnowledgeBase.updateOne(
              { content_id: summaryContentId },
              {
                $set: {
                  content_vector: summaryVector,
                  source_url: `internal://document/${filename}`,
                  content_type: 'article',
                  title: summaryTitle,
                  content: summaryContent,
                  relevance_tags: [documentType, 'upload', 'processed_insight', ...(analysisResult.summary?.key_themes || [])],
                  category: 'industry', // Using 'industry' category for processed insights
                  last_updated: new Date()
                }
              },
              { upsert: true }
            );
            console.log(`[KB] Stored upload summary in Knowledge Base (processed insights)`);
          }
        } catch (kbSummaryErr) {
          console.warn('[KB] Failed to store upload summary in KB:', kbSummaryErr?.message || kbSummaryErr);
        }
      }

      // 4. Store document feedback in KB (Document Feedback section)
      if (userId !== 'anonymous') {
        try {
          const { KnowledgeBase } = await import('../models/aiCareerCoach.model.js');
          const vectorDB = await aiCoach._getVectorDB();

          // Store ALL recommendations together as a single KB item per document (FIXED)
          const contentId = `kb_${userId}_doc_feedback_${Buffer.from(filename).toString('base64').slice(0, 24)}`;

          // Create structured content with all recommendations
          const structuredContent = {
            recommendations: recommendations || [], // Store ALL recommendations together
            overall_assessment: recommendationsResult.overall_assessment || null,
            document_type: documentType,
            analyzed_at: new Date().toISOString()
          };

          // Create text summary for embedding
          const feedbackSummary = `Document Feedback for ${documentType}:\n\n` +
            `Overall Assessment: ${recommendationsResult.overall_assessment?.summary || 'N/A'}\n\n` +
            `Recommendations (${(recommendations || []).length}):\n` +
            (recommendations || []).map((rec, idx) =>
              `${idx + 1}. ${rec.title} (${rec.category}, ${rec.priority} priority)`
            ).join('\n');

          const feedbackVector = await vectorDB.generateEmbedding(feedbackSummary);

          // Map primary category (use most common or highest priority)
          const categoryMap = {
            'keyword_gap': 'skills',
            'content_enhancement': 'industry',
            'formatting': 'interview',
            'career_gap': 'industry'
          };
          const primaryCategory = (recommendations || []).find(r => r.priority === 'high')?.category ||
            (recommendations || [])[0]?.category || 'general';
          const kbCategory = categoryMap[primaryCategory] || 'interview';

          await KnowledgeBase.updateOne(
            { content_id: contentId },
            {
              $set: {
                content_vector: feedbackVector,
                source_url: `internal://document/${filename}`,
                content_type: 'article',
                title: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Feedback - ${(recommendations || []).length} Recommendations`,
                content: JSON.stringify(structuredContent), // Store as structured JSON
                relevance_tags: [
                  documentType,
                  'document_feedback',
                  ...(recommendations || []).map(r => r.category).filter((v, i, a) => a.indexOf(v) === i), // Unique categories
                  ...(recommendations || []).flatMap(r => r.missing_keywords || []).slice(0, 10) // Missing keywords
                ],
                category: kbCategory,
                last_updated: new Date(),
                // Store metadata for easy access
                'metadata.feedback_status': 'new',
                'metadata.document_id': filename,
                'metadata.document_type': documentType,
                'metadata.match_score': recommendationsResult.overall_assessment?.keyword_match_score ||
                  recommendationsResult.overall_assessment?.ats_compatibility_score || null,
                'metadata.overall_assessment': recommendationsResult.overall_assessment || null,
                url: `internal://document/${filename}` // Store document link
              }
            },
            { upsert: true }
          );

          console.log(`[KB] Stored ${(recommendations || []).length} recommendations as single feedback item in Knowledge Base`);
        } catch (kbFeedbackErr) {
          console.warn('[KB] Failed to store document feedback in KB:', kbFeedbackErr?.message || kbFeedbackErr);
        }
      }
    } catch (kbErr) {
      console.warn('[KB] Failed to persist analysis to knowledge base:', kbErr?.message || kbErr);
    }

    console.log(`[ENHANCED AI] Generated ${recommendations.length} recommendations for ${filename}`);

    return res.status(200).json(new ApiResponse(200, {
      textPreview: docText.slice(0, 5000),
      recommendations: recommendations,
      analysisResult: analysisResult,
      documentType: documentType,
      filename: filename
    }, "Document analyzed using Enhanced AI Career Coach pipeline"));

  } catch (error) {
    console.error('[ENHANCED AI] Error in document analysis:', error);

    // Fallback to simple analysis if enhanced service fails
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const filename = file.originalname;
      const { docText } = await analyzeDocument(fileBuffer, filename, "");

      // Simple fallback recommendations
      const fallbackRecommendations = [
        {
          title: "Document Review",
          rationale: "Your document has been uploaded successfully. Consider reviewing the content for clarity and completeness.",
          actions: ["Review formatting", "Check for typos", "Ensure contact information is current"]
        }
      ];

      return res.status(200).json(new ApiResponse(200, {
        textPreview: docText.slice(0, 5000),
        recommendations: fallbackRecommendations,
        analysisResult: { status: 'fallback' },
        documentType: 'document',
        filename: filename
      }, "Document uploaded with basic analysis"));

    } catch (fallbackError) {
      console.error('[ENHANCED AI] Fallback also failed:', fallbackError);
      throw new ApiError(500, "Document analysis failed");
    }
  }
});

const uploadResumeFile = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Resume file is required");
  }
  // You can add logic to process/store the file as needed
  return res.status(200).json(new ApiResponse(200, { filename: file.originalname, path: file.path }, "Resume uploaded successfully"));
});

// Upload a portfolio file (CV, resume, portfolio, etc.)
const uploadPortfolioFile = asyncHandler(async (req, res) => {
  try {
    console.log("[UPLOAD] Route hit");
    const file = req.file;
    const { label, type } = req.body;
    const userId = req.user._id;

    if (!file) {
      console.error("[UPLOAD] No file received");
      throw new ApiError(400, "File is required");
    }

    // ========== SECURITY VALIDATIONS ==========

    // 1. Validate file size
    if (!validateFileSize(file.size)) {
      // Clean up temp file
      try { fs.unlinkSync(file.path); } catch (_) { }
      throw new ApiError(400, "File size exceeds maximum limit (10MB)");
    }

    // 2. Sanitize filename to prevent path traversal
    const sanitizedFilename = sanitizeFilename(file.originalname);

    // 3. Validate file extension matches MIME type
    if (!validateFileExtension(sanitizedFilename, file.mimetype)) {
      try { fs.unlinkSync(file.path); } catch (_) { }
      throw new ApiError(400, "File extension does not match file type");
    }

    // 4. Validate file content (magic bytes)
    const isValidContent = await validateFileContent(file.path, file.mimetype);
    if (!isValidContent) {
      try { fs.unlinkSync(file.path); } catch (_) { }
      throw new ApiError(400, "File content validation failed. File may be corrupted or not match its type.");
    }

    // 5. Validate document type
    const documentType = (type || 'portfolio').trim().toLowerCase();
    const allowedTypes = ['resume', 'cover-letter', 'portfolio'];
    if (!allowedTypes.includes(documentType)) {
      try { fs.unlinkSync(file.path); } catch (_) { }
      throw new ApiError(400, `Invalid document type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Move file from temp to permanent uploads directory
    const uploadsDir = './public/uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("[UPLOAD] Created uploads directory");
    }

    // Use sanitized filename with UUID prefix
    const uniqueName = uuidv4() + '-' + sanitizedFilename;
    const destPath = path.join(uploadsDir, uniqueName);

    // Additional path security check
    const resolvedPath = path.resolve(destPath);
    const resolvedDir = path.resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      try { fs.unlinkSync(file.path); } catch (_) { }
      throw new ApiError(400, "Invalid file path");
    }

    console.log("[UPLOAD] Moving file to:", destPath);
    fs.renameSync(file.path, destPath);

    // Save metadata in user profile
    const user = await User.findById(userId);
    if (!user) {
      // Clean up file if user not found
      try { fs.unlinkSync(destPath); } catch (_) { }
      throw new ApiError(404, "User not found");
    }

    // Sanitize label input
    const sanitizedLabel = label && typeof label === 'string'
      ? label.trim().substring(0, 100).replace(/[<>]/g, '')
      : '';

    const uploadEntry = {
      filename: sanitizedFilename, // Use sanitized filename
      type: documentType,
      url: `/uploads/${uniqueName}`,
      uploadedAt: new Date(),
      label: sanitizedLabel,
      size: file.size,
      status: 'processing'
    };
    if (!user.userProfile.uploads) user.userProfile.uploads = [];
    user.userProfile.uploads.push(uploadEntry);
    user.markModified('userProfile.uploads');
    console.log("[UPLOAD] Saving upload entry to DB");
    await user.save();
    console.log("[UPLOAD] Upload entry saved successfully");

    // ========== TRIGGER ANALYSIS PIPELINE ==========
    // Process document in background (don't block response)
    // Use process.nextTick for better error handling than setImmediate
    process.nextTick(async () => {
      let retryCount = 0;
      const MAX_RETRIES = 2;

      const processAnalysis = async () => {
        try {
          console.log(`[UPLOAD] Starting analysis pipeline for ${sanitizedFilename}`);

          // Verify file still exists
          if (!fs.existsSync(destPath)) {
            console.error(`[UPLOAD] File not found at ${destPath}, analysis aborted`);
            return;
          }

          // 1. Extract text from document
          const fileBuffer = fs.readFileSync(destPath);
          const { analyzeDocument } = await import('../utils/ai/resumeAnalysis.service.js');
          const { docText } = await analyzeDocument(fileBuffer, sanitizedFilename, "");

          if (!docText || docText.trim().length === 0) {
            console.warn("[UPLOAD] No text extracted from document, marking as completed without analysis");
            // Update status to completed even without analysis
            const user = await User.findById(userId);
            if (user && user.userProfile.uploads) {
              const uploadIndex = user.userProfile.uploads.findIndex(
                u => u.url === `/uploads/${uniqueName}`
              );
              if (uploadIndex !== -1) {
                user.userProfile.uploads[uploadIndex].status = 'completed';
                user.markModified('userProfile.uploads');
                await user.save();
              }
            }
            return;
          }

          // 2. Import Enhanced AI Career Coach service (default export is an instance)
          const aiCoach = (await import('../utils/ai/enhancedAICareerCoach.service.js')).default;

          const documentType = (type || 'portfolio').trim().toLowerCase();

          // 3. Analyze document content
          console.log(`[UPLOAD] Analyzing document content...`);
          const analysisResult = await aiCoach.analyzeDocumentContent(docText, userId.toString(), {
            documentType: documentType,
            filename: sanitizedFilename
          });

          // 4. Extract and add skills to user profile (with validation and limits)
          if (analysisResult.skills && analysisResult.skills.length > 0) {
            console.log(`[UPLOAD] Extracting ${analysisResult.skills.length} skills from document`);
            const user = await User.findById(userId);
            if (user && user.userProfile) {
              const existingSkills = new Set((user.userProfile.skills || []).map(s => s.toLowerCase()));
              let skillsAdded = 0;
              const MAX_SKILLS_PER_UPLOAD = 50; // Limit skills per upload
              const MAX_TOTAL_SKILLS = 200; // Limit total skills per user

              let newSkills = [];
              for (const skillData of analysisResult.skills) {
                // Stop if we've added too many skills
                if (skillsAdded >= MAX_SKILLS_PER_UPLOAD) {
                  console.warn(`[UPLOAD] Reached max skills per upload limit (${MAX_SKILLS_PER_UPLOAD})`);
                  break;
                }

                // Check total skills limit
                if ((user.userProfile.skills || []).length >= MAX_TOTAL_SKILLS) {
                  console.warn(`[UPLOAD] User has reached max total skills limit (${MAX_TOTAL_SKILLS})`);
                  break;
                }

                const skillName = skillData.name || skillData;
                if (skillName && typeof skillName === 'string') {
                  // Normalize and validate skill
                  const normalizedSkill = normalizeSkill(skillName);

                  if (normalizedSkill &&
                    !existingSkills.has(normalizedSkill.toLowerCase()) &&
                    validateSkillName(normalizedSkill)) {
                    if (!user.userProfile.skills) user.userProfile.skills = [];

                    // Add to user profile but also track locally for logging
                    user.userProfile.skills.push(normalizedSkill);
                    existingSkills.add(normalizedSkill.toLowerCase());
                    newSkills.push(normalizedSkill);
                    skillsAdded++;
                  } else {
                    console.warn(`[UPLOAD] Skipped invalid or duplicate skill: ${skillName}`);
                  }
                }
              }

              if (skillsAdded > 0) {
                // Explicitly mark modified regardless of array method used
                user.markModified('userProfile.skills');
                // Save user with retry on version error
                try {
                  await user.save();
                  console.log(`[UPLOAD] Added ${skillsAdded} new validated skills to user profile:`, newSkills);
                } catch (saveError) {
                  console.error('[UPLOAD] Failed to save user skills:', saveError);
                  // Retry once
                  const freshUser = await User.findById(userId);
                  if (freshUser) {
                    freshUser.userProfile.skills = [...new Set([...(freshUser.userProfile.skills || []), ...newSkills])];
                    freshUser.markModified('userProfile.skills');
                    await freshUser.save();
                  }
                }
              }
            }
          } else {
            console.warn('[UPLOAD] No skills returned from analysis result');
          }

          // 5. Generate recommendations
          console.log(`[UPLOAD] Generating recommendations...`);
          const recommendationsResult = await aiCoach.generateDocumentRecommendations(docText, userId.toString(), {
            documentType: documentType,
            analysisResult: analysisResult,
            jobDescription: '' // Can be enhanced to accept job description in future
          });
          const recommendations = Array.isArray(recommendationsResult)
            ? recommendationsResult
            : (recommendationsResult?.recommendations || []);

          // 6. Update upload entry with analysis results
          const user = await User.findById(userId);
          if (user && user.userProfile.uploads) {
            const uploadIndex = user.userProfile.uploads.findIndex(
              u => u.url === `/uploads/${uniqueName}`
            );
            if (uploadIndex !== -1) {
              user.userProfile.uploads[uploadIndex].status = 'completed';
              user.userProfile.uploads[uploadIndex].analysis = {
                extracted: {
                  SUMMARY: analysisResult.summary || {},
                  SKILLS_MENTIONED: analysisResult.skills || [],
                  recommendations: recommendations || []
                },
                content_vector: analysisResult.content_vector || null
              };
              user.markModified('userProfile.uploads');
              await user.save();
              console.log(`[UPLOAD] Updated upload entry with analysis results`);
            }
          }

          // 7. Persist to Knowledge Base (both MCP file-based and MongoDB)
          try {
            // Update MCP file-based KB
            const { default: mcpKB } = await import('../services/mcpKnowledgeBaseService.js');
            await mcpKB.updateKnowledgeBase(userId.toString(), {
              recentJournalEntries: [
                {
                  content: `Uploaded ${file.originalname} (${documentType}). Key findings: ${analysisResult.summary?.key_themes?.join(', ') || 'N/A'}`,
                  timestamp: new Date().toISOString()
                }
              ],
              researchData: (recommendations || []).map((rec) => ({
                title: rec.title || 'Recommendation',
                summary: rec.rationale || '',
                impact: 'positive',
                relevance: 'high',
                date: new Date().toISOString(),
                actionItems: rec.actions || []
              }))
            }, 'document_upload');

            // Update MongoDB KnowledgeBase via Enhanced AI Coach
            await aiCoach.refreshKnowledgeBase(userId.toString());
            console.log(`[UPLOAD] Successfully updated both MCP and MongoDB knowledge bases`);
          } catch (kbErr) {
            console.warn('[UPLOAD] Failed to persist analysis to knowledge base:', kbErr?.message || kbErr);
          }

          // 8. Store upload summary in KB (processed insights section)
          try {
            const { KnowledgeBase } = await import('../models/aiCareerCoach.model.js');
            const vectorDB = await aiCoach._getVectorDB();

            // Save upload summary as processed insight
            if (analysisResult?.summary) {
              const summaryText = typeof analysisResult.summary === 'string'
                ? analysisResult.summary
                : JSON.stringify(analysisResult.summary);
              const summaryTitle = `Upload Analysis: ${file.originalname}`;
              // Format skills properly - handle both string arrays and object arrays
              const skillsText = analysisResult.skills && analysisResult.skills.length > 0
                ? analysisResult.skills.map(s => typeof s === 'string' ? s : (s?.name || s?.skill || s?.keyword || JSON.stringify(s))).join(', ')
                : 'N/A';
              const summaryContent = `Document: ${file.originalname} (${documentType})\n\nSummary: ${summaryText}\n\nKey Themes: ${analysisResult.summary?.key_themes?.join(', ') || 'N/A'}\nSkills: ${skillsText}`;
              const summaryVector = await vectorDB.generateEmbedding(summaryContent);
              const summaryContentId = `kb_${userId}_upload_summary_${Buffer.from(uniqueName).toString('base64').slice(0, 24)}`;

              await KnowledgeBase.updateOne(
                { content_id: summaryContentId },
                {
                  $set: {
                    content_vector: summaryVector,
                    source_url: `internal://document/${uniqueName}`,
                    content_type: 'article',
                    title: summaryTitle,
                    content: summaryContent,
                    relevance_tags: [documentType, 'upload', 'processed_insight', ...(analysisResult.summary?.key_themes || [])],
                    category: 'industry', // Using 'industry' category for processed insights
                    last_updated: new Date()
                  }
                },
                { upsert: true }
              );
              console.log(`[UPLOAD] Stored upload summary in Knowledge Base (processed insights)`);
            }
          } catch (kbSummaryErr) {
            console.warn('[UPLOAD] Failed to store upload summary in KB:', kbSummaryErr?.message || kbSummaryErr);
          }

          // 9. Store document feedback in KB (Document Feedback section)
          try {
            const { KnowledgeBase } = await import('../models/aiCareerCoach.model.js');
            const vectorDB = await aiCoach._getVectorDB();

            // Store ALL recommendations together as a single KB item per document (FIXED)
            const contentId = `kb_${userId}_doc_feedback_${Buffer.from(uniqueName).toString('base64').slice(0, 24)}`;

            // Create structured content with all recommendations
            const structuredContent = {
              recommendations: recommendations || [], // Store ALL recommendations together
              overall_assessment: recommendationsResult?.overall_assessment || null,
              document_type: documentType,
              analyzed_at: new Date().toISOString()
            };

            // Create text summary for embedding
            const feedbackSummary = `Document Feedback for ${documentType}:\n\n` +
              `Overall Assessment: ${recommendationsResult?.overall_assessment?.summary || 'N/A'}\n\n` +
              `Recommendations (${(recommendations || []).length}):\n` +
              (recommendations || []).map((rec, idx) =>
                `${idx + 1}. ${rec.title} (${rec.category}, ${rec.priority} priority)`
              ).join('\n');

            const feedbackVector = await vectorDB.generateEmbedding(feedbackSummary);

            // Map primary category (use most common or highest priority)
            const categoryMap = {
              'keyword_gap': 'skills',
              'content_enhancement': 'industry',
              'formatting': 'interview',
              'career_gap': 'industry'
            };
            const primaryCategory = (recommendations || []).find(r => r.priority === 'high')?.category ||
              (recommendations || [])[0]?.category || 'general';
            const kbCategory = categoryMap[primaryCategory] || 'interview';

            await KnowledgeBase.updateOne(
              { content_id: contentId },
              {
                $set: {
                  content_vector: feedbackVector,
                  source_url: `internal://document/${uniqueName}`,
                  content_type: 'article',
                  title: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Feedback - ${(recommendations || []).length} Recommendations`,
                  content: JSON.stringify(structuredContent), // Store as structured JSON
                  relevance_tags: [
                    documentType,
                    'document_feedback',
                    ...(recommendations || []).map(r => r.category).filter((v, i, a) => a.indexOf(v) === i), // Unique categories
                    ...(recommendations || []).flatMap(r => r.missing_keywords || []).slice(0, 10) // Missing keywords
                  ],
                  category: kbCategory,
                  last_updated: new Date(),
                  // Store metadata for easy access
                  'metadata.feedback_status': 'new',
                  'metadata.document_id': uniqueName,
                  'metadata.document_type': documentType,
                  'metadata.match_score': recommendationsResult?.overall_assessment?.keyword_match_score ||
                    recommendationsResult?.overall_assessment?.ats_compatibility_score || null,
                  'metadata.overall_assessment': recommendationsResult?.overall_assessment || null,
                  url: `internal://document/${uniqueName}` // Store document link
                }
              },
              { upsert: true }
            );

            console.log(`[UPLOAD] Stored ${(recommendations || []).length} recommendations as single feedback item in Knowledge Base`);
          } catch (kbFeedbackErr) {
            console.warn('[UPLOAD] Failed to store document feedback in KB:', kbFeedbackErr?.message || kbFeedbackErr);
          }

          console.log(`[UPLOAD] Analysis pipeline completed successfully for ${sanitizedFilename}`);
        } catch (analysisError) {
          console.error('[UPLOAD] Error in analysis pipeline:', analysisError);

          // Retry logic for transient errors
          if (retryCount < MAX_RETRIES &&
            (analysisError.message?.includes('timeout') ||
              analysisError.message?.includes('ECONNRESET') ||
              analysisError.code === 'ETIMEDOUT')) {
            retryCount++;
            console.log(`[UPLOAD] Retrying analysis (attempt ${retryCount}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
            return processAnalysis();
          }

          // Update upload status to error after max retries
          try {
            const user = await User.findById(userId);
            if (user && user.userProfile.uploads) {
              const uploadIndex = user.userProfile.uploads.findIndex(
                u => u.url === `/uploads/${uniqueName}`
              );
              if (uploadIndex !== -1) {
                user.userProfile.uploads[uploadIndex].status = 'error';
                user.userProfile.uploads[uploadIndex].error = analysisError.message || 'Analysis failed';
                user.markModified('userProfile.uploads');
                await user.save();
              }
            }
          } catch (updateErr) {
            console.error('[UPLOAD] Failed to update error status:', updateErr);
          }
        }
      };

      // Start processing
      processAnalysis().catch(err => {
        console.error('[UPLOAD] Fatal error in background processing:', err);
      });
    });

    // Return immediately with upload entry
    return res.status(201).json(new ApiResponse(201, uploadEntry, "File uploaded successfully. Analysis in progress."));
  } catch (err) {
    console.error("[UPLOAD] Error during upload:", err);
    throw err;
  }
});

// List all uploads for the authenticated user
const listPortfolioUploads = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const uploads = user.userProfile.uploads || [];
  return res.status(200).json(new ApiResponse(200, uploads, "Uploads fetched successfully"));
});

// Delete an upload by uploadId
const deletePortfolioUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const user = await User.findById(req.user._id);
  const uploads = user.userProfile.uploads || [];
  const uploadIndex = uploads.findIndex(u => String(u._id) === String(uploadId));
  if (uploadIndex === -1) {
    throw new ApiError(404, "Upload not found");
  }
  const [removed] = uploads.splice(uploadIndex, 1);
  // Delete file from disk
  const filePath = `./public${removed.url}`;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  user.userProfile.uploads = uploads;
  user.markModified('userProfile.uploads');
  await user.save();
  return res.status(200).json(new ApiResponse(200, {}, "Upload deleted successfully"));
});

const updateStreak = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();
  const lastUpdate = user.dailyStreak?.lastUpdate ? new Date(user.dailyStreak.lastUpdate) : null;

  let streakUpdated = false;
  let message = "Streak maintained";

  if (!lastUpdate) {
    // First time
    user.dailyStreak = {
      count: 1,
      lastUpdate: now
    };
    streakUpdated = true;
    message = "First streak day!";
  } else {
    // Check if it's the same day
    const isSameDay =
      now.getDate() === lastUpdate.getDate() &&
      now.getMonth() === lastUpdate.getMonth() &&
      now.getFullYear() === lastUpdate.getFullYear();

    if (!isSameDay) {
      // Check if it's consecutive (yesterday)
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const isConsecutive =
        yesterday.getDate() === lastUpdate.getDate() &&
        yesterday.getMonth() === lastUpdate.getMonth() &&
        yesterday.getFullYear() === lastUpdate.getFullYear();

      if (isConsecutive) {
        user.dailyStreak.count += 1;
        user.dailyStreak.lastUpdate = now;
        streakUpdated = true;
        message = "Streak increased!";
      } else {
        // Reset streak if missed a day
        // But only if the last update was effectively before yesterday
        if (now > lastUpdate) { // Simple check, could be more robust
          user.dailyStreak.count = 1;
          user.dailyStreak.lastUpdate = now;
          streakUpdated = true;
          message = "Streak reset";
        }
      }
    } else {
      // already updated today
      message = "Streak already updated for today";
    }
  }

  if (streakUpdated) {
    await user.save({ validateBeforeSave: false });
  }

  return res.status(200).json(
    new ApiResponse(200, { streak: user.dailyStreak }, message)
  );
});

export {
  ping,
  authPing,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  addSkill,
  removeSkill,
  updateResume,
  userPublicProfile,
  analyzeDocumentHandler,
  getResumeImprovementSuggestionsHandler,
  analyzeAndRewordHandler,
  analyzeUploadedDocumentAndRecommend,
  uploadResumeFile,
  uploadPortfolioFile,
  listPortfolioUploads,
  deletePortfolioUpload,
  updateStreak,
};

// Delete account and associated auth tokens
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete from Clerk if applicable
  if (user.clerkId) {
    try {
      await clerkClient.users.deleteUser(user.clerkId);
      console.log(`[Account] Deleted user ${user.clerkId} from Clerk`);
    } catch (error) {
      console.warn(`[Account] Failed to delete user from Clerk: ${error.message}`);
      // Proceed to delete from MongoDB anyway, as the user requested deletion
    }
  }

  await User.deleteOne({ _id: userId });

  // Remove maxAge from cookieOptions for clearCookie
  const { maxAge, ...clearCookieOptions } = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", clearCookieOptions)
    .clearCookie("refreshToken", clearCookieOptions)
    .json(new ApiResponse(200, {}, "Account deleted successfully"));
});

export { deleteAccount };
