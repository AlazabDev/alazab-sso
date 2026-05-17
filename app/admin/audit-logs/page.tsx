'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import axios from 'axios'

interface AuditLog {
  id: string
  userId: string
  email: string
  provider: string
  status: string
  ipAddress: string
  timestamp: string
  duration?: number
  errorMessage?: string
}

export default function AuditLogsPage() {
  const { user, isLoading } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ provider: '', status: '' })
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, isLoading])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('/api/admin/audit-logs', {
          params: filter,
        })
        setLogs(response.data.logs)
        setMetrics(response.data.metrics)
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [filter])

  if (isLoading || loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Audit Logs</h1>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-sm text-gray-600">Total Events</div>
              <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-sm text-gray-600">Active Sessions</div>
              <div className="text-2xl font-bold">
                {metrics.sessionMetrics?.activeSessions}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-2xl font-bold">
                {metrics.providerMetrics?.[0]?.successRate?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-sm text-gray-600">
                Suspicious Activity
              </div>
              <div className="text-2xl font-bold">
                {metrics.suspiciousActivity?.length}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Provider
              </label>
              <select
                value={filter.provider}
                onChange={(e) =>
                  setFilter({ ...filter, provider: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All Providers</option>
                <option value="google">Google</option>
                <option value="entra">Microsoft Entra</option>
                <option value="apple">Apple</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{log.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {log.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.duration ? `${log.duration}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
