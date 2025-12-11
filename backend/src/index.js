import dotenv from "dotenv"
import { ensureRedisConnected, getJson, setJson, withLock } from "./utils/redisClient.js";
import { keys, ttl, payloads, validate } from "./utils/cacheKeys.js";
import { connectDB } from "./db/db.js";
import { app } from "./app.js";
import { runProactiveNotifier } from "./utils/ai/proactiveNotifier.service.js";
import { startProactiveScheduler } from "./utils/ai/proactiveScheduler.service.js";
import { aiServiceProxy } from "./utils/aiProxy.js";
import mongoose from "mongoose";

// Load env early so flags are available before heavy imports
dotenv.config({ path: './.env' })

// Debug: Track startup time
console.time('Server startup');

// Feature flags - More aggressive memory optimization
const ENABLE_AI_ROUTES = process.env.ENABLE_AI_ROUTES !== 'false';
const ENABLE_KB_SERVICE = process.env.ENABLE_KB_SERVICE === 'true'; // Changed to opt-in
const ENABLE_MARKET_INTELLIGENCE = process.env.ENABLE_MARKET_INTELLIGENCE === 'true'; // New flag
const ENABLE_SCHEDULED_JOBS = process.env.ENABLE_SCHEDULED_JOBS === 'true'; // Changed to opt-in

// Memory optimization
process.env.UV_THREADPOOL_SIZE = '4'; // Reduce thread pool
process.setMaxListeners(20); // Increase event listener limit

// Force garbage collection periodically
const forceGC = () => {
    if (global.gc) {
        global.gc();
        const memUsage = process.memoryUsage();
        console.log(`🗑️  GC: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used`);
    }
};

// Lazy load services to avoid memory spikes
let mcpKnowledgeBaseService = null;
const getMCPService = async () => {
    if (!mcpKnowledgeBaseService && ENABLE_KB_SERVICE) {
        const { default: service } = await import('./services/mcpKnowledgeBaseService.js');
        mcpKnowledgeBaseService = service;
    }
    return mcpKnowledgeBaseService;
};

// Lazy load routes that might be heavy
const lazyLoadRoute = async (path) => {
    const start = Date.now();
    try {
        const module = await import(path);
        console.log(`Loaded ${path} in ${Date.now() - start}ms`);
        return module.default;
    } catch (error) {
        console.error(`Failed to load ${path}:`, error.message);
        return null;
    }
};

// Import core routes first (lightweight)
console.time('Importing routes');
const applicationRoutes = await lazyLoadRoute("./routes/application.routes.js");
const userRoutes = await lazyLoadRoute("./routes/user.routes.js");
const jobRoutes = await lazyLoadRoute("./routes/jobs.routes.js");
const companyRoutes = await lazyLoadRoute("./routes/company.routes.js");
const resumeRoutes = await lazyLoadRoute("./routes/resume.routes.js");
const debugRoutes = await lazyLoadRoute("./routes/debug.routes.js");
const clerkRoutes = await lazyLoadRoute("./routes/clerk.routes.js");

// AI routes loaded conditionally with delay
let aiAgentRoutes = null;
let aiCareerCoachRoutes = null;
let enhancedAICareerCoachRoutes = null;
let mcpKnowledgeBaseRoutes = null;

console.timeEnd('Importing routes');
console.log('Loaded NODE_ENV:', process.env.NODE_ENV);
console.log('Loaded MONGODB_URL:', process.env.MONGODB_URL ? process.env.MONGODB_URL.slice(0, 30) + '...' : undefined);

const PORT = process.env.PORT || 3000

