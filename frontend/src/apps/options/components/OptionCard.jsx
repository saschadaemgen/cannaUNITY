import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  useTheme,
  Switch
} from '@mui/material'

export default function OptionCard({ title, value, description, onToggle, toggleValue }) {
  const theme = useTheme()

  return (
    <Card
      sx={{
        minWidth: 220,
        borderRadius: 2,
        transition: 'box-shadow 0.2s ease',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(255, 255, 255, 0.05)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.1)'
        }`,
        backgroundColor:
          theme.palette.mode === 'dark' ? '#1e1e1e' : theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>

        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
        >
          {value}
        </Typography>

        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>

        {typeof toggleValue !== 'undefined' && onToggle && (
          <Switch
            checked={toggleValue}
            onChange={(e) => onToggle(e.target.checked)}
            color="success"
            sx={{ mt: 2 }}
          />
        )}
      </CardContent>
    </Card>
  )
}
