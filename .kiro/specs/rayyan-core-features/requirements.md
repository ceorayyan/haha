# Requirements: Rayyan Core Features

## Feature Overview

Enhance the Rayyan.ai clone systematic review platform by adding core features from Rayyan.ai while maintaining the existing dark theme UI and removing data extraction functionality.

## Functional Requirements

### FR1: Screening Criteria Management

**Description:** Users can define and manage inclusion/exclusion criteria for article screening.

**Requirements:**
- FR1.1: Display screening criteria in two columns (Inclusion and Exclusion)
- FR1.2: Allow users to add new inclusion criteria
- FR1.3: Allow users to add new exclusion criteria
- FR1.4: Allow users to delete existing criteria
- FR1.5: Criteria must persist in localStorage
- FR1.6: Display criteria in a clear, readable format
- FR1.7: Show criteria count for each type

**Acceptance Criteria:**
- ✓ User can add inclusion criteria via modal/form
- ✓ User can add exclusion criteria via modal/form
- ✓ User can delete criteria with confirmation
- ✓ Criteria appear immediately after adding
- ✓ Criteria persist after page refresh
- ✓ Criteria are associated with specific review

### FR2: Blind Mode Toggle

**Description:** Users can enable blind mode to hide reviewer identities during screening.

**Requirements:**
- FR2.1: Add blind mode toggle button in header
- FR2.2: Display blind mode status indicator
- FR2.3: When enabled, hide reviewer names in screening decisions
- FR2.4: When enabled, hide reviewer avatars in team progress
- FR2.5: When enabled, hide reviewer email addresses
- FR2.6: Blind mode state persists in localStorage
- FR2.7: Blind mode affects all tabs (Overview, Screening, Conflicts)

**Acceptance Criteria:**
- ✓ Toggle button visible in header
- ✓ Clicking toggle enables/disables blind mode
- ✓ Reviewer names hidden when blind mode ON
- ✓ Reviewer avatars hidden when blind mode ON
- ✓ Blind mode state persists after refresh
- ✓ All tabs respect blind mode setting

### FR3: Screening Summary

**Description:** Display comprehensive screening progress and statistics.

**Requirements:**
- FR3.1: Show circular progress chart with percentage
- FR3.2: Display number of screened vs total articles
- FR3.3: Show team member progress (name, screened count, conflicts)
- FR3.4: Display conflicts count
- FR3.5: Display confirmations count
- FR3.6: Show "Start Screening" button when no articles screened
- FR3.7: Update summary in real-time as articles are screened

**Acceptance Criteria:**
- ✓ Progress chart displays correct percentage
- ✓ Screened/total counts are accurate
- ✓ Team progress shows all members
- ✓ Conflicts and confirmations counts are correct
- ✓ Summary updates when article screening decision changes
- ✓ "Start Screening" button visible when appropriate

### FR4: Quick Guide Tooltips

**Description:** Display quick guide with numbered steps for onboarding.

**Requirements:**
- FR4.1: Show quick guide section in screening summary
- FR4.2: Display numbered steps (1/6, 2/6, etc.)
- FR4.3: Show step descriptions
- FR4.4: Make quick guide collapsible
- FR4.5: Quick guide should be non-intrusive

**Acceptance Criteria:**
- ✓ Quick guide visible in screening summary
- ✓ Steps numbered correctly
- ✓ Can collapse/expand quick guide
- ✓ Step descriptions are clear and helpful

### FR5: Enhanced Overview Tab

**Description:** Update overview tab to show screening criteria and blind mode status.

**Requirements:**
- FR5.1: Display review information (title, type, domain, description)
- FR5.2: Show blind mode status indicator
- FR5.3: Display data summary (imported, duplicates, unresolved, resolved)
- FR5.4: Show review members with roles and status
- FR5.5: Display screening criteria summary

**Acceptance Criteria:**
- ✓ All review info displayed correctly
- ✓ Blind mode indicator shows current status
- ✓ Data summary counts are accurate
- ✓ Team members listed with correct roles
- ✓ Criteria summary shows inclusion/exclusion counts

### FR6: Enhanced Screening Tab

**Description:** Update screening tab with criteria display and improved layout.

**Requirements:**
- FR6.1: Display screening criteria at top of tab
- FR6.2: Show article screening area with current article
- FR6.3: Display screening summary below article
- FR6.4: Show undecided articles list
- FR6.5: Maintain existing screening workflow (Include/Exclude/Maybe)
- FR6.6: Respect blind mode when displaying reviewer info

**Acceptance Criteria:**
- ✓ Criteria visible at top of screening tab
- ✓ Article screening workflow unchanged
- ✓ Screening summary displays correctly
- ✓ Undecided articles list shows all unscreened articles
- ✓ Blind mode hides reviewer info in decisions

### FR7: Remove Data Extraction

**Description:** Remove data extraction tab and all related features.

**Requirements:**
- FR7.1: Remove "Data extraction" tab from navigation
- FR7.2: Remove data extraction page component
- FR7.3: Remove data extraction related mock data
- FR7.4: Remove data extraction related context methods
- FR7.5: Update navigation to show only: Overview, Review Data, Screening, Conflicts, Export

