'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Issue {
  id: string
  title: string
  category: string
  urgency: 'rising' | 'stable' | 'critical'
  supportersCount: number
  description: string
  momentum: number // percentage change
}

export default function TrendingIssues() {
  const router = useRouter()
  const [issues] = useState<Issue[]>([
    {
      id: '1',
      title: 'Climate Action Act 2025',
      category: 'Environment',
      urgency: 'critical',
      supportersCount: 3421,
      description: 'Comprehensive climate legislation facing key vote',
      momentum: 45
    },
    {
      id: '2', 
      title: 'Healthcare Access Expansion',
      category: 'Healthcare',
      urgency: 'rising',
      supportersCount: 2156,
      description: 'Expanding Medicare coverage to more Americans',
      momentum: 23
    },
    {
      id: '3',
      title: 'Education Funding Bill',
      category: 'Education', 
      urgency: 'stable',
      supportersCount: 1892,
      description: 'Increase federal funding for public schools',
      momentum: 5
    },
    {
      id: '4',
      title: 'Voting Rights Protection',
      category: 'Democracy',
      urgency: 'rising',
      supportersCount: 2788,
      description: 'Safeguarding access to voting nationwide',
      momentum: 31
    }
  ])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Environment': 'bg-emerald-100 text-emerald-800',
      'Healthcare': 'bg-blue-100 text-blue-800',
      'Education': 'bg-purple-100 text-purple-800',
      'Democracy': 'bg-amber-100 text-amber-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getMomentumIcon = (momentum: number) => {
    if (momentum > 20) return '🚀'
    if (momentum > 10) return '📈'
    if (momentum > 0) return '➡️'
    return '📉'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Trending Issues</h3>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => router.push('/scripts/new')}
            className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(issue.category)}`}>
                  {issue.category}
                </span>
                {issue.urgency === 'critical' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    URGENT
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                {issue.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
            </div>

            <div className="flex items-center gap-4 ml-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <span className="text-lg">{getMomentumIcon(issue.momentum)}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    +{issue.momentum}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">momentum</p>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {issue.supportersCount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">supporters</p>
              </div>

              <button className="hidden md:block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Take Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}