import compensationService from '../compensation.service';

describe('CompensationService', () => {
  // Test getting SOC version
  it('should get SOC version', async () => {
    const socVersion = await compensationService.getSocVersion();
    expect(socVersion).toBeDefined();
    console.log('SOC Version:', socVersion);
  });

  // Test getting datarun version
  it('should get datarun version', async () => {
    const datarun = await compensationService.getDatarunVersion();
    expect(datarun).toBeDefined();
    console.log('Datarun Version:', datarun);
  });

  // Test getting geographies
  it('should get geographies', async () => {
    const geographies = await compensationService.getGeographies();
    expect(Array.isArray(geographies)).toBe(true);
    console.log('First 5 geographies:', geographies.slice(0, 5));
  });

  // Test getting salary estimate (using a common job title ID and MSA)
  it('should get salary estimate', async () => {
    const estimate = await compensationService.getEstimate({
      titles: ['ETCC677E49FBA73537'], // Example title ID for Software Developer
      msa: '42660' // Seattle-Tacoma-Bellevue, WA
    });
    
    expect(estimate).toBeDefined();
    expect(estimate.regional_estimate).toBeDefined();
    console.log('Salary Estimate:', JSON.stringify(estimate, null, 2));
  });

  // Test getting estimates by experience
  it('should get estimates by experience', async () => {
    const estimates = await compensationService.getEstimateByExperience(
      {
        titles: ['ETCC677E49FBA73537'], // Example title ID for Software Developer
        msa: '42660' // Seattle-Tacoma-Bellevue, WA
      },
      [1, 3, 5] // Years of experience
    );
    
    expect(estimates).toBeDefined();
    expect(estimates.by_experience).toBeInstanceOf(Array);
    console.log('Estimates by Experience:', JSON.stringify(estimates, null, 2));
  });
});
