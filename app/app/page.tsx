export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-600 mb-4">
          Be The Change
        </h1>
        <p className="text-2xl text-gray-700 mb-8">
          Democracy Starts With You
        </p>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Empower your voice with AI-powered advocacy scripts. 
          Connect with your representatives in one click.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">📞</div>
          <h3 className="font-bold text-lg mb-2">One-Click Calling</h3>
          <p className="text-gray-600">Connect with your representatives instantly</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="font-bold text-lg mb-2">AI Scripts</h3>
          <p className="text-gray-600">Generate personalized advocacy scripts</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="font-bold text-lg mb-2">Works Everywhere</h3>
          <p className="text-gray-600">Install as an app on any device</p>
        </div>
      </div>
    </main>
  )
}