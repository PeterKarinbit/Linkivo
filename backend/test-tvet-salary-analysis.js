import 'dotenv/config';
import lightcastService from './src/services/lightcast/lightcast.service.js';
import EnhancedAICareerCoachService from './src/utils/ai/enhancedAICareerCoach.service.js';

// Sample journal entry for a TVET entry-level teacher in Kenya
const journalEntry = `
  I recently started my career as an entry-level TVET teacher in Nairobi, Kenya. 
  My monthly salary is KES 35,000, which is quite challenging given the rising cost of living. 
  I have a diploma in technical education and teach plumbing and pipefitting. 
  Most of my colleagues with similar qualifications earn between KES 30,000 to KES 45,000 monthly.
  
  The salary seems low compared to other technical fields, but I'm passionate about teaching. 
  I'm considering additional certifications in advanced plumbing or renewable energy to increase 
  my earning potential. The job market is competitive, and many TVET teachers take on private 
  tutoring or consultancy work to supplement their income.
`;

async function analyzeTvetTeacherSalary() {
  console.log('📊 Analyzing TVET Teacher Salary in Kenya...\n');

  try {
    // 1. Extract skills and entities from the journal entry
    console.log('🔍 Extracting skills and salary information...');
    const analysis = await EnhancedAICareerCoachService.analyzeJournalEntryWithMarketContext(
      journalEntry,
      'tvet-teacher-kenya'
    );

    // 2. Extract salary information
    const salaryMatch = journalEntry.match(/(?:KES|Ksh|K\.?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
    const salaries = salaryMap(salaryMatch || []);
    
    // 3. Extract skills
    const skills = analysis.SKILLS_MENTIONED || [];
    
    // 4. Get market data for TVET teachers in Kenya
    console.log('\n📈 Fetching market data for TVET teachers in Kenya...');
    const marketData = await getTvetTeacherMarketData();

    // 5. Generate analysis
    console.log('\n📝 Analysis Results:');
    console.log('='.repeat(50));
    
    // Salary Analysis
    console.log('\n💰 Salary Information:');
    if (salaries.length > 0) {
      const averageSalary = salaries.reduce((a, b) => a + b, 0) / salaries.length;
      console.log(`- Your mentioned salary: KES ${salaries[0].toLocaleString()}/month`);
      console.log(`- Salary range mentioned: KES ${Math.min(...salaries).toLocaleString()} - KES ${Math.max(...salaries).toLocaleString()}/month`);
      console.log(`- Average salary from journal: KES ${averageSalary.toLocaleString()}/month`);
    }
    
    if (marketData) {
      console.log(`- Market average for TVET teachers in Kenya: KES ${marketData.averageSalary.toLocaleString()}/month`);
      console.log(`- Experience premium (5+ years): +${marketData.experiencePremium}%`);
      console.log(`- High-demand specialization premium: +${marketData.specializationPremium}%`);
    }

    // Skills Analysis
    if (skills.length > 0) {
      console.log('\n🛠️ Skills Identified:');
      skills.forEach((skill, index) => {
        console.log(`- ${index + 1}. ${skill.name} (${skill.relevance > 0.7 ? 'High' : 'Medium'} relevance)`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('- Consider obtaining additional certifications in high-demand areas like renewable energy');
    console.log('- Explore opportunities in private TVET institutions which may offer better compensation');
    console.log('- Look into government programs that provide salary top-ups for technical instructors');
    console.log('- Consider part-time consulting in your technical field to supplement income');
    console.log('- Join professional teaching associations for networking and professional development');

    console.log('\n🎉 Analysis complete!');

  } catch (error) {
    console.error('\n❌ Error during analysis:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Helper function to extract and clean salary numbers
function salaryMap(salaryStrings) {
  return salaryStrings.map(s => {
    // Remove currency symbols and commas, then parse as float
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }).filter(n => n > 0);
}

// Mock function to simulate fetching market data
async function getTvetTeacherMarketData() {
  // In a real implementation, this would fetch from a salary database or API
  return {
    averageSalary: 40000,  // KES
    experiencePremium: 25,  // %
    specializationPremium: 20,  // %
    lastUpdated: '2025-09-01',
    source: 'Kenya National Bureau of Statistics (KNBS)'
  };
}

// Run the analysis
analyzeTvetTeacherSalary();
