import React from "react";
import { useNavigate } from "react-router-dom";
import {
    FiBook,
    FiCheckCircle,
    FiClock,
    FiArrowRight,
    FiPlay,
    FiStar
} from "react-icons/fi";

function LearningPath({ tasks = [] }) {
    const navigate = useNavigate();

    // Default tasks if none provided
    const defaultTasks = [
        {
            id: 1,
            title: "Complete your profile",
            description: "Add your skills, experience, and education",
            duration: "5 min",
            completed: false,
            priority: "high",
            action: () => navigate("/profile")
        },
        {
            id: 2,
            title: "Upload your resume",
            description: "Let AI analyze your resume for insights",
            duration: "2 min",
            completed: false,
            priority: "high",
            action: () => navigate("/upload")
        },
        {
            id: 3,
            title: "Set your career goal",
            description: "Define where you want to be",
            duration: "3 min",
            completed: false,
            priority: "medium",
            action: () => navigate("/ai-career-coach")
        },
        {
            id: 4,
            title: "Explore job recommendations",
            description: "Find jobs matching your profile",
            duration: "10 min",
            completed: false,
            priority: "medium",
            action: () => navigate("/jobs")
        }
    ];

    const displayTasks = tasks.length > 0 ? tasks : defaultTasks;
    const incompleteTasks = displayTasks.filter(t => !t.completed).slice(0, 4);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'low': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
            default: return 'text-gray-500 bg-gray-50 dark:bg-gray-700';
        }
    };

    if (incompleteTasks.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <FiBook className="text-white text-lg" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Learning Path</h2>
                </div>

                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <FiCheckCircle className="text-3xl text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All caught up! 🎉</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        You've completed all your learning tasks. Check back later for new recommendations.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <FiBook className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Learning Path</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {incompleteTasks.length} tasks to complete
                        </p>
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {incompleteTasks.map((task, index) => {
                    // Determine navigation action based on task ID or title
                    const handleClick = () => {
                        if (task.action && typeof task.action === 'function') {
                            task.action();
                        } else {
                            // Map task IDs/titles to routes
                            const taskId = task.id || '';
                            const taskTitle = (task.title || '').toLowerCase();
                            
                            if (taskId.includes('profile') || taskTitle.includes('profile')) {
                                navigate('/profile');
                            } else if (taskId.includes('resume') || taskId.includes('upload') || taskTitle.includes('resume') || taskTitle.includes('upload')) {
                                navigate('/upload');
                            } else if (taskId.includes('goal') || taskId.includes('career') || taskTitle.includes('goal') || taskTitle.includes('career')) {
                                navigate('/career-coach?tab=career-inbox');
                            } else if (taskId.includes('job') || taskTitle.includes('job') || taskTitle.includes('recommendation')) {
                                navigate('/jobs');
                            } else if (taskId.includes('roadmap') || taskId.includes('skill') || taskId.includes('goal')) {
                                // Roadmap tasks go to career coach roadmap view
                                navigate('/career-coach?tab=roadmap');
                            } else {
                                // Default to career coach
                                navigate('/career-coach');
                            }
                        }
                    };

                    return (
                        <div
                            key={task.id || index}
                            onClick={handleClick}
                            className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 cursor-pointer transition-all duration-300"
                        >
                            {/* Play Icon */}
                            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                <FiPlay className="text-xl ml-0.5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                                        {task.title}
                                    </h3>
                                    {task.priority && (
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                    {task.description}
                                </p>
                            </div>

                            {/* Duration & Arrow */}
                            <div className="flex flex-col items-end gap-1">
                                {task.duration && (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                        <FiClock className="text-[10px]" />
                                        {task.duration}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View All Link */}
            <button
                onClick={() => {
                    // Check if user has roadmap, if not go to onboarding
                    const hasRoadmap = tasks.some(t => t.id && t.id.includes('roadmap'));
                    if (hasRoadmap) {
                        navigate("/career-coach", { state: { activeTab: 'roadmap' } });
                    } else {
                        navigate("/career-coach", { state: { activeTab: 'career-inbox' } });
                    }
                }}
                className="w-full mt-4 py-3 text-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center justify-center gap-2 transition-colors group"
            >
                <FiStar className="group-hover:rotate-12 transition-transform" />
                {tasks.some(t => t.id && t.id.includes('roadmap')) ? 'View Full Roadmap' : 'Get Your AI Career Roadmap'}
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}

export default LearningPath;
