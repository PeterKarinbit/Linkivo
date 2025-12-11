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
import CareerGoalsForm from "./CareerGoalsForm";

function EditProfile() {
  const { userData } = useSelector((store) => store.auth);
  const [activeTab, setActiveTab] = useState("about");
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

  // Sync state with Redux userData updates
  useEffect(() => {
    if (userData?.userProfile) {
      setFormData({
        about: {
          name: userData.userProfile.name || "",
          location: userData.userProfile.location || "",
          primaryRole: userData.userProfile.primaryRole || "",
          yearsOfExperience: userData.userProfile.yearsOfExperience || "",
          bio: userData.userProfile.bio || "",
          profilePicture: userData.userProfile.profilePicture || "",
        },
        social: {
          website: userData.userProfile.socialProfiles?.portfolioWebsite || "",
          linkedin: userData.userProfile.socialProfiles?.linkedin || "",
          twitter: userData.userProfile.socialProfiles?.twitter || "",
          github: userData.userProfile.socialProfiles?.github || "",
        },
        workExperience: userData.userProfile.workExperience || [],
        education: userData.userProfile.education || [],
        skills: userData.userProfile.skills || [],
      });
    }
  }, [userData]);

  // Pass these to subcomponents
  const aboutProps = {
    formData: formData.about,
    setFormData: (about) => setFormData((prev) => ({ ...prev, about })),
  };
  const socialProps = {
    formData: formData.social,
    setFormData: (social) => setFormData((prev) => ({ ...prev, social })),
  };

  // Save handler (Optional now as sub-forms save themselves, but kept for "Social" and "Skills" if needed)
  const handleSave = async () => {
    setSaving(true);
    setFeedback("");
    try {
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
        setTimeout(() => setFeedback(""), 3000);
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

  const tabs = [
    { id: "about", label: "About", icon: "fa-user" },
    { id: "social", label: "Social Profiles", icon: "fa-share-nodes" },
    { id: "experience", label: "Experience", icon: "fa-briefcase" },
    { id: "education", label: "Education", icon: "fa-graduation-cap" },
    { id: "skills", label: "Skills", icon: "fa-lightbulb" },
    { id: "goals", label: "Career Goals", icon: "fa-bullseye" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
          <div className="flex flex-col">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors text-left border-l-4 ${activeTab === tab.id
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            {/* Show Save button only for tabs that don't auto-save or have their own save buttons */}
            {(activeTab === "social" || activeTab === "skills") && (
              <SubmissionButton
                type="button"
                onClick={handleSave}
                color="black"
                label={saving ? "Saving..." : "Save Changes"}
                className="py-2 px-4 text-sm"
              />
            )}
          </div>

          {/* Tab Content */}
          {activeTab === "about" && (
            <AboutForm formData={formData.about} setFormData={(about) => setFormData((prev) => ({ ...prev, about }))} />
          )}

          {activeTab === "social" && (
            <SocialProfileForm {...socialProps} />
          )}

          {activeTab === "experience" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {formData.workExperience.length > 0 ? (
                  formData.workExperience.map((exp, index) => (
                    <WorkExperienceCard
                      key={index}
                      exp={exp}
                      setShowAddWorkExperience={setShowAddWorkExperience}
                      setWorkExperienceFormData={setWorkExperienceFormData}
                    />
                  ))
                ) : (
                  !showAddWorkExperience && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No work experience added yet.</p>
                      <button
                        onClick={() => setShowAddWorkExperience(true)}
                        className="text-green-600 font-medium hover:underline"
                      >
                        Add your first experience
                      </button>
                    </div>
                  )
                )}
              </div>

              {showAddWorkExperience ? (
                <WorkExperienceForm
                  setShowAddWorkExperience={setShowAddWorkExperience}
                  data={workExperienceFormData}
                  setWorkExperienceFormData={setWorkExperienceFormData}
                />
              ) : (
                formData.workExperience.length > 0 && (
                  <button
                    className="flex items-center gap-2 text-green-600 font-medium hover:text-green-700 self-start mt-2"
                    onClick={() => {
                      setWorkExperienceFormData(null);
                      setShowAddWorkExperience(true);
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add another experience</span>
                  </button>
                )
              )}
            </div>
          )}

          {activeTab === "education" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {formData.education.length > 0 ? (
                  formData.education.map((edu, index) => (
                    <EducationCard
                      key={index}
                      edu={edu}
                      setShowAddEducation={setShowAddEducation}
                      setEducationFormData={setEducationFormData}
                    />
                  ))
                ) : (
                  !showAddEducation && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No education added yet.</p>
                      <button
                        onClick={() => setShowAddEducation(true)}
                        className="text-green-600 font-medium hover:underline"
                      >
                        Add your education
                      </button>
                    </div>
                  )
                )}
              </div>

              {showAddEducation ? (
                <EducationForm
                  setShowAddEducation={setShowAddEducation}
                  educationFormData={educationFormData}
                  setEducationFormData={setEducationFormData}
                />
              ) : (
                formData.education.length > 0 && (
                  <button
                    className="flex items-center gap-2 text-green-600 font-medium hover:text-green-700 self-start mt-2"
                    onClick={() => {
                      setEducationFormData(null);
                      setShowAddEducation(true);
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add another education</span>
                  </button>
                )
              )}
            </div>
          )}

          {activeTab === "skills" && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Add skills to your profile to help employers find you.
              </p>
              <SkillsSearch
                selectedSkills={new Map(formData.skills.map((skill) => [skill, true]))}
                setSelectedSkills={(skills) => setFormData((prev) => ({ ...prev, skills: Array.from(skills.keys()) }))}
                profile={true}
              />
            </div>
          )}

          {activeTab === "goals" && (
            <CareerGoalsForm />
          )}

          {feedback && <div className="text-green-600 text-base mt-4 dark:text-green-400 font-semibold text-center">{feedback}</div>}
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
