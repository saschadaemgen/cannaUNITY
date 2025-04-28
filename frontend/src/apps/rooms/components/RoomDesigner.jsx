// frontend/src/apps/rooms/components/RoomDesigner.jsx (überarbeitet)

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Box, Paper, Typography, Divider, Alert, Tabs, Tab } from '@mui/material';
import GridLayout from 'react-grid-layout';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ItemPropertiesPanel from './ItemPropertiesPanel';

// Icons für die Elementtypen
import TableChartIcon from '@mui/icons-material/TableChart';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

// Mapping von Kategorie zu Icon
const categoryIcons = {
  furniture: <TableChartIcon />,
  lighting: <LightbulbIcon />,
  sensor: <ThermostatIcon />,
  access: <MeetingRoomIcon />,
  other: <LocalFloristIcon />
};

// Drag & Drop Item
const DraggableItem = ({ item }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'room-item',
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Box
      ref={drag}
      sx={{
        p: 1,
        mb: 1,
        border: '1px solid #ccc',
        borderRadius: 1,
        backgroundColor: isDragging ? 'rgba(0,0,0,0.05)' : 'white',
        cursor: 'move',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Box>{categoryIcons[item.category] || <TableChartIcon />}</Box>
      <Typography variant="body2">{item.name}</Typography>
    </Box>
  );
};

// Drop-Target
const GridDropZone = ({ onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'room-item',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      onDrop(item, offset);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <Box
      ref={drop}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: isOver ? 'rgba(0, 200, 0, 0.1)' : 'transparent'
      }}
    >
      {children}
    </Box>
  );
};

// Komponente für Elemente im Raster
const GridItem = ({ item, onSelect, isSelected }) => {
  // Bestimme den grundlegenden Stil basierend auf der Kategorie
  const categoryStyle = {
    furniture: {
      backgroundColor: '#8bc34a20', // Hellgrüner Hintergrund für Möbel
      border: '2px solid #8bc34a', // Grüner Rand
      borderRadius: '2px',
    },
    lighting: {
      backgroundColor: '#ffc10720', // Gelber Hintergrund für Beleuchtung
      border: '2px solid #ffc107', // Gelber Rand
      borderRadius: '50%', // Rund für Lampen
    },
    sensor: {
      backgroundColor: '#03a9f420', // Blauer Hintergrund für Sensoren
      border: '2px solid #03a9f4', // Blauer Rand
      borderRadius: '50%', // Rund für Sensoren
    },
    access: {
      backgroundColor: '#9c27b020', // Violetter Hintergrund für Türen
      border: '2px solid #9c27b0', // Violetter Rand
      borderRadius: '0', // Eckig für Türen
    },
    other: {
      backgroundColor: '#e0e0e0', // Grauer Hintergrund für Sonstiges
      border: '2px solid #9e9e9e', // Grauer Rand
      borderRadius: '2px',
    }
  };
  
  // Hole den Stil für die aktuelle Kategorie
  const baseStyle = categoryStyle[item.category] || categoryStyle.other;
  
  // Überprüfe, ob Pflanzenanordnung konfiguriert ist
  const hasPlants = item.properties?.plants && item.properties.plants.quantity > 0;
  const plantQuantity = hasPlants ? item.properties.plants.quantity : 0;
  const plantArrangement = hasPlants ? item.properties.plants.arrangement : '';
  
  // Berechne die Anordnung der Pflanzen
  let rows = 0;
  let cols = 0;
  if (plantArrangement && plantArrangement.includes('x')) {
    const [rowsStr, colsStr] = plantArrangement.split('x');
    rows = parseInt(rowsStr, 10) || 1;
    cols = parseInt(colsStr, 10) || 1;
  } else if (plantQuantity) {
    // Berechne die nächstbeste quadratische Anordnung
    const sqrt = Math.sqrt(plantQuantity);
    rows = Math.ceil(sqrt) || 1;
    cols = Math.ceil(plantQuantity / rows) || 1;
  }
  
  // Erstelle ein Array für die Pflanzen
  const plants = [];
  if (rows > 0 && cols > 0) {
    for (let i = 0; i < plantQuantity; i++) {
      plants.push(i);
    }
  }
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        ...baseStyle,
        borderColor: isSelected ? '#2196f3' : baseStyle.border.split(' ')[2],
        backgroundColor: isSelected ? `${baseStyle.backgroundColor.slice(0, -2)}40` : baseStyle.backgroundColor,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: `${baseStyle.backgroundColor.slice(0, -2)}40`,
        },
        transform: `rotate(${item.rotation || 0}deg)`,
        transition: 'transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => onSelect(item)}
    >
      {/* Name des Elements oben anzeigen */}
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'absolute', 
          top: 2, 
          left: 0, 
          right: 0, 
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: '2px 4px',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          zIndex: 1,
        }}
      >
        {item.name}
      </Typography>
      
      {/* Wenn es ein Tisch mit Pflanzen ist, zeige die Pflanzenanordnung */}
      {item.category === 'furniture' && plants.length > 0 ? (
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: '4px',
            width: '90%',
            height: '90%',
            padding: '10%'
          }}
        >
          {plants.map((i) => (
            <Box 
              key={i} 
              sx={{ 
                backgroundColor: '#4caf50', // Grün für Pflanzen
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                color: 'white',
                boxShadow: '0 0 2px rgba(0,0,0,0.3)'
              }}
            >
              {i + 1}
            </Box>
          ))}
        </Box>
      ) : (
        // Wenn es kein Tisch mit Pflanzen ist, zeige das Icon
        <Box sx={{ fontSize: '2.5rem' }}>
          {categoryIcons[item.category] || <TableChartIcon />}
        </Box>
      )}
      
      {/* Anzeige von zusätzlichen Informationen als Badges */}
      {hasPlants && (
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 2, 
            right: 2, 
            bgcolor: 'primary.main', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '0.6rem',
            padding: '1px 4px',
            fontWeight: 'bold',
          }}
        >
          {plantQuantity} Pflanzen ({plantArrangement || `${rows}x${cols}`})
        </Box>
      )}
      
      {/* Sensor-Anzeige, falls vorhanden */}
      {item.properties?.sensors && item.properties.sensors.length > 0 && (
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 2, 
            left: 2, 
            bgcolor: 'info.main', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '0.6rem',
            padding: '1px 4px',
            fontWeight: 'bold',
          }}
        >
          {item.properties.sensors.length} Sensor(en)
        </Box>
      )}
    </Box>
  );
};

