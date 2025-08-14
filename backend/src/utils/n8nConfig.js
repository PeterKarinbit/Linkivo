// Simple n8n Configuration Script
// Copy-paste these configurations into your n8n nodes

export const n8nConfigs = {
  // Simple Memory Node Configuration
  simpleMemory: {
    sessionId: "{{ $json.sessionId || $json.sessionToken || $now.toMillis() + '_guest' }}",
    contextWindowLength: 50
  },

  // Set Node Configuration (if you need to set session ID manually)
  setSessionId: {
    values: {
      sessionId: "{{ $json.sessionId || $json.sessionToken || $now.toMillis() + '_' + ($json.userId || 'guest') }}"
    }
  },

  // AI Agent Node Configuration
  aiAgent: {
    model: "tngtech/deepseek-r1t2-chimera:free",
    temperature: 0.7,
    maxTokens: 2048,
    tools: [
      {
        name: "resume_refactor",
        description: "Refactor user resume to match job requirements"
      },
      {
        name: "cover_letter_generator", 
        description: "Generate personalized cover letter for job application"
      },
      {
        name: "skill_analyzer",
        description: "Analyze skill gaps and provide improvement suggestions"
      }
    ]
  },

  // Manual Approval Node Configuration
  manualApproval: {
    title: "Review Application",
    message: "Please review the AI-generated resume and cover letter before proceeding.",
    options: ["approve", "edit", "cancel"]
  },

  // Display Logic Node Configuration
  displayLogic: {
    expression: `
      const userConfirmation = $json.confirmation;
      const webhookData = $input.all()[0].json;
      
      if (userConfirmation === 'approve') {
        return { action: 'send_email', status: 'approved' };
      } else if (userConfirmation === 'edit') {
        return { action: 'edit_mode', status: 'editing' };
      } else {
        return { action: 'manual_apply', status: 'manual' };
      }
    `
  }
};

// Quick setup instructions
export const setupInstructions = `
🎯 QUICK N8N SETUP:

1. WEBHOOK NODE:
   - Method: POST
   - Copy the webhook URL

2. SIMPLE MEMORY NODE:
   - Session ID: {{ $json.sessionId || $json.sessionToken || $now.toMillis() + '_guest' }}
   - Context Window Length: 50

3. AI AGENT NODE:
   - Model: tngtech/deepseek-r1t2-chimera:free
   - Add your custom tools

4. MANUAL APPROVAL NODE:
   - Title: "Review Application"
   - Options: approve, edit, cancel

5. IF NODE:
   - Condition 1: {{ $json.action }} = "send_email"
   - Condition 2: {{ $json.action }} = "manual_apply"
   - Condition 3: {{ $json.action }} = "edit_mode"

That's it! The session token will be handled automatically.
`;

export default n8nConfigs; 