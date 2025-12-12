import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("Environment loaded.");
console.log("Artificial Intelligence Key present:", !!(process.env.NOVITA_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY));

// Mock User Model and DB for the service if needed (though we are only testing the analysis method)
// The service usually imports User model. We might need to mock database connection if the service inits it.
// EnhancedAICareerCoachService lazy loads most things.

async function testAnalysis() {
    try {
        console.log("Importing EnhancedAICareerCoachService...");
        const { default: aiCoach } = await import('../src/utils/ai/enhancedAICareerCoach.service.js');

        const sampleResumeText = `
    PETER M. KARINGITHI
    Software Engineer & Full Stack Developer
    Nairobi, Kenya
    
    SKILLS
    - JavaScript, React, Node.js, Express, MongoDB
    - Python, Django, Flask
    - DevOps: Docker, Kubernetes, AWS
    - Tools: Git, GitHub, VS Code
    
    EXPERIENCE
    Senior Developer at Tech Corp (2020 - Present)
    - Led a team of 5 developers to build a SaaS platform.
    - Improved system performance by 40% using Redis caching.
    - Implemented CI/CD pipelines reducing deployment time by 50%.
    
    EDUCATION
    BSc Computer Science, University of Nairobi
    `;

        console.log("Starting analysis test...");
        console.log("Input text length:", sampleResumeText.length);

        // We are testing analyzeDocumentContent directly
        // This methods uses LLM to extract skills.

        // Note: We need a fake userId string
        const fakeUserId = "test-user-id";

        const result = await aiCoach.analyzeDocumentContent(sampleResumeText, fakeUserId, {
            documentType: 'resume',
            filename: 'test_resume.txt'
        });

        console.log("\n--- ANALYSIS RESULT ---");
        console.log("Skills found:", result.skills ? result.skills.length : 0);

        if (result.skills && result.skills.length > 0) {
            console.log("First 5 skills:", result.skills.slice(0, 5));
        } else {
            console.log("No skills found. Check API keys or AI service response.");
            console.log("Full Result:", JSON.stringify(result, null, 2));
        }

        console.log("Summary:", result.summary ? "Present" : "Missing");

        if (process.exit) process.exit(0);

    } catch (error) {
        console.error("Test failed:", error);
        if (process.exit) process.exit(1);
    }
}

testAnalysis();
