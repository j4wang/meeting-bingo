import { CATEGORIES } from '../data/categories'
import type { CategoryId } from '../types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface CategorySelectProps {
  onSelect: (categoryId: CategoryId) => void
  onBack: () => void
}

const SAMPLES: Record<CategoryId, string[]> = {
  agile: ['sprint', 'backlog', 'story points', 'retrospective'],
  corporate: ['synergy', 'circle back', 'ROI', 'low-hanging fruit'],
  tech: ['kubernetes', 'CI/CD', 'microservices', 'observability'],
}

export function CategorySelect({ onSelect, onBack }: CategorySelectProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Choose Your Buzzword Pack</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Card key={cat.id} className="flex flex-col items-center text-center space-y-3 p-6">
              <span className="text-4xl">{cat.icon}</span>
              <h2 className="text-lg font-semibold text-gray-900">{cat.name}</h2>
              <p className="text-sm text-gray-500">{cat.description}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {SAMPLES[cat.id].map((w) => (
                  <span key={w} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {w}
                  </span>
                ))}
              </div>
              <Button variant="primary" className="w-full mt-auto" onClick={() => onSelect(cat.id)}>
                Select
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
