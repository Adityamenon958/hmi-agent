# 🚀 HMI AI Agent Backend

**Your First AI Agent for HMI Design Generation!**

## 📋 What This Does

This AI agent automatically:
1. **Reads** FDS (Functional Design Specification) documents
2. **Analyzes** requirements using AI
3. **Generates** Figma HMI screen designs
4. **Returns** complete design specifications

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **AI Framework**: LangChain.js
- **AI Model**: OpenAI GPT-4
- **Design API**: Figma API
- **File Upload**: Multer
- **Environment**: dotenv

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
Create a `.env` file in the backend directory:
```env
# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Figma API Key - Get from https://www.figma.com/developers/api#access-tokens
FIGMA_API_KEY=your_figma_api_key_here

# Figma File ID - The file where designs will be created
FIGMA_FILE_ID=your_figma_file_id_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Step 4: Test the API
```bash
# Health check
curl http://localhost:5000/api/health

# Test with a sample FDS file
curl -X POST -F "fdsDocument=@path/to/your/fds.txt" http://localhost:5000/api/generate-hmi
```

## 📁 Project Structure

```
backend/
├── server.js              # Main Express server
├── agents/
│   └── hmiAgent.js        # Main AI agent logic
├── prompts/
│   └── hmiPrompts.js      # AI prompts collection
├── uploads/               # Temporary file storage
├── package.json
├── env.example
└── README.md
```

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and basic info.

### Generate HMI Design
```
POST /api/generate-hmi
```
Upload an FDS document and get back a complete HMI design.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `fdsDocument` (file)

**Response:**
```json
{
  "success": true,
  "message": "HMI design generated successfully! 🎨",
  "data": {
    "fdsAnalysis": { /* FDS analysis results */ },
    "designSpecification": { /* Figma design spec */ },
    "figmaApiCalls": { /* Figma API calls */ },
    "figmaResult": { /* Figma creation result */ },
    "summary": { /* Process summary */ }
  }
}
```

### Get Available Prompts
```
GET /api/prompts
```
Returns all available AI prompts for different use cases.

## 🤖 How the AI Agent Works

### 1. Document Processing
- Reads FDS documents (TXT, PDF, DOCX)
- Extracts key requirements using AI
- Structures data for design generation

### 2. Design Generation
- Analyzes requirements with specialized prompts
- Creates detailed Figma design specifications
- Follows HMI best practices

### 3. Figma Integration
- Generates Figma API calls
- Creates actual Figma designs (when API key provided)
- Returns design URLs and specifications

## 🎯 Supported File Types

- **TXT**: Plain text files ✅
- **PDF**: PDF documents (placeholder) ❗
- **DOCX**: Word documents (placeholder) ❗

## 🔑 Required API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to your `.env` file

### Figma API Key (Optional)
1. Go to [Figma Developers](https://www.figma.com/developers/api#access-tokens)
2. Create a personal access token
3. Add to your `.env` file

## 🧪 Testing

### Test with Sample FDS
Create a `test-fds.txt` file:
```
HMI Screen: Production Dashboard
Purpose: Monitor production line status

Required Elements:
- Start/Stop button (top left)
- Production status display (center)
- Error alerts (top right)
- Settings button (bottom right)

Layout: Grid 2x2
Colors: Professional blue theme
```

### Test API Call
```bash
curl -X POST -F "fdsDocument=@test-fds.txt" http://localhost:5000/api/generate-hmi
```

## 🚨 Error Handling

The agent handles:
- Invalid file types
- Missing API keys
- Network errors
- AI processing errors
- File upload issues

## 🔄 Development Workflow

1. **Make changes** to agent logic
2. **Test locally** with sample FDS
3. **Update prompts** as needed
4. **Deploy** to production

## 📈 Next Steps

- [ ] Add PDF/DOCX parsing
- [ ] Implement actual Figma API calls
- [ ] Add design validation
- [ ] Create frontend interface
- [ ] Add user authentication
- [ ] Implement design templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify API keys are set
3. Ensure file format is supported
4. Check network connectivity

---

**Happy AI Agent Building! 🎉** 