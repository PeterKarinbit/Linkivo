import 'dotenv/config';
import lightcastService from './src/services/lightcast/lightcast.service.js';

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

async function analyzeTvetTeacherSkills() {
  console.log('🔍 Analyzing TVET Teacher Skills and Salary Context...\n');

  try {
    // 1. Extract skills from the journal entry
    console.log('🔍 Extracting skills from journal entry...');
    const extractedSkills = await lightcastService.extractSkills(journalEntry, {
      confidenceThreshold: 0.7,
      language: 'en'
    });

    // 2. Get related skills for career development
    console.log('\n💼 Related Skills for Career Development:');
    const teachingSkills = await lightcastService.searchSkills({
      q: 'teaching technical education',
      limit: 5
    });

    const technicalSkills = await lightcastService.searchSkills({
      q: 'plumbing pipefitting',
      limit: 5
    });

    // 3. Display results
    console.log('\n📋 Extracted Skills from Journal:');
    extractedSkills.data.forEach((item, index) => {
      console.log(`- ${index + 1}. ${item.skill.name} (${item.type.name})`);
    });

    console.log('\n🎓 Teaching Skills to Develop:');
    teachingSkills.data.forEach((skill, index) => {
      console.log(`- ${index + 1}. ${skill.name} (${skill.type.name})`);
    });

    console.log('\n🔧 Technical Skills to Enhance:');
    technicalSkills.data.forEach((skill, index) => {
      console.log(`- ${index + 1}. ${skill.name} (${skill.type.name})`);
    });

    // 4. Salary context (from the journal entry)
    const salaryMatch = journalEntry.match(/(?:KES|Ksh|K\.?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
    if (salaryMatch) {
      console.log('\n💰 Salary Information (from journal entry):');
      salaryMatch.forEach((salary, index) => {
        console.log(`- ${index + 1}. ${salary}`);
      });
    }

    console.log('\n💡 Recommendation:');
    console.log('While Lightcast provides skill taxonomies, for detailed salary analysis you might want to:');
    console.log('1. Use a salary survey API or database');
    console.log('2. Check government labor statistics');
    console.log('3. Look for industry reports on TVET teacher compensation in Kenya');

  } catch (error) {
    console.error('\n❌ Error during analysis:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the analysis
analyzeTvetTeacherSkills();
