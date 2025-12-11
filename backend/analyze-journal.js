import lightcastService from './src/services/lightcast/lightcast.service.js';

// Sample journal entry (summarized for token efficiency)
const journalEntry = `
I'm a Kenyan entrepreneur and tech enthusiast pursuing Mechanical Engineering. 
Founder of Chiqara e-commerce and Research Consultant at WorldQuant LLC. 
Skills: Python programming, predictive modeling, Arduino, hardware projects, 
AutoCAD, Inventor, TinkerCAD, e-commerce management, business strategy.
Interests: Business, finance, engineering design, hiking, chess.
`;

// Skills to analyze (extracted from journal)
const userSkills = [
  'Python Programming',
  'Predictive Modeling',
  'Arduino',
  'Hardware Engineering',
  'AutoCAD',
  'Inventor',
  'TinkerCAD',
  'E-commerce Management',
  'Business Strategy',
  'Research',
  'Data Analysis',
  'Mechanical Engineering'
];

async function analyzeSkills() {
  console.log('🔍 Analyzing your skills and suggesting growth areas...\n');
  
  try {
    // 1. Extract skills from the journal entry
    console.log('📝 Extracting skills from your journal entry...');
    const extractedSkills = await lightcastService.extractSkills(journalEntry, {
      confidenceThreshold: 0.7,
      language: 'en'
    });
    
    const extractedSkillNames = extractedSkills.map(s => s.skill.name);
    console.log('✅ Extracted skills:', extractedSkillNames.join(', '));

    // 2. Get details for each skill
    console.log('\n📊 Analyzing your current skills...');
    const skillDetails = [];
    
    for (const skill of userSkills) {
      try {
        const searchResults = await lightcastService.searchSkills({
          q: skill,
          limit: 1,
          typeIds: 'ST1,ST2' // Specialized and Common skills
        });
        
        if (searchResults.data && searchResults.data.length > 0) {
          const skillId = searchResults.data[0].id;
          const details = await lightcastService.getSkillDetails(skillId);
          const related = await lightcastService.getRelatedSkills(skillId, { limit: 5 });
          
          skillDetails.push({
            name: details.data.name,
            type: details.data.type.name,
            description: details.data.description || 'No description available',
            related: related.data.map(r => r.name)
          });
          
          console.log(`   • ${details.data.name} (${details.data.type.name})`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Could not fetch details for: ${skill}`);
      }
    }

    // 3. Identify potential growth areas
    console.log('\n🚀 Potential Growth Areas:');
    const growthAreas = [
      'Cloud Computing',
      'Machine Learning',
      'Data Science',
      'Product Management',
      'User Experience (UX) Design',
      'Agile Methodologies',
      'Financial Analysis',
      'Supply Chain Management',
      'Internet of Things (IoT)',
      'Robotics'
    ];

    console.log('Based on your current skills, consider developing:');
    growthAreas.slice(0, 5).forEach((area, index) => {
      console.log(`   ${index + 1}. ${area}`);
    });

    // 4. Get related skills to explore
    console.log('\n🔍 Related skills to explore:');
    const allRelated = new Set();
    skillDetails.forEach(skill => {
      skill.related.forEach(relatedSkill => {
        if (!userSkills.some(s => relatedSkill.toLowerCase().includes(s.toLowerCase()))) {
          allRelated.add(relatedSkill);
        }
      });
    });
    
    console.log(Array.from(allRelated).slice(0, 10).join('\n   • '));

    // 5. Career path suggestions
    console.log('\n💡 Potential Career Paths:');
    const careerPaths = [
      'Technical Product Manager',
      'Hardware Engineer',
      'Data Scientist',
      'E-commerce Entrepreneur',
      'Research & Development Engineer'
    ];
    
    careerPaths.forEach((path, index) => {
      console.log(`   ${index + 1}. ${path}`);
    });

  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    if (error.details) {
      console.error('Error details:', JSON.stringify(error.details, null, 2));
    }
  }
}

// Run the analysis
analyzeSkills();
