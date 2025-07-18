// ✅ HMI AI Agent - FDS-based Screen Generation Version (Structured Approach)
const fs = require('fs');
const path = require('path');
// const { fileURLToPath } = require('url');
// const { dirname } = require('path');
const { updateCostTracking } = require('../server.js');
const OpenAI = require('openai');

// ✅ Canvas with fallback for Azure compatibility
let createCanvas;
try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    console.log('✅ Canvas loaded successfully');
} catch (error) {
    console.log('⚠️ Canvas not available, using fallback mode');
    createCanvas = null;
}

// const __filename = fileURLToPath(__filename);
// const __dirname = dirname(__filename);


class HMIAgent {
    constructor() {
        console.log('🤖 HMI Agent initialized (FDS-based screen generation)');
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.sessionData = {}; // Store session data for multi-step process
        this.updateProgress = (step, message) => console.log(message);
    }

    // ✅ Clear session data
    clearSession() {
        this.sessionData = {};
    }

    // ✅ Step 1: Generate workflow diagram directly from FDS (UPDATED - removed screen count step)
    async generateWorkflowDiagram(filePath, progressCallback = null) {
        this.updateProgress = progressCallback || ((step, message) => console.log(message));
        
        this.updateProgress('workflow', '🔍 Step 1: Analyzing FDS and generating workflow...');
        
        // ✅ CRITICAL: Clear any previous session data
        this.clearSession();
        this.updateProgress('workflow', '🧹 Session cleared for new document analysis');
        
        try {
            // ✅ Read and store FDS content for context-aware generation
            const fdsContent = await this.readDocument(filePath);
            this.updateProgress('workflow', `📄 FDS content read: ${fdsContent.length} characters`);
            
            // ✅ Store FDS content in session for document context
            this.sessionData.fdsContent = fdsContent;
            this.sessionData.fdsFilePath = filePath;
            
            // ✅ NEW: Extract structured data from DOCX
            const structuredData = await this.extractStructuredData(filePath);
            
            // ✅ Use structured analysis approach
            this.updateProgress('workflow', '📊 Using structured analysis approach...');
            
            // ✅ NEW: Use structured analysis with rule-based pre-filtering
            const screenAnalysis = await this.analyzeStructuredFDS(structuredData);
            
            // ✅ Store screen analysis in session
            this.sessionData.screenAnalysis = screenAnalysis;
            this.updateProgress('workflow', `✅ Screen analysis completed: ${screenAnalysis.totalScreens} screens detected`);
            
            // ✅ Generate workflow diagram
            this.updateProgress('workflow', '🔄 Generating workflow diagram...');
            const workflowDiagram = await this.generateWorkflowFromScreens(screenAnalysis.screenList, structuredData);
            
            // ✅ Store workflow in session
            this.sessionData.workflowDiagram = workflowDiagram;
            this.updateProgress('workflow', '✅ Workflow diagram generated successfully!');
            
            return workflowDiagram;
            
        } catch (error) {
            console.error('❌ Error generating workflow:', error);
            throw error;
        }
    }

