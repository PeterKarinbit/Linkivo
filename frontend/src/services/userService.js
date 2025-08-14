import { apiCall } from "./apiBase";

export const userService = {
  login,
  signup,
  logout,
  getCurrentUser,
  updateProfilePicture,
  updateUserProfile,
  addSkill,
  removeSkill,
  updateResume,
  saveJob,
  applyForJob,
  removeSavedJob,
  getPublicProfile,
  analyzeDocument,
  recommendJobs,
  getAllJobs,
  getResumeImprovementSuggestions,
  uploadPortfolioFile,
  listPortfolioUploads,
  deletePortfolioUpload,
};

async function login(userData) {
  return apiCall("post", "/users/login", userData);
}

async function signup(userData) {
  return apiCall("post", "/users/signup", userData);
}

async function updateProfilePicture(file) {
  const formPayload = new FormData();
  formPayload.append("profilePicture", file);
  return apiCall("post", "/users/profile-picture", formPayload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

async function logout() {
  return apiCall("get", "/users/logout");
}

async function getCurrentUser() {
  return await apiCall("get", "/users/profile");
}

async function updateUserProfile(data) {
  try {
    const response = await apiCall("patch", "/users/profile/jobseeker", data);
    if (!response) {
      throw new Error("No response from server");
    }
    return response;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
}

async function addSkill(skill) {
  return apiCall("post", "/users/add-skill", { skill });
}

async function removeSkill(skill) {
  return apiCall("delete", "/users/remove-skill", { skill });
}

async function updateResume(resume) {
  return apiCall("post", "/users/resume", { resume });
}

async function saveJob(id) {
  return apiCall("post", `/save/${id}`);
}

async function applyForJob(id) {
  return apiCall("post", `/apply/${id}`);
}

async function removeSavedJob(jobId) {
  return apiCall("delete", `/remove-saved-job/${jobId}`);
}

async function getPublicProfile(id) {
  return await apiCall("get", `/users/public-profile/${id}`);
}

async function analyzeDocument(file, jobDescription) {
  const formPayload = new FormData();
  formPayload.append("file", file); // Backend expects 'file' for /users/resumes/upload-file
  // jobDescription is not used in backend, but keep for future use if needed
  return apiCall("post", "/users/resumes/upload-file", formPayload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

async function recommendJobs(userProfile, jobs) {
  // /jobs/search expects a JobSearchRequest: { job_titles, country, date_posted, location }
  // We'll map userProfile to this structure
  const payload = {
    job_titles: userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills : [""],
    country: "us", // Default, or map from userProfile if available
    date_posted: "all",
    location: userProfile.location || ""
  };
  return apiCall("post", "/jobs/search", payload);
}

async function getAllJobs(params) {
  return apiCall("post", "/jobs/search", params);
}

async function getResumeImprovementSuggestions(resumeText, jobDescription) {
  return apiCall("post", "/users/resume-improvement-suggestions", { resumeText, jobDescription });
}

async function uploadPortfolioFile(file, label, type) {
  const formPayload = new FormData();
  formPayload.append("file", file);
  if (label) formPayload.append("label", label);
  if (type) formPayload.append("type", type);
  return apiCall("post", "/users/profile/uploads", formPayload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

async function listPortfolioUploads() {
  return apiCall("get", "/users/profile/uploads");
}

async function deletePortfolioUpload(uploadId) {
  return apiCall("delete", `/users/profile/uploads/${uploadId}`);
}
