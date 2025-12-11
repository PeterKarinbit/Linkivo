
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function testRoadmapPolling() {
    console.log('🚀 Starting Roadmap Polling Test...');

    try {
        // 1. Register a new user
        const timestamp = Date.now();
        const email = `test_polling_${timestamp}@example.com`;
        const password = 'TestPassword123!';

        console.log(`\n👤 Registering user: ${email}...`);
        const registerResponse = await axios.post(`${API_URL}/users/signup`, {
            email,
            password,
            role: 'jobSeeker',
            userProfile: { name: 'Test User' }
        });

        const { accessToken } = registerResponse.data.data;
        const authHeaders = { headers: { 'Authorization': `Bearer ${accessToken}` } };

        // 2. Set Persona
        console.log('📝 Setting Persona...');
        await axios.post(`${API_URL}/enhanced-ai-career-coach/assessment`, {
            currentLevel: 'mid',
            targetRole: 'Senior Full Stack Developer',
            hoursPerWeek: 15,
            whyReasons: ['salary', 'growth']
        }, authHeaders);

        // 3. Trigger Roadmap Generation
        console.log('\n⚡ Triggering Roadmap Generation...');
        const start = Date.now();
        const triggerResponse = await axios.post(`${API_URL}/enhanced-ai-career-coach/roadmap`,
            { reason: 'test', timeBudget: 15 },
            authHeaders
        );

        console.log(`✅ Trigger Response: Status ${triggerResponse.status}`);
        console.log('   Body:', JSON.stringify(triggerResponse.data, null, 2));

        if (triggerResponse.status !== 202) {
            throw new Error(`Expected 202 Accepted, got ${triggerResponse.status}`);
        }

        // 4. Poll for completion
        console.log('\n⏳ Polling for completion (checking every 5s)...');

        let status = 'generating';
        let roadmap = null;
        let attempts = 0;
        const maxAttempts = 40; // Wait up to ~3 minutes

        while (status === 'generating' && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 5000));
            attempts++;

            process.stdout.write(`   Attempt ${attempts}: `);

            const statusResponse = await axios.get(`${API_URL}/enhanced-ai-career-coach/roadmap/status`, authHeaders);
            status = statusResponse.data.data.status;
            process.stdout.write(`${status}\n`);

            if (status === 'completed') {
                const rResponse = await axios.get(`${API_URL}/enhanced-ai-career-coach/roadmap`, authHeaders);
                roadmap = rResponse.data.data.roadmap;
                break;
            } else if (status === 'failed') {
                throw new Error('Roadmap generation failed on server side.');
            }
        }

        if (!roadmap) {
            throw new Error('Timed out waiting for roadmap generation');
        }

        const duration = (Date.now() - start) / 1000;
        console.log(`\n🎉 Roadmap Generated Successfully in ${duration.toFixed(1)}s!`);
        console.log('------------------------------------------------');
        console.log(JSON.stringify(roadmap, null, 2));
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testRoadmapPolling();
