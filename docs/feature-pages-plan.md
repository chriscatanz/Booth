# Feature Pages Plan

## Current State

### Existing Feature Pages (6)
- `/features/calendar` - Trade Show Calendar
- `/features/budget` - Budget Management  
- `/features/team` - Team Collaboration
- `/features/logistics` - Shipping & Logistics
- `/features/assets` - Asset Management
- `/features/analytics` - ROI & Analytics

### Missing Feature Pages (3 recommended)
1. **AI Integration** ⭐ (HIGH PRIORITY)
2. **Data Import/Export**
3. **Templates**

*Small features that don't need their own page: Notifications, Custom Fields, Audit Log*

---

## 1. AI Integration Feature Page

**Route:** `/features/ai`

### Hero Section
- **Title:** "Your AI-Powered Trade Show Assistant"
- **Subtitle:** "AI Integration"
- **Description:** "From generating booth talking points to creating post-show reports, let AI handle the content creation while you focus on relationships."
- **Icon:** Sparkles (✨)
- **Color:** `#8B5CF6` (purple/violet)

### Benefits (6)
1. Generate booth talking points tailored to each show's audience
2. Create compelling social media posts announcing your attendance
3. Draft personalized follow-up emails for leads
4. Produce comprehensive post-show reports in minutes
5. Build show-specific packing checklists automatically
6. Get answers about your shows instantly via AI chat

### Capabilities (6)

#### 1. One-Click Content Generation
**Description:** Select a show and content type, hit generate. Talking points, social posts, emails, reports, and checklists — all customized to your specific show.

📸 **Screenshot:** AI Generate tab showing content type selector with a generated social post preview

#### 2. Smart Document Extraction
**Description:** Upload a vendor packet, exhibitor guide, or contract — AI extracts show details automatically and populates your show record.

📸 **Screenshot:** One-Click Show modal showing extracted fields from a PDF with confidence indicators

#### 3. AI Chat Assistant
**Description:** Ask questions about your trade show program. "What's my total Q1 spend?" "Which shows have missing hotel confirmations?" Get instant answers.

📸 **Screenshot:** AI Chat widget open with a conversation showing a question about upcoming deadlines

#### 4. Branding-Aware Content
**Description:** Set your company and product descriptions once. AI uses this context to generate on-brand content that sounds like you, not a robot.

📸 **Screenshot:** Settings → Branding section showing company/product description fields

#### 5. Show-Specific Context
**Description:** Select which show to focus on. AI pulls in all details — dates, location, booth size, attendees — to create relevant, specific content.

📸 **Screenshot:** AI panel with show selector dropdown expanded, showing list of upcoming shows

#### 6. Bring Your Own API Key
**Description:** Use your own Claude API key for complete control over costs and usage. Your data stays private — we never store your prompts or responses.

📸 **Screenshot:** Settings → AI tab showing API key configuration with usage info

### CTA Section
- **Title:** "Let AI handle the busywork"
- **Subtitle:** "Generate content in seconds that used to take hours. Your first 7 days are free."
- **Button:** "Start Free Trial"

---

## 2. Data Import/Export Feature Page

**Route:** `/features/import-export`

### Hero Section
- **Title:** "Your Data, Your Way"
- **Subtitle:** "Import & Export"
- **Description:** "Migrate from spreadsheets in minutes. Export reports for finance. Full control over your trade show data."
- **Icon:** FileSpreadsheet
- **Color:** `#059669` (emerald/green)

### Benefits (6)
1. Import shows from CSV — migrate from spreadsheets in minutes
2. Smart column mapping detects your field names automatically
3. Include attendees in the same import file
4. Export shows and attendees to CSV with custom field selection
5. Export to calendar (.ics) for Outlook/Google Calendar sync
6. Full JSON backup for data portability

### Capabilities (6)

#### 1. CSV Show Import
**Description:** Upload a CSV with your shows. We auto-detect columns like "Show Name", "Location", "Start Date" and map them for you.

📸 **Screenshot:** Import modal showing column mapping step with detected fields

#### 2. Attendee Import
**Description:** Include attendee columns in your CSV (Attendee Name, Email, etc.) and they'll be added to each show automatically.

📸 **Screenshot:** Import preview showing "5 shows, 12 attendees to import"

#### 3. Custom Export Fields
**Description:** Choose exactly which fields to include in your export. Only need name, dates, and cost? Uncheck the rest.

📸 **Screenshot:** Export modal with field selection checkboxes by category

#### 4. Calendar Export
**Description:** Export your shows as an .ics file to add them to Outlook, Google Calendar, or Apple Calendar.

