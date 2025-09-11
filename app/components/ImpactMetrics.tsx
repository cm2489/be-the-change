'use client'

import { useEffect, useState } from 'react'

interface MetricData {
  calls: number
  streak: number
  impact: number
  weeklyGoal: number
  callsThisWeek: number
}

export default function ImpactMetrics() {
  const [metrics, setMetrics] = useState<MetricData>({
    calls: 0,
    streak: 0,
    impact: 0,
    weeklyGoal: 3,
    callsThisWeek: 0
  })

  useEffect(() => {
    // Load metrics from localStorage for now
    const savedMetrics = localStorage.getItem('userMetrics')
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics))
    }
  }, [])

  const weeklyProgress = (metrics.callsThisWeek / metrics.weeklyGoal) * 100

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {/* Calls Made */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-16 h-16 md:w-20 md:h-20">
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
              />
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#10B981"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - metrics.calls / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xl font-bold text-gray-900">{metrics.calls}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Total Calls</p>
        </div>

        {/* Streak */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-16 h-16 md:w-20 md:h-20">
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
              />
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - metrics.streak / 30)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold text-gray-900">{metrics.streak}</span>
              <span className="text-[10px] text-gray-500">days</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">Current Streak</p>
        </div>

        {/* Impact Score */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-16 h-16 md:w-20 md:h-20">
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
              />
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#5B21B6"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - metrics.impact / 1000)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xl font-bold text-gray-900">{metrics.impact}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Impact Points</p>
        </div>

        {/* Weekly Goal - Hidden on mobile */}
        <div className="hidden md:block text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-20 h-20">
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
              />
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - weeklyProgress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold text-gray-900">{metrics.callsThisWeek}</span>
              <span className="text-[10px] text-gray-500">of {metrics.weeklyGoal}</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">Weekly Goal</p>
        </div>
      </div>
    </div>
  )
}