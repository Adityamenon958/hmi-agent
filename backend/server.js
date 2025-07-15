// ✅ HMI Agent Server - Express backend for HMI screen generation
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
// const { fileURLToPath } = require('url');
// const { dirname } = require('path');
const fs = require('fs');
const HMIAgent = require('./agents/hmiAgent.js');
const rateLimit = require('express-rate-limit');
const { OpenAI } = require('openai');
const helmet = require('helmet');
const dotenv = require('dotenv');

// ✅ Load environment variables
dotenv.config();

// ✅ Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('❌ Please set these variables in Azure App Service Configuration');
    process.exit(1);
}

console.log('✅ All required environment variables are set');

// ✅ ES module fixes
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Initialize HMI Agent
const hmiAgent = new HMIAgent();

// ✅ Cost tracking (simple in-memory tracking)
let totalCost = 0;
let totalRequests = 0;
let costHistory = [];

// ✅ NEW: Progress tracking system
const progressSessions = new Map();

// ✅ NEW: Progress tracking utility
function updateProgress(sessionId, step, message, details = null) {
    const timestamp = new Date().toISOString();
    
    // ✅ Store progress in session
    if (!progressSessions.has(sessionId)) {
        progressSessions.set(sessionId, {
            steps: [],
            currentStep: step,
            status: 'processing',
            startTime: timestamp
        });
    }
    
    const session = progressSessions.get(sessionId);
    if (!session.steps) session.steps = [];
    session.steps.push({
        step,
        message,
        details,
        timestamp
    });
    session.currentStep = step;
    session.lastUpdate = timestamp;
    
    // ✅ Log to console (same as before)
    console.log(message);
    
    // ✅ Send to connected SSE clients
    sendSSEUpdate(sessionId, {
        step,
        message,
        details,
        timestamp,
        currentStep: step
    });
}

// ✅ NEW: Server-Sent Events for real-time progress
const sseClients = new Map();

function sendSSEUpdate(sessionId, data) {
    if (sseClients.has(sessionId)) {
        const clients = sseClients.get(sessionId);
        clients.forEach(client => {
            try {
                client.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (error) {
                console.error('SSE send error:', error);
            }
        });
    }
}

// ✅ NEW: SSE endpoint for progress updates
app.get('/api/progress/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    
    // ✅ Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // ✅ Store client connection
    if (!sseClients.has(sessionId)) {
        sseClients.set(sessionId, new Set());
    }
    sseClients.get(sessionId).add(res);
    
    // ✅ Send initial progress if available
    if (progressSessions.has(sessionId)) {
        const session = progressSessions.get(sessionId);
        res.write(`data: ${JSON.stringify({
            step: session.currentStep,
            message: 'Connected to progress stream',
            details: session.steps.slice(-1)[0]?.details,
            timestamp: new Date().toISOString()
        })}\n\n`);
    }
    
    // ✅ Handle client disconnect
    req.on('close', () => {
        if (sseClients.has(sessionId)) {
            sseClients.get(sessionId).delete(res);
            if (sseClients.get(sessionId).size === 0) {
                sseClients.delete(sessionId);
            }
        }
    });
});

// ✅ FIXED: Middleware with proper CORS settings for images
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "http:", "https:"],
        },
    },
    crossOriginResourcePolicy: false, // ✅ CRITICAL: Allow cross-origin image loading
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ✅ File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}-${safeName}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Allow text files, PDFs, and DOCX files
        const allowedTypes = [
            'text/plain',
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only TXT, PDF, and DOCX files are allowed.'));
        }
    }
});

// ✅ Create uploads directory if it doesn't exist
try {
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
        console.log('✅ Created uploads directory');
    }
} catch (error) {
    console.error('❌ Error creating uploads directory:', error);
}

// ✅ Create outputs directory if it doesn't exist
try {
    if (!fs.existsSync('outputs')) {
        fs.mkdirSync('outputs', { recursive: true });
        console.log('✅ Created outputs directory');
    }
} catch (error) {
    console.error('❌ Error creating outputs directory:', error);
}

// ✅ FIXED: Explicit image route with CORS headers
app.get('/outputs/*.png', (req, res, next) => {
    // ✅ Set explicit CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    next();
});

// ✅ FIXED: Serve static files from outputs directory with proper headers
app.use('/outputs', express.static(path.join(__dirname, 'outputs'), {
    setHeaders: (res, path, stat) => {
        // ✅ Fix CORS issue for images
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        // ✅ Set proper content type for PNG images
        if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'HMI AI Agent is running! 🚀',
        timestamp: new Date().toISOString()
    });
});

// ✅ Cost tracking endpoint
app.get('/api/costs', (req, res) => {
    res.json({
        success: true,
        costs: {
            totalCost: totalCost.toFixed(4),
            totalRequests,
            averageCostPerRequest: totalRequests > 0 ? (totalCost / totalRequests).toFixed(4) : 0,
            costHistory: costHistory.slice(-10), // Last 10 requests
            estimatedRemainingRequests: Math.floor((5 - totalCost) / 0.01) // Based on $5 free credit
        }
    });
});

// ✅ Update cost tracking (call this from your agent)
function updateCostTracking(cost, tokens) {
    totalCost += cost;
    totalRequests++;
    costHistory.push({
        timestamp: new Date().toISOString(),
        cost: cost.toFixed(4),
        tokens,
        totalCost: totalCost.toFixed(4)
    });
    
    console.log(`💰 Total cost so far: $${totalCost.toFixed(4)} (${totalRequests} requests)`);
}
module.exports.updateCostTracking = updateCostTracking;