    // ✅ NEW: Generate workflow from screens and structured data
    async generateWorkflowFromScreens(screens, structuredData) {
        const documentContext = this.getDocumentContext();
        const condensedContext = this.createCondensedContext(documentContext, screens);

        // ✅ Use template-based approach for efficiency
        if (screens.length <= 3) {
            // For small projects, use efficient template generation
            return this.generateTemplateBasedWorkflow(screens, condensedContext);
        }

        // ✅ For larger projects, use optimized AI with expert-level analysis
        const prompt = `Expert HMI Analysis by 25+ year PLC/HMI professional for ${condensedContext.systemType}:

SCREENS: ${condensedContext.screenSummary}
COMPONENTS: ${condensedContext.components}
OPERATIONS: ${condensedContext.operations}

Create comprehensive JSON with expert-level detail:
- systemOverview: {systemName, systemType, totalScreens, primaryFunction, expertReview}
- screenAnalysis: For each screen: {screenName, purpose, keyElements[8-10 detailed items with exact positioning], functionality[4-5 operational items], elementDetails{buttonCount, displayCount, refreshRate, criticalElements}, designRationale}
- navigationFlow: {mermaidDiagram, screenTransitions[all major transitions]}
- technicalSpecifications: {hmiPlatform, communicationProtocol, updateRate, backupSystem, cyberSecurity}
- implementationNotes: [6 detailed implementation recommendations]

Focus on exact button positioning (x,y coordinates), element specifications, and implementation guidance for junior developers.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert HMI/PLC engineer with 25+ years of experience. Generate professional workflow diagrams and screen specifications."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            });

            // Try to extract JSON from the response, even if extra text is present
            const jsonString = response.choices[0].message.content;
            let workflowData;
            try {
                // Find the first '{' and last '}' to extract the JSON block
                const jsonStart = jsonString.indexOf('{');
                const jsonEnd = jsonString.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    workflowData = JSON.parse(jsonString.substring(jsonStart, jsonEnd + 1));
                } else {
                    throw new Error('No JSON object found in AI response');
                }
            } catch (jsonError) {
                console.error('❌ Error parsing AI response as JSON:', jsonError);
                // Fallback to template-based generation
                return this.generateTemplateBasedWorkflow(screens, condensedContext);
            }
            // ✅ Enhance with template data
            return this.enhanceWithTemplateData(workflowData, screens, condensedContext);
        } catch (error) {
            console.error('❌ Error in AI workflow generation:', error);
            // Fallback to template-based generation
            return this.generateTemplateBasedWorkflow(screens, condensedContext);
        }
    }

    // ✅ NEW: Create condensed context to reduce token usage
    createCondensedContext(documentContext, screens) {
        return {
            systemType: documentContext.systemKeywords.systemType[0] || 'industrial_control',
            components: documentContext.systemKeywords.components.slice(0, 5).join(', '),
            operations: documentContext.systemKeywords.operations.slice(0, 5).join(', '),
            screenSummary: screens.map(s => s.screenName).join(', '),
            totalScreens: screens.length,
            documentSample: documentContext.documentSample.substring(0, 300) // Reduced from 1000
        };
    }

    // ✅ ENHANCED: Template-based workflow generation with comprehensive analysis
    generateTemplateBasedWorkflow(screens, condensedContext) {
        this.updateProgress('workflow', '📋 Using efficient template-based generation with expert analysis...');
        
        const systemName = `${condensedContext.systemType} Control System`;
        
        const workflowData = {
            workflowType: "Professional HMI Analysis (Expert Review)",
            systemOverview: {
                systemName: systemName,
                systemType: condensedContext.systemType,
                totalScreens: screens.length,
                primaryFunction: this.generatePrimaryFunction(condensedContext),
                expertReview: `Based on 25+ years of PLC/HMI experience, this ${condensedContext.systemType} system demonstrates proper architectural principles with logical screen separation and operator-centric design patterns.`
            },
            screenAnalysis: screens.map((screen, index) => ({
                screenName: screen.screenName,
                screenNumber: index + 1,
                purpose: this.generateConcisePurpose(screen, condensedContext),
                keyElements: this.generateKeyElements(screen, condensedContext),
                functionality: this.generateFunctionality(screen, condensedContext),
                elementDetails: this.generateElementDetails(screen, condensedContext),
                navigation: this.generateNavigation(screen, screens),
                behavior: this.generateBehavior(screen),
                dataVisualization: this.generateDataVisualization(screen),
                userRoles: this.generateUserRoles(screen),
                designRationale: this.generateDesignRationale(screen, condensedContext)
            })),
            navigationFlow: this.generateConciseNavigationFlow(screens),
            technicalSpecifications: this.generateTechnicalSpecs(condensedContext),
            implementationNotes: this.generateImplementationNotes(screens, condensedContext)
        };
        
        this.updateProgress('workflow', '📋 Expert-level template analysis completed');
        return workflowData;
    }

    // ✅ NEW: Extract structured data from DOCX (Updated for mammoth)
    async extractStructuredData(filePath) {
        this.updateProgress('analysis', '📄 Extracting structured data from document...');
        
        try {
            // ✅ Get document content using mammoth
            const documentContent = await this.readDocument(filePath);
            
            // ✅ Create basic structure from text content
            const sections = this.createBasicStructure(documentContent);
            
            this.updateProgress('analysis', `📋 Created ${sections.length} sections from document`);
            return sections;
            
        } catch (error) {
            console.error('❌ Error extracting structured data:', error);
            // ✅ Fallback - create minimal structure
            return [{
                heading: 'Document Content',
                content: `Error reading document: ${error.message}`,
                level: 1
            }];
        }
    }

    // ✅ NEW: Parse document structure to extract sections
    parseDocumentStructure(content) {
        console.log('🔍 Parsing document structure...');
        
        const sections = [];
        let currentSection = null;
        
        // Extract text content and try to identify sections
        const textContent = this.extractTextFromDocx(content);
        const lines = textContent.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
            // Check if this line looks like a heading
            if (this.isHeading(line)) {
                // Save previous section if exists
                if (currentSection) {
                    sections.push(currentSection);
                }
                
                // Start new section
                currentSection = {
                    heading: line.trim(),
                    content: []
                };
            } else if (currentSection) {
                // Add content to current section
                currentSection.content.push(line.trim());
            } else {
                // No section yet, create a general section
                if (!currentSection) {
                    currentSection = {
                        heading: 'Introduction',
                        content: []
                    };
                }
                currentSection.content.push(line.trim());
            }
        }
        
        // Add final section
        if (currentSection) {
            sections.push(currentSection);
        }
        
        return sections;
    }

    // ✅ NEW: Check if a line is a heading
    isHeading(line) {
        const trimmed = line.trim();
        if (trimmed.length === 0) return false;
        
        const headingPatterns = [
            /^\d+\.\s/,  // Numbered headings like "1. Main Screen"
            /^\d+\.\d+\s/,  // Sub-numbered headings like "1.1 Control Interface"
            /^[A-Z][A-Z\s]+$/,  // ALL CAPS headings
            /Screen$/i,  // Ends with "Screen"
            /Interface$/i,  // Ends with "Interface"
            /Control$/i,  // Ends with "Control"
            /Mode$/i,  // Ends with "Mode"
            /System$/i,  // Ends with "System"
            /^(Manual|Auto|Automatic|Home|Main|Test|Pumpback|Purging|Settings|Alarm|User|Configuration|Display|Control|Interface|Panel|View|Time|Tracking|Diagnostic)/i,
            /^\w+\s*(Screen|Display|Interface|Panel|View|Mode|System|Control|Management)/i,
            // New patterns for the double acting cylinder document
            /acting/i,
            /cylinder/i,
            /extend/i,
            /retract/i,
            /feedback/i,
            /fault/i,
            /timer/i,
            /interlock/i
        ];
        
        return headingPatterns.some(pattern => pattern.test(trimmed));
    }

    // ✅ Improved: Extract text content from DOCX structure
    extractTextFromDocx(content) {
        console.log('🔍 Extracting text from DOCX structure...');
        
        // ✅ If content is already a string (from mammoth), return it
        if (typeof content === 'string') {
            return content;
        }
        
        // ✅ Handle array of content items
        if (Array.isArray(content)) {
            return content.map(item => this.extractTextFromDocx(item)).join('\n');
        }
        
        // ✅ Handle objects with text property
        if (content && typeof content === 'object') {
            if (content.text) {
                return content.text;
            }
            if (content.children) {
                return content.children.map(child => this.extractTextFromDocx(child)).join('\n');
            }
            if (content.content) {
                return this.extractTextFromDocx(content.content);
            }
        }
        
        // ✅ Handle primitive values
        if (typeof content === 'string') {
            return content;
        }
        
        return '';
    }

    // ✅ NEW: Create basic structure for non-DOCX files
    createBasicStructure(content) {
        this.updateProgress('analysis', '📄 Creating basic structure for non-DOCX file...');
        
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const sections = [];
        let currentSection = null;
        
        for (const line of lines) {
            if (this.isHeading(line)) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: line.trim(),
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(line.trim());
            } else {
                if (!currentSection) {
                    currentSection = {
                        heading: 'Document Content',
                        content: []
                    };
                }
                currentSection.content.push(line.trim());
            }
        }
        
        if (currentSection) {
            sections.push(currentSection);
        }
        
        return sections;
    }

    // ✅ NEW: Analyze structured FDS data
    async analyzeStructuredFDS(structuredData) {
        this.updateProgress('analysis', '🧠 Analyzing structured FDS data...');
        
        // ✅ Rule-based pre-filtering
        const screenLikeSections = this.filterScreenLikeSections(structuredData);
        this.updateProgress('analysis', `🔍 Found ${screenLikeSections.length} screen-like sections`);
        
        // ✅ Use GPT-4 for intelligent analysis
        const analysisResult = await this.analyzeWithGPT4(screenLikeSections);
        
        // ✅ Store in session
        this.sessionData.screenAnalysis = analysisResult;
        this.sessionData.fdsContent = JSON.stringify(structuredData);
        
        return analysisResult;
    }

    // ✅ NEW: Filter sections that likely contain screen information
    filterScreenLikeSections(sections) {
        this.updateProgress('analysis', '🔍 Filtering screen-like sections...');
        
        const screenKeywords = [
            'screen', 'display', 'interface', 'panel', 'view', 'window',
            'home', 'main', 'test', 'pumpback', 'purging', 'settings',
            'alarm', 'user', 'configuration', 'status', 'control',
            'navigation', 'menu', 'hmi', 'gui', 'ui'
        ];
        
        const screenLikeSections = sections.filter(section => {
            const sectionText = (section.heading + ' ' + section.content.join(' ')).toLowerCase();
            return screenKeywords.some(keyword => sectionText.includes(keyword));
        });
        
        // Also include sections that have structural indicators
        const structuralSections = sections.filter(section => {
            const heading = section.heading.toLowerCase();
            return (
                heading.includes('screen') ||
                heading.includes('display') ||
                heading.includes('interface') ||
                /^\d+\.\d+/.test(heading) || // Numbered subsections
                section.content.some(line => 
                    line.includes('button') ||
                    line.includes('field') ||
                    line.includes('status') ||
                    line.includes('indicator')
                )
            );
        });
        
        // Combine and deduplicate
        const allSections = [...screenLikeSections, ...structuralSections];
        const uniqueSections = allSections.filter((section, index, self) =>
            index === self.findIndex(s => s.heading === section.heading)
        );
        
        return uniqueSections;
    }

    // ✅ NEW: Analyze with GPT-4 using structured data
    async analyzeWithGPT4(sections) {
        this.updateProgress('analysis', '🧠 Analyzing with GPT-4...');
        
        const prompt = `
You are an expert HMI design assistant. I have provided you with a Functional Design Specification (FDS) document in structured format.

Your task is to extract a comprehensive list of distinct HMI screens from the document. For each screen, provide:
- Screen Name
- Purpose/Function
- Key elements (e.g., graphs, buttons, gauges, displays)
- Screen Type (navigation, monitoring, control, configuration, alarm)

Document Sections:
${JSON.stringify(sections, null, 2)}

Based on the structured content above, identify all HMI screens. Look for:
1. Explicitly named screens (Home Screen, Main Screen, Test Screen, etc.)
2. Interface descriptions and user interactions
3. Different operational modes that require separate screens
4. Settings and configuration interfaces
5. Alarm and status displays
6. User management interfaces

Respond with a JSON object in this exact format:
{
  "totalScreens": [number],
  "screenList": [
    {
      "screenId": "screen_1",
      "screenName": "Home Screen",
      "screenPurpose": "Initial splash screen with logo, model, serial number, and calibration date",
      "screenType": "navigation"
    }
  ],
  "reasoning": "Brief explanation of screens found and analysis approach"
}

RESPOND ONLY WITH VALID JSON:`;

        try {
        const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
                max_tokens: 2000
            });

            const response = completion.choices[0].message.content.trim();
            this.updateProgress('analysis', `📝 GPT-4 analysis response preview: ${response.substring(0, 200)}`);
            
            let analysis;
            
            try {
                analysis = JSON.parse(response);
        } catch (e) {
                this.updateProgress('analysis', '⚠️ JSON parse failedd, extracting...');
                // Try to extract JSON from markdown code blocks
                const jsonMatch = response.match(/```json\s*([\s\S]*?)```/i);
            if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[1]);
            } else {
                    throw new Error('Could not parse JSON response');
                }
            }
            
            this.updateProgress('analysis', `🎉 GPT-4 analysis complete: ${analysis.totalScreens} screens found`);
            return analysis;
            
        } catch (error) {
            console.error('❌ Error in GPT-4 analysis:', error.message);
            throw error;
        }
    }

    // ✅ NEW: Direct document analysis with GPT-4 (fallback method)
    async analyzeDocumentWithGPT4(documentContent) {
        console.log('🧠 Analyzing document directly with GPT-4...');
        
        const prompt = `
You are an expert HMI design assistant. I have provided you with a Functional Design Specification (FDS) document.

Your task is to extract a comprehensive list of distinct HMI screens from the document. For each screen, provide:
- Screen Name
- Purpose/Function
- Key elements (e.g., graphs, buttons, gauges, displays)
- Screen Type (navigation, monitoring, control, configuration, alarm)

Document Content:
${documentContent}

Based on the document content above, identify all HMI screens. Look for:
1. Explicitly named screens or interfaces
2. Different operational modes that require separate screens
3. Control interfaces and user interactions
4. Settings and configuration interfaces
5. Alarm and status displays
6. User management interfaces
7. Manual vs automatic control modes
8. Diagnostic and monitoring interfaces

IMPORTANT: Analyze THIS specific document, not any previous examples. Focus on the actual content provided.

Respond with a JSON object in this exact format:
{
  "totalScreens": [number],
  "screenList": [
    {
      "screenId": "screen_1",
      "screenName": "Manual Control Screen",
      "screenPurpose": "Allows operator to manually control the system",
      "screenType": "control"
    }
  ],
  "reasoning": "Brief explanation of screens found and analysis approach"
}

RESPOND ONLY WITH VALID JSON:`;

        try {
        const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
                max_tokens: 2000
            });

            const response = completion.choices[0].message.content.trim();
            console.log('📝 GPT-4 fallback response preview:', response.substring(0, 200));
            
            let analysis;
            
            try {
                analysis = JSON.parse(response);
            } catch (e) {
                console.log('⚠️ Direct JSON parse failed, trying extraction...');
                // Try to extract JSON from markdown code blocks
                const jsonMatch = response.match(/```json\s*([\s\S]*?)```/i);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[1]);
                } else {
                    throw new Error('Could not parse JSON response');
                }
            }
            
            console.log(`🎉 GPT-4 fallback analysis complete: ${analysis.totalScreens} screens found`);
            return analysis;
            
        } catch (error) {
            console.error('❌ Error in GPT-4 fallback analysis:', error.message);
            throw error;
        }
    }

    // ✅ NEW: Generate detailed element specifications for junior developers
    generateElementDetails(screen, condensedContext) {
        const screenName = screen.screenName.toLowerCase();
        const systemType = condensedContext.systemType;
        
        return {
            buttonCount: this.estimateButtonCount(screen),
            displayCount: this.estimateDisplayCount(screen),
            controllerType: this.determineControllerType(screen),
            refreshRate: this.determineRefreshRate(screen),
            screenSize: "1920x1080 recommended minimum for industrial operator stations",
            colorScheme: "ISA-101 compliant with customizable operator themes",
            criticalElements: this.identifyCriticalElements(screen, systemType),
            hmiTags: this.generateHMITags(screen, systemType),
            layoutGuidelines: this.generateLayoutGuidelines(screen),
            buttonSizes: this.generateButtonSizes(screen),
            fontSpecs: this.generateFontSpecifications(screen),
            colorCodes: this.generateColorCodes(screen)
        };
    }

    // ✅ Helper methods for template-based workflow generation
    generatePrimaryFunction(condensedContext) {
        return `Control and monitor ${condensedContext.systemType} operations with ${condensedContext.totalScreens} specialized screens`;
    }

    generateConcisePurpose(screen, condensedContext) {
        const screenName = screen.screenName.toLowerCase();
        if (screenName.includes('home') || screenName.includes('main')) {
            return 'Primary system overview and navigation hub';
        } else if (screenName.includes('control') || screenName.includes('operation')) {
            return 'Process control and operational interface';
        } else if (screenName.includes('monitor') || screenName.includes('status')) {
            return 'Real-time monitoring and status display';
        } else if (screenName.includes('alarm') || screenName.includes('alert')) {
            return 'Alarm management and notification center';
        } else if (screenName.includes('config') || screenName.includes('setup')) {
            return 'System configuration and parameter settings';
        } else {
            return 'Specialized interface for system operations';
        }
    }

    generateKeyElements(screen, condensedContext) {
        const screenName = screen.screenName.toLowerCase();
        const elements = [];
        
        // Add common elements based on screen type
        if (screenName.includes('home') || screenName.includes('main')) {
            elements.push('System logo and branding', 'Navigation menu', 'System status overview', 'Quick access buttons');
        }
        if (screenName.includes('control') || screenName.includes('operation')) {
            elements.push('Start/Stop controls', 'Process indicators', 'Parameter displays', 'Emergency stop button');
        }
        if (screenName.includes('monitor') || screenName.includes('status')) {
            elements.push('Real-time data displays', 'Trend graphs', 'Status indicators', 'Alarm summary');
        }
        if (screenName.includes('alarm') || screenName.includes('alert')) {
            elements.push('Alarm list', 'Acknowledgment buttons', 'Alarm history', 'Priority indicators');
        }
        
        // Add generic elements
        elements.push('Screen title header', 'Navigation buttons', 'Status bar', 'Help/Info button');
        
        return elements.slice(0, 8); // Limit to 8 elements
    }

    generateFunctionality(screen, condensedContext) {
        const screenName = screen.screenName.toLowerCase();
        const functions = [];
        
        if (screenName.includes('home') || screenName.includes('main')) {
            functions.push('System overview display', 'Navigation to other screens', 'Quick status check', 'Emergency access');
        } else if (screenName.includes('control') || screenName.includes('operation')) {
            functions.push('Process control operations', 'Parameter adjustment', 'Manual override capabilities', 'Safety interlocks');
        } else if (screenName.includes('monitor') || screenName.includes('status')) {
            functions.push('Real-time data monitoring', 'Trend analysis', 'Performance tracking', 'Report generation');
        } else {
            functions.push('Specialized operations', 'Data management', 'System configuration', 'User interaction');
        }
        
        return functions.slice(0, 4); // Limit to 4 functions
    }

    generateNavigation(screen, screens) {
        return {
            previousScreen: this.findPreviousScreen(screen, screens),
            nextScreen: this.findNextScreen(screen, screens),
            relatedScreens: this.findRelatedScreens(screen, screens),
            triggers: ['User selection', 'System event', 'Alarm condition', 'Timeout']
        };
    }

    generateBehavior(screen) {
        return {
            refreshRate: '1 second for real-time data',
            updateMode: 'Continuous monitoring',
            userInteraction: 'Touch-friendly interface',
            errorHandling: 'Graceful degradation with fallback displays'
        };
    }

    generateDataVisualization(screen) {
        return {
            charts: 'Trend graphs for key parameters',
            indicators: 'Color-coded status displays',
            tables: 'Data grids for detailed information',
            gauges: 'Analog-style displays for critical values'
        };
    }

    generateUserRoles(screen) {
        return {
            operator: 'Full access to operational controls',
            supervisor: 'Monitoring and configuration access',
            maintenance: 'Technical parameter access',
            administrator: 'System configuration and user management'
        };
    }

    generateDesignRationale(screen, condensedContext) {
        return `Designed for ${condensedContext.systemType} operations with focus on operator efficiency, safety, and intuitive navigation. Follows ISA-101 standards for industrial HMI design.`;
    }

    generateConciseNavigationFlow(screens) {
        const transitions = [];
        for (let i = 0; i < screens.length; i++) {
            if (i < screens.length - 1) {
                transitions.push(`${screens[i].screenName} → ${screens[i + 1].screenName}`);
            }
        }
        
        return {
            mermaidDiagram: this.generateMermaidDiagram(screens),
            screenTransitions: transitions,
            navigationType: 'Hierarchical with home screen as central hub'
        };
    }

    generateTechnicalSpecs(condensedContext) {
        return {
            hmiPlatform: 'Web-based HMI with responsive design',
            communicationProtocol: 'OPC UA / Modbus TCP',
            updateRate: '1 second for critical data, 5 seconds for general monitoring',
            backupSystem: 'Redundant server configuration',
            cyberSecurity: 'Role-based access control with audit logging'
        };
    }

    generateImplementationNotes(screens, condensedContext) {
        return [
            'Implement responsive design for multiple screen sizes',
            'Use CSS Grid/Flexbox for consistent layouts',
            'Implement real-time data updates using WebSocket connections',
            'Add comprehensive error handling and user feedback',
            'Follow accessibility guidelines for industrial environments',
            'Implement proper security measures and user authentication'
        ];
    }

    // ✅ Helper methods for navigation
    findPreviousScreen(screen, screens) {
        const index = screens.findIndex(s => s.screenName === screen.screenName);
        return index > 0 ? screens[index - 1].screenName : 'Home';
    }

    findNextScreen(screen, screens) {
        const index = screens.findIndex(s => s.screenName === screen.screenName);
        return index < screens.length - 1 ? screens[index + 1].screenName : 'Home';
    }

    findRelatedScreens(screen, screens) {
        const screenName = screen.screenName.toLowerCase();
        return screens.filter(s => 
            s.screenName !== screen.screenName && 
            (s.screenName.toLowerCase().includes('control') || 
             s.screenName.toLowerCase().includes('monitor') ||
             s.screenName.toLowerCase().includes('config'))
        ).map(s => s.screenName);
    }

    generateMermaidDiagram(screens) {
        let mermaid = 'graph TD\n';
        mermaid += '    Home[Home Screen]\n';
        
        screens.forEach((screen, index) => {
            if (screen.screenName.toLowerCase() !== 'home') {
                mermaid += `    Screen${index + 1}[${screen.screenName}]\n`;
                mermaid += `    Home --> Screen${index + 1}\n`;
            }
        });
        
        return mermaid;
    }

    // ✅ Helper methods for element details
    estimateButtonCount(screen) {
        const screenName = screen.screenName.toLowerCase();
        if (screenName.includes('home')) return 6;
        if (screenName.includes('control')) return 8;
        if (screenName.includes('monitor')) return 4;
        if (screenName.includes('config')) return 10;
        return 6;
    }

    estimateDisplayCount(screen) {
        const screenName = screen.screenName.toLowerCase();
        if (screenName.includes('monitor')) return 12;
        if (screenName.includes('control')) return 8;
        if (screenName.includes('home')) return 4;
        return 6;
    }

    determineControllerType(screen) {
        return 'PLC-based control system with HMI interface';
    }

    determineRefreshRate(screen) {
        const screenName = screen.screenName.toLowerCase();
        if (screenName.includes('monitor')) return '1 second';
        if (screenName.includes('control')) return '500ms';
        return '2 seconds';
    }

    identifyCriticalElements(screen, systemType) {
        return ['Emergency Stop', 'System Status', 'Alarm Indicators', 'Safety Interlocks'];
    }

    generateHMITags(screen, systemType) {
        return ['System_Status', 'Alarm_Active', 'Emergency_Stop', 'Process_Running'];
    }

    generateLayoutGuidelines(screen) {
        return 'Follow ISA-101 standards with consistent spacing and grouping';
    }

    generateButtonSizes(screen) {
        return 'Minimum 44px touch targets for industrial environments';
    }

    generateFontSpecifications(screen) {
        return 'Sans-serif fonts, minimum 12pt for readability';
    }

    generateColorCodes(screen) {
        return {
            normal: '#00FF00',
            warning: '#FFFF00',
            alarm: '#FF0000',
            background: '#2C3E50'
        };
    }

    // ✅ NEW: Generate layout guidelines for developers
    generateLayoutGuidelines(screen) {
        return {
            buttonSpacing: "20px minimum between interactive elements",
            gridLayout: "Use 50px grid system for consistent alignment",
            navigation: "Reserve top 60px for navigation elements",
            statusArea: "Bottom 40px for status information",
            contentMargin: "50px margins on all sides for industrial displays"
        };
    }

    // ✅ DYNAMIC: Generate button size specifications
    generateButtonSizes(screen) {
        return {
            primaryButtons: "120x60px for main actions",
            secondaryButtons: "100x40px for secondary functions",
            navigationButtons: "80x40px for screen navigation",
            inputFields: "150x40px for data entry",
            statusDisplays: "100x30px for information display"
        };
    }

    // ✅ NEW: Generate font specifications
    generateFontSpecifications(screen) {
        return {
            buttonText: "16px Bold Arial for button labels",
            processValues: "18px Bold Courier New for numeric displays",
            statusText: "14px Regular Arial for status information",
            alarmText: "16px Bold Arial for alarm messages",
            headerText: "20px Bold Arial for screen titles",
            inputText: "16px Regular Arial for input fields"
        };
    }

    // ✅ DYNAMIC: Generate color codes for implementation
    generateColorCodes(screen) {
        return {
            primaryBlue: "#0066CC - Primary action buttons",
            secondaryGray: "#808080 - Secondary functions",
            successGreen: "#00AA00 - Success indicators",
            warningYellow: "#FFAA00 - Warning indicators",
            backgroundColor: "#2C3E50 - Main screen background",
            textColor: "#FFFFFF - Primary text color"
        };
    }

    // ✅ DYNAMIC: Generate design rationale based on expert experience
    generateDesignRationale(screen, condensedContext) {
        const screenName = screen.screenName;
        const systemType = condensedContext.systemType;
        
        return `${screenName} screen designed for ${systemType} operational requirements with focus on operator efficiency, system reliability, and safety compliance following industrial HMI standards.`;
    }

    // ✅ NEW: Generate technical specifications
    generateTechnicalSpecs(condensedContext) {
        return {
            hmiPlatform: "Industrial-grade HMI platform with real-time capabilities",
            communicationProtocol: "Ethernet/IP, Modbus TCP, or OPC-UA based on system requirements",
            updateRate: "Critical data: 100-250ms, Non-critical: 1-5 seconds",
            historicalData: "Process data historian with minimum 1-year retention",
            backupSystem: "Redundant HMI nodes with automatic failover capability",
            cyberSecurity: "Role-based access, encrypted communications, audit logging",
            regulatory: "21 CFR Part 11 compliance for regulated industries"
        };
    }

    // ✅ NEW: Generate implementation notes
    generateImplementationNotes(screens, condensedContext) {
        const systemType = condensedContext.systemType;
        
        return [
            `🔧 Implementation Priority: Start with core operational screens (Control, Alarm) then expand to diagnostic interfaces`,
            `📊 Data Architecture: Implement centralized tag database with consistent naming conventions for ${systemType} parameters`,
            `🎨 Visual Design: Follow ISA-101 standards with high-contrast displays suitable for 24/7 industrial environments`,
            `🔒 Security Implementation: Implement zero-trust architecture with role-based access and comprehensive audit trails`,
            `📱 Future Considerations: Design with mobile accessibility in mind for remote monitoring and maintenance support`,
            `🎯 Validation Plan: Implement Factory Acceptance Testing (FAT) with comprehensive operator training and documentation`
        ];
    }

    // ✅ DYNAMIC: Estimate elements based on document content
    estimateButtonCount(screen) {
        return '8-15 functional buttons based on document requirements';
    }

    estimateDisplayCount(screen) {
        return '6-12 informational displays for system parameters';
    }

    determineControllerType(screen) {
        return 'Standard operator interface with real-time updates';
    }

    determineRefreshRate(screen) {
        return '500ms-2 seconds based on data criticality';
    }

    // ✅ DYNAMIC: Identify critical elements from document content
    identifyCriticalElements(screen, systemType) {
        return [
            'System status indicators',
            'Emergency controls', 
            'Key process parameters',
            'Navigation elements'
        ];
    }

    // ✅ DYNAMIC: Generate HMI tags based on screen and system
    generateHMITags(screen, systemType) {
        const screenName = screen.screenName.replace(/\s+/g, '_').toUpperCase();
        const prefix = systemType.substring(0, 3).toUpperCase();
        
        return [
            `${prefix}_${screenName}_STATUS`,
            `${prefix}_${screenName}_CONTROL`,
            `${prefix}_${screenName}_ALARM`,
            `${prefix}_${screenName}_DATA`
        ];
    }

    // ✅ NEW: Generate primary function from document content
    generatePrimaryFunction(condensedContext) {
        // ✅ Extract primary function from actual document content
        const documentContent = condensedContext.documentContent || '';
        const systemType = condensedContext.systemType.toLowerCase();
        
        // ✅ Look for actual system purpose in document content
        const purposePatterns = [
            'primary function',
            'system purpose',
            'main objective',
            'system design',
            'control system for',
            'monitoring system for',
            'operation of',
            'management of'
        ];
        
        // ✅ Try to extract purpose from document content
        for (const pattern of purposePatterns) {
            const regex = new RegExp(`${pattern}[:\\s]+([^.\\n]{20,80})`, 'i');
            const match = documentContent.match(regex);
            if (match) {
                return match[1].trim();
            }
        }
        
        // ✅ Generic fallback based on system type (no hardcoded assumptions)
        return `${systemType.replace('_', ' ')} control and monitoring system`;
    }

    // ✅ NEW: Generate functionality based on document content
    generateFunctionality(screen, condensedContext) {
        const screenName = screen.screenName;
        const systemType = condensedContext.systemType;
        const components = condensedContext.components.split(', ').filter(c => c.length > 0);
        const operations = condensedContext.operations.split(', ').filter(o => o.length > 0);
        
        const functionality = [];
        
        // ✅ Add screen-specific functionality based on document content
        functionality.push(`🎛️ ${screenName} Operations: Primary control interface for ${systemType} system operations`);
        
        // ✅ Add functionality based on document components
        if (components.length > 0) {
            functionality.push(`🔧 Component Control: Management and monitoring of ${components.slice(0, 3).join(', ')} with real-time feedback`);
        }
        
        // ✅ Add functionality based on document operations
        if (operations.length > 0) {
            functionality.push(`⚙️ Process Operations: ${operations.slice(0, 3).join(', ')} with automated sequences and manual override`);
        }
        
        // ✅ Add system-specific monitoring
        functionality.push(`📊 System Monitoring: Real-time ${systemType} parameter tracking with alarm integration and data logging`);
        
        return functionality;
    }

    // ✅ NEW: Generate navigation efficiently
    generateNavigation(screen, allScreens) {
        const otherScreens = allScreens.filter(s => s.screenName !== screen.screenName).map(s => s.screenName);
        
        return {
            from: ["Navigation menu", "System startup"],
            to: otherScreens.slice(0, 3),
            triggers: ["User selection", "System event"]
        };
    }

    // ✅ NEW: Generate behavior with proper content
    generateBehavior(screen) {
        const screenName = screen.screenName.toLowerCase();
        
        if (screenName.includes('control') || screenName.includes('manual')) {
            return `Interactive control interface with real-time feedback, operator confirmation dialogs, and safety interlocks for ${screen.screenName} operations`;
        } else if (screenName.includes('alarm')) {
            return `Dynamic alarm display with priority-based color coding, acknowledgment functionality, and real-time status updates`;
        } else if (screenName.includes('monitoring') || screenName.includes('dashboard')) {
            return `Real-time monitoring dashboard with automatic refresh, trend displays, and parameter limits checking`;
        } else if (screenName.includes('settings') || screenName.includes('config')) {
            return `Configuration interface with input validation, save/load functionality, and user access control`;
        } else {
            return `Responsive interface with real-time updates, user feedback mechanisms, and consistent navigation patterns`;
        }
    }

    // ✅ NEW: Generate data visualization with proper content
    generateDataVisualization(screen) {
        const screenName = screen.screenName.toLowerCase();
        
        if (screenName.includes('control') || screenName.includes('manual')) {
            return `Control panels with analog gauges, digital displays, status indicators, and real-time parameter monitoring`;
        } else if (screenName.includes('alarm')) {
            return `Alarm tables with color-coded priorities, timestamps, severity indicators, and historical trend charts`;
        } else if (screenName.includes('monitoring') || screenName.includes('dashboard')) {
            return `Real-time trend charts, bar graphs, status indicators, and tabular data displays with filtering options`;
        } else if (screenName.includes('settings') || screenName.includes('config')) {
            return `Configuration forms, parameter entry fields, dropdown menus, and validation status indicators`;
        } else {
            return `Mixed visualization including gauges, tables, charts, and status displays appropriate for ${screen.screenName}`;
        }
    }

    // ✅ NEW: Generate user roles with proper content
    generateUserRoles(screen) {
        const screenName = screen.screenName.toLowerCase();
        
        if (screenName.includes('control') || screenName.includes('manual')) {
            return `Operator (basic access), Supervisor (full control), Engineer (configuration), Maintenance (diagnostic access)`;
        } else if (screenName.includes('alarm')) {
            return `Operator (view/acknowledge), Supervisor (reset/manage), Engineer (configure thresholds), Admin (system config)`;
        } else if (screenName.includes('settings') || screenName.includes('config')) {
            return `Engineer (parameter config), Supervisor (operational settings), Admin (system configuration), Maintenance (calibration)`;
        } else if (screenName.includes('user') || screenName.includes('management')) {
            return `Admin (full access), Supervisor (user management), IT Support (system maintenance)`;
        } else {
            return `All Users (navigation), Operator (status view), Supervisor (system control), Engineer (advanced features)`;
        }
    }

    // ✅ NEW: Generate concise navigation flow
    generateConciseNavigationFlow(screens) {
        const mermaidLines = ["graph TD"];
        
        // ✅ Create navigation flow from Home Screen to all others
        const homeScreen = screens.find(s => s.screenName.toLowerCase().includes('home')) || screens[0];
        const otherScreens = screens.filter(s => s.screenName !== homeScreen.screenName);
        
        // ✅ Build the mermaid diagram
        mermaidLines.push(`    A[${homeScreen.screenName}] --> B[${otherScreens[0]?.screenName || 'System'}]`);
        
        for (let i = 1; i < Math.min(otherScreens.length, 6); i++) {
            const nodeId = String.fromCharCode(65 + i + 1);
            mermaidLines.push(`    A --> ${nodeId}[${otherScreens[i].screenName}]`);
        }
        
        const transitions = otherScreens.slice(0, 6).map(screen => ({
            from: homeScreen.screenName,
            to: screen.screenName,
            trigger: "User selection",
            description: `Navigate from ${homeScreen.screenName} to ${screen.screenName}`
        }));
        
        return {
            mermaidDiagram: mermaidLines.join('; '),
            screenTransitions: transitions
        };
    }

    // ✅ NEW: Generate concise purpose for each screen
    generateConcisePurpose(screen, condensedContext) {
        const screenName = screen.screenName;
        const systemType = condensedContext.systemType;
        
        // ✅ Screen-specific purposes based on document content
        if (screenName.toLowerCase().includes('home') || screenName.toLowerCase().includes('main')) {
            return `Main overview and navigation interface for the ${systemType} system`;
        } else if (screenName.toLowerCase().includes('manual') || screenName.toLowerCase().includes('control')) {
            return `Manual control interface for direct operator control of ${systemType} operations`;
        } else if (screenName.toLowerCase().includes('auto')) {
            return `Automatic operation mode control and monitoring for ${systemType} system`;
        } else if (screenName.toLowerCase().includes('test')) {
            return `System testing and diagnostic interface for ${systemType} validation`;
        } else if (screenName.toLowerCase().includes('alarm')) {
            return `Alarm monitoring and management interface for ${systemType} fault handling`;
        } else if (screenName.toLowerCase().includes('setting')) {
            return `System configuration and parameter adjustment interface for ${systemType}`;
        } else if (screenName.toLowerCase().includes('user')) {
            return `User access management and authentication interface for ${systemType}`;
        } else {
            return `Specialized ${screenName} interface for ${systemType} operations`;
        }
    }

    // ✅ NEW: Parse AI response with error handling
    parseAIResponse(response) {
        try {
            const cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleanedResponse);
        } catch (e) {
            console.log('⚠️ JSON parse failed, extracting...');
            const jsonMatch = response.match(/```json\s*([\s\S]*?)```/i) || response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0].replace(/```json\s*/g, '').replace(/```\s*/g, ''));
                } catch (e2) {
                    throw new Error('Could not parse AI response');
                }
            }
            throw new Error('No JSON found in response');
        }
    }

    // ✅ ENHANCED: Enhance AI data with template data for robustness
    enhanceWithTemplateData(workflowData, screens, condensedContext) {
        console.log('🤝 Enhancing AI-generated workflow with template data...');

        // ✅ Ensure system overview is complete
        if (!workflowData.systemOverview) {
            workflowData.systemOverview = {
                systemName: `${condensedContext.systemType} Control System`,
                systemType: condensedContext.systemType,
                totalScreens: screens.length,
                primaryFunction: this.generatePrimaryFunction(condensedContext)
            };
        }

        // ✅ PERMANENT FIX: Sanitize screen analysis data
        if (workflowData.screenAnalysis && Array.isArray(workflowData.screenAnalysis)) {
            workflowData.screenAnalysis.forEach(screen => {
                // ✅ FIX [object Object]: Ensure keyElements are always strings
                if (screen.keyElements && Array.isArray(screen.keyElements)) {
                    screen.keyElements = screen.keyElements.map(element => 
                        typeof element === 'object' ? JSON.stringify(element) : String(element)
                    );
                }

                // ✅ FIX FRONTEND CRASH: Ensure navigation object and triggers exist
                if (!screen.navigation) {
                    screen.navigation = this.generateNavigation(screen, screens);
                } else if (!screen.navigation.triggers) {
                    screen.navigation.triggers = ["User selection", "System event"];
                }

                // Fallback for missing properties
                if (!screen.purpose) screen.purpose = this.generateConcisePurpose(screen, condensedContext);
                if (!screen.functionality) screen.functionality = this.generateFunctionality(screen, condensedContext);
                if (!screen.behavior) screen.behavior = this.generateBehavior(screen);
                if (!screen.dataVisualization) screen.dataVisualization = this.generateDataVisualization(screen);
                if (!screen.userRoles) screen.userRoles = this.generateUserRoles(screen);
            });
        } else {
            // Generate from scratch if missing
            workflowData.screenAnalysis = screens.map(screen => ({
                screenName: screen.screenName,
                purpose: this.generateConcisePurpose(screen, condensedContext),
                keyElements: this.generateKeyElements(screen, condensedContext),
                functionality: this.generateFunctionality(screen, condensedContext),
                behavior: this.generateBehavior(screen),
                dataVisualization: this.generateDataVisualization(screen),
                userRoles: this.generateUserRoles(screen)
            }));
        }

        // ✅ PERMANENT FIX: Sanitize navigation flow data
        if (workflowData.navigationFlow && workflowData.navigationFlow.screenTransitions) {
            // ✅ FIX "undefined: undefined": Ensure transitions have trigger and description
            workflowData.navigationFlow.screenTransitions = workflowData.navigationFlow.screenTransitions.map(transition => {
                // If transition is a string, convert to object or skip
                if (typeof transition === 'string') {
                    // Try to parse from string format like 'Home Screen -> Main Screen'
                    const match = transition.match(/^(.*?)\s*->\s*(.*?)$/);
                    if (match) {
                        return {
                            from: match[1].trim(),
                            to: match[2].trim(),
                            trigger: 'User selection',
                            description: `Navigate from ${match[1].trim()} to ${match[2].trim()}`
                        };
                    } else {
                        // If not parseable, skip this transition
                        return null;
                    }
                } else if (typeof transition === 'object' && transition !== null) {
                    if (!transition.trigger) {
                        transition.trigger = "User selection";
                    }
                    if (!transition.description) {
                        transition.description = `Navigate from ${transition.from} to ${transition.to}`;
                    }
                    return transition;
                } else {
                    // Unknown type, skip
                    return null;
                }
            }).filter(Boolean);
        } else {
            // Generate from scratch if missing
            workflowData.navigationFlow = this.generateConciseNavigationFlow(screens);
        }

        console.log('✅ Workflow enhancement complete.');
        return workflowData;
    }

    // ✅ DYNAMIC: Generate screen purpose based on document content
    generateConcisePurpose(screen, condensedContext) {
        const screenName = screen.screenName;
        const systemType = condensedContext.systemType;
        
        // ✅ Get screen-specific content from document
        const screenRelevantContent = this.extractScreenRelevantContent(screen, {
            systemKeywords: {
                components: condensedContext.components.split(', ').filter(c => c.length > 0),
                operations: condensedContext.operations.split(', ').filter(o => o.length > 0),
                systemType: [systemType]
            },
            fdsContent: condensedContext.documentSample,
            documentSample: condensedContext.documentSample
        });
        
        let purpose = `${screenName} interface for ${systemType} system operations`;
        
        // ✅ Add specific details based on document content
        if (screenRelevantContent.relatedEquipment && screenRelevantContent.relatedEquipment.length > 0) {
            purpose += ` controlling ${screenRelevantContent.relatedEquipment.slice(0, 2).join(' and ')}`;
        }
        
        if (screenRelevantContent.keyOperations && screenRelevantContent.keyOperations.length > 0) {
            purpose += ` with ${screenRelevantContent.keyOperations.slice(0, 2).join(' and ')} capabilities`;
        }
        
        purpose += '. Provides operator control, system monitoring, and status indication for safe and efficient operation.';
        
        return purpose;
    }

    // ✅ ENHANCED: Generate key elements based on detailed FDS content analysis
    generateKeyElements(screen, condensedContext) {
        const screenName = screen.screenName;
        const systemType = condensedContext.systemType;
        
        // ✅ Use the enhanced document context with full content
        const documentContext = this.getDocumentContext();
        
        // ✅ Extract screen-specific content from document using enhanced methods
        const screenContent = this.extractScreenRelevantContent(screen, documentContext);
        
        // ✅ Generate GT Works/GT Designer compatible elements based on detailed document analysis
        return this.generateGTWorksElements(screen, screenContent, documentContext);
    }

    // ✅ NEW: Generate GT Works/GT Designer compatible elements based on document analysis
    generateGTWorksElements(screen, screenContent, documentContext) {
        const screenName = screen.screenName.toLowerCase();
        const systemType = documentContext.systemKeywords.systemType[0];
        const elements = [];
        
        // ✅ Always add navigation elements (GT Works standard)
        elements.push(`🔀 Screen Change Button: Top-left (50, 20) - HOME screen navigation`);
        elements.push(`🧭 Screen Change Button: Top-right (1800, 20) - SETTINGS access`);
        elements.push(`🔔 Alarm Indicator: Top-right (1650, 20) - System alarm status lamp`);
        
        // ✅ Analyze document content to determine what HMI elements this screen needs
        const screenElements = this.analyzeDocumentForHMIElements(screen, screenContent, documentContext);
        
        // ✅ Add screen-specific elements based on document analysis
        elements.push(...screenElements);
        
        // ✅ Always add system status and data logging (common GT Works pattern)
        elements.push(`📥 Device Status Display: Bottom-left (50, 800) - ${systemType} system status`);
        elements.push(`💾 Data Logging Viewer: Bottom-right (1400, 800) - Process data recording`);
        
        return elements;
    }

    // ✅ ENHANCED: Analyze document content to determine what HMI elements each screen needs
    analyzeDocumentForHMIElements(screen, screenContent, documentContext) {
        const screenName = screen.screenName.toLowerCase();
        const elements = [];
        
        // ✅ Use the enhanced screen content that includes detailed FDS section parsing
        const relatedEquipment = screenContent.relatedEquipment || [];
        const keyOperations = screenContent.keyOperations || [];
        const parameters = screenContent.parameters || [];
        
        // ✅ Map enhanced content to GT Works elements
        elements.push(...this.mapEquipmentToGTElements(relatedEquipment, screenName));
        elements.push(...this.mapOperationsToGTElements(keyOperations, screenName));
        elements.push(...this.mapParametersToGTElements(parameters, screenName));
        
        // ✅ If no specific elements found, use enhanced document-driven fallback
        if (elements.length === 0) {
            elements.push(...this.generateDocumentDrivenFallback(screen, screenContent, documentContext));
        }
        
        return elements;
    }

    // ✅ NEW: Extract screen description from document
    extractScreenDescription(screenName, fdsContent) {
        const screenPatterns = [
            new RegExp(`${screenName}[^.]*([^.]{50,200})`, 'i'),
            new RegExp(`screen[^.]*${screenName}[^.]*([^.]{50,200})`, 'i'),
            new RegExp(`${screenName}[\\s\\S]{0,300}`, 'i')
        ];
        
        for (const pattern of screenPatterns) {
            const match = fdsContent.match(pattern);
            if (match) {
                return match[0];
            }
        }
        
        return '';
    }

    // ✅ NEW: Extract required controls from document
    extractRequiredControls(screenName, fdsContent) {
        const controls = [];
        
        // ✅ Look for control-related keywords in document
        const controlPatterns = [
            /start|stop|run|pause|enable|disable|on|off|open|close/gi,
            /button|switch|control|operate|activate|deactivate/gi,
            /manual|auto|automatic|override|interlock/gi
        ];
        
        const screenSection = this.extractScreenSection(screenName, fdsContent);
        
        controlPatterns.forEach(pattern => {
            const matches = screenSection.match(pattern);
            if (matches) {
                controls.push(...matches.slice(0, 3));
            }
        });
        
        return [...new Set(controls)]; // Remove duplicates
    }

    // ✅ NEW: Extract monitored values from document
    extractMonitoredValues(screenName, fdsContent) {
        const values = [];
        
        // ✅ Look for measurable parameters in document
        const valuePatterns = [
            /temperature|pressure|flow|level|speed|rpm|voltage|current|power/gi,
            /sensor|measurement|reading|value|parameter|data/gi,
            /\d+\s*(°c|°f|psi|bar|gpm|lpm|rpm|hz|v|a|%)/gi
        ];
        
        const screenSection = this.extractScreenSection(screenName, fdsContent);
        
        valuePatterns.forEach(pattern => {
            const matches = screenSection.match(pattern);
            if (matches) {
                values.push(...matches.slice(0, 3));
            }
        });
        
        return [...new Set(values)]; // Remove duplicates
    }

    // ✅ NEW: Extract user interactions from document
    extractUserInteractions(screenName, fdsContent) {
        const interactions = [];
        
        // ✅ Look for interaction keywords in document
        const interactionPatterns = [
            /input|enter|select|choose|set|adjust|configure/gi,
            /login|logout|access|permission|user|operator/gi,
            /alarm|alert|acknowledge|silence|reset/gi
        ];
        
        const screenSection = this.extractScreenSection(screenName, fdsContent);
        
        interactionPatterns.forEach(pattern => {
            const matches = screenSection.match(pattern);
            if (matches) {
                interactions.push(...matches.slice(0, 3));
            }
        });
        
        return [...new Set(interactions)]; // Remove duplicates
    }

    // ✅ NEW: Extract screen-specific section from document
    extractScreenSection(screenName, fdsContent) {
        const screenPatterns = [
            new RegExp(`${screenName}[\\s\\S]{0,500}`, 'i'),
            new RegExp(`[\\s\\S]{0,200}${screenName}[\\s\\S]{0,300}`, 'i')
        ];
        
        for (const pattern of screenPatterns) {
            const match = fdsContent.match(pattern);
            if (match) {
                return match[0];
            }
        }
        
        return fdsContent.substring(0, 500); // Fallback to first 500 chars
    }

    // ✅ NEW: Map document controls to GT Works elements
    mapControlsToGTElements(controls, screenName) {
        const elements = [];
        const positions = this.generateElementPositions(controls.length, 'left');
        
        controls.forEach((control, index) => {
            const pos = positions[index];
            const controlType = this.determineControlType(control);
            
            if (controlType === 'button') {
                elements.push(`🟩 Button: Left panel (${pos.x}, ${pos.y}) - ${control} control button`);
            } else if (controlType === 'switch') {
                elements.push(`🔄 Switch: Left panel (${pos.x}, ${pos.y}) - ${control} toggle switch`);
            } else {
                elements.push(`🟩 Button: Left panel (${pos.x}, ${pos.y}) - ${control} operation`);
            }
        });
        
        return elements;
    }

    // ✅ NEW: Map document values to GT Works elements
    mapValuesToGTElements(values, screenName) {
        const elements = [];
        const positions = this.generateElementPositions(values.length, 'center');
        
        values.forEach((value, index) => {
            const pos = positions[index];
            const valueType = this.determineValueType(value);
            
            if (valueType === 'numeric') {
                elements.push(`🧮 Numeric Display: Center area (${pos.x}, ${pos.y}) - ${value} reading`);
            } else if (valueType === 'status') {
                elements.push(`📶 Lamp Indicator: Center area (${pos.x}, ${pos.y}) - ${value} status`);
            } else if (valueType === 'trend') {
                elements.push(`📈 Trend Graph: Center area (${pos.x}, ${pos.y}) - ${value} trend`);
            } else {
                elements.push(`🔠 Text Display: Center area (${pos.x}, ${pos.y}) - ${value} information`);
            }
        });
        
        return elements;
    }

    // ✅ NEW: Map document interactions to GT Works elements
    mapInteractionsToGTElements(interactions, screenName) {
        const elements = [];
        const positions = this.generateElementPositions(interactions.length, 'right');
        
        interactions.forEach((interaction, index) => {
            const pos = positions[index];
            const interactionType = this.determineInteractionType(interaction);
            
            if (interactionType === 'input') {
                elements.push(`🧮 Numeric Input: Right panel (${pos.x}, ${pos.y}) - ${interaction} input field`);
            } else if (interactionType === 'alarm') {
                elements.push(`📛 Alarm Lamp: Right panel (${pos.x}, ${pos.y}) - ${interaction} indicator`);
            } else if (interactionType === 'user') {
                elements.push(`🔑 Login Button: Right panel (${pos.x}, ${pos.y}) - ${interaction} access`);
            } else {
                elements.push(`🔀 Screen Change Button: Right panel (${pos.x}, ${pos.y}) - ${interaction} navigation`);
            }
        });
        
        return elements;
    }

    // ✅ NEW: Map equipment to GT Works elements
    mapEquipmentToGTElements(equipment, screenName) {
        const elements = [];
        const positions = this.generateElementPositions(equipment.length, 'center');
        
        equipment.forEach((item, index) => {
            const pos = positions[index];
            const itemLower = item.toLowerCase();
            
            if (itemLower.includes('button') || itemLower.includes('start') || itemLower.includes('stop')) {
                elements.push(`🟩 Button: Center panel (${pos.x}, ${pos.y}) - ${item} control`);
            } else if (itemLower.includes('voltage') || itemLower.includes('current') || itemLower.includes('frequency')) {
                elements.push(`🧮 Numeric Display: Center panel (${pos.x}, ${pos.y}) - ${item} reading`);
            } else if (itemLower.includes('temperature') || itemLower.includes('pressure') || itemLower.includes('rpm')) {
                elements.push(`🌡️ Gauge: Center panel (${pos.x}, ${pos.y}) - ${item} gauge`);
            } else if (itemLower.includes('indicator') || itemLower.includes('status') || itemLower.includes('lamp')) {
                elements.push(`📶 Status Indicator: Center panel (${pos.x}, ${pos.y}) - ${item} status`);
            } else if (itemLower.includes('switch') || itemLower.includes('selector')) {
                elements.push(`🔄 Switch: Center panel (${pos.x}, ${pos.y}) - ${item} selector`);
            } else {
                elements.push(`📊 Data Display: Center panel (${pos.x}, ${pos.y}) - ${item} information`);
            }
        });
        
        return elements;
    }

    // ✅ NEW: Map operations to GT Works elements
    mapOperationsToGTElements(operations, screenName) {
        const elements = [];
        const positions = this.generateElementPositions(operations.length, 'left');
        
        operations.forEach((operation, index) => {
            const pos = positions[index];
            const opLower = operation.toLowerCase();
            
            if (opLower.includes('start') || opLower.includes('stop') || opLower.includes('run')) {
                elements.push(`🟩 Button: Left panel (${pos.x}, ${pos.y}) - ${operation} control button`);
            } else if (opLower.includes('emergency') || opLower.includes('reset')) {
                elements.push(`🔴 Emergency Button: Left panel (${pos.x}, ${pos.y}) - ${operation} emergency control`);
            } else if (opLower.includes('manual') || opLower.includes('auto')) {
                elements.push(`🔄 Mode Switch: Left panel (${pos.x}, ${pos.y}) - ${operation} mode selector`);
            } else if (opLower.includes('test') || opLower.includes('calibrate')) {
                elements.push(`🔧 Test Button: Left panel (${pos.x}, ${pos.y}) - ${operation} test control`);
            } else if (opLower.includes('alarm') || opLower.includes('acknowledge')) {
                elements.push(`🔔 Alarm Control: Left panel (${pos.x}, ${pos.y}) - ${operation} alarm control`);
            } else {
                elements.push(`🟩 Button: Left panel (${pos.x}, ${pos.y}) - ${operation} operation`);
            }
        });
        
        return elements;
    }

    // ✅ NEW: Map parameters to GT Works elements
    mapParametersToGTElements(parameters, screenName) {
        const elements = [];
        const positions = this.generateElementPositions(parameters.length, 'right');
        
        parameters.forEach((param, index) => {
            const pos = positions[index];
            const paramLower = param.toLowerCase();
            
            if (paramLower.includes('voltage') || paramLower.includes('current') || paramLower.includes('frequency')) {
                elements.push(`🧮 Numeric Display: Right panel (${pos.x}, ${pos.y}) - ${param} reading`);
            } else if (paramLower.includes('temperature') || paramLower.includes('pressure')) {
                elements.push(`🌡️ Gauge: Right panel (${pos.x}, ${pos.y}) - ${param} gauge`);
            } else if (paramLower.includes('rpm') || paramLower.includes('speed')) {
                elements.push(`⚡ Speed Display: Right panel (${pos.x}, ${pos.y}) - ${param} monitor`);
            } else if (paramLower.includes('fuel') || paramLower.includes('oil') || paramLower.includes('coolant')) {
                elements.push(`🛢️ Level Indicator: Right panel (${pos.x}, ${pos.y}) - ${param} level`);
            } else if (paramLower.includes('hours') || paramLower.includes('counter') || paramLower.includes('timer')) {
                elements.push(`⏱️ Counter Display: Right panel (${pos.x}, ${pos.y}) - ${param} counter`);
            } else if (paramLower.includes('mode') || paramLower.includes('status') || paramLower.includes('state')) {
                elements.push(`📶 Status Display: Right panel (${pos.x}, ${pos.y}) - ${param} status`);
            } else {
                elements.push(`📊 Data Display: Right panel (${pos.x}, ${pos.y}) - ${param} information`);
            }
        });
        
        return elements;
    }

    // ✅ NEW: Generate positions for elements to avoid overlapping
    generateElementPositions(count, area) {
        const positions = [];
        let baseX, baseY;
        
        switch (area) {
            case 'left':
                baseX = 50;
                baseY = 200;
                break;
            case 'center':
                baseX = 400;
                baseY = 300;
                break;
            case 'right':
                baseX = 1200;
                baseY = 200;
                break;
            default:
                baseX = 400;
                baseY = 300;
        }
        
        for (let i = 0; i < count; i++) {
            positions.push({
                x: baseX + (i % 2) * 200,
                y: baseY + Math.floor(i / 2) * 70
            });
        }
        
        return positions;
    }

    // ✅ NEW: Determine control type from document text
    determineControlType(control) {
        const controlLower = control.toLowerCase();
        
        if (controlLower.includes('start') || controlLower.includes('stop') || controlLower.includes('run')) {
            return 'button';
        } else if (controlLower.includes('on') || controlLower.includes('off') || controlLower.includes('toggle')) {
            return 'switch';
        } else {
            return 'button';
        }
    }

    // ✅ NEW: Determine value type from document text
    determineValueType(value) {
        const valueLower = value.toLowerCase();
        
        if (valueLower.match(/\d+/) || valueLower.includes('temperature') || valueLower.includes('pressure')) {
            return 'numeric';
        } else if (valueLower.includes('status') || valueLower.includes('state')) {
            return 'status';
        } else if (valueLower.includes('trend') || valueLower.includes('history')) {
            return 'trend';
        } else {
            return 'text';
        }
    }

    // ✅ NEW: Determine interaction type from document text
    determineInteractionType(interaction) {
        const interactionLower = interaction.toLowerCase();
        
        if (interactionLower.includes('input') || interactionLower.includes('enter') || interactionLower.includes('set')) {
            return 'input';
        } else if (interactionLower.includes('alarm') || interactionLower.includes('alert')) {
            return 'alarm';
        } else if (interactionLower.includes('user') || interactionLower.includes('login') || interactionLower.includes('access')) {
            return 'user';
        } else {
            return 'navigation';
        }
    }

    // ✅ NEW: Generate document-driven fallback when no specific elements found
    generateDocumentDrivenFallback(screen, screenContent, documentContext) {
        const elements = [];
        const screenName = screen.screenName;
        
        // ✅ Use document content to generate basic elements
        if (screenContent.relatedEquipment && screenContent.relatedEquipment.length > 0) {
            elements.push(`🔧 Equipment Control: Left panel (50, 200) - ${screenContent.relatedEquipment[0]} control`);
        }
        
        if (screenContent.keyOperations && screenContent.keyOperations.length > 0) {
            elements.push(`🟩 Button: Center area (400, 300) - ${screenContent.keyOperations[0]} operation`);
        }
        
        if (screenContent.parameters && screenContent.parameters.length > 0) {
            elements.push(`🧮 Numeric Display: Right panel (1200, 200) - ${screenContent.parameters[0]} reading`);
        }
        
        // ✅ Add screen-specific GT Works element
        elements.push(`🎛️ ${screenName} Control Panel: Center-top (400, 100) - Main ${screenName} interface`);
        
        return elements;
    }

    // ✅ NEW: Get screen purpose based on category
    getScreenPurpose(screen, category, systemType) {
        const purposes = {
            'home': `Main entry point providing system overview and quick access to all operational functions for the ${systemType} system`,
            'control': `Primary operational interface for controlling ${systemType} processes and monitoring real-time system status`,
            'monitoring': `Real-time monitoring dashboard displaying critical process parameters and system health indicators`,
            'settings': `Configuration interface for system parameters, calibration values, and operational settings`,
            'alarm': `Alarm management system for viewing, acknowledging, and analyzing system faults and warnings`,
            'user': `User management interface for access control, authentication, and role-based permissions`,
            'test': `Testing and diagnostic interface for system validation, calibration, and troubleshooting procedures`,
            'maintenance': `Maintenance mode interface for system servicing, diagnostics, and performance optimization`
        };
        
        return purposes[category] || `Specialized interface for ${screen.screenName.toLowerCase()} operations in the ${systemType} system`;
    }

    // ✅ NEW: Get screen key elements
    getScreenKeyElements(screen, category, systemType) {
        const elements = {
            'home': [
                'System status overview with health indicators',
                'Quick navigation buttons to main functions',
                'Current user information and access level',
                'System time and operational mode display'
            ],
            'control': [
                'Process control buttons (Start, Stop, Pause)',
                'Real-time parameter displays and status indicators',
                'Setpoint adjustment controls',
                'Safety interlocks and emergency stop functions'
            ],
            'monitoring': [
                'Real-time data tables with process values',
                'Trend charts and historical data visualization',
                'Alarm status indicators and counts',
                'Performance metrics and efficiency indicators'
            ],
            'settings': [
                'Parameter configuration forms',
                'Calibration adjustment controls',
                'System configuration options',
                'Save/Load configuration buttons'
            ],
            'alarm': [
                'Active alarm list with priority indication',
                'Alarm acknowledgment buttons',
                'Alarm history and event log',
                'Alarm filtering and search capabilities'
            ],
            'user': [
                'User login/logout interface',
                'Access level management controls',
                'User profile and permissions display',
                'Security settings and password management'
            ],
            'test': [
                'Test sequence control buttons',
                'Diagnostic parameter displays',
                'Test result indicators and logs',
                'Calibration verification tools'
            ]
        };
        
        return elements[category] || [
            'Screen-specific control elements',
            'Status and data display components',
            'Navigation and action buttons',
            'System feedback indicators'
        ];
    }

    // ✅ NEW: Get screen behavior
    getScreenBehavior(screen, category) {
        const behaviors = {
            'home': 'Auto-refreshes every 5 seconds, provides quick navigation to other screens',
            'control': 'Real-time updates every 1 second, provides immediate feedback on control actions',
            'monitoring': 'Continuous data refresh, automatic alarm notifications, trend data logging',
            'settings': 'Static display until user makes changes, validation before saving parameters',
            'alarm': 'Real-time alarm updates, audio/visual notifications, automatic priority sorting',
            'user': 'Session-based display, automatic logout after inactivity, secure authentication',
            'test': 'Step-by-step test execution, real-time result updates, automatic report generation'
        };
        
        return behaviors[category] || 'Interactive display with real-time updates and user feedback';
    }

    // ✅ NEW: Get screen functionality
    getScreenFunctionality(screen, category, systemType) {
        const functionalities = {
            'home': [
                'System overview and health monitoring',
                'Quick navigation to operational screens',
                'User session management',
                'System status announcements'
            ],
            'control': [
                'Process start/stop/pause operations',
                'Real-time parameter monitoring',
                'Setpoint adjustments and control',
                'Safety system monitoring'
            ],
            'monitoring': [
                'Real-time data visualization',
                'Trend analysis and historical data review',
                'Performance metrics calculation',
                'Alarm monitoring and notification'
            ],
            'settings': [
                'System parameter configuration',
                'Calibration and adjustment procedures',
                'Configuration backup and restore',
                'User preference management'
            ],
            'alarm': [
                'Active alarm monitoring and display',
                'Alarm acknowledgment and clearing',
                'Alarm history and event logging',
                'Alarm filtering and search functions'
            ],
            'user': [
                'User authentication and authorization',
                'Access level management',
                'User profile configuration',
                'Security settings management'
            ],
            'test': [
                'Automated test sequence execution',
                'Manual diagnostic procedures',
                'Test result analysis and reporting',
                'Calibration verification and adjustment'
            ]
        };
        
        return functionalities[category] || [
            'Specialized operational functions',
            'Data input and validation',
            'Process control and monitoring',
            'System interaction and feedback'
        ];
    }

    // ✅ NEW: Get navigation triggers
    getNavigationTriggers(screen, category) {
        const triggers = {
            'home': ['System startup', 'User login', 'Home button from any screen'],
            'control': ['Start operation button', 'Control mode selection', 'Process control menu'],
            'monitoring': ['Monitor button', 'Data view selection', 'Alarm notification'],
            'settings': ['Settings button', 'Configuration menu', 'Admin access'],
            'alarm': ['Alarm notification', 'Alarm button', 'Emergency condition'],
            'user': ['User menu', 'Login screen', 'Access control requirement'],
            'test': ['Test button', 'Diagnostic menu', 'Maintenance mode']
        };
        
        return triggers[category] || ['User navigation', 'Menu selection', 'System condition'];
    }

    // ✅ NEW: Get data visualization type
    getDataVisualization(screen, category) {
        const visualizations = {
            'home': 'Status indicators, system overview cards, quick metrics display',
            'control': 'Real-time gauges, status lights, control button feedback',
            'monitoring': 'Data tables, trend charts, alarm status indicators',
            'settings': 'Configuration forms, parameter lists, validation feedback',
            'alarm': 'Alarm lists, priority indicators, timestamp displays',
            'user': 'User tables, access level indicators, login status',
            'test': 'Test result displays, progress indicators, diagnostic charts'
        };
        
        return visualizations[category] || 'Standard data displays with real-time updates';
    }

    // ✅ NEW: Get user roles
    getUserRoles(screen, category) {
        const roles = {
            'home': 'All users (Operator, Technician, Administrator)',
            'control': 'Operator, Technician, Administrator',
            'monitoring': 'All users (read-only for some)',
            'settings': 'Technician, Administrator only',
            'alarm': 'All users (acknowledgment rights vary)',
            'user': 'Administrator only',
            'test': 'Technician, Administrator only'
        };
        
        return roles[category] || 'Operator, Technician, Administrator';
    }

    // ✅ NEW: Get transition trigger
    getTransitionTrigger(fromScreen, toScreen) {
        const triggers = [
            'Button click',
            'Menu selection',
            'Auto-navigation',
            'User action',
            'System event',
            'Alarm condition',
            'Mode change'
        ];
        
        return triggers[Math.floor(Math.random() * triggers.length)];
    }

    // ✅ NEW: Get transition purpose
    getTransitionPurpose(fromScreen, toScreen) {
        return `${toScreen.screenName.toLowerCase()} operations`;
    }

    // ✅ Step 2: Generate single comprehensive screen layout (UPDATED - removed screen count step)
    async generateScreenImages() {
        this.updateProgress('screen-generation', '🎨 Step 2: Generating enhanced screen layouts (Individual + Combined)...');
        
        // ✅ Check if canvas is available
        if (!createCanvas) {
            this.updateProgress('screen-generation', '⚠️ Canvas not available, providing specifications only...');
            
            // FIX: Use screenAnalysis directly as an array
            const screens = this.sessionData.screenAnalysis;
            if (!Array.isArray(screens)) {
                throw new Error('Screen analysis is not an array!');
            }
            
            // Generate specifications only
            const screenSpecs = [];
            for (let i = 0; i < screens.length; i++) {
                const screen = screens[i];
                this.updateProgress('screen-generation', `📋 Generating spec for screen ${i + 1}: ${screen.screenName}`);
                
                try {
                    const screenSpec = await this.generateScreenSpecification(screen);
                    screenSpecs.push(screenSpec);
                } catch (error) {
                    console.error(`❌ Error generating spec for ${screen.screenName}:`, error);
                    screenSpecs.push({
                        screenTitle: screen.screenName,
                        error: error.message
                    });
                }
            }
            
            return {
                screenAnalysis: this.sessionData.screenAnalysis || null,
                workflowDiagram: this.sessionData.workflowDiagram || null,
                screenImages: screenSpecs.map(spec => ({
                    screenName: spec.screenTitle,
                    screenType: 'specification_only',
                    purpose: spec.screenPurpose || `Specification for ${spec.screenTitle}`,
                    imagePath: null,
                    imageUrl: null,
                    specification: spec,
                    note: 'Canvas not available on Azure - specifications provided instead'
                })),
                summary: {
                    totalScreens: screens.length,
                    individualScreens: screenSpecs.length,
                    successfulScreens: screenSpecs.length,
                    failedScreens: 0,
                    layoutTypes: ['specification_only'],
                    generatedAt: new Date().toISOString(),
                    status: 'completed',
                    layoutType: 'specification_only',
                    platformNote: 'Running on Azure - image generation disabled for compatibility'
                }
            };
        }
        
        // FIX: Use screenAnalysis directly as an array
        const screens = this.sessionData.screenAnalysis;
        if (!Array.isArray(screens)) {
            throw new Error('Screen analysis is not an array!');
        }
        const documentContext = this.getDocumentContext();
        
        // Ensure outputs directory exists
        const outputDir = path.join(__dirname, '../outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        try {
            // ✅ STEP 1: Generate individual screen specifications with AI
            this.updateProgress('screen-generation', '🤖 Generating AI-powered screen specifications...');
            const screenSpecs = [];
            
            for (let i = 0; i < screens.length; i++) {
                const screen = screens[i];
                this.updateProgress('screen-generation', `🎨 Processing ${screen.screenName}...`);
                
                try {
                    const screenSpec = await this.generateScreenSpecification(screen);
                    
                    // ✅ Create individual screen image
                    const canvas = await this.createScreenImage(screenSpec);
                    const timestamp = Date.now() + i; // Avoid naming conflicts
                    const imagePath = path.join(outputDir, `screen_${timestamp}_${screen.screenId || i}.png`);
                    const buffer = canvas.toBuffer('image/png');
                    fs.writeFileSync(imagePath, buffer);
                    
                    screenSpecs.push({
                        ...screenSpec,
                        screenId: screen.screenId || `screen_${i + 1}`,
                        imagePath: imagePath,
                        imageUrl: `/outputs/${path.basename(imagePath)}`
                    });
                    
                    console.log(`✅ Successfully generated ${screen.screenName}`);
                } catch (screenError) {
                    console.error(`❌ Error generating ${screen.screenName}:`, screenError);
                    
                    // ✅ Add fallback entry for failed screen
                    screenSpecs.push({
                        screenTitle: screen.screenName,
                        screenId: screen.screenId || `screen_${i + 1}`,
                        error: screenError.message,
                        imagePath: null,
                        imageUrl: null
                    });
                }
            }
            
            // ✅ STEP 2: Generate workflow-driven combined layout (Primary Output)
            let combinedLayout = null;
            try {
                console.log('🎨 Generating comprehensive workflow-driven combined layout...');
                // Use all screen specifications, not just successful individual screens
                combinedLayout = await this.exportWorkflowDrivenLayoutAsPNG(screenSpecs);
                console.log('✅ Workflow-driven combined layout generated successfully');
            } catch (combinedError) {
                console.error('❌ Error generating workflow-driven combined layout:', combinedError);
            }
            
            // ✅ STEP 3: Generate comprehensive screen layout (legacy format)
            let comprehensiveImagePath = null;
            try {
                console.log('🎨 Generating comprehensive legacy layout...');
                comprehensiveImagePath = await this.createComprehensiveScreenLayout(screens, documentContext);
                console.log('✅ Comprehensive layout generated successfully');
            } catch (comprehensiveError) {
                console.error('❌ Error generating comprehensive layout:', comprehensiveError);
            }
            
            // ✅ Store all generated images in session
            const generatedScreens = [];
            
            // Add individual screens
            screenSpecs.forEach(spec => {
                generatedScreens.push({
                    screenName: spec.screenTitle,
                    screenType: 'individual',
                    purpose: spec.screenPurpose || `Individual ${spec.screenTitle} interface`,
                    imagePath: spec.imagePath,
                    imageUrl: spec.imageUrl,
                    specification: spec,
                    error: spec.error || null
                });
            });
            
            // Add workflow-driven combined layout if generated successfully (PRIMARY OUTPUT)
            if (combinedLayout && combinedLayout.path) {
                generatedScreens.unshift({ // Add to beginning of array as primary output
                    screenName: combinedLayout.type === 'workflow-driven' 
                        ? 'Workflow-Driven HMI Layout' 
                        : 'Combined Layout (Figma-style)',
                    screenType: combinedLayout.type === 'workflow-driven' 
                        ? 'workflow_comprehensive' 
                        : 'figma_grid',
                    purpose: combinedLayout.description || 'Professional grid layout showing all screens',
                    imagePath: combinedLayout.path,
                    imageUrl: combinedLayout.url,
                    isPrimary: true, // Mark as primary output
                    workflowDriven: combinedLayout.type === 'workflow-driven'
                });
            }
            
            // Add comprehensive layout if generated successfully
            if (comprehensiveImagePath) {
                generatedScreens.push({
                    screenName: 'Comprehensive HMI Layout (Legacy)',
                    screenType: 'comprehensive',
                    purpose: 'Complete system overview with all screens',
                    imagePath: comprehensiveImagePath,
                    imageUrl: `/outputs/${path.basename(comprehensiveImagePath)}`
                });
            }
            
            this.sessionData.generatedScreens = generatedScreens;
            
            // ✅ Calculate success metrics
            const successfulScreens = screenSpecs.filter(spec => spec.imagePath && !spec.error);
            const failedScreens = screenSpecs.filter(spec => spec.error);
            
            // ✅ Return enhanced structure with all layouts
            return {
                screenAnalysis: this.sessionData.screenAnalysis || null,
                workflowDiagram: this.sessionData.workflowDiagram || null,
                screenImages: this.sessionData.generatedScreens,
                summary: {
                    totalScreens: screens.length,
                    individualScreens: screenSpecs.length,
                    successfulScreens: successfulScreens.length,
                    failedScreens: failedScreens.length,
                    layoutTypes: this.sessionData.generatedScreens.map(screen => screen.screenType),
                    generatedAt: new Date().toISOString(),
                    status: failedScreens.length === 0 ? 'completed' : 'partial_success',
                    layoutType: 'enhanced_multi_format'
                }
            };
            
        } catch (error) {
            console.error('❌ Error generating enhanced screen layouts:', error);
            
            // Return error structure
            return {
                screenAnalysis: this.sessionData.screenAnalysis,
                workflowDiagram: this.sessionData.workflowDiagram,
                screenImages: [{
                    screenName: 'Error',
                    error: error.message
                }],
                summary: {
                    totalScreens: 0,
                    generatedAt: new Date().toISOString(),
                    status: 'error'
                }
            };
        }
    }

    // ✅ Generate detailed screen specification with document context
    async generateScreenSpecification(screen) {
        this.updateProgress('screen-generation', `🎨 Generating specification for ${screen.screenName}...`);
        
        // ✅ Get document context for better screen generation
        const documentContext = this.getDocumentContext();
        
        // ✅ Use AI to generate context-aware specifications based on actual document content
        const aiGeneratedSpec = await this.generateAIContextualSpec(screen, documentContext);
        
        console.log(`✅ AI-generated specification created for ${screen.screenName}`);
        return aiGeneratedSpec;
    }

    // ✅ NEW: Get document context to understand what type of system we're designing for
    getDocumentContext() {
        const fdsContent = this.sessionData.fdsContent || '';
        const screenList = this.sessionData.screenAnalysis?.screenList || [];
        
        // ✅ FIXED: Use FULL document content instead of truncated version
        const documentSample = fdsContent.substring(0, 2000); // Keep sample for overview
        const systemKeywords = this.extractSystemKeywords(fdsContent);
        
        return {
            documentSample,
            systemKeywords,
            totalScreens: screenList.length,
            screenNames: screenList.map(s => s.screenName),
            screenList,
            fdsContent: fdsContent // ✅ FIXED: Use full content, not truncated
        };
    }

    // ✅ ENHANCED: Extract system keywords with generator-specific patterns
    extractSystemKeywords(content) {
        const lowerContent = content.toLowerCase();
        const keywords = {
            systemType: [],
            operations: [],
            components: [],
            controls: []
        };
        
        // ✅ FIXED: Generator-specific system type detection patterns
        const systemPatterns = {
            'generator_control': ['generator', 'standby', 'backup', 'power', 'diesel', 'engine', 'alternator', 'utility', 'transfer', 'switch'],
            'water_treatment': ['water', 'treatment', 'filtration', 'purification', 'clarification', 'chlorination', 'disinfection'],
            'gas_analyzer': ['gas', 'analyzer', 'sf6', 'concentration', 'ppm', 'measurement', 'spectrometer'],
            'motor_control': ['motor', 'drive', 'speed', 'torque', 'rpm', 'inverter', 'starter'],
            'pump_system': ['pump', 'flow', 'pressure', 'suction', 'discharge', 'centrifugal', 'impeller'],
            'cylinder_control': ['cylinder', 'extend', 'retract', 'acting', 'pneumatic', 'hydraulic', 'actuator'],
            'plc_system': ['plc', 'logic', 'controller', 'input', 'output', 'ladder', 'programming'],
            'hvac_system': ['hvac', 'temperature', 'heating', 'cooling', 'ventilation', 'air', 'conditioning'],
            'conveyor_system': ['conveyor', 'belt', 'transport', 'material', 'handling', 'sorting'],
            'valve_control': ['valve', 'open', 'close', 'position', 'actuator', 'flow', 'control'],
            'power_generation': ['generator', 'turbine', 'power', 'electrical', 'grid', 'transmission'],
            'chemical_processing': ['chemical', 'reactor', 'distillation', 'separation', 'catalyst', 'process'],
            'oil_gas_processing': ['oil', 'gas', 'refinery', 'crude', 'petroleum', 'hydrocarbon', 'pipeline'],
            'manufacturing': ['manufacturing', 'production', 'assembly', 'fabrication', 'quality', 'inspection'],
            'packaging': ['packaging', 'labeling', 'sealing', 'filling', 'wrapping', 'bottling'],
            'food_beverage': ['food', 'beverage', 'pasteurization', 'sterilization', 'fermentation', 'mixing']
        };
        
        // ✅ FIXED: Improved contextual system type detection
        const systemTypeScores = {};
        
        // ✅ Calculate weighted scores based on keyword frequency and context
        for (const [type, patterns] of Object.entries(systemPatterns)) {
            let score = 0;
            const matchedPatterns = [];
            
            patterns.forEach(pattern => {
                const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
                const matches = lowerContent.match(regex);
                if (matches) {
                    score += matches.length;
                    matchedPatterns.push(pattern);
                }
            });
            
            // ✅ Bonus for having multiple different patterns (not just frequency)
            if (matchedPatterns.length >= 2) {
                score += matchedPatterns.length * 2;
            }
            
            // ✅ Bonus for primary domain keywords (higher weight)
            const primaryKeywords = {
                'generator_control': ['generator', 'standby', 'backup', 'power', 'diesel', 'engine', 'alternator'],
                'water_treatment': ['water', 'treatment'],
                'gas_analyzer': ['gas', 'analyzer'],
                'motor_control': ['motor', 'control'],
                'pump_system': ['pump', 'system']
            };
            
            if (primaryKeywords[type]) {
                primaryKeywords[type].forEach(primary => {
                    if (lowerContent.includes(primary)) {
                        score += 5; // Higher weight for primary keywords
                    }
                });
            }
            
            if (score > 0) {
                systemTypeScores[type] = score;
            }
        }
        
        // ✅ Select the system type with highest score
        if (Object.keys(systemTypeScores).length > 0) {
            const bestMatch = Object.entries(systemTypeScores)
                .sort(([,a], [,b]) => b - a)[0];
            
            // ✅ Only add if score is significant enough
            if (bestMatch[1] >= 3) {
                keywords.systemType.push(bestMatch[0]);
            }
        }
        
        // ✅ Fallback to generic if no strong match
        if (keywords.systemType.length === 0) {
            keywords.systemType.push('industrial_control');
        }
        
        // ✅ ENHANCED: Generator-specific operation keywords
        const operationPatterns = [
            'start', 'stop', 'manual', 'auto', 'automatic', 'test', 'calibrate', 'settings', 'alarm', 'reset',
            'transfer', 'utility', 'generator', 'emergency', 'override', 'load', 'shed', 'paralleling'
        ];
        keywords.operations = operationPatterns.filter(op => lowerContent.includes(op));
        
        // ✅ ENHANCED: Generator-specific component keywords
        const componentPatterns = [
            'sensor', 'valve', 'motor', 'pump', 'heater', 'cooler', 'display', 'button', 'indicator',
            'engine', 'alternator', 'generator', 'battery', 'charger', 'voltage', 'current', 'frequency',
            'temperature', 'pressure', 'rpm', 'fuel', 'coolant', 'oil', 'air', 'filter', 'transfer', 'switch'
        ];
        keywords.components = componentPatterns.filter(comp => lowerContent.includes(comp));
        
        // ✅ ENHANCED: Generator-specific control keywords
        const controlPatterns = [
            'control', 'monitor', 'feedback', 'status', 'command', 'setpoint', 'parameter',
            'operating', 'mode', 'selector', 'protection', 'interlock', 'safety', 'emergency'
        ];
        keywords.controls = controlPatterns.filter(ctrl => lowerContent.includes(ctrl));
        
        return keywords;
    }

    // ✅ NEW: Generate AI-powered contextual specifications (Enhanced)
    async generateAIContextualSpec(screen, documentContext) {
        console.log(`🤖 Using enhanced AI to generate contextual spec for ${screen.screenName}...`);
        
        try {
            // ✅ Create enhanced AI prompt
            const aiPrompt = this.createScreenSpecPrompt(screen, documentContext);
            
            // ✅ Call OpenAI with enhanced system prompt and better model
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",  // Use more powerful model for better results
                messages: [
                    {
                        role: "system", 
                        content: `You are an expert Industrial HMI Designer with 20+ years of experience creating professional control interfaces for industrial systems.

CRITICAL REQUIREMENT: Each screen must be UNIQUE and DIFFERENT from all other screens. Analyze the document content carefully and create screens that are specific to the actual system described.

EXPERTISE AREAS:
- Gas analyzers, motor controls, pump systems, PLC systems
- Industrial safety standards and best practices
- Operator workflow optimization
- Real-time data visualization
- Alarm management and fault indication

DESIGN PRINCIPLES:
- Safety first: Critical controls clearly visible and accessible
- Efficiency: Minimize operator clicks and navigation
- Clarity: Clear status indication and data presentation
- Consistency: Uniform layouts and color schemes
- Context: System-specific terminology and operations
- UNIQUENESS: Each screen must have different elements and layout

RESPONSE REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no explanations)
- Create UNIQUE layouts for each screen based on its specific purpose
- Use ONLY components and operations mentioned in the FDS document
- Follow industrial color standards (Green=Normal, Red=Alarm, Yellow=Warning)
- Position elements logically based on operator workflow
- Make each screen visually distinct with different element types and arrangements

Generate contextually accurate HMI screens that real operators would use in industrial environments. Each screen should be unique and serve its specific function.`
                    },
                    {
                        role: "user",
                        content: aiPrompt
                    }
                ],
                max_tokens: 4000,  // Increased for more detailed responses
                temperature: 0.4   // Slightly higher for more variety while maintaining consistency
            });
            
            const aiResponse = response.choices[0].message.content;
            
            // ✅ Parse enhanced AI response
            try {
                // ✅ Clean response (remove any markdown formatting)
                const cleanedResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const parsedSpec = JSON.parse(cleanedResponse);
                
                // ✅ Validate and enhance the parsed specification
                const enhancedSpec = this.validateAndEnhanceSpec(parsedSpec, screen, documentContext);
                
                console.log(`✅ AI successfully generated enhanced spec for ${screen.screenName}`);
                console.log(`📋 Purpose: ${enhancedSpec.screenPurpose || 'Not specified'}`);
                console.log(`🧭 Navigation: ${enhancedSpec.navigation?.from?.length || 0} incoming, ${enhancedSpec.navigation?.to?.length || 0} outgoing`);
                
                return enhancedSpec;
            } catch (parseError) {
                console.log(`⚠️ AI response parsing failed for ${screen.screenName}:`, parseError.message);
                console.log('🔄 Raw AI response:', aiResponse.substring(0, 200) + '...');
                return this.generateFallbackSpec(screen, documentContext);
            }
            
        } catch (error) {
            console.error(`❌ Enhanced AI generation failed for ${screen.screenName}:`, error);
            return this.generateFallbackSpec(screen, documentContext);
        }
    }

    // ✅ UPGRADED: Create document-specific AI prompt for screen specification
    createScreenSpecPrompt(screen, documentContext) {
        // ✅ Extract relevant document content for this specific screen
        const screenRelevantContent = this.extractScreenRelevantContent(screen, documentContext);
        
        return `
You are an expert industrial HMI designer creating a screen for a real industrial system.

Create a UNIQUE and SPECIFIC HMI screen design for:
**Screen Name:** "${screen.screenName}"

### 📄 ACTUAL DOCUMENT CONTENT:
**System Description:** ${screenRelevantContent.systemDescription}
**Screen Purpose:** ${screen.screenPurpose || screenRelevantContent.screenPurpose}
**Related Equipment:** ${screenRelevantContent.relatedEquipment.join(', ')}
**Key Operations:** ${screenRelevantContent.keyOperations.join(', ')}
**Parameters:** ${screenRelevantContent.parameters.join(', ')}

### 📋 DOCUMENT CONTEXT:
- Document Sample: "${documentContext.documentSample.substring(0, 500)}"
        - System Type: ${documentContext.systemKeywords.systemType.join(', ') || 'industrial_control'}
- Detected Components: ${documentContext.systemKeywords.components.join(', ')}
- Detected Operations: ${documentContext.systemKeywords.operations.join(', ')}
- Other Screens: ${documentContext.screenNames.join(', ')}

### 🎯 SCREEN-SPECIFIC REQUIREMENTS:
${this.getScreenSpecificRequirements(screen, screenRelevantContent)}


### 🧭 FIXED LAYOUT SECTIONS (for all screens except Title):

**Header:**
- Always include a top header bar (height: 80px)
- Show screen title clearly (centered)
- Add battery percentage if provided in FDS (e.g., BATT#1, BATT#2)
- Include date and time in top-right
- Optionally show system/log info if available

**Footer:**
- Always include a bottom footer bar (height: 60px)
- Place navigation buttons here like "Home", "Settings", and others based on screen names in the FDS
- Buttons should reflect other available screens from the document context
- Do NOT add project-specific names — use only what's detected in document (like "Purging", "Pump Back", etc. if relevant)

These header and footer sections are mandatory on every screen **except the title screen**, if it exists.


### ✅ DESIGN INSTRUCTIONS:
Design a professional HMI screen that is UNIQUE and DIFFERENT from other screens:

**MANDATORY POSITIONING RULES:**
- Header elements must have position.y between 10 and 70 (for an 80px header).
- Footer elements must have position.y between 540 and 590 (for a 60px footer on an 800px canvas).
- Header elements should never overlap the main area or footer.
- Footer elements should never overlap the main area or header.

**MANDATORY UNIQUENESS REQUIREMENTS:**
- Each screen must have a DIFFERENT layout and element arrangement based details mentioned in the fds document
- Use DIFFERENT element types based on screen function
- Position elements in UNIQUE locations as mentioned in the fds document (not the same grid every time)
- Create DIFFERENT visual hierarchies for each screen type as mentioned in the fds document

**HMI ELEMENT TYPES TO CHOOSE FROM:**

Use from the following standard HMI components based on the **screen's purpose, system type, and detected operations in the FDS**. Select ONLY those elements that are relevant to the screen's function and what is described in the document.

1. **Control Button**  
   - Use for: Starting/stopping pumps, switching modes, triggering actions  
   - Appearance: Rectangular button with a label (e.g., "START", "STOP")  
   - Found in: Manual control, purge, pump, calibration screens  

2. **Bit Lamp (Status Indicator)**  
   - Use for: Showing ON/OFF or RUN/STOP states of equipment (valves, motors, sensors)  
   - Appearance: Circular/LED-like lamp with color coding (green = ON, red = fault, etc.)  
   - Found in: Control, monitoring, alarm, and interlock screens  

3. **Word Lamp (Multi-State Indicator)**  
   - Use for: Displaying multiple states (e.g., IDLE, RUNNING, ALARM, ERROR)  
   - Appearance: Text or color-coded block that changes based on system condition  

4. **Numerical Display (Data Display)**  
   - Use for: Showing live sensor data like temperature, pressure, voltage  
   - Appearance: Digital readout with label (e.g., "T1 = 45.3°C")  
   - Found in: Monitoring and process screens  

5. **Bar Graph / Level Indicator**  
   - Use for: Showing tank levels, flow rates, or completion status  
   - Appearance: Horizontal/vertical bar filling up/down based on value  

6. **Trend Graph / Chart**  
   - Use for: Plotting real-time or historical values over time (e.g., temperature trends)  
   - Appearance: Line or curve plotted on X-Y graph  
   - Found in: Diagnostics, testing, monitoring screens  

7. **Data Log Table / Alarm List**  
   - Use for: Displaying historical events, alarms, system logs  
   - Appearance: Tabular structure with date, time, and description  
   - Found in: Alarm, diagnostic, and test screens  

8. **Gauge (Analog Meter)**  
   - Use for: Visual analog display of pressure, speed, etc.  
   - Appearance: Circular dial with pointer  
   - Found in: Control panels, process visuals  

9. **Input Field (Numeric or Text Input)**  
   - Use for: Allowing operator to set threshold, delays, calibration values  
   - Appearance: Text box or numeric spinner  
   - Found in: Settings, calibration, configuration screens  

10. **Toggle Switch**  
    - Use for: ON/OFF control (single-bit change)  
    - Appearance: Flip-style or rectangular switch  
    - Example: Manual/Auto mode toggle  

11. **Navigation Button**  
    - Use for: Switching between screens (e.g., Home, Settings, Alarm)  
    - Appearance: Icon or labeled rectangular button  
    - Found in: Footer section of every screen except title  

12. **Multi-State Switch / Selector**  
    - Use for: Switching between 3 or more modes (e.g., AUTO, MANUAL, MAINTENANCE)  
    - Appearance: Rotary or button-set selector  

13. **Static Text / Label**  
    - Use for: Showing field names, unit labels, descriptions  
    - Appearance: Plain text (e.g., "BATT#1:", "Flow Rate:")  

14. **Date/Time Display**  
    - Use for: Showing current date and time  
    - Appearance: Digital format (e.g., 15/10/2024 10:10 AM)  
    - Found in: Header section of all screens  

15. **Battery Indicator / Custom Symbol**  
    - Use for: Showing power levels, communication status  
    - Appearance: Symbol or number (%), shown in header  

16. **Animation / Process Diagram**  
    - Use for: Showing process flow or movement of fluids/materials  
    - Appearance: Block diagram with animated components  
    - Found in: Main process or animation screens  

**SCREEN-SPECIFIC LAYOUT RULES:**
- HOME/MAIN: Navigation-focused with overview data
- CONTROL: Button-heavy with real-time monitoring
- TEST: Progress indicators and result displays
- ALARM: List-based with priority indicators
- SETTINGS: Form-based with input fields
- PUMP/PURGE: Process-specific controls and gauges

**ELEMENT POSITIONING REQUIREMENTS:**
- Vary element positions based on screen function
- Use different grid layouts for each screen type
- Consider operator workflow in element placement
- Create visual balance but avoid repetitive patterns

### 🖥️ CANVAS SPEC:
- Width: 800px
- Height: 600px
- Header height: 80px
- Footer height: 60px

### 🧾 OUTPUT FORMAT (VALID JSON):
Return a full valid JSON object:
{
  "screenTitle": "${screen.screenName}",
  "layout": {
    "header": {
      "title": "${screen.screenName}",
      "height": 80,
      "backgroundColor": "#2C3E50",
      "titleColor": "#ECF0F1"
    },
    "mainArea": {
      "backgroundColor": "#34495E",
      "type": "control|monitoring|navigation|configuration|alarm"
    },
    "footer": {
      "height": 60,
      "backgroundColor": "#2C3E50"
    }
  },
  "colorScheme": {
    "background": "#34495E",
    "primary": "#3498DB",
    "secondary": "#F39C12", 
    "accent": "#E74C3C",
    "success": "#27AE60",
    "text": "#ECF0F1",
    "header": "#2C3E50"
  },
  "elements": [
    {
      "type": "control_button|data_display|status_indicator|alarm_indicator|value_input|data_table|gauge|progress_bar|text|toggle",
      "label": "Start",
      "position": {"x": 100, "y": 150, "width": 150, "height": 40},
      "style": {"backgroundColor": "#27AE60", "color": "#FFFFFF", "fontSize": "14px"},
      "purpose": "What this element does and why it's important",
      "userAction": "What operators do with this element"
    }
  ],
  "functionalDescription": "Summary of how this screen works",
  "recommendations": ["Optional UX tips"]
}

🚫 DO NOT invent extra equipment. Only include what's in the FDS.
✅ Return 8–12 realistic UI components per screen.
✅ Make this screen DIFFERENT from other screens - unique layout and elements.
`;
    }

    // ✅ ENHANCED: Extract content relevant to specific screen from document
    extractScreenRelevantContent(screen, documentContext) {
        const screenName = screen.screenName.toLowerCase();
        const fdsContent = documentContext.fdsContent; // Use full content now
        
        // ✅ FIXED: Extract actual screen sections from FDS
        const screenSection = this.extractDetailedScreenSection(screenName, fdsContent);
        
        // ✅ FIXED: Parse actual requirements from screen section
        const relatedEquipment = this.extractEquipmentFromSection(screenSection, screenName);
        const keyOperations = this.extractOperationsFromSection(screenSection, screenName);
        const parameters = this.extractParametersFromSection(screenSection, screenName);
        
        return {
            systemDescription: this.getSystemDescription(documentContext),
            screenPurpose: this.generateSpecificScreenPurpose(screen, documentContext),
            screenSection: screenSection.substring(0, 1000), // First 1000 chars of relevant section
            relatedEquipment: relatedEquipment.length > 0 ? relatedEquipment : this.getDefaultEquipment(screenName),
            keyOperations: keyOperations.length > 0 ? keyOperations : this.getDefaultOperations(screenName),
            parameters: parameters.length > 0 ? parameters : this.getDefaultParameters(screenName)
        };
    }

    // ✅ NEW: Extract detailed screen section from FDS
    extractDetailedScreenSection(screenName, fdsContent) {
        const sections = [];
        
        // ✅ FIXED: Look for sections that match screen names
        const screenPatterns = [
            // Exact screen name matches
            new RegExp(`\\b${screenName}\\b[\\s\\S]{0,2000}`, 'gi'),
            // Screen type matches
            new RegExp(`(main\\s+dashboard|generator\\s+control|maintenance\\s+settings)[\\s\\S]{0,2000}`, 'gi'),
            // Section number matches  
            new RegExp(`3\\.[1-3][\\s\\S]{0,2000}`, 'gi'),
            // Header matches
            new RegExp(`(MAIN\\s+DASHBOARD|GENERATOR\\s+CONTROL|MAINTENANCE\\s+&\\s+SETTINGS)[\\s\\S]{0,2000}`, 'gi')
        ];
        
        for (const pattern of screenPatterns) {
            const matches = fdsContent.match(pattern);
            if (matches) {
                sections.push(...matches);
            }
        }
        
        // ✅ If specific section found, use it
        if (sections.length > 0) {
            return sections.join('\n');
        }
        
        // ✅ Fallback: Look for screen-relevant content
        const fallbackPatterns = [
            new RegExp(`(screen|interface|display|control|monitor)[\\s\\S]{0,500}`, 'gi'),
            new RegExp(`(required\\s+elements|layout|color\\s+scheme)[\\s\\S]{0,500}`, 'gi')
        ];
        
        for (const pattern of fallbackPatterns) {
            const matches = fdsContent.match(pattern);
            if (matches) {
                sections.push(...matches.slice(0, 2));
            }
        }
        
        return sections.join('\n');
    }

    // ✅ NEW: Extract equipment from screen section
    extractEquipmentFromSection(screenSection, screenName) {
        const equipment = [];
        
        // ✅ Generator-specific equipment patterns
        const equipmentPatterns = [
            /engine|generator|alternator|diesel|utility|transfer\s+switch/gi,
            /battery|charger|voltage|current|frequency|power/gi,
            /temperature|pressure|rpm|fuel|coolant|oil|air/gi,
            /sensor|gauge|display|indicator|button|switch/gi
        ];
        
        equipmentPatterns.forEach(pattern => {
            const matches = screenSection.match(pattern);
            if (matches) {
                equipment.push(...matches.slice(0, 5));
            }
        });
        
        return [...new Set(equipment)]; // Remove duplicates
    }

    // ✅ NEW: Extract operations from screen section
    extractOperationsFromSection(screenSection, screenName) {
        const operations = [];
        
        // ✅ Generator-specific operation patterns
        const operationPatterns = [
            /start|stop|run|pause|emergency\s+stop|reset/gi,
            /manual|auto|automatic|test|calibrate/gi,
            /transfer|utility|generator|load\s+shed|paralleling/gi,
            /settings|alarm|acknowledge|silence/gi
        ];
        
        operationPatterns.forEach(pattern => {
            const matches = screenSection.match(pattern);
            if (matches) {
                operations.push(...matches.slice(0, 5));
            }
        });
        
        return [...new Set(operations)]; // Remove duplicates
    }

    // ✅ NEW: Extract parameters from screen section
    extractParametersFromSection(screenSection, screenName) {
        const parameters = [];
        
        // ✅ Generator-specific parameter patterns
        const parameterPatterns = [
            /(\w+)\s*:\s*[\d.]+\s*(v|a|hz|psi|°f|°c|rpm|kw|%)/gi,
            /(\w+)\s*=\s*[\d.]+\s*(v|a|hz|psi|°f|°c|rpm|kw|%)/gi,
            /(voltage|current|frequency|pressure|temperature|rpm|fuel|oil|coolant|power)\s*[\d.]+/gi,
            /(ac\s+voltage|ac\s+current|ac\s+frequency|engine\s+speed|oil\s+pressure|fuel\s+level)/gi
        ];
        
        parameterPatterns.forEach(pattern => {
            const matches = screenSection.match(pattern);
            if (matches) {
                parameters.push(...matches.slice(0, 5));
            }
        });
        
        return [...new Set(parameters)]; // Remove duplicates
    }

    // ✅ NEW: Get default equipment for screen type
    getDefaultEquipment(screenName) {
        const defaults = {
            'main': ['Generator', 'Engine', 'Alternator', 'Transfer Switch', 'Battery'],
            'dashboard': ['Generator', 'Engine', 'Alternator', 'Transfer Switch', 'Battery'],
            'control': ['Start Button', 'Stop Button', 'Emergency Stop', 'Mode Selector', 'Transfer Switch'],
            'generator': ['Generator', 'Engine', 'Alternator', 'Voltage Regulator', 'Governor'],
            'maintenance': ['Service Timer', 'Oil Filter', 'Air Filter', 'Fuel Filter', 'Battery'],
            'settings': ['Configuration', 'Parameters', 'Calibration', 'User Settings', 'System Settings']
        };
        
        for (const [key, equipment] of Object.entries(defaults)) {
            if (screenName.includes(key)) {
                return equipment;
            }
        }
        
        return ['Generator System Components'];
    }

    // ✅ NEW: Get default operations for screen type
    getDefaultOperations(screenName) {
        const defaults = {
            'main': ['Monitor', 'Navigate', 'View Status', 'Quick Control', 'Alarm Review'],
            'dashboard': ['Monitor', 'Navigate', 'View Status', 'Quick Control', 'Alarm Review'],
            'control': ['Start', 'Stop', 'Manual Operation', 'Auto Operation', 'Emergency Stop'],
            'generator': ['Start Generator', 'Stop Generator', 'Load Control', 'Transfer Switch', 'Paralleling'],
            'maintenance': ['Schedule Service', 'Reset Timers', 'View History', 'Parts Status', 'Service Reports'],
            'settings': ['Configure System', 'Set Parameters', 'Calibrate', 'User Management', 'Save Settings']
        };
        
        for (const [key, operations] of Object.entries(defaults)) {
            if (screenName.includes(key)) {
                return operations;
            }
        }
        
        return ['System Control Operations'];
    }

    // ✅ NEW: Get default parameters for screen type
    getDefaultParameters(screenName) {
        const defaults = {
            'main': ['AC Voltage', 'AC Current', 'AC Frequency', 'Engine RPM', 'Oil Pressure'],
            'dashboard': ['AC Voltage', 'AC Current', 'AC Frequency', 'Engine RPM', 'Oil Pressure'],
            'control': ['Operating Mode', 'Load Percentage', 'Runtime Hours', 'Start Counter', 'Transfer Status'],
            'generator': ['Generator Voltage', 'Generator Current', 'Generator Frequency', 'Power Output', 'Load Bank'],
            'maintenance': ['Service Hours', 'Oil Change Due', 'Filter Status', 'Battery Voltage', 'Next Service'],
            'settings': ['Start Delay', 'Transfer Time', 'Alarm Delays', 'User Access', 'Network Settings']
        };
        
        for (const [key, parameters] of Object.entries(defaults)) {
            if (screenName.includes(key)) {
                return parameters;
            }
        }
        
        return ['System Parameters'];
    }

    // ✅ NEW: Check if component is relevant to specific screen
    isComponentRelevantToScreen(component, screenName, fdsContent) {
        const componentLower = component.toLowerCase();
        
        // ✅ Screen-specific relevance rules
        if (screenName.includes('home') || screenName.includes('main')) {
            return true; // Home screen shows all components
        } else if (screenName.includes('pump') && componentLower.includes('pump')) {
            return true;
        } else if (screenName.includes('test') && (componentLower.includes('sensor') || componentLower.includes('test'))) {
            return true;
        } else if (screenName.includes('alarm') && componentLower.includes('alarm')) {
            return true;
        } else if (screenName.includes('user') && componentLower.includes('user')) {
            return true;
        }
        
        // ✅ Check if component appears near screen name in document
        const screenPattern = new RegExp(screenName + '.{0,200}' + componentLower + '|' + componentLower + '.{0,200}' + screenName, 'i');
        return screenPattern.test(fdsContent);
    }

    // ✅ NEW: Check if operation is relevant to specific screen
    isOperationRelevantToScreen(operation, screenName, fdsContent) {
        const operationLower = operation.toLowerCase();
        
        // ✅ Screen-specific operation rules
        if (screenName.includes('manual') && operationLower.includes('manual')) {
            return true;
        } else if (screenName.includes('auto') && (operationLower.includes('auto') || operationLower.includes('start'))) {
            return true;
        } else if (screenName.includes('test') && operationLower.includes('test')) {
            return true;
        } else if (screenName.includes('setting') && operationLower.includes('setting')) {
            return true;
        }
        
        // ✅ Check document proximity
        const screenPattern = new RegExp(screenName + '.{0,200}' + operationLower + '|' + operationLower + '.{0,200}' + screenName, 'i');
        return screenPattern.test(fdsContent);
    }

    // ✅ NEW: Extract parameters specific to screen
    extractScreenParameters(screenName, fdsContent) {
        const parameters = [];
        
        // ✅ Common parameter patterns
        const parameterPatterns = [
            /(\w+)\s*:\s*[\d.]+\s*(psi|bar|°c|°f|rpm|hz|v|a|%)/gi,
            /(\w+)\s*=\s*[\d.]+\s*(psi|bar|°c|°f|rpm|hz|v|a|%)/gi,
            /(pressure|temperature|flow|speed|voltage|current|level|concentration)\s*[\d.]+/gi
        ];
        
        parameterPatterns.forEach(pattern => {
            const matches = fdsContent.match(pattern);
            if (matches) {
                parameters.push(...matches.slice(0, 3)); // Limit to 3 per pattern
            }
        });
        
        return parameters.slice(0, 5); // Max 5 parameters per screen
    }

    // ✅ NEW: Get system description from document
    getSystemDescription(documentContext) {
        const systemType = documentContext.systemKeywords.systemType[0] || 'industrial';
        const firstSentence = documentContext.documentSample.split('.')[0];
        
        if (firstSentence.length > 20) {
            return firstSentence;
        }
        
        return `${systemType.replace('_', ' ')} control and monitoring system`;
    }

    // ✅ NEW: Generate specific screen purpose based on document analysis
    generateSpecificScreenPurpose(screen, documentContext) {
        const screenName = screen.screenName.toLowerCase();
        const systemType = documentContext.systemKeywords.systemType[0] || 'system';
        
        // ✅ Screen-specific purposes based on document content
        if (screenName.includes('home') || screenName.includes('main')) {
            return `Main overview and navigation interface for the ${systemType} system`;
        } else if (screenName.includes('manual') || screenName.includes('control')) {
            return `Manual control interface for direct operator control of ${systemType} operations`;
        } else if (screenName.includes('auto')) {
            return `Automatic operation mode control and monitoring for ${systemType} system`;
        } else if (screenName.includes('test')) {
            return `System testing and diagnostic interface for ${systemType} validation`;
        } else if (screenName.includes('pump')) {
            return `Pump control and monitoring interface for ${systemType} pump operations`;
        } else if (screenName.includes('purge') || screenName.includes('purging')) {
            return `Purging sequence control and monitoring for ${systemType} cleaning operations`;
        } else if (screenName.includes('setting')) {
            return `System configuration and parameter adjustment interface for ${systemType}`;
        } else if (screenName.includes('alarm')) {
            return `Alarm monitoring and management interface for ${systemType} fault handling`;
        } else if (screenName.includes('user')) {
            return `User access management and authentication interface for ${systemType}`;
        } else {
            return `Specialized ${screenName} interface for ${systemType} operations`;
        }
    }

    // ✅ NEW: Get screen-specific requirements based on document content
    getScreenSpecificRequirements(screen, screenRelevantContent) {
        const screenName = screen.screenName.toLowerCase();
        
        if (screenName.includes('home') || screenName.includes('main')) {
            return `This is the MAIN SCREEN - include:
- System overview with key status indicators
- Navigation buttons to all other screens
- System health monitoring displays
- Quick access to emergency functions
- Overall system status dashboard`;
            
        } else if (screenName.includes('manual') || screenName.includes('control')) {
            return `This is a CONTROL SCREEN - include:
- Control buttons for: ${screenRelevantContent.keyOperations.join(', ')}
- Real-time monitoring for: ${screenRelevantContent.relatedEquipment.join(', ')}
- Manual operation controls and overrides
- Safety interlocks and emergency stops
- Process parameter displays`;
            
        } else if (screenName.includes('test')) {
            return `This is a TEST/DIAGNOSTIC SCREEN - include:
- Test sequence controls and progress indicators
- Equipment status displays for: ${screenRelevantContent.relatedEquipment.join(', ')}
- Diagnostic data tables and results
- Test parameter input fields
- Pass/fail indicators and test reports`;
            
        } else if (screenName.includes('setting')) {
            return `This is a SETTINGS SCREEN - include:
- Parameter input fields for system configuration
- Calibration controls and adjustments
- Save/load configuration buttons
- User preference settings
- System parameter displays`;
            
        } else if (screenName.includes('alarm')) {
            return `This is an ALARM SCREEN - include:
- Active alarm list with priority levels
- Alarm acknowledgment controls
- Alarm history and event log
- Alarm filtering and search functions
- System fault indicators`;
            
        } else if (screenName.includes('user')) {
            return `This is a USER MANAGEMENT SCREEN - include:
- User login/logout interface
- Access level management controls
- User authentication fields
- Permission and role displays
- Security management functions`;
            
        } else {
            return `This is a SPECIALIZED SCREEN for ${screenName} - include:
- Specific controls for: ${screenRelevantContent.keyOperations.join(', ')}
- Monitoring displays for: ${screenRelevantContent.relatedEquipment.join(', ')}
- Relevant parameter inputs and displays
- Screen-specific functionality
- Context-appropriate navigation`;
        }
    }

    // ✅ NEW: Generate fallback specification when AI fails
    generateFallbackSpec(screen, documentContext) {
        console.log(`🔄 Generating fallback spec for ${screen.screenName}...`);
        
        // ✅ Determine system type from keywords
        const systemType = documentContext.systemKeywords.systemType[0] || 'generic';
        
        const baseSpec = {
            screenTitle: screen.screenName,
            layout: {
                header: {
                    title: screen.screenName,
                    height: 80,
                    backgroundColor: "#2C3E50",
                    titleColor: "#ECF0F1"
                },
                mainArea: {
                    backgroundColor: "#34495E",
                    type: screen.screenType || 'control'
                },
                footer: {
                    height: 60,
                    backgroundColor: "#2C3E50"
                }
            },
            colorScheme: {
                background: "#34495E",
                primary: "#3498DB",
                secondary: "#F39C12",
                accent: "#E74C3C",
                success: "#27AE60",
                text: "#ECF0F1",
                header: "#2C3E50"
            }
        };

        // ✅ Generate elements based on system type and screen name
        baseSpec.elements = this.generateAdaptiveElements(screen, systemType, documentContext);
        
        return baseSpec;
    }

    // ✅ ENHANCED: Generate document-driven adaptive elements based on actual content
    generateAdaptiveElements(screen, systemType, documentContext) {
        const elements = [];
        const screenName = screen.screenName.toLowerCase();
        
        // ✅ Always add header title
        elements.push({
            type: "header_title",
            label: screen.screenName,
            position: {x: 20, y: 25, width: 400, height: 30},
            style: {fontSize: "24px", color: "#ECF0F1", fontWeight: "bold"}
        });

        // ✅ Add system status indicator
            elements.push({
            type: "status_indicator",
            label: "SYSTEM READY",
            position: {x: 600, y: 25, width: 140, height: 30},
            style: {color: "#ECF0F1", backgroundColor: "#27AE60"}
        });

        // ✅ Generate screen-specific elements based on DOCUMENT CONTENT and screen name
        const screenRelevantContent = this.extractScreenRelevantContent(screen, documentContext);
        
        if (screenName.includes('home') || screenName.includes('main')) {
            elements.push(...this.generateDocumentDrivenHomeElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('manual') || screenName.includes('control')) {
            elements.push(...this.generateDocumentDrivenControlElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('auto') || screenName.includes('automatic')) {
            elements.push(...this.generateDocumentDrivenAutoElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('test') || screenName.includes('diagnostic')) {
            elements.push(...this.generateDocumentDrivenTestElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('pump') || screenName.includes('pumpback')) {
            elements.push(...this.generateDocumentDrivenPumpElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('purge') || screenName.includes('purging')) {
            elements.push(...this.generateDocumentDrivenPurgeElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('settings') || screenName.includes('config')) {
            elements.push(...this.generateDocumentDrivenSettingsElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('alarm') || screenName.includes('alert')) {
            elements.push(...this.generateDocumentDrivenAlarmElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('time') || screenName.includes('tracking')) {
            elements.push(...this.generateDocumentDrivenTrackingElements(screenRelevantContent, documentContext));
        } else if (screenName.includes('user') || screenName.includes('management')) {
            elements.push(...this.generateDocumentDrivenUserElements(screenRelevantContent, documentContext));
        } else {
            elements.push(...this.generateDocumentDrivenGenericElements(screenRelevantContent, documentContext, screen));
        }

        return elements;
    }

    // ✅ NEW: Generate home/main screen elements
    generateHomeElements(context) {
        const systemType = context.systemKeywords.systemType[0] || 'System';
        return [
            {
                type: "text",
                label: `${systemType.replace('_', ' ').toUpperCase()} CONTROL SYSTEM`,
                position: {x: 50, y: 120, width: 500, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "status_indicator",
                label: "SYSTEM READY",
                position: {x: 50, y: 170, width: 120, height: 40},
                style: {fontSize: "16px", color: "#27AE60"}
            },
            {
                type: "data_display",
                label: "Operating Hours",
                position: {x: 200, y: 170, width: 120, height: 40},
                style: {fontSize: "16px", color: "#ECF0F1"}
            },
            {
                type: "gauge",
                label: "System Load",
                position: {x: 350, y: 150, width: 80, height: 80},
                style: {fontSize: "12px", color: "#3498DB"}
            },
            {
                type: "control_button",
                label: "MANUAL MODE",
                position: {x: 50, y: 250, width: 160, height: 60},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "AUTO MODE",
                position: {x: 230, y: 250, width: 160, height: 60},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "SETTINGS",
                position: {x: 410, y: 250, width: 160, height: 60},
                style: {backgroundColor: "#95A5A6", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "data_table",
                label: "System Overview",
                position: {x: 50, y: 340, width: 700, height: 120},
                style: {fontSize: "12px", color: "#2C3E50"}
            }
        ];
    }

    // ✅ NEW: Generate control screen elements
    generateControlElements(context) {
        const operations = context.systemKeywords.operations;
        const elements = [
            {
                type: "text",
                label: "Manual Control Interface",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "gauge",
                label: "System Pressure",
                position: {x: 500, y: 120, width: 100, height: 100},
                style: {fontSize: "12px", color: "#3498DB"}
            },
            {
                type: "data_display",
                label: "Temperature",
                position: {x: 620, y: 120, width: 120, height: 40},
                style: {fontSize: "14px", color: "#2ECC71"}
            },
            {
                type: "status_indicator",
                label: "Control Status",
                position: {x: 620, y: 180, width: 120, height: 40},
                style: {fontSize: "12px", color: "#27AE60"}
            }
        ];

        // ✅ Add operation buttons based on detected operations
        let yPos = 180;
        let xPos = 50;
        
        operations.forEach((operation, index) => {
            if (index > 0 && index % 3 === 0) {
                yPos += 70;
                xPos = 50;
            }
            
            elements.push({
                type: "control_button",
                label: operation.toUpperCase(),
                position: {x: xPos, y: yPos, width: 120, height: 50},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            });
            
            xPos += 140;
        });

        // Add progress bar and data table
        elements.push({
            type: "progress_bar",
            label: "Operation Progress",
            position: {x: 50, y: 350, width: 300, height: 30},
            style: {fontSize: "12px", color: "#F39C12"}
        });

        elements.push({
            type: "data_table",
            label: "Control Parameters",
            position: {x: 400, y: 280, width: 350, height: 120},
            style: {fontSize: "11px", color: "#2C3E50"}
        });

        return elements;
    }

    // ✅ NEW: Generate auto mode elements
    generateAutoElements(context) {
        return [
            {
                type: "text",
                label: "Automatic Control Mode",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "AUTO MODE ON",
                position: {x: 50, y: 180, width: 180, height: 60},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "16px"}
            },
            {
                type: "control_button",
                label: "AUTO MODE OFF",
                position: {x: 250, y: 180, width: 180, height: 60},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "16px"}
            },
            {
                type: "status_indicator",
                label: "AUTO STATUS",
                position: {x: 50, y: 270, width: 150, height: 40},
                style: {color: "#ECF0F1", backgroundColor: "#27AE60", fontSize: "14px"}
            }
        ];
    }

    // ✅ NEW: Generate test/diagnostic elements
    generateTestElements(context) {
        const components = context.systemKeywords.components;
        const elements = [
            {
                type: "text",
                label: "System Test & Diagnostics",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "START TEST",
                position: {x: 500, y: 120, width: 120, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "STOP TEST",
                position: {x: 640, y: 120, width: 120, height: 50},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "progress_bar",
                label: "Test Progress",
                position: {x: 50, y: 180, width: 300, height: 25},
                style: {fontSize: "12px", color: "#3498DB"}
            },
            {
                type: "data_display",
                label: "Test Duration",
                position: {x: 380, y: 180, width: 120, height: 25},
                style: {fontSize: "12px", color: "#2ECC71"}
            }
        ];

        // ✅ Add component status indicators
        let yPos = 230;
        components.forEach((component, index) => {
            if (index < 4) { // Limit to 4 components
            elements.push({
                    type: "status_indicator",
                    label: `${component.toUpperCase()} STATUS`,
                    position: {x: 50 + (index % 2) * 250, y: yPos + Math.floor(index / 2) * 50, width: 200, height: 30},
                    style: {color: "#ECF0F1", backgroundColor: "#27AE60", fontSize: "14px"}
                });
            }
        });

        // Add diagnostic data table
        elements.push({
            type: "data_table",
            label: "Test Results",
            position: {x: 50, y: 350, width: 700, height: 150},
            style: {fontSize: "11px", color: "#2C3E50"}
        });

        return elements;
    }

    // ✅ NEW: Generate settings elements
    generateSettingsElements(context) {
        return [
            {
                type: "text",
                label: "System Configuration",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "SAVE CONFIG",
                position: {x: 50, y: 200, width: 120, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "LOAD CONFIG",
                position: {x: 190, y: 200, width: 120, height: 50},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "RESET CONFIG",
                position: {x: 330, y: 200, width: 120, height: 50},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            }
        ];
    }

    // ✅ NEW: Generate alarm elements
    generateAlarmElements(context) {
        return [
            {
                type: "text",
                label: "System Alarms",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#E74C3C", fontWeight: "bold"}
            },
            {
                type: "data_table",
                headers: ["ALARM", "PRIORITY", "TIME", "STATUS"],
                rows: 6,
                position: {x: 20, y: 180, width: 760, height: 300},
                style: {headerColor: "#E74C3C", rowColor: "#34495E", textColor: "#ECF0F1"}
            }
        ];
    }

    // ✅ NEW: Generate tracking elements
    generateTrackingElements(context) {
        return [
            {
                type: "text",
                label: "System Tracking & Performance",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "data_table",
                headers: ["PARAMETER", "VALUE", "UNIT", "STATUS"],
                rows: 8,
                position: {x: 20, y: 180, width: 760, height: 320},
                style: {headerColor: "#F39C12", rowColor: "#34495E", textColor: "#ECF0F1"}
            }
        ];
    }

    // ✅ NEW: Generate user management elements
    generateUserElements(context) {
        return [
            {
                type: "text",
                label: "User Access Management",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "LOGIN",
                position: {x: 50, y: 200, width: 100, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "LOGOUT",
                position: {x: 170, y: 200, width: 100, height: 50},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "CHANGE PASSWORD",
                position: {x: 290, y: 200, width: 140, height: 50},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            }
        ];
    }

    // ✅ NEW: Generate generic elements for unknown screen types
    generateGenericElements(context) {
        return [
            {
                type: "text",
                label: "System Interface",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "18px", color: "#F39C12"}
            },
            {
                type: "data_table",
                headers: ["COMPONENT", "STATUS", "VALUE", "CONTROL"],
                rows: 8,
                position: {x: 20, y: 180, width: 760, height: 320},
                style: {headerColor: "#F39C12", rowColor: "#34495E", textColor: "#ECF0F1"}
            }
        ];
    }

    // ✅ NEW: Document-driven home screen elements
    generateDocumentDrivenHomeElements(screenContent, documentContext) {
        const systemType = documentContext.systemKeywords.systemType[0] || 'System';
        const elements = [
            {
                type: "text",
                label: `${systemType.replace('_', ' ').toUpperCase()} CONTROL SYSTEM`,
                position: {x: 50, y: 120, width: 500, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            }
        ];

        // ✅ Add navigation buttons to OTHER screens (unique to home)
        const otherScreens = documentContext.screenNames.filter(name => 
            !name.toLowerCase().includes('home') && !name.toLowerCase().includes('main')
        );
        
        let buttonY = 180;
        let buttonX = 50;
        otherScreens.slice(0, 6).forEach((screenName, index) => {
            if (index > 0 && index % 3 === 0) {
                buttonY += 80;
                buttonX = 50;
            }
            
            elements.push({
                type: "control_button",
                label: screenName.toUpperCase(),
                position: {x: buttonX, y: buttonY, width: 200, height: 60},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "12px"}
            });
            
            buttonX += 220;
        });

        // ✅ Add system overview table with document-specific data
        elements.push({
            type: "data_table",
            label: "System Overview",
            headers: ["COMPONENT", "STATUS", "VALUE"],
            rows: 6,
            position: {x: 50, y: 350, width: 700, height: 150},
            style: {fontSize: "12px", color: "#2C3E50"}
        });

        return elements;
    }

    // ✅ NEW: Document-driven control screen elements
    generateDocumentDrivenControlElements(screenContent, documentContext) {
        const elements = [
            {
                type: "text",
                label: "Manual Control Interface",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            }
        ];

        // ✅ Add control buttons based on ACTUAL document operations
        let buttonY = 180;
        let buttonX = 50;
        
        screenContent.keyOperations.forEach((operation, index) => {
            if (index > 0 && index % 3 === 0) {
                buttonY += 70;
                buttonX = 50;
            }
            
            elements.push({
                type: "control_button",
                label: operation.toUpperCase(),
                position: {x: buttonX, y: buttonY, width: 140, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            });
            
            buttonX += 160;
        });

        // ✅ Add monitoring displays for ACTUAL equipment
        let displayY = 280;
        screenContent.relatedEquipment.slice(0, 3).forEach((equipment, index) => {
            elements.push({
                type: "data_display",
                label: equipment.toUpperCase(),
                position: {x: 50 + (index * 200), y: displayY, width: 180, height: 40},
                style: {fontSize: "14px", color: "#2ECC71"}
            });
        });

        // ✅ Add gauges for system parameters
        elements.push({
            type: "gauge",
            label: "System Pressure",
            position: {x: 600, y: 180, width: 100, height: 100},
            style: {fontSize: "12px", color: "#3498DB"}
        });

        return elements;
    }

    // ✅ NEW: Document-driven auto screen elements
    generateDocumentDrivenAutoElements(screenContent, documentContext) {
        const elements = [
            {
                type: "text",
                label: "Automatic Operation Mode",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "START AUTO",
                position: {x: 50, y: 180, width: 180, height: 60},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "16px"}
            },
            {
                type: "control_button",
                label: "STOP AUTO",
                position: {x: 250, y: 180, width: 180, height: 60},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "16px"}
            }
        ];

        // ✅ Add auto sequence progress
        elements.push({
            type: "progress_bar",
            label: "Auto Sequence Progress",
            position: {x: 50, y: 270, width: 400, height: 30},
            style: {fontSize: "12px", color: "#3498DB"}
        });

        // ✅ Add auto status indicators
        let indicatorY = 320;
        screenContent.keyOperations.slice(0, 4).forEach((operation, index) => {
            elements.push({
                type: "status_indicator",
                label: `AUTO ${operation.toUpperCase()}`,
                position: {x: 50 + (index % 2) * 300, y: indicatorY + Math.floor(index / 2) * 50, width: 250, height: 30},
                style: {color: "#ECF0F1", backgroundColor: "#27AE60", fontSize: "12px"}
            });
        });

        return elements;
    }

    // ✅ NEW: Document-driven test screen elements
    generateDocumentDrivenTestElements(screenContent, documentContext) {
        const elements = [
            {
                type: "text",
                label: "System Test & Diagnostics",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "START TEST",
                position: {x: 500, y: 120, width: 120, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "STOP TEST",
                position: {x: 640, y: 120, width: 120, height: 50},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            }
        ];

        // ✅ Add test progress bar
        elements.push({
            type: "progress_bar",
            label: "Test Progress",
            position: {x: 50, y: 180, width: 400, height: 25},
            style: {fontSize: "12px", color: "#3498DB"}
        });

        // ✅ Add test results table with document-specific components
        elements.push({
            type: "data_table",
            label: "Test Results",
            headers: ["COMPONENT", "TEST", "RESULT", "STATUS"],
            rows: 8,
            position: {x: 50, y: 230, width: 700, height: 200},
            style: {fontSize: "11px", color: "#2C3E50"}
        });

        return elements;
    }

    // ✅ NEW: Document-driven pump screen elements  
    generateDocumentDrivenPumpElements(screenContent, documentContext) {
        const elements = [
            {
                type: "text",
                label: "Pump Control & Monitoring",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "START PUMP",
                position: {x: 50, y: 180, width: 150, height: 60},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "STOP PUMP",
                position: {x: 220, y: 180, width: 150, height: 60},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            }
        ];

        // ✅ Add pump-specific gauges
        elements.push({
            type: "gauge",
            label: "Pump Pressure",
            position: {x: 400, y: 160, width: 100, height: 100},
            style: {fontSize: "12px", color: "#3498DB"}
        });

        elements.push({
            type: "gauge",
            label: "Flow Rate",
            position: {x: 520, y: 160, width: 100, height: 100},
            style: {fontSize: "12px", color: "#2ECC71"}
        });

        // ✅ Add pump status indicators
        elements.push({
            type: "status_indicator",
            label: "PUMP STATUS",
            position: {x: 650, y: 180, width: 120, height: 40},
            style: {color: "#ECF0F1", backgroundColor: "#27AE60", fontSize: "14px"}
        });

        return elements;
    }

    // ✅ NEW: Document-driven purge screen elements
    generateDocumentDrivenPurgeElements(screenContent, documentContext) {
        const elements = [
            {
                type: "text",
                label: "Purging Sequence Control",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "START PURGE",
                position: {x: 50, y: 180, width: 150, height: 60},
                style: {backgroundColor: "#F39C12", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "STOP PURGE",
                position: {x: 220, y: 180, width: 150, height: 60},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            }
        ];

        // ✅ Add purge progress indicator
        elements.push({
            type: "progress_bar",
            label: "Purge Progress",
            position: {x: 50, y: 270, width: 400, height: 30},
            style: {fontSize: "12px", color: "#F39C12"}
        });

        // ✅ Add purge status display
        elements.push({
            type: "data_display",
            label: "Purge Time Remaining",
            position: {x: 500, y: 180, width: 200, height: 40},
            style: {fontSize: "14px", color: "#2ECC71"}
        });

        elements.push({
            type: "status_indicator",
            label: "PURGE STATUS",
            position: {x: 500, y: 240, width: 200, height: 40},
            style: {color: "#ECF0F1", backgroundColor: "#F39C12", fontSize: "14px"}
        });

        return elements;
    }

    // ✅ NEW: Document-driven settings screen elements
    generateDocumentDrivenSettingsElements(screenContent, documentContext) {
        const elements = [
            {
                type: "text",
                label: "System Configuration",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "SAVE CONFIG",
                position: {x: 50, y: 180, width: 120, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "LOAD CONFIG",
                position: {x: 190, y: 180, width: 120, height: 50},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "RESET CONFIG",
                position: {x: 330, y: 180, width: 120, height: 50},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            }
        ];

        // ✅ Add parameter input fields
        let inputY = 250;
        screenContent.parameters.slice(0, 4).forEach((param, index) => {
            elements.push({
                type: "value_input",
                label: param.toUpperCase(),
                position: {x: 50 + (index % 2) * 300, y: inputY + Math.floor(index / 2) * 60, width: 250, height: 40},
                style: {fontSize: "12px", color: "#2C3E50"}
            });
        });

        return elements;
    }

    // ✅ NEW: Document-driven alarm screen elements
    generateDocumentDrivenAlarmElements(screenContent, documentContext) {
        return [
            {
                type: "text",
                label: "System Alarms & Faults",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#E74C3C", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "ACK ALL",
                position: {x: 500, y: 120, width: 100, height: 40},
                style: {backgroundColor: "#F39C12", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "CLEAR ALL",
                position: {x: 620, y: 120, width: 100, height: 40},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "data_table",
                label: "Active Alarms",
                headers: ["ALARM", "PRIORITY", "TIME", "STATUS"],
                rows: 10,
                position: {x: 20, y: 180, width: 760, height: 280},
                style: {headerColor: "#E74C3C", rowColor: "#34495E", textColor: "#ECF0F1"}
            }
        ];
    }

    // ✅ NEW: Document-driven tracking screen elements
    generateDocumentDrivenTrackingElements(screenContent, documentContext) {
        return [
            {
                type: "text",
                label: "System Performance Tracking",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "data_table",
                label: "Performance Data",
                headers: ["PARAMETER", "CURRENT", "AVERAGE", "TREND"],
                rows: 12,
                position: {x: 20, y: 180, width: 760, height: 300},
                style: {headerColor: "#F39C12", rowColor: "#34495E", textColor: "#ECF0F1"}
            }
        ];
    }

    // ✅ NEW: Document-driven user screen elements
    generateDocumentDrivenUserElements(screenContent, documentContext) {
        return [
            {
                type: "text",
                label: "User Access Management",
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "20px", color: "#F39C12", fontWeight: "bold"}
            },
            {
                type: "control_button",
                label: "LOGIN",
                position: {x: 50, y: 180, width: 100, height: 50},
                style: {backgroundColor: "#27AE60", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "LOGOUT",
                position: {x: 170, y: 180, width: 100, height: 50},
                style: {backgroundColor: "#E74C3C", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "control_button",
                label: "CHANGE PASSWORD",
                position: {x: 290, y: 180, width: 150, height: 50},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            },
            {
                type: "data_table",
                label: "User List",
                headers: ["USERNAME", "ROLE", "STATUS", "LAST LOGIN"],
                rows: 8,
                position: {x: 50, y: 250, width: 700, height: 200},
                style: {headerColor: "#3498DB", rowColor: "#34495E", textColor: "#ECF0F1"}
            }
        ];
    }

    // ✅ NEW: Document-driven generic screen elements
    generateDocumentDrivenGenericElements(screenContent, documentContext, screen) {
        const elements = [
            {
                type: "text",
                label: `${screen.screenName} Interface`,
                position: {x: 50, y: 120, width: 400, height: 30},
                style: {fontSize: "18px", color: "#F39C12"}
            }
        ];

        // ✅ Add controls based on document operations
        let buttonY = 180;
        let buttonX = 50;
        screenContent.keyOperations.slice(0, 6).forEach((operation, index) => {
            if (index > 0 && index % 3 === 0) {
                buttonY += 70;
                buttonX = 50;
            }
            
            elements.push({
                type: "control_button",
                label: operation.toUpperCase(),
                position: {x: buttonX, y: buttonY, width: 150, height: 50},
                style: {backgroundColor: "#3498DB", color: "#FFFFFF", fontSize: "14px"}
            });
            
            buttonX += 170;
        });

        // ✅ Add data table with document-specific content
        elements.push({
            type: "data_table",
            label: "System Data",
            headers: ["COMPONENT", "STATUS", "VALUE", "CONTROL"],
            rows: 8,
            position: {x: 20, y: 300, width: 760, height: 200},
            style: {headerColor: "#F39C12", rowColor: "#34495E", textColor: "#ECF0F1"}
        });

        return elements;
    }

    // ✅ Enhanced screen specification with AI (removed - replaced with new AI system)
    async enhanceScreenSpecWithAI(screen, baseSpec) {
        console.log(`🤖 Enhancing screen spec for ${screen.screenName} with AI...`);
        
        try {
            // ✅ This method is now integrated into generateAIContextualSpec
            // Keeping for backward compatibility but redirecting to new system
            const documentContext = this.getDocumentContext();
            return await this.generateAIContextualSpec(screen, documentContext);
            
        } catch (error) {
            console.error('❌ AI enhancement failed:', error);
            return baseSpec;
        }
    }

    // ✅ NEW: Validate and enhance AI-generated specifications
    validateAndEnhanceSpec(spec, screen, documentContext) {
        // ✅ Ensure all required fields exist
        const enhancedSpec = {
            screenTitle: spec.screenTitle || screen.screenName,
            screenPurpose: spec.screenPurpose || `Interface for ${screen.screenName.toLowerCase()} operations`,
            navigation: spec.navigation || {
                from: this.generateNavigationFrom(screen, documentContext),
                to: this.generateNavigationTo(screen, documentContext),
                breadcrumb: `Home > ${this.getScreenCategory(screen)} > ${screen.screenName}`
            },
            layout: spec.layout || this.getDefaultLayout(screen),
            colorScheme: spec.colorScheme || this.getDefaultColorScheme(),
            elements: spec.elements || [],
            functionalDescription: spec.functionalDescription || `This screen provides ${screen.screenName.toLowerCase()} functionality for system operators.`,
            recommendations: spec.recommendations || this.generateDefaultRecommendations(screen, documentContext)
        };

        // ✅ POST-VALIDATION: Ensure screen has enough elements (8-12 as per ChatGPT requirements)
        if (enhancedSpec.elements.length < 6) {
            console.log(`⚠️ Screen ${screen.screenName} has only ${enhancedSpec.elements.length} elements. Adding more...`);
            
            const additionalElements = this.generateAdditionalElements(screen, documentContext, 8 - enhancedSpec.elements.length);
            enhancedSpec.elements = enhancedSpec.elements.concat(additionalElements);
        }

        // ✅ Validate element positioning
        enhancedSpec.elements = this.validateElementPositions(enhancedSpec.elements);
        
        // ✅ Add missing essential elements if needed
        enhancedSpec.elements = this.ensureEssentialElements(enhancedSpec.elements, screen, documentContext);

        console.log(`✅ Screen validated with ${enhancedSpec.elements.length} elements`);
        return enhancedSpec;
    }

    // ✅ NEW: Generate additional elements when screen is too empty
    generateAdditionalElements(screen, documentContext, count) {
        console.log(`🔧 Generating ${count} additional elements for ${screen.screenName}...`);
        
        const additionalElements = [];
        const systemType = documentContext.systemKeywords.systemType[0] || 'industrial';
        
        for (let i = 0; i < count; i++) {
            const elementTypes = ['control_button', 'status_indicator', 'data_display', 'value_input', 'gauge', 'progress_bar', 'data_table', 'alarm_indicator'];
            const type = elementTypes[i % elementTypes.length];
            
            const element = {
                type: type,
                label: this.generateElementLabel(type, systemType, i),
                position: {
                    x: 50 + (i % 3) * 250,
                    y: 200 + Math.floor(i / 3) * 100,
                    width: type === 'data_table' ? 300 : type === 'gauge' ? 80 : type === 'progress_bar' ? 200 : 120,
                    height: type === 'data_table' ? 80 : type === 'gauge' ? 80 : type === 'progress_bar' ? 25 : 40
                },
                style: {
                    backgroundColor: type === 'control_button' ? '#3498DB' : type === 'alarm_indicator' ? '#E74C3C' : '#27AE60',
                    color: '#FFFFFF',
                    fontSize: '14px'
                },
                purpose: `Additional ${type.replace('_', ' ')} for system operation`,
                userAction: `Operator interacts with this ${type.replace('_', ' ')}`
            };
            
            additionalElements.push(element);
        }
        
        return additionalElements;
    }

    // ✅ NEW: Generate element labels based on document context (dynamic, not hardcoded)
    generateElementLabel(type, systemType, index) {
        const documentContext = this.getDocumentContext();
        const systemKeywords = documentContext.systemKeywords;
        
        // Try to use actual components/operations from the document first
        const availableTerms = [
            ...systemKeywords.components,
            ...systemKeywords.operations,
            ...systemKeywords.controls
        ];
        
        // Generate labels based on element type and available document terms
        switch (type) {
            case 'control_button':
                if (availableTerms.length > index) {
                    return availableTerms[index].toUpperCase();
                }
                return ['START', 'STOP', 'RESET', 'CONFIRM'][index % 4];
                
            case 'status_indicator':
                if (availableTerms.length > index) {
                    return `${availableTerms[index].toUpperCase()} STATUS`;
                }
                return ['SYSTEM STATUS', 'READY', 'ACTIVE', 'NORMAL'][index % 4];
                
            case 'data_display':
                if (availableTerms.length > index) {
                    const term = availableTerms[index];
                    if (term.toLowerCase().includes('temperature')) return 'TEMPERATURE';
                    if (term.toLowerCase().includes('pressure')) return 'PRESSURE';
                    if (term.toLowerCase().includes('flow')) return 'FLOW RATE';
                    if (term.toLowerCase().includes('speed')) return 'SPEED';
                    return term.toUpperCase();
                }
                return ['TEMPERATURE', 'PRESSURE', 'FLOW RATE', 'LEVEL'][index % 4];
                
            case 'value_input':
                return ['SET POINT', 'TARGET VALUE', 'THRESHOLD', 'LIMIT'][index % 4];
                
            case 'gauge':
                if (availableTerms.length > index) {
                    return `${availableTerms[index].toUpperCase()} GAUGE`;
                }
                return ['PRESSURE GAUGE', 'TEMPERATURE GAUGE', 'FLOW GAUGE', 'LEVEL GAUGE'][index % 4];
                
            case 'progress_bar':
                if (availableTerms.length > index) {
                    return `${availableTerms[index].toUpperCase()} PROGRESS`;
                }
                return ['OPERATION PROGRESS', 'TEST PROGRESS', 'STARTUP PROGRESS', 'PROCESS PROGRESS'][index % 4];
                
            case 'alarm_indicator':
                if (availableTerms.length > index) {
                    return `${availableTerms[index].toUpperCase()} ALARM`;
                }
                return ['SYSTEM ALARM', 'PRESSURE ALARM', 'TEMPERATURE ALARM', 'FLOW ALARM'][index % 4];
                
            case 'data_table':
                return 'SYSTEM DATA';
                
            default:
                return `ELEMENT ${index + 1}`;
        }
    }

    // ✅ NEW: Generate navigation from logic
    generateNavigationFrom(screen, documentContext) {
        const screenName = screen.screenName.toLowerCase();
        const allScreens = documentContext.screenNames;
        
        if (screenName.includes('home') || screenName.includes('main')) {
            return ['System Startup']; // Home is usually the entry point
        } else if (screenName.includes('settings') || screenName.includes('config')) {
            return allScreens.filter(s => s.toLowerCase().includes('main') || s.toLowerCase().includes('home'));
        } else if (screenName.includes('alarm')) {
            return allScreens; // Alarms can be accessed from anywhere
        } else {
            return allScreens.filter(s => s.toLowerCase().includes('main') || s.toLowerCase().includes('home'));
        }
    }

    // ✅ NEW: Generate navigation to logic
    generateNavigationTo(screen, documentContext) {
        const screenName = screen.screenName.toLowerCase();
        const allScreens = documentContext.screenNames;
        
        if (screenName.includes('home') || screenName.includes('main')) {
            return allScreens.filter(s => s !== screen.screenName); // Main can go everywhere
        } else if (screenName.includes('settings') || screenName.includes('config')) {
            return allScreens.filter(s => s.toLowerCase().includes('main') || s.toLowerCase().includes('home'));
        } else {
            return allScreens.filter(s => 
                s.toLowerCase().includes('main') || 
                s.toLowerCase().includes('home') ||
                s.toLowerCase().includes('alarm')
            );
        }
    }

    // ✅ NEW: Get screen category for breadcrumb
    getScreenCategory(screen) {
        return 'Operations';
    }

    // ✅ NEW: Validate element positions to prevent overlaps
    validateElementPositions(elements) {
        const validatedElements = [];
        let currentY = 120; // Start below header
        
        elements.forEach((element, index) => {
            const pos = element.position || {};
            
            // ✅ Ensure reasonable positioning
            const validatedElement = {
                ...element,
                position: {
                    x: Math.max(20, pos.x || (50 + (index % 3) * 200)), // Prevent off-screen
                    y: Math.max(120, pos.y || currentY), // Prevent header overlap
                    width: Math.min(400, Math.max(80, pos.width || 150)), // Reasonable width
                    height: Math.max(30, pos.height || 40) // Minimum height
                }
            };
            
            currentY = validatedElement.position.y + validatedElement.position.height + 10;
            validatedElements.push(validatedElement);
        });
        
        return validatedElements;
    }

    // ✅ NEW: Ensure essential elements are present
    ensureEssentialElements(elements, screen, documentContext) {
        const essentialElements = [...elements];
        
        // ✅ Always ensure header title exists
        const hasTitle = elements.some(el => el.type === 'header_title' || el.type === 'text' && el.position?.y < 100);
        if (!hasTitle) {
            essentialElements.unshift({
                type: "text",
                label: screen.screenName,
                position: {x: 20, y: 25, width: 400, height: 30},
                style: {fontSize: "24px", color: "#ECF0F1", fontWeight: "bold"},
                purpose: "Screen title and identification",
                userAction: "Visual reference for current screen"
            });
        }

        // ✅ Always ensure system status indicator
        const hasStatus = elements.some(el => el.type === 'status_indicator');
        if (!hasStatus) {
            essentialElements.push({
                type: "status_indicator",
                label: "SYSTEM READY",
                position: {x: 600, y: 25, width: 140, height: 30},
                style: {color: "#ECF0F1", backgroundColor: "#27AE60"},
                purpose: "Overall system status indication",
                userAction: "Monitor system health at a glance"
            });
        }

        return essentialElements;
    }

    // ✅ DYNAMIC: Generate default recommendations
    generateDefaultRecommendations(screen, documentContext) {
        const screenName = screen.screenName;
        const systemType = documentContext.systemKeywords.systemType[0] || 'system';
        
        return [
            `Add keyboard shortcuts for frequently used ${screenName} operations`,
            `Implement contextual help system for ${systemType} operations`,
            `Consider adding trend displays for critical ${systemType} parameters`,
            `Add confirmation dialogs for critical actions`,
            `Implement operation logging for audit trail`
        ];
    }

    // ✅ NEW: Get default layout structure
    getDefaultLayout(screen) {
        const screenType = screen.screenType || 'control';
        return {
            header: {
                title: screen.screenName,
                height: 80,
                backgroundColor: "#2C3E50",
                titleColor: "#ECF0F1"
            },
            mainArea: {
                backgroundColor: "#34495E",
                type: screenType
            },
            footer: {
                height: 60,
                backgroundColor: "#2C3E50"
            }
        };
    }

    // ✅ PROFESSIONAL: Return black & white theme for all screens
    getDefaultColorScheme() {
        return {
            canvasBackground: '#F8F9FA',        // Light gray canvas background
            headerBackground: '#000000',         // Black header for contrast
            headerText: '#FFFFFF',              // White text on black header
            headerSubtext: '#CCCCCC',           // Light gray subtext
            screenBackground: '#FFFFFF',         // Pure white screen background
            screenHeaderBg: '#000000',          // Black screen headers
            screenHeaderText: '#FFFFFF',        // White text on black headers
            primary: '#000000',                 // Black for primary elements
            secondary: '#666666',               // Dark gray for secondary elements
            accent: '#333333',                  // Darker gray for accents
            success: '#000000',                 // Black for success (no green)
            warning: '#666666',                 // Gray for warnings (no orange)
            text: '#000000',                    // Black text
            border: '#CCCCCC',                  // Light gray borders
            buttonFill: '#F0F0F0',             // Light gray button fill
            buttonBorder: '#000000',           // Black button borders
            tableBorder: '#000000',            // Black table borders
            tableHeader: '#E0E0E0',            // Light gray table headers
            indicator: '#666666',              // Gray for indicators
            inputBorder: '#000000',            // Black input borders
            inputFill: '#FFFFFF',              // White input fill
            background: '#FFFFFF',             // Main background
            header: '#000000'                  // Header color
        };
    }

   // ✅ Final: Create screen image using Canvas (Fixed render order and clamping)
async createScreenImage(screenSpec) {
    console.log("🔍 Final screenSpec received in createScreenImage():", JSON.stringify(screenSpec, null, 2));

    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // High-quality rendering settings
    ctx.antialias = 'subpixel';
    ctx.quality = 'best';

    // Dynamic color scheme
    const documentContext = this.getDocumentContext();
    const dynamicColors = this.getDynamicColorScheme(documentContext);
    const colorScheme = screenSpec.colorScheme || dynamicColors;

    // 1️⃣ Fill full canvas background
    ctx.fillStyle = colorScheme.background || '#34495E';
    ctx.fillRect(0, 0, 800, 600);

    // Header & Footer heights
    let headerHeight = screenSpec.layout?.header?.height || 80;
    let footerHeight = screenSpec.layout?.footer?.height || 60;
    let footerY = 600 - footerHeight;

    // 2️⃣ Clamp header element Y positions
    if (screenSpec.layout?.header?.elements) {
        for (const el of screenSpec.layout.header.elements) {
            if (el.position) {
                el.position.y = Math.min(Math.max(el.position.y, 5), headerHeight - (el.position.height || 20));
            }
        }
    }

    // 3️⃣ Clamp footer element Y positions
    if (screenSpec.layout?.footer?.elements) {
        for (const el of screenSpec.layout.footer.elements) {
            if (el.position) {
                el.position.y = footerY + Math.min(Math.max(el.position.y - footerY, 0), footerHeight - (el.position.height || 20));
            }
        }
    }

    // 4️⃣ Draw header background
    if (screenSpec.layout?.header) {
        console.log("🧠 Drawing HEADER with height:", headerHeight);
        ctx.fillStyle = screenSpec.layout.header.backgroundColor || colorScheme.header || '#ff0000';
        ctx.fillRect(0, 0, 800, headerHeight);
    }

    // 5️⃣ Draw footer background
    if (screenSpec.layout?.footer) {
        console.log("🧠 Drawing FOOTER with height:", footerHeight);
        ctx.fillStyle = screenSpec.layout.footer.backgroundColor || colorScheme.header || '#00ff00';
        ctx.fillRect(0, footerY, 800, footerHeight);
    }

    // 6️⃣ Draw main area elements first
    if (screenSpec.elements && Array.isArray(screenSpec.elements)) {
        console.log(`🎨 Drawing ${screenSpec.elements.length} main elements...`);
        for (const element of screenSpec.elements) {
            await this.drawElement(ctx, element, screenSpec);
        }
    }

    // 7️⃣ Draw header elements on top of header background
    if (screenSpec.layout?.header?.elements && Array.isArray(screenSpec.layout.header.elements)) {
        console.log(`🎨 Drawing ${screenSpec.layout.header.elements.length} header elements...`);
        for (const element of screenSpec.layout.header.elements) {
            console.log("🧩 Header Element →", element.type, element.position);
            await this.drawElement(ctx, element, screenSpec);
        }
    }

    // 8️⃣ Draw footer elements on top of footer background
    if (screenSpec.layout?.footer?.elements && Array.isArray(screenSpec.layout.footer.elements)) {
        console.log(`🎨 Drawing ${screenSpec.layout.footer.elements.length} footer elements...`);
        for (const element of screenSpec.layout.footer.elements) {
            console.log("🧩 Footer Element →", element.type, element.position);
            await this.drawElement(ctx, element, screenSpec);
        }
    }

    // 9️⃣ Optional: Draw header title
    if (screenSpec.layout?.header?.title) {
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillStyle = screenSpec.layout.header.titleColor || '#ECF0F1';
        ctx.textAlign = 'left';
        ctx.fillText(
            screenSpec.layout.header.title,
            20,
            headerHeight / 2 + 10
        );
    }

    // 🔵 Debug border
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 800, 600);

    // 🔍 Debug labels
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = '#0000ff';
    ctx.fillText("TOP → HEADER", 10, 15);
    ctx.fillText("BOTTOM → FOOTER", 10, 590);

    // 🔚 Return final canvas
    return canvas;
}



    // ✅ Draw individual UI element on canvas (Updated with dynamic colors)
    async drawElement(ctx, element, screenSpec) {
        const pos = element.position || {x: 0, y: 0, width: 100, height: 50};
        console.log(`🎯 Drawing element type: ${element.type}, position: ${JSON.stringify(pos)}`);
        
        // Get dynamic color scheme
        const documentContext = this.getDocumentContext();
        const dynamicColors = this.getDynamicColorScheme(documentContext);
        const colorScheme = screenSpec.colorScheme || dynamicColors;
        
        switch (element.type) {
            case 'header_title':
                // Draw professional header title
                ctx.font = `bold ${element.style?.fontSize || '24px'} Arial, sans-serif`;
                ctx.fillStyle = element.style?.color || colorScheme.text;
                ctx.textAlign = 'left';
                ctx.fillText(element.label || 'HMI Screen', pos.x, pos.y + 30);
                
                // Draw subtitle "CONTROL SYSTEM" in top right
                ctx.font = 'bold 16px Arial, sans-serif';
                ctx.fillStyle = colorScheme.secondary;
                ctx.textAlign = 'right';
                ctx.fillText('CONTROL SYSTEM', 780, pos.y + 25);
                break;
                
            case 'data_table':
                await this.drawDataTable(ctx, element, screenSpec);
                break;
                
            case 'status_indicator':
                // Draw status indicator
                ctx.fillStyle = element.style?.backgroundColor || colorScheme.success;
                ctx.fillRect(pos.x, pos.y, 20, 20);
                
                ctx.font = 'bold 12px Arial, sans-serif';
                ctx.fillStyle = element.style?.color || colorScheme.text;
                ctx.textAlign = 'left';
                ctx.fillText(element.label || 'STATUS', pos.x + 30, pos.y + 15);
                break;
                
            case 'control_button':
                // Draw industrial control button
                await this.drawControlButton(ctx, element, colorScheme);
                break;
                
            case 'text':
                ctx.font = element.style?.fontSize || '16px Arial, sans-serif';
                ctx.fillStyle = element.style?.color || colorScheme.text;
                ctx.textAlign = 'left';
                ctx.fillText(element.label || 'Text', pos.x, pos.y + 20);
                break;

            case 'navigation_button':
                // Draw navigation button in footer
                ctx.fillStyle = element.style?.backgroundColor || colorScheme.primary;
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                
                // Draw button text
                ctx.font = 'bold 14px Arial, sans-serif';
                ctx.fillStyle = element.style?.color || '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(element.label || 'NAV', pos.x + pos.width/2, pos.y + pos.height/2 + 5);
                break;

            case 'date_time_display':
                // Draw date/time display in header
                ctx.font = '12px Arial';
                ctx.fillStyle = element.style?.color || colorScheme.text;
                ctx.textAlign = 'right';
                ctx.fillText(element.label || '15/10/2024 10:10 AM', pos.x + pos.width, pos.y + 20);
                break;

            case 'battery_indicator':
                // Draw battery indicator in header
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = element.style?.color || colorScheme.text;
                ctx.textAlign = 'left';
                ctx.fillText(element.label || 'BATT#1: 85%', pos.x, pos.y + 20);
                break;

            case 'toggle':
                // Draw toggle switch
                ctx.fillStyle = element.style?.backgroundColor || colorScheme.secondary;
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                
                // Draw toggle text
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = element.style?.color || '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(element.label || 'ON/OFF', pos.x + pos.width/2, pos.y + pos.height/2 + 5);
                break;

            case 'data_display':
                // Draw data display (digital readout)
                ctx.fillStyle = element.style?.backgroundColor || '#000000';
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                
                // Draw value
                ctx.font = 'bold 16px monospace';
                ctx.fillStyle = element.style?.color || '#00FF00';
                ctx.textAlign = 'center';
                ctx.fillText(element.label || '0.00', pos.x + pos.width/2, pos.y + pos.height/2 + 6);
                break;

            case 'gauge':
                // Draw simple gauge
                ctx.strokeStyle = element.style?.color || colorScheme.text;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(pos.x + pos.width/2, pos.y + pos.height/2, Math.min(pos.width, pos.height)/2 - 5, 0, 2 * Math.PI);
                ctx.stroke();
                
                // Draw gauge value
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = element.style?.color || colorScheme.text;
                ctx.textAlign = 'center';
                ctx.fillText(element.label || '50%', pos.x + pos.width/2, pos.y + pos.height/2 + 5);
                break;

            case 'progress_bar':
                // Draw progress bar
                ctx.fillStyle = element.style?.backgroundColor || '#333333';
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                
                // Draw progress fill
                const progress = element.value || 0.5;
                ctx.fillStyle = element.style?.color || colorScheme.success;
                ctx.fillRect(pos.x, pos.y, pos.width * progress, pos.height);
                
                // Draw progress text
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(progress * 100)}%`, pos.x + pos.width/2, pos.y + pos.height/2 + 4);
                break;

