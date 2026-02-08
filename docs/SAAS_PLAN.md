# SaaS Architecture Plan

## Overview

This document outlines the architecture needed to transform Trade Show Manager into a multi-tenant SaaS application with proper user controls, roles, and permissions.

---

## 1. Multi-Tenancy Model

### Organizations (Tenants)
Each customer company is an **Organization**. All data is scoped to an organization.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- e.g., "directlink" for URLs
  plan TEXT DEFAULT 'free',   -- free, pro, enterprise
  plan_seats INTEGER DEFAULT 3,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Scoping
Add `organization_id` to all data tables:

```sql
ALTER TABLE tradeshows ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE attendees ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE additional_files ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE activity_log ADD COLUMN organization_id UUID REFERENCES organizations(id);
```

---

## 2. User Management

### Users Table (extends Supabase Auth)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Organization Membership
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES user_profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);
```

---

## 3. Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Organization creator, full control | Everything + billing + delete org |
| **Admin** | Can manage users and all shows | CRUD shows, manage members, settings |
| **Editor** | Can create and edit shows | CRUD shows, upload files, add notes |
| **Viewer** | Read-only access | View shows, export data |

### Granular Permissions (Future)
```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,  -- e.g., 'shows.create', 'members.invite'
  description TEXT
);

CREATE TABLE role_permissions (
  role TEXT NOT NULL,
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role, permission_id)
);
```

---

## 4. Row-Level Security (RLS)

Supabase RLS policies ensure users only see their organization's data.

### Example: Tradeshows RLS
```sql
-- Enable RLS
ALTER TABLE tradeshows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see shows in their organization
CREATE POLICY "Users can view org shows" ON tradeshows
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Editors and above can insert
CREATE POLICY "Editors can create shows" ON tradeshows
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Policy: Editors and above can update
CREATE POLICY "Editors can update shows" ON tradeshows
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Policy: Admins can delete
CREATE POLICY "Admins can delete shows" ON tradeshows
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

---

## 5. Invitation System

