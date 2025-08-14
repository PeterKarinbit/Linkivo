import dotenv from "dotenv"
import { connectDB } from "./db/db.js";
import { app } from "./app.js";
import applicationRoutes from "./routes/application.routes.js";
import aiAgentRoutes from "./routes/aiAgent.routes.js";
import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import companyRoutes from "./routes/company.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import debugRoutes from "./routes/debug.routes.js";

dotenv.config({ path: './.env' })
console.log('Loaded NODE_ENV:', process.env.NODE_ENV);
console.log('Loaded MONGODB_URL:', process.env.MONGODB_URL ? process.env.MONGODB_URL.slice(0, 30) + '...' : undefined);
const PORT = process.env.PORT || 3000
connectDB()
    .then(() => {
        // routes declaration
        app.use("/api/v1/users", userRoutes);
        app.use("/api/v1/jobs", jobRoutes);
        app.use("/api/v1/companies", companyRoutes);
        app.use("/api/v1/resume", resumeRoutes);
        app.use("/api/v1/applications", applicationRoutes);
        app.use("/api/v1/ai-agent", aiAgentRoutes);
        app.use("/api/v1/debug", debugRoutes); // Debug routes

        app.listen(PORT, () => {
            console.log(`Server running at port : ${PORT}`);
        })
    }
    ).catch((error) => {
        console.log(`DB Connection failed: ${error}`);
    })