// n8n Display Logic Code for Step 3
// This code handles the display logic after user confirmation

/**
 * Main display logic function for n8n
 * Handles email drafting and manual apply display
 */
function handleDisplayLogic(webhookData, userConfirmation) {
  try {
    // Extract data from webhook and AI Agent
    const {
      resume,
      userId,
      jobTitle,
      companyName,
      jobDescription,
      jobUrl,
      recipientEmail,
      recipientName,
      applicationMethod
    } = webhookData;

    // Extract AI Agent results
    const aiResults = webhookData.aiAgentResults || {};
    const {
      refactoredResume,
      coverLetter,
      compatibilityScore,
      matchingSkills,
      missingSkills
    } = aiResults;

    // Check user confirmation
    if (userConfirmation === 'cancel') {
      return {
        action: 'cancelled',
        message: 'Application cancelled by user',
        status: 'cancelled'
      };
    }

    // Branch logic based on application method and email availability
    if (applicationMethod === 'email' && recipientEmail) {
      return handleEmailApplication(webhookData, aiResults, userConfirmation);
    } else {
      return handleManualApplication(webhookData, aiResults);
    }

  } catch (error) {
    return {
      action: 'error',
      message: 'Error in display logic: ' + error.message,
      status: 'error'
    };
  }
}

/**
 * Handle email application path
 */
function handleEmailApplication(webhookData, aiResults, userConfirmation) {
  const {
    recipientEmail,
    recipientName,
    jobTitle,
    companyName,
    refactoredResume,
    coverLetter
  } = { ...webhookData, ...aiResults };

  // If user wants to edit first
  if (userConfirmation === 'edit') {
    return {
      action: 'edit_mode',
      message: 'User chose to edit application',
      displayData: {
        refactoredResume: refactoredResume || webhookData.resume,
        coverLetter: coverLetter || 'Generated cover letter',
        jobTitle,
        companyName,
        recipientEmail,
        recipientName,
        editMode: true
      },
      status: 'editing'
    };
  }

  // If user approved sending email
  if (userConfirmation === 'approve') {
    return {
      action: 'send_email',
      message: 'User approved email application',
      emailData: {
        to: recipientEmail,
        subject: `Application for ${jobTitle} position - [Your Name]`,
        body: generateEmailBody(coverLetter, jobTitle, companyName),
        attachments: [
          {
            filename: 'resume.pdf',
            content: refactoredResume || webhookData.resume
          },
          {
            filename: 'cover_letter.pdf', 
            content: coverLetter
          }
        ]
      },
      status: 'approved'
    };
  }

  return {
    action: 'manual_fallback',
    message: 'Email not available, switching to manual apply',
    displayData: generateManualApplyDisplay(webhookData, aiResults)
  };
}

/**
 * Handle manual application path
 */
function handleManualApplication(webhookData, aiResults) {
  return {
    action: 'manual_apply',
    message: 'Manual application mode',
    displayData: generateManualApplyDisplay(webhookData, aiResults),
    status: 'manual'
  };
}

/**
 * Generate display data for manual application
 */
function generateManualApplyDisplay(webhookData, aiResults) {
  const {
    jobTitle,
    companyName,
    jobUrl,
    jobDescription
  } = webhookData;

  const {
    refactoredResume,
    coverLetter,
    compatibilityScore,
    matchingSkills,
    missingSkills
  } = aiResults;

  return {
    // Job Information
    jobInfo: {
      title: jobTitle,
      company: companyName,
      url: jobUrl,
      description: jobDescription
    },

    // AI Generated Content
    generatedContent: {
      refactoredResume: refactoredResume || webhookData.resume,
      coverLetter: coverLetter || 'Generated cover letter',
      compatibilityScore: compatibilityScore || 75,
      matchingSkills: matchingSkills || [],
      missingSkills: missingSkills || []
    },

    // Application Instructions
    instructions: [
      `1. Click the job link: ${jobUrl}`,
      '2. Upload your AI-enhanced resume and cover letter',
      '3. Fill out the application form',
      '4. Submit your application',
      '5. Mark as applied in Linkivo for tracking'
    ],

    // Download Links
    downloads: {
      resumePDF: generatePDFDownload('resume', refactoredResume || webhookData.resume),
      coverLetterPDF: generatePDFDownload('cover-letter', coverLetter)
    },

    // Success Tips
    tips: [
      `Your compatibility score: ${compatibilityScore || 75}%`,
      `Highlight these skills: ${(matchingSkills || []).join(', ')}`,
      `Consider learning: ${(missingSkills || []).join(', ')}`
    ]
  };
}

/**
 * Generate email body content
 */
function generateEmailBody(coverLetter, jobTitle, companyName) {
  return `Dear Hiring Manager,

I am writing to express my interest in the ${jobTitle} position at ${companyName}.

${coverLetter}

I have attached my resume and cover letter for your review.

I look forward to discussing how my skills and experience can contribute to your team.

Best regards,
[Your Name]`;
}

/**
 * Generate PDF download links
 */
function generatePDFDownload(type, content) {
  return {
    type: type,
    filename: `${type}_${Date.now()}.pdf`,
    content: content,
    downloadUrl: `/api/v1/applications/download/${type}/${Date.now()}`
  };
}

/**
 * Display HTML for manual application
 */
function generateDisplayHTML(displayData) {
  return `
    <div class="application-results">
      <h2>Application for ${displayData.jobInfo.title} at ${displayData.jobInfo.company}</h2>
      
      <div class="compatibility-score">
        <h3>Compatibility Score: ${displayData.generatedContent.compatibilityScore}%</h3>
        <div class="skills">
          <h4>Matching Skills:</h4>
          <div class="skill-tags">
            ${displayData.generatedContent.matchingSkills.map(skill => 
              `<span class="skill match">${skill}</span>`
            ).join('')}
          </div>
          
          <h4>Missing Skills:</h4>
          <div class="skill-tags">
            ${displayData.generatedContent.missingSkills.map(skill => 
              `<span class="skill missing">${skill}</span>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="application-actions">
        <a href="${displayData.jobInfo.url}" target="_blank" class="btn btn-primary">
          Apply Manually
        </a>
        
        <div class="downloads">
          <a href="${displayData.downloads.resumePDF.downloadUrl}" class="btn btn-secondary">
            Download Resume PDF
          </a>
          <a href="${displayData.downloads.coverLetterPDF.downloadUrl}" class="btn btn-secondary">
            Download Cover Letter PDF
          </a>
        </div>
      </div>

      <div class="instructions">
        <h3>Application Instructions:</h3>
        <ol>
          ${displayData.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
        </ol>
      </div>

      <div class="tips">
        <h3>Success Tips:</h3>
        <ul>
          ${displayData.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Export for n8n
module.exports = {
  handleDisplayLogic,
  generateDisplayHTML,
  generateManualApplyDisplay
};