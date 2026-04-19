# Design: Rayyan Core Features

## Overview

Add core Rayyan.ai features to the systematic review platform while maintaining the existing dark theme UI and removing data extraction functionality.

## High-Level Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Review Detail Page                        │
├─────────────────────────────────────────────────────────────┤
│  Header (with Blind Mode Toggle)                            │
├─────────────────────────────────────────────────────────────┤
│  Tab Navigation                                              │
│  ├─ Overview                                                 │
│  ├─ Review Data                                              │
│  ├─ Screening (Enhanced)                                     │
│  ├─ Conflicts                                                │
│  └─ Export                                                   │
│  (Removed: Data Extraction)                                  │
├─────────────────────────────────────────────────────────────┤
│  Tab Content                                                 │
│  ├─ Screening Tab:                                           │
│  │  ├─ Screening Criteria Section                            │
│  │  │  ├─ Inclusion Criteria Column                          │
│  │  │  ├─ Exclusion Criteria Column                          │
│  │  │  └─ Add Criteria Button                                │
│  │  ├─ Article Screening Area                                │
│  │  ├─ Screening Summary Section                             │
│  │  │  ├─ Progress Visualization                             │
│  │  │  ├─ Team Progress                                      │
│  │  │  └─ Quick Guide Tooltips                               │
│  │  └─ Undecided Articles List                               │
│  └─ Overview Tab:                                            │
│     ├─ Review Info (with Blind Mode indicator)               │
│     ├─ Data Summary                                          │
│     └─ Review Members                                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

```
ReviewDetailLayout
├── Header (Enhanced)
│   ├── Menu Button
│   ├── Logo
│   ├── Blind Mode Toggle (NEW)
│   ├── Theme Toggle
│   └── User Avatar
├── TabNavigation
│   ├── Overview
│   ├── Review Data
│   ├── Screening (Enhanced)
│   ├── Conflicts
│   └── Export
└── TabContent
    ├── OverviewTab
    │   ├── ReviewInfo
    │   ├── DataSummary
    │   └── ReviewMembers
    ├── ReviewDataTab
    │   └── ArticleList
    ├── ScreeningTab (Enhanced)
    │   ├── ScreeningCriteria (NEW)
    │   │   ├── InclusionCriteria
    │   │   ├── ExclusionCriteria
    │   │   └── AddCriteriaButton
    │   ├── ArticleScreening
    │   ├── ScreeningSummary (NEW)
    │   │   ├── ProgressChart
    │   │   ├── TeamProgress
    │   │   └── QuickGuide
    │   └── UndecidedArticles
    ├── ConflictsTab
    └── ExportTab
```

### Data Model Extensions

```typescript
// Screening Criteria
interface ScreeningCriteria {
  id: number;
  reviewId: number;
  type: 'inclusion' | 'exclusion';
  criteria: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

// Blind Mode State
interface BlindModeState {
  enabled: boolean;
  hiddenFields: string[]; // ['reviewer_name', 'reviewer_avatar', 'reviewer_email']
}

// Screening Summary
interface ScreeningSummary {
  reviewId: number;
  totalArticles: number;
  screened: number;
  unscreened: number;
  conflicts: number;
  confirmations: number;
  progressPercentage: number;
  teamProgress: TeamMemberProgress[];
}

interface TeamMemberProgress {
  memberId: number;
  memberName: string;
  screened: number;
  conflicts: number;
  confirmations: number;
}
```

### State Management

**DataContext Extensions:**
- `screeningCriteria: ScreeningCriteria[]`
- `blindMode: BlindModeState`
- `screeningSummary: ScreeningSummary`
- `addScreeningCriteria(reviewId, criteria)`
- `deleteScreeningCriteria(id)`
- `updateScreeningCriteria(id, updates)`
- `toggleBlindMode()`
- `getScreeningSummary(reviewId)`

**Component Local State:**
- Screening tab: `selectedCriteria`, `filterByStatus`
- Header: `blindModeEnabled`
- Screening Summary: `expandedSections`

### Layout Patterns (Rayyan.ai Alignment)

**Screening Tab Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Screening Criteria Section (Top)                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Inclusion Criteria | Exclusion Criteria             │ │
│ │ [Add Criteria Button]                               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Article Screening Area (Middle)                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Article Title                                       │ │
│ │ Abstract...                                         │ │
│ │ [Include] [Exclude] [Maybe]                         │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Screening Summary Section (Bottom)                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Progress Chart | Team Progress | Quick Guide        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Overview Tab Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Review Info (with Blind Mode indicator)                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Title | Type | Domain | Description                │ │
│ │ [Blind Mode: ON/OFF indicator]                      │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Data Summary                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Imported | Duplicates | Unresolved | Resolved      │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Review Members                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Name | Email | Role | Status                       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Low-Level Design

### Component Signatures

#### Header Component (Enhanced)

```typescript
interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  showTitle?: boolean;
  blindMode?: boolean;
  onBlindModeToggle?: () => void;
}

export default function Header({
  onMenuClick,
  title = "Rayyan",
  showTitle = true,
  blindMode = false,
  onBlindModeToggle
}: HeaderProps)
```

**Changes:**
- Add `blindMode` prop
- Add `onBlindModeToggle` callback
- Add blind mode toggle button next to theme toggle
- Display blind mode indicator (eye icon with slash when enabled)

#### ScreeningCriteria Component (NEW)

