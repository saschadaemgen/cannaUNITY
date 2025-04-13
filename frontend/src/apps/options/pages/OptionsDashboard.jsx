import React, { useEffect, useState } from 'react'
import OptionCard from '../components/OptionCard'
import { fetchOptions } from '@/utils/api'

const OptionsDashboard = () => {
  const [options, setOptions] = useState([])

  useEffect(() => {
    fetchOptions().then(setOptions).catch(console.error)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Systemeinstellungen</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((opt) => (
          <OptionCard
            key={opt.key}
            title={opt.key}
            value={opt.value}
            description={opt.description}
          />
        ))}
      </div>
    </div>
  )
}

export default OptionsDashboard
