'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ResourceCategory {
  id: string
  title: string
  icon: string
  description: string
  comingSoon?: boolean
}

export default function Resources() {
  const router = useRouter()
  const [categories] = useState<ResourceCategory[]>([
    {
      id: 'education',
      title: 'Educational Content',
      icon: '📚',
      description: 'Learn about key issues and how government works',
      comingSoon: true
    },
    {
      id: 'guides',
      title: 'How-To Guides',
      icon: '📖',
      description: 'Step-by-step guides for effective advocacy',
      comingSoon: true
    },
    {
      id: 'events',
      title: 'Local Events',
      icon: '📅',
      description: 'Find town halls and community meetings near you',
      comingSoon: true
    },
    {
      id: 'partners',
      title: 'Partner Organizations',
      icon: '🤝',
      description: 'Connect with advocacy groups and nonprofits',
      comingSoon: true
    }
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">Resources Hub</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Resources & Learning Center
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to become a more effective advocate for change
          </p>
        </div>

        {/* Resource Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow relative overflow-hidden"
            >
              {category.comingSoon && (
                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold">
                    Coming Soon
                  </span>
                </div>
              )}
              
              <div className="text-5xl mb-4">{category.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {category.title}
              </h3>
              <p className="text-gray-600">
                {category.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Want to contribute resources?
          </h3>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            We&apos;re building a comprehensive library of advocacy resources. 
            If you have materials that could help others make their voices heard, we&apos;d love to hear from you.
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
            Get In Touch
          </button>
        </div>
      </main>
    </div>
  )
}