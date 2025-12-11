import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const USE_MOCK_DATA = true; // Always use mock data for now
const DEFAULT_LIMIT = 3;

// Mock data for testing with more diverse courses
function getMockCourses(query, limit = 3) {
  const mockCourses = [
    // Data Science & ML
    {
      id: 'ml-andrew-ng',
      title: 'Machine Learning by Andrew Ng',
      description: 'Learn the fundamentals of machine learning and get hands-on experience building models. Covers supervised learning, unsupervised learning, and best practices in AI and ML.',
      workload: '11 hours/week for 3 months',
      language: 'English',
      rating: 4.9,
      ratingCount: 120000,
      slug: 'machine-learning',
      url: 'https://www.coursera.org/learn/machine-learning',
      tags: ['machine learning', 'ai', 'data science', 'python', 'neural networks']
    },
    {
      id: 'data-science',
      title: 'Introduction to Data Science',
      description: 'Learn the basics of data science and how to analyze and visualize data using Python. Covers data manipulation, analysis, and visualization techniques.',
      workload: '8 hours/week for 3 months',
      language: 'English',
      rating: 4.7,
      ratingCount: 75000,
      slug: 'introduction-data-science',
      url: 'https://www.coursera.org/learn/introduction-to-data-science',
      tags: ['data science', 'python', 'pandas', 'numpy', 'data analysis']
    },
    
    // Web Development
    {
      id: 'web-dev',
      title: 'Full Stack Web Development Specialization',
      description: 'Become a full-stack developer with this comprehensive program. Learn HTML, CSS, JavaScript, Node.js, React, and databases to build complete web applications.',
      workload: '10 hours/week for 6 months',
      language: 'English',
      rating: 4.8,
      ratingCount: 85000,
      slug: 'full-stack-web-development',
      url: 'https://www.coursera.org/specializations/full-stack',
      tags: ['web development', 'javascript', 'react', 'node.js', 'mongodb']
    },
    {
      id: 'react-js',
      title: 'Front-End Web Development with React',
      description: 'Master React.js to build interactive user interfaces. Learn component-based architecture, state management, and modern JavaScript features.',
      workload: '6 hours/week for 2 months',
      language: 'English',
      rating: 4.7,
      ratingCount: 45000,
      slug: 'front-end-react',
      url: 'https://www.coursera.org/learn/front-end-react',
      tags: ['react', 'javascript', 'frontend', 'web development']
    },
    
    // Python & Programming
    {
      id: 'python-for-everybody',
      title: 'Python for Everybody',
      description: 'Learn to program with Python, one of the most popular programming languages. Covers basic programming concepts and data structures.',
      workload: '7 hours/week for 2 months',
      language: 'English',
      rating: 4.8,
      ratingCount: 98000,
      slug: 'python',
      url: 'https://www.coursera.org/specializations/python',
      tags: ['python', 'programming', 'beginner', 'coding']
    },
    
    // AI & Deep Learning
    {
      id: 'deep-learning',
      title: 'Deep Learning Specialization',
      description: 'Master Deep Learning, understand how to build neural networks, and lead machine learning projects. Covers CNNs, RNNs, and more.',
      workload: '12 hours/week for 4 months',
      language: 'English',
      rating: 4.9,
      ratingCount: 110000,
      slug: 'deep-learning-ai',
      url: 'https://www.coursera.org/specializations/deep-learning',
      tags: ['deep learning', 'neural networks', 'ai', 'tensorflow', 'machine learning']
    },
    
    // Data Analysis
    {
      id: 'data-analysis',
      title: 'Data Analysis with Python',
      description: 'Learn how to analyze data using Python. This course covers data manipulation, cleaning, analysis, and visualization with pandas, NumPy, and Matplotlib.',
      workload: '6 hours/week for 2 months',
      language: 'English',
      rating: 4.6,
      ratingCount: 65000,
      slug: 'data-analysis-python',
      url: 'https://www.coursera.org/learn/data-analysis-python',
      tags: ['data analysis', 'python', 'pandas', 'data visualization', 'numpy']
    }
  ];
  
  // If no query, return random courses
  if (!query) {
    return [...mockCourses].sort(() => 0.5 - Math.random()).slice(0, limit);
  }
  
  // Convert query to lowercase and split into keywords
  const queryLower = query.toLowerCase();
  const queryKeywords = queryLower.split(/\s+/);
  
  // Score each course based on keyword matches
  const scoredCourses = mockCourses.map(course => {
    const searchText = [
      course.title,
      course.description,
      ...(course.tags || [])
    ].join(' ').toLowerCase();
    
    // Calculate score based on keyword matches
    const score = queryKeywords.reduce((total, keyword) => {
      if (keyword.length < 3) return total; // Ignore short words
      return total + (searchText.includes(keyword) ? 1 : 0);
    }, 0);
    
    return { ...course, score };
  });
  
  // Filter out courses with no matches and sort by score (descending)
  return scoredCourses
    .filter(course => course.score > 0)
    .sort((a, b) => b.score - a.score || b.rating - a.rating)
    .slice(0, limit);
}

