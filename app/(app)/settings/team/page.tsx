'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Users, Mail, Shield, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Member = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member' | 'super_admin'
  created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        role === 'admin'
          ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
          : 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30'
      )}
    >
      {role === 'admin' ? <Shield className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
      {role === 'admin' ? 'Admin' : 'Member'}
    </span>
  )
}

export default function TeamSettingsPage() {
  const shouldReduceMotion = useReducedMotion()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Role change state
  const [roleChangeId, setRoleChangeId] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/team')
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Failed to load team members')
        return
      }
      setMembers(json.data ?? [])
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteMessage(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setInviteMessage({ type: 'error', text: json.error?.message ?? 'Failed to send invite' })
      } else {
        setInviteMessage({ type: 'success', text: `Invite sent to ${inviteEmail.trim()}` })
        setInviteEmail('')
      }
    } catch {
      setInviteMessage({ type: 'error', text: 'Network error — please try again' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    setRoleChangeId(memberId)
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        // Re-fetch to reset the dropdown to actual state
        await fetchMembers()
        return
      }
      // Optimistic update
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch {
      await fetchMembers()
    } finally {
      setRoleChangeId(null)
    }
  }

  const animProps = shouldReduceMotion
    ? {}
    : { variants: containerVariants, initial: 'hidden', animate: 'visible' }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            Team Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite members and manage Admin / Member roles
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <motion.div className="space-y-6" {...animProps}>
        {/* Invite form */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Invite Team Member
          </h3>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              aria-label="Email address to invite"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={inviteLoading || !inviteEmail.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {inviteLoading ? 'Sending…' : 'Send Invite'}
            </button>
          </form>

          {inviteMessage && (
            <div
              className={cn(
                'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                inviteMessage.type === 'success'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              )}
            >
              {inviteMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {inviteMessage.text}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Invited members receive an email to set their password. They are assigned the Member role by default.
          </p>
        </motion.div>

        {/* Members table */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Current Members</h3>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No team members yet. Send an invitation above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name / Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {member.full_name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {/* Only show role change for non-super_admin members; skip for current user */}
                        {member.role !== 'super_admin' && member.id !== currentUserId ? (
                          <select
                            value={member.role}
                            disabled={roleChangeId === member.id}
                            onChange={e =>
                              handleRoleChange(member.id, e.target.value as 'admin' | 'member')
                            }
                            aria-label={`Change role for ${member.email}`}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