// ✅ Step 1: Generate workflow diagram (UPDATED - removed screen count step)
app.post('/api/generate-workflow', upload.single('fdsDocument'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded. Please upload an FDS document.' 
            });
        }

        const sessionId = `session_${Date.now()}`;
        updateProgress(sessionId, 'upload', '📄 FDS document uploaded successfully');
        
        updateProgress(sessionId, 'workflow', '🔄 Step 1: Generating workflow diagram...');
        
        // ✅ Initialize our AI agent
        const hmiAgent = new HMIAgent();
        
        // ✅ Generate workflow diagram directly from FDS
        const workflowDiagram = await hmiAgent.generateWorkflowDiagram(req.file.path, (step, message) => {
            updateProgress(sessionId, step, message);
        });
        
        updateProgress(sessionId, 'workflow', '✅ Workflow diagram generated successfully!');
        
        // ✅ Store session data
        const sessionData = {
            sessionId,
            workflowDiagram,
            filePath: req.file.path,
            originalName: req.file.originalname,
            createdAt: new Date().toISOString()
        };
        // ✅ Store workflow and screenAnalysis in session for screen generation
        progressSessions.set(sessionId, {
            workflowDiagram,
            screenAnalysis: workflowDiagram.screenAnalysis,
            createdAt: new Date().toISOString(),
            steps: [], // Always initialize steps array
            currentStep: 'workflow',
            status: 'processing'
        });
        
        // ✅ Log the workflow before sending
        console.log('Sending workflow response:', JSON.stringify(workflowDiagram).substring(0, 500) + '...');
        // ✅ Log the response payload size in KB
        const responsePayload = {
            success: true,
            message: 'Workflow diagram generated successfully! 🔄',
            data: workflowDiagram,
            sessionId: sessionId,
            step: 1,
            nextStep: 'generate-screens'
        };
        const payloadSizeKB = Buffer.byteLength(JSON.stringify(responsePayload)) / 1024;
        console.log('Workflow response size (KB):', payloadSizeKB);
        res.json(responsePayload);

    } catch (error) {
        console.error('❌ Error generating workflow:', error);
        if (error && error.stack) {
            console.error(error.stack);
        }
        res.status(500).json({
            error: 'Failed to generate workflow diagram',
            details: error.message
        });
    }
});

// ✅ Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ✅ Step 2: Generate final screen images (UPDATED - removed screen count step)
app.post('/api/generate-screens', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = progressSessions.get(sessionId);

        // Log sessionId and session data for debugging
        console.log('SessionId:', sessionId);
        console.log('Session data:', session);

        if (!session || !session.screenAnalysis) {
            return res.status(400).json({ 
                error: 'Session data missing or expired. Please start from workflow generation.' 
            });
        }

        // Set agent session data for screen generation
        hmiAgent.sessionData.screenAnalysis = session.screenAnalysis;

        updateProgress(sessionId, 'screen-generation', '🎨 Step 2: Generating screen images...');

        // ✅ Generate screen images
        const result = await hmiAgent.generateScreenImages();

        updateProgress(sessionId, 'screen-generation', '✅ HMI screens generated successfully!');

        res.json({
            success: true,
            message: 'HMI screens generated successfully! 🎨',
            data: result,
            sessionId: sessionId,
            step: 2,
            nextStep: 'complete'
        });

    } catch (error) {
        console.error('❌ Error generating screens:', error);

        res.status(500).json({
            error: 'Failed to generate screen images',
            details: error.message
        });
    }
});

// ✅ Legacy endpoint: Process FDS and generate HMI design (all steps in one) - UPDATED
app.post('/api/generate-hmi', upload.single('fdsDocument'), async (req, res) => {
    try {
        console.log('🎯 Processing FDS document for complete HMI generation...');
        
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded. Please upload an FDS document.' 
            });
        }

        // ✅ Initialize our AI agent
        const hmiAgent = new HMIAgent();
        
        // ✅ Step 1: Generate workflow (removed screen count step)
        const workflowDiagram = await hmiAgent.generateWorkflowDiagram(req.file.path);
        
        // ✅ Step 2: Generate screens
        const result = await hmiAgent.generateScreenImages();
        
        // ✅ Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
            success: true,
            message: 'HMI design generated successfully! 🎨',
            data: result
        });

    } catch (error) {
        console.error('❌ Error processing FDS:', error);
        
        // ✅ Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            error: 'Failed to process FDS document',
            details: error.message
        });
    }
});

// ✅ Get available prompts endpoint
app.get('/api/prompts', async (req, res) => {
    try {
        const { HMI_PROMPTS, PROMPT_TEMPLATES } = require('./prompts/hmiPrompts.js');
        res.json({
            success: true,
            prompts: { HMI_PROMPTS, PROMPT_TEMPLATES }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to load prompts',
            details: error.message
        });
    }
});

// ✅ Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

// ✅ Start server with error handling
const server = app.listen(PORT, () => {
    console.log(`🚀 HMI AI Agent server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎨 Ready to generate HMI designs!`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'MISSING!'}`);
});

// ✅ Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
    }
    process.exit(1);
});

// ✅ Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app;