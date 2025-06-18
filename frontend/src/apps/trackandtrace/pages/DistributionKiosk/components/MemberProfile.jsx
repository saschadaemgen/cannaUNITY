// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/MemberProfile.jsx

export default function MemberProfile({ member, memberLimits }) {
  if (!member || !memberLimits) return null

  const isU21 = memberLimits?.member?.age_class === '18+'
  const initials = member.first_name?.[0] + (member.last_name?.[0] || member.name?.[1] || '')
  
  // Kontostand und Beitrag aus den Member-Daten
  const kontostand = member.kontostand || 0
  const monatsbeitrag = member.beitrag || 0
  
  // Formatierungsfunktion für Währung
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  // Bestimme Kontostand-Status für farbliche Kennzeichnung
  const getKontostandStatus = (amount) => {
    if (amount >= 0) return 'positive'
    if (amount >= -50) return 'warning'
    return 'critical'
  }
  
  const kontostandStatus = getKontostandStatus(kontostand)

  return (
    <div className="member-profile">
      
      <h3 className="member-name">
        {member.first_name} {member.last_name || ''}
      </h3>
      
      <div className="member-badges">
        {isU21 && (
          <div className="member-badge u21">
            U21 - THC ≤ 10%
          </div>
        )}
      </div>
      
      {/* Neue Finanz-Sektion */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h4 style={{
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Finanzen
        </h4>
        
        {/* Kontostand */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          padding: '8px 12px',
          background: kontostandStatus === 'positive' 
            ? 'rgba(76, 175, 80, 0.2)' 
            : kontostandStatus === 'warning'
              ? 'rgba(255, 152, 0, 0.2)'
              : 'rgba(244, 67, 54, 0.2)',
          borderRadius: '8px',
          border: `1px solid ${
            kontostandStatus === 'positive' 
              ? 'rgba(76, 175, 80, 0.4)' 
              : kontostandStatus === 'warning'
                ? 'rgba(255, 152, 0, 0.4)'
                : 'rgba(244, 67, 54, 0.4)'
          }`
        }}>
          <span style={{
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Kontostand:
          </span>
          <span style={{
            color: kontostandStatus === 'positive' 
              ? '#81c784' 
              : kontostandStatus === 'warning'
                ? '#ffb74d'
                : '#ef5350',
            fontSize: '0.875rem',
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)'
          }}>
            {formatCurrency(kontostand)}
          </span>
        </div>
        
        {/* Monatsbeitrag */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(33, 150, 243, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(33, 150, 243, 0.4)'
        }}>
          <span style={{
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Monatsbeitrag:
          </span>
          <span style={{
            color: '#64b5f6',
            fontSize: '0.875rem',
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)'
          }}>
            {formatCurrency(monatsbeitrag)}
          </span>
        </div>
        
        {/* Kontostand-Warnung falls negativ */}
        {kontostand < 0 && (
          <div style={{
            marginTop: '8px',
            padding: '6px 8px',
            background: 'rgba(244, 67, 54, 0.3)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#ffcdd2',
            textAlign: 'center',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)'
          }}>
            ⚠️ Negatives Guthaben
          </div>
        )}
      </div>
    </div>
  )
}