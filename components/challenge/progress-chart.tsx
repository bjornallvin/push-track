'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityUnit } from '@/lib/challenge/types'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface DailyLog {
  date: string
  activity: string
  reps: number
  timestamp: number
  // Deprecated
  pushups?: number
}

const CHART_COLORS = [
  { bg: 'rgba(147, 51, 234, 0.6)', border: 'rgba(147, 51, 234, 1)' }, // purple
  { bg: 'rgba(59, 130, 246, 0.6)', border: 'rgba(59, 130, 246, 1)' }, // blue
  { bg: 'rgba(249, 115, 22, 0.6)', border: 'rgba(249, 115, 22, 1)' }, // orange
  { bg: 'rgba(16, 185, 129, 0.6)', border: 'rgba(16, 185, 129, 1)' }, // emerald
  { bg: 'rgba(99, 102, 241, 0.6)', border: 'rgba(99, 102, 241, 1)' }, // indigo
]

const MISSED_COLOR = { bg: 'rgba(239, 68, 68, 0.6)', border: 'rgba(239, 68, 68, 1)' } // red

interface ProgressChartProps {
  challengeId: string
  logs: DailyLog[]
  startDate: string
  duration: number
  currentDay: number
  activities: string[]
  activityUnits: Record<string, ActivityUnit>
}

export function ProgressChart({
  challengeId,
  logs,
  startDate,
  duration,
  currentDay,
  activities,
  activityUnits,
}: ProgressChartProps) {
  const router = useRouter()

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Charts</CardTitle>
          <CardDescription>
            No data yet. Log your first activities to see your progress!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No logs yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, activityIndex) => {
        const activityColor = CHART_COLORS[activityIndex % CHART_COLORS.length]
        const unit = activityUnits[activity] || 'reps'

        // Filter logs for this activity
        const activityLogs = logs.filter((log) => log.activity === activity)

        // Create a map of date -> reps for quick lookup
        const logsMap = new Map(
          activityLogs.map((log) => [log.date, log.reps ?? log.pushups ?? 0])
        )

        // Generate all dates from start to current day
        const dates: string[] = []
        const repsData: number[] = []

        const start = new Date(startDate)

        for (let i = 0; i < Math.min(currentDay, duration); i++) {
          const date = new Date(start)
          date.setDate(start.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]

          dates.push(dateStr)

          // Use logged value or 0 if missed
          const reps = logsMap.get(dateStr) ?? 0
          repsData.push(reps)
        }

        const chartData = {
          labels: dates.map((date, index) => `Day ${index + 1}`),
          datasets: [
            {
              label: activity,
              data: repsData,
              backgroundColor: repsData.map((reps) =>
                reps === 0 ? MISSED_COLOR.bg : activityColor.bg
              ),
              borderColor: repsData.map((reps) =>
                reps === 0 ? MISSED_COLOR.border : activityColor.border
              ),
              borderWidth: 1,
            },
          ],
        }

        const options = {
          responsive: true,
          maintainAspectRatio: false,
          animation: false as const,
          interaction: {
            mode: 'index' as const,
            intersect: false,
          },
          onClick: (event: any, elements: any[], chart: any) => {
            let index = -1

            // If clicked on a bar
            if (elements.length > 0) {
              index = elements[0].index
            } else {
              // Clicked somewhere else on chart (possibly label area)
              // Calculate which column was clicked based on x position
              const canvasPosition = chart.canvas.getBoundingClientRect()
              const x = event.native.clientX - canvasPosition.left
              const chartArea = chart.chartArea

              if (x >= chartArea.left && x <= chartArea.right) {
                const barWidth = (chartArea.right - chartArea.left) / dates.length
                index = Math.floor((x - chartArea.left) / barWidth)
              }
            }

            if (index >= 0 && index < dates.length) {
              const clickedDate = dates[index]
              const today = new Date().toISOString().split('T')[0]

              // Only navigate if date is not in the future
              if (clickedDate <= today) {
                router.push(`/challenge/${challengeId}/edit?date=${clickedDate}`)
              }
            }
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context: any) {
                  return `${context.parsed.y} ${unit}`
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
            x: {
              display: true,
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
              },
            },
          },
        }

        return (
          <Card key={activity}>
            <CardHeader>
              <CardTitle>{activity}</CardTitle>
              <CardDescription>
                Click bars or day labels to edit • Colored bars = logged days • Red bars = missed days (0 {unit})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="h-[30vh] min-h-[200px] max-h-[300px] cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const width = rect.width
                  const columnWidth = width / dates.length
                  const index = Math.floor(x / columnWidth)

                  if (index >= 0 && index < dates.length) {
                    const clickedDate = dates[index]
                    const today = new Date().toISOString().split('T')[0]

                    if (clickedDate <= today) {
                      router.push(`/challenge/${challengeId}/edit?date=${clickedDate}`)
                    }
                  }
                }}
              >
                <Bar data={chartData} options={options} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
