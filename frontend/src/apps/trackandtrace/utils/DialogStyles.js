/**
 * Standard-Styling für Dialoge mit voller Breite und großzügigen Rändern
 * Kann in allen Dialog-Komponenten verwendet werden
 */
export const fullWidthDialogStyle = {
  '& .MuiDialog-paper': {
    marginLeft: '48px',
    marginRight: '48px',
    marginTop: '48px',    // Jetzt auch oben gleicher Abstand
    marginBottom: '48px', // Jetzt auch unten gleicher Abstand
    width: 'calc(100% - 96px)', // Breite minus Ränder (links + rechts)
    maxWidth: 'calc(100% - 96px)',
    maxHeight: 'calc(100% - 96px)', // Neue Höhenbegrenzung
    borderRadius: 1
  }
};

/**
 * Kompakteres Styling für kleinere Dialoge
 */
export const compactDialogStyle = {
  '& .MuiDialog-paper': {
    margin: '16px',
    borderRadius: 1
  }
};

/**
 * Styling für Dialoge mit mittlerer Größe
 */
export const mediumDialogStyle = {
  '& .MuiDialog-paper': {
    margin: '12px',
    width: 'calc(100% - 24px)',
    maxWidth: '800px',
    borderRadius: 1
  }
};

/**
 * Styling für spezielle Bestätigungsdialoge
 */
export const confirmationDialogStyle = {
  '& .MuiDialog-paper': {
    margin: '16px',
    maxWidth: '500px',
    borderRadius: 1,
    padding: '8px'
  }
};