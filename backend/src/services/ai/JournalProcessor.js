import lightcastService from '../lightcast/lightcast.service.js';

class JournalProcessor {
  constructor() {
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY;
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }
  
  async _callOpenRouter(messages, options = {}) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linkivo.app',
        'X-Title': 'Linkivo Career Coach'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',  // Fast and cost-effective model
        messages,
        temperature: options.temperature || 0.4,
        max_tokens: 500,
        response_format: options.response_format,
        ...options
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
    }
    
    return response.json();
  }

  async shouldUseJobTaxonomy(content) {
    // Use a simpler, more direct prompt
    const prompt = `Does this text discuss careers, jobs, or skills? Reply with just JSON: {"useTaxonomy": boolean, "reason": string}
    
    Text: "${content.substring(0, 300)}"`;

    const response = await this._callOpenRouter(
      [{ role: 'user', content: prompt }],
      {
        response_format: { type: 'json_object' },
        temperature: 0.2
      }
    );

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.error('Error parsing LLM response:', e);
      return { useTaxonomy: false, reason: 'Error analyzing content' };
    }
  }

  async processJournalEntry(content) {
    // First, check if we should use the job taxonomy
    const { useTaxonomy, reason } = await this.shouldUseJobTaxonomy(content);
    
    let taxonomyResults = null;
    if (useTaxonomy) {
      console.log('Using job taxonomy:', reason);
      try {
        // Extract skills from the journal entry
        const skills = await lightcastService.extractSkills(content, {
          confidenceThreshold: 0.7,
        });

        if (skills && skills.length > 0) {
          // Get career suggestions based on skills
          const careerPaths = await lightcastService.suggestCareers({
            skills: skills.map(s => s.skill.name),
            limit: 3,
          });

          taxonomyResults = { 
            skills: skills.map(skill => ({
              name: skill.skill.name,
              type: skill.skill.type,
              confidence: skill.confidence
            })),
            careerPaths: careerPaths || []
          };
        } else {
          console.log('No skills extracted from the content');
          taxonomyResults = { skills: [], careerPaths: [] };
        }
      } catch (error) {
        console.error('Error using job taxonomy:', error.message);
        // Continue with null taxonomyResults to still generate a response
      }
    }

    // Generate a response using the LLM, including taxonomy results if available
    const response = await this.generateResponse(content, taxonomyResults);
    
    // Prepare the response object
    const result = {
      response,
      usedTaxonomy: useTaxonomy,
      taxonomyResults: null
    };
    
    // Safely add taxonomy results if available
    if (taxonomyResults) {
      result.taxonomyResults = {
        skills: Array.isArray(taxonomyResults.skills) 
          ? taxonomyResults.skills.map(skill => ({
              name: skill.skill?.name || skill.name || 'Unknown',
              type: skill.skill?.type || skill.type,
              confidence: skill.confidence
            }))
          : [],
        careerPaths: Array.isArray(taxonomyResults.careerPaths) 
          ? taxonomyResults.careerPaths 
          : []
      };
    }
    
    return result;
  }

  async generateResponse(content, taxonomyResults = null) {
    let prompt = `Respond to this journal entry in a supportive, coaching manner:\n\n${content}\n\n`;
    
    if (taxonomyResults) {
      prompt += `\nBased on the user's skills and experience, here are some relevant career paths they might consider:\n`;
      prompt += taxonomyResults.careerPaths.map((path, i) => 
        `${i+1}. ${path.title}: ${path.description}`
      ).join('\n');
      
      prompt += '\n\nMention these suggestions naturally in your response.';
    }

    const response = await this._callOpenRouter([
      {
        role: 'system',
        content: 'You are an AI career coach. Provide supportive, actionable advice.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  async generateCareerSuggestions(journalContent) {
    // Input validation
    if (!journalContent || typeof journalContent !== 'string') {
      throw new Error('Journal content must be a non-empty string');
    }

    // Truncate content to avoid exceeding token limits
    const truncatedContent = journalContent.substring(0, 4000);
    
    try {
      const prompt = `Analyze this journal entry and provide career development suggestions. ` +
        `Focus on skills, career paths, and actionable advice. Be specific and practical.\n\n` +
        `Format the response as a valid JSON object with these fields:\n` +
        `{\n` +
        `  "summary": "A concise 2-3 sentence summary of the main themes and content",\n` +
        `  "skillsIdentified": ["skill1", "skill2"],\n` +
        `  "careerSuggestions": [{\n` +
        `    "title": "Job Title",\n` +
        `    "reason": "1-2 sentences on why this might be a good fit based on the journal content",\n` +
        `    "confidence": 0-100\n` +
        `  }],\n` +
        `  "actionItems": ["Specific, actionable advice 1", "Specific, actionable advice 2"]\n` +
        `}\n\n` +
        `Journal Entry: "${truncatedContent}"`;

      const response = await this._callOpenRouter(
        [{ role: 'user', content: prompt }],
        {
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1000
        }
      );

      // Parse and validate the response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Ensure all required fields exist and are of the correct type
      return {
        summary: result.summary || 'No summary available',
        skillsIdentified: Array.isArray(result.skillsIdentified) ? 
          result.skillsIdentified.filter(skill => typeof skill === 'string') : [],
        careerSuggestions: Array.isArray(result.careerSuggestions) ? 
          result.careerSuggestions.map(suggestion => ({
            title: suggestion.title || 'Unknown Role',
            reason: suggestion.reason || 'No reason provided',
            confidence: Math.min(100, Math.max(0, parseInt(suggestion.confidence) || 50))
          })) : [],
        actionItems: Array.isArray(result.actionItems) ? 
          result.actionItems.filter(item => typeof item === 'string') : []
      };
    } catch (error) {
      console.error('Error generating career suggestions:', error);
      // Return a more detailed error response
      return {
        summary: 'Analysis unavailable due to an error',
        skillsIdentified: [],
        careerSuggestions: [],
        actionItems: [
          'We encountered an error processing your journal entry.',
          'Please try again later or contact support if the issue persists.'
        ],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

export default JournalProcessor;
