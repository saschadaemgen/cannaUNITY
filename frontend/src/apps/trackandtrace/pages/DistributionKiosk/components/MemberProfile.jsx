// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/MemberProfile.jsx

export default function MemberProfile({ member, memberLimits }) {
  if (!member || !memberLimits) return null

  const isU21 = memberLimits?.member?.age_class === '18+'
  const initials = member.first_name?.[0] + (member.last_name?.[0] || member.name?.[1] || '')

  return (
    <div className="member-profile">
      <div className="member-avatar">
        {initials || '👤'}
      </div>
      
      <h3 className="member-name">
        {member.first_name} {member.last_name || ''}
      </h3>
      
      <p className="member-email">{member.email}</p>
      
      <div className="member-badges">
        <div className="member-badge">
          ID: {member.id}
        </div>
        {isU21 && (
          <div className="member-badge u21">
            U21 - THC ≤ 10%
          </div>
        )}
      </div>
    </div>
  )
}