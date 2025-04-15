import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Alert, Button, Divider
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [relatedBooking, setRelatedBooking] = useState(null) // Original- oder Storno-Buchung
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Akzentfarbe für Storno-Buchungen (grün)
  const accentColor = '#2e7d32'; // Die grüne Farbe aus den Bildern
  const stornoColor = '#e74c3c'; // Rot für stornierte Buchungen

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/buchhaltung/bookings/${id}/`)
      .then(res => {
        setBooking(res.data)
        
        // Falls es eine Storno-Buchung ist, lade die originale Buchung
        if (res.data.is_storno && res.data.original_buchung_id) {
          fetchRelatedBooking(res.data.original_buchung_id);
        }
        // Falls es eine stornierte Buchung ist, müssten wir nach der Storno-Buchung suchen
        // Dies erfordert allerdings einen gesonderten API-Endpunkt, den wir hier nicht implementieren
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden der Buchung:', err)
        setError('Die Buchung konnte nicht geladen werden.')
        setLoading(false)
      })
  }, [id])

  const fetchRelatedBooking = (relatedId) => {
    axios.get(`/api/buchhaltung/bookings/${relatedId}/`)
      .then(res => {
        setRelatedBooking(res.data)
      })
      .catch(err => {
        console.error('Fehler beim Laden der zugehörigen Buchung:', err)
      });
  }

  const handleStorno = () => {
    if (confirm("Diese Buchung wirklich stornieren?")) {
      axios.post(`/api/buchhaltung/bookings/${id}/storno/`)
        .then((res) => {
          alert("Buchung erfolgreich storniert.")
          // Wenn erfolgreich, Seite neu laden
          window.location.reload()
        })
        .catch((err) => {
          console.error('Fehler beim Stornieren:', err)
          alert(`Fehler beim Stornieren: ${err.response?.data?.error || 'Unbekannter Fehler'}`)
        })
    }
  }

  const navigateToRelated = () => {
    if (booking?.is_storno && booking?.original_buchung_id) {
      navigate(`/buchhaltung/bookings/${booking.original_buchung_id}/`)
    }
    // Für den Fall, dass wir die ID der Storno-Buchung später haben
    // else if (booking?.storniert && stornoBookingId) {
    //   navigate(`/buchhaltung/bookings/${stornoBookingId}/`)
    // }
  }

  // Verbesserte T-Konten-Darstellung
  const TKontenDarstellung = ({ transactions, isStorniert, isStornoBuchung }) => {
    const getStyledText = (text, isStorniert, isStornoBuchung) => {
      if (isStorniert && !isStornoBuchung) {
        return <span style={{ textDecoration: 'line-through', color: stornoColor }}>{text}</span>;
      } else if (isStornoBuchung) {
        return <span style={{ color: accentColor, fontStyle: 'italic' }}>{text}</span>;
      }
      return <span>{text}</span>;
    };

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
          🧾 T-Konten-Darstellung
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#f8f8f8'
        }}>
          {/* Vertikale Linie in der Mitte */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            bottom: 0, 
            left: '50%', 
            width: '1px', 
            backgroundColor: '#ddd',
            zIndex: 1
          }}/>
          
          {/* Soll-Seite */}
          <Box sx={{ 
            flex: 1, 
            padding: 2,
            position: 'relative',
            borderRight: 'none'
          }}>
            <Typography variant="subtitle2" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              mb: 1,
              pb: 1,
              borderBottom: '1px solid #ddd'
            }}>
              SOLL
            </Typography>
            
            {transactions.map((tx, i) => (
              <Box key={`soll-${i}`} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < transactions.length - 1 ? '1px dashed #eee' : 'none'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getStyledText(tx.soll_konto?.kontonummer, isStorniert, isStornoBuchung)}
                </Typography>
                <Typography variant="body2">
                  {getStyledText(`${parseFloat(tx.betrag).toFixed(2)} €`, isStorniert, isStornoBuchung)}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Haben-Seite */}
          <Box sx={{ 
            flex: 1, 
            padding: 2,
            position: 'relative',
            borderLeft: 'none'
          }}>
            <Typography variant="subtitle2" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              mb: 1,
              pb: 1,
              borderBottom: '1px solid #ddd'
            }}>
              HABEN
            </Typography>
            
            {transactions.map((tx, i) => (
              <Box key={`haben-${i}`} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < transactions.length - 1 ? '1px dashed #eee' : 'none'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getStyledText(tx.haben_konto?.kontonummer, isStorniert, isStornoBuchung)}
                </Typography>
                <Typography variant="body2">
                  {getStyledText(`${parseFloat(tx.betrag).toFixed(2)} €`, isStorniert, isStornoBuchung)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) return <Typography sx={{ p: 3 }}>Lade Buchung...</Typography>
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
  if (!booking) return <Alert severity="warning" sx={{ m: 3 }}>Buchung nicht gefunden</Alert>

  // Storno-Status prüfen
  const isStornoBuchung = booking.is_storno
  const isStorniert = booking.storniert

  // Prüfen, ob es sich um eine Mehrfachbuchung handelt
  const isMehrfach = booking.typ === 'MEHRFACH'

  // Buchungsnummer mit M-Suffix für Mehrfachbuchungen
  let displayBuchungsnummer = booking.buchungsnummer;
  if (isMehrfach && !displayBuchungsnummer.endsWith('-M') && !displayBuchungsnummer.endsWith('M')) {
    displayBuchungsnummer += '-M';
  }

  return (
    <Box p={3}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        🧾 Buchung {displayBuchungsnummer}
        
        {isStornoBuchung && (
          <Chip 
            label="Storno-Buchung" 
            size="small" 
            sx={{ 
              ml: 2,
              color: accentColor,
              borderColor: accentColor
            }}
            variant="outlined"
          />
        )}
        
        {isStorniert && !isStornoBuchung && (
          <Chip 
            label="Storniert" 
            color="error" 
            size="small" 
            sx={{ ml: 2 }}
          />
        )}
      </Typography>

      {/* Storno-Informationen */}
      {isStornoBuchung && booking.original_buchung_nr && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, backgroundColor: 'rgba(46, 125, 50, 0.08)', color: 'rgba(0, 0, 0, 0.87)' }}
          icon={<span style={{ fontSize: '1.2rem' }}>↩️</span>}
        >
          <Typography variant="body2">
            Diese Buchung ist eine <strong>Storno-Buchung</strong> zur Original-Buchung 
            <Button 
              variant="text" 
              size="small" 
              onClick={navigateToRelated} 
              sx={{ mx: 1, color: accentColor }}
            >
              {booking.original_buchung_nr}
            </Button>
            und hat alle Kontenänderungen rückgängig gemacht.
          </Typography>
        </Alert>
      )}

      {isStorniert && !isStornoBuchung && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<span style={{ fontSize: '1.2rem' }}>❌</span>}
        >
          <Typography variant="body2">
            Diese Buchung wurde <strong>storniert</strong>. Die Storno-Buchung hat alle Kontenänderungen rückgängig gemacht.
          </Typography>
        </Alert>
      )}

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body1"><strong>Typ:</strong> {booking.typ}</Typography>
          <Typography variant="body1"><strong>Datum:</strong> {new Date(booking.datum).toLocaleDateString()}</Typography>
          <Typography variant="body1"><strong>Mitglied:</strong> {booking.mitgliedsname || '–'}</Typography>
          <Typography variant="body1"><strong>Verwendungszweck:</strong> {booking.verwendungszweck}</Typography>
          
          {/* Storno-Button - nur anzeigen, wenn die Buchung noch nicht storniert wurde und keine Storno-Buchung ist */}
          {!isStorniert && !isStornoBuchung && (
            <Button 
              variant="outlined" 
              color="warning" 
              onClick={handleStorno}
              sx={{ mt: 2 }}
              startIcon={<span>❌</span>}
            >
              Buchung stornieren
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Haupttabelle mit möglicher Storno-Markierung */}
      <Card 
        elevation={1} 
        sx={{ 
          position: 'relative',
          ...(isStorniert && !isStornoBuchung && {
            opacity: 0.75,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: stornoColor,
              zIndex: 2
            }
          })
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Buchungszeilen
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                {/* # Spalte nur für Mehrfachbuchungen */}
                {isMehrfach && <TableCell>#</TableCell>}
                {/* Sub-Buchungsnummer nur für Mehrfachbuchungen */}
                {isMehrfach && <TableCell>Sub-Buchungsnummer</TableCell>}
                <TableCell>Betrag (€)</TableCell>
                <TableCell>Soll-Konto</TableCell>
                <TableCell>Haben-Konto</TableCell>
                <TableCell>Einzelzweck</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {booking.subtransactions.map(sub => (
                <TableRow key={sub.id}>
                  {/* # Spalte nur für Mehrfachbuchungen */}
                  {isMehrfach && <TableCell>{sub.laufende_nummer || ''}</TableCell>}
                  {/* Sub-Buchungsnummer nur für Mehrfachbuchungen */}
                  {isMehrfach && <TableCell>{sub.buchungsnummer_sub || ''}</TableCell>}
                  <TableCell>{parseFloat(sub.betrag).toFixed(2)}</TableCell>
                  <TableCell>
                    {sub.soll_konto.kontonummer} · {sub.soll_konto.name}
                    <Typography variant="caption" sx={{ display: 'block', color: 'gray' }}>
                      ({sub.soll_konto.konto_typ})
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {sub.haben_konto.kontonummer} · {sub.haben_konto.name}
                    <Typography variant="caption" sx={{ display: 'block', color: 'gray' }}>
                      ({sub.haben_konto.konto_typ})
                    </Typography>
                  </TableCell>
                  <TableCell>{sub.verwendungszweck || '–'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* T-Konten-Darstellung */}
      <TKontenDarstellung 
        transactions={booking.subtransactions} 
        isStorniert={isStorniert} 
        isStornoBuchung={isStornoBuchung} 
      />
      
      {/* Verwandte Buchung anzeigen (Original oder Storno) */}
      {relatedBooking && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {isStornoBuchung ? "Original-Buchung" : "Storno-Buchung"}
          </Typography>
          
          <Card elevation={1} sx={{ 
            mb: 3,
            border: `1px solid ${isStornoBuchung ? stornoColor : accentColor}`,
            borderLeft: `4px solid ${isStornoBuchung ? stornoColor : accentColor}`
          }}>
            <CardContent>
              <Typography variant="body1"><strong>Buchungsnummer:</strong> {relatedBooking.buchungsnummer}</Typography>
              <Typography variant="body1"><strong>Datum:</strong> {new Date(relatedBooking.datum).toLocaleDateString()}</Typography>
              <Typography variant="body1"><strong>Verwendungszweck:</strong> {relatedBooking.verwendungszweck}</Typography>
              <Typography variant="body1">
                <strong>Betrag:</strong> {relatedBooking.subtransactions.reduce((sum, tx) => sum + parseFloat(tx.betrag), 0).toFixed(2)} €
              </Typography>
              
              <Button 
                variant="outlined" 
                size="small"
                sx={{ 
                  mt: 2,
                  color: isStornoBuchung ? stornoColor : accentColor,
                  borderColor: isStornoBuchung ? stornoColor : accentColor
                }}
                onClick={() => navigate(`/buchhaltung/bookings/${relatedBooking.id}/`)}
              >
                Zu dieser Buchung wechseln
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}
      
      {/* GoB-konforme Hinweise */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Gemäß den Grundsätzen ordnungsmäßiger Buchführung (GoB) werden stornierte Buchungen durchgestrichen dargestellt.
          Stornobuchungen werden durch eine separate, gegensätzliche Buchung dokumentiert, um die Nachvollziehbarkeit zu gewährleisten.
          Jede Stornobuchung erhält eine eigene fortlaufende Nummer.
        </Typography>
      </Box>
    </Box>
  )
}