connectDB()
    .then(async () => {
        // Env validation
        const requiredEnvs = ['MONGODB_URI'];
        const hasAnyAIKey = !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY);
        const missing = requiredEnvs.filter((k) => !process.env[k]);
        if (!hasAnyAIKey) missing.push('OPENROUTER_API_KEY (or OPENAI_API_KEY/DEEPSEEK_API_KEY)');

        if (missing.length) {
            console.warn('⚠️ Missing environment variables:', missing.join(', '));
        } else {
            console.log('✅ Environment variables validated');
        }

        // Ensure Redis (optional) and Health endpoints
        const redisReady = await ensureRedisConnected();
        if (redisReady) {
            console.log('✅ Redis connected');
        } else {
            console.warn('⚠️ Redis not available, proceeding without cache/locks');
        }

        // Health endpoints
        app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
        app.get('/ready', async (req, res) => {
            const mongo = mongoose.connection?.readyState === 1;
            const aiKey = hasAnyAIKey;
            const redis = redisReady;
            res.status(mongo && aiKey ? 200 : 503).json({ mongo, aiKey, redis });
        });

        // AI Service Proxy - Must come before other routes to avoid conflicts
        if (ENABLE_AI_ROUTES) {
            app.use("/api/v1/ai-proxy", aiServiceProxy);
        }

        // Regular API routes
        app.use("/api/v1/users", userRoutes);
        app.use("/api/v1/jobs", jobRoutes);
        app.use("/api/v1/companies", companyRoutes);
        app.use("/api/v1/resume", resumeRoutes);
        app.use("/api/v1/applications", applicationRoutes);
        app.use("/api/v1/debug", debugRoutes);

        // Clerk webhooks (conditional - only if clerk is configured)
        if (clerkRoutes && process.env.CLERK_SECRET_KEY) {
            app.use("/api/v1/clerk", clerkRoutes());
        }

        // Unified error handler
        app.use((err, req, res, next) => {
            const requestId = req.headers['x-request-id'] || '';
            const status = err.statusCode || 500;
            const message = err.message || 'Internal server error';
            console.error(`[ERROR] ${requestId} ${req.method} ${req.originalUrl} ->`, message);
            res.status(status).json({ success: false, message, requestId });
        });

        const server = app.listen(PORT, async () => {
            console.log(`Server running at port : ${PORT}`);

            // Force GC after initial setup
            setTimeout(forceGC, 2000);

            // Optionally submit startup health to Redis
            try {
                if (redisReady) {
                    const memUsage = process.memoryUsage();
                    const heapMB = Math.round(memUsage.heapUsed / 1024 / 1024);
                    const timeMs = Math.round(performance?.now?.() || 0);
                    const payload = { heapMB, timeMs, at: new Date().toISOString() };
                    await setJson(keys.metrics.startupHealth(), payload, ttl.startupHealthSec);
                }
            } catch (_) { }

            // Load AI routes with delay to prevent memory spike
            if (ENABLE_AI_ROUTES) {
                console.log('🤖 Loading AI routes with delay...');

                setTimeout(async () => {
                    try {
                        // Use Redis lock to avoid concurrent heavy initialization across instances
                        const { locked } = await withLock(keys.lock.aiRoutes(), ttl.shortLockMs, async () => {
                            const done = await getJson(keys.done.aiRoutes());
                            if (done && validate.initDone(done)) {
                                console.log('⏭️ AI routes already initialized recently, skipping heavy load');
                                return true;
                            }

                            aiAgentRoutes = await lazyLoadRoute("./routes/aiAgent.routes.js");
                            if (aiAgentRoutes) app.use("/api/v1/ai-agent", aiAgentRoutes);

                            // Add delay between each route
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            forceGC();

                            aiCareerCoachRoutes = await lazyLoadRoute("./routes/aiCareerCoach.routes.js");
                            if (aiCareerCoachRoutes) app.use("/api/v1/ai-career-coach", aiCareerCoachRoutes);

                            await new Promise(resolve => setTimeout(resolve, 1000));
                            forceGC();

                            enhancedAICareerCoachRoutes = await lazyLoadRoute("./routes/enhancedAICareerCoach.routes.js");
                            if (enhancedAICareerCoachRoutes) app.use("/api/v1/enhanced-ai-career-coach", enhancedAICareerCoachRoutes);

                            await new Promise(resolve => setTimeout(resolve, 1000));
                            forceGC();

                            mcpKnowledgeBaseRoutes = await lazyLoadRoute("./routes/mcpKnowledgeBase.routes.js");
                            if (mcpKnowledgeBaseRoutes) app.use("/api/v1/mcp-knowledge-base", mcpKnowledgeBaseRoutes);

                            await setJson(keys.done.aiRoutes(), payloads.initDone(), ttl.aiRoutesDoneSec);
                            console.log('✅ AI routes loaded successfully');
                            return true;
                        });
                        if (!locked) {
                            console.log('🔒 Another instance is initializing AI routes, skipping here');
                        }
                    } catch (error) {
                        console.error('❌ Failed to load AI routes:', error);
                    }
                }, 3000);
            } else {
                console.log('AI routes disabled (ENABLE_AI_ROUTES=false)');
            }

            // Start scheduler with delay and memory check
            if (ENABLE_SCHEDULED_JOBS) {
                setTimeout(() => {
                    const memUsage = process.memoryUsage();
                    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

                    if (heapUsedMB < 2000) { // Only start if under 2GB
                        startProactiveScheduler();
                        console.log('✅ Proactive scheduler started');
                    } else {
                        console.warn('⚠️ Skipping scheduler due to high memory usage:', heapUsedMB + 'MB');
                    }
                }, 5000);
            } else {
                console.log('Scheduled jobs disabled (ENABLE_SCHEDULED_JOBS=false)');
            }

            // Initialize MCP Knowledge Base Service with extreme delay
            if (ENABLE_KB_SERVICE) {
                setTimeout(async () => {
                    try {
                        const memUsage = process.memoryUsage();
                        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

                        if (heapUsedMB < 1500) { // Only start if under 1.5GB
                            const { locked } = await withLock(keys.lock.mcpKb(), ttl.longLockMs, async () => {
                                const done = await getJson(keys.done.mcpKb());
                                if (done && validate.initDone(done)) {
                                    console.log('⏭️ MCP KB init recently completed, skipping');
                                    return true;
                                }
                                const mcpService = await getMCPService();
                                if (mcpService) {
                                    await mcpService.loadExistingKnowledgeBases();
                                    await setJson(keys.done.mcpKb(), payloads.initDone(), ttl.mcpKbDoneSec);
                                    console.log('✅ MCP Knowledge Base Service loaded (updates disabled)');
                                }
                                return true;
                            });
                            if (!locked) {
                                console.log('🔒 Another instance initializing MCP KB, skipping here');
                            }
                        } else {
                            console.warn('⚠️ Skipping MCP service due to high memory usage:', heapUsedMB + 'MB');
                        }
                    } catch (error) {
                        console.error('❌ Failed to start MCP Knowledge Base Service:', error);
                    }
                }, 10000);
            } else {
                console.log('KB service disabled (ENABLE_KB_SERVICE=false)');
            }
        });

        // Memory monitoring
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

            if (heapUsedMB > 3000) { // Alert if over 3GB
                console.warn(`🚨 High memory usage: ${heapUsedMB}MB/${heapTotalMB}MB`);
                forceGC();
            }
        }, 30000); // Check every 30 seconds

        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            server.close(async () => {
                try {
                    await mongoose.connection.close();
                    console.log('✅ Database connection closed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    })
    .catch((error) => {
        console.log(`DB Connection failed: ${error}`);
        process.exit(1);
    });