// No API key needed when using mock data

/**
 * Extract keywords from text using simple tokenization and filtering
 */
function extractKeywords(text) {
  if (!text) return [];
  
  // Convert to lowercase and split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/);
  
  // Common stop words to filter out
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
    'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while',
    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
    'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
    'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o',
    're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn',
    "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven',
    "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't",
    'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn',
    "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
  ]);

  // Filter out stop words and short words
  return [...new Set(words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5) // Limit to top 5 keywords
  )];
}

/**
 * Search courses on Coursera using RapidAPI
 */
async function searchCourses(query, options = {}) {
  const { limit = DEFAULT_LIMIT } = options;
  
  // Use mock data for now
  console.log('🔍 Searching for courses...');
  const courses = getMockCourses(query, limit);
  
  if (courses.length === 0) {
    console.log('⚠️  No courses matched your search. Here are some popular courses:');
    return getMockCourses('', limit);
  }
  
  return courses;
}

/**
 * Format course information for display
 */
function formatCourse(course, index) {
  const title = course.title || 'Untitled Course';
  const description = course.description ? 
    (course.description.length > 120 ? 
      course.description.substring(0, 120) + '...' : 
      course.description) : 
    'No description available';
    
  return `
${index + 1}. ${title}
   ${'─'.repeat(title.length + 2)}
   ${description}
   ${course.workload ? `⏱️  Workload: ${course.workload}` : ''}
   ${course.language ? `🌐 Language: ${course.language}` : ''}
   ${course.rating ? `⭐ Rating: ${course.rating} (${course.ratingCount || 0} reviews)` : ''}
   🔗 URL: ${course.url || `https://www.coursera.org/learn/${course.slug || 'course'}`}`;
}

/**
 * Main function to test the learning recommendation flow
 */
async function testLearningFlow() {
  console.log('🚀 Testing Learning Recommendation Flow\n');
  
  // Test cases with more specific learning goals
  const testCases = [
    'I want to learn data science and machine learning',
    'How to become a full-stack web developer with React and Node.js',
    'Best Python programming courses for beginners',
    'Learn deep learning and neural networks',
    'Data analysis and visualization with Python'
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Processing: "${testCase}"`);
    console.log('='.repeat(80));
    
    try {
      // Step 1: Extract keywords
      const keywords = extractKeywords(testCase);
      console.log('🔑 Extracted keywords:', keywords.join(', '));
      
      if (keywords.length === 0) {
        console.log('⚠️  No valid keywords extracted. Skipping...');
        continue;
      }
      
      // Step 2: Search for courses
      console.log('🔍 Searching for courses...');
      const courses = await searchCourses(keywords.join(' '), { limit: DEFAULT_LIMIT });
      
      // Step 3: Display results
      if (courses.length > 0) {
        console.log(`\n🎓 Found ${courses.length} courses:`);
        console.log('='.repeat(80));
        
        courses.forEach((course, index) => {
          console.log(formatCourse(course, index));
          console.log(''); // Add space between courses
        });
      } else {
        console.log('ℹ️  No courses found for this query.');
      }
      
    } catch (error) {
      console.error('❌ Error processing test case:', error.message);
    }
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testLearningFlow().catch(console.error);
