'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import axios from 'axios'

interface LinkedAccount {
  provider: string
  email: string
  linkedAt: string
}

export function AccountLinking() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLinkedAccounts()
  }, [])

  const fetchLinkedAccounts = async () => {
    try {
      const response = await axios.get('/api/user/accounts')
      setAccounts(response.data.accounts || [])
    } catch (err) {
      setError('Failed to load linked accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkAccount = async (provider: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/user/accounts/link', {
        provider
      })
      await fetchLinkedAccounts()
    } catch (err) {
      setError(`Failed to link ${provider} account`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlinkAccount = async (provider: string) => {
    try {
      setIsLoading(true)
      await axios.post(`/api/user/accounts/unlink`, {
        provider
      })
      await fetchLinkedAccounts()
    } catch (err) {
      setError(`Failed to unlink ${provider} account`)
    } finally {
      setIsLoading(false)
    }
  }

  const providers = ['google', 'apple', 'facebook', 'github', 'entra']
  const linkedProviders = accounts.map(a => a.provider)
  const unlinkedProviders = providers.filter(p => !linkedProviders.includes(p))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Linked Accounts</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect or disconnect your accounts to this platform
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {accounts.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Connected Accounts</h4>
            <div className="space-y-2">
              {accounts.map(account => (
                <div
                  key={account.provider}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{account.provider}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Linked on {new Date(account.linkedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnlinkAccount(account.provider)}
                    disabled={isLoading}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {unlinkedProviders.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Available Providers</h4>
            <div className="space-y-2">
              {unlinkedProviders.map(provider => (
                <div
                  key={provider}
                  className="flex items-center justify-between p-3 border rounded-lg opacity-75"
                >
                  <p className="font-medium capitalize">{provider}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkAccount(provider)}
                    disabled={isLoading}
                  >
                    Link
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