### Invitations Table
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES user_profiles(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Invitation Flow
1. Admin enters email + role
2. System creates invitation record + sends email
3. Recipient clicks link with token
4. If new user → sign up flow → auto-join org
5. If existing user → auto-join org
6. Mark invitation as accepted

---

## 6. Authentication Flow

### Sign Up
1. User signs up via Supabase Auth
2. Trigger creates `user_profiles` record
3. User can create org OR accept invitation

### Sign In
1. Supabase Auth handles login
2. App fetches user's organizations
3. If multiple orgs → show org picker
4. Set active organization in session/context

### Session Context
```typescript
interface SessionContext {
  user: User;
  organization: Organization;
  membership: OrganizationMember;
  permissions: string[];
}
```

---

## 7. Frontend Changes

### Auth Components Needed
- `<LoginForm />` - Email/password + OAuth
- `<SignUpForm />` - New user registration
- `<ForgotPassword />` - Password reset
- `<InviteAccept />` - Accept invitation flow
- `<OrgPicker />` - Switch between organizations
- `<OrgSettings />` - Manage org details
- `<MembersList />` - View/manage members
- `<InviteMember />` - Send invitations
- `<RoleSelector />` - Assign roles

### Auth Context
```typescript
// hooks/use-auth.ts
export function useAuth() {
  return {
    user: User | null,
    organization: Organization | null,
    role: Role,
    isAdmin: boolean,
    isEditor: boolean,
    isViewer: boolean,
    signIn: (email, password) => Promise<void>,
    signOut: () => Promise<void>,
    switchOrg: (orgId) => Promise<void>,
  };
}
```

### Permission Checks
```typescript
// components/ui/permission-gate.tsx
export function PermissionGate({ 
  requires, 
  children, 
  fallback 
}: {
  requires: 'admin' | 'editor' | 'viewer';
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useAuth();
  const allowed = checkPermission(role, requires);
  return allowed ? children : fallback ?? null;
}

// Usage
<PermissionGate requires="editor">
  <Button onClick={createShow}>New Show</Button>
</PermissionGate>
```

---

## 8. API Changes

### All Queries Need Org Scope
```typescript
// Before
const shows = await supabase.from('tradeshows').select('*');

// After
const shows = await supabase
  .from('tradeshows')
  .select('*')
  .eq('organization_id', currentOrg.id);
```

### Create Operations Need Org ID
```typescript
// Before
await supabase.from('tradeshows').insert({ name, ... });

// After
await supabase.from('tradeshows').insert({ 
  name, 
  organization_id: currentOrg.id,
  created_by: user.id,
  ...
});
```

---

## 9. Billing Integration (Future)

### Stripe Integration Points
- Organization creation → Create Stripe customer
- Plan upgrade → Stripe checkout session
- Seat management → Prorate charges
- Webhooks → Handle subscription changes

### Plans Structure
```typescript
const PLANS = {
  free: {
    seats: 3,
    shows: 10,
    storage: '100MB',
    features: ['basic'],
  },
  pro: {
    seats: 10,
    shows: 'unlimited',
    storage: '10GB',
    features: ['basic', 'templates', 'exports', 'api'],
  },
  enterprise: {
    seats: 'unlimited',
    shows: 'unlimited',
    storage: '100GB',
    features: ['all', 'sso', 'audit-log', 'support'],
  },
};
```

---

## 10. Migration Path

### Phase 1: Auth Foundation
1. Add Supabase Auth to app
2. Create user_profiles table + trigger
3. Add login/signup UI
4. Require auth for all routes

### Phase 2: Organizations
1. Create organizations table
2. Create organization_members table
3. Add organization_id to all data tables
4. Backfill existing data to a default org
5. Add org context to app

### Phase 3: Roles & Permissions
1. Implement RLS policies
2. Add role checks to frontend
3. Add permission gates to UI
4. Test all CRUD operations per role

### Phase 4: Invitations
1. Create invitations table
2. Build invite UI
3. Set up email sending (Resend/SendGrid)
4. Build accept invitation flow

### Phase 5: Polish
1. Org settings page
2. Member management UI
3. Activity log (who did what)
4. Audit trail for compliance

---

## 11. Security Considerations

- **RLS is mandatory** - Never trust client-side role checks alone
- **Validate on server** - Double-check permissions in API routes
- **Audit logging** - Track who accessed/modified what
- **Session management** - Implement proper token refresh
- **Rate limiting** - Prevent abuse
- **Input validation** - Sanitize all user input
- **HTTPS only** - Enforce secure connections

---

## 12. Database Schema Diagram

```
┌─────────────────┐     ┌─────────────────────┐
│  organizations  │────<│ organization_members │
└─────────────────┘     └─────────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐     ┌─────────────────┐
│   tradeshows    │     │  user_profiles  │
└─────────────────┘     └─────────────────┘
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  attendees  │ │    files    │ │  activity   │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## Implementation Status

### ✅ Phase 1: Auth Foundation - COMPLETE
- [x] SQL migration: `migrations/002_auth_foundation.sql`
- [x] Auth types: `src/types/auth.ts`
- [x] Auth service: `src/services/auth-service.ts`
- [x] Auth store (Zustand): `src/store/auth-store.ts`
- [x] Login/SignUp/ForgotPassword forms
- [x] AuthGuard component (wraps app)
- [x] OrganizationSetup (for new users)
- [x] UserMenu (in toolbar)
- [x] PermissionGate component
- [x] MembersModal (invite/manage team)
- [x] RLS policies for all tables

### ✅ Phase 2: Org-Scoped Data - COMPLETE
- [x] Added `organizationId` and `createdBy` to TradeShow type
- [x] Updated `supabase-service.ts` with org context helpers
- [x] Queries filter by organization when available
- [x] New records automatically get org/user context
- [x] Permission gates added to UI (New, Save, Delete, Duplicate)
- [ ] Backfill existing data to default org (manual step)
- [ ] Org settings page (future)

### ✅ Phase 3: Invitations - COMPLETE
- [x] Email service (`src/services/email-service.ts`)
  - Supports Resend, SendGrid, or console (dev mode)
  - Beautiful HTML email template
- [x] API route for sending invites (`src/app/api/invite/route.ts`)
- [x] Accept invitation page (`src/app/invite/page.tsx`)
  - Token validation
  - Expired/invalid handling
  - Sign-in flow for unauthenticated users
  - Accept flow for authenticated users
- [x] Updated members modal to send emails
- [x] Auth guard handles pending invite tokens after login

### ✅ Phase 4: Polish - COMPLETE
- [x] Org Settings Modal (`src/components/settings/org-settings-modal.tsx`)
  - General tab: rename organization, view plan
  - Members tab: invite/manage team (embedded)
  - Audit Log tab: view all activity (admin only)
  - Danger Zone tab: delete org placeholder (owner only)
- [x] Audit Service (`src/services/audit-service.ts`)
  - Log actions: create, update, delete, login, invites, etc.
  - Fetch with filters (action, resource, date range)
- [x] Audit Log UI (`src/components/settings/audit-log.tsx`)
  - Paginated list with filters
  - Action icons and colors
  - User attribution
- [x] DB Migration (`migrations/003_audit_log.sql`)
  - audit_log table with RLS
  - Auto-triggers for tradeshows and members
  - Retention cleanup function
- [x] User Menu → Organization Settings link

### 🔲 Phase 5: Billing (Future)
- [ ] Stripe integration
- [ ] Plan management

---

## Next Steps

1. Run migration: `migrations/002_auth_foundation.sql` in Supabase
2. Enable Supabase Auth providers (Email, optional OAuth)
3. Test login/signup flow
4. Add org scoping to trade show queries

This plan supports scaling from single-user to enterprise multi-tenant SaaS.
