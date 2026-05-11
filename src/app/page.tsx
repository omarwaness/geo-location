'use client'

import { useEffect, useRef, useState } from 'react'

import { LocationMapPanel, type Zone } from '@/components/map'
import { Overview } from '@/components/overview'
import { createLocationSimulator, type PersonLocation } from '@/lib/simulate-location'
import { toast } from 'sonner'

const PERSON_START: [number, number] = [-73.97, 40.78]

export default function Home() {
  const [mapExpanded, setMapExpanded] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [personLocation, setPersonLocation] = useState<PersonLocation | null>(null)
  const zonesRef = useRef<Zone[]>(zones)
  const prevInsideRef = useRef<boolean | null>(null)

  useEffect(() => {
    zonesRef.current = zones
  }, [zones])

  useEffect(() => {
    let cancelled = false
    fetch('/api/zones')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (!cancelled) setZones(data) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const sim = createLocationSimulator(
      PERSON_START,
      (loc) => {
        setPersonLocation(loc)
        if (prevInsideRef.current !== null && prevInsideRef.current !== loc.insideZone) {
          if (loc.insideZone) {
            toast.success('Entered a zone', { description: `Person entered ${loc.currentZoneName}` })
          } else {
            toast.error('Left zone', { description: 'Person is now outside all zones' })
          }
        }
        prevInsideRef.current = loc.insideZone
      },
      () => zonesRef.current
    )
    sim.start()
    return () => sim.stop()
  }, [])

  const handleZoneAdded = async (zone: Zone) => {
    const res = await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: zone.name, coordinates: zone.coordinates }),
    })
    if (res.ok) {
      const saved = await res.json()
      setZones(prev => [...prev, saved])
    }
  }

  const handleZoneRemoved = async (id: string) => {
    const res = await fetch(`/api/zones/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setZones(prev => prev.filter(z => z.id !== id))
    }
  }

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full overflow-hidden">
      <Overview
        mapExpanded={mapExpanded}
        zones={zones}
        onZoneRemoved={handleZoneRemoved}
        personLocation={personLocation}
      />
      <LocationMapPanel
        mapExpanded={mapExpanded}
        onToggleExpanded={() => setMapExpanded(prev => !prev)}
        zones={zones}
        onZoneAdded={handleZoneAdded}
        personLocation={personLocation}
      />
    </div>
  )
}
