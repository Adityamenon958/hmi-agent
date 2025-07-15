import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';

const HMIAgentInterface: React.FC = () => {
  const [result, setResult] = useState<any>(null);

  const resetForm = () => {
    // Implementation of resetForm
  };

  // Safely access data
  const designData = result && result.data ? result.data : null;

  // Defensive: If no design data, show a message and do not render anything else
  if (!designData) {
    return (
      <Box textAlign="center" mt={4}>
        <div>No design data loaded yet.</div>
        <Button
          variant="contained"
          size="large"
          onClick={resetForm}
          startIcon={<UploadIcon />}
          sx={{ mr: 2 }}
        >
          Process Another FDS
        </Button>
      </Box>
    );
  }

  return (
    <Box textAlign="center" mt={4}>
      {/* Safely render the screen title if it exists */}
      {designData.screenTitle && (
        <h2 style={{ color: '#333', marginBottom: 24 }}>{designData.screenTitle}</h2>
      )}
      <Button
        variant="contained"
        size="large"
        onClick={resetForm}
        startIcon={<UploadIcon />}
        sx={{ mr: 2 }}
      >
        Process Another FDS
      </Button>
      <Button
        variant="outlined"
        size="large"
        disabled={!designData?.figmaResult?.figmaFileUrl}
        onClick={() => {
          if (designData?.figmaResult?.figmaFileUrl) {
            window.open(designData.figmaResult.figmaFileUrl, '_blank');
          }
        }}
      >
        Open in Figma
      </Button>
    </Box>
  );
};

export default HMIAgentInterface; 