import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import TestCareerMemories from '../../components/test/TestCareerMemories';

const CareerMemoriesTestPage = () => {
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Career Memories Test Page
        </Typography>
        <Typography variant="body1" paragraph>
          This page displays your career-related journal entries with AI-generated insights.
        </Typography>
        
        <Box mt={4}>
          <TestCareerMemories />
        </Box>
      </Box>
    </Container>
  );
};

export default CareerMemoriesTestPage;
