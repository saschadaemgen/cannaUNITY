// frontend/src/apps/wawi/pages/Strain/components/StrainTable.jsx
import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import TableHeader from '@/components/common/TableHeader'
import PaginationFooter from '@/components/common/PaginationFooter'
import TableRow from './table-components/TableRow'
import TableDetailView from './table-sections/TableDetailView'
import ImageLightbox from './table-components/ImageLightbox'
import api from '@/utils/api'

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
  // State für die Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedStrainImages, setSelectedStrainImages] = useState([])
  
  // NEU: State für Bestandsdaten
  const [stockData, setStockData] = useState({})

  // NEU: Lade Bestandsdaten für alle sichtbaren Strains
  useEffect(() => {
    const loadStockData = async () => {
      const newStockData = {}
      
      for (const strain of data) {
        try {
          const response = await api.get(`/wawi/strains/${strain.id}/track_and_trace_stats/`)
          newStockData[strain.id] = response.data.total_available || 0
        } catch (error) {
          console.error(`Error loading stock for strain ${strain.id}:`, error)
          newStockData[strain.id] = 0
        }
      }
      
      setStockData(newStockData)
    }
    
    if (data && data.length > 0) {
      loadStockData()
    }
  }, [data])

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: 'Sortenname', width: '14%', align: 'left', padding: '0 8px 0 28px' },
      { label: 'Hersteller', width: '13%', align: 'left', padding: '0 10px' },
      { label: 'Typ', width: '9%', align: 'left', padding: '0 10px' },
      { label: 'Preis/Samen', width: '10%', align: 'center', padding: '0 10px' },
      { label: 'THC/CBD (%)', width: '11%', align: 'center', padding: '0 10px' },
      { label: 'Bestand', width: '12%', align: 'center', padding: '0 10px' },
      { label: 'Blütezeit (Tage)', width: '12%', align: 'center', padding: '0 10px' },
      { label: 'Bewertung', width: '9%', align: 'center', padding: '0 10px' },
      { label: 'Aktionen', width: '10%', align: 'center', padding: '0 8px' }
    ]
  }

  // Handler für Lightbox
  const handleOpenLightbox = (image, images, index) => {
    setSelectedImage(image)
    setSelectedStrainImages(images)
    setSelectedImageIndex(index)
    setLightboxOpen(true)
  }

  const handleCloseLightbox = () => {
    setLightboxOpen(false)
    setSelectedImage(null)
    setSelectedStrainImages([])
    setSelectedImageIndex(0)
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
            {/* Tabellenzeile mit Bestandsdaten */}
            <TableRow
              item={item}
              availableStock={stockData[item.id]}
              isExpanded={expandedStrainId === item.id}
              onExpand={onExpandStrain}
              onEdit={onOpenEditForm}
              onDestroy={onOpenDestroyDialog}
            />

            {/* Ausgeklappter Inhalt */}
            {expandedStrainId === item.id && (
              <Box 
                sx={{ 
                  width: '100%',
                  padding: '14px 20px 20px 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                }}
              >
                <TableDetailView
                  item={item}
                  onOpenEditForm={onOpenEditForm}
                  onOpenDestroyDialog={onOpenDestroyDialog}
                  onOpenLightbox={handleOpenLightbox}
                />
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

      {/* Lightbox für Bilder */}
      <ImageLightbox
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        selectedImage={selectedImage}
        images={selectedStrainImages}
        currentIndex={selectedImageIndex}
      />
    </Box>
  )
}

export default StrainTable