**Acceptance Criteria:**
- ✓ Data extraction tab not visible
- ✓ No data extraction page accessible
- ✓ Navigation shows 5 tabs only
- ✓ No broken links or references

## Non-Functional Requirements

### NFR1: UI/UX Consistency

**Description:** Maintain existing dark theme and UI design patterns.

**Requirements:**
- NFR1.1: Use existing color scheme (black, white, gray-900, gray-800)
- NFR1.2: Follow existing component styling patterns
- NFR1.3: Maintain responsive design
- NFR1.4: Use Rayyan.ai layout alignment patterns
- NFR1.5: No premium feature UI elements

**Acceptance Criteria:**
- ✓ All new components match existing dark theme
- ✓ Responsive on mobile, tablet, desktop
- ✓ Layout follows Rayyan.ai patterns
- ✓ No premium-only UI elements

### NFR2: Performance

**Description:** Maintain application performance.

**Requirements:**
- NFR2.1: Screening summary updates within 100ms
- NFR2.2: Criteria operations complete within 50ms
- NFR2.3: No unnecessary re-renders
- NFR2.4: localStorage operations are efficient

**Acceptance Criteria:**
- ✓ No performance degradation
- ✓ Smooth interactions
- ✓ Fast data updates

### NFR3: Data Persistence

**Description:** All data must persist correctly.

**Requirements:**
- NFR3.1: Screening criteria persist in localStorage
- NFR3.2: Blind mode state persists in localStorage
- NFR3.3: Screening decisions persist in localStorage
- NFR3.4: Data survives page refresh

**Acceptance Criteria:**
- ✓ All data persists after refresh
- ✓ No data loss on navigation
- ✓ localStorage properly updated

### NFR4: Accessibility

**Description:** Maintain accessibility standards.

**Requirements:**
- NFR4.1: All buttons have ARIA labels
- NFR4.2: Keyboard navigation supported
- NFR4.3: Color contrast meets WCAG standards
- NFR4.4: Form inputs properly labeled

**Acceptance Criteria:**
- ✓ Screen reader compatible
- ✓ Keyboard navigation works
- ✓ Color contrast adequate

## User Stories

### US1: Reviewer Sets Up Screening Criteria

**As a** review owner
**I want to** define inclusion and exclusion criteria for article screening
**So that** reviewers can consistently apply the same criteria

**Acceptance Criteria:**
- ✓ Can add multiple inclusion criteria
- ✓ Can add multiple exclusion criteria
- ✓ Criteria are displayed clearly
- ✓ Can delete criteria if needed
- ✓ Criteria persist for future sessions

### US2: Reviewer Enables Blind Mode

**As a** review coordinator
**I want to** enable blind mode to hide reviewer identities
**So that** screening decisions are unbiased

**Acceptance Criteria:**
- ✓ Can toggle blind mode on/off
- ✓ Reviewer names are hidden when enabled
- ✓ Reviewer avatars are hidden when enabled
- ✓ Setting persists across sessions

### US3: Reviewer Monitors Screening Progress

**As a** review owner
**I want to** see screening progress and team member contributions
**So that** I can track review completion and identify bottlenecks

**Acceptance Criteria:**
- ✓ Can see overall progress percentage
- ✓ Can see number of screened articles
- ✓ Can see team member progress
- ✓ Can see conflicts and confirmations
- ✓ Progress updates in real-time

### US4: New Reviewer Gets Onboarded

**As a** new reviewer
**I want to** see quick guide steps for screening
**So that** I understand the screening workflow

**Acceptance Criteria:**
- ✓ Quick guide visible in screening tab
- ✓ Steps are numbered and clear
- ✓ Can collapse/expand guide
- ✓ Guide is helpful and non-intrusive

## Data Model

### ScreeningCriteria

```typescript
interface ScreeningCriteria {
  id: number;
  reviewId: number;
  type: 'inclusion' | 'exclusion';
  criteria: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}
```

### BlindModeState

```typescript
interface BlindModeState {
  enabled: boolean;
  hiddenFields: string[];
}
```

### ScreeningSummary

```typescript
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

## Constraints

1. **UI Constraint:** Must maintain existing dark theme and component structure
2. **Feature Constraint:** No premium features (AI-powered screening, advanced analytics)
3. **Layout Constraint:** Must follow Rayyan.ai alignment patterns
4. **Data Constraint:** Must use localStorage for persistence
5. **Compatibility Constraint:** Must work with existing Next.js 16, React 19 setup

## Success Criteria

1. ✓ All screening criteria features working
2. ✓ Blind mode toggle functional and persistent
3. ✓ Screening summary displays accurate data
4. ✓ Quick guide visible and helpful
5. ✓ Data extraction tab removed
6. ✓ Dark theme maintained
7. ✓ No performance degradation
8. ✓ All data persists correctly
9. ✓ Responsive design maintained
10. ✓ Rayyan.ai layout patterns followed
