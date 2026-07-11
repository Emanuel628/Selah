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
- Reading: Multi-Translation Engine, Themes, Font Scaling, Red Letter
- Garden: Insight Entries, Knowledge Graph
- Pro: Multi-device Sync, Lexicon, Priority Search
- Settings: Biometric Lock
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

## Remaining
- Full-Scripture search
- Production subscription billing and entitlements
- Native notification scheduling
- Cross-reference engine

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
and Android devices, then add production subscription billing.

## Run the frontend

```powershell
npm install
npm run dev
```

Open `http://localhost:8081`. Signed-in Garden reflections, preferences,
bookmarks, and reminders synchronize with Supabase. Local storage remains
available for the unauthenticated Playwright preview environment.
