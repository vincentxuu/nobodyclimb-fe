'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, Activity } from 'lucide-react'
import { Biography } from '@/lib/types'
import { calculateClimbingYears } from '@/lib/utils/biography'

interface QuickFactsSectionProps {
  person: Biography
}

/**
 * Quick Facts - 快速了解
 * 三張資訊卡片展示基本資訊
 */
export function QuickFactsSection({ person }: QuickFactsSectionProps) {
  const climbingYears = calculateClimbingYears(person.climbing_start_year)
  const locations = person.frequent_locations?.split(',').filter(l => l.trim()) || []
  const routeTypes = person.favorite_route_type?.split(',').filter(t => t.trim()) || []

  const quickFacts = [
    {
      icon: <Calendar className="h-6 w-6 text-gray-600" />,
      label: '開始攀岩',
      value: person.climbing_start_year
        ? `${person.climbing_start_year}${climbingYears !== null ? ` (${climbingYears} 年)` : ''}`
        : '尚未填寫'
    },
    {
      icon: <MapPin className="h-6 w-6 text-gray-600" />,
      label: '常出沒地點',
      value: locations.length > 0 ? locations.join('、') : '尚未填寫'
    },
    {
      icon: <Activity className="h-6 w-6 text-gray-600" />,
      label: '喜歡的類型',
      value: routeTypes.length > 0 ? routeTypes.join('、') : '尚未填寫'
    }
  ]

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          快速了解 {person.name}
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {quickFacts.map((fact, index) => (
            <motion.div
              key={fact.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-lg bg-gray-50 p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Icon */}
              <div className="mb-3 flex justify-center">
                {fact.icon}
              </div>
              <p className="text-sm text-gray-500">{fact.label}</p>
              <p className="mt-1 font-medium text-gray-900">{fact.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
