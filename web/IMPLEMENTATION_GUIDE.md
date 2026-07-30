# P1 VoIP Platform - Implementation Guide

## ✅ Completed Foundation (Phase 1)

### Configuration Files Created:
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript strict mode enabled
- `tailwind.config.ts` - Dark theme (black) with custom colors, NO grey
- `postcss.config.js` - Tailwind integration
- `.env.example` - Environment variables template
- `src/styles/globals.css` - Tailwind directives + dark theme utilities

### Database & Models:
- `src/lib/db.ts` - MongoDB connection with pooling
- `src/models/User.ts` - User schema with role, balance, settings
- `src/models/CallCampaign.ts` - Campaign tracking
- `src/models/CallRecord.ts` - Call records with recording support
- `src/models/Greeting.ts` - Audio greetings (global + custom)
- `src/models/Transaction.ts` - Billing transactions
- `src/models/Agent.ts` - Agent management

### Authentication:
- `src/lib/auth.ts` - NextAuth configuration + password hashing
- `src/components/SessionProvider.tsx` - NextAuth session provider
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `src/app/api/auth/register/route.ts` - User registration API
- `src/types/index.ts` - TypeScript types for all entities

### Pages Created:
- `src/app/page.tsx` - Landing page with features
- `src/app/layout.tsx` - Root layout with SessionProvider
- `src/app/auth/login/page.tsx` - Login form
- `src/app/auth/signup/page.tsx` - Signup form
- `src/app/dashboard/page.tsx` - Dashboard with stats
- `src/app/dashboard/layout.tsx` - Dashboard wrapper with sidebar

---

## 🔧 Still Needed (Phase 2 & 3)

### Critical Pages (Core Features):
1. **Dialer Module** (`src/app/dashboard/dialer/page.tsx`)
   - Campaign creation form
   - TXT file upload
   - Real-time progress counter
   - Start/Pause/Stop buttons
   - Call history table

2. **Call History** (`src/app/dashboard/calls/page.tsx`)
   - Call records table (paginated)
   - Filters: status, date range, campaign
   - Call detail modal with recording player
   - DTMF display

3. **Greetings Management** (`src/app/dashboard/greetings/page.tsx`)
   - Global greeting library (cards with preview)
   - Custom greeting upload
   - FFmpeg conversion
   - Delete option

4. **Agents Management** (`src/app/dashboard/agents/page.tsx`)
   - Agent list table
   - Create/edit/delete agents
   - QR code generation
   - Live call status

5. **Billing** (`src/app/dashboard/billing/page.tsx`)
   - Balance display
   - Topup form (amount input)
   - Transaction history table
   - Export to CSV

6. **Settings** (`src/app/dashboard/settings/page.tsx`)
   - Edit profile (name, username)
   - Caller ID setting
   - Default audio script selector
   - Notification preferences
   - API key management (show/regenerate)

### Admin Pages:
1. **Admin Dashboard** (`src/app/dashboard/admin/page.tsx`)
   - Platform analytics (total calls, revenue, topUsers)
   - User activity chart
   - System health status

2. **Admin Users** (`src/app/dashboard/admin/users/page.tsx`)
   - User list with search/filter
   - Topup form (admin can add balance)
   - Deactivate/activate users
   - View user stats

3. **Admin Billing** (`src/app/dashboard/admin/billing/page.tsx`)
   - Transaction log
   - Cost rate settings
   - Payment provider configuration
   - Export reports

4. **Admin Monitoring** (`src/app/dashboard/admin/monitoring/page.tsx`)
   - All live calls across all users
   - Stop any campaign
   - System metrics

### API Routes (Most Critical):
```
POST   /api/campaigns           → Create campaign
GET    /api/campaigns/:id       → Get campaign details
PATCH  /api/campaigns/:id       → Update campaign
POST   /api/campaigns/:id/start → Start campaign
POST   /api/campaigns/:id/pause → Pause campaign
POST   /api/campaigns/:id/stop  → Stop campaign

GET    /api/calls               → List calls with filters
GET    /api/calls/:id           → Call details
GET    /api/recordings/:id      → Stream recording

GET    /api/greetings           → List all greetings
POST   /api/greetings           → Upload custom greeting
DELETE /api/greetings/:id       → Delete greeting

GET    /api/agents              → List agents
POST   /api/agents              → Create agent
PATCH  /api/agents/:id          → Update agent
DELETE /api/agents/:id          → Delete agent

GET    /api/billing/balance     → Get user balance
POST   /api/billing/topup       → Request topup
GET    /api/billing/transactions → Transaction history

GET    /api/admin/users         → List all users (admin)
POST   /api/admin/users/:id/topup → Add balance to user (admin)
GET    /api/admin/analytics     → Platform stats (admin)

GET    /api/asterisk/campaigns  → Bridge to existing P1 bot
POST   /api/asterisk/call       → Originate call
```

