import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slide
} from '@mui/material'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />
})

export default function MojoDialog({ open, onClose, title, message }) {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-describedby="mojo-dialog-description"
      PaperProps={{
        sx: {
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: 3,
          boxShadow: 10,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography id="mojo-dialog-description" sx={{ mt: 1 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Box flex={1} />
        <Button onClick={onClose} variant="contained" color="primary">
          Verstanden
        </Button>
      </DialogActions>
    </Dialog>
  )
}
