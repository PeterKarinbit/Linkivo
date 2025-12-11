import React, { useEffect, useState } from "react";
import SubmissionButton from "../../components/Common/Buttons/SubmissionButton";
import InputField from "../Common/FormComponents/InputField";
import TextArea from "../Common/FormComponents/TextArea";
import CompanySearch from "../Common/CompanySearch";
import Checkbox from "../Common/FormComponents/Checkbox";
import { userService } from "../../services/userService.js";
import { useSelector } from "react-redux";
import useUpdateUserData from "../../hooks/useUpdateUserData.jsx";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

function WorkExperienceForm({
  setShowAddWorkExperience,
  data,
  setWorkExperienceFormData,
}) {
  const { userData } = useSelector((store) => store.auth);
  const updateUser = useUpdateUserData();

  const initialFormData = {
    companyName: "",
    companyLogo: "",
    companyDomain: "",
    title: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    current: false,
    description: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showDropdown, setShowDropdown] = useState(true);
  const [saving, setSaving] = useState(false);

  // Date Options
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => {
    const year = (currentYear - i).toString();
    return { value: year, label: year };
  });

  // Role Options (Expanded)
  const roleOptions = [
    {
      label: "Engineering",
      options: [
        { value: "Software Engineer", label: "Software Engineer" },
        { value: "Frontend Developer", label: "Frontend Developer" },
        { value: "Backend Developer", label: "Backend Developer" },
        { value: "Full Stack Developer", label: "Full Stack Developer" },
        { value: "DevOps Engineer", label: "DevOps Engineer" },
      ]
    },
    {
      label: "Product & Design",
      options: [
        { value: "Product Manager", label: "Product Manager" },
        { value: "Product Designer", label: "Product Designer" },
        { value: "UX Designer", label: "UX Designer" },
      ]
    },
    {
      label: "Data",
      options: [
        { value: "Data Scientist", label: "Data Scientist" },
        { value: "Data Analyst", label: "Data Analyst" },
        { value: "Machine Learning Engineer", label: "Machine Learning Engineer" },
      ]
    },
    {
      label: "Other",
      options: [
        { value: "Student", label: "Student" },
        { value: "Intern", label: "Intern" },
      ]
    }
  ];

  useEffect(() => {
    if (data) {
      const { company, jobTitle, description, startMonth, endMonth, currentJob } = data;

      const parseDate = (dateStr) => {
        if (!dateStr) return { year: "", month: "" };
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return {
            year: d.getFullYear().toString(),
            month: (d.getMonth() + 1).toString().padStart(2, '0')
          };
        }
        // Fallback for YYYY-MM string
        const parts = dateStr.split("-");
        if (parts.length >= 2) {
          return { year: parts[0], month: parts[1] };
        }
        return { year: "", month: "" };
      };

      const start = parseDate(startMonth);
      const end = parseDate(endMonth);

      setFormData({
        companyName: company?.name || "",
        companyLogo: company?.logoUrl || "",
        companyDomain: company?.domain || "",
        title: jobTitle || "",
        description: description || "",
        startMonth: start.month,
        startYear: start.year,
        endMonth: end.month,
        endYear: end.year,
        current: currentJob || false,
      });

      if (company?.name) setShowDropdown(false);
    }
  }, [data]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData({ ...formData, [name]: selectedOption ? selectedOption.value : "" });
  };

  const handleDropdown = (item) => {
    const { name, logo, domain } = item;
    setFormData({
      ...formData,
      companyName: name,
      companyLogo: logo || "",
      companyDomain: domain || "",
    });
    setShowDropdown(false);
  };

  const handleCancel = () => {
    setShowAddWorkExperience(false);
    setWorkExperienceFormData(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Construct Date Objects/Strings
    // Using simple YYYY-MM-DD string to ensure Mongoose casts it correctly without timezone shifts
    const formattedStartDate = formData.startYear && formData.startMonth
      ? `${formData.startYear}-${formData.startMonth}-01`
      : null;

    const formattedEndDate = !formData.current && formData.endYear && formData.endMonth
      ? `${formData.endYear}-${formData.endMonth}-01`
      : null;

    const payload = {
      jobTitle: formData.title,
      company: {
        name: formData.companyName,
        logoUrl: formData.companyLogo,
        domain: formData.companyDomain,
      },
      startMonth: formattedStartDate,
      endMonth: formattedEndDate,
      currentJob: formData.current,
      description: formData.description,
    };

    const { userProfile } = userData;
    let update = null;

    if (data) {
      // Update existing
      const workExperienceCopy = [...userProfile.workExperience];
      // Using index matching if available, or finding by content
      // Since we don't have unique IDs for experience items in the frontend data prop easily without checking,
      // we'll try to match by title and company as before, but this is risky if duplicates exist.
      // Better approach: The 'data' prop usually comes from the map iteration, so it's the exact object reference from the store.
      // We can find index by reference equality if Redux state hasn't mutated, or just match content.
      const indexToUpdate = workExperienceCopy.findIndex(
        (exp) => exp.jobTitle === data.jobTitle && exp.company.name === data.company.name
      );

      if (indexToUpdate !== -1) {
        workExperienceCopy[indexToUpdate] = payload;
      }
      update = { workExperience: workExperienceCopy };
    } else {
      // Add new
      update = { workExperience: [...userProfile.workExperience, payload] };
    }

    try {
      const res = await userService.updateUserProfile(update);
      if (res.status === 200) {
        await updateUser(); // Wait for update to complete
        setShowAddWorkExperience(false);
        setWorkExperienceFormData(null);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  // Custom Styles for React Select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#22c55e' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #22c55e' : null,
      '&:hover': { borderColor: state.isFocused ? '#22c55e' : '#9ca3af' },
      borderRadius: '0.375rem',
      padding: '2px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#22c55e' : state.isFocused ? '#dcfce7' : null,
      color: state.isSelected ? 'white' : '#374151',
    }),
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {data ? "Edit Experience" : "Add Experience"}
      </h3>

      <form className="flex flex-col gap-5" onSubmit={handleFormSubmit}>
        {/* Company Search */}
        <div className="relative">
          <div className={showDropdown ? "" : "hidden"}>
            <CompanySearch
              handleDropdown={handleDropdown}
              companyName={formData?.companyName}
            />
          </div>
          {!showDropdown && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  {formData.companyLogo ? (
                    <img
                      src={formData.companyLogo}
                      alt={formData.companyName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <i className="fa-solid fa-building text-gray-500 dark:text-gray-400 text-xs"></i>
                    </div>
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">{formData.companyName}</span>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => {
                    setFormData({ ...formData, companyName: "", companyLogo: "", companyDomain: "" });
                    setShowDropdown(true);
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <CreatableSelect
            value={formData.title ? { label: formData.title, value: formData.title } : null}
            onChange={(opt) => handleSelectChange("title", opt)}
            options={roleOptions}
            styles={customStyles}
            placeholder="e.g. Software Engineer"
            formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
            isClearable
          />
        </div>

        {/* Start Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="w-1/2">
                <Select
                  options={months}
                  value={months.find(m => m.value === formData.startMonth)}
                  onChange={(opt) => handleSelectChange("startMonth", opt)}
                  styles={customStyles}
                  placeholder="Month"
                />
              </div>
              <div className="w-1/2">
                <Select
                  options={years}
                  value={years.find(y => y.value === formData.startYear)}
                  onChange={(opt) => handleSelectChange("startYear", opt)}
                  styles={customStyles}
                  placeholder="Year"
                />
              </div>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <div className={`flex gap-2 ${formData.current ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="w-1/2">
                <Select
                  options={months}
                  value={months.find(m => m.value === formData.endMonth)}
                  onChange={(opt) => handleSelectChange("endMonth", opt)}
                  styles={customStyles}
                  placeholder="Month"
                  isDisabled={formData.current}
                />
              </div>
              <div className="w-1/2">
                <Select
                  options={years}
                  value={years.find(y => y.value === formData.endYear)}
                  onChange={(opt) => handleSelectChange("endYear", opt)}
                  styles={customStyles}
                  placeholder="Year"
                  isDisabled={formData.current}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Role Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="current"
            name="current"
            checked={formData.current}
            onChange={handleInputChange}
            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
          />
          <label htmlFor="current" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
            I currently work here
          </label>
        </div>

        {/* Description */}
        <div>
          <TextArea
            label="Description"
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your responsibilities and achievements..."
            rows={4}
          />
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
            onClick={handleFormSubmit}
            color="black"
            label={saving ? "Saving..." : "Save"}
          />
        </div>
      </form>
    </div>
  );
}

export default WorkExperienceForm;
