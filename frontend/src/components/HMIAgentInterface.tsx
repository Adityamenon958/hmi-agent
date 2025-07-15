// ✅ HMI Agent Interface - Multi-Step Workflow
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  AccountTree as WorkflowIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// ✅ API base URL for development vs production
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// ✅ NEW: Progress tracking interface
interface ProgressMessage {
  step: string;
  message: string;
  details?: any;
  timestamp: string;
  currentStep?: string;
}

// ✅ NEW: Progress Tracking Component
const ProgressTracker: React.FC<{
  sessionId: string | null;
  isVisible: boolean;
  onProgressUpdate?: (progress: ProgressMessage) => void;
}> = ({ sessionId, isVisible, onProgressUpdate }) => {
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId || !isVisible) {
      return;
    }

    // ✅ Connect to Server-Sent Events
    const eventSource = new EventSource(`${API_BASE_URL}/api/progress/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const progressData: ProgressMessage = JSON.parse(event.data);
        
        setMessages(prev => [...prev, progressData]);
        setCurrentMessage(progressData.message);
        
        if (onProgressUpdate) {
          onProgressUpdate(progressData);
        }
      } catch (error) {
        console.error('Error parsing progress message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [sessionId, isVisible, onProgressUpdate]);

  if (!isVisible) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f8f9fa' }}>
      <Typography variant="h6" gutterBottom>
        🔄 Real-time Progress
      </Typography>
      
      {/* ✅ Current Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {currentMessage || 'Connecting to progress stream...'}
        </Typography>
      </Box>
      
      {/* ✅ Progress Bar */}
      <LinearProgress sx={{ mb: 2 }} />
      
      {/* ✅ Message History */}
      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ 
              mb: 0.5, 
              color: msg.step === 'complete' ? 'success.main' : 'text.secondary',
              fontFamily: 'monospace'
            }}
          >
            {new Date(msg.timestamp).toLocaleTimeString()} - {msg.message}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

// ✅ Interface definitions
interface ScreenAnalysis {
  screenId: string;
  screenName: string;
  screenPurpose: string;
  screenType: string;
}

interface FDSAnalysis {
  totalScreens: number;
  screenList: ScreenAnalysis[];
  reasoning: string;
}

// ✅ UPDATED: Enhanced workflow interface with detailed analysis
interface WorkflowDiagram {
  workflowType: string;
  systemOverview?: {
    systemName: string;
    systemType: string;
    totalScreens: number;
    primaryFunction: string;
  };
  screenAnalysis?: Array<{
    screenName: string;
    screenNumber: number;
    purpose: string;
    keyElements: string[];
    behavior: string;
    functionality: string[];
    navigation: {
      from: string[];
      to: string[];
      triggers: string[];
    };
    dataVisualization: string;
    userRoles: string;
  }>;
  navigationFlow?: {
    mermaidDiagram: string;
    screenTransitions: Array<{
      from: string;
      to: string;
      trigger: string;
      description: string;
    }>;
  };
  observations?: {
    consistency: string;
    clarity: string;
    modularity: string;
    recommendations: string[];
  };
  // Legacy support
  textDiagram?: string;
  screenTransitions?: Array<{
    from: string;
    to: string;
    trigger: string;
    description: string;
  }>;
}

interface ScreenImage {
  screenId: string;
  screenName: string;
  imagePath: string;
  imageUrl?: string;
  specification: any;
  isPrimary?: boolean;
  workflowDriven?: boolean;
  screenType?: string;
  purpose?: string;
}

interface GenerationResult {
  screenAnalysis: FDSAnalysis;
  workflowDiagram: WorkflowDiagram;
  screenImages: ScreenImage[];
  summary: {
    totalScreens: number;
    generatedAt: string;
    status: string;
    layoutType?: string;
  };
}

const HMIAgentInterface: React.FC = () => {
  // ✅ State management
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // ✅ Step data (UPDATED - removed screen count step)
  const [workflowDiagram, setWorkflowDiagram] = useState<WorkflowDiagram | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // ✅ Step labels (UPDATED - removed screen count step)
  const steps = ['Upload FDS', 'Workflow', 'Generate'];

  // ✅ File dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        setError(null);
        
        // Warn about large files
        if (file.size > 5 * 1024 * 1024) { // 5MB
          setError('⚠️ Large file detected! Processing may take longer and use more AI tokens.');
        }
      }
    },
    onDropRejected: (rejectedFiles) => {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File too large! Please use files smaller than 50MB.');
      } else {
        setError('Invalid file type. Please use TXT, PDF, or DOCX files.');
      }
    },
  });

  // ✅ Step 1: Generate workflow (UPDATED - removed screen count step)
  const generateWorkflow = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('fdsDocument', file);

      const response = await axios.post(`${API_BASE_URL}/api/generate-workflow`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes
      });

      setWorkflowDiagram(response.data.data);
      setSessionId(response.data.sessionId);
      setCurrentStep(1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate workflow');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Step 2: Generate screens (UPDATED - removed screen count step)
  const generateScreens = async () => {
    if (!sessionId) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-screens`, {
        sessionId,
      });

      setGenerationResult(response.data.data);
      // ✅ FIXED: Keep at step 1 to show results with workflow
      // setCurrentStep(2); // This was causing the display to disappear
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate screens');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Reset process
  const resetProcess = () => {
    setCurrentStep(0);
    setFile(null);
    setIsProcessing(false);
    setError(null);
    setSessionId(null);
    setWorkflowDiagram(null);
    setGenerationResult(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🤖 HMI Agent - FDS to Screen Generator
      </Typography>

      {/* ✅ Step indicator */}
      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ✅ Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ✅ NEW: Progress Tracker */}
      <ProgressTracker 
        sessionId={sessionId} 
        isVisible={isProcessing}
        onProgressUpdate={(progress) => {
          console.log('Progress update:', progress);
        }}
      />

      {/* ✅ Step 0: Upload FDS */}
      {currentStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📄 Upload FDS Document
            </Typography>
          <Box
            {...getRootProps()}
            sx={{
                border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
                backgroundColor: isDragActive ? '#f0f0f0' : 'transparent',
            }}
          >
            <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
              <Typography>
                {isDragActive ? 'Drop here...' : 'Drag & drop FDS document or click to select'}
              </Typography>
            </Box>
            
            {file && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected: {file.name}
              </Alert>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={generateWorkflow}
                disabled={!file || isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {isProcessing ? 'Analyzing...' : 'Analyze FDS'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ✅ Step 1: Workflow Generated */}
      {currentStep === 1 && workflowDiagram && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔄 Workflow Generated Successfully
          </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Workflow generated for {workflowDiagram.systemOverview?.totalScreens} screens
        </Alert>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={generateScreens}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <ImageIcon />}
              >
                {isProcessing ? 'Generating...' : 'Generate Screens'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ✅ Step 1: Enhanced Results with Detailed Analysis */}
      {currentStep === 1 && workflowDiagram && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 {workflowDiagram.workflowType || 'Professional HMI System Analysis'}
            </Typography>
            
            {/* System Overview */}
            {workflowDiagram.systemOverview && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    🏭 System Overview
                    </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">System Name:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>{workflowDiagram.systemOverview.systemName}</Typography>
                      <Typography variant="subtitle2">System Type:</Typography>
                      <Typography variant="body2">{workflowDiagram.systemOverview.systemType}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Total Screens:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>{workflowDiagram.systemOverview.totalScreens}</Typography>
                      <Typography variant="subtitle2">Primary Function:</Typography>
                      <Typography variant="body2">{workflowDiagram.systemOverview.primaryFunction}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Detailed Screen Analysis */}
            {workflowDiagram.screenAnalysis && workflowDiagram.screenAnalysis.length > 0 && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                    🔍 Detailed Screen Analysis
                    </Typography>
                  {workflowDiagram.screenAnalysis.map((screen, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" color="secondary">
                          {screen.screenNumber}. {screen.screenName}
                    </Typography>

                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Purpose:</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>{screen.purpose}</Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Key Elements:</Typography>
                            <List dense>
                              {screen.keyElements.map((element, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                  <ListItemText primary={`• ${element}`} sx={{ m: 0 }} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Functionality:</Typography>
                            <List dense>
                              {screen.functionality.map((func, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                  <ListItemText primary={`• ${func}`} sx={{ m: 0 }} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                    </Box>

                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Behavior:</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>{screen.behavior}</Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2">Data Visualization:</Typography>
                            <Typography variant="body2">{screen.dataVisualization}</Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2">User Roles:</Typography>
                            <Typography variant="body2">{screen.userRoles}</Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2">Navigation Triggers:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {/* ✅ DEFENSIVE FIX: Use optional chaining to prevent crash */}
                              {screen.navigation?.triggers?.map((trigger, i) => (
                                <Chip key={i} label={trigger} size="small" />
                              ))}
                            </Box>
                          </Box>
                    </Box>
                  </CardContent>
                </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Navigation Flow */}
            {(workflowDiagram.navigationFlow || workflowDiagram.textDiagram) && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                    🔄 Navigation Flow
                    </Typography>
                  <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {workflowDiagram.navigationFlow?.mermaidDiagram || workflowDiagram.textDiagram}
                    </Typography>
                  </Paper>

                  {/* Screen Transitions */}
                  <Typography variant="subtitle1" gutterBottom>
                    Screen Transitions:
                    </Typography>
                  <List dense>
                    {(workflowDiagram.navigationFlow?.screenTransitions || workflowDiagram.screenTransitions)?.map((transition, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={`${transition.from} → ${transition.to}`}
                          secondary={`${transition.trigger}: ${transition.description}`}
                        />
                      </ListItem>
                    )) || []}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Professional Observations */}
            {workflowDiagram.observations && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    💡 Professional Observations & Recommendations
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Consistency:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{workflowDiagram.observations.consistency}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Clarity:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{workflowDiagram.observations.clarity}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Modularity:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{workflowDiagram.observations.modularity}</Typography>
              </Box>
            </Box>

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Recommendations:</Typography>
                  <List dense>
                    {workflowDiagram.observations.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${rec}`} />
                      </ListItem>
                    ))}
                  </List>
                                 </CardContent>
               </Card>
             )}

            {/* Generation Results - Combined Layout Only */}
            {generationResult && (
              <>
                <Divider sx={{ my: 3 }} />
                <Alert severity="success" sx={{ mb: 3 }}>
                  Successfully generated comprehensive HMI layout with {generationResult.summary.totalScreens} screens following the detailed workflow specifications!
                </Alert>
                
                {/* Find Workflow-Driven Layout or Combined Layout */}
                {(() => {
                  const combinedLayout = generationResult.screenImages?.find(
                    img => img.screenName === 'Workflow-Driven HMI Layout' ||
                           img.screenName === 'Combined Layout (Figma-style)' || 
                           img.screenName === 'Comprehensive HMI Layout (Legacy)' ||
                           img.isPrimary === true
                  );
                  
                  if (combinedLayout) {
                    return (
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" gutterBottom color="primary">
                            🎨 {combinedLayout.screenName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {combinedLayout.workflowDriven 
                              ? 'Comprehensive workflow-driven HMI design with navigation flow arrows, system context, and professional styling'
                              : 'Complete HMI system layout following workflow specifications'
                            }
                          </Typography>
                          <Typography variant="body2" color="primary" sx={{ mb: 3 }}>
                            📊 {generationResult.summary.totalScreens} Screens | 🔄 Following Detailed Workflow Analysis | 🏭 Industrial Standards
                    </Typography>
                          
                          <Box sx={{ 
                            backgroundColor: '#f0f0f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            my: 2,
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            overflow: 'hidden',
                            minHeight: 400
                          }}>
                            {combinedLayout.imageUrl ? (
                              <img 
                                src={`${API_BASE_URL}${combinedLayout.imageUrl}`}
                                alt={combinedLayout.screenName}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  console.error('Error loading image:', e);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                Generating comprehensive layout...
                    </Typography>
                            )}
          </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={async () => {
                if (combinedLayout.imageUrl) {
                  try {
                    const response = await fetch(`${API_BASE_URL}${combinedLayout.imageUrl}`);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${combinedLayout.screenName}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Download failed:', error);
                    // Fallback to original method
                    const link = document.createElement('a');
                    link.href = `${API_BASE_URL}${combinedLayout.imageUrl}`;
                    link.download = `${combinedLayout.screenName}.png`;
                    link.target = '_self';
                    link.click();
                  }
                }
              }}
              disabled={!combinedLayout.imageUrl}
              sx={{ mt: 2 }}
            >
              Download Complete HMI Layout
            </Button>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return (
                    <Typography variant="body2" color="textSecondary">
                      No combined layout available
                    </Typography>
                  );
                })()}
              </>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="outlined" onClick={resetProcess} sx={{ mr: 2 }}>
                Start Over
            </Button>
              {!generationResult && (
            <Button
              variant="contained"
                  onClick={generateScreens}
                  disabled={isProcessing}
                  startIcon={isProcessing ? <CircularProgress size={20} /> : <ImageIcon />}
                >
                  {isProcessing ? 'Generating...' : 'Generate Screens'}
            </Button>
              )}
          </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HMIAgentInterface; 