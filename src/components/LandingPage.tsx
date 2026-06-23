import { Button } from './ui/Button'

interface LandingPageProps {
  onStart: () => void
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">🎯 Meeting Bingo</h1>
          <p className="text-lg text-gray-600">
            Turn any meeting into a game. Auto-detects buzzwords using speech recognition!
          </p>
        </div>

        <div className="space-y-3">
          <Button variant="primary" className="w-full text-lg py-3" onClick={onStart}>
            🎮 New Game
          </Button>
          <p className="text-sm text-gray-500">🔒 Audio processed locally. Never recorded.</p>
        </div>

        <hr className="border-gray-200" />

        <div className="text-left space-y-3">
          <h2 className="text-base font-semibold text-gray-700 text-center">How It Works</h2>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span>1️⃣</span><span>Pick a buzzword category</span></li>
            <li className="flex gap-2"><span>2️⃣</span><span>Enable microphone for auto-detection</span></li>
            <li className="flex gap-2"><span>3️⃣</span><span>Join your meeting and listen</span></li>
            <li className="flex gap-2"><span>4️⃣</span><span>Watch squares fill automatically!</span></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
