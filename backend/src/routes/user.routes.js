import { Router } from "express";
import {
  addSkill,
  authPing,
  getUserProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  ping,
  registerUser,
  removeSkill,
  updateProfilePicture,
  updateResume,
  updateUserProfile,
  userPublicProfile,
  analyzeDocumentHandler,
  getResumeImprovementSuggestionsHandler,
  analyzeAndRewordHandler,
  analyzeUploadedDocumentAndRecommend,
  uploadResumeFile,
  uploadPortfolioFile,
  listPortfolioUploads,
  deletePortfolioUpload,
  deleteAccount,
  updateStreak,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadRateLimit, analysisRateLimit } from "../middlewares/uploadRateLimit.middleware.js";
import { SaveJob } from "../controllers/job.controllers.js";

const router = Router();
router.route("/ping").get(ping);
router.route("/auth-ping").get(verifyJWT, authPing);
router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/profile/jobseeker").patch(verifyJWT, updateUserProfile);
router
  .route("/profile-picture")
  .post(verifyJWT, upload.single("profilePicture"), updateProfilePicture);
router.route("/add-skill").post(verifyJWT, addSkill);
router.route("/remove-skill").post(verifyJWT, removeSkill);
router.route("/resume").post(verifyJWT, updateResume);
router.route("/saved-jobs").get(verifyJWT, SaveJob);
router.route("/public-profile/:id?").get(userPublicProfile);
router.route("/analyze-document").post(verifyJWT, upload.single("document"), analyzeDocumentHandler);
router.route("/resume-improvement-suggestions").post(verifyJWT, getResumeImprovementSuggestionsHandler);
router.post("/analyze-and-reword", verifyJWT, upload.single("document"), analyzeAndRewordHandler);
router.post("/uploads/analyze", verifyJWT, analysisRateLimit, upload.single("file"), analyzeUploadedDocumentAndRecommend);
router.post("/resumes/upload-file", upload.single("file"), uploadResumeFile);
router.post("/profile/uploads", verifyJWT, uploadRateLimit, upload.single("file"), uploadPortfolioFile);
router.get("/profile/uploads", verifyJWT, listPortfolioUploads);
router.delete("/profile/uploads/:uploadId", verifyJWT, deletePortfolioUpload);

// Serve uploaded files
router.get("/uploads/:filename", verifyJWT, asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const userId = req.user._id;
  const path = (await import('path')).default;
  const fs = (await import('fs')).default;
  
  // Security: Validate filename
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid filename'
    });
  }
  
  // Check if user has this file in their uploads
  const User = (await import('../models/user.model.js')).default;
  const user = await User.findById(userId);
  
  if (!user || !user.userProfile?.uploads) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
  
  // Find the upload entry
  const uploadEntry = user.userProfile.uploads.find(
    upload => upload.url === `/uploads/${filename}` || upload.filename === filename
  );
  
  if (!uploadEntry) {
    return res.status(404).json({
      success: false,
      message: 'File not found in your uploads'
    });
  }
  
  // Construct file path
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  }
  
  // Determine content type
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'md': 'text/markdown'
  };
  
  const ext = path.extname(filename).toLowerCase().slice(1);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Set headers for file download
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${uploadEntry.filename || filename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('[UPLOAD] Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error reading file'
      });
    }
  });
}));
router.delete("/account", verifyJWT, deleteAccount);

// Streak update
router.post("/streak", verifyJWT, updateStreak);

export default router;
