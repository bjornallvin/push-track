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
  pushups: number
  timestamp: number
}

interface ProgressChartProps {
  logs: DailyLog[]
  startDate: string
  duration: number
  currentDay: number
}

export function ProgressChart({
  logs,
  startDate,
  duration,
  currentDay,
}: ProgressChartProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    // Create a map of date -> pushups for quick lookup
    const logsMap = new Map(logs.map((log) => [log.date, log.pushups]))

    // Generate all dates from start to current day
    const dates: string[] = []
    const pushupsData: number[] = []

    const start = new Date(startDate)

    for (let i = 0; i < Math.min(currentDay, duration); i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      dates.push(dateStr)

      // Use logged value or 0 if missed
      const pushups = logsMap.get(dateStr) ?? 0
      pushupsData.push(pushups)
    }

    setChartData({
      labels: dates.map((date, index) => `Day ${index + 1}`),
      datasets: [
        {
          label: 'Pushups',
          data: pushupsData,
          backgroundColor: pushupsData.map((pushups) =>
            pushups === 0
              ? 'rgba(239, 68, 68, 0.6)' // Red for missed days
              : 'rgba(59, 130, 246, 0.6)' // Blue for logged days
          ),
          borderColor: pushupsData.map((pushups) =>
            pushups === 0 ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)'
          ),
          borderWidth: 1,
        },
      ],
    })
  }, [logs, startDate, duration, currentDay])

  if (!chartData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Chart</CardTitle>
          <CardDescription>
            No data yet. Log your first pushup count to see your progress!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No logs yet</p>
        </CardContent>
      </Card>
    )
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable for performance with up to 365 data points
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
            return `${context.parsed.y} pushups`
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
    <Card>
      <CardHeader>
        <CardTitle>Progress Chart</CardTitle>
        <CardDescription>
          Blue bars = logged days • Red bars = missed days (0 pushups)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[40vh] min-h-[200px] max-h-[400px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
