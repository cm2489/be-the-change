'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PriorityAction {
  id: string
  title: string
  description: string
  urgency: 'critical' | 'high' | 'medium'
  repName: string
  repTitle: string
  repParty: string
  issueCategory: string
  deadline?: string
  supportersCount: number
}

export default function TodaysPriority() {
  const router = useRouter()
  const [action, setAction] = useState<PriorityAction>({
    id: '1',
    title: 'Support Climate Action Bill HR-2025',
    description: 'A critical vote is coming up on comprehensive climate legislation that would significantly reduce carbon emissions by 2030.',
    urgency: 'critical',
    repName: 'Rep. Jane Smith',
    repTitle: 'U.S. Representative',
    repParty: 'D',
    issueCategory: 'Climate',
    deadline: '48 hours',
    supportersCount: 1247
  })

  const [timeLeft, setTimeLeft] = useState('48:00:00')

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      // Simple countdown logic - would be more complex in production
      const parts = timeLeft.split(':')
      let hours = parseInt(parts[0])
      let minutes = parseInt(parts[1])
      let seconds = parseInt(parts[2])
      
      if (seconds > 0) {
        seconds--
      } else if (minutes > 0) {
        minutes--
        seconds = 59
      } else if (hours > 0) {
        hours--
        minutes = 59
        seconds = 59
      }
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const urgencyColors = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-amber-50 border-amber-200',
    medium: 'bg-blue-50 border-blue-200'
  }

  const urgencyBadgeColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-blue-100 text-blue-800'
  }

  return (
    <div className={`relative rounded-2xl border-2 ${urgencyColors[action.urgency]} p-6 mb-8 overflow-hidden`}>
      {/* Animated gradient background for critical actions */}
      {action.urgency === 'critical' && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-amber-500/5 animate-pulse" />
      )}
      
      <div className="relative">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyBadgeColors[action.urgency]}`}>
                {action.urgency === 'critical' ? '🔥 URGENT' : action.urgency === 'high' ? '⚡ HIGH PRIORITY' : '📌 IMPORTANT'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {action.issueCategory}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Today's Priority: {action.title}
            </h3>
          </div>
          
          {/* Timer */}
          {action.deadline && (
            <div className="text-center bg-white rounded-xl px-4 py-2 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Time Remaining</p>
              <p className="text-xl font-mono font-bold text-red-600">{timeLeft}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {action.description}
        </p>

        {/* Representative Info */}
        <div className="flex items-center justify-between bg-white/80 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
              {action.repName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{action.repName}</p>
              <p className="text-sm text-gray-600">{action.repTitle} ({action.repParty})</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{action.supportersCount.toLocaleString()}</p>
            <p className="text-xs text-gray-600">people have called</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/scripts/new')}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <span className="text-lg">📞 Call Now</span>
            <span className="block text-sm opacity-90 mt-1">Takes less than 2 minutes</span>
          </button>
          <button
            onClick={() => router.push('/scripts/new')}
            className="sm:flex-1 bg-white text-purple-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors border-2 border-purple-200"
          >
            <span className="text-lg">📝 Get Script</span>
          </button>
        </div>
      </div>
    </div>
  )
}