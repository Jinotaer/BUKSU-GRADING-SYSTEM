# Real-Time Grade Updates Implementation

## Overview
Student grades are now automatically calculated and updated in real-time whenever activity scores are entered or grading schemas are changed. Previously, grades were only calculated when instructors exported to Google Sheets.

## What Changed

### 1. New Utility: Grade Calculator (`backend/utils/gradeCalculator.js`)
A comprehensive utility module that handles all grade calculations:

**Key Functions:**
- `calculateAndUpdateGrade(studentId, sectionId, instructorId)` - Calculates and saves grade for one student
- `calculateAndUpdateGrades(studentIds, sectionId, instructorId)` - Batch calculation for multiple students
- `calculateAndUpdateAllGradesInSection(sectionId, instructorId)` - Recalculates all students in a section

**How It Works:**
1. Fetches all active activities for the section (filtered by subject, school year, and term)
2. Groups activities by category (Class Standing, Laboratory, Major Output)
3. Retrieves all activity scores for the student(s)
4. Calculates average percentage for each category
5. Applies grading schema weights to compute final percentage
6. Converts percentage to grade (1.0-5.0 scale)
7. Determines remarks (Passed/Failed)
8. Updates or creates the Grade record in the database

### 2. Activity Scores Controller (`backend/controller/activityScoresController.js`)
**Updated:** Automatically triggers grade recalculation when activity scores are updated

```javascript
// After saving scores, recalculate grades for affected students
calculateAndUpdateGrades(affectedStudentIds, sectionId, instructorId)
  .then(results => {
    console.log(`Grades updated for ${results.successful.length} students`);
  });
```

### 3. Section Controller (`backend/controller/sectionController.js`)
**Updated:** 
- Recalculates all grades when grading schema is changed
- New endpoint: `POST /api/sections/:id/recalculate-grades` for manual grade recalculation

```javascript
// If grading schema changed, recalculate all grades
if (gradingSchemaChanged && updatedSection.students.length > 0) {
  calculateAndUpdateAllGradesInSection(id, finalInstructorId);
}
```

### 4. Section Routes (`backend/routes/sectionRoutes.js`)
**Added:** New route for manual grade recalculation
```
POST /api/sections/:id/recalculate-grades
```

### 5. Grade Controller (`backend/controller/gradeController.js`)
**Updated:** Added documentation noting that real-time grades are calculated automatically from activity scores

## Benefits

### For Students
✅ **Instant feedback** - See grades update immediately after instructor enters scores
✅ **No waiting** - Don't need to wait for instructor to export to Google Sheets
✅ **Transparency** - Always see current standing based on all submitted work

### For Instructors
✅ **Automatic calculations** - No need to manually export to update grades
✅ **Accuracy** - Grades always reflect latest scores and grading schema
✅ **Flexibility** - Can still manually recalculate if needed

### For System
✅ **Consistency** - Grades calculated using same logic everywhere
✅ **Performance** - Background processing doesn't block user requests
✅ **Reliability** - Handles partial failures gracefully

## When Grades Are Calculated

1. **Activity Score Entry** - Whenever an instructor saves/updates activity scores
2. **Grading Schema Change** - When instructor modifies grading weights for a section
3. **Manual Trigger** - Instructor can manually recalculate via API endpoint
4. **Export to Sheets** - Still calculated during export (for redundancy)

## Grade Calculation Formula

```
For each category (Class Standing, Laboratory, Major Output):
  Category Average = Average of (Score/MaxScore * 100) for all activities in category

Final Percentage = 
  (CS_Avg × CS_Weight/100) + 
  (Lab_Avg × Lab_Weight/100) + 
  (MO_Avg × MO_Weight/100)

Final Grade = Convert percentage to 1.0-5.0 scale:
  97%+ = 1.0
  94-96% = 1.25
  91-93% = 1.5
  88-90% = 1.75
  85-87% = 2.0
  82-84% = 2.25
  79-81% = 2.5
  76-78% = 2.75
  50-75% = 3.0
  <50% = 5.0

Remarks = Final Percentage >= 50% ? "Passed" : "Failed"
```

## Testing

### Test Real-Time Updates:
1. **Login as Instructor**
2. **Enter/Update Activity Scores** for students in a section
3. **Login as Student** - Grades should reflect immediately in studentGrades page
4. **Change Grading Schema** (e.g., change weights from 40/30/30 to 50/25/25)
5. **Verify** all student grades recalculated with new weights

### Test Manual Recalculation:
```bash
# Using the API endpoint
POST http://localhost:5000/api/sections/{sectionId}/recalculate-grades
Authorization: Bearer {instructor_token}
```

## Error Handling

- **Non-blocking**: Grade calculations run in background, won't block score saving
- **Partial failures**: If some students fail, others still get updated
- **Logging**: All calculation results logged to console
- **Graceful degradation**: If calculation fails, existing grades remain unchanged

## Migration Notes

- Existing grades in database are not affected
- New calculations will overwrite old grades as scores are updated
- Export functionality still works and calculates grades (for redundancy)
- No database schema changes required

## API Endpoints

### Automatic (No user action needed)
- Activity scores updated → Grades recalculated automatically
- Grading schema updated → Grades recalculated automatically

### Manual Trigger
```
POST /api/sections/:id/recalculate-grades
Authorization: Bearer {instructor_token}
Response: {
  success: true,
  message: "Grades recalculated successfully",
  results: {
    successful: 25,
    failed: 0
  }
}
```

## Backward Compatibility

✅ All existing endpoints work as before
✅ Export to Google Sheets still calculates grades
✅ Manual grade entry endpoint still available
✅ No breaking changes to frontend code needed

## Performance Considerations

- Calculations are async and non-blocking
- Only affected students are recalculated (not entire section)
- Database queries are optimized with proper indexing
- Failed calculations are logged but don't block the main operation

## Next Steps

1. Test with real data in development environment
2. Monitor logs for any calculation errors
3. Consider adding grade change notifications to students via email
4. Add audit trail for grade changes (optional enhancement)

---

**Implementation Date:** November 3, 2025
**Status:** ✅ Complete and Ready for Testing