### Utility Functions:
- `src/lib/formatters.ts` - Date, currency, phone formatters (camelCase)
- `src/lib/validators.ts` - Zod schemas for all forms
- `src/lib/apiClient.ts` - Fetch wrapper with auth headers

### Components (Reusable):
- `src/components/ui/Button.tsx` - Custom button variants
- `src/components/ui/Card.tsx` - Card wrapper
- `src/components/ui/Table.tsx` - Table component with sorting
- `src/components/ui/Modal.tsx` - Modal/Dialog
- `src/components/ui/Input.tsx` - Form input
- `src/components/ui/Select.tsx` - Dropdown select
- `src/components/dashboard/StatsCard.tsx` - Dashboard stat cards
- `src/components/dashboard/CampaignForm.tsx` - Campaign creation
- `src/components/dashboard/CallTable.tsx` - Call records table
- `src/components/dashboard/RecordingPlayer.tsx` - HTML5 audio player
- `src/components/admin/UserTopup.tsx` - Admin topup form

---

## 🚀 Quick Start After Files Created

### 1. Install Dependencies
```bash
cd D:\Work\P1\P1\web
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env.local
# Edit .env.local with your values:
# - DATABASE_URL (your MongoDB URI)
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
# - ASTERISK_* variables
```

### 3. Run Development Server
```bash
npm run dev
# Visit http://localhost:3000
```

### 4. Create Demo Admin Account
```bash
# Via mongosh:
use p1_web
db.users.insertOne({
  email: 'admin@test.com',
  username: 'admin',
  fullName: 'Admin User',
  passwordHash: '$2a$10$...', // Hash of 'password123'
  role: 'admin',
  accountBalance: 10000000, // €100,000 in cents
  isActive: true,
  apiKey: 'pk_demo_admin',
  settings: {
    notificationsEnabled: true,
    emailNotifications: false,
    selectedAudio: 'test'
  }
})
```

---

## 📋 Implementation Priority

**Must Have (Week 1):**
1. Dialer page + campaign execution
2. Call history page
3. Billing topup (admin only for MVP)
4. Authentication complete

**Important (Week 2):**
1. Greetings management
2. Agent management
3. Admin panel basics
4. Recording playback

**Nice to Have (Week 3):**
1. Advanced analytics
2. CSV export
3. WebSocket real-time updates
4. Payment provider abstraction (crypto-ready)

---

## 🔌 Asterisk Integration Points

The web platform bridges to existing P1 bot via:
- **Originate calls:** `POST /api/asterisk/call` → `ami.action('Originate', ...)`
- **Monitor campaigns:** WebSocket stream from `asterisk/instance.js` dtmfEmitter
- **Recording paths:** `callRecord.recordingPath = "/var/lib/asterisk/recordings/..."`
- **Extension selection:** `settings.selectedAudio` used as `context` in Originate

---

## 🎨 UI/Color Reference

**All components use these Tailwind classes:**
- `bg-black` - Page background
- `bg-surface` (`#111111`) - Cards, inputs
- `text-textPrimary` (`#ffffff`) - Main text
- `text-textSecondary` (`#94a3b8`) - Muted text
- `btn-primary` - Accent buttons (green `#10b981`)
- `btn-secondary` - Secondary buttons (surface)
- `btn-danger` - Danger buttons (red `#ef4444`)
- `border-border` - All borders

**NO GREY COLORS.** If you see `text-gray-*`, use `text-textSecondary` instead.

---

## 📦 Deployment (VPS)

After implementation, deploy to 185.130.46.72:

```bash
# Build
npm run build

# Start with PM2
pm2 start "npm run start" --name "p1-web"

# Setup firewall
sudo ufw allow 3000/tcp
```

---

## ✨ Code Standards

- **All code:** camelCase (files, functions, variables)
- **No grey colors:** Only accent green, black, white, slate-400
- **TypeScript:** Strict mode, no `any` types
- **Database:** Always use models, never raw mongo
- **API errors:** Return `{success: false, error: "message"}` 
- **Forms:** Use React Hook Form + Zod validation

---

## Next Steps

1. Create remaining pages (start with Dialer)
2. Build API routes (start with campaigns CRUD)
3. Integrate Asterisk bridge in API
4. Add real-time WebSocket updates
5. Test complete campaign flow (create → launch → monitor → DTMF)
6. Build admin panel
7. Deploy to VPS