📸 **Screenshot:** Export modal showing "Export Calendar (.ics)" button

#### 5. JSON Data Backup
**Description:** Download your complete data as JSON for backup or migration to other systems.

📸 **Screenshot:** Data export section in Settings showing JSON export option

#### 6. Import Preview
**Description:** Review exactly what will be imported before committing. See warnings for duplicates or missing fields.

📸 **Screenshot:** Import preview step showing show list with "Exists" warning badge on a duplicate

---

## 3. Templates Feature Page

**Route:** `/features/templates`

### Hero Section
- **Title:** "Set It Up Once, Reuse Forever"
- **Subtitle:** "Show Templates"
- **Description:** "Stop recreating the same booth setup for every show. Save templates and spin up new shows in seconds."
- **Icon:** Copy or Layers
- **Color:** `#F59E0B` (amber/orange)

### Benefits (6)
1. Save any show as a reusable template
2. Pre-fill booth equipment, packing lists, and standard costs
3. Create templates for different show types (10x10, 20x20, tabletop)
4. New shows start with your defaults, not from scratch
5. Update a template once, future shows get the improvements
6. Share templates across your team

### Capabilities (5)

#### 1. Save as Template
**Description:** Set up a show the way you like it, then save it as a template. Booth gear, packing lists, standard costs — all captured.

📸 **Screenshot:** "Save as Template" modal with template name field

#### 2. Create from Template
**Description:** Start a new show by selecting a template. All your standard setup is pre-filled, just add the dates and venue.

📸 **Screenshot:** Template selection modal showing available templates with booth size labels

#### 3. Template Library
**Description:** Build a library of templates for different scenarios — flagship 20x20 booth, compact tabletop, virtual event setup.

📸 **Screenshot:** Template list in settings or command palette showing multiple templates

#### 4. Smart Field Clearing
**Description:** Templates automatically clear date-specific fields (confirmations, tracking numbers) while keeping your reusable setup.

📸 **Screenshot:** New show created from template showing pre-filled equipment but blank dates

#### 5. Duplicate & Repeat
**Description:** Duplicate any show for a similar event, or use "Repeat Yearly" for annual shows that come back each year.

📸 **Screenshot:** Show actions menu showing Duplicate and Repeat Yearly options

---

## Landing Page Updates

### Add to Features Array
Add AI Integration to the main landing page features grid:

```tsx
{
  icon: Sparkles,
  title: 'AI That Actually Helps',
  description: 'Generate talking points, social posts, follow-up emails, and reports. AI trained on trade show context.',
}
```

### Add to Features Index (FEATURES array)
```tsx
{
  slug: 'ai',
  icon: Sparkles,
  color: '#8B5CF6',
  title: 'AI Assistant',
  description: 'Generate content, extract data from documents, and chat about your shows.',
  highlights: ['Content generation', 'Document extraction', 'Show chat'],
},
{
  slug: 'import-export',
  icon: FileSpreadsheet,
  color: '#059669',
  title: 'Import & Export',
  description: 'Migrate from spreadsheets and export reports with full control.',
  highlights: ['CSV import', 'Custom exports', 'Calendar sync'],
},
{
  slug: 'templates',
  icon: Layers,
  color: '#F59E0B',
  title: 'Show Templates',
  description: 'Save your booth setup once, reuse it for every similar show.',
  highlights: ['Reusable setups', 'Template library', 'Quick duplication'],
},
```

---

## Screenshot Checklist

### AI Feature Page (6 screenshots)
- [ ] AI Generate tab with content type selector + generated content
- [ ] One-Click Show modal with extracted PDF data
- [ ] AI Chat widget with sample conversation
- [ ] Settings → Branding with descriptions filled
- [ ] AI panel with show selector dropdown
- [ ] Settings → AI with API key field

### Import/Export Feature Page (6 screenshots)
- [ ] Import modal - column mapping step
- [ ] Import modal - preview with attendee count
- [ ] Export modal - field selection checkboxes
- [ ] Export modal - calendar export button
- [ ] Settings - JSON export option
- [ ] Import preview with duplicate warning

### Templates Feature Page (5 screenshots)
- [ ] Save as Template modal
- [ ] Template selection modal
- [ ] Template list/library
- [ ] New show from template (pre-filled)
- [ ] Show actions menu with Duplicate/Repeat

---

## Notes

- All pages use existing `FeaturePageLayout` component
- Screenshots should be 16:9 or 4:3 aspect ratio
- Dark mode screenshots preferred (matches marketing site)
- Show realistic data, not "Test Show" placeholder names
- Consider using Directlink-themed example shows for authenticity
