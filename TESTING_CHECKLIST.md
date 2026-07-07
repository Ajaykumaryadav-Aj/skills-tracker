# Roadmap Templates - Testing Checklist

## Pre-Testing Setup

- [ ] Backend running: `npm run dev` in server folder
- [ ] Frontend running: `npm run dev` in client folder
- [ ] Templates seeded: `npm run seed` in server folder
- [ ] User logged in to the application
- [ ] Browser DevTools open (F12) for error checking

---

## 1. Template Browsing ✓

### View Templates List
- [ ] Click "Roadmaps" in navigation
- [ ] Default shows "Templates" tab
- [ ] All 5 templates display
- [ ] Each shows: title, icon, category, difficulty, estimated hours
- [ ] Template cards are clickable

### View Template Details
- [ ] Click on "Frontend Developer" template
- [ ] Header displays correctly with icon and description
- [ ] Shows difficulty level and estimated hours
- [ ] Displays prerequisites list
- [ ] Lists keywords at bottom
- [ ] Skills are expandable (click to expand)
- [ ] Topics display within each skill
- [ ] Subtopics show within each topic

### Template Variations
- [ ] Open "Backend Developer" - shows different skills/topics
- [ ] Open "Full Stack Developer" - shows combined skills
- [ ] Open "React Developer" - React-focused content
- [ ] Open "Node.js Developer" - Backend-focused content

---

## 2. Import Functionality ✓

### Import with Default Title
- [ ] On template detail page, leave title as is
- [ ] Click "Import Roadmap" button
- [ ] Should redirect to roadmap detail page
- [ ] Roadmap appears in "My Roadmaps" tab
- [ ] Title matches original template title

### Import with Custom Title
- [ ] On template detail page
- [ ] Clear default title
- [ ] Type "My Custom Frontend Path"
- [ ] Click "Import Roadmap"
- [ ] Redirected to roadmap with custom title
- [ ] Custom title displays in list and detail

### Skills/Topics Preserved
- [ ] Imported roadmap has all original skills
- [ ] All topics display under skills
- [ ] Subtopics preserved
- [ ] All descriptions intact

---

## 3. My Roadmaps Tab ✓

### View Empty State
- [ ] Start fresh, go to Roadmaps page
- [ ] Click "My Roadmaps" tab (if on Templates)
- [ ] Shows "No roadmaps yet" message
- [ ] Options to "Create Roadmap" or "Browse Templates"

### View Imported Roadmaps
- [ ] After importing templates
- [ ] Each appears as a card in "My Roadmaps"
- [ ] Shows: title, icon, category, status, description
- [ ] Displays progress bar
- [ ] Shows skill count
- [ ] Shows source template name (e.g., "From: Frontend Developer")

### Roadmap Cards Clickable
- [ ] Click on any roadmap card
- [ ] Opens roadmap detail page
- [ ] Back button returns to list

---

## 4. Create Custom Roadmap ✓

### Form Submission
- [ ] Click "Create Roadmap" button
- [ ] Form displays with fields:
  - Title (required, red asterisk)
  - Description (optional)
  - Category dropdown
  - Target Date picker
- [ ] Submit empty form shows validation error
- [ ] Enter title "My DevOps Journey"
- [ ] Select "DevOps" category
- [ ] Pick a future date
- [ ] Click "Create Roadmap"
- [ ] Redirected to detail page
- [ ] New roadmap appears in list

### Form Validation
- [ ] Try to submit without title
- [ ] Error displays under title field
- [ ] Title field shows red border
- [ ] Category and date are optional (no errors)
- [ ] Very long title (>200 chars) shows error
- [ ] Description longer than 1000 chars shows error

---

## 5. Progress Tracking ✓

### View Progress Page
- [ ] Open a user roadmap
- [ ] Header shows: title, category, status
- [ ] Three stat cards display:
  - Overall Progress (%)
  - Total Skills
  - Completed Skills
- [ ] Progress bar shows filled percentage

### Update Skill Status
- [ ] Skill row shows status dropdown
- [ ] Click dropdown, select "In progress"
- [ ] Status updates immediately
- [ ] Try "Completed" status
- [ ] Status changes

### Update Progress Slider
- [ ] Drag progress slider for first skill
- [ ] Slider updates in real-time
- [ ] Percentage displays
- [ ] Overall roadmap progress updates
- [ ] Set first skill to 100%
- [ ] Try setting to 0%, 50%, 100%

### Overall Calculation
- [ ] Set all skills to 100%
- [ ] Overall shows 100%
- [ ] Set all to 0%
- [ ] Overall shows 0%
- [ ] Mixed values average correctly

### Status Auto-Update
- [ ] Mark all skills as "Completed"
- [ ] Roadmap status changes to "Completed"
- [ ] Mark some as "In progress"
- [ ] Roadmap status becomes "In Progress"
- [ ] Leave one as "Not Started"
- [ ] Roadmap still shows "In Progress"

---

## 6. Skill Expansion ✓

### Expand/Collapse Skills
- [ ] Click on skill to expand
- [ ] Topics display indented below
- [ ] Click again to collapse
- [ ] Click expand arrow icon
- [ ] Topics hide/show correctly

### View Topics
- [ ] Topics show with status badges
- [ ] Subtopics appear nested under topics
- [ ] Click expand topic (if expandable)
- [ ] Subtopic details display
- [ ] Resource links visible (if any)

### Multiple Expansions
- [ ] Expand multiple skills
- [ ] Each maintains its state independently
- [ ] Collapse one doesn't affect others
- [ ] Can expand/collapse smoothly

---

## 7. Skill Management ✓

