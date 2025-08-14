// AI Agent Tools for n8n integration

export const AI_AGENT_TOOLS = [
  {
    name: 'refactor_resume',
    description: 'Refactor user resume using AI to match job requirements',
    parameters: {
      type: 'object',
      properties: {
        resume: {
          type: 'string',
          description: 'The original resume text'
        },
        jobDescription: {
          type: 'string',
          description: 'The target job description'
        },
        templateType: {
          type: 'string',
          enum: ['modern', 'executive', 'creative', 'technical'],
          description: 'Resume template type'
        }
      },
      required: ['resume', 'jobDescription']
    }
  },
  {
    name: 'generate_cover_letter',
    description: 'Generate a cover letter for a specific job application',
    parameters: {
      type: 'object',
      properties: {
        resumeText: {
          type: 'string',
          description: 'The user resume text'
        },
        jobDescription: {
          type: 'string',
          description: 'The target job description'
        },
        companyName: {
          type: 'string',
          description: 'The company name'
        },
        jobTitle: {
          type: 'string',
          description: 'The job title'
        },
        templateType: {
          type: 'string',
          enum: ['standard', 'creative', 'technical'],
          description: 'Cover letter template type'
        }
      },
      required: ['resumeText', 'jobDescription', 'companyName', 'jobTitle']
    }
  },
  {
    name: 'analyze_resume_for_job',
    description: 'Analyze resume against job description and provide improvement suggestions',
    parameters: {
      type: 'object',
      properties: {
        resumeText: {
          type: 'string',
          description: 'The user resume text'
        },
        jobDescription: {
          type: 'string',
          description: 'The target job description'
        }
      },
      required: ['resumeText', 'jobDescription']
    }
  },
  {
    name: 'generate_pdf',
    description: 'Generate PDF for resume or cover letter',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['resume', 'cover-letter'],
          description: 'Type of document to generate'
        },
        data: {
          type: 'object',
          description: 'Document data for PDF generation'
        },
        templateType: {
          type: 'string',
          enum: ['modern', 'executive', 'creative', 'technical'],
          description: 'Template type for PDF'
        }
      },
      required: ['type', 'data']
    }
  },
  {
    name: 'send_application_email',
    description: 'Send job application via email',
    parameters: {
      type: 'object',
      properties: {
        recipientEmail: {
          type: 'string',
          description: 'Recipient email address'
        },
        recipientName: {
          type: 'string',
          description: 'Recipient name'
        },
        recipientTitle: {
          type: 'string',
          description: 'Recipient job title'
        },
        jobTitle: {
          type: 'string',
          description: 'Job title being applied for'
        },
        companyName: {
          type: 'string',
          description: 'Company name'
        },
        coverLetter: {
          type: 'string',
          description: 'Cover letter content'
        },
        resumeAttachment: {
          type: 'string',
          description: 'Resume PDF as base64'
        }
      },
      required: ['recipientEmail', 'jobTitle', 'companyName']
    }
  },
  {
    name: 'track_application',
    description: 'Track job application in database',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        jobId: {
          type: 'string',
          description: 'Job ID'
        },
        jobTitle: {
          type: 'string',
          description: 'Job title'
        },
        companyName: {
          type: 'string',
          description: 'Company name'
        },
        applicationMethod: {
          type: 'string',
          enum: ['email', 'manual', 'linkedin', 'indeed'],
          description: 'How the application was submitted'
        },
        status: {
          type: 'string',
          enum: ['pending', 'applied', 'under_review', 'interview_scheduled'],
          description: 'Application status'
        }
      },
      required: ['userId', 'jobId', 'jobTitle', 'companyName']
    }
  }
];

// Tool execution functions
export const executeTool = async (toolName, parameters) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  
  switch (toolName) {
    case 'refactor_resume':
      return await fetch(`${baseUrl}/api/v1/applications/refactor-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(res => res.json());
      
    case 'generate_cover_letter':
      return await fetch(`${baseUrl}/api/v1/applications/generate-cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(res => res.json());
      
    case 'analyze_resume_for_job':
      return await fetch(`${baseUrl}/api/v1/applications/analyze-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(res => res.json());
      
    case 'generate_pdf':
      return await fetch(`${baseUrl}/api/v1/applications/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(res => res.blob());
      
    case 'send_application_email':
      return await fetch(`${baseUrl}/api/v1/applications/send-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(res => res.json());
      
    case 'track_application':
      return await fetch(`${baseUrl}/api/v1/applications/create-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(res => res.json());
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}; 