# Booth 🎯

**Your trade show command center.**

Booth is a modern trade show management platform built for marketing teams and event professionals. Track shows, manage budgets, coordinate teams, and measure ROI — all in one place.

![Booth Screenshot](docs/screenshot.png)

## ✨ Features

### Core Management
- 📅 **Show Calendar** - All your trade shows in one view with drag-and-drop scheduling
- 💰 **Budget Tracking** - Track costs across booth fees, travel, shipping, services
- 👥 **Team Collaboration** - Multi-user access with role-based permissions
- 📊 **ROI Analytics** - Cost per lead, qualified lead rates, revenue attribution

### Logistics
- 📦 **Packing Lists** - Configurable checklists for booth kits, swag, and supplies
- 🚚 **Shipping Tracking** - Cutoff dates, tracking numbers, and shipping timelines
- 🏨 **Hotel Management** - Hotel bookings with confirmation tracking
- 📁 **Document Storage** - Attach vendor packets, layouts, and confirmations

### Collaboration
- 🔐 **Organizations** - Multi-tenant architecture for teams
- 👤 **User Roles** - Owner, Admin, Editor, Viewer permissions
- ✉️ **Email Invitations** - Invite team members via email
- 📝 **Audit Logging** - Track all changes for compliance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/booth.git
   cd booth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a new Supabase project
   - Run the migrations in `migrations/` folder (in order: 001, 002, 003...)
   - Copy your project URL and anon key

4. **Set up environment**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Desktop**: Tauri (optional)
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── layout/      # App shell, sidebar
│   ├── marketing/   # Landing page
│   ├── settings/    # Organization settings
│   ├── ui/          # Reusable UI components
│   └── views/       # Main view components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
├── services/        # API and external services
├── store/           # Zustand state management
└── types/           # TypeScript types
```

## 🔐 Security

- Row-Level Security (RLS) on all database tables
- Role-based access control (RBAC)
- Password strength requirements
- Audit logging for compliance
- Data export for GDPR compliance
- Account deletion support

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋 Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Email**: support@getbooth.app

---

Built with ❤️ by trade show professionals, for trade show professionals.
