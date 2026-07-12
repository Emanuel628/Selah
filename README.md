# Selah

## Vision
Selah is designed as an intentional, mobile-first "Scripture Garden." Unlike traditional Bible apps that prioritize fast, ephemeral reading, Selah bridges the gap between study and personal knowledge management. It treats Scripture as the seed and your personal insights as the garden.

## Core Vision
- Reading Canvas
- The Garden
- Intelligent Synthesis

## Product Loop
1. Read Scripture without distracting study controls on the reading canvas.
2. Capture an insight and anchor it to a passage.
3. Classify the insight by a **Thought Group**: Observation, Interpretation,
   Connection, Application, Prayer, or Question.
4. Add flexible tags that connect recurring people, doctrines, themes, and ideas.
5. Return to the Garden to search, filter, revisit, and develop those insights.

The Garden is therefore not a generic journal. It is a personal Scripture
knowledge system: Thought Groups describe what kind of thinking a reflection
contains, while tags describe what that reflection is about. Future synthesis
features can use those relationships to surface connections across passages.

## Feature Ecosystem
- Reading: Multi-Translation Engine, Themes, Font Scaling, Red Letter, Saved Highlights
- Garden: Insight Entries, Garden Insights, Knowledge Graph
- Pro: Word Study, Garden Synthesis, Scripture Search, Cross References, Guided Reflection
- Settings: Face ID Login
- Engagement: Study Reminders

## Scripture Provider
Scripture text and translation metadata are loaded from the free, open-source
[Free Use Bible API](https://bible.helloao.org/). Berean Standard Bible (BSB)
is the default translation. Selah does not maintain or transcribe Bible text.

## Appearance
Selah includes two complete semantic color schemes: the original blue-green
**Selah Dark** theme and a warm parchment-and-sage **Light** theme. Users can
switch appearances from Settings → Dark Mode.

## Completed
- Mobile shell and navigation
- Shared UI framework
- Settings hub
- Subscription architecture
- Local-first Garden create, read, update, and delete workflow
- Garden Thought Groups, tags, search, sorting, and advanced filters
- Supabase email/password authentication, verification, and password recovery
- Cloud-backed Garden notes, reader preferences, bookmarks, and reminders
- Owner-only row-level security policies and migration-managed database schema
- Full Scripture search with local translation indexing
- Cross-reference panel for the current reading page
- Garden Insights synthesis from reflections, tags, thought groups, and books
- Guided reflection screen tied to the current passage and prior Garden notes
- Word Study across Scripture and Garden notes
- Knowledge Graph clusters for tags, books, thought groups, and connected notes
- Saved Scripture highlights with preferred highlight color, exact passage/page anchoring, long-press removal, and a highlights review page
- App Store in-app purchase integration path for Selah Pro monthly and yearly purchase/restore flows

## Remaining
- Hosted Privacy Policy and Support URLs for App Store Connect review
- App Store Connect subscription product activation for `selah_pro_monthly` and `selah_pro_yearly`
- Email provider keys for account/subscription confirmation emails
- App Store Server Notification webhook handling for automatic renewals, cancellations, and refunds

## Compliance and billing status

- In-app Privacy Policy and Support screens exist in Settings.
- Subscription purchase UI includes plan price, term, auto-renewal disclosure,
  Terms of Use, Privacy Policy, and Restore Purchases.
- App Store purchase activation is server-side: the `record-app-store-purchase`
  Supabase function verifies the Apple signed transaction before granting Pro.
- Renewal, cancellation, refund, and grace-period updates still need App Store
  Server Notifications before real-money release.
- The hosted Privacy Policy and Support URLs should be replaced with production
  URLs before App Store review.

## Technical Architecture
- Contextual Anchoring
- Frictionless Capture
- Relational Tagging
- Offline-first sync

## Success Metrics
- Invisible UI
- Fast performance
- Reliable syncing
- Active Garden usage
- Strong Pro adoption

## Supabase backend

The hosted backend is defined in `supabase/migrations`. Schema changes must be
added as migrations and deployed through the Supabase CLI; do not make direct
production schema edits in the Dashboard.

```powershell
npx supabase link --project-ref lrggkiseegofvcygmlhq
npx supabase db push
```

Authentication routes include account creation, email verification, sign in,
password reset, password update, and sign out. Protected data uses row-level
security so authenticated users can only access their own records.

## Next Milestone
Validate native email deep links and notification permissions on physical iOS
and Android devices, then add production subscription billing. Later, configure
email delivery secrets for Supabase Edge Functions:

- `RESEND_API_KEY`
- `ACCOUNT_EMAIL_FROM`

## Run the frontend

```powershell
npm install
npm run dev
```

Open `http://localhost:8081`. Signed-in Garden reflections, preferences,
bookmarks, and reminders synchronize with Supabase. Local storage remains
available for the unauthenticated Playwright preview environment.

## App Store subscription product IDs

- Monthly: `selah_pro_monthly`
- Yearly: `selah_pro_yearly`
