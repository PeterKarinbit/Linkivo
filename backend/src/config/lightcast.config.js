export default {
  // Authentication
  auth: {
    url: 'https://auth.emsicloud.com',
    tokenEndpoint: '/connect/token',
    clientId: 'nlr7saayv3c4grgc',
    clientSecret: 'GvYwAIKk',
    scope: 'emsi_open' // Using the provided scope
  },
  
  // API Configuration
  api: {
    // Base URLs
    baseUrl: 'https://emsiservices.com',
    
    // Skills API
    skills: {
      basePath: '/skills',
      version: 'latest', // or specific version like '8.0'
      endpoints: {
        status: '/status',
        meta: '/meta',
        versions: '/versions',
        versionInfo: (version) => `/versions/${version}`,
        versionChanges: (version) => `/versions/${version}/changes`,
        search: (version) => `/versions/${version}/skills`,
        getSkill: (version, skillId) => `/versions/${version}/skills/${skillId}`,
        getRelatedSkills: (version) => `/versions/${version}/related`,
        extractSkills: (version) => `/versions/${version}/extract`,
        extractSkillsWithTrace: (version) => `/versions/${version}/extract/trace`
      }
    },
    
    // Titles API (if needed)
    titles: {
      basePath: '/titles',
      version: 'latest',
      endpoints: {
        // Add title-specific endpoints if needed
      }
    }
  },
  
  // Default request settings
  defaults: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': '' // Will be set by the service
    },
    timeout: 30000 // 30 seconds
  },
  
  // Helper methods for building URLs
  getSkillsUrl(endpoint) {
    return `${this.api.baseUrl}${this.api.skills.basePath}${endpoint}`;
  },
  
  getTitlesUrl(endpoint) {
    return `${this.api.baseUrl}${this.api.titles.basePath}${endpoint}`;
  }
};
