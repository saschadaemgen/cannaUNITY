// frontend/src/apps/wawi/pages/Strain/components/StrainTable.jsx
import { useState } from 'react'
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Tooltip, 
  Grid, 
  Chip, 
  Rating, 
  Dialog, 
  DialogContent 
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScienceIcon from '@mui/icons-material/Science'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import CloseIcon from '@mui/icons-material/Close'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

import TableHeader from '@/components/common/TableHeader'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'

/**
 * StrainTable Komponente für die Darstellung der Strain-Tabelle
 */
const StrainTable = ({
  tabValue,
  data,
  expandedStrainId,
  onExpandStrain,
  onOpenDestroyDialog,
  onOpenEditForm,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount
}) => {
  // Neue State-Variablen für die Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1) // Zoom-Level für die Bildansicht

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    const baseColumns = [
      { label: 'Sortenname', width: '16%', align: 'left', padding: '0 8px 0 28px' },
      { label: 'Hersteller', width: '14%', align: 'left', padding: '0 10px' },
      { label: 'Typ', width: '10%', align: 'left', padding: '0 10px' },
      { label: 'THC/CBD (%)', width: '12%', align: 'center', padding: '0 10px' },
      { label: 'Indica/Sativa (%)', width: '13%', align: 'center', padding: '0 10px' },
      { label: 'Blütezeit (Tage)', width: '13%', align: 'center', padding: '0 10px' },
      { label: 'Bewertung', width: '10%', align: 'center', padding: '0 10px' },
      { label: 'Aktionen', width: '12%', align: 'center', padding: '0 8px' }
    ]
    
    return baseColumns
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (item) => {
    // Konvertiere Typen zu lesbaren Namen
    const strainTypeMap = {
      'feminized': 'Feminisiert',
      'regular': 'Regulär',
      'autoflower': 'Autoflower',
      'f1_hybrid': 'F1 Hybrid',
      'cbd': 'CBD'
    }
    
    const baseColumns = [
      {
        content: item.name,
        width: '16%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'success.main',
        padding: '0 8px 0 28px'
      },
      {
        content: item.breeder,
        width: '14%',
        padding: '0 10px'
      },
      {
        content: (
          <Chip 
            label={strainTypeMap[item.strain_type] || item.strain_type} 
            size="small" 
            color={
              item.strain_type === 'feminized' ? 'success' :
              item.strain_type === 'autoflower' ? 'primary' :
              item.strain_type === 'cbd' ? 'info' :
              'default'
            }
            variant="outlined"
          />
        ),
        width: '10%',
        padding: '0 10px'
      },
      {
        content: `${item.thc_percentage_max}/${item.cbd_percentage_max}`,
        width: '12%',
        align: 'center',
        padding: '0 10px'
      },
      {
        content: `${item.indica_percentage}/${item.sativa_percentage}`,
        width: '13%',
        align: 'center',
        padding: '0 10px'
      },
      {
        content: `${item.flowering_time_min}-${item.flowering_time_max}`,
        width: '13%',
        align: 'center',
        padding: '0 10px'
      },
      {
        content: (
          <Rating 
            value={item.rating} 
            readOnly 
            precision={0.5} 
            size="small"
          />
        ),
        width: '10%',
        align: 'center',
        padding: '0 10px'
      },
      {
        // Die Aktionsspalte
        content: renderActions(item),
        width: '12%',
        align: 'center',
        padding: '0 8px'
      }
    ]
    
    return baseColumns
  }

  // Neue Funktionen für die Lightbox
  const handleOpenLightbox = (image, index, event) => {
    if (event) event.stopPropagation()
    setSelectedImage(image)
    setSelectedImageIndex(index)
    setZoomLevel(1) // Startet mit Originalzoom
    setLightboxOpen(true)
  }

  const handleCloseLightbox = () => {
    setLightboxOpen(false)
    setSelectedImage(null)
    setSelectedImageIndex(0)
    setZoomLevel(1)
  }
  
  const handlePrevImage = (images, event) => {
    if (event) event.stopPropagation()
    setZoomLevel(1) // Zurück zum Originalzoom
    // Nur Fade-Effekt ohne Slide
    const imageContainer = document.getElementById('lightbox-image-container')
    if (imageContainer) {
      imageContainer.style.opacity = 0
      
      setTimeout(() => {
        const newIndex = (selectedImageIndex - 1 + images.length) % images.length
        setSelectedImage(images[newIndex])
        setSelectedImageIndex(newIndex)
        
        setTimeout(() => {
          imageContainer.style.opacity = 1
        }, 50)
      }, 200)
    } else {
      const newIndex = (selectedImageIndex - 1 + images.length) % images.length
      setSelectedImage(images[newIndex])
      setSelectedImageIndex(newIndex)
    }
  }
  
  const handleNextImage = (images, event) => {
    if (event) event.stopPropagation()
    setZoomLevel(1) // Zurück zum Originalzoom
    // Nur Fade-Effekt ohne Slide
    const imageContainer = document.getElementById('lightbox-image-container')
    if (imageContainer) {
      imageContainer.style.opacity = 0
      
      setTimeout(() => {
        const newIndex = (selectedImageIndex + 1) % images.length
        setSelectedImage(images[newIndex])
        setSelectedImageIndex(newIndex)
        
        setTimeout(() => {
          imageContainer.style.opacity = 1
        }, 50)
      }, 200)
    } else {
      const newIndex = (selectedImageIndex + 1) % images.length
      setSelectedImage(images[newIndex])
      setSelectedImageIndex(newIndex)
    }
  }
  
  // Vereinfachte Zoom-Funktionen
  const handleZoomIn = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(prev => Math.min(prev + 0.25, 3)) // Zoom bis maximal 300%
  }
  
  const handleZoomOut = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25)) // Zoom bis minimal 25%
  }
  
  const handleResetZoom = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(1) // Zurück zur Originalgröße
  }

  // Funktion zum Rendern der Aktionen-Spalte
  const renderActions = (item) => {
    // Stopt das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    const stopPropagation = (e) => {
      if (e) e.stopPropagation()
    }

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%', 
          padding: '12px 16px',
        }}
        onClick={stopPropagation}
      >
        {/* Aufklapp-Icon wird in allen Tabs angezeigt */}
        <IconButton 
          size="small" 
          onClick={() => onExpandStrain(item.id)}
          sx={{ mr: 0.5 }}
        >
          <ExpandMoreIcon 
            sx={{ 
              transform: expandedStrainId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out',
              fontSize: '1.2rem'
            }} 
          />
        </IconButton>

        <>
          <Tooltip title="Bearbeiten">
            <IconButton 
              size="small" 
              onClick={(e) => {
                stopPropagation(e)
                onOpenEditForm(item, e)
              }}
              sx={{ mx: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Deaktivieren-Button nur für aktive Sorten zeigen */}
          {item.is_active && (
            <Tooltip title="Deaktivieren">
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => {
                  stopPropagation(e)
                  onOpenDestroyDialog(item, e)
                }}
                sx={{ mx: 0.5 }}
              >
                <LocalFireDepartmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      </Box>
    )
  }

  // Detailansicht für einen Strain rendern
  const renderStrainDetails = (item) => {
    const basicDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Hersteller:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.breeder}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Typ:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.strain_type_display}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.genetic_origin || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Indica/Sativa:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.indica_percentage}% / {item.sativa_percentage}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Status:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: item.is_active ? 'success.main' : 'error.main',
              fontWeight: 'bold'
            }}
          >
            {item.is_active ? 'Aktiv' : 'Inaktiv'}
          </Typography>
        </Box>
      </Box>
    )

    const growthInfo = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Blütezeit:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.flowering_time_min} - {item.flowering_time_max} Tage
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Höhe (Indoor):
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.height_indoor_min} - {item.height_indoor_max} cm
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Ertrag (Indoor):
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.yield_indoor_min} - {item.yield_indoor_max} g/m²
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Schwierigkeitsgrad:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.difficulty_display}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Resistenz (Mold/Pest/Kälte):
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.resistance_mold}/{item.resistance_pests}/{item.resistance_cold}
          </Typography>
        </Box>
      </Box>
    )

    const cannabisContent = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            THC-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.thc_percentage_min} - {item.thc_percentage_max}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            CBD-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.cbd_percentage_min} - {item.cbd_percentage_max}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Dominante Terpene:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.dominant_terpenes || "Keine angegeben"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Geschmacksrichtungen:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.flavors || "Keine angegeben"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Effekte:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.effects || "Keine angegeben"}
          </Typography>
        </Box>
      </Box>
    );

    const cards = [
      {
        title: 'Basis-Informationen',
        content: basicDetails
      },
      {
        title: 'Wachstumsinformationen',
        content: growthInfo
      },
      {
        title: 'Cannabinoide & Terpene',
        content: cannabisContent
      }
    ];

    return (
      <>
        <DetailCards cards={cards} color="success.main" />
        
        {/* Beschreibungen zeigen, wenn vorhanden */}
        {(item.general_information || item.growing_information) && (
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: '4px', 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              backgroundColor: 'white'
            }}
          >
            <Grid container spacing={2}>
              {item.general_information && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Allgemeine Informationen
                  </Typography>
                  <Typography variant="body2">
                    {item.general_information}
                  </Typography>
                </Grid>
              )}
              
              {item.growing_information && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Anbauspezifische Informationen
                  </Typography>
                  <Typography variant="body2">
                    {item.growing_information}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        {/* Bilder zeigen, wenn vorhanden - MIT LIGHTBOX-FUNKTIONALITÄT */}
        {item.images && item.images.length > 0 && (
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: '4px', 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              backgroundColor: 'white'
            }}
          >
            <Typography variant="subtitle2" color="success.main" gutterBottom>
              Bilder
            </Typography>
            <Grid container spacing={2}>
              {item.images.map((image) => (
                <Grid item xs={6} sm={4} md={3} key={image.id}>
                  <Box
                    sx={{
                      position: 'relative',
                      '&:hover .image-overlay': {
                        opacity: 1
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src={image.image}
                      alt={image.caption || item.name}
                      sx={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: image.is_primary ? '2px solid #4caf50' : '1px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => handleOpenLightbox(image, item.images.indexOf(image), e)}
                    />
                    <Box 
                      className="image-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '4px',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <IconButton 
                        onClick={(e) => handleOpenLightbox(image, item.images.indexOf(image), e)}
                        sx={{ color: 'white' }}
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Box>
                    {image.caption && (
                      <Typography variant="caption" display="block" align="center">
                        {image.caption}
                      </Typography>
                    )}
                    {image.is_primary && (
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'success.main',
                          color: 'white',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          py: 0.3,
                          px: 0.8,
                          borderRadius: 1,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                      >
                        Hauptbild
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* Aktionsbereich */}
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            borderRadius: '4px', 
            border: '1px solid rgba(0, 0, 0, 0.12)', 
            backgroundColor: 'white'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Verfügbare Aktionen
              </Typography>
            </Grid>
            <Grid item xs={12} sm={8} container spacing={1} justifyContent="flex-end">
              <Grid item>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => onOpenEditForm(item)}
                  startIcon={<EditIcon />}
                  sx={{ mr: 1 }}
                >
                  Bearbeiten
                </Button>
              </Grid>
              
              {item.is_active && (
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={() => onOpenDestroyDialog(item)}
                    startIcon={<LocalFireDepartmentIcon />}
                  >
                    Deaktivieren
                  </Button>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Box>
      </>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableHeader columns={getHeaderColumns()} />

      {data && data.length > 0 ? (
        data.map((item) => (
          <Box
            key={item.id}
            sx={{ 
              mb: 1.2, 
              overflow: 'hidden', 
              borderRadius: '4px',
              border: expandedStrainId === item.id ? '1px solid rgba(76, 175, 80, 0.5)' : 'none'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: expandedStrainId === item.id ? 'rgba(0, 0, 0, 0.04)' : 'white',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                borderLeft: '4px solid',
                borderColor: item.is_active ? 'success.main' : 'error.main',
                cursor: 'pointer',
                height: '48px',
                width: '100%',
              }}
              onClick={() => onExpandStrain(item.id)}
            >
              {/* Spalten-Inhalte direkt aus getRowColumns() */}
              {getRowColumns(item).map((column, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: column.align === 'center'
                      ? 'center'
                      : column.align === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                    width: column.width || 'auto',
                    padding: column.padding || '0 16px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    textAlign: column.align || 'left',
                    height: '100%'
                  }}
                >
                  {column.icon && (
                    <column.icon sx={{ color: column.iconColor || 'inherit', fontSize: '0.9rem', mr: 0.8 }} />
                  )}
                  {typeof column.content === 'string' || typeof column.content === 'number' ? (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: column.bold ? 'bold' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.8rem',
                        color: column.color || 'inherit',
                        lineHeight: 1.4,
                        fontFamily: column.fontFamily
                      }}
                    >
                      {column.content}
                    </Typography>
                  ) : (
                    column.content
                  )}
                </Box>
              ))}
            </Box>

            {/* Ausgeklappter Inhalt mit Animation */}
            {expandedStrainId === item.id && (
              <Box 
                sx={{ 
                  width: '100%',
                  padding: '14px 20px 20px 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                }}
              >
                {renderStrainDetails(item)}
              </Box>
            )}
          </Box>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          Keine Sorten vorhanden
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage=""
        color="primary"
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />

      {/* Lightbox-Dialog für Bildvergrößerung */}
      <Dialog 
        open={lightboxOpen} 
        onClose={handleCloseLightbox}
        maxWidth="xl"
        fullScreen
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(0, 0, 0, 0.95)', // Dunklerer Hintergrund ohne Blur
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8)',
            borderRadius: 0, // Kein Rand für Vollbildmodus
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
          <IconButton
            onClick={handleCloseLightbox}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              },
              zIndex: 10
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedImage && data && data.find(item => item.images?.some(img => img.id === selectedImage.id)) && (
            <>
              {/* Navigations-Buttons */}
              <IconButton
                onClick={(e) => handlePrevImage(data.find(item => item.images?.some(img => img.id === selectedImage.id)).images, e)}
                sx={{
                  position: 'absolute',
                  left: { xs: 8, sm: 16, md: 24 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  },
                  zIndex: 10,
                  p: { xs: 1, sm: 1.5 }
                }}
              >
                <NavigateBeforeIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              </IconButton>

              <IconButton
                onClick={(e) => handleNextImage(data.find(item => item.images?.some(img => img.id === selectedImage.id)).images, e)}
                sx={{
                  position: 'absolute',
                  right: { xs: 8, sm: 16, md: 24 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  },
                  zIndex: 10,
                  p: { xs: 1, sm: 1.5 }
                }}
              >
                <NavigateNextIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              </IconButton>

              <Box
                sx={{
                  width: '100%',
                  height: 'calc(100vh - 60px)', // Volle Höhe minus 60px (30px oben + 30px unten)
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: '30px', // 30px Abstand oben
                  mb: '30px', // 30px Abstand unten
                  position: 'relative'
                }}
              >
                {/* Containerbox für das Bild mit fester Höhe */}
                <Box
                  id="lightbox-image-container"
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden', // Verhindert Überläufe
                    opacity: 1,
                    transform: 'translateX(0)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                  }}
                >
                  {/* Bild mit maximaler Höhe */}
                  <Box
                    component="img"
                    src={selectedImage.image}
                    alt={selectedImage.caption || "Bild"}
                    sx={{
                      height: zoomLevel === 1 ? '100%' : 'auto', // Bei Zoom 1 volle Höhe, sonst auto
                      width: 'auto', // Automatische Anpassung der Breite
                      maxWidth: zoomLevel === 1 ? '100%' : 'none', // Entfernt Breitenbegrenzung bei Zoom
                      maxHeight: zoomLevel === 1 ? '100%' : 'none', // Entfernt Höhenbegrenzung bei Zoom
                      objectFit: 'contain', // Behält das Seitenverhältnis bei
                      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                      borderRadius: 1,
                      transform: `scale(${zoomLevel})`,
                      transition: 'transform 0.3s ease',
                      cursor: zoomLevel > 1 ? 'move' : 'default'
                    }}
                  />
                  
                  {/* Counter-Overlay in der oberen linken Ecke */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: { xs: 16, sm: 20 },
                      left: { xs: 16, sm: 20 },
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 'bold',
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      zIndex: 5,
                    }}
                  >
                    {selectedImageIndex + 1} / {data.find(item => item.images?.some(img => img.id === selectedImage.id)).images.length}
                  </Box>
                  
                  {/* Zoom-Control-Leiste */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: { xs: 16, sm: 20 },
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: 4,
                      padding: '4px',
                      zIndex: 10,
                    }}
                  >
                    <IconButton
                      onClick={handleZoomOut}
                      size="small"
                      sx={{ color: 'white', p: 0.8 }}
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOutIcon fontSize="small" />
                    </IconButton>
                    
                    <Box 
                      sx={{ 
                        color: 'white', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        mx: 0.5,
                        minWidth: '40px',
                        textAlign: 'center'
                      }}
                    >
                      {Math.round(zoomLevel * 100)}%
                    </Box>
                    
                    <IconButton
                      onClick={handleZoomIn}
                      size="small"
                      sx={{ color: 'white', p: 0.8 }}
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      onClick={handleResetZoom}
                      size="small"
                      sx={{ 
                        color: 'white', 
                        p: 0.8,
                        ml: 0.5,
                        display: zoomLevel !== 1 ? 'flex' : 'none' // Nur anzeigen, wenn nicht bei 100%
                      }}
                    >
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {/* Caption-Overlay in der unteren rechten Ecke wenn vorhanden */}
                  {(selectedImage.caption || data.find(item => item.images?.some(img => img.id === selectedImage.id))?.name) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: { xs: 16, sm: 20 },
                        right: { xs: 16, sm: 20 },
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        maxWidth: { xs: '80%', sm: '60%' },
                        textAlign: 'right',
                        zIndex: 5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'medium' }}
                      >
                        {selectedImage.caption || data.find(item => item.images?.some(img => img.id === selectedImage.id))?.name}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Hauptbild-Badge */}
                  {selectedImage.is_primary && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: { xs: 16, sm: 20 },
                        right: { xs: 16, sm: 20 },
                        backgroundColor: '#4caf50',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        zIndex: 5,
                      }}
                    >
                      Hauptbild
                    </Box>
                  )}
                </Box>
                
                {/* Navigations-Buttons */}
                <IconButton
                  onClick={(e) => handlePrevImage(data.find(item => item.images?.some(img => img.id === selectedImage.id)).images, e)}
                  sx={{
                    position: 'absolute',
                    left: { xs: 8, sm: 16, md: 24 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    },
                    zIndex: 10,
                    p: { xs: 1, sm: 1.5 }
                  }}
                >
                  <NavigateBeforeIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                </IconButton>

                <IconButton
                  onClick={(e) => handleNextImage(data.find(item => item.images?.some(img => img.id === selectedImage.id)).images, e)}
                  sx={{
                    position: 'absolute',
                    right: { xs: 8, sm: 16, md: 24 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    },
                    zIndex: 10,
                    p: { xs: 1, sm: 1.5 }
                  }}
                >
                  <NavigateNextIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                </IconButton>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default StrainTable