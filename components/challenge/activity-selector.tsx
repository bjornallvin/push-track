'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActivityUnit } from '@/lib/challenge/types'

const PRESET_ACTIVITIES: Array<{ name: string; unit: ActivityUnit }> = [
  { name: 'Push-ups', unit: 'reps' },
  { name: 'Pull-ups', unit: 'reps' },
  { name: 'Abs', unit: 'reps' },
  { name: 'Squats', unit: 'reps' },
]

const UNIT_OPTIONS: ActivityUnit[] = ['reps', 'minutes', 'seconds', 'km', 'miles', 'meters', 'hours']

interface ActivitySelectorProps {
  selectedActivities: string[]
  activityUnits: Record<string, ActivityUnit>
  onChange: (activities: string[], units: Record<string, ActivityUnit>) => void
  maxActivities?: number
}

export function ActivitySelector({
  selectedActivities,
  activityUnits,
  onChange,
  maxActivities = 5,
}: ActivitySelectorProps) {
  const [customActivity, setCustomActivity] = useState('')
  const [customUnit, setCustomUnit] = useState<ActivityUnit>('reps')
  const [error, setError] = useState<string | null>(null)

  const handlePresetToggle = (activity: string, unit: ActivityUnit) => {
    if (selectedActivities.includes(activity)) {
      const newActivities = selectedActivities.filter((a) => a !== activity)
      const newUnits = { ...activityUnits }
      delete newUnits[activity]
      onChange(newActivities, newUnits)
    } else {
      if (selectedActivities.length >= maxActivities) {
        setError(`Maximum ${maxActivities} activities allowed`)
        return
      }
      onChange([...selectedActivities, activity], { ...activityUnits, [activity]: unit })
      setError(null)
    }
  }

  const handleAddCustom = () => {
    const trimmed = customActivity.trim()

    if (!trimmed) {
      setError('Activity name cannot be empty')
      return
    }

    if (trimmed.length > 30) {
      setError('Activity name must be 30 characters or less')
      return
    }

    if (!/^[\p{L}\p{N}\s\-]+$/u.test(trimmed)) {
      setError('Activity name can only contain letters, numbers, spaces, and hyphens')
      return
    }

    // Check for duplicate (case-insensitive)
    if (selectedActivities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setError('This activity is already selected')
      return
    }

    if (selectedActivities.length >= maxActivities) {
      setError(`Maximum ${maxActivities} activities allowed`)
      return
    }

    onChange([...selectedActivities, trimmed], { ...activityUnits, [trimmed]: customUnit })
    setCustomActivity('')
    setCustomUnit('reps')
    setError(null)
  }

  const handleRemove = (activity: string) => {
    const newActivities = selectedActivities.filter((a) => a !== activity)
    const newUnits = { ...activityUnits }
    delete newUnits[activity]
    onChange(newActivities, newUnits)
    setError(null)
  }

  const handleUnitChange = (activity: string, unit: ActivityUnit) => {
    onChange(selectedActivities, { ...activityUnits, [activity]: unit })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base mb-3 block">Select Activities (1-{maxActivities})</Label>

        {/* Preset Activities */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESET_ACTIVITIES.map(({ name, unit }) => {
            const isSelected = selectedActivities.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => handlePresetToggle(name, unit)}
                className={`
                  h-12 px-4 rounded-lg font-medium transition-all border-2
                  ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600 shadow-lg'
                      : 'bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                  }
                `}
              >
                {isSelected && '✓ '}
                {name}
              </button>
            )
          })}
        </div>

        {/* Custom Activity Input */}
        <div className="space-y-2">
          <Label className="text-sm">Add Custom Activity</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Activity name..."
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustom()
                }
              }}
              className="h-12 flex-1"
              maxLength={30}
            />
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as ActivityUnit)}
              className="h-12 px-3 rounded-md border-2 border-input bg-background text-sm"
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddCustom}
              disabled={!customActivity.trim() || selectedActivities.length >= maxActivities}
              className="h-12 w-12"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selected Activities */}
      {selectedActivities.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Selected Activities
            </p>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {selectedActivities.length}/{maxActivities}
            </span>
          </div>
          <div className="space-y-2">
            {selectedActivities.map((activity) => (
              <div
                key={activity}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 rounded-lg"
              >
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {activity}
                </span>
                <select
                  value={activityUnits[activity] || 'reps'}
                  onChange={(e) => handleUnitChange(activity, e.target.value as ActivityUnit)}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-background"
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(activity)}
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Help Text */}
      <p className="text-sm text-muted-foreground">
        Choose preset activities or add your own custom exercises
      </p>
    </div>
  )
}
