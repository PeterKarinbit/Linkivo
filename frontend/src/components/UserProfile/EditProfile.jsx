import { useEffect, useState } from "react";
import AboutForm from "./AboutForm";
import SocialProfileForm from "./SocialProfileForm";
import WorkExperienceCard from "./WorkExperienceCard";
import WorkExperienceForm from "./WorkExperienceForm";
import EducationCard from "./EducationCard";
import EducationForm from "./EducationForm";
import { useSelector } from "react-redux";
import SkillsSearch from "../Common/SkillsSearch";
import { userService } from "../../services/userService";
import SubmissionButton from "../Common/Buttons/SubmissionButton";

function EditProfile() {
  const { userData } = useSelector((store) => store.auth);
  const [showAddWorkExperience, setShowAddWorkExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [workExperienceFormData, setWorkExperienceFormData] = useState(null);
  const [educationFormData, setEducationFormData] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  // Unified form state
  const [formData, setFormData] = useState({
    about: {
      name: userData?.userProfile?.name || "",
      location: userData?.userProfile?.location || "",
      primaryRole: userData?.userProfile?.primaryRole || "",
      yearsOfExperience: userData?.userProfile?.yearsOfExperience || "",
      bio: userData?.userProfile?.bio || "",
      profilePicture: userData?.userProfile?.profilePicture || "",
    },
    social: {
      website: userData?.userProfile?.socialProfiles?.portfolioWebsite || "",
      linkedin: userData?.userProfile?.socialProfiles?.linkedin || "",
      twitter: userData?.userProfile?.socialProfiles?.twitter || "",
      github: userData?.userProfile?.socialProfiles?.github || "",
    },
    workExperience: userData?.userProfile?.workExperience || [],
    education: userData?.userProfile?.education || [],
    skills: userData?.userProfile?.skills || [],
  });

  // Pass these to subcomponents
  const aboutProps = {
    formData: formData.about,
    setFormData: (about) => setFormData((prev) => ({ ...prev, about })),
  };
  const socialProps = {
    formData: formData.social,
    setFormData: (social) => setFormData((prev) => ({ ...prev, social })),
  };
  const workExperienceProps = {
    userWorkExperience: formData.workExperience,
    setWorkExperienceFormData: (data) => setFormData((prev) => ({ ...prev, workExperience: data })),
    showAddWorkExperience: showAddWorkExperience,
    setShowAddWorkExperience: setShowAddWorkExperience,
  };
  const educationProps = {
    userEducation: formData.education,
    setEducationFormData: (data) => setFormData((prev) => ({ ...prev, education: data })),
    showAddEducation: showAddEducation,
    setShowAddEducation: setShowAddEducation,
  };
  const skillsProps = {
    selectedSkills: new Map(formData.skills.map((skill) => [skill, true])),
    setSelectedSkills: (skills) => setFormData((prev) => ({ ...prev, skills: Array.from(skills.keys()) })),
  };

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setFeedback("");
    try {
      // Format data according to backend expectations
      const payload = {
        name: formData.about.name,
        location: formData.about.location,
        primaryRole: formData.about.primaryRole,
        yearsOfExperience: formData.about.yearsOfExperience,
        bio: formData.about.bio,
        profilePicture: formData.about.profilePicture,
        socialProfiles: {
          portfolioWebsite: formData.social.website,
          linkedin: formData.social.linkedin,
          twitter: formData.social.twitter,
          github: formData.social.github,
        },
        workExperience: formData.workExperience,
        education: formData.education,
        skills: formData.skills,
      };
      
      const res = await userService.updateUserProfile(payload);
      if (res.statusCode === 200) {
        setFeedback("Profile updated successfully!");
      } else {
        setFeedback("Failed to update profile: " + (res.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setFeedback("Error updating profile: " + (err.response?.data?.message || err.message || "Unknown error"));
    }
    setSaving(false);
  };

  if (!userData) {
    return (
      <div className="h-screen flex justify-center items-center text-xl font-semibold">
        Loading...
      </div>
    );
  }
  return (
    <div className="px-4">
      {/* About Section */}
      <div className="flex flex-col md:flex-row gap-16 my-5 border-b pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-medium">About</p>
          <p className="text-gray-400 text-sm">
            Tell us about yourself so companies know who you are.
          </p>
        </div>
        <div className="w-full md:w-[70%] ">
          <AboutForm {...aboutProps} />
        </div>
      </div>
      {/* Social Section */}
      <div className="flex flex-col md:flex-row gap-16 my-5 border-b pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-medium">Social Profiles</p>
          <p className="text-gray-400 text-sm">
            Where can people find you online?
          </p>
        </div>
        <div className="w-full md:w-[70%] ">
          <SocialProfileForm {...socialProps} />
        </div>
      </div>
      {/* Work Experience Section */}
      <div className="flex flex-col md:flex-row gap-16 my-5 border-b pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-medium">Your work experience</p>
          <p className="text-gray-400 text-sm">
            What other positions have you held?
          </p>
        </div>
        <div className="w-full md:w-[70%] flex flex-col gap-3.5">
          <div className="flex flex-col gap-3">
            {formData.workExperience.length > 0 &&
              formData.workExperience.map((exp, index) => (
                <WorkExperienceCard
                  key={index}
                  exp={exp}
                  setShowAddWorkExperience={setShowAddWorkExperience}
                  setWorkExperienceFormData={setWorkExperienceFormData}
                />
              ))}
          </div>
          {showAddWorkExperience ? (
            <WorkExperienceForm
              setShowAddWorkExperience={setShowAddWorkExperience}
              data={workExperienceFormData}
              setWorkExperienceFormData={setWorkExperienceFormData}
            />
          ) : (
            <div
              className="text-sm text-green-600 flex gap-1 items-center hover:cursor-pointer"
              onClick={() => setShowAddWorkExperience(true)}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add work experience</span>
            </div>
          )}
        </div>
      </div>
      {/* Education Section */}
      <div className="flex flex-col md:flex-row gap-16 my-5 border-b pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-medium">Education</p>
          <p className="text-gray-400 text-sm">
            What schools have you studied at?
          </p>
        </div>
        <div className="w-full md:w-[70%] flex flex-col gap-3.5">
          <div className="flex flex-col gap-3">
            {formData.education.length > 0 &&
              formData.education.map((edu, index) => (
                <EducationCard
                  key={index}
                  edu={edu}
                  setShowAddEducation={setShowAddEducation}
                  setEducationFormData={setEducationFormData}
                />
              ))}
          </div>

          {showAddEducation ? (
            <EducationForm
              setShowAddEducation={setShowAddEducation}
              educationFormData={educationFormData}
              setEducationFormData={setEducationFormData}
            />
          ) : (
            <div
              className="text-sm text-green-600 flex gap-1 items-center hover:cursor-pointer"
              onClick={() => setShowAddEducation(true)}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add education</span>
            </div>
          )}
        </div>
      </div>
      {/* Skills Section */}
      <div className="flex flex-col md:flex-row gap-16 my-5 border-b pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-medium">Your Skills</p>
          <p className="text-gray-400 text-sm">
            This will help startups hone in on your strengths.
          </p>
        </div>
        <div className="w-full md:w-[70%] flex flex-col gap-3.5">
          <SkillsSearch
            selectedSkills={new Map(formData.skills.map((skill) => [skill, true]))}
            setSelectedSkills={(skills) => setFormData((prev) => ({ ...prev, skills: Array.from(skills.keys()) }))}
            profile={true}
          />
        </div>
      </div>
      {/* Save Button and Feedback */}
      <div className="flex justify-end mt-8">
        <SubmissionButton
          type="button"
          onClick={handleSave}
          color="black"
          label={saving ? "Saving..." : "Save All"}
        />
      </div>
      {feedback && <div className="text-green-600 text-base mt-4 dark:text-green-400 font-semibold text-center">{feedback}</div>}
    </div>
  );
}

export default EditProfile;
