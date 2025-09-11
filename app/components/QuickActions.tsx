'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface ActionCard {
  id: string
  title: string
  description: string
  icon: string
  route: string
  color: string
  available: boolean
  requiresOnboarding?: boolean
  comingSoon?: boolean
}

export default function QuickActions() {
  const router = useRouter()
  const [userLevel, setUserLevel] = useState('new') // new, active, power

  useEffect(() => {
    // Check user engagement level from localStorage
    const metrics = localStorage.getItem('userMetrics')
    if (metrics) {
      const { calls } = JSON.parse(metrics)
      if (calls >= 10) setUserLevel('power')
      else if (calls >= 1) setUserLevel('active')
    }
  }, [])

  const actions: ActionCard[] = [
    {
      id: 'find-reps',
      title: 'Find Your Reps',
      description: 'Discover who represents you',
      icon: '🏛️',
      route: '/representatives',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      available: true
    },
    {
      id: 'trending',
      title: 'Trending Issue',
      description: 'Climate bill needs support',
      icon: '🔥',
      route: '/issues/trending',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      available: true
    },
    {
      id: 'scripts',
      title: 'Script Library',
      description: 'Your saved scripts',
      icon: '📚',
      route: '/scripts',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      available: userLevel !== 'new'
    },
    {
      id: 'challenge',
      title: 'Daily Challenge',
      description: 'Join today\'s action',
      icon: '🏆',
      route: '/challenges',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      available: userLevel === 'power',
      comingSoon: true
    },
    {
      id: 'events',
      title: 'Local Events',
      description: 'Town halls near you',
      icon: '📅',
      route: '/events',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      available: userLevel !== 'new',
      comingSoon: true
    },
    {
      id: 'resources',
      title: 'Resources',
      description: 'Learn advocacy skills',
      icon: '📖',
      route: '/resources',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      available: true
    }
  ]

  const visibleActions = actions.filter(action => 
    userLevel === 'power' || !action.comingSoon
  )

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibleActions.map((action) => (
          <div
            key={action.id}
            onClick={() => !action.comingSoon && action.available && router.push(action.route)}
            className={`
              relative rounded-xl p-4 text-white cursor-pointer
              transform transition-all hover:scale-105 hover:shadow-xl
              ${action.available && !action.comingSoon ? action.color : 'bg-gray-300'}
              ${!action.available && !action.comingSoon ? 'opacity-60' : ''}
            `}
          >
            {action.comingSoon && (
              <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                  Coming Soon
                </span>
              </div>
            )}
            
            {!action.available && !action.comingSoon && (
              <div className="absolute top-2 right-2">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  🔒
                </span>
              </div>
            )}
            
            <div className="text-3xl mb-2">{action.icon}</div>
            <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
            <p className="text-xs opacity-90">{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}