### Add Skill
- [ ] Click "Add Skill" button
- [ ] Modal/form appears (or navigates to form)
- [ ] Enter skill title "Advanced TypeScript"
- [ ] Set level to "Advanced"
- [ ] Skill appears in list
- [ ] Initially 0% progress

### Delete Skill
- [ ] Expand a skill
- [ ] Click "Delete" button
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - skill remains
- [ ] Try again, click "Confirm"
- [ ] Skill removed from roadmap
- [ ] List updates immediately

### Edit Skill
- [ ] Expand a skill
- [ ] Click "Edit" button (if implemented)
- [ ] Update skill details
- [ ] Save changes
- [ ] Skill updates in display

---

## 8. Navigation & Routing ✓

### Main Navigation
- [ ] "Roadmaps" link visible in header
- [ ] Click opens roadmaps list
- [ ] Other nav links still work
- [ ] Can navigate between sections

### Route Parameters
- [ ] Template URL: `/roadmaps/templates/{id}`
- [ ] User roadmap URL: `/roadmaps/{id}`
- [ ] Create form URL: `/roadmaps/new`
- [ ] Edit form URL: `/roadmaps/{id}/edit`
- [ ] Direct URL access works (if logged in)

### Browser Back/Forward
- [ ] Import template, click back
- [ ] Returns to template list
- [ ] Forward goes back to roadmap
- [ ] All navigation history intact

---

## 9. Error Handling ✓

### Network Errors
- [ ] Disconnect internet temporarily
- [ ] Error message displays appropriately
- [ ] Reconnect, retry loads data
- [ ] No console errors

### Invalid Data
- [ ] Try to access non-existent roadmap ID
- [ ] Error message: "Roadmap not found"
- [ ] Try non-existent template
- [ ] Error message displays

### Validation Errors
- [ ] Create roadmap with title only spaces
- [ ] Validation error shows
- [ ] Edit roadmap, try invalid date
- [ ] Error message appears

### Unauthorized Access
- [ ] Someone tries to access another user's roadmap
- [ ] Either 403 error or redirects appropriately
- [ ] No data leak

---

## 10. Data Persistence ✓

### Create and Reload
- [ ] Create new custom roadmap
- [ ] Refresh page (F5)
- [ ] Roadmap still exists with same data
- [ ] Progress values preserved

### Update and Reload
- [ ] Modify skill progress to 75%
- [ ] Change skill status to "In progress"
- [ ] Refresh page
- [ ] Values persisted
- [ ] No data lost

### Delete and Reload
- [ ] Delete a roadmap
- [ ] Refresh page
- [ ] Roadmap gone from list
- [ ] Direct URL returns "not found"

---

## 11. UI/UX Testing ✓

### Responsive Design
- [ ] Desktop view looks good
- [ ] Tablet view (iPad size)
- [ ] Mobile view (phone size)
- [ ] All buttons clickable
- [ ] Text readable at all sizes

### Visual Feedback
- [ ] Buttons have hover states
- [ ] Loading spinners display during operations
- [ ] Expand/collapse has smooth transitions
- [ ] Progress bars animate smoothly
- [ ] Status badges show correct colors

### Accessibility
- [ ] Can tab through form fields
- [ ] Enter key submits forms
- [ ] Labels associated with inputs
- [ ] Contrast is readable

### Empty States
- [ ] No roadmaps shows helpful message
- [ ] No templates show (doesn't happen, but test if possible)
- [ ] No skills in a skill-less roadmap shows message

---

## 12. Performance Testing ✓

### Load Times
- [ ] Templates list loads in <1 second
- [ ] Template detail loads in <1 second
- [ ] My Roadmaps loads in <1 second
- [ ] Creating roadmap completes in <1 second

### Responsiveness
- [ ] UI doesn't freeze when loading
- [ ] No lag when expanding/collapsing
- [ ] Sliders move smoothly
- [ ] No console errors or warnings

### Data Size
- [ ] Large progress values (100%) work
- [ ] Long skill names display correctly
- [ ] Many skills in roadmap work smoothly
- [ ] No memory leaks on refresh

---

## 13. Cross-Browser Testing ✓

- [ ] Chrome/Edge latest version
- [ ] Firefox latest version
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (Chrome on Android, Safari on iOS)

---

## 14. Security Testing ✓

### Authentication
- [ ] Non-logged-in users can't access roadmaps
- [ ] Trying direct URL redirects to login
- [ ] Login and access works
- [ ] Can't access someone else's roadmap

### Input Validation
- [ ] Can't inject HTML/script in title
- [ ] Special characters handled safely
- [ ] XSS attempts fail gracefully
- [ ] SQL injection (if applicable) prevented

---

## 15. Edge Cases ✓

### Boundary Values
- [ ] Progress slider at 0%, 50%, 100%
- [ ] Very long title (near limit)
- [ ] Empty description (optional field)
- [ ] Far future target date

### Multiple Imports
- [ ] Import same template twice
- [ ] Each creates separate roadmap
- [ ] Both can be edited independently

### Rapid Clicks
- [ ] Double-click import button
- [ ] Only one roadmap created
- [ ] Status dropdown changes don't duplicate
- [ ] Multiple deletes handled gracefully

---

## Summary Results

**Total Tests: 150+**

- [ ] All tests passed ✓
- [ ] No critical errors
- [ ] No data loss
- [ ] Responsive on all devices
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production ✓

---

## Notes

Test environment:
- Date: ___________
- Tester: ___________
- Browser: ___________
- Device: ___________
- Issues found: ___________
- Status: ✓ READY FOR LAUNCH / ⚠️ NEEDS FIXES
