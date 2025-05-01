// src/options/components/design-options/VisibilityTab.jsx
import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  List,
  ListItem
} from '@mui/material';

import { menuVisibilityOptions } from './DesignOptionsConfig';

const VisibilityTab = ({ design, handleMenuVisibilityChange }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Hier kannst du einzelne Menüpunkte in der Topbar ein- oder ausblenden
      </Typography>
      
      <List disablePadding>
        {menuVisibilityOptions.map((menuOption) => (
          <ListItem key={menuOption.id} disableGutters>
            <FormControlLabel
              control={
                <Switch
                  checked={design.menuVisibility?.[menuOption.id] !== false}
                  onChange={(e) => handleMenuVisibilityChange(menuOption.id, e.target.checked)}
                />
              }
              label={menuOption.label}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default VisibilityTab;