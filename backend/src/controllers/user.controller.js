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
import { getRewordedResume } from "../utils/ai/deepseek.service.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import { logger } from "../utils/logger.js";
// import { PRODUCTION_URL } from "../constants.js";

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
    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      role,
      userProfile,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshtoken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, {}, "User registered successfully"));
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
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  // Remove maxAge from cookieOptions for clearCookie
  const { maxAge, ...clearCookieOptions } = cookieOptions;

  return res
    .status(200)
    .clearCookie("accessToken", clearCookieOptions)
    .clearCookie("refreshToken", clearCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
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
    // 1. Extract text (Gemini)
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
    console.log("[UPLOAD] Received file:", file);
    console.log("[UPLOAD] Received body:", req.body);
    if (!file) {
      console.error("[UPLOAD] No file received");
      throw new ApiError(400, "File is required");
    }
    // Move file from temp to permanent uploads directory
    const uploadsDir = './public/uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("[UPLOAD] Created uploads directory");
    }
    const uniqueName = uuidv4() + '-' + file.originalname;
    const destPath = `${uploadsDir}/${uniqueName}`;
    console.log("[UPLOAD] Moving file to:", destPath);
    fs.renameSync(file.path, destPath);
    // Save metadata in user profile
    const user = await User.findById(req.user._id);
    const uploadEntry = {
      filename: file.originalname,
      type: (type || 'portfolio').trim().toLowerCase(),
      url: `/uploads/${uniqueName}`,
      uploadedAt: new Date(),
      label: label || '',
      size: file.size,
    };
    if (!user.userProfile.uploads) user.userProfile.uploads = [];
    user.userProfile.uploads.push(uploadEntry);
    user.markModified('userProfile.uploads');
    console.log("[UPLOAD] Saving upload entry to DB");
    await user.save();
    console.log("[UPLOAD] Upload entry saved successfully");
    return res.status(201).json(new ApiResponse(201, uploadEntry, "File uploaded and saved successfully"));
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

export {
  ping,
  authPing,
  registerUser,
  loginUser,
  logoutUser,
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
  uploadResumeFile,
  uploadPortfolioFile,
  listPortfolioUploads,
  deletePortfolioUpload,
};
