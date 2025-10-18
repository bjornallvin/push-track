'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Challenge, DailyLog } from '@/lib/challenge/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editedChallenge, setEditedChallenge] = useState<Partial<Challenge>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Log edit states
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null)
  const [editedLogData, setEditedLogData] = useState<Partial<DailyLog>>({})

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token')
    if (!storedToken) {
      router.push('/admin')
      return
    }
    setToken(storedToken)
  }, [router])

  useEffect(() => {
    if (!token) return

    async function fetchChallenge() {
      try {
        const response = await fetch(`/api/admin/challenge/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch challenge')
        }

        const data = await response.json()
        setChallenge(data.challenge)
        setLogs(data.logs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChallenge()
  }, [params.id, token])

  const handleDelete = async () => {
    if (!token || !confirm('Are you sure you want to delete this challenge?')) return

    try {
      const response = await fetch(`/api/admin/challenge/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete challenge')
      }

      router.push('/admin')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete challenge')
    }
  }

  const handleRecalculate = async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/challenge/${params.id}/recalculate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to recalculate metrics')
      }

      alert('Metrics recalculated successfully')
      // Refresh data
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to recalculate metrics')
    }
  }

  const handleEditStart = () => {
    setEditedChallenge({
      email: challenge?.email,
      status: challenge?.status,
      duration: challenge?.duration,
      startDate: challenge?.startDate,
    })
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditedChallenge({})
  }

  const handleEditSave = async () => {
    if (!token || !challenge) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/challenge/${params.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedChallenge),
      })

      if (!response.ok) {
        throw new Error('Failed to update challenge')
      }

      // Refresh data
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update challenge')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogEdit = (log: DailyLog) => {
    setEditingLog(log)
    setEditedLogData({
      date: log.date,
      activity: log.activity,
      reps: log.reps,
    })
  }

  const handleLogEditCancel = () => {
    setEditingLog(null)
    setEditedLogData({})
  }

  const handleLogEditSave = async () => {
    if (!token || !editingLog) return

    try {
      const response = await fetch(`/api/admin/challenge/${params.id}/log`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: editingLog.timestamp,
          ...editedLogData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update log')
      }

      // Refresh data
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update log')
    }
  }

  const handleLogDelete = async (log: DailyLog) => {
    if (!token || !confirm('Are you sure you want to delete this log entry?')) return

    try {
      const response = await fetch(`/api/admin/challenge/${params.id}/log`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: log.timestamp,
          delete: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete log')
      }

      // Refresh data
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete log')
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (error || !challenge) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error || 'Challenge not found'}
        </div>
        <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Challenge Details</h1>
          <p className="text-sm text-muted-foreground font-mono">{challenge.id}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleEditCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEditStart}>
                Edit Challenge
              </Button>
              <Button variant="outline" onClick={handleRecalculate}>
                Recalculate Metrics
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Challenge
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Challenge Info */}
        <Card>
          <CardHeader>
            <CardTitle>Challenge Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedChallenge.email || ''}
                    onChange={(e) =>
                      setEditedChallenge({ ...editedChallenge, email: e.target.value })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{challenge.email || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                {isEditing ? (
                  <select
                    value={editedChallenge.status || challenge.status}
                    onChange={(e) =>
                      setEditedChallenge({
                        ...editedChallenge,
                        status: e.target.value as 'active' | 'completed' | 'abandoned',
                      })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                    <option value="abandoned">abandoned</option>
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">{challenge.status}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedChallenge.duration || challenge.duration}
                    onChange={(e) =>
                      setEditedChallenge({
                        ...editedChallenge,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{challenge.duration} days</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedChallenge.startDate || challenge.startDate}
                    onChange={(e) =>
                      setEditedChallenge({ ...editedChallenge, startDate: e.target.value })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{challenge.startDate}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(challenge.createdAt).toLocaleString('sv-SE')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Timezone</label>
                <p className="text-sm text-muted-foreground">{challenge.timezone}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Activities</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {challenge.activities.map((activity) => (
                  <span
                    key={activity}
                    className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs"
                  >
                    {activity} ({challenge.activityUnits?.[activity] || 'reps'})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No logs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {editingLog?.timestamp === log.timestamp ? (
                          <Input
                            type="date"
                            value={editedLogData.date || log.date}
                            onChange={(e) =>
                              setEditedLogData({ ...editedLogData, date: e.target.value })
                            }
                            className="w-40"
                          />
                        ) : (
                          log.date
                        )}
                      </TableCell>
                      <TableCell>
                        {editingLog?.timestamp === log.timestamp ? (
                          <select
                            value={editedLogData.activity || log.activity}
                            onChange={(e) =>
                              setEditedLogData({ ...editedLogData, activity: e.target.value })
                            }
                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          >
                            {challenge.activities.map((activity) => (
                              <option key={activity} value={activity}>
                                {activity}
                              </option>
                            ))}
                          </select>
                        ) : (
                          log.activity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingLog?.timestamp === log.timestamp ? (
                          <Input
                            type="number"
                            value={editedLogData.reps ?? log.reps}
                            onChange={(e) =>
                              setEditedLogData({
                                ...editedLogData,
                                reps: parseInt(e.target.value),
                              })
                            }
                            className="w-24"
                          />
                        ) : (
                          log.reps
                        )}
                      </TableCell>
                      <TableCell>{challenge.activityUnits?.[log.activity] || 'reps'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('sv-SE')}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingLog?.timestamp === log.timestamp ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleLogEditCancel}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleLogEditSave}>
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLogEdit(log)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleLogDelete(log)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