// Export eine Funktion, die die Elemente zurückgibt
export const getDesignerItems = () => {
  return window.roomDesignerItems || [];
};

// Hauptkomponente für den Raumdesigner
const RoomDesigner = ({ room, itemTypes = [], initialItems = [], onSave }) => {
  const [layout, setLayout] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [lastItemId, setLastItemId] = useState(0);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  
  // Referenz für den Container
  const containerRef = useRef(null);
  
  // State für die tatsächlichen Abmessungen
  const [dimensions, setDimensions] = useState({
    containerWidth: 800,
    containerHeight: 400,
    cellSize: 10 // Größe einer Zelle in Pixeln
  });
  
  // Berechne die korrekten Dimensionen basierend auf dem Raum
  useLayoutEffect(() => {
    if (containerRef.current && room) {
      const containerWidth = containerRef.current.offsetWidth - 20; // Abstand für den Rand
      const containerHeight = containerRef.current.offsetHeight - 40; // Etwas mehr Abstand vertikal
      
      // Berechne die Anzahl der Zellen in jeder Dimension
      const roomLength = parseFloat(room.length) || 100;
      const roomWidth = parseFloat(room.width) || 100;
      const gridSizeValue = parseFloat(room.grid_size) || 10;
      
      const cellsX = Math.ceil(roomLength / gridSizeValue);
      const cellsY = Math.ceil(roomWidth / gridSizeValue);
      
      // Berechne die Zellengröße so, dass sie ins verfügbare Fenster passt
      // WICHTIG: Wir nehmen den kleineren Wert, um zu gewährleisten, dass 
      // das korrekte Seitenverhältnis beibehalten wird
      const cellSize = Math.min(
        Math.floor(containerWidth / cellsX),
        Math.floor(containerHeight / cellsY)
      );
      
      // Berechne die tatsächlichen Container-Dimensionen mit korrektem Seitenverhältnis
      const actualWidth = cellSize * cellsX;
      const actualHeight = cellSize * cellsY;
      
      console.log(`Raum: ${roomLength}x${roomWidth}cm, Zellen: ${cellsX}x${cellsY}, Zellengröße: ${cellSize}px`);
      
      setDimensions({
        containerWidth: actualWidth,
        containerHeight: actualHeight,
        cellSize: cellSize
      });
      
      // Aktualisiere auch die Rastergröße
      setGridSize({ width: cellsX, height: cellsY });
    }
  }, [room, containerRef.current]);
  
  // Selektiertes Item abrufen
  const selectedItem = items.find(item => item.id === selectedItemId);
  
  // Gruppiere Elementtypen nach Kategorie - mit Sicherheitsabfrage
  const groupedItemTypes = (Array.isArray(itemTypes) ? itemTypes : []).reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  
  const categoryLabels = {
    furniture: 'Möbel',
    lighting: 'Beleuchtung',
    sensor: 'Sensorik',
    access: 'Zugang',
    other: 'Sonstiges'
  };
  
  // Initialisierung mit vorhandenen Items
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      // Konvertiere die vorhandenen Items ins interne Format
      const convertedItems = initialItems.map(item => ({
        id: `item-${item.id}`,
        itemTypeId: item.item_type,
        name: item.name || itemTypes.find(t => t.id === item.item_type)?.name || 'Element',
        category: itemTypes.find(t => t.id === item.item_type)?.category || 'other',
        x: parseInt(item.x_position, 10) || 0,
        y: parseInt(item.y_position, 10) || 0,
        width: parseInt(item.width, 10) || 1,
        height: parseInt(item.height, 10) || 1,
        rotation: parseInt(item.rotation, 10) || 0,
        properties: item.properties || {}
      }));
      
      setItems(convertedItems);
      
      // Erstelle das Layout für die Grid-Komponente
      const newLayout = convertedItems.map(item => ({
        i: item.id,
        x: parseInt(item.x, 10) || 0,
        y: parseInt(item.y, 10) || 0,
        w: parseInt(item.width, 10) || 1,
        h: parseInt(item.height, 10) || 1
      }));
      
      setLayout(newLayout);
      
      // Finde die höchste ID für neue Elemente
      const highestId = Math.max(...initialItems.map(item => parseInt(item.id, 10) || 0), 0);
      setLastItemId(highestId);
    }
  }, [initialItems, itemTypes]);
  
  // Update window.roomDesignerItems wenn items oder room sich ändern
  useEffect(() => {
    if (room && items.length > 0) {
      window.roomDesignerItems = items.map(item => ({
        room: parseInt(room.id, 10) || 0,
        item_type: parseInt(item.itemTypeId, 10) || 0,
        x_position: parseInt(item.x, 10) || 0,
        y_position: parseInt(item.y, 10) || 0,
        width: parseInt(item.width, 10) || 1,
        height: parseInt(item.height, 10) || 1,
        rotation: parseInt(item.rotation, 10) || 0,
        properties: item.properties || {}
      }));
    }
  }, [items, room]);
  
  // Handle für das Speichern der Konfiguration
  const handleSave = useCallback(() => {
    // Konvertiere die internen Items zurück in das API-Format
    const apiItems = items.map(item => {
      const itemId = item.id.replace('item-', '');
      return {
        id: isNaN(parseInt(itemId, 10)) ? "" : itemId,
        room: parseInt(room.id, 10) || 0,
        item_type: parseInt(item.itemTypeId, 10) || 0,
        x_position: parseInt(item.x, 10) || 0,
        y_position: parseInt(item.y, 10) || 0,
        width: parseInt(item.width, 10) || 1,
        height: parseInt(item.height, 10) || 1,
        rotation: parseInt(item.rotation, 10) || 0,
        properties: item.properties || {}
      };
    });
    
    console.log("Speichere Items:", apiItems);
    onSave(apiItems);
  }, [items, room, onSave]);
  
  // Berechne die Rastergröße in Einheiten (Spalten und Zeilen)
  useEffect(() => {
    if (room) {
      const roomLength = parseFloat(room.length) || 100;
      const roomWidth = parseFloat(room.width) || 100;
      const gridSizeValue = parseFloat(room.grid_size) || 10;
      
      const cols = Math.ceil(roomLength / gridSizeValue);
      const rows = Math.ceil(roomWidth / gridSizeValue);
      setGridSize({ width: cols, height: rows });
    }
  }, [room]);
  
  // Drop-Handling für neue Elemente mit korrekter Größenberechnung
  const handleDrop = (droppedItem, offset) => {
    // Finde die Position im Grid
    const gridElement = document.querySelector('.react-grid-layout');
    if (!gridElement) return;
    
    const gridRect = gridElement.getBoundingClientRect();
    const relativeX = offset.x - gridRect.left;
    const relativeY = offset.y - gridRect.top;
    
    // Berechne die Zellengröße basierend auf dem tatsächlichen Container
    const cellWidth = gridRect.width / gridSize.width;
    const cellHeight = gridRect.height / gridSize.height;
    
    // Debug-Ausgabe
    console.log("Drop-Position:", { relativeX, relativeY, cellWidth, cellHeight });
    
    // Berechne die Grid-Position und stelle sicher, dass es numerische Werte sind
    const gridX = Math.floor(relativeX / cellWidth) || 0;
    const gridY = Math.floor(relativeY / cellHeight) || 0;
    
    // Berechne die Element-Größe in Rastereinheiten
    const gridSizeValue = parseFloat(room.grid_size) || 10; // Standardwert, falls ungültig
    const defaultWidth = parseFloat(droppedItem.default_width) || 50;
    const defaultHeight = parseFloat(droppedItem.default_height) || 50;
    
    // Korrekte Berechnung der Element-Größe in Rastereinheiten
    const itemWidth = Math.max(1, Math.round(defaultWidth / gridSizeValue));
    const itemHeight = Math.max(1, Math.round(defaultHeight / gridSizeValue));
    
    console.log(`Element: ${droppedItem.name}, Größe: ${defaultWidth}x${defaultHeight}cm, Raster: ${itemWidth}x${itemHeight} Einheiten`);
    
    // Begrenze die Position auf das Raster
    const x = Math.max(0, Math.min(gridX, gridSize.width - itemWidth));
    const y = Math.max(0, Math.min(gridY, gridSize.height - itemHeight));
    
    // Neue ID generieren
    const newItemId = `item-${lastItemId + 1}`;
    setLastItemId(prev => prev + 1);
    
    // Neues Item erstellen
    const newItem = {
      id: newItemId,
      itemTypeId: droppedItem.id,
      name: droppedItem.name,
      category: droppedItem.category,
      x: x,
      y: y,
      width: itemWidth,
      height: itemHeight,
      rotation: 0,
      properties: {}
    };
    
    // Layout aktualisieren
    const newLayoutItem = {
      i: newItemId,
      x: x,
      y: y,
      w: itemWidth,
      h: itemHeight
    };
    
    setItems(prev => [...prev, newItem]);
    setLayout(prev => [...prev, newLayoutItem]);
    setSelectedItemId(newItemId);
  };
  
  // Layout-Änderung verarbeiten
  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    
    // Items aktualisieren
    const updatedItems = items.map(item => {
      const layoutItem = newLayout.find(l => l.i === item.id);
      if (layoutItem) {
        return {
          ...item,
          x: parseInt(layoutItem.x, 10) || 0,
          y: parseInt(layoutItem.y, 10) || 0,
          width: parseInt(layoutItem.w, 10) || 1,
          height: parseInt(layoutItem.h, 10) || 1,
        };
      }
      return item;
    });
    
    setItems(updatedItems);
  };
  
  // Element auswählen
  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
  };
  
  // Element aktualisieren
  const handleUpdateItem = (updatedItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id ? {
        ...updatedItem,
        x: parseInt(updatedItem.x, 10) || 0,
        y: parseInt(updatedItem.y, 10) || 0, 
        width: parseInt(updatedItem.width, 10) || 1,
        height: parseInt(updatedItem.height, 10) || 1,
        rotation: parseInt(updatedItem.rotation, 10) || 0
      } : item
    );
    setItems(updatedItems);
  };
  
  // Element löschen
  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    setLayout(layout.filter(item => item.i !== itemId));
    setSelectedItemId(null);
  };
  
  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  // Verfügbare Kategorie-Tabs
  const availableCategories = Object.keys(groupedItemTypes).filter(
    category => groupedItemTypes[category].length > 0
  );
  
  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ display: 'flex', height: '70vh', gap: 2 }}>
        {/* Linke Seitenleiste - Bibliothek */}
        <Paper 
          elevation={3} 
          sx={{ width: 240, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="h6" gutterBottom>Elemente</Typography>
          
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {availableCategories.map((category, index) => (
              <Tab 
                key={category} 
                label={categoryLabels[category] || category} 
                value={index} 
                icon={categoryIcons[category]} 
                iconPosition="start"
              />
            ))}
          </Tabs>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {availableCategories.length === 0 ? (
              <Alert severity="info">
                Keine Elementtypen verfügbar. Bitte zuerst in der Elemente-Bibliothek Typen anlegen.
              </Alert>
            ) : (
              availableCategories.map((category, index) => (
                <Box key={category} sx={{ display: selectedTab === index ? 'block' : 'none' }}>
                  {groupedItemTypes[category].map(item => (
                    <DraggableItem key={item.id} item={item} />
                  ))}
                </Box>
              ))
            )}
          </Box>
        </Paper>
        
        {/* Hauptbereich - Raumlayout */}
        <Paper 
          elevation={3} 
          sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <Typography variant="h6" gutterBottom>
            {room?.name || 'Raum'} ({(parseFloat(room?.length) || 0)/100}m × {(parseFloat(room?.width) || 0)/100}m)
          </Typography>
          
          <Box 
            ref={containerRef}
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              border: '1px solid #ccc', 
              position: 'relative',
              backgroundColor: '#fafafa',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px' // Mindesthöhe hinzugefügt, um ausreichend Platz zu haben
            }}
          >
            {room ? (
              <Box
                sx={{
                  width: `${dimensions.containerWidth}px`,
                  height: `${dimensions.containerHeight}px`,
                  position: 'relative',
                  // Korrekte Beibehaltung des Seitenverhältnisses
                  aspectRatio: `${gridSize.width} / ${gridSize.height}`
                }}
              >
                <GridDropZone onDrop={handleDrop}>
                  <GridLayout
                    className="layout"
                    layout={layout}
                    cols={gridSize.width}
                    rowHeight={dimensions.cellSize}
                    width={dimensions.containerWidth}
                    onLayoutChange={handleLayoutChange}
                    compactType={null}
                    preventCollision
                    margin={[0, 0]}
                    isResizable={true}
                    isDraggable={true}
                  >
                    {layout.map(layoutItem => {
                      const item = items.find(i => i.id === layoutItem.i);
                      if (!item) return null;
                      
                      return (
                        <div key={layoutItem.i}>
                          <GridItem 
                            item={item} 
                            onSelect={() => handleSelectItem(item)} 
                            isSelected={selectedItemId === item.id}
                          />
                        </div>
                      );
                    })}
                  </GridLayout>
                  
                  {/* Grid-Overlay zur Visualisierung des Rasters */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
                      backgroundSize: `${dimensions.cellSize}px ${dimensions.cellSize}px`,
                      zIndex: 0
                    }}
                  />
                </GridDropZone>
              </Box>
            ) : (
              <Alert severity="warning" sx={{ m: 2 }}>
                Kein Raum ausgewählt oder Raumdaten fehlen.
              </Alert>
            )}
          </Box>
          
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption">
              Rastergröße: {parseFloat(room?.grid_size) || 0} cm/Einheit
            </Typography>
            <Typography variant="caption">
              {layout.length} Element(e) platziert
            </Typography>
          </Box>
        </Paper>
        
        {/* Rechte Seitenleiste - Eigenschaften */}
        <Box sx={{ width: 300, overflow: 'auto' }}>
          <ItemPropertiesPanel
            selectedItem={selectedItem}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            itemTypes={itemTypes}
          />
        </Box>
      </Box>
    </DndProvider>
  );
};

export default RoomDesigner;