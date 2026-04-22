# Tasks: Rayyan Core Features

## Implementation Roadmap

### Phase 1: Data Model & Context Setup

- [x] 1.1 Extend DataContext with screening criteria state
- [ 
- [x] 1.4 Add blind mode toggle method to DataContext
- [x] 1.5 Add screening summary calculation method
- [x] 1.6 Update mockData.json with screening criteria
- [x] 1.7 Update mockData.json with blind mode state

### Phase 2: Component Creation - New Components

- [x] 2.1 Create ScreeningCriteria component
- [x] 2.2 Create ScreeningSummary component
- [x] 2.3 Create ProgressChart component
- [x] 2.4 Create QuickGuide component
- [x] 2.5 Create TeamProgress component
- [x] 2.6 Create CriteriaModal component for adding criteria

### Phase 3: Header Enhancement

- [x] 3.1 Add blind mode toggle button to Header
- [x] 3.2 Add blind mode indicator icon
- [x] 3.3 Connect blind mode toggle to DataContext
- [x] 3.4 Style blind mode button to match theme
- [x] 3.5 Add ARIA labels for accessibility

### Phase 4: Screening Tab Enhancement

- [-] 4.1 Add ScreeningCriteria component to screening tab
- [ ] 4.2 Add ScreeningSummary component to screening tab
- [ ] 4.3 Integrate criteria display with article screening
- [ ] 4.4 Update article screening area layout
- [ ] 4.5 Add undecided articles list
- [ ] 4.6 Implement blind mode filtering in screening tab

### Phase 5: Overview Tab Enhancement

- [ ] 5.1 Add blind mode status indicator to overview
- [ ] 5.2 Add screening criteria summary to overview
- [ ] 5.3 Update review info display
- [ ] 5.4 Update data summary display
- [ ] 5.5 Update review members display with blind mode support

### Phase 6: Data Extraction Removal

- [ ] 6.1 Remove data extraction tab from navigation
- [x] 6.2 Delete app/reviews/[id]/data/page.tsx
- [x] 6.3 Remove data extraction related mock data
- [ ] 6.4 Remove data extraction related context methods
- [ ] 6.5 Update tab navigation component
- [ ] 6.6 Test all remaining tabs work correctly

### Phase 7: Styling & Theme

- [ ] 7.1 Style ScreeningCriteria component with dark theme
- [ ] 7.2 Style ScreeningSummary component with dark theme
- [ ] 7.3 Style ProgressChart component
- [ ] 7.4 Style QuickGuide component
- [ ] 7.5 Style TeamProgress component
- [ ] 7.6 Ensure responsive design on all screen sizes
- [ ] 7.7 Verify color contrast and accessibility

### Phase 8: Integration & Testing

- [ ] 8.1 Test screening criteria add/delete functionality
- [ ] 8.2 Test blind mode toggle functionality
- [ ] 8.3 Test screening summary calculations
- [ ] 8.4 Test data persistence in localStorage
- [ ] 8.5 Test blind mode affects all tabs
- [ ] 8.6 Test responsive design on mobile/tablet/desktop
- [ ] 8.7 Test keyboard navigation
- [ ] 8.8 Test accessibility with screen reader

### Phase 9: Polish & Optimization

- [ ] 9.1 Optimize component re-renders
- [ ] 9.2 Add loading states where needed
- [ ] 9.3 Add error handling
- [ ] 9.4 Add success notifications
- [ ] 9.5 Verify no console errors
- [ ] 9.6 Performance testing
- [ ] 9.7 Final UI/UX review

## Detailed Task Breakdown

### Task 1.1: Extend DataContext with screening criteria state

**Description:** Add screening criteria state management to DataContext

**Subtasks:**
- Add `screeningCriteria: ScreeningCriteria[]` state
- Add `addScreeningCriteria()` method
- Add `deleteScreeningCriteria()` method
- Add `updateScreeningCriteria()` method
- Add `getReviewCriteria()` method
- Add localStorage persistence for criteria

**Acceptance Criteria:**
- ✓ State properly initialized
- ✓ Methods work correctly
- ✓ Data persists in localStorage
- ✓ No TypeScript errors

---

### Task 1.2: Extend DataContext with blind mode state

**Description:** Add blind mode state management to DataContext

**Subtasks:**
- Add `blindMode: BlindModeState` state
- Add `toggleBlindMode()` method
- Add localStorage persistence for blind mode
- Initialize blind mode from localStorage on mount

**Acceptance Criteria:**
- ✓ State properly initialized
- ✓ Toggle method works
- ✓ State persists in localStorage
- ✓ No TypeScript errors

---

### Task 1.3: Add screening summary calculation method

**Description:** Add method to calculate screening summary statistics

**Subtasks:**
- Create `getScreeningSummary(reviewId)` method
- Calculate total articles
- Calculate screened articles
- Calculate unscreened articles
- Calculate conflicts count
- Calculate confirmations count
- Calculate progress percentage
- Calculate team member progress

**Acceptance Criteria:**
- ✓ Method returns correct ScreeningSummary object
- ✓ All calculations accurate
- ✓ Team progress includes all members
- ✓ No TypeScript errors

---

### Task 1.4: Update mockData.json

**Description:** Add mock screening criteria and blind mode data

**Subtasks:**
- Add screeningCriteria array to mock data
- Add sample inclusion criteria
- Add sample exclusion criteria
- Add blindMode state
- Ensure data structure matches interfaces

**Acceptance Criteria:**
- ✓ Mock data valid JSON
- ✓ Matches TypeScript interfaces
- ✓ Includes realistic sample data
- ✓ No validation errors

---

### Task 2.1: Create ScreeningCriteria component

**Description:** Create component to display and manage screening criteria

**Subtasks:**
- Create component file
- Add inclusion criteria column
- Add exclusion criteria column
- Add delete buttons for each criteria
- Add "Add Criteria" buttons
- Style with dark theme
- Add TypeScript types

**Acceptance Criteria:**
- ✓ Component renders correctly
- ✓ Displays all criteria
- ✓ Delete buttons work
- ✓ Styled with dark theme
- ✓ Responsive design
- ✓ No TypeScript errors

---

### Task 2.2: Create ScreeningSummary component

**Description:** Create component to display screening progress and statistics

**Subtasks:**
- Create component file
- Add ProgressChart sub-component
- Add TeamProgress sub-component
- Add QuickGuide sub-component
- Layout in grid/flex
- Style with dark theme
- Add TypeScript types

**Acceptance Criteria:**
- ✓ Component renders correctly
- ✓ All sub-components display
- ✓ Styled with dark theme
- ✓ Responsive layout
- ✓ No TypeScript errors

---

### Task 2.3: Create ProgressChart component

**Description:** Create circular progress chart component

**Subtasks:**
- Create component file
- Implement SVG circular progress
- Display percentage in center
- Display screened/total count
- Add "Start Screening" button
- Style with dark theme
- Add TypeScript types

**Acceptance Criteria:**
- ✓ Circular chart renders
- ✓ Percentage displays correctly
- ✓ Button visible and clickable
- ✓ Styled with dark theme
- ✓ No TypeScript errors

---

### Task 2.4: Create QuickGuide component

**Description:** Create quick guide with numbered steps

**Subtasks:**
- Create component file
- Display numbered steps (1/6, 2/6, etc.)
- Add step descriptions
- Make collapsible
- Style with dark theme
- Add TypeScript types

**Acceptance Criteria:**
- ✓ Steps display correctly
- ✓ Numbering accurate
- ✓ Collapsible functionality works
- ✓ Styled with dark theme
- ✓ No TypeScript errors

---

### Task 2.5: Create TeamProgress component

**Description:** Create team member progress display

**Subtasks:**
- Create component file
- Display team members
- Show screened count per member
- Show conflicts per member
- Show confirmations per member
- Respect blind mode (hide names when enabled)
- Style with dark theme
- Add TypeScript types

**Acceptance Criteria:**
- ✓ Team members display
- ✓ Counts accurate
- ✓ Blind mode hides names
- ✓ Styled with dark theme
- ✓ No TypeScript errors


### Task 5.2: Add criteria summary to overview

**Description:** Add screening criteria summary to overview tab

**Subtasks:**
- Display inclusion criteria count
- Display exclusion criteria count
- Show criteria list
- Add link to screening tab

**Acceptance Criteria:**
- ✓ Counts display correctly
- ✓ Criteria list shows
- ✓ Link works

---

### Task 6.1: Remove data extraction tab

**Description:** Remove data extraction from tab navigation

**Subtasks:**
- Remove from tab list
- Update navigation component
- Test other tabs still work
- Verify no broken links

**Acceptance Criteria:**
- ✓ Tab not visible
- ✓ Navigation works
- ✓ No broken links

---

### Task 6.2: Delete data extraction page

**Description:** Delete data extraction page component

**Subtasks:**
- Delete app/reviews/[id]/data/page.tsx
- Verify no import errors
- Test navigation

**Acceptance Criteria:**
- ✓ File deleted
- ✓ No import errors
- ✓ Navigation works

---

### Task 6.3: Remove data extraction mock data

**Description:** Remove data extraction related mock data

**Subtasks:**
- Remove from mockData.json
- Update data structure
- Verify no errors

**Acceptance Criteria:**
- ✓ Mock data updated
- ✓ Valid JSON
- ✓ No errors

---

### Task 7.1-7.7: Styling & Theme

**Description:** Style all new components with dark theme

**Subtasks:**
- Apply dark theme colors to all components
- Ensure responsive design
- Verify color contrast
- Test on mobile/tablet/desktop
- Add hover effects
- Add transitions
- Verify accessibility

**Acceptance Criteria:**
- ✓ All components styled
- ✓ Dark theme consistent
- ✓ Responsive on all sizes
- ✓ Color contrast adequate
- ✓ Accessible

---

### Task 8.1-8.8: Integration & Testing

**Description:** Test all functionality

**Subtasks:**
- Test criteria add/delete
- Test blind mode toggle
- Test summary calculations
- Test localStorage persistence
- Test responsive design
- Test keyboard navigation
- Test accessibility
- Test all tabs work

**Acceptance Criteria:**
- ✓ All features work
- ✓ Data persists
- ✓ Responsive
- ✓ Accessible
- ✓ No errors

---

### Task 9.1-9.7: Polish & Optimization

**Description:** Final polish and optimization

**Subtasks:**
- Optimize re-renders
- Add loading states
- Add error handling
- Add notifications
- Check console
- Performance test
- Final review

**Acceptance Criteria:**
- ✓ No console errors
- ✓ Good performance
- ✓ Polish complete
- ✓ Ready for production

---

## Completion Criteria

All tasks must be completed and tested before marking feature as complete:

1. ✓ All data model extensions implemented
2. ✓ All new components created and styled
3. ✓ Header enhanced with blind mode
4. ✓ Screening tab enhanced with criteria and summary
5. ✓ Overview tab enhanced with blind mode and criteria
6. ✓ Data extraction removed completely
7. ✓ All styling matches dark theme
8. ✓ All functionality tested
9. ✓ Data persists correctly
10. ✓ Responsive design verified
11. ✓ Accessibility verified
12. ✓ No console errors
13. ✓ Performance acceptable