```typescript
interface ScreeningCriteriaProps {
  reviewId: number;
  criteria: ScreeningCriteria[];
  onAddCriteria: (type: 'inclusion' | 'exclusion', text: string) => void;
  onDeleteCriteria: (id: number) => void;
}

export default function ScreeningCriteria({
  reviewId,
  criteria,
  onAddCriteria,
  onDeleteCriteria
}: ScreeningCriteriaProps)
```

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Screening Criteria                                      │
├─────────────────────────────────────────────────────────┤
│ Inclusion Criteria | Exclusion Criteria                 │
├─────────────────────────────────────────────────────────┤
│ [List of criteria with delete buttons]                  │
├─────────────────────────────────────────────────────────┤
│ [Add Inclusion Criteria] [Add Exclusion Criteria]       │
└─────────────────────────────────────────────────────────┘
```

#### ScreeningSummary Component (NEW)

```typescript
interface ScreeningSummaryProps {
  summary: ScreeningSummary;
  onStartScreening?: () => void;
}

export default function ScreeningSummary({
  summary,
  onStartScreening
}: ScreeningSummaryProps)
```

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Your Progress          | Team Progress | Quick Guide    │
├─────────────────────────────────────────────────────────┤
│ [Circular Progress]    | [Member List] | [2/6]          │
│ 0% Screened            | No progress   | [3/6]          │
│ 10 Articles to screen  | yet           | [4/6]          │
│ [Start Screening]      |               |                │
└─────────────────────────────────────────────────────────┘
```

#### QuickGuide Component (NEW)

```typescript
interface QuickGuideProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export default function QuickGuide({
  currentStep,
  totalSteps,
  steps
}: QuickGuideProps)
```

**Display:** Vertical list with step indicators (1/6, 2/6, etc.)

#### ProgressChart Component (NEW)

```typescript
interface ProgressChartProps {
  percentage: number;
  screened: number;
  total: number;
  onStartScreening?: () => void;
}

export default function ProgressChart({
  percentage,
  screened,
  total,
  onStartScreening
}: ProgressChartProps)
```

**Display:** Circular progress chart with percentage in center

### DataContext Extensions

```typescript
// Add to DataContext
interface DataContextType {
  // ... existing
  screeningCriteria: ScreeningCriteria[];
  blindMode: BlindModeState;
  
  // New methods
  addScreeningCriteria: (reviewId: number, type: 'inclusion' | 'exclusion', criteria: string) => void;
  deleteScreeningCriteria: (id: number) => void;
  updateScreeningCriteria: (id: number, updates: Partial<ScreeningCriteria>) => void;
  toggleBlindMode: () => void;
  getScreeningSummary: (reviewId: number) => ScreeningSummary;
  getReviewCriteria: (reviewId: number) => ScreeningCriteria[];
}
```

### Styling Approach

**Color Scheme (Maintain existing):**
- Background: `dark:bg-gray-900`
- Cards: `dark:bg-gray-800`
- Borders: `dark:border-gray-700`
- Text: `dark:text-white`
- Secondary: `dark:text-gray-400`

**Component Classes:**
- Criteria items: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`
- Progress chart: SVG-based circular progress
- Summary cards: Grid layout with `gap-4`
- Quick guide: Vertical stack with `space-y-2`

### Data Flow

**Screening Criteria Flow:**
```
User clicks "Add Criteria"
  ↓
Modal/Form opens
  ↓
User enters criteria text
  ↓
onAddCriteria() called
  ↓
DataContext.addScreeningCriteria()
  ↓
localStorage updated
  ↓
Component re-renders with new criteria
```

**Blind Mode Flow:**
```
User clicks blind mode toggle
  ↓
onBlindModeToggle() called
  ↓
DataContext.toggleBlindMode()
  ↓
blindMode state updated
  ↓
Header re-renders with indicator
  ↓
Screening components hide reviewer info
```

**Screening Summary Flow:**
```
Component mounts
  ↓
getScreeningSummary(reviewId) called
  ↓
Calculate: screened, unscreened, conflicts, confirmations
  ↓
Calculate: progressPercentage = (screened / total) * 100
  ↓
Render progress chart, team progress, quick guide
```

### File Structure

```
app/
├── components/
│   ├── Header.tsx (Enhanced)
│   ├── ScreeningCriteria.tsx (NEW)
│   ├── ScreeningSummary.tsx (NEW)
│   ├── ProgressChart.tsx (NEW)
│   ├── QuickGuide.tsx (NEW)
│   └── TeamProgress.tsx (NEW)
├── context/
│   └── DataContext.tsx (Extended)
├── reviews/
│   └── [id]/
│       ├── screening/
│       │   └── page.tsx (Enhanced)
│       └── overview/
│           └── page.tsx (Enhanced)
└── data/
    └── mockData.json (Updated)
```

### Removal Plan

**Remove from codebase:**
- `app/reviews/[id]/data/page.tsx` - Data extraction tab
- References to "Data extraction" in tab navigation
- Any data extraction related components
- Mock data for data extraction features

## Implementation Notes

1. **Blind Mode:** When enabled, hide reviewer names/avatars in screening decisions and team progress
2. **Screening Criteria:** Support both inclusion and exclusion criteria with add/delete/edit operations
3. **Progress Calculation:** Based on article screening decisions (include/exclude/maybe)
4. **Quick Guide:** Show numbered steps (1/6, 2/6, etc.) for onboarding
5. **Responsive:** Maintain responsive design for all new components
6. **Dark Theme:** All components use existing dark theme classes
7. **Accessibility:** Add ARIA labels and keyboard navigation support

## Correctness Properties

1. **Criteria Persistence:** Screening criteria must persist in localStorage
2. **Blind Mode State:** Blind mode toggle must affect all reviewer-identifying information
3. **Progress Accuracy:** Screening summary percentage must match actual screened articles
4. **Data Consistency:** Blind mode state must be consistent across all tabs
5. **Criteria Validation:** Cannot add empty criteria strings
6. **Team Progress:** Must only show team members assigned to the review
