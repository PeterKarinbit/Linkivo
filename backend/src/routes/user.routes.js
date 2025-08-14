import { Router } from "express";
import {
  addSkill,
  authPing,
  getUserProfile,
  loginUser,
  logoutUser,
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
  uploadResumeFile,
  uploadPortfolioFile,
  listPortfolioUploads,
  deletePortfolioUpload,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { SaveJob } from "../controllers/job.controllers.js";

const router = Router();
router.route("/ping").get(ping);
router.route("/auth-ping").get(verifyJWT, authPing);
router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logoutUser);
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
router.post("/resumes/upload-file", upload.single("file"), uploadResumeFile);
router.post("/profile/uploads", verifyJWT, upload.single("file"), uploadPortfolioFile);
router.get("/profile/uploads", verifyJWT, listPortfolioUploads);
router.delete("/profile/uploads/:uploadId", verifyJWT, deletePortfolioUpload);

export default router;
