import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import journalService from '../../services/journalService';

const TestCareerMemories = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await journalService.getEntries();
        setEntries(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch journal entries');
        setLoading(false);
        console.error(err);
      }
    };

    fetchEntries();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body1">
        {error}
      </Typography>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Career Journal Entries
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List>
          {entries.map((entry, index) => (
            <React.Fragment key={entry.id || index}>
              <ListItem>
                <ListItemText
                  primary={entry.title || 'Untitled Entry'}
                  secondary={entry.date || 'No date provided'}
                />
                {entry.tags?.map((tag, i) => (
                  <Chip key={i} label={tag} size="small" sx={{ ml: 1 }} />
                ))}
              </ListItem>
              {index < entries.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TestCareerMemories;
