# 🤖 HMI Agent - FDS-based Screen Generation

## 📋 Overview
The HMI Agent is an AI-powered tool that analyzes Functional Design Specifications (FDS) and generates professional HMI (Human-Machine Interface) screens. The system uses a **simplified workflow** to ensure efficiency and reduce AI token usage.

## 🎯 Key Features

### ✅ **Simplified Workflow** (UPDATED - removed screen count step)
1. **FDS Upload** - Upload your Functional Design Specification document
2. **Workflow Generation** - AI creates screen navigation and interaction flow
3. **Screen Generation** - Generate actual HMI screen images

### ✅ **AI-Powered Analysis**
- Intelligent FDS document parsing
- Automatic workflow diagram generation
- Professional screen layout creation
- **Optimized token usage** - removed unnecessary screen count analysis

### ✅ **User Control**
- Review workflow diagrams before generation
- Download individual or all screens
- Complete transparency in the generation process

## 🏗️ Architecture

### Backend (`/backend`)
- **Express.js** server with RESTful API
- **OpenAI GPT** integration for intelligent analysis
- **Canvas API** for screen image generation
- **Simplified endpoints** for workflow management

### Frontend (`/frontend`)
- **React + TypeScript** with Material-UI
- **Step-by-step wizard** interface
- **Real-time progress tracking**
- **Streamlined user experience**

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
```bash
git clone [repository-url]
cd HMI-Agent
```

2. **Setup Backend**
```bash
cd backend
npm install
cp env.example .env
# Edit .env and add your OpenAI API key
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

4. **Start Both Servers**

**Option 1: Use Start Scripts (Recommended)**
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

**Option 2: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

5. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📡 API Endpoints (UPDATED)

### Step 1: Generate Workflow
```http
POST /api/generate-workflow
Content-Type: multipart/form-data
Body: { fdsDocument: File }
```

### Step 2: Generate Screens
```http
POST /api/generate-screens
Content-Type: application/json
Body: { sessionId: string }
```

### Legacy: Complete Generation
```http
POST /api/generate-hmi
Content-Type: multipart/form-data
Body: { fdsDocument: File }
```

## 🔧 Technical Implementation

### FDS Analysis Process (UPDATED)
1. **Document Parsing** - Extract text from TXT/PDF/DOCX files
2. **AI Analysis** - Use GPT to identify screens and requirements
3. **Workflow Generation** - Create navigation and interaction patterns
4. **Screen Generation** - Generate professional HMI layouts

### Screen Generation Process
1. **Specification Generation** - Create detailed screen layouts
2. **Canvas Rendering** - Generate high-quality PNG images
3. **Element Positioning** - Place buttons, indicators, and text
4. **Color Scheme Application** - Apply professional HMI colors

### Simplified State Management
- **Session-based workflow** (simplified for demo)
- **Error handling** at each step
- **Progress tracking** and user feedback
- **Optimized token usage** - removed unnecessary analysis steps

## 📁 Project Structure

```
HMI-Agent/
├── backend/
│   ├── agents/
│   │   └── hmiAgent.js          # Main AI agent logic
│   ├── prompts/
│   │   └── hmiPrompts.js        # AI prompts collection
│   ├── outputs/                 # Generated screen images
│   ├── uploads/                 # Uploaded FDS documents
│   ├── server.js                # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── HMIAgentInterface.tsx  # Main UI component
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
├── start.bat                    # Windows startup script
├── start.sh                     # Linux/Mac startup script
└── README.md
```

## 🎨 Generated Outputs

### Screen Types
- **Individual Screens** - Detailed layouts for each screen
- **Workflow-Driven Layout** - Professional grid showing all screens
- **Comprehensive Layout** - Complete system overview

### File Formats
- **PNG Images** - High-quality screen layouts
- **JSON Data** - Screen specifications and metadata
- **Mermaid Diagrams** - Navigation flow visualization

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
```

### AI Model Settings
- **Model**: GPT-4o-mini (optimized for cost and performance)
- **Temperature**: 0.3 (consistent professional output)
- **Max Tokens**: 4000 (comprehensive analysis)

## 🚀 Performance Optimizations

### Token Usage Reduction
- **Removed screen count analysis** - saves ~1000-2000 tokens per request
- **Condensed context** - reduced document sample size
- **Template-based generation** - efficient fallback for small projects
- **Structured data extraction** - optimized document parsing

### Processing Speed
- **Parallel screen generation** - faster image creation
- **Cached session data** - reduced redundant processing
- **Optimized prompts** - focused AI analysis

## 🐛 Troubleshooting

### Common Issues
1. **File Upload Errors**
   - Check file size (max 50MB)
   - Ensure file format is supported (TXT, PDF, DOCX)

2. **AI Generation Failures**
   - Verify OpenAI API key is valid
   - Check API quota and billing
   - Review error logs in backend console

3. **Image Generation Issues**
   - Ensure outputs directory exists
   - Check Canvas API compatibility
   - Verify file permissions

### Debug Mode
```bash
# Backend debug logging
NODE_ENV=development npm start

# Frontend development mode
npm start
```

## 📈 Future Enhancements

### Planned Features
- **Real-time collaboration** - Multiple users working on same project
- **Template library** - Pre-built HMI templates
- **Export options** - PDF reports, CAD files
- **Version control** - Track changes and revisions

### Performance Improvements
- **Caching system** - Reduce API calls for repeated requests
- **Batch processing** - Handle multiple documents
- **Progressive loading** - Stream results as they're generated

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**🎉 Happy HMI Generation!** 