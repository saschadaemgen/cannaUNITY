// frontend/src/apps/wawi/pages/Strain/components/shared/StyledComponents.jsx
import { styled } from '@mui/material/styles';
import { Box, Slider, Rating } from '@mui/material';

export const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#4caf50',
  },
});

export const StyledSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-markLabel': {
    top: '26px',
    fontSize: '0.75rem',
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.secondary,
    transform: 'none',
    whiteSpace: 'nowrap',
    '&[data-index="0"]': {
      transform: 'translateX(0%)',
    },
    '&[data-index="1"]': {
      transform: 'translateX(-50%)',
    },
    '&[data-index="2"]': {
      transform: 'translateX(-100%)',
    }
  },
  '& .MuiSlider-track': {
    height: 6
  },
  '& .MuiSlider-rail': {
    height: 6
  },
  '& .MuiSlider-mark': {
    height: 6,
    width: 2
  }
}));

export const DropZone = styled(Box)(({ theme, isDragActive }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));