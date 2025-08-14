import { apiCall } from "./apiBase";
import { api_url } from "../../config";

export const contentService = {
  getJobs,
  getSingleJob,
  getJobLocations,
  getCompanies,
  getSavedJobs,
  scrapeLinkedInJobs,
  scrapeJobs,
};
async function getJobs(filters) {
  return apiCall("get", "/jobs", {
    params: {
      search: filters.search,
      page: filters.page,
      location: filters.location,
      datePosted: filters.datePosted,
      type: filters.jobTypes && filters.jobTypes.length > 0 ? filters.jobTypes.join(",") : undefined,
      experience: filters.experience,
      salaryFrom: filters.salaryRange?.from,
      salaryTo: filters.salaryRange?.to,
      workMode: filters.workMode && filters.workMode.length > 0 ? filters.workMode.join(",") : undefined,
    },
  });
}

async function getSingleJob(id) {
  return apiCall("get", `/jobs/${id}`);
}

async function getJobLocations(location) {
  return apiCall("get", "/job-locations", { params: { search: location } });
}

async function getCompanies() {
  return apiCall("get", "/companies");
}

async function getSavedJobs() {
  return apiCall("get", "/users/saved-jobs");
}

async function scrapeLinkedInJobs() {
  return apiCall("get", "/scrape-linkedin-jobs");
}

async function scrapeJobs(searchParams) {
  try {
    console.log('scrapeJobs called with params:', searchParams);
    console.log('Making API call to /job-scrape');
    
    // Use direct fetch to avoid response structure issues
    const response = await fetch(`${api_url}/jobs/job-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API call successful:', data);
    return data;
  } catch (error) {
    console.error('Error scraping jobs:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

export async function getAdzunaJobs({ what, where, page, country, salary_min, salary_max, full_time, permanent, results_per_page, sort_by }) {
  return apiCall("get", "/api/v1/adzuna-jobs", {
    params: { what, where, page, country, salary_min, salary_max, full_time, permanent, results_per_page, sort_by }
  });
}
