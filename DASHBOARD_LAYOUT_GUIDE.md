# QAMS Supervisor Dashboard - Visual Layout Guide

## Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          🎯 HERO HEADER SECTION                              │
│                                                                               │
│  Good Morning, Supervisor Name                                    ⏰ 10:45 AM │
│  Real-time AI monitoring for your call center              🗄️ QAMS Workspace │
│                                                             ⚡ Ollama Engine   │
│                                                             🔄 Sync Button     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          📊 KPI CARDS (8 COLUMNS)                            │
├────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────────┤
│ 📞     │ ✅     │ ⏱️     │ ❌     │ 📈     │ 👥     │ ⏲️     │ 👍         │
│ Total  │ AI     │Process │Failed  │Average │Active  │Avg Talk│Customer    │
│ Calls  │Complete│Queue   │Analysis│AI Score│Agents  │Time    │Satisfaction│
│ Today  │        │        │        │        │        │        │            │
│ 186    │ 142    │ 38     │ 6      │ 87%    │ 24     │ 06:21  │ 92%        │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────────┘

┌──────────────────────────────────────────────────┬────────────────────────────┐
│                  MAIN CONTENT (2/3)               │   RIGHT SIDEBAR (1/3)      │
│                                                   │                            │
│ ┌──────────────────────────────────────────────┐ │ ┌────────────────────────┐ │
│ │      🔄 AI PROCESSING QUEUE (5 CARDS)        │ │ │   📡 LIVE ACTIVITY      │ │
│ ├──────┬──────┬──────┬──────┬──────────────────┤ │ │                        │ │
│ │Queued│Trans │Analys│Compl │Failed            │ │ │ ✅ AI completed #5842   │ │
│ │  12  │  8   │  18  │ 142  │  6               │ │ │ 📤 Recording uploaded   │ │
│ └──────┴──────┴──────┴──────┴──────────────────┘ │ │ 🎙️ Transcription done   │ │
│                                                   │ │ ⚙️  Analysis started     │ │
│ ┌──────────────────────────────────────────────┐ │ │ ❌ Analysis failed       │ │
│ │      👥 AGENT PERFORMANCE (TOP 5)            │ │ │ 🔄 Queue started        │ │
│ ├──────────────────────────────────────────────┤ │ └────────────────────────┘ │
│ │ 🟢 Rahul Kumar      | 45 calls | 93% | 📈   │ │                            │
│ │ 🟢 Priya Sharma     | 38 calls | 89% | 📈   │ │ ┌────────────────────────┐ │
│ │ 🟡 Amit Patel       | 32 calls | 76% | ➡️   │ │ │   ⚠️  ALERT CENTER      │ │
│ │ 🟢 Sneha Reddy      | 28 calls | 91% | 📈   │ │ │                        │ │
│ │ 🔴 Vikram Singh     | 24 calls | 58% | 📉   │ │ │ ⚠️  Low AI Scores (8)   │ │
│ └──────────────────────────────────────────────┘ │ │ ❌ Failed Calls (6)     │ │
│                                                   │ │ ℹ️  Pending Publish (3) │ │
│ ┌──────────────────────────────────────────────┐ │ │ ⏰ Long Queue (38)      │ │
│ │      🎯 QUALITY BREAKDOWN (8 METRICS)        │ │ └────────────────────────┘ │
│ ├──────┬──────┬──────┬──────┬──────────────────┤ │                            │
│ │Open  │Tone  │Energy│Listen│Empathy│Conf│Pro │ │ ┌────────────────────────┐ │
│ │ 92%  │ 88%  │ 85%  │ 91%  │ 83%   │87% │89% │ │ │ 📋 PENDING ACTIONS     │ │
│ │ 🟢   │ 🟢   │ 🟢   │ 🟢   │ 🟢    │🟢  │🟢  │ │ │                        │ │
│ └──────┴──────┴──────┴──────┴──────────────────┘ │ │ 📤 Publish Pending: 3   │ │
│                                                   │ │ 📝 Draft Audits: 7      │ │
│ ┌──────────────────────────────────────────────┐ │ │ ❌ Failed Records: 6    │ │
│ │      📞 RECENT RECORDINGS (TABLE)            │ │ └────────────────────────┘ │
│ ├──────────────────────────────────────────────┤ │                            │
│ │Call ID│Agent│Duration│Lang│Sentiment│Score  │ │ ┌────────────────────────┐ │
│ │#5842  │RK   │06:21   │EN  │Positive │93%   │ │ │  ⚡ QUICK ACTIONS       │ │
│ │#5841  │PS   │04:15   │EN  │Neutral  │89%   │ │ │                        │ │
│ │#5840  │AP   │05:32   │HI  │Positive │76%   │ │ │ 📤 Upload  │ ➕ Create  │ │
│ │#5839  │SR   │07:08   │EN  │Positive │91%   │ │ │ 👤 Assign  │ 📊 Export  │ │
│ │#5838  │VS   │03:45   │EN  │Negative │58%   │ │ └────────────────────────┘ │
│ └──────────────────────────────────────────────┘ │                            │
│                                                   │ ┌────────────────────────┐ │
│ ┌──────────────────────────────────────────────┐ │ │  🟢 SYSTEM STATUS       │ │
│ │      ✨ TODAY'S AI INSIGHTS                  │ │ │                        │ │
│ ├──────────────────────────────────────────────┤ │ │ 🟢 Ollama AI: Online    │ │
│ │ • Today AI processed 186 calls               │ │ │ 🟢 Whisper STT: Online  │ │
│ │ • Average quality score: 87%                 │ │ │ 🟢 Database: Connected  │ │
│ │ • Most customers showed Positive sentiment   │ │ │ 🟢 API: Running         │ │
│ │ • 3 audits require supervisor review         │ │ │ 🟡 Queue Health: 38 pend│ │
│ │ • 6 failed transcriptions need retry         │ │ └────────────────────────┘ │
│ └──────────────────────────────────────────────┘ │                            │
└──────────────────────────────────────────────────┴────────────────────────────┘
```

## Analysis Table Enhanced Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                            📊 ANALYSIS RECORDS TABLE                                          │
├────────┬────────┬──────────────┬──────────┬──────────┬──────────┬──────┬──────┬──────┬──────┤
│ Agent  │Language│    Score     │Sentiment │ Opening  │ Opening  │ Tone │Energy│Active│Status│
│  Name  │        │              │          │  Status  │  Delay   │      │Level │Listen│      │
├────────┼────────┼──────────────┼──────────┼──────────┼──────────┼──────┼──────┼──────┼──────┤
│        │        │     92%      │          │          │ 🟢       │      │      │      │      │
│ Rahul  │   EN   │  ★★★★★       │ Positive │ Proper   │ 0.8 sec  │Warm  │High  │Good  │Done  │
│ Kumar  │        │  Excellent   │          │          │          │      │      │      │      │
├────────┼────────┼──────────────┼──────────┼──────────┼──────────┼──────┼──────┼──────┼──────┤
│        │        │     85%      │          │          │ 🟢       │      │      │      │      │
│ Priya  │   EN   │  ★★★★☆       │ Neutral  │ Proper   │ 1.4 sec  │Calm  │Medium│Good  │Done  │
│ Sharma │        │  Very Good   │          │          │          │      │      │      │      │
├────────┼────────┼──────────────┼──────────┼──────────┼──────────┼──────┼──────┼──────┼──────┤
│        │        │     72%      │          │          │ 🟡       │      │      │      │      │
│ Amit   │   HI   │  ★★★★☆       │ Positive │ Delayed  │ 3.2 sec  │Flat  │Medium│Fair  │Done  │
│ Patel  │        │     Good     │          │          │          │      │      │      │      │
├────────┼────────┼──────────────┼──────────┼──────────┼──────────┼──────┼──────┼──────┼──────┤
│        │        │     63%      │          │          │ 🟡       │      │      │      │      │
│ Sneha  │   EN   │  ★★★☆☆       │ Negative │ Proper   │ 4.1 sec  │Tense │Low   │Poor  │Done  │
│ Reddy  │        │   Average    │          │          │          │      │      │      │      │
├────────┼────────┼──────────────┼──────────┼──────────┼──────────┼──────┼──────┼──────┼──────┤
│        │        │     55%      │          │          │ 🔴       │      │      │      │      │
│ Vikram │   EN   │  ★★☆☆☆       │ Negative │ Missing  │ 8.6 sec  │Harsh │Low   │Poor  │Done  │
│ Singh  │        │Needs Improve │          │          │          │      │      │      │      │
└────────┴────────┴──────────────┴──────────┴──────────┴──────────┴──────┴──────┴──────┴──────┘
```

