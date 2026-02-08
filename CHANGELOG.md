# Changelog

All notable changes to Booth will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Password strength indicator with real-time validation
- Delete account functionality for GDPR compliance
- Enhanced SEO meta tags and Open Graph support
- Professional README documentation

## [1.0.0] - 2026-02-07

### Added
- **Core Features**
  - Trade show management with full CRUD operations
  - Dashboard with alerts, stats, and shipping timeline
  - Quick Look card view with attendee badges
  - List view with inline editing
  - Calendar view with drag-and-drop
  - Budget tracking and ROI analytics

- **Multi-Tenancy**
  - Organization management
  - User roles (Owner, Admin, Editor, Viewer)
  - Email invitations with secure tokens
  - Row-Level Security on all tables

- **Collaboration**
  - Team member management
  - Audit logging for all changes
  - Data export (CSV/JSON)
  - Activity timeline

- **Logistics**
  - Packing list management
  - Shipping tracking with cutoff dates
  - Hotel booking management
  - Document attachments

- **User Experience**
  - Autosave with debounce
  - Template system for recurring shows
  - Onboarding wizard
  - Responsive design (mobile-friendly)
  - PWA support
  - Dark mode

- **Security**
  - Supabase Auth integration
  - Password strength requirements
  - Role-based permissions
  - GDPR-compliant data export
  - Account deletion

### Changed
- Rebranded from "Trade Show Manager" to "Booth"
- Enhanced UI with gradients, shadows, and polish
- Improved card layouts with more status badges

### Technical
- Next.js 14 with App Router
- Supabase for backend (Postgres + Auth + Storage)
- Zustand for state management
- Tailwind CSS + Framer Motion
- TypeScript throughout

---

## Version History

- **1.0.0** - Initial release with full SaaS functionality
