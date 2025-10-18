'use client'

import { useEffect, useState } from 'react'
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
  logs: DailyLog[]
  startDate: string
  duration: number
  currentDay: number
  activities: string[]
  activityUnits: Record<string, ActivityUnit>
}

export function ProgressChart({
  logs,
  startDate,
  duration,
  currentDay,
  activities,
  activityUnits,
}: ProgressChartProps) {
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
                Colored bars = logged days • Red bars = missed days (0 {unit})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[30vh] min-h-[200px] max-h-[300px]">
                <Bar data={chartData} options={options} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
