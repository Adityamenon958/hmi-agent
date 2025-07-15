// ✅ HMI Design Prompts Collection
// ❗ These prompts are specifically designed for HMI screen generation

export const HMI_PROMPTS = {
    // ✅ FDS Analysis Prompts
    fdsAnalysis: {
        basic: `Analyze the following FDS document and extract HMI requirements:
        
Document: {content}

Extract:
1. Screen purpose and functionality
2. Required UI elements (buttons, inputs, displays)
3. Data fields and their types
4. User interactions and workflows
5. Layout preferences
6. Color scheme requirements

Format the output as structured JSON.`,

        detailed: `You are an expert HMI analyst. Analyze this FDS document thoroughly:

{content}

Create a comprehensive analysis including:
- Screen hierarchy and navigation
- Data visualization requirements
- User interaction patterns
- Accessibility considerations
- Performance requirements
- Error handling scenarios

Provide detailed JSON output with all specifications.`
    },

    // ✅ Design Generation Prompts
    designGeneration: {
        modern: `Create a modern, clean HMI design based on these requirements:

Requirements: {requirements}

Design principles:
- Clean, minimalist interface
- High contrast for readability
- Intuitive navigation
- Consistent spacing and alignment
- Modern color palette
- Responsive layout

Generate a detailed Figma design specification.`,

        industrial: `Design an industrial HMI screen with these specifications:

Requirements: {requirements}

Industrial design principles:
- High visibility in various lighting conditions
- Touch-friendly interface elements
- Clear status indicators
- Emergency controls prominently placed
- Rugged, professional appearance
- Easy maintenance and updates

Layout rules:
- Always include a header section with screen title, system status, date/time
- Always include a footer section with navigation buttons and screen metadata
- Place primary interactive elements in the main area
- Use a consistent layout structure with clear hierarchy

Create a comprehensive JSON screen specification including:
- layout.header (with elements)
- layout.footer (with elements)
- main elements
- positions and sizes of all items
- color scheme and styling options`
    },

    // ✅ Layout Prompts
    layout: {
        grid: `Design a grid-based layout for this HMI screen:

Elements: {elements}

Grid specifications:
- Responsive grid system
- Consistent spacing
- Logical grouping of elements
- Clear visual hierarchy
- Easy scanning and navigation

Provide detailed layout specifications.`,

        flexible: `Create a flexible, adaptive layout for this HMI interface:

Requirements: {requirements}

Flexibility features:
- Adaptive to different screen sizes
- Dynamic content areas
- Collapsible sections
- Responsive element sizing
- Smart content organization

Generate flexible layout specifications.`
    },

    // ✅ Color Scheme Prompts
    colorScheme: {
        professional: `Design a professional color scheme for this HMI screen:

Context: {context}

Professional color principles:
- High contrast for readability
- Consistent brand colors
- Accessible color combinations
- Clear status indicators
- Professional appearance

Provide color specifications with hex codes.`,

        safety: `Create a safety-focused color scheme for this industrial HMI:

Safety requirements: {requirements}

Safety color principles:
- Red for stop/emergency
- Green for go/safe
- Yellow for warning/caution
- Blue for information
- High visibility in all conditions

Generate safety-compliant color specifications.`
    },

    // ✅ Interaction Design Prompts
    interactions: {
        basic: `Design user interactions for this HMI screen:

Elements: {elements}

Interaction principles:
- Clear feedback for all actions
- Intuitive navigation patterns
- Consistent interaction models
- Error prevention and recovery
- Accessibility compliance

Provide detailed interaction specifications.`,

        advanced: `Create advanced interaction patterns for this HMI interface:

Requirements: {requirements}

Advanced features:
- Multi-touch gestures
- Voice commands
- Predictive interactions
- Context-aware responses
- Personalized experiences

Generate advanced interaction specifications.`
    },

    // ✅ Validation Prompts
    validation: {
        design: `Validate this HMI design against best practices:

Design: {design}

Validation criteria:
- Usability standards
- Accessibility compliance
- Performance requirements
- Safety standards
- Industry guidelines

Provide validation report with recommendations.`,

        accessibility: `Check accessibility compliance for this HMI design:

Design: {design}

Accessibility standards:
- WCAG 2.1 compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- Touch target sizes

Generate accessibility audit report.`
    }
};

// ✅ Prompt Templates for Different Use Cases
export const PROMPT_TEMPLATES = {
    // ✅ For simple HMI screens
    simple: {
        fds: HMI_PROMPTS.fdsAnalysis.basic,
        design: HMI_PROMPTS.designGeneration.modern,
        layout: HMI_PROMPTS.layout.grid,
        colors: HMI_PROMPTS.colorScheme.professional,
        interactions: HMI_PROMPTS.interactions.basic
    },

    // ✅ For complex industrial HMI screens
    industrial: {
        fds: HMI_PROMPTS.fdsAnalysis.detailed,
        design: HMI_PROMPTS.designGeneration.industrial,
        layout: HMI_PROMPTS.layout.flexible,
        colors: HMI_PROMPTS.colorScheme.safety,
        interactions: HMI_PROMPTS.interactions.advanced
    },

    // ✅ For accessibility-focused designs
    accessible: {
        fds: HMI_PROMPTS.fdsAnalysis.detailed,
        design: HMI_PROMPTS.designGeneration.modern,
        layout: HMI_PROMPTS.layout.grid,
        colors: HMI_PROMPTS.colorScheme.professional,
        interactions: HMI_PROMPTS.interactions.basic,
        validation: HMI_PROMPTS.validation.accessibility
    }
};

// ✅ Helper function to get appropriate prompts
export function getPromptsForUseCase(useCase = 'simple') {
    return PROMPT_TEMPLATES[useCase] || PROMPT_TEMPLATES.simple;
}

// ✅ Helper function to get specific prompt
export function getPrompt(category, type) {
    return HMI_PROMPTS[category]?.[type] || HMI_PROMPTS.fdsAnalysis.basic;
} 