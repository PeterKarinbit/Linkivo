import React, { useEffect, useState } from "react";
import InputField from "../Common/FormComponents/InputField";
import SubmissionButton from "../Common/Buttons/SubmissionButton";
import { userService } from "../../services/userService";
import { useSelector } from "react-redux";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { Link } from "react-router-dom";

function UpdateResume() {
  const [resumeLink, setResumeLink] = useState("");
  const [resume, setResume] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeType, setResumeType] = useState("Resume");
  const [linkedIn, setLinkedIn] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [visibility, setVisibility] = useState("recruiters");
  const [updating, setUpdating] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [similarity, setSimilarity] = useState(null);
  const [extractedText, setExtractedText] = useState("");

  const updateUserData = useUpdateUserData();

  const { userData } = useSelector((store) => store.auth);

  useEffect(() => {
    if (userData?.userProfile?.resume) {
      setResume(userData?.userProfile?.resume);
      setLastUpdated(userData?.userProfile?.resumeLastUpdated || new Date().toLocaleDateString());
    }
    if (userData?.userProfile?.linkedIn) setLinkedIn(userData.userProfile.linkedIn);
    if (userData?.userProfile?.portfolio) setPortfolio(userData.userProfile.portfolio);
    if (userData?.userProfile?.resumeType) setResumeType(userData.userProfile.resumeType);
    if (userData?.userProfile?.resumeVisibility) setVisibility(userData.userProfile.resumeVisibility);
  }, [userData]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleDelete = () => {
    setResume("");
    setResumeLink("");
    setResumeFile(null);
    setFeedback("Resume removed. Remember to save changes.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUpdating(true);
    setFeedback("");
    setSimilarity(null);
    setExtractedText("");
    try {
      if (resumeFile && jobDescription) {
        // Call AI analysis API
        const response = await userService.analyzeDocument(resumeFile, jobDescription);
        if (response?.data) {
          setSimilarity(response.data.similarity);
          setExtractedText(response.data.docText);
          setFeedback("Document analyzed and uploaded successfully!");
        } else {
          setFeedback("Upload succeeded, but no analysis result returned.");
        }
      } else {
        setFeedback("Please select a file and enter a job description for analysis.");
      }
    } catch (error) {
      setFeedback("Error uploading or analyzing document: " + (error?.message || "Unknown error"));
    }
    setUpdating(false);
    setLastUpdated(new Date().toLocaleDateString());
    updateUserData();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 py-10 sm:px-5 md:px-10 lg:px-20">
      <div className="w-full max-w-2xl p-6 bg-white rounded shadow-md">
        <h2 className="mb-5 text-lg sm:text-xl md:text-2xl font-bold text-gray-700">
          Resume / CV Upload Moved
        </h2>
        <div className="text-gray-700 mb-6">
          The upload and AI analysis of your resume, CV, or portfolio has moved to a dedicated page for a better experience.<br />
          Please use the <b>Upload</b> page to upload and analyze your documents.
        </div>
        <Link to="/upload">
          <button className="bg-black text-white px-6 py-2 rounded shadow hover:bg-gray-800">
            Go to Upload Page
          </button>
        </Link>
      </div>
    </div>
  );
}

export default UpdateResume;