            case 'value_input':
                // Draw input field
                ctx.fillStyle = element.style?.backgroundColor || '#FFFFFF';
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                ctx.strokeStyle = element.style?.color || colorScheme.text;
                ctx.lineWidth = 1;
                ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
                
                // Draw input text
                ctx.font = '14px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'left';
                ctx.fillText(element.label || 'Enter value', pos.x + 5, pos.y + pos.height/2 + 5);
                break;

            case 'alarm_indicator':
                // Draw alarm indicator
                ctx.fillStyle = element.style?.backgroundColor || '#FF0000';
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
                
                // Draw alarm text
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(element.label || 'ALARM', pos.x + pos.width/2, pos.y + pos.height/2 + 5);
                break;

            default:
                // Fallback simple element
                ctx.fillStyle = element.style?.backgroundColor || colorScheme.primary;
                ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
        }
    }
    
    // ✅ Draw professional data table - AI CONTROLLED (No hardcoded content, dynamic colors)
    async drawDataTable(ctx, element, screenSpec) {
        // ✅ FALLBACK HANDLING - Ensure element has required properties
        if (!element.label) element.label = "Data Table";
        if (!element.position) element.position = { x: 100, y: 200, width: 600, height: 200 };
        if (!element.style) element.style = {};
        
        const pos = element.position;
        const headers = element.headers || ['COMPONENT', 'STATUS', 'VALUE', 'CONTROL'];
        const rows = element.rows || 4;
        const colWidth = pos.width / headers.length;
        const rowHeight = 45;
        
        // ✅ Get system-specific data from document context instead of hardcoded
        const documentContext = this.getDocumentContext();
        const systemComponents = this.generateSystemSpecificTableData(documentContext, rows);
        
        // Get dynamic color scheme
        const dynamicColors = this.getDynamicColorScheme(documentContext);
        const colorScheme = screenSpec.colorScheme || dynamicColors;
        
        // Draw table header
        ctx.fillStyle = element.style?.headerColor || colorScheme.secondary;
        ctx.fillRect(pos.x, pos.y, pos.width, rowHeight);
        
        // Draw header text
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = colorScheme.screenHeaderBg || '#2C3E50';
        ctx.textAlign = 'center';
        
        headers.forEach((header, i) => {
            const headerX = pos.x + (i * colWidth) + (colWidth / 2);
            ctx.fillText(header, headerX, pos.y + 28);
        });
        
        // ✅ Draw rows with AI-generated content (NO HARDCODED ELEMENTS)
        for (let row = 0; row < rows && row < systemComponents.length; row++) {
            const rowY = pos.y + rowHeight + (row * rowHeight);
            const rowData = systemComponents[row];
            
            // Alternate row background
            if (row % 2 === 1) {
                ctx.fillStyle = colorScheme.screenHeaderBg || '#2C3E50';
                ctx.fillRect(pos.x, rowY, pos.width, rowHeight);
            }
            
            // ✅ Draw each column with AI-generated data
            headers.forEach((header, colIndex) => {
                const colX = pos.x + (colIndex * colWidth);
                const content = rowData[colIndex] || this.getDefaultCellContent(header, row);
                
                ctx.font = '12px Arial';
                ctx.fillStyle = colorScheme.text;
                ctx.textAlign = 'left';
                
                if (header.toLowerCase().includes('status')) {
                    // Draw status indicator (colored circle)
                    const statusColor = this.getStatusColor(content);
                    ctx.fillStyle = statusColor;
                    ctx.beginPath();
                    ctx.arc(colX + 30, rowY + 22, 12, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Add status text
                    ctx.fillStyle = colorScheme.text;
                    ctx.fillText(content, colX + 50, rowY + 28);
                } else if (header.toLowerCase().includes('control')) {
                    // Draw control button
                    const btnWidth = Math.min(colWidth - 10, 80);
                    ctx.fillStyle = colorScheme.primary;
                    ctx.fillRect(colX + 5, rowY + 8, btnWidth, 30);
                    ctx.font = 'bold 11px Arial';
                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'center';
                    ctx.fillText(content, colX + 5 + btnWidth/2, rowY + 26);
                } else {
                    // Draw text content
                    ctx.fillText(content, colX + 10, rowY + 28);
                }
            });
        }
        
        // Draw table border
        ctx.strokeStyle = colorScheme.text;
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x, pos.y, pos.width, rowHeight + (rows * rowHeight));
        
        // Draw column separators
        for (let i = 1; i < headers.length; i++) {
            const lineX = pos.x + (i * colWidth);
            ctx.beginPath();
            ctx.moveTo(lineX, pos.y);
            ctx.lineTo(lineX, pos.y + rowHeight + (rows * rowHeight));
            ctx.stroke();
        }
    }

    // ✅ NEW: Generate system-specific table data based on document context
    generateSystemSpecificTableData(documentContext, rows) {
        const systemType = documentContext.systemKeywords.systemType[0] || 'generic';
        const components = documentContext.systemKeywords.components;
        const operations = documentContext.systemKeywords.operations;
        
        const tableData = [];
        
        for (let i = 0; i < rows; i++) {
            const component = components[i] || `Component ${i + 1}`;
            const status = this.getRandomStatus();
            const value = this.getGenericSystemValue(component, systemType);
            const control = operations[i % operations.length] || 'START';
            
            tableData.push([component, status, value, control]);
        }
        
        return tableData;
    }

    // ✅ REMOVED: Now using dynamic component extraction from document instead of hardcoded mappings

    // ✅ NEW: Get random status for variety
    getRandomStatus() {
        const statuses = ['ONLINE', 'READY', 'ACTIVE', 'STANDBY', 'ALARM'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }

    // ✅ REMOVED: Now using getGenericSystemValue() which dynamically determines values based on component names

    // ✅ NEW: Get status color based on content
    getStatusColor(status) {
        const colorMap = {
            'ONLINE': '#27AE60',    // Green
            'READY': '#27AE60',     // Green
            'ACTIVE': '#27AE60',    // Green
            'STANDBY': '#F39C12',   // Orange
            'WARNING': '#F39C12',   // Orange
            'ALARM': '#E74C3C',     // Red
            'ERROR': '#E74C3C',     // Red
            'OFFLINE': '#95A5A6'    // Gray
        };
        
        return colorMap[status.toUpperCase()] || '#3498DB';
    }

    // ✅ NEW: Get default cell content based on header
    getDefaultCellContent(header, rowIndex) {
        const headerLower = header.toLowerCase();
        
        if (headerLower.includes('component') || headerLower.includes('equipment')) {
            return `COMPONENT ${rowIndex + 1}`;
        } else if (headerLower.includes('status')) {
            return 'READY';
        } else if (headerLower.includes('value')) {
            return '100%';
        } else if (headerLower.includes('control')) {
            return 'START';
        } else {
            return `DATA ${rowIndex + 1}`;
        }
    }
    
    // ✅ Draw industrial control button
    async drawControlButton(ctx, element, colorScheme) {
        const pos = element.position;
        
        // Use dynamic color scheme if provided
        const dynamicColors = colorScheme || this.getDynamicColorScheme(this.getDocumentContext());
        
        // Draw button with gradient effect
        ctx.fillStyle = element.style?.backgroundColor || dynamicColors.primary;
        ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
        
        // Draw button border
        ctx.strokeStyle = element.style?.borderColor || dynamicColors.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
        
        // Draw button text
        ctx.font = `bold ${element.style?.fontSize || '14px'} Arial`;
        ctx.fillStyle = element.style?.color || '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'BUTTON', pos.x + pos.width/2, pos.y + pos.height/2 + 5);
    }

    // ✅ Read document content (improved for better DOCX handling)
    async readDocument(filePath) {
        this.updateProgress('analysis', `📄 Reading document: ${filePath}`);
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.txt') {
            return fs.readFileSync(filePath, 'utf8');
        } else if (ext === '.docx') {
            try {
                // ✅ Use mammoth for DOCX text extraction
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({path: filePath});
                this.updateProgress('analysis', `📄 Mammoth extraction: ${result.value.length} characters`);
                return result.value;
            } catch (mammothError) {
                this.updateProgress('analysis', `⚠️ Mammoth extraction failed: ${mammothError.message}`);
                // ✅ Fallback to basic reading
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    this.updateProgress('analysis', `📄 Fallback text read: ${content.length} characters`);
                    return content;
                } catch (fallbackError) {
                    this.updateProgress('analysis', '❌ All document reading attempts failed');
                    return `[Document could not be read: ${fallbackError.message}]`;
                }
            }
        } else {
            return fs.readFileSync(filePath, 'utf8');
        }
    }

    // ✅ Extract text from DOCX content (updated for mammoth compatibility)
    extractTextFromDocx(content) {
        // ✅ If content is already a string (from mammoth), return it
        if (typeof content === 'string') {
            return content;
        }
        
        // ✅ Handle array of content items
        if (Array.isArray(content)) {
            return content.map(item => this.extractTextFromDocx(item)).join('\n');
        }
        
        // ✅ Handle objects with text property
        if (content && typeof content === 'object') {
            if (content.text) {
                return content.text;
            }
            if (content.children) {
                return content.children.map(child => this.extractTextFromDocx(child)).join('\n');
            }
            if (content.content) {
                return this.extractTextFromDocx(content.content);
            }
        }
        
        // ✅ Handle primitive values
        if (typeof content === 'string') {
            return content;
        }
        
        return '';
    }

    // ✅ Get session data
    getSessionData() {
        return this.sessionData;
    }

    // ✅ NEW: Create comprehensive screen layout (Single image with all screens)
    async createComprehensiveScreenLayout(screens, documentContext) {
        console.log('🎨 Creating comprehensive screen layout...');
        
        // Calculate optimal layout dimensions
        const screenCount = screens.length;
        const cols = Math.ceil(Math.sqrt(screenCount));
        const rows = Math.ceil(screenCount / cols);
        
        // Canvas dimensions for comprehensive layout
        const screenWidth = 400;
        const screenHeight = 300;
        const margin = 20;
        const headerHeight = 80;
        const padding = 40;
        
        const canvasWidth = (screenWidth + margin) * cols + margin;
        const canvasHeight = headerHeight + (screenHeight + margin) * rows + margin + padding;
        
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // Set high-quality rendering
        ctx.antialias = 'subpixel';
        ctx.quality = 'best';
        
        // Get dynamic color scheme based on system type
        const colorScheme = this.getDynamicColorScheme(documentContext);
        
        // Set main background
        ctx.fillStyle = colorScheme.canvasBackground;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw main header
        ctx.fillStyle = colorScheme.headerBackground;
        ctx.fillRect(0, 0, canvasWidth, headerHeight);
        
        // Draw system title
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = colorScheme.headerText;
        ctx.textAlign = 'center';
        const systemName = documentContext.systemKeywords.systemType[0] || 'industrial_control';
        ctx.fillText(`${systemName.toUpperCase()} - HMI SCREEN LAYOUT`, canvasWidth / 2, 35);
        
        // Draw subtitle
        ctx.font = '16px Arial';
        ctx.fillStyle = colorScheme.headerSubtext;
        ctx.fillText(`${screenCount} Screens | Professional HMI Design`, canvasWidth / 2, 60);
        
        // Generate specifications for all screens
        const screenSpecs = [];
        for (let i = 0; i < screens.length; i++) {
            try {
                const spec = await this.generateScreenSpecification(screens[i]);
                screenSpecs.push(spec);
        } catch (error) {
                console.error(`❌ Error generating spec for ${screens[i].screenName}:`, error);
                screenSpecs.push(this.generateFallbackSpec(screens[i], documentContext));
            }
        }
        
        // Draw individual screens
        for (let i = 0; i < screens.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = margin + col * (screenWidth + margin);
            const y = headerHeight + padding + row * (screenHeight + margin);
            
            try {
                await this.drawMiniScreen(ctx, screenSpecs[i], x, y, screenWidth, screenHeight, colorScheme);
            } catch (error) {
                console.error(`❌ Error drawing screen ${screens[i].screenName}:`, error);
                // Draw error placeholder
                this.drawErrorPlaceholder(ctx, screens[i].screenName, x, y, screenWidth, screenHeight, colorScheme);
            }
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `comprehensive_hmi_layout_${timestamp}.png`;
        const filepath = path.join(__dirname, '../outputs', filename);
        
        // Save image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filepath, buffer);
        
        console.log(`✅ Comprehensive screen layout saved: ${filename}`);
        return filepath;
    }

    // ✅ NEW: Get dynamic color scheme based on system type
    getDynamicColorScheme(documentContext) {
        const systemType = documentContext.systemKeywords.systemType[0]?.toLowerCase() || 'industrial';
        
        // ✅ RESTORED: Rich, colorful themes for detailed HMI layouts
        const colorSchemes = {
            'water_treatment': {
                canvasBackground: '#F0F8FF',
                headerBackground: '#2C3E50',
                headerText: '#ECF0F1',
                headerSubtext: '#BDC3C7',
                screenBackground: '#FFFFFF',
                screenHeaderBg: '#3498DB',
                screenHeaderText: '#FFFFFF',
                primary: '#3498DB',
                secondary: '#95A5A6',
                accent: '#E74C3C',
                success: '#27AE60',
                warning: '#F39C12',
                text: '#2C3E50',
                border: '#BDC3C7',
                buttonFill: '#ECF0F1',
                buttonBorder: '#3498DB',
                tableBorder: '#BDC3C7',
                tableHeader: '#EBF3FD',
                indicator: '#27AE60',
                inputBorder: '#3498DB',
                inputFill: '#FFFFFF'
            },
            'power_generation': {
                canvasBackground: '#FFF8DC',
                headerBackground: '#8B4513',
                headerText: '#FFFFFF',
                headerSubtext: '#F4A460',
                screenBackground: '#FFFFFF',
                screenHeaderBg: '#FF8C00',
                screenHeaderText: '#FFFFFF',
                primary: '#FF8C00',
                secondary: '#CD853F',
                accent: '#B22222',
                success: '#228B22',
                warning: '#FFD700',
                text: '#8B4513',
                border: '#DEB887',
                buttonFill: '#FFF8DC',
                buttonBorder: '#FF8C00',
                tableBorder: '#DEB887',
                tableHeader: '#FFEBCD',
                indicator: '#228B22',
                inputBorder: '#FF8C00',
                inputFill: '#FFFFFF'
            },
            'gas': {
                canvasBackground: '#F5F5F5',
                headerBackground: '#4A4A4A',
                headerText: '#FFFFFF',
                headerSubtext: '#CCCCCC',
                screenBackground: '#FFFFFF',
                screenHeaderBg: '#6A5ACD',
                screenHeaderText: '#FFFFFF',
                primary: '#6A5ACD',
                secondary: '#9370DB',
                accent: '#DC143C',
                success: '#32CD32',
                warning: '#FFA500',
                text: '#4A4A4A',
                border: '#D3D3D3',
                buttonFill: '#F8F8FF',
                buttonBorder: '#6A5ACD',
                tableBorder: '#D3D3D3',
                tableHeader: '#E6E6FA',
                indicator: '#32CD32',
                inputBorder: '#6A5ACD',
                inputFill: '#FFFFFF'
            }
        };
        
        // ✅ Enhanced default scheme with rich colors
        const defaultScheme = {
            canvasBackground: '#F8F9FA',
            headerBackground: '#2C3E50',
            headerText: '#ECF0F1',
            headerSubtext: '#BDC3C7',
            screenBackground: '#FFFFFF',
            screenHeaderBg: '#34495E',
            screenHeaderText: '#FFFFFF',
            primary: '#3498DB',
            secondary: '#95A5A6',
            accent: '#E74C3C',
            success: '#27AE60',
            warning: '#F39C12',
            text: '#2C3E50',
            border: '#BDC3C7',
            buttonFill: '#ECF0F1',
            buttonBorder: '#3498DB',
            tableBorder: '#BDC3C7',
            tableHeader: '#EBF3FD',
            indicator: '#27AE60',
            inputBorder: '#3498DB',
            inputFill: '#FFFFFF'
        };
        
        // ✅ FIXED: Check for system type keywords with better matching
        for (const [type, scheme] of Object.entries(colorSchemes)) {
            // Check if the system type includes the key or any part of it
            if (systemType.includes(type) || type.includes(systemType)) {
                return scheme;
            }
        }
        
        // ✅ Additional check for compound system types (e.g., "water_treatment")
        if (systemType.includes('water')) {
            return colorSchemes['water_treatment'];
        }
        
        return defaultScheme;
    }

    // ✅ NEW: Draw mini screen in comprehensive layout
    async drawMiniScreen(ctx, screenSpec, x, y, width, height, colorScheme) {
        // Draw screen background
        ctx.fillStyle = colorScheme.screenBackground;
        ctx.fillRect(x, y, width, height);
        
        // Draw screen header
        ctx.fillStyle = colorScheme.screenHeaderBg;
        ctx.fillRect(x, y, width, 40);
        
        // Draw screen title
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = colorScheme.screenHeaderText;
        ctx.textAlign = 'center';
        ctx.fillText(screenSpec.screenTitle || 'Screen', x + width / 2, y + 25);
        
        // Draw mini elements
        if (screenSpec.elements) {
            for (const element of screenSpec.elements.slice(0, 6)) { // Limit to 6 elements for mini view
                await this.drawMiniElement(ctx, element, x, y + 40, width, height - 40, colorScheme);
            }
        }
        
        // Draw screen border
        ctx.strokeStyle = colorScheme.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw corner indicator
        ctx.fillStyle = colorScheme.secondary;
        ctx.fillRect(x + width - 20, y + height - 20, 20, 20);
    }

    // ✅ NEW: Draw mini element in screen
    async drawMiniElement(ctx, element, screenX, screenY, screenWidth, screenHeight, colorScheme) {
        if (!element.position) return;
        
        // Scale position to mini screen
        const scaleX = screenWidth / 800;
        const scaleY = screenHeight / 600;
        
        const x = screenX + (element.position.x * scaleX);
        const y = screenY + (element.position.y * scaleY);
        const width = element.position.width * scaleX;
        const height = element.position.height * scaleY;
        
        // ✅ FIXED: Draw detailed elements instead of basic rectangles
        switch (element.type) {
            case 'control_button':
                await this.drawProfessionalButton(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'status_indicator':
                await this.drawProfessionalIndicator(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'data_table':
                await this.drawProfessionalDataTable(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'data_display':
                await this.drawProfessionalDataDisplay(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'value_input':
                await this.drawProfessionalInputField(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'alarm_indicator':
                await this.drawProfessionalAlarmIndicator(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'gauge':
                await this.drawProfessionalGauge(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'progress_bar':
                await this.drawProfessionalProgressBar(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'text':
                await this.drawProfessionalText(ctx, element, x, y, width, height, colorScheme);
                break;
                
            default:
                await this.drawProfessionalButton(ctx, element, x, y, width, height, colorScheme);
        }
    }

    // ✅ NEW: Draw error placeholder
    drawErrorPlaceholder(ctx, screenName, x, y, width, height, colorScheme) {
        // Draw background
        ctx.fillStyle = colorScheme.screenBackground;
        ctx.fillRect(x, y, width, height);
        
        // Draw error message
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = colorScheme.accent;
        ctx.textAlign = 'center';
        ctx.fillText('ERROR', x + width / 2, y + height / 2 - 10);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = colorScheme.text;
        ctx.fillText(screenName, x + width / 2, y + height / 2 + 10);
        
        // Draw border
        ctx.strokeStyle = colorScheme.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    // ✅ UPDATED: Remove hardcoded color scheme
    getDefaultColorScheme() {
        // This method is now deprecated - use getDynamicColorScheme instead
        return this.getDynamicColorScheme({ systemKeywords: { systemType: ['industrial'] } });
    }

    // ✅ ENHANCED: Draw comprehensive workflow-driven combined layout
    async drawCombinedLayout(screens, canvasWidth = 2400, canvasHeight = 1600) {
        console.log('🎨 Drawing comprehensive workflow-driven combined layout...');
        
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // Get workflow and system information
        const documentContext = this.getDocumentContext();
        const workflowData = this.sessionData.workflowDiagram || {};
        const systemOverview = workflowData.systemOverview || {};
        
        // Set canvas background
        ctx.fillStyle = '#F8F9FA';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw comprehensive header section
        await this.drawComprehensiveHeader(ctx, canvasWidth, systemOverview, screens.length);
        
        // Grid configuration for screens
        const cols = 3;
        const padding = 50;
        const screenWidth = 650;
        const screenHeight = 450;
        const headerHeight = 140; // Increased for comprehensive header
        
        // Draw workflow navigation arrows between screens
        await this.drawWorkflowNavigation(ctx, screens, cols, padding, screenWidth, screenHeight, headerHeight);
        
        // Draw each screen with enhanced details
        for (let i = 0; i < screens.length; i++) {
            const screenSpec = screens[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = padding + (col * (screenWidth + padding));
            const y = headerHeight + padding + (row * (screenHeight + padding));
            
            // Draw enhanced screen container with workflow context
            await this.drawEnhancedScreenContainer(ctx, screenSpec, x, y, screenWidth, screenHeight, i + 1);
            
            // Draw the individual screen with more detail
            await this.drawDetailedScreenInGrid(ctx, screenSpec, x, y, screenWidth, screenHeight);
        }
        
        // Draw comprehensive footer with workflow summary
        await this.drawComprehensiveFooter(ctx, canvasWidth, canvasHeight, screens, workflowData);
        
        console.log(`✅ Comprehensive workflow-driven layout drawn with ${screens.length} screens`);
        return canvas;
    }
    
    // ✅ NEW: Draw comprehensive header with system information
    async drawComprehensiveHeader(ctx, canvasWidth, systemOverview, totalScreens) {
        // ✅ Use consistent black & white color scheme
        const colorScheme = this.getDynamicColorScheme(this.getDocumentContext());

        // Main header background
        ctx.fillStyle = colorScheme.headerBackground;
        ctx.fillRect(0, 0, canvasWidth, 100);

        // System title (white on black)
        ctx.fillStyle = colorScheme.headerText;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(systemOverview.systemName || 'HMI System Layout', canvasWidth / 2, 45);

        // System type and details (light gray on black)
        ctx.font = '18px Arial';
        ctx.fillStyle = colorScheme.headerSubtext;
        ctx.fillText(
            `${(systemOverview.systemType || 'industrial_control').replace('_', ' ').toUpperCase()} | ${totalScreens} Screens | Workflow-Driven Design`,
            canvasWidth / 2,
            75
        );

        // Sub-header background
        ctx.fillStyle = colorScheme.headerBackground;
        ctx.fillRect(0, 100, canvasWidth, 40);

        // Sub-header text
        ctx.fillStyle = colorScheme.headerSubtext;
        ctx.font = '14px Arial';
        ctx.fillText(
            `Primary Function: ${systemOverview.primaryFunction || 'Industrial Process Control'} | Generated: ${new Date().toLocaleDateString()}`,
            canvasWidth / 2,
            125
        );
    }
    
    // ✅ NEW: Draw workflow navigation arrows
    async drawWorkflowNavigation(ctx, screens, cols, padding, screenWidth, screenHeight, headerHeight) {
        const colorScheme = this.getDynamicColorScheme(this.getDocumentContext());
        const workflowData = this.sessionData.workflowDiagram || {};
        const transitions = workflowData.screenTransitions || workflowData.navigationFlow?.screenTransitions || [];
        
        // Draw navigation arrows between screens based on workflow
        for (const transition of transitions) {
            const fromIndex = screens.findIndex(s => s.screenTitle === transition.from);
            const toIndex = screens.findIndex(s => s.screenTitle === transition.to);
            
            if (fromIndex !== -1 && toIndex !== -1) {
                const fromCol = fromIndex % cols;
                const fromRow = Math.floor(fromIndex / cols);
                const toCol = toIndex % cols;
                const toRow = Math.floor(toIndex / cols);
                
                const fromX = padding + (fromCol * (screenWidth + padding)) + screenWidth / 2;
                const fromY = headerHeight + padding + (fromRow * (screenHeight + padding)) + screenHeight / 2;
                const toX = padding + (toCol * (screenWidth + padding)) + screenWidth / 2;
                const toY = headerHeight + padding + (toRow * (screenHeight + padding)) + screenHeight / 2;
                
                // Draw arrow
                ctx.strokeStyle = colorScheme.accent;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
                
                // Draw arrow head
                const angle = Math.atan2(toY - fromY, toX - fromX);
                const arrowLength = 15;
                ctx.beginPath();
                ctx.moveTo(toX, toY);
                ctx.lineTo(toX - arrowLength * Math.cos(angle - Math.PI / 6), toY - arrowLength * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(toX, toY);
                ctx.lineTo(toX - arrowLength * Math.cos(angle + Math.PI / 6), toY - arrowLength * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        }
    }
    
    // ✅ FIXED: Draw screen container without borders and with better title positioning
    async drawEnhancedScreenContainer(ctx, screenSpec, x, y, screenWidth, screenHeight, screenNumber) {
        // ✅ FIXED: Get proper color scheme
        const colorScheme = screenSpec.colorScheme || this.getDynamicColorScheme(this.getDocumentContext());
        
        // ✅ REMOVED: Screen container background and borders to prevent overlapping
        // No more borders or background containers
        
        // ✅ REMOVED: Screen number badge to reduce clutter
        // No more numbered badges
        
        // ✅ FIXED: Screen title with better positioning (moved much further up)
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(screenSpec.screenTitle || `Screen ${screenNumber}`, x + screenWidth / 2, y - 70);
        
        // ✅ FIXED: Screen purpose/description (moved much further up)
        if (screenSpec.screenPurpose) {
            ctx.fillStyle = colorScheme.secondary || '#666666';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            const purposeText = screenSpec.screenPurpose.length > 80 ? 
                screenSpec.screenPurpose.substring(0, 80) + '...' : 
                screenSpec.screenPurpose;
            ctx.fillText(purposeText, x + screenWidth / 2, y - 50);
        }
    }
    
    // ✅ NEW: Draw detailed screen with enhanced elements
    async drawDetailedScreenInGrid(ctx, screenSpec, x, y, width, height) {
        const colorScheme = screenSpec.colorScheme || this.getDefaultColorScheme();
        
        // Enhanced screen background
        ctx.fillStyle = colorScheme.background || colorScheme.screenBackground;
        ctx.fillRect(x, y, width, height);
        
        // Enhanced header with gradient effect
        const headerHeight = 60;
        const gradient = ctx.createLinearGradient(x, y, x, y + headerHeight);
        gradient.addColorStop(0, colorScheme.header || colorScheme.screenHeaderBg);
        gradient.addColorStop(1, colorScheme.primary || '#3498DB');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, headerHeight);
        
        // Header title with enhanced styling
        ctx.fillStyle = colorScheme.text || colorScheme.screenHeaderText;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(screenSpec.screenTitle || 'Screen', x + width / 2, y + headerHeight / 2 + 6);
        
        // Draw elements with enhanced detail and labels
        if (screenSpec.elements) {
            for (const element of screenSpec.elements) {
                await this.drawEnhancedGridElement(ctx, element, x, y + headerHeight, width, height - headerHeight, colorScheme);
            }
        }
        
        // Enhanced footer with element count
        const footerHeight = 40;
        ctx.fillStyle = colorScheme.header || colorScheme.screenHeaderBg;
        ctx.fillRect(x, y + height - footerHeight, width, footerHeight);
        
        // Element count and details
        ctx.fillStyle = colorScheme.text || '#ECF0F1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const elementCount = screenSpec.elements ? screenSpec.elements.length : 0;
        ctx.fillText(`${elementCount} UI Elements | Industrial HMI Design`, x + width / 2, y + height - footerHeight / 2 + 4);
        
        // Enhanced screen border
        ctx.strokeStyle = colorScheme.text || colorScheme.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    // ✅ NEW: Draw professional HMI elements with realistic details
    async drawEnhancedGridElement(ctx, element, screenX, screenY, screenWidth, screenHeight, colorScheme) {
        if (!element.position) return;
        
        // Scale position to grid screen
        const scaleX = screenWidth / 800;
        const scaleY = screenHeight / 600;
        
        const x = screenX + (element.position.x * scaleX);
        const y = screenY + (element.position.y * scaleY);
        const width = element.position.width * scaleX;
        const height = element.position.height * scaleY;
        
        // Draw based on element type with professional HMI styling
        switch (element.type) {
            case 'control_button':
                await this.drawProfessionalButton(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'status_indicator':
                await this.drawProfessionalIndicator(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'data_table':
                await this.drawProfessionalDataTable(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'data_display':
                await this.drawProfessionalDataDisplay(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'value_input':
                await this.drawProfessionalInputField(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'alarm_indicator':
                await this.drawProfessionalAlarmIndicator(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'gauge':
                await this.drawProfessionalGauge(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'progress_bar':
                await this.drawProfessionalProgressBar(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'text':
                await this.drawProfessionalText(ctx, element, x, y, width, height, colorScheme);
                break;
                
            default:
                await this.drawProfessionalButton(ctx, element, x, y, width, height, colorScheme);
        }
    }

    // ✅ ENHANCED: Draw detailed professional button with 3D effect
    async drawProfessionalButton(ctx, element, x, y, width, height, colorScheme) {
        // Button shadow for 3D effect
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 2, y + 2, width, height);
        
        // Button background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, colorScheme.buttonFill || '#ECF0F1');
        gradient.addColorStop(1, colorScheme.secondary || '#BDC3C7');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // Button border
        ctx.strokeStyle = colorScheme.buttonBorder || '#3498DB';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Button text with better sizing
        ctx.fillStyle = colorScheme.text || '#2C3E50';
        ctx.font = `bold ${Math.min(width / 8, 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'START', x + width / 2, y + height / 2 + 4);
        
        // Status LED indicator
        const ledX = x + width - 15;
        const ledY = y + 5;
        ctx.fillStyle = this.getLEDColor(element.label);
        ctx.beginPath();
        ctx.arc(ledX, ledY, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

    // ✅ PROFESSIONAL: Draw clean black & white status indicator for HMI reference
    async drawProfessionalIndicator(ctx, element, x, y, width, height, colorScheme) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 3;
        
        // ✅ Outer ring (black border)
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // ✅ Inner circle (white or light gray fill)
        ctx.fillStyle = colorScheme.screenBackground || '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // ✅ Inner circle border (black)
        ctx.strokeStyle = colorScheme.text || '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // ✅ Status label (black text)
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.font = `${Math.min(width / 8, 9)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'STATUS', centerX, y + height + 12);
    }

    // ✅ NEW: Draw professional data table with realistic content
    async drawProfessionalDataTable(ctx, element, x, y, width, height, colorScheme) {
        const rows = 4;
        const cols = 3;
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        // ✅ Table background (white)
        ctx.fillStyle = colorScheme.screenBackground || '#FFFFFF';
        ctx.fillRect(x, y, width, height);
        
        // ✅ Table border (black)
        ctx.strokeStyle = colorScheme.tableBorder || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // ✅ Draw grid lines (black)
        for (let i = 1; i < rows; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + i * cellHeight);
            ctx.lineTo(x + width, y + i * cellHeight);
            ctx.stroke();
        }
        
        for (let j = 1; j < cols; j++) {
            ctx.beginPath();
            ctx.moveTo(x + j * cellWidth, y);
            ctx.lineTo(x + j * cellWidth, y + height);
            ctx.stroke();
        }
        
        // Generate dynamic data based on system context
        const tableData = this.generateDynamicTableData(element, 4, 3);
        
        ctx.font = `${Math.min(cellWidth / 8, 8)}px Arial`;
        ctx.textAlign = 'center';
        
        for (let i = 0; i < Math.min(rows, tableData.length); i++) {
            for (let j = 0; j < Math.min(cols, tableData[i].length); j++) {
                const cellX = x + j * cellWidth;
                const cellY = y + i * cellHeight;
                
                if (i === 0) {
                    // ✅ Header row (light gray background)
                    ctx.fillStyle = colorScheme.tableHeader || '#E0E0E0';
                    ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
                    ctx.fillStyle = colorScheme.text || '#000000';
                } else {
                    // ✅ Data rows (black text)
                    ctx.fillStyle = colorScheme.text || '#000000';
                }
                
                ctx.fillText(tableData[i][j], cellX + cellWidth / 2, cellY + cellHeight / 2 + 3);
            }
        }
    }

    // ✅ ENHANCED: Draw detailed data display with realistic industrial styling
    async drawProfessionalDataDisplay(ctx, element, x, y, width, height, colorScheme) {
        // Display background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#F8F9FA');
        gradient.addColorStop(1, colorScheme.screenBackground || '#FFFFFF');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // 3D border effect
        ctx.strokeStyle = colorScheme.border || '#BDC3C7';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Inner highlight
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        
        // Label area
        const labelHeight = height * 0.3;
        ctx.fillStyle = colorScheme.secondary || '#95A5A6';
        ctx.fillRect(x, y, width, labelHeight);
        
        // Label text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.min(width / 10, 8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'PRESSURE', x + width / 2, y + labelHeight / 2 + 3);
        
        // Value display
        ctx.fillStyle = colorScheme.text || '#2C3E50';
        ctx.font = `bold ${Math.min(width / 5, 16)}px monospace`;
        ctx.textAlign = 'center';
        
        const displayValue = this.getDisplayValue(element.label);
        ctx.fillText(displayValue, x + width / 2, y + height - 20);
        
        // Unit label
        ctx.fillStyle = colorScheme.secondary || '#95A5A6';
        ctx.font = `${Math.min(width / 12, 10)}px Arial`;
        const unit = this.getUnit(element.label);
        ctx.fillText(unit, x + width / 2, y + height - 5);
        
        // Status indicator
        ctx.fillStyle = this.getStatusColor(displayValue);
        ctx.fillRect(x + width - 10, y + labelHeight + 5, 8, 8);
    }

    // ✅ NEW: Get appropriate unit for the parameter
    getUnit(label) {
        if (!label) return '';
        const labelLower = label.toLowerCase();
        if (labelLower.includes('temperature')) return '°C';
        if (labelLower.includes('pressure')) return 'PSI';
        if (labelLower.includes('flow')) return 'L/min';
        if (labelLower.includes('voltage')) return 'V';
        if (labelLower.includes('current')) return 'A';
        if (labelLower.includes('speed') || labelLower.includes('rpm')) return 'RPM';
        if (labelLower.includes('level') || labelLower.includes('concentration')) return '%';
        return 'UNIT';
    }

    // ✅ NEW: Draw professional input field
    async drawProfessionalInputField(ctx, element, x, y, width, height, colorScheme) {
        // Input background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, width, height);
        // Input border
        ctx.strokeStyle = '#BDC3C7';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        // Input text (black)
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.font = `${Math.min(width / 8, 10)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(this.getInputValue(element.label), x + 5, y + height / 2 + 3);
        // Cursor
        ctx.strokeStyle = colorScheme.text || '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width - 10, y + 5);
        ctx.lineTo(x + width - 10, y + height - 5);
        ctx.stroke();
    }

    // ✅ PROFESSIONAL: Draw clean black & white alarm indicator for HMI reference
    async drawProfessionalAlarmIndicator(ctx, element, x, y, width, height, colorScheme) {
        // ✅ Alarm background (white for normal, light gray for alarm)
        ctx.fillStyle = colorScheme.screenBackground || '#FFFFFF';
        ctx.fillRect(x, y, width, height);
        
        // ✅ Alarm border (black)
        ctx.strokeStyle = colorScheme.text || '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // ✅ Alarm text (black)
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.font = `bold ${Math.min(width / 8, 10)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'ALARM', x + width / 2, y + height / 2 + 3);
    }

    // ✅ ENHANCED: Draw detailed professional gauge with scale markings
    async drawProfessionalGauge(ctx, element, x, y, width, height, colorScheme) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2 - 15;
        
        // Gauge background with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, colorScheme.screenBackground || '#F8F9FA');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Outer ring
        ctx.strokeStyle = colorScheme.border || '#BDC3C7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Scale markings
        for (let i = 0; i <= 10; i++) {
            const angle = -Math.PI * 0.75 + (i * Math.PI * 1.5 / 10);
            const startRadius = radius - 10;
            const endRadius = i % 2 === 0 ? radius - 20 : radius - 15;
            
            ctx.strokeStyle = colorScheme.text || '#2C3E50';
            ctx.lineWidth = i % 2 === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * startRadius,
                centerY + Math.sin(angle) * startRadius
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * endRadius,
                centerY + Math.sin(angle) * endRadius
            );
            ctx.stroke();
            
            // Scale numbers
            if (i % 2 === 0) {
                ctx.fillStyle = colorScheme.text || '#2C3E50';
                ctx.font = `${Math.min(width / 15, 10)}px Arial`;
                ctx.textAlign = 'center';
                const value = i * 10;
                ctx.fillText(
                    value.toString(),
                    centerX + Math.cos(angle) * (endRadius - 10),
                    centerY + Math.sin(angle) * (endRadius - 10) + 3
                );
            }
        }
        
        // Gauge needle with current value
        const currentValue = parseFloat(this.getDisplayValue(element.label));
        const normalizedValue = Math.min(Math.max(currentValue / 100, 0), 1);
        const needleAngle = -Math.PI * 0.75 + (normalizedValue * Math.PI * 1.5);
        
        ctx.strokeStyle = colorScheme.accent || '#E74C3C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(needleAngle) * (radius - 25),
            centerY + Math.sin(needleAngle) * (radius - 25)
        );
        ctx.stroke();
        
        // Center hub
        ctx.fillStyle = colorScheme.secondary || '#95A5A6';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Value display
        ctx.fillStyle = colorScheme.text || '#2C3E50';
        ctx.font = `bold ${Math.min(width / 8, 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(currentValue.toFixed(1), centerX, centerY + radius - 5);
        
        // Label
        ctx.font = `${Math.min(width / 12, 8)}px Arial`;
        ctx.fillText(element.label || 'GAUGE', centerX, y + 15);
    }

    // ✅ PROFESSIONAL: Draw clean black & white progress bar for HMI reference
    async drawProfessionalProgressBar(ctx, element, x, y, width, height, colorScheme) {
        // ✅ Progress bar background (white)
        ctx.fillStyle = colorScheme.screenBackground || '#FFFFFF';
        ctx.fillRect(x, y, width, height);
        
        // ✅ Progress bar border (black)
        ctx.strokeStyle = colorScheme.text || '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // ✅ Progress fill (light gray)
        const progress = Math.random() * 0.8 + 0.2; // 20-100%
        ctx.fillStyle = colorScheme.secondary || '#666666';
        ctx.fillRect(x + 2, y + 2, (width - 4) * progress, height - 4);
        
        // ✅ Progress text (black)
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.font = `${Math.min(width / 10, 10)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(progress * 100)}%`, x + width / 2, y + height / 2 + 3);
    }

    // ✅ NEW: Draw professional text with proper styling
    async drawProfessionalText(ctx, element, x, y, width, height, colorScheme) {
        ctx.fillStyle = colorScheme.text || '#000000';
        ctx.font = `${Math.min(width / 10, 11)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'TEXT', x + width / 2, y + height / 2 + 4);
    }

    // ✅ NEW: Get LED color based on status
    getLEDColor(label) {
        if (!label) return '#95A5A6';
        
        const labelLower = label.toLowerCase();
        if (labelLower.includes('ready') || labelLower.includes('normal') || labelLower.includes('ok')) {
            return '#27AE60'; // Green
        } else if (labelLower.includes('warning') || labelLower.includes('caution')) {
            return '#F39C12'; // Orange
        } else if (labelLower.includes('alarm') || labelLower.includes('error') || labelLower.includes('fault')) {
            return '#E74C3C'; // Red
        } else if (labelLower.includes('active') || labelLower.includes('on')) {
            return '#3498DB'; // Blue
        } else {
            return '#95A5A6'; // Gray
        }
    }

    // ✅ NEW: Get display value based on parameter
    getDisplayValue(label) {
        if (!label) return '0.0';
        
        const labelLower = label.toLowerCase();
        if (labelLower.includes('temperature')) {
            return (Math.random() * 30 + 20).toFixed(1);
        } else if (labelLower.includes('pressure')) {
            return (Math.random() * 50 + 100).toFixed(0);
        } else if (labelLower.includes('flow')) {
            return (Math.random() * 20 + 10).toFixed(1);
        } else if (labelLower.includes('level') || labelLower.includes('concentration')) {
            return (Math.random() * 30 + 70).toFixed(1);
        } else if (labelLower.includes('voltage')) {
            return (Math.random() * 20 + 220).toFixed(0);
        } else if (labelLower.includes('current')) {
            return (Math.random() * 10 + 5).toFixed(1);
        } else if (labelLower.includes('speed') || labelLower.includes('rpm')) {
            return (Math.random() * 500 + 1000).toFixed(0);
        } else {
            return (Math.random() * 100).toFixed(1);
        }
    }

    // ✅ NEW: Get input value for input fields
    getInputValue(label) {
        if (!label) return '100';
        
        const labelLower = label.toLowerCase();
        if (labelLower.includes('setpoint') || labelLower.includes('target')) {
            return (Math.random() * 50 + 50).toFixed(1);
        } else if (labelLower.includes('time')) {
            return (Math.random() * 60 + 30).toFixed(0);
        } else if (labelLower.includes('count')) {
            return Math.floor(Math.random() * 1000).toString();
        } else {
            return (Math.random() * 100).toFixed(1);
        }
    }

    // ✅ NEW: Generate dynamic table data based on document context
    generateDynamicTableData(element, rows, cols) {
        const documentContext = this.getDocumentContext();
        const systemKeywords = documentContext.systemKeywords;
        const systemType = systemKeywords.systemType[0] || 'generic';
        
        // Generic headers that work for any system
        const headers = ['Parameter', 'Value', 'Status'];
        
        const tableData = [headers];
        
        // Generate rows based on system components and keywords
        const availableComponents = [
            ...systemKeywords.components,
            ...systemKeywords.controls,
            ...systemKeywords.operations
        ];
        
        for (let i = 1; i < rows && i <= availableComponents.length + 1; i++) {
            const component = availableComponents[i - 1] || `Component ${i}`;
            const value = this.getGenericSystemValue(component, systemType);
            const status = this.getRandomStatus();
            
            tableData.push([
                component.charAt(0).toUpperCase() + component.slice(1),
                value,
                status
            ]);
        }
        
        // Fill remaining rows with generic data if needed
        while (tableData.length < rows) {
            const rowIndex = tableData.length;
            tableData.push([
                `Parameter ${rowIndex}`,
                this.getGenericSystemValue('generic', systemType),
                this.getRandomStatus()
            ]);
        }
        
        return tableData;
    }

    // ✅ NEW: Get generic system value that works for any system type
    getGenericSystemValue(component, systemType) {
        const componentLower = component.toLowerCase();
        
        // Pressure-related values
        if (componentLower.includes('pressure') || componentLower.includes('pump')) {
            return `${(Math.random() * 100 + 50).toFixed(0)} PSI`;
        }
        // Temperature-related values
        else if (componentLower.includes('temperature') || componentLower.includes('heat') || componentLower.includes('cool')) {
            return `${(Math.random() * 50 + 20).toFixed(1)}°C`;
        }
        // Flow-related values
        else if (componentLower.includes('flow') || componentLower.includes('rate')) {
            return `${(Math.random() * 20 + 10).toFixed(1)} L/min`;
        }
        // Speed/RPM values
        else if (componentLower.includes('speed') || componentLower.includes('motor') || componentLower.includes('rpm')) {
            return `${(Math.random() * 500 + 1000).toFixed(0)} RPM`;
        }
        // Voltage values
        else if (componentLower.includes('voltage') || componentLower.includes('volt')) {
            return `${(Math.random() * 50 + 200).toFixed(0)}V`;
        }
        // Current values
        else if (componentLower.includes('current') || componentLower.includes('amp')) {
            return `${(Math.random() * 10 + 5).toFixed(1)}A`;
        }
        // Level/concentration values
        else if (componentLower.includes('level') || componentLower.includes('concentration') || componentLower.includes('gas')) {
            return `${(Math.random() * 30 + 70).toFixed(1)}%`;
        }
        // Position values
        else if (componentLower.includes('position') || componentLower.includes('extend') || componentLower.includes('retract')) {
            return Math.random() > 0.5 ? 'EXTENDED' : 'RETRACTED';
        }
        // Status values
        else if (componentLower.includes('status') || componentLower.includes('state')) {
            return Math.random() > 0.5 ? 'ACTIVE' : 'READY';
        }
        // Time values
        else if (componentLower.includes('time') || componentLower.includes('timer')) {
            return `${(Math.random() * 120 + 30).toFixed(0)}s`;
        }
        // Generic percentage values
        else {
            return `${(Math.random() * 100).toFixed(1)}%`;
        }
    }
    
    // ✅ NEW: Draw comprehensive footer with workflow summary
    async drawComprehensiveFooter(ctx, canvasWidth, canvasHeight, screens, workflowData) {
        const footerHeight = 80;
        const footerY = canvasHeight - footerHeight;
        
        // Footer background
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, footerY, canvasWidth, footerHeight);
        
        // Workflow summary
        ctx.fillStyle = '#ECF0F1';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Workflow-Driven HMI Design', canvasWidth / 2, footerY + 25);
        
        // Additional details
        ctx.font = '12px Arial';
        ctx.fillText(
            `${screens.length} Screens | ${workflowData.screenTransitions?.length || 0} Transitions | Professional Industrial Interface`,
            canvasWidth / 2,
            footerY + 45
        );
        
        // Generation timestamp
        ctx.fillStyle = '#BDC3C7';
        ctx.font = '10px Arial';
        ctx.fillText(
            `Generated: ${new Date().toLocaleString()} | AI-Powered HMI Agent`,
            canvasWidth / 2,
            footerY + 65
        );
    }

    // ✅ NEW: Draw single screen within grid layout
    async drawSingleScreenInGrid(ctx, screenSpec, x, y, width, height) {
        const colorScheme = screenSpec.colorScheme || this.getDefaultColorScheme();
        
        // Draw screen background
        ctx.fillStyle = colorScheme.background || colorScheme.screenBackground;
        ctx.fillRect(x, y, width, height);
        
        // Draw header
        const headerHeight = 60;
        ctx.fillStyle = colorScheme.header || colorScheme.screenHeaderBg;
        ctx.fillRect(x, y, width, headerHeight);
        
        // Draw header title
        ctx.fillStyle = colorScheme.text || colorScheme.screenHeaderText;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(screenSpec.screenTitle || 'Screen', x + width / 2, y + headerHeight / 2 + 6);
        
        // Draw elements in scaled format
        if (screenSpec.elements) {
            for (const element of screenSpec.elements) {
                await this.drawGridElement(ctx, element, x, y + headerHeight, width, height - headerHeight, colorScheme);
            }
        }
        
        // Draw footer
        const footerHeight = 40;
        ctx.fillStyle = colorScheme.header || colorScheme.screenHeaderBg;
        ctx.fillRect(x, y + height - footerHeight, width, footerHeight);
        
        // Draw screen border
        ctx.strokeStyle = colorScheme.text || colorScheme.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    // ✅ FIXED: Draw detailed element in grid layout (scaled down but with full detail)
    async drawGridElement(ctx, element, screenX, screenY, screenWidth, screenHeight, colorScheme) {
        if (!element.position) return;
        
        // Scale position to grid screen
        const scaleX = screenWidth / 800;
        const scaleY = screenHeight / 600;
        
        const x = screenX + (element.position.x * scaleX);
        const y = screenY + (element.position.y * scaleY);
        const width = element.position.width * scaleX;
        const height = element.position.height * scaleY;
        
        // ✅ FIXED: Draw detailed elements instead of basic shapes
        switch (element.type) {
            case 'control_button':
                await this.drawProfessionalButton(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'status_indicator':
                await this.drawProfessionalIndicator(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'data_table':
                await this.drawProfessionalDataTable(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'data_display':
                await this.drawProfessionalDataDisplay(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'value_input':
                await this.drawProfessionalInputField(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'alarm_indicator':
                await this.drawProfessionalAlarmIndicator(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'gauge':
                await this.drawProfessionalGauge(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'progress_bar':
                await this.drawProfessionalProgressBar(ctx, element, x, y, width, height, colorScheme);
                break;
                
            case 'text':
                await this.drawProfessionalText(ctx, element, x, y, width, height, colorScheme);
                break;
                
            default:
                await this.drawProfessionalButton(ctx, element, x, y, width, height, colorScheme);
        }
    }

    // ✅ NEW: Export workflow-driven combined layout as PNG buffer
    async exportWorkflowDrivenLayoutAsPNG(screenSpecs) {
        console.log('📸 Exporting comprehensive workflow-driven layout as PNG...');
        
        // Use the enhanced combined layout with workflow information
        const canvas = await this.drawCombinedLayout(screenSpecs, 2400, 1800); // Increased height for comprehensive layout
        const buffer = canvas.toBuffer('image/png');
        
        // Save to outputs folder with descriptive filename
        const timestamp = Date.now();
        const outputPath = path.join(__dirname, '../outputs', `workflow_driven_hmi_layout_${timestamp}.png`);
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Workflow-driven comprehensive layout exported to: ${outputPath}`);
        return {
            buffer,
            path: outputPath,
            url: `/outputs/${path.basename(outputPath)}`,
            type: 'workflow-driven',
            description: 'Comprehensive HMI layout following detailed workflow specifications'
        };
    }
    
    // ✅ LEGACY: Export simple combined layout as PNG buffer (kept for compatibility)
    async exportCombinedLayoutAsPNG(screens) {
        console.log('📸 Exporting simple combined layout as PNG...');
        
        const canvas = await this.drawCombinedLayout(screens);
        const buffer = canvas.toBuffer('image/png');
        
        // Save to outputs folder
        const outputPath = path.join(__dirname, '../outputs', `combined_layout_${Date.now()}.png`);
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Combined layout exported to: ${outputPath}`);
        return {
            buffer,
            path: outputPath,
            url: `/outputs/${path.basename(outputPath)}`
        };
    }
}

module.exports = HMIAgent;