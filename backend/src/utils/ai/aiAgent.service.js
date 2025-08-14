import OpenAI from "openai";
import { refactorResume, generateCoverLetter, analyzeResumeForJob } from './resumeRefactor.service.js';
import GmailService from '../email/gmail.service.js';
import PDFGeneratorService from '../pdf/generator.service.js';

class AIAgentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://openrouter.ai/api/v1"
    });
  }

  /**
   * Main AI Agent workflow - handles post-webhook processing
   * @param {Object} webhookData - Data from n8n webhook
   * @returns {Promise<Object>} Processing results
   */
  async processWebhookData(webhookData) {
    const { resume, userId, skills, experience, scrapedJobs, preferences } = webhookData;
    
    console.log('[AI AGENT] Starting workflow for user:', userId);
    
    try {
      // Branch 1: Resume & Cover Letter Refactor
      const refactorResults = await this.branch1_ResumeRefactor(resume, scrapedJobs[0]);
      
      // Branch 2: Email Drafting (if user has Gmail connected)
      const emailResults = await this.branch2_EmailDrafting(refactorResults, scrapedJobs[0]);
      
      // Branch 3: Manual Apply Instructions
      const manualResults = await this.branch3_ManualApply(scrapedJobs[0], refactorResults);
      
      // Generate compatibility score and feedback
      const compatibilityResults = await this.generateCompatibilityScore(resume, scrapedJobs[0], skills);
      
      return {
        success: true,
        branches: {
          resumeRefactor: refactorResults,
          emailDrafting: emailResults,
          manualApply: manualResults
        },
        compatibility: compatibilityResults,
        monetizationGates: this.checkMonetizationGates(userId),
        nextSteps: this.generateNextSteps(refactorResults, emailResults, manualResults)
      };
      
    } catch (error) {
      console.error('[AI AGENT] Workflow error:', error);
      return {
        success: false,
        error: error.message,
        fallback: await this.generateFallbackResponse(resume, scrapedJobs[0])
      };
    }
  }

  /**
   * Branch 1: Resume & Cover Letter Refactor
   */
  async branch1_ResumeRefactor(resume, jobData) {
    console.log('[AI AGENT] Branch 1: Resume Refactoring');
    
    const jobDescription = jobData?.description || '';
    const companyName = jobData?.company || '';
    const jobTitle = jobData?.title || '';
    
    // Analyze resume for job match
    const analysis = await analyzeResumeForJob(resume, jobDescription);
    
    // Refactor resume with AI
    const refactoredResume = await refactorResume(resume, jobDescription, 'modern');
    
    // Generate cover letter
    const coverLetter = await generateCoverLetter(resume, jobDescription, companyName, jobTitle, 'standard');
    
    // Generate PDFs
    const resumePDF = await PDFGeneratorService.generateResumePDF({
      personalInfo: {
        name: 'Your Name',
        email: 'your.email@example.com',
        phone: 'Your Phone',
        location: 'Your Location'
      },
      summary: refactoredResume.refactoredResume,
      experience: [],
      education: [],
      skills: analysis.matchingSkills
    }, 'modern');
    
    const coverLetterPDF = await PDFGeneratorService.generateCoverLetterPDF({
      date: new Date().toLocaleDateString(),
      recipientName: 'Hiring Manager',
      recipientTitle: 'HR Manager',
      companyName,
      companyAddress: 'Company Address',
      content: coverLetter,
      senderName: 'Your Name',
      senderEmail: 'your.email@example.com',
      senderPhone: 'Your Phone'
    });
    
    return {
      analysis,
      refactoredResume: refactoredResume.refactoredResume,
      coverLetter,
      improvements: refactoredResume.improvements,
      pdfs: {
        resume: resumePDF,
        coverLetter: coverLetterPDF
      },
      userConsentRequired: true,
      consentPrompt: `AI will draft a job application for ${jobTitle} at ${companyName}. Proceed?`
    };
  }

  /**
   * Branch 2: Email Drafting via Gmail API
   */
  async branch2_EmailDrafting(refactorResults, jobData) {
    console.log('[AI AGENT] Branch 2: Email Drafting');
    
    const { refactoredResume, coverLetter, pdfs } = refactorResults;
    const { company, title, url } = jobData;
    
    // Check if user has Gmail connected
    const hasGmailAccess = false; // TODO: Check user's Gmail connection
    
    if (!hasGmailAccess) {
      return {
        available: false,
        message: 'Connect Gmail to enable auto-email applications',
        setupRequired: true
      };
    }
    
    // Draft email content
    const emailContent = await this.draftEmailContent(refactoredResume, coverLetter, jobData);
    
    // Generate email subject
    const emailSubject = `Application for ${title} position - [Your Name]`;
    
    return {
      available: true,
      emailContent,
      emailSubject,
      attachments: pdfs,
      autoSendAvailable: true,
      userConsentRequired: true,
      consentPrompt: `Send application email to ${company} for ${title} position?`
    };
  }

  /**
   * Branch 3: Manual Apply Instructions
   */
  async branch3_ManualApply(jobData, refactorResults) {
    console.log('[AI AGENT] Branch 3: Manual Apply');
    
    const { url, company, title, description } = jobData;
    const { analysis } = refactorResults;
    
    // Generate application instructions
    const instructions = await this.generateApplicationInstructions(jobData, analysis);
    
    // Calculate compatibility score
    const compatibilityScore = analysis.matchPercentage;
    
    return {
      jobUrl: url,
      company,
      title,
      instructions,
      compatibilityScore,
      skillMatch: analysis.matchingSkills,
      missingSkills: analysis.missingSkills,
      pdfs: refactorResults.pdfs,
      markAsApplied: false
    };
  }

  /**
   * Generate compatibility score and feedback
   */
  async generateCompatibilityScore(resume, jobData, userSkills) {
    const jobDescription = jobData?.description || '';
    const analysis = await analyzeResumeForJob(resume, jobDescription);
    
    const feedback = await this.openai.chat.completions.create({
      model: "tngtech/deepseek-r1t2-chimera:free",
      messages: [
        {
          role: "system",
          content: "You are a career coach providing feedback on job applications."
        },
        {
          role: "user",
          content: `Analyze this job application and provide feedback:
          
          Job: ${jobData?.title} at ${jobData?.company}
          Job Description: ${jobDescription}
          User Skills: ${userSkills?.join(', ')}
          Match Percentage: ${analysis.matchPercentage}%
          
          Provide:
          1. Why they're a good match
          2. Areas for improvement
          3. Specific suggestions
          4. Confidence level (1-10)`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    return {
      score: analysis.matchPercentage,
      feedback: feedback.choices[0].message.content,
      matchingSkills: analysis.matchingSkills,
      missingSkills: analysis.missingSkills,
      suggestions: analysis.suggestions
    };
  }

  /**
   * Check monetization gates based on user plan
   */
  checkMonetizationGates(userId) {
    // TODO: Check user's subscription plan
    const userPlan = 'free'; // Mock for now
    
    return {
      plan: userPlan,
      gates: {
        autoSend: userPlan === 'premium',
        unlimitedApplications: userPlan === 'premium',
        advancedAnalytics: userPlan === 'premium',
        prioritySupport: userPlan === 'premium',
        customTemplates: userPlan === 'premium'
      },
      upgradePrompt: userPlan === 'free' ? 'Upgrade to Premium for auto-send and unlimited applications' : null
    };
  }

  /**
   * Generate next steps for user
   */
  generateNextSteps(refactorResults, emailResults, manualResults) {
    const steps = [];
    
    if (refactorResults.userConsentRequired) {
      steps.push({
        action: 'review_resume',
        title: 'Review AI-Refactored Resume',
        description: 'Preview and edit your enhanced resume before applying',
        priority: 'high'
      });
    }
    
    if (emailResults.available && emailResults.userConsentRequired) {
      steps.push({
        action: 'send_email',
        title: 'Send Application Email',
        description: 'Review and send your application via email',
        priority: 'high'
      });
    }
    
    if (manualResults.jobUrl) {
      steps.push({
        action: 'manual_apply',
        title: 'Apply Manually',
        description: 'Use the provided link to apply directly',
        priority: 'medium'
      });
    }
    
    return steps;
  }

  /**
   * Draft email content for job application
   */
  async draftEmailContent(refactoredResume, coverLetter, jobData) {
    const { company, title } = jobData;
    
    return `Dear Hiring Manager,

I am writing to express my interest in the ${title} position at ${company}.

${coverLetter}

I have attached my resume and cover letter for your review.

I look forward to discussing how my skills and experience can contribute to your team.

Best regards,
[Your Name]`;
  }

  /**
   * Generate application instructions for manual apply
   */
  async generateApplicationInstructions(jobData, analysis) {
    const { company, title, url } = jobData;
    
    return `To apply for ${title} at ${company}:

1. Click the job link: ${url}
2. Upload your AI-enhanced resume and cover letter
3. Fill out the application form
4. Submit your application
5. Mark as applied in Linkivo for tracking

Your compatibility score: ${analysis.matchPercentage}%
Matching skills: ${analysis.matchingSkills.join(', ')}
Areas to highlight: ${analysis.suggestions.join(', ')}`;
  }

  /**
   * Generate fallback response if workflow fails
   */
  async generateFallbackResponse(resume, jobData) {
    return {
      message: 'AI processing encountered an issue. Here are manual steps:',
      steps: [
        'Review the job description manually',
        'Update your resume with relevant keywords',
        'Draft a cover letter highlighting your experience',
        'Apply through the company website'
      ],
      jobUrl: jobData?.url,
      company: jobData?.company,
      title: jobData?.title
    };
  }
}

export default new AIAgentService(); 