'use client'

import { useEffect, useState } from 'react'
import { LoginForm } from '@/components/admin/login-form'
import { ChallengeTable } from '@/components/admin/challenge-table'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing token
    const storedToken = localStorage.getItem('admin_token')
    if (storedToken) {
      setToken(storedToken)
    }
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!token) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div>
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div />
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
        </div>
      </div>
      <ChallengeTable token={token} />
    </div>
  )
}
