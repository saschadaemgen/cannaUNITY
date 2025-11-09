import { useState, useEffect } from 'react'
import api from '@/utils/api'

export default function ProductHistoryModal({ 
  strainCard, 
  cannabisBatchId,
  onClose 
}) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(null)
  const [hoveredStep, setHoveredStep] = useState(null)
  
  useEffect(() => {
    loadProductHistory()
    
    // ESC-Taste Handler
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [strainCard, cannabisBatchId])
  
  const loadProductHistory = async () => {
    if (!strainCard || !cannabisBatchId) {
      setError('Keine Produktinformationen verfügbar')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        strain_name: strainCard.strain_name,
        cannabis_batch_id: cannabisBatchId
      })
      
      const response = await api.get(`/trackandtrace/strain-cards/product_history/?${params.toString()}`)
      setHistory(response.data)
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der Produkthistorie:', err)
      setError('Fehler beim Laden der Produkthistorie')
    } finally {
      setLoading(false)
    }
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStepIcon = (type) => {
    const icons = {
      'seed_purchase': '🌱',
      'mother_plant': '🌿',
      'cutting': '✂️',
      'flowering_plant': '🌸',
      'blooming_cutting': '🌺',
      'harvest': '🌾',
      'drying': '🍂',
      'processing': '⚙️',
      'lab_testing': '🧪',
      'packaging': '📦'
    }
    return icons[type] || '•'
  }
  
  const getStepTitle = (type) => {
    const titles = {
      'seed_purchase': 'Sameneinkauf',
      'mother_plant': 'Mutterpflanze',
      'cutting': 'Stecklinge',
      'flowering_plant': 'Blühpflanzen (direkt)',
      'blooming_cutting': 'Blühende Stecklinge',
      'harvest': 'Ernte',
      'drying': 'Trocknung',
      'processing': 'Verarbeitung zu Marihuana',
      'lab_testing': 'Laborkontrolle',
      'packaging': 'Verpackung'
    }
    return titles[type] || type
  }
  
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(180deg, #000000 0%, #0a1410 100%)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      overflow: 'hidden',
      width: '100vw',
      height: '100vh'
    },
    header: {
      height: '10vh',
      minHeight: '70px',
      maxHeight: '100px',
      background: 'linear-gradient(90deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 25, 22, 0.95) 100%)',
      borderBottom: '2px solid #2e7d32',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 2vw',
      position: 'relative',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '2vw'
    },
    logo: {
      fontSize: 'clamp(24px, 2.5vw, 36px)',
      filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.5))'
    },
    titleContainer: {
      color: 'white'
    },
    mainTitle: {
      fontSize: 'clamp(20px, 2vw, 32px)',
      fontWeight: 700,
      margin: 0,
      background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    },
    subTitle: {
      fontSize: 'clamp(11px, 1vw, 14px)',
      opacity: 0.7,
      marginTop: '0.2vh',
      fontStyle: 'italic'
    },
    centerInfo: {
      textAlign: 'center',
      color: 'white'
    },
    strainName: {
      fontSize: 'clamp(16px, 1.6vw, 24px)',
      fontWeight: 600,
      margin: 0,
      color: '#4caf50'
    },
    productType: {
      fontSize: 'clamp(12px, 1.1vw, 16px)',
      opacity: 0.8,
      marginTop: '0.3vh'
    },
    statsSection: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '2vw'
    },
    statBox: {
      textAlign: 'center',
      padding: '0.5vh 1.5vw',
      background: 'rgba(46, 125, 50, 0.1)',
      borderRadius: '0.5vw',
      border: '1px solid rgba(46, 125, 50, 0.3)'
    },
    statNumber: {
      fontSize: 'clamp(18px, 1.8vw, 28px)',
      fontWeight: 700,
      color: '#4caf50',
      lineHeight: 1
    },
    statText: {
      fontSize: 'clamp(9px, 0.8vw, 11px)',
      opacity: 0.7,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginTop: '0.2vh'
    },
    closeBtn: {
      position: 'absolute',
      top: '50%',
      right: '2vw',
      transform: 'translateY(-50%)',
      width: 'clamp(35px, 3vw, 45px)',
      height: 'clamp(35px, 3vw, 45px)',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: 'clamp(14px, 1.2vw, 18px)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    },
    infoBar: {
      height: '4vh',
      minHeight: '30px',
      background: 'rgba(46, 125, 50, 0.05)',
      borderBottom: '1px solid rgba(46, 125, 50, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3vw',
      fontSize: 'clamp(10px, 0.9vw, 13px)',
      color: 'rgba(255, 255, 255, 0.6)',
      fontStyle: 'italic'
    },
    content: {
      flex: 1,
      padding: '2vh 1vw',
      overflowY: 'auto',
      overflowX: 'hidden'
    },
    timelineWrapper: {
      position: 'relative',
      maxWidth: '98vw',
      margin: '0 auto'
    },
    timelineConnector: {
      position: 'absolute',
      top: '3vh',
      left: '1vw',
      right: '1vw',
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(46, 125, 50, 0.3) 5%, rgba(46, 125, 50, 0.3) 95%, transparent 100%)',
      zIndex: 0
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(max(15vw, 200px), 1fr))',
      gap: '1vw',
      position: 'relative',
      zIndex: 1
    },
    card: {
      background: 'linear-gradient(145deg, rgba(25, 30, 28, 0.9) 0%, rgba(15, 20, 18, 0.9) 100%)',
      borderRadius: '0.8vw',
      padding: 'clamp(12px, 1.2vw, 20px)',
      border: '1px solid rgba(46, 125, 50, 0.2)',
      position: 'relative',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      overflow: 'hidden',
      backdropFilter: 'blur(5px)'
    },
    cardHover: {
      transform: 'translateY(-3px) scale(1.02)',
      borderColor: '#4caf50',
      boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)',
      background: 'linear-gradient(145deg, rgba(35, 40, 38, 0.95) 0%, rgba(25, 30, 28, 0.95) 100%)'
    },
    cardGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, transparent, #4caf50, transparent)',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.8vw',
      marginBottom: '1vh',
      paddingBottom: '0.8vh',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    },
    cardIcon: {
      fontSize: 'clamp(18px, 1.5vw, 24px)',
      lineHeight: 1
    },
    cardTitleSection: {
      flex: 1
    },
    cardTitle: {
      fontSize: 'clamp(12px, 1.1vw, 16px)',
      fontWeight: 600,
      color: '#4caf50',
      margin: '0 0 0.3vh 0',
      lineHeight: 1.2
    },
    cardDate: {
      fontSize: 'clamp(9px, 0.8vw, 11px)',
      color: 'rgba(255, 255, 255, 0.5)',
      lineHeight: 1.2
    },
    cardBatch: {
      fontSize: 'clamp(8px, 0.7vw, 10px)',
      background: 'rgba(46, 125, 50, 0.2)',
      color: '#81c784',
      padding: '0.2vh 0.6vw',
      borderRadius: '0.3vw',
      display: 'inline-block',
      marginTop: '0.3vh',
      border: '1px solid rgba(46, 125, 50, 0.3)'
    },
    dataList: {
      display: 'grid',
      gap: '0.6vh'
    },
    dataRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.4vh 0.8vw',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '0.3vw',
      fontSize: 'clamp(9px, 0.8vw, 12px)'
    },
    dataKey: {
      color: 'rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase',
      fontSize: 'clamp(8px, 0.7vw, 10px)',
      letterSpacing: '0.05em'
    },
    dataVal: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: 600
    },
    noteSection: {
      marginTop: '0.8vh',
      padding: '0.6vh 0.8vw',
      background: 'rgba(255, 193, 7, 0.08)',
      borderRadius: '0.3vw',
      fontSize: 'clamp(8px, 0.7vw, 11px)',
      color: 'rgba(255, 193, 7, 0.8)',
      borderLeft: '2px solid rgba(255, 193, 7, 0.4)',
      lineHeight: 1.4
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      color: 'white'
    },
    spinner: {
      width: 'clamp(40px, 4vw, 60px)',
      height: 'clamp(40px, 4vw, 60px)',
      border: '3px solid rgba(255, 255, 255, 0.1)',
      borderTop: '3px solid #4caf50',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '2vh'
    },
    error: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      color: '#ff5252'
    }
  }
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(46, 125, 50, 0.4);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(46, 125, 50, 0.6);
        }
      `}</style>
      
      <div onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>📋</div>
            <div style={styles.titleContainer}>
              <h1 style={styles.mainTitle}>Track & Trace</h1>
              <div style={styles.subTitle}>Lückenlose Rückverfolgbarkeit vom Samen bis zum Produkt</div>
            </div>
          </div>
          
          <div style={styles.centerInfo}>
            <h2 style={styles.strainName}>{strainCard?.strain_name || 'Unbekannte Sorte'}</h2>
            <div style={styles.productType}>{strainCard?.product_type_display || 'Marihuana'}</div>
          </div>
          
          {history && (
            <div style={styles.statsSection}>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{history.total_steps}</div>
                <div style={styles.statText}>Schritte</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{history.complete_chain ? '✓' : '⚠'}</div>
                <div style={styles.statText}>{history.complete_chain ? 'Vollständig' : 'Unvollständig'}</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>#{cannabisBatchId?.split('_')[1]?.substring(0, 4) || 'N/A'}</div>
                <div style={styles.statText}>Charge</div>
              </div>
            </div>
          )}
          
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              e.target.style.transform = 'translateY(-50%) scale(1.1) rotate(90deg)'
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              e.target.style.transform = 'translateY(-50%) scale(1) rotate(0deg)'
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Info Bar */}
        <div style={styles.infoBar}>
          <span>💡 Vollständige Dokumentation</span>
          <span>🔒 BtM-konform</span>
          <span>✓ GMP-zertifiziert</span>
          <span>📊 Echtzeit-Tracking</span>
        </div>
        
        {/* Content */}
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <div>Lade Tracking-Daten...</div>
          </div>
        ) : error ? (
          <div style={styles.error}>
            <div style={{ fontSize: '3vw', marginBottom: '1vh' }}>⚠️</div>
            <div>{error}</div>
          </div>
        ) : history && (
          <div style={styles.content}>
            <div style={styles.timelineWrapper}>
              <div style={styles.timelineConnector} />
              
              <div style={styles.cardGrid}>
                {history.timeline.map((step, index) => (
                  <div 
                    key={index}
                    style={{
                      ...styles.card,
                      ...(hoveredStep === index ? styles.cardHover : {})
                    }}
                    onMouseEnter={() => setHoveredStep(index)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div style={{
                      ...styles.cardGlow,
                      opacity: hoveredStep === index ? 1 : 0
                    }} />
                    
                    <div style={styles.cardHeader}>
                      <span style={styles.cardIcon}>{getStepIcon(step.type)}</span>
                      <div style={styles.cardTitleSection}>
                        <h3 style={styles.cardTitle}>{getStepTitle(step.type)}</h3>
                        <div style={styles.cardDate}>{formatDate(step.date)}</div>
                        <span style={styles.cardBatch}>{step.batch_number}</span>
                      </div>
                    </div>
                    
                    <div style={styles.dataList}>
                      {Object.entries(step.data).map(([key, value]) => {
                        if (!value || value === 'Nicht angegeben' || key === 'notes' || key === 'lab_notes') return null
                        
                        const labels = {
                          strain_name: 'Sorte',
                          quantity: 'Anzahl',
                          remaining: 'Verbleibend',
                          weight: 'Gewicht',
                          initial_weight: 'Anfang',
                          final_weight: 'Ende',
                          weight_loss: 'Verlust',
                          input_weight: 'Eingang',
                          output_weight: 'Ausgang',
                          member: 'Mitglied',
                          room: 'Raum',
                          product_type: 'Typ',
                          thc_content: 'THC',
                          cbd_content: 'CBD',
                          thc_range: 'THC-Bereich',
                          cbd_range: 'CBD-Bereich',
                          yield: 'Ausbeute',
                          status: 'Status',
                          unit_count: 'Einheiten',
                          unit_weight: 'Einheit',
                          sample_weight: 'Probe'
                        }
                        
                        return (
                          <div key={key} style={styles.dataRow}>
                            <span style={styles.dataKey}>{labels[key] || key}</span>
                            <span style={styles.dataVal}>{value}</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    {(step.data.notes || step.data.lab_notes) && (
                      <div style={styles.noteSection}>
                        {step.data.notes || step.data.lab_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}