import React, { useState, useEffect, useRef } from "react";
import Checkbox from "../Common/FormComponents/Checkbox";
import RadioButton from "../Common/FormComponents/RadioButton";

function SideBarFilter({ filters, setFilters, setSidebarCollapsed }) {
  const [collapsed, setCollapsed] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [exchangeRates, setExchangeRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(false);
  const ratesCache = useRef({});

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    INR: "₹",
    CNY: "¥",
    SGD: "S$",
    ZAR: "R",
  };

  // INR salary values (yearly)
  const salaryRangesINR = [
    { from: 0, to: 50000 },
    { from: 50000, to: 100000 },
    { from: 100000, to: 200000 },
    { from: 200000, to: 300000 },
    { from: 300000, to: 100000000 }, // 1 crore as a practical upper bound
  ];

  // Fetch exchange rates when currency changes (except INR)
  useEffect(() => {
    if (currency === "INR") return;
    if (ratesCache.current[currency]) {
      setExchangeRates(ratesCache.current[currency]);
      return;
    }
    setLoadingRates(true);
    fetch(
      `/api/exchange-rates?base=INR&symbols=${currency}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates) {
          ratesCache.current[currency] = data.rates;
          setExchangeRates(data.rates);
        }
      })
      .catch(() => setExchangeRates({}))
      .finally(() => setLoadingRates(false));
  }, [currency]);

  // Convert INR salary to selected currency
  const convertSalary = (amountINR) => {
    if (currency === "INR") return amountINR;
    if (!exchangeRates[currency]) return amountINR;
    return Math.round(amountINR * exchangeRates[currency]);
  };

  // Remove local expand/collapse button logic

  const handleCollapseSidebar = () => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
  };

  const handleDatePostChange = (e) => {
    const value = e.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      datePosted: value,
    }));
  };

  const handleJobTypeChange = (name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      jobTypes: prevFilters.jobTypes.includes(name)
        ? prevFilters.jobTypes.filter((type) => type !== name)
        : [...prevFilters.jobTypes, name],
    }));
  };

  const handleExperienceChange = (value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      experience: value,
    }));
  };

  const handleSalaryRangeChange = (from, to) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      salaryRange: {
        from: from,
        to: to,
      },
    }));
  };

  const handleWorkModeChange = (name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      workMode: prevFilters.workMode.includes(name)
        ? prevFilters.workMode.filter((mode) => mode !== name)
        : [...prevFilters.workMode, name],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      datePosted: "",
      jobTypes: [],
      experience: 30,
      salaryRange: {
        from: 0,
        to: 10000000000,
      },
      workMode: [],
    });
  };
  return (
    <div className="relative h-full">
      <button
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg px-2 py-1 cursor-pointer"
        onClick={handleCollapseSidebar}
        aria-label="Collapse filters"
        title="Collapse filters"
      >
        &lt;
      </button>
      <div className="text-sm ">
        <div className="border-b px-4">
          <div className="flex justify-between py-4 items-center">
            <span className="font-bold">Filter</span>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-red-400 hover:cursor-pointer mr-2"
                onClick={clearAllFilters}
              >
                Clear all
              </span>
            </div>
          </div>
        </div>
          <div className="px-4">
          {/* Date Post, Job Type, Experience, Salary Range, Work Mode, etc. */}
            <div>
              <div className="py-4">
                <span className="font-bold">Date Post</span>
              </div>
              <div className=" mx-auto space-y-6 border-b pb-4">
                <select onChange={handleDatePostChange}>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This week</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>
            </div>

            <div className="pr-4 border-b pb-4">
              <div className="py-4">
                <span className="font-bold">Job Type</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Checkbox
                    label="Full-time"
                    name="Full-time"
                    checked={filters.jobTypes.includes("Full-time")}
                    onChange={() => handleJobTypeChange("Full-time")}
                    className={"text-gray-500 text-sm font-medium"}
                  />
                  <Checkbox
                    label="Part-time"
                    name="Part-time"
                    checked={filters.jobTypes.includes("Part-time")}
                    onChange={() => handleJobTypeChange("Part-time")}
                    className={"text-gray-500 text-sm font-medium"}
                  />
                </div>
                <div className="flex justify-between">
                  <Checkbox
                    label="Internship"
                    name="Internship"
                    checked={filters.jobTypes.includes("Internship")}
                    onChange={() => handleJobTypeChange("Internship")}
                    className={"text-gray-500 text-sm font-medium"}
                  />
                  <Checkbox
                    label="Freelance"
                    name="Freelance"
                    checked={filters.jobTypes.includes("Freelance")}
                    onChange={() => handleJobTypeChange("Freelance")}
                    className={"text-gray-500 text-sm font-medium"}
                  />
                </div>
              </div>
            </div>

            <div className="pr-4 border-b pb-4">
              <div className="py-4">
                <span className="font-bold">Experience</span>
              </div>
              <div className=" ">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={filters.experience}
                  onChange={(e) => handleExperienceChange(e.target.value)}
                  className="slider h-2 w-full rounded-full accent-green-600 outline-none transition-colors duration-150 ease-linear cursor-pointer"
                />
              </div>
              <div className="flex justify-between px-1 text-gray-500 font-medium">
                <span>0 Yrs</span>
                <span className="font-bold text-green-600">
                  {filters.experience} Yrs
                </span>
                <span>30 Yrs</span>
              </div>
            </div>

            <div className="pr-4 border-b pb-4">
              <div className="py-4 flex items-center gap-3">
                <span className="font-bold">Salary Range</span>
                <select
                  className="ml-2 border rounded px-2 py-1 text-xs"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="ZAR">ZAR (R)</option>
                </select>
                {loadingRates && <span className="ml-2 text-xs text-gray-400">Loading rates...</span>}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <RadioButton
                    id="under-50K"
                    name="salary-range"
                    value={`Under 50K`}
                    label={`Under ${currencySymbols[currency]}${convertSalary(50000).toLocaleString()}`}
                    checked={
                      filters.salaryRange.from === 0 &&
                      filters.salaryRange.to === 50000
                    }
                    onChange={() => handleSalaryRangeChange(0, 50000)}
                    className="text-gray-500 text-sm font-medium"
                  />
                  <RadioButton
                    id="50-100K"
                    name="salary-range"
                    value={`50K - 100K`}
                    label={`${currencySymbols[currency]}${convertSalary(50000).toLocaleString()} - ${currencySymbols[currency]}${convertSalary(100000).toLocaleString()}`}
                    checked={
                      filters.salaryRange.from === 50000 &&
                      filters.salaryRange.to === 100000
                    }
                    onChange={() => handleSalaryRangeChange(50000, 100000)}
                    className="text-gray-500 text-sm font-medium"
                  />
                </div>
                <div className="flex justify-between">
                  <RadioButton
                    id="100-200K"
                    name="salary-range"
                    value={`100K - 200K`}
                    label={`${currencySymbols[currency]}${convertSalary(100000).toLocaleString()} - ${currencySymbols[currency]}${convertSalary(200000).toLocaleString()}`}
                    checked={
                      filters.salaryRange.from === 100000 &&
                      filters.salaryRange.to === 200000
                    }
                    onChange={() => handleSalaryRangeChange(100000, 200000)}
                    className="text-gray-500 text-sm font-medium"
                  />
                  <RadioButton
                    id="200-300K"
                    name="salary-range"
                    value={`200K - 300K`}
                    label={`${currencySymbols[currency]}${convertSalary(200000).toLocaleString()} - ${currencySymbols[currency]}${convertSalary(300000).toLocaleString()}`}
                    checked={
                      filters.salaryRange.from === 200000 &&
                      filters.salaryRange.to === 300000
                    }
                    onChange={() => handleSalaryRangeChange(200000, 300000)}
                    className="text-gray-500 text-sm font-medium"
                  />
                </div>
                <div className="flex justify-between">
                  <RadioButton
                    id="more-than-300K"
                    name="salary-range"
                    value={`More than 300K`}
                    label={`More than ${currencySymbols[currency]}${convertSalary(300000).toLocaleString()}`}
                    checked={
                      filters.salaryRange.from === 300000 &&
                      filters.salaryRange.to === 100000000
                    }
                    onChange={() => handleSalaryRangeChange(300000, 100000000)}
                    className="text-gray-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pr-4 border-b pb-4">
              <div className="py-4">
                <span className="font-bold">Work Mode</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Checkbox
                    label="On-site"
                    name="Onsite"
                    checked={filters.workMode.includes("Onsite")}
                    onChange={() => handleWorkModeChange("Onsite")}
                    className="text-gray-500 text-sm font-medium"
                  />
                  <Checkbox
                    label="Hybrid"
                    name="Hybrid"
                    checked={filters.workMode.includes("Hybrid")}
                    onChange={() => handleWorkModeChange("Hybrid")}
                    className="text-gray-500 text-sm font-medium"
                  />
                </div>
                <div className="flex justify-between">
                  <Checkbox
                    label="Remote"
                    name="Remote"
                    checked={filters.workMode.includes("Remote")}
                    onChange={() => handleWorkModeChange("Remote")}
                    className="text-gray-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default SideBarFilter;