## Component Hierarchy

```
SupervisorDashboard
│
├── PageContainer
│   │
│   ├── Hero Header Section
│   │   ├── Greeting + User Name
│   │   ├── Description
│   │   └── Header Meta (Time, Workspace, AI Engine, Sync)
│   │
│   ├── KPI Cards Grid (8 columns)
│   │   ├── Total Calls Today (KPICard)
│   │   ├── AI Completed (KPICard)
│   │   ├── Processing Queue (KPICard)
│   │   ├── Failed Analysis (KPICard)
│   │   ├── Average AI Score (KPICard)
│   │   ├── Active Agents (KPICard)
│   │   ├── Avg Talk Time (KPICard)
│   │   └── Customer Satisfaction (KPICard)
│   │
│   └── Main Content Grid (3 columns)
│       │
│       ├── Left Column (2/3 width)
│       │   ├── ProcessingQueueCards
│       │   ├── AgentPerformanceTable
│       │   ├── QualityBreakdownCards
│       │   ├── RecentRecordingsTable
│       │   └── FooterInsights (AppCard)
│       │
│       └── Right Sidebar (1/3 width)
│           ├── LiveActivityPanel
│           ├── AlertCenterCard
│           ├── PendingActionsCards (AppCard)
│           ├── QuickActionCards Grid
│           └── StatusWidget Cards (AppCard)
```

