// n8n AI Agent Custom Code Tools
// These functions can be executed directly in the n8n AI Agent node

/**
 * Tool 1: Resume Refactoring
 * Refactors user resume using AI to match job requirements
 */
async function refactorResume(resume, jobDescription, templateType = 'modern') {
  try {
    // Use the same AI model as your backend
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${$vars.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tngtech/deepseek-r1t2-chimera:free',
        messages: [
          {
            role: 'system',
            content: `You are a professional resume editor. Refactor the resume to match the job requirements using the ${templateType} template style. Return only the improved resume text.`
          },
          {
            role: 'user',
            content: `Resume: ${resume}\n\nJob Description: ${jobDescription}\n\nTemplate: ${templateType}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();
    const refactoredResume = data.choices[0].message.content;

    return {
      success: true,
      refactoredResume,
      template: templateType,
      improvements: [
        'Enhanced professional language',
        'Improved formatting',
        'Added relevant keywords',
        'Optimized for ATS systems'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool 2: Cover Letter Generation
 * Generates personalized cover letter for job application
 */
async function generateCoverLetter(resumeText, jobDescription, companyName, jobTitle, templateType = 'standard') {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${$vars.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tngtech/deepseek-r1t2-chimera:free',
        messages: [
          {
            role: 'system',
            content: `You are a professional cover letter writer. Create a compelling cover letter for the ${templateType} template style.`
          },
          {
            role: 'user',
            content: `Create a cover letter for:
            Job Title: ${jobTitle}
            Company: ${companyName}
            Job Description: ${jobDescription}
            Resume: ${resumeText.substring(0, 500)}...
            
            Template Style: ${templateType}
            Keep it professional and engaging.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const coverLetter = data.choices[0].message.content;

    return {
      success: true,
      coverLetter,
      template: templateType,
      companyName,
      jobTitle
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool 3: Resume Analysis
 * Analyzes resume against job description and provides insights
 */
async function analyzeResumeForJob(resumeText, jobDescription) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${$vars.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tngtech/deepseek-r1t2-chimera:free',
        messages: [
          {
            role: 'system',
            content: 'You are a career coach and resume analyzer. Provide detailed analysis in JSON format.'
          },
          {
            role: 'user',
            content: `Analyze this resume against the job description:
            
            Resume: ${resumeText}
            Job Description: ${jobDescription}
            
            Return JSON with:
            {
              "matchPercentage": number,
              "matchingSkills": ["skill1", "skill2"],
              "missingSkills": ["skill1", "skill2"],
              "suggestions": ["suggestion1", "suggestion2"],
              "keyImprovements": ["improvement1", "improvement2"]
            }`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse JSON from response
    const analysis = JSON.parse(analysisText);

    return {
      success: true,
      ...analysis
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fallback: {
        matchPercentage: 65,
        matchingSkills: ['JavaScript', 'Node.js'],
        missingSkills: ['React', 'TypeScript'],
        suggestions: ['Add React to your skill set', 'Learn TypeScript'],
        keyImprovements: ['Update resume format', 'Add more keywords']
      }
    };
  }
}

/**
 * Tool 4: PDF Generation (Mock)
 * Generates PDF content for resume or cover letter
 */
function generatePDF(type, data) {
  try {
    let pdfContent = '';
    
    if (type === 'resume') {
      pdfContent = `RESUME PDF\n\nName: ${data.personalInfo?.name || 'Your Name'}\nEmail: ${data.personalInfo?.email || 'your.email@example.com'}\n\n${data.summary || 'Resume content'}`;
    } else if (type === 'cover-letter') {
      pdfContent = `COVER LETTER PDF\n\nDate: ${data.date || new Date().toLocaleDateString()}\nTo: ${data.recipientName || 'Hiring Manager'}\nCompany: ${data.companyName || 'Company'}\n\n${data.content || 'Cover letter content'}`;
    }

    return {
      success: true,
      pdfContent,
      filename: `${type}_${Date.now()}.pdf`,
      type: type
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool 5: Application Tracking
 * Tracks job application in the system
 */
function trackApplication(userId, jobId, jobTitle, companyName, applicationMethod = 'manual') {
  try {
    const application = {
      _id: `app_${Date.now()}`,
      userId,
      jobId,
      jobTitle,
      companyName,
      applicationMethod,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // In n8n, you would typically save this to a database
    // For now, we'll return the application object
    return {
      success: true,
      application,
      message: 'Application tracked successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool 6: Email Draft Creation
 * Creates email draft for job application
 */
function createEmailDraft(recipientEmail, recipientName, jobTitle, companyName, coverLetter, resumeContent) {
  try {
    const emailSubject = `Application for ${jobTitle} position - [Your Name]`;
    const emailBody = `Dear ${recipientName || 'Hiring Manager'},

I am writing to express my interest in the ${jobTitle} position at ${companyName}.

${coverLetter}

I have attached my resume for your review.

I look forward to discussing how my skills and experience can contribute to your team.

Best regards,
[Your Name]`;

    return {
      success: true,
      email: {
        to: recipientEmail,
        subject: emailSubject,
        body: emailBody,
        attachments: ['resume.pdf', 'cover_letter.pdf']
      },
      message: 'Email draft created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool 7: Compatibility Score Calculator
 * Calculates job compatibility score
 */
function calculateCompatibilityScore(matchingSkills, missingSkills, jobRequirements) {
  try {
    const totalSkills = matchingSkills.length + missingSkills.length;
    const matchPercentage = totalSkills > 0 ? Math.round((matchingSkills.length / totalSkills) * 100) : 0;
    
    let score = matchPercentage;
    
    // Bonus points for having many matching skills
    if (matchingSkills.length >= 5) score += 10;
    if (matchingSkills.length >= 10) score += 15;
    
    // Penalty for many missing skills
    if (missingSkills.length >= 5) score -= 10;
    if (missingSkills.length >= 10) score -= 15;
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      success: true,
      score,
      matchPercentage,
      matchingSkills,
      missingSkills,
      recommendation: score >= 80 ? 'Excellent match' : 
                     score >= 60 ? 'Good match' : 
                     score >= 40 ? 'Fair match' : 'Poor match'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool 8: Follow-up Email Generator
 * Generates follow-up email content
 */
function generateFollowUpEmail(companyName, jobTitle, daysSinceApplied = 7) {
  try {
    const followUpContent = `Dear Hiring Manager,

I hope this email finds you well. I wanted to follow up on my application for the ${jobTitle} position at ${companyName} that I submitted ${daysSinceApplied} days ago.

I remain very interested in this opportunity and would welcome the chance to discuss how my skills and experience align with your team's needs.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

    return {
      success: true,
      followUpContent,
      suggestedSendDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      daysSinceApplied
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export all tools for n8n
module.exports = {
  refactorResume,
  generateCoverLetter,
  analyzeResumeForJob,
  generatePDF,
  trackApplication,
  createEmailDraft,
  calculateCompatibilityScore,
  generateFollowUpEmail
}; 