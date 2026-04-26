import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, AdminCard, StatusBadge } from '../../admin/AdminTable'

export const Route = createFileRoute('/admin/roles')({ component: AdminRolesPage })

const ROLES = [
  {
    name: 'super-admin',
    tone: 'primary' as const,
    members: ['Admin'],
    description: 'Full access including role management, MFA settings, and account deletion.',
    permissions: [
      'Manage admin accounts and roles',
      'Promote / demote any user',
      'Configure platform settings (Phase 5)',
      'Access all moderation queues',
      'View all analytics and audit logs',
    ],
  },
  {
    name: 'admin',
    tone: 'success' as const,
    members: [],
    description: 'Day-to-day moderation. Can act on every queue but cannot create or remove other admins.',
    permissions: [
      'Approve / reject submissions',
      'Hide comments, lock threads',
      'Resolve / dismiss reports',
      'Suspend or reinstate users',
      'View dashboard + analytics',
    ],
  },
  {
    name: 'editor',
    tone: 'warn' as const,
    members: [],
    description: 'Editorial only — Stories, Topics, Events, Featured (lands in Phase 3). No moderation powers.',
    permissions: [
      'Publish and edit Stories',
      'Curate Topics and Events',
      'Set Featured products',
      'No access to user management',
      'No access to moderation queues',
    ],
  },
  {
    name: 'maker',
    tone: 'neutral' as const,
    members: ['Everyone else'],
    description: 'Default role for every signed-up user. No admin-area access at all.',
    permissions: [
      'Submit and edit own products',
      'Reply to own comments',
      'Manage own waitlist and followers',
      'Cannot reach /admin/*',
    ],
  },
]

function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Roles & permissions" subtitle="Reference for who can do what. Edit a user's role from the Users page." />

      <ul className="space-y-4">
        {ROLES.map((r) => (
          <li key={r.name}>
            <AdminCard>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{r.name}</h3>
                  <StatusBadge tone={r.tone}>{r.members.length === 0 ? 'no members' : `${r.members.length} member${r.members.length === 1 ? '' : 's'}`}</StatusBadge>
                </div>
                {r.members.length > 0 && (
                  <p className="text-xs text-foreground-faint">Members: {r.members.join(', ')}</p>
                )}
              </div>
              <p className="text-sm text-foreground-muted mt-2">{r.description}</p>
              <ul className="mt-3 space-y-1.5">
                {r.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-success mt-0.5 flex-shrink-0" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </AdminCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