## Color Coding Reference

### Score Ranges
- 🟢 **Green** (90-100%): Excellent / Outstanding
- 🟢 **Green** (80-89%): Very Good / Strong
- 🟡 **Yellow** (70-79%): Good / Acceptable
- 🟠 **Orange** (60-69%): Average / Needs Work
- 🔴 **Red** (50-59%): Needs Improvement / Coaching Required
- 🔴 **Dark Red** (<50%): Poor / Immediate Review

### Opening Delay
- 🟢 **Green** (0-2 sec): Excellent response time
- 🟡 **Yellow** (2-5 sec): Slight delay
- 🔴 **Red** (5+ sec): Late opening

### Status Indicators
- 🟢 **Green**: Healthy / Online / Active
- 🟡 **Yellow**: Warning / Processing / Attention
- 🔴 **Red**: Error / Offline / Critical

### Sentiment
- 🟢 **Green**: Positive
- ⚪ **Gray**: Neutral
- 🔴 **Red**: Negative

## Responsive Breakpoints

```
Mobile (< 640px):
  - KPI Cards: 2 columns
  - Main grid: 1 column (stack)
  - Tables: Horizontal scroll
  - Sidebar: Below main content

Tablet (640px - 1024px):
  - KPI Cards: 4 columns
  - Main grid: 2 columns
  - Tables: Full width
  - Sidebar: 1/3 width

Desktop (1024px+):
  - KPI Cards: 8 columns
  - Main grid: 2/3 + 1/3
  - Tables: Full features
  - Sidebar: Fixed 1/3

Large Desktop (1536px+):
  - Maximum content width
  - Enhanced spacing
  - Full feature set
```

## Animation Timings

- **Page Load:** 500ms fade-in
- **KPI Cards:** Staggered 50ms delay each
- **Counters:** 1s count-up animation
- **Hover Effects:** 200ms ease-out
- **Activity Feed:** 300ms slide-in
- **Modal Open:** 250ms scale + fade
- **Loading Skeleton:** 1.5s shimmer loop
- **Tooltip Appear:** 300ms fade

## Interaction Patterns

### Hover States
- **Cards:** Scale 1.02, shadow increase
- **Buttons:** Opacity 90%, background darken
- **Table Rows:** Background highlight
- **Icons:** Color transition to accent

### Click Actions
- **KPI Cards:** Navigate to detail page
- **Agent Row:** Open agent profile
- **Recording Row:** View analysis details
- **Alert:** Navigate to relevant section
- **Quick Action:** Execute action or navigate

### Loading States
- **Initial Load:** Skeleton loaders
- **Refresh:** Maintain data, silent update
- **Sync:** Button spinner + toast
- **Table Action:** Row-level spinner

## Icon Legend

| Icon | Meaning | Usage |
|------|---------|-------|
| 📞 | Phone | Total calls, recordings |
| ✅ | Checkmark | Completed, success |
| ⏱️ | Timer | Processing, queue |
| ❌ | X Mark | Failed, error |
| 📈 | Trending Up | Scores, metrics |
| 👥 | People | Agents, team |
| ⏲️ | Stopwatch | Duration, time |
| 👍 | Thumbs Up | Satisfaction, approval |
| 📡 | Satellite | Live activity |
| ⚠️ | Warning | Alerts, attention |
| ℹ️ | Info | Information |
| 🔄 | Refresh | Sync, reload |
| 📤 | Upload | Upload recording |
| ➕ | Plus | Create new |
| 👤 | Person | Assign agent |
| 📊 | Chart | Export reports |
| 🟢 | Green Circle | Online, healthy |
| 🟡 | Yellow Circle | Warning, away |
| 🔴 | Red Circle | Error, offline |
| ⚡ | Lightning | AI engine |
| 🗄️ | Database | Workspace |
| ✨ | Sparkles | Insights |

## Accessibility Features

- ✅ **ARIA Labels** on all interactive elements
- ✅ **Keyboard Navigation** fully supported
- ✅ **Focus Indicators** visible and clear
- ✅ **Color Contrast** WCAG AA compliant
- ✅ **Screen Reader** friendly structure
- ✅ **Tooltips** provide context
- ✅ **Loading States** announce to screen readers
- ✅ **Error Messages** clear and descriptive

---

**This layout guide should serve as a visual reference for the enterprise-grade dashboard design.**
