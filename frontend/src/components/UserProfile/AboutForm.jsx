import React, { useState } from "react";
import { userService } from "../../services/userService.js";
import InputField from "../Common/FormComponents/InputField.jsx";
import SelectInput from "../Common/FormComponents/SelectInput.jsx";
import SubmissionButton from "../Common/Buttons/SubmissionButton.jsx";
import useUpdateUserData from "../../hooks/useUpdateUserData.jsx";
import countries from "../../data/countries.json";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

function AboutForm({ formData, setFormData }) {
  const [uploadProgress, setUploadProgress] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [initialFormData] = useState({ ...formData });
  const [isChanged, setIsChanged] = useState(false);
  const updateUserData = useUpdateUserData();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    updateFormData(id, value);
  };

  const updateFormData = (key, value) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);
    // Check if any field has changed from its initial value
    const hasChanges = Object.keys(newFormData).some(
      k => JSON.stringify(newFormData[k]) !== JSON.stringify(initialFormData[k])
    );
    setIsChanged(hasChanges);
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : "";
    updateFormData(name, value);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Optimistic preview
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const newFormData = { ...formData, profilePicture: reader.result };
        setFormData(newFormData);
        const hasChanges = reader.result !== initialFormData.profilePicture;
        setIsChanged(hasChanges);
      };
      reader.readAsDataURL(file);
    } catch (_) { }

    try {
      setUploadProgress(true);
      const res = await userService.updateProfilePicture(file);
      const uploadedUrl = res?.data?.url || res?.data?.profilePictureUrl;
      if (uploadedUrl) {
        setFormData({ ...formData, profilePicture: uploadedUrl });
      }
      await updateUserData();
    } catch (error) {
      console.error(`Error updating profile picture: ${error}`);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isChanged) return;

    try {
      setUpdating(true);
      let payload = { ...formData };
      delete payload.customRole; // Cleanup if exists
      console.log("Submitting payload to backend:", payload);
      const res = await userService.updateUserProfile(payload);
      if (res.status === 200) {
        updateUserData();
        setIsChanged(false); // Reset change state on success
      }
      setUpdating(false);
    } catch (error) {
      console.log(error);
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsChanged(false);
  };

  const locationOptions = countries.map(country => ({ value: country.code, label: country.name }));

  const roleOptions = [
    {
      label: "Engineering & Data",
      options: [
        { value: "Software Engineer", label: "Software Engineer" },
        { value: "Frontend Developer", label: "Frontend Developer" },
        { value: "Backend Developer", label: "Backend Developer" },
        { value: "Full Stack Developer", label: "Full Stack Developer" },
        { value: "Data Scientist", label: "Data Scientist" },
        { value: "Data Analyst", label: "Data Analyst" },
        { value: "Machine Learning Engineer", label: "Machine Learning Engineer" },
        { value: "DevOps Engineer", label: "DevOps Engineer" },
        { value: "QA Engineer", label: "QA Engineer" },
      ],
    },
    {
      label: "Product & Design",
      options: [
        { value: "Product Manager", label: "Product Manager" },
        { value: "Project Manager", label: "Project Manager" },
        { value: "Product Designer", label: "Product Designer" },
        { value: "UI/UX Designer", label: "UI/UX Designer" },
        { value: "Graphic Designer", label: "Graphic Designer" },
      ],
    },
    {
      label: "Business & Marketing",
      options: [
        { value: "Business Analyst", label: "Business Analyst" },
        { value: "Marketing Manager", label: "Marketing Manager" },
        { value: "Sales Representative", label: "Sales Representative" },
        { value: "Content Writer", label: "Content Writer" },
        { value: "HR Specialist", label: "HR Specialist" },
      ],
    },
    {
      label: "Student & Entry Level",
      options: [
        { value: "Student", label: "Student" },
        { value: "Intern", label: "Intern" },
        { value: "Recent Graduate", label: "Recent Graduate" },
      ],
    },
  ];

  const experienceOptions = [
    { value: "Student / No Experience", label: "Student / No Experience" },
    { value: "0-1 years", label: "0-1 years" },
    { value: "1-3 years", label: "1-3 years" },
    { value: "3-5 years", label: "3-5 years" },
    { value: "5-10 years", label: "5-10 years" },
    { value: "10+ years", label: "10+ years" },
  ];

  // Custom styles for react-select to match Tailwind
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#22c55e' : '#d1d5db', // green-500 or gray-300
      boxShadow: state.isFocused ? '0 0 0 1px #22c55e' : null,
      '&:hover': {
        borderColor: state.isFocused ? '#22c55e' : '#9ca3af',
      },
      padding: '2px',
      borderRadius: '0.5rem',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#22c55e' : state.isFocused ? '#dcfce7' : null, // green-500 or green-100
      color: state.isSelected ? 'white' : '#374151',
    }),
  };

  // Helper to find the option object for the current value
  const getSelectedOption = (options, value) => {
    if (!value) return null;
    // Flatten grouped options if necessary
    const flatOptions = options.flatMap(opt => opt.options ? opt.options : opt);
    return flatOptions.find(opt => opt.value === value) || { value, label: value };
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Profile Picture Upload */}
        <div className="py-6 flex flex-col items-center sm:flex-row gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById("profilePicture").click()}>
            <div className="rounded-full h-24 w-24 overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm">
              <img
                src={formData.profilePicture}
                alt="User"
                className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black bg-opacity-50 rounded-full p-2">
                <i className="fa-solid fa-camera text-white"></i>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h3 className="font-medium text-lg">Profile Picture</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a professional photo to help employers identify you.
            </p>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              onChange={handleFileChange}
              hidden
              accept="image/*"
            />
            <button
              type="button"
              className="text-sm text-green-600 font-medium hover:text-green-700 self-center sm:self-start"
              onClick={() => document.getElementById("profilePicture").click()}
            >
              {uploadProgress ? "Uploading..." : "Change Photo"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="col-span-1">
            <InputField
              label="Full Name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              isRequired={true}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="col-span-1">
            <SelectInput
              label="Location"
              id="location"
              value={formData.location}
              onChange={handleInputChange}
              options={locationOptions}
              isRequired={true}
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="primaryRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Role <span className="text-red-500">*</span>
            </label>
            <CreatableSelect
              id="primaryRole"
              name="primaryRole"
              value={getSelectedOption(roleOptions, formData.primaryRole)}
              onChange={handleSelectChange}
              options={roleOptions}
              styles={customStyles}
              placeholder="Select or type your role..."
              isClearable
              formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <Select
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={getSelectedOption(experienceOptions, formData.yearsOfExperience)}
              onChange={handleSelectChange}
              options={experienceOptions}
              styles={customStyles}
              placeholder="Select experience level..."
            />
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us a bit about yourself, your key skills, and what you're looking for..."
            rows="4"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <SubmissionButton
            type="button"
            onClick={handleCancel}
            color="white"
            label="Cancel"
          />
          <SubmissionButton
            type="submit"
            onClick={handleSubmit}
            color="black"
            label={updating ? "Saving..." : "Save Changes"}
            disabled={!isChanged}
          />
        </div>
      </form>
    </div>
  );
}

export default AboutForm;
