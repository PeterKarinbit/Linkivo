export default {
  // Base URL for the Compensation API
  api: {
    baseUrl: 'https://comp.emsicloud.com',
    endpoints: {
      estimate: '/estimate',
      estimateByExperience: '/estimate_by_experience',
      byMsa: '/by_msa',
      geographies: '/geographies',
      datarun: '/datarun',
      socVersion: '/soc_version'
    }
  },
  
  // Default request settings
  defaults: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000 // 30 seconds
  }
};
