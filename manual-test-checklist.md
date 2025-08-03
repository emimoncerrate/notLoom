# Manual Testing Checklist for PursuitShipped

## ✅ Testing Your Recent Changes

**URL**: http://localhost:5174/

### 1. Navigation Tests
- [ ] **Logo Navigation**: Click "PursuitShipped" logo → should return to home
- [ ] **View All Button**: From any role's home, click "View All" → should go to submissions page
- [ ] **Role-Based Access**: `/submissions` should be accessible to all users (not just staff)

### 2. Recording Mode Features
- [ ] Navigate to `/builder/record` (will require auth bypass for testing)
- [ ] **Recording Mode Selector**: Should see dropdown with 3 options:
  - [ ] "Screen Recording" 
  - [ ] "Screen + Camera (Picture-in-Picture)"
  - [ ] "Voiceover Only (Audio)"
- [ ] **Dynamic Button Text**: 
  - [ ] Screen mode → "Start Recording"
  - [ ] Voiceover mode → "Start Audio Recording"
- [ ] **Mode Descriptions**: Should show helpful text under each mode selection

### 3. Staff Filtering Features
- [ ] Navigate to `/staff/submissions` or `/submissions`
- [ ] **Date Range Filter**: Should see dropdown with:
  - [ ] "All Time"
  - [ ] "Today" 
  - [ ] "This Week"
  - [ ] "This Month"
- [ ] **Cohort Filter**: Should see existing cohort options
- [ ] **Review Status Filter**: Should see "All", "Reviewed", "Pending" options

### 4. Responsive Design
- [ ] **Desktop**: All features work on normal screen
- [ ] **Mobile**: Open Chrome DevTools → mobile view → check usability
- [ ] **Tablet**: Medium viewport → check layout doesn't break

## 🎯 Current Workflow to Test

### Without Authentication (UI Testing):
1. **Home Page**: `http://localhost:5174/` → Should show login
2. **Recording Page**: `http://localhost:5174/builder/record` → Should redirect to login or show recording UI
3. **Submissions**: `http://localhost:5174/submissions` → Should be accessible

### Recording Mode Testing:
1. Open recording page
2. Change recording mode dropdown
3. Verify button text changes
4. Verify description text updates
5. Check microphone toggle still works

### Filter Testing:
1. Open submissions/staff page
2. Try each filter dropdown
3. Verify options are present
4. Select different values (visual confirmation)

## 🚨 Known Issues to Expect
- **Authentication**: Most features will redirect to login (expected)
- **Media Permissions**: Browser will prompt for mic/camera access
- **Mock Data**: Submissions page may be empty (no real data yet)

## ✅ Success Criteria
- [ ] Navigation works without errors
- [ ] Recording mode UI displays correctly
- [ ] Filter dropdowns contain expected options
- [ ] No console errors on basic navigation
- [ ] Responsive design looks reasonable

## 🔧 Quick Fixes if Issues Found
- **White Screen**: Check browser console for errors
- **Navigation Not Working**: Clear browser cache
- **Missing Elements**: Check that Vite dev server is running on port 5174

---

**Next Step After Manual Testing**: Move to Step 2 - Rich Text Feedback System 