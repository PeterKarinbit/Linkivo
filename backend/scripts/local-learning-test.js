/**
 * Local Learning Recommendation Test
 * 
 * This script demonstrates a simplified learning recommendation system
 * using local NLP processing (no API keys required).
 */

import natural from 'natural';
const { TfIdf, WordTokenizer, PorterStemmer } = natural;

// Sample course catalog (in a real app, this would come from Coursera API)
const COURSES = [
  {
    id: 'ml-course',
    name: 'Introduction to Machine Learning',
    description: 'Learn the fundamentals of machine learning and AI',
    topics: ['machine learning', 'ai', 'data science', 'algorithms'],
    difficulty: 'beginner',
    duration: '8 weeks'
  },
  {
    id: 'python-basics',
    name: 'Python for Beginners',
    description: 'Learn Python programming from scratch',
    topics: ['python', 'programming', 'coding'],
    difficulty: 'beginner',
    duration: '6 weeks'
  },
  {
    id: 'web-dev',
    name: 'Full Stack Web Development',
    description: 'Build modern web applications with React and Node.js',
    topics: ['web development', 'javascript', 'react', 'node.js'],
    difficulty: 'intermediate',
    duration: '10 weeks'
  },
  {
    id: 'data-science',
    name: 'Data Science Fundamentals',
    description: 'Learn data analysis and visualization',
    topics: ['data science', 'python', 'pandas', 'visualization', 'statistics'],
    difficulty: 'intermediate',
    duration: '8 weeks'
  },
  {
    id: 'cloud-computing',
    name: 'Cloud Computing with AWS',
    description: 'Learn cloud infrastructure and services with AWS',
    topics: ['cloud computing', 'aws', 'devops', 'infrastructure'],
    difficulty: 'intermediate',
    duration: '6 weeks'
  }
];

/**
 * Simple NLP-based learning needs analyzer
 */
class LearningAnalyzer {
  constructor() {
    this.tokenizer = new WordTokenizer();
    this.stemmer = PorterStemmer;
    this.tfidf = new TfIdf();
    
    // Train TF-IDF with course descriptions and topics
    COURSES.forEach(course => {
      const text = `${course.name} ${course.description} ${course.topics.join(' ')}`;
      this.tfidf.addDocument(text.toLowerCase());
    });
  }
  
  /**
   * Extract keywords from text
   */
  extractKeywords(text, count = 5) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    const stemmed = tokens.map(t => this.stemmer.stem(t));
    
    // Simple frequency analysis (can be enhanced)
    const freq = {};
    stemmed.forEach(word => {
      if (word.length > 3) { // Filter out short words
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    
    // Sort by frequency and return top N
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);
  }
  
  /**
   * Find relevant courses based on text input
   */
  findRelevantCourses(text, limit = 3) {
    const keywords = this.extractKeywords(text);
    console.log('🔍 Extracted keywords:', keywords.join(', '));
    
    // Score courses based on keyword matches
    const scoredCourses = COURSES.map(course => {
      const courseText = `${course.name} ${course.description} ${course.topics.join(' ')}`.toLowerCase();
      const courseWords = new Set(courseText.split(/\s+/));
      
      // Simple scoring: count matching keywords
      let score = keywords.filter(kw => courseWords.has(kw)).length;
      
      return { ...course, score };
    });
    
    // Sort by score and return top N
    return scoredCourses
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

/**
 * Run the test with sample journal entries
 */
async function runTest() {
  console.log('🚀 Local Learning Recommendation System\n');
  
  const analyzer = new LearningAnalyzer();
  
  // Test with sample journal entries
  const entries = [
    "I want to learn machine learning and Python for data analysis.",
    "I need to study data science to advance my career.",
    "Looking for courses on web development.",
    "I'm interested in artificial intelligence and neural networks.",
    "How can I get started with cloud computing?"
  ];
  
  for (const entry of entries) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 Journal Entry: "${entry}"`);
    console.log('='.repeat(80));
    
    const courses = analyzer.findRelevantCourses(entry);
    
    if (courses.length > 0) {
      console.log('\n🎓 Recommended Courses:');
      console.log('-'.repeat(40));
      
      courses.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.name}`);
        console.log('   ' + '─'.repeat(course.name.length + 2));
        console.log(`   ${course.description}`);
        console.log(`   📚 Topics: ${course.topics.join(', ')}`);
        console.log(`   ⚡ Level: ${course.difficulty}`);
        console.log(`   ⏱️  Duration: ${course.duration}`);
      });
    } else {
      console.log('\nNo relevant courses found for this entry.');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  console.log('🎉 Test completed!');
}

// Run the test
runTest().catch(console.error);
