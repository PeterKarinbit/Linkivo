import React, { useEffect, useState } from "react";
import SubmissionButton from "../Common/Buttons/SubmissionButton";
import InputField from "../Common/FormComponents/InputField";
import { externalApiServices } from "../../services/externalApiServices";
import { userService } from "../../services/userService";
import { useSelector } from "react-redux";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import Select from "react-select";

function EducationForm({
  setShowAddEducation,
  educationFormData,
  setEducationFormData,
}) {
  const { userData } = useSelector((store) => store.auth);
  const updateUser = useUpdateUserData();

  const initialFormData = {
    institution: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    degree: "",
    major: "",
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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
  const years = Array.from({ length: 60 }, (_, i) => {
    const year = (currentYear + 5 - i).toString(); // Allow future years for graduation
    return { value: year, label: year };
  });

  useEffect(() => {
    if (educationFormData) {
      updateFormData(educationFormData);
    }
  }, [educationFormData]);

  const updateFormData = (data) => {
    const { institution, degree, fieldOfStudy, startYear, endYear } = data;

    const parseDate = (dateStr) => {
      if (!dateStr) return { year: "", month: "" };
      // Handle YYYY-MM string
      const parts = dateStr.toString().split("-");
      if (parts.length >= 2) {
        return { year: parts[0], month: parts[1] };
      }
      // Handle just Year (legacy data)
      if (parts.length === 1 && parts[0].length === 4) {
        return { year: parts[0], month: "" };
      }
      return { year: "", month: "" };
    };

    const start = parseDate(startYear);
    const end = parseDate(endYear);

    setFormData({
      institution: institution || "",
      startMonth: start.month,
      startYear: start.year,
      endMonth: end.month,
      endYear: end.year,
      degree: degree || "",
      major: fieldOfStudy || "",
    });

    if (institution) setShowDropdown(false);
  };

  const handleDropdown = (item) => {
    setFormData({ ...formData, institution: item.name });
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData({ ...formData, [name]: selectedOption ? selectedOption.value : "" });
  };

  // University Search Logic
  useEffect(() => {
    if (isSearching) {
      const timeoutId = setTimeout(async () => {
        if (searchTerm) {
          try {
            const data = await externalApiServices.searchUniversities(searchTerm);
            setData(data || []);
          } catch (e) {
            console.error(e);
            setData([]);
          }
        } else {
          setData([]);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isSearching]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setFormData({ ...formData, institution: event.target.value });
    setIsSearching(true);
  };

  const handleCancel = () => {
    setShowAddEducation(false);
    setEducationFormData(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Construct YYYY-MM strings
    const formattedStart = formData.startYear
      ? (formData.startMonth ? `${formData.startYear}-${formData.startMonth}` : formData.startYear)
      : "";

    const formattedEnd = formData.endYear
      ? (formData.endMonth ? `${formData.endYear}-${formData.endMonth}` : formData.endYear)
      : "";

    const payload = {
      institution: formData.institution,
      degree: formData.degree,
      fieldOfStudy: formData.major,
      startYear: formattedStart,
      endYear: formattedEnd,
    };

    const { userProfile } = userData;
    let update = null;

    if (educationFormData) {
      // Update existing
      const educationCopy = [...userProfile.education];
      // Find index (using content matching as fallback)
      const indexToUpdate = educationCopy.findIndex(
        (edu) => edu.degree === educationFormData.degree && edu.institution === educationFormData.institution
      );

      if (indexToUpdate !== -1) {
        educationCopy[indexToUpdate] = payload;
      }
      update = { education: educationCopy };
    } else {
      // Add new
      update = { education: [...userProfile.education, payload] };
    }

    try {
      const res = await userService.updateUserProfile(update);
      if (res.status === 200) {
        await updateUser();
        setShowAddEducation(false);
        setEducationFormData(null);
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
        {educationFormData ? "Edit Education" : "Add Education"}
      </h3>

      <form className="flex flex-col gap-5" onSubmit={handleFormSubmit}>
        {/* Institution Search */}
        <div className="relative">
          <div className={showDropdown ? "" : "hidden"}>
            <InputField
              label="School / University"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleSearch}
              isRequired={true}
              placeholder="Search for your school..."
            />
            {searchTerm && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {data.length > 0 ? (
                  data.slice(0, 10).map((item, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                      onClick={() => handleDropdown(item)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item["state-province"] ? `${item["state-province"]}, ` : ""}{item.alpha_two_code}
                      </div>
                    </li>
                  ))
                ) : (
                  <li
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-500"
                    onClick={() => handleDropdown({ name: searchTerm })}
                  >
                    Use "{searchTerm}"
                  </li>
                )}
              </ul>
            )}
          </div>
          {!showDropdown && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                School / University <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <i className="fa-solid fa-graduation-cap text-blue-600 dark:text-blue-300 text-sm"></i>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{formData.institution}</span>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => {
                    setFormData({ ...formData, institution: "" });
                    setShowDropdown(true);
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date (or Expected) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="w-1/2">
                <Select
                  options={months}
                  value={months.find(m => m.value === formData.endMonth)}
                  onChange={(opt) => handleSelectChange("endMonth", opt)}
                  styles={customStyles}
                  placeholder="Month"
                />
              </div>
              <div className="w-1/2">
                <Select
                  options={years}
                  value={years.find(y => y.value === formData.endYear)}
                  onChange={(opt) => handleSelectChange("endYear", opt)}
                  styles={customStyles}
                  placeholder="Year"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Degree & Major */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField
              label="Degree"
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleInputChange}
              placeholder="e.g. Bachelor's"
            />
          </div>
          <div>
            <InputField
              label="Major / Field of Study"
              id="major"
              name="major"
              value={formData.major}
              onChange={handleInputChange}
              placeholder="e.g. Computer Science"
            />
          </div>
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

export default EducationForm;
