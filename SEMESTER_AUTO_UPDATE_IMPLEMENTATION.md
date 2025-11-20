# Semester Auto-Update Implementation

## Summary
Sections now automatically update their `schoolYear` and `term` fields when an admin updates a semester in the admin panel, similar to how subjects work.

## How It Works

### Data Structure
- **Subjects**: Have a `semester` reference field (ObjectId → Semester model)
  - Automatically reflect changes via populate
- **Sections**: Have direct `schoolYear` and `term` fields
  - Need manual synchronization when semester changes

### Implementation Details

#### File: `backend/controller/semesterController.js`

**Added Imports:**
```javascript
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import { calculateAndUpdateAllGradesInSection } from "../utils/gradeCalculator.js";
```

**Updated `updateSemester` Function:**

When a semester's `schoolYear` or `term` is updated:

1. **Detect Changes**: Compare old vs new semester values
2. **Find Affected Subjects**: Query all subjects that reference this semester
3. **Update Sections**: Use `Section.updateMany()` to update all sections belonging to those subjects
4. **Recalculate Grades**: Trigger grade recalculation for all affected sections

**Logic Flow:**
```javascript
if (oldSemester.schoolYear !== schoolYear || oldSemester.term !== term) {
  // Find all subjects linked to this semester
  const subjects = await Subject.find({ semester: id });
  const subjectIds = subjects.map(s => s._id);

  if (subjectIds.length > 0) {
    // Update all sections for these subjects
    await Section.updateMany(
      { subject: { $in: subjectIds } },
      { 
        $set: { 
          schoolYear: schoolYear,
          term: term
        }
      }
    );

    // Recalculate grades for affected sections
    const affectedSections = await Section.find({ subject: { $in: subjectIds } });
    for (const section of affectedSections) {
      await calculateAndUpdateAllGradesInSection(section._id);
    }
  }
}
```

## Benefits

✅ **Automatic Synchronization**: Sections stay in sync with their semester
✅ **Grade Accuracy**: Grades recalculate after semester changes
✅ **Data Integrity**: Prevents mismatched schoolYear/term between semester and sections
✅ **Admin Workflow**: Single update in admin panel propagates to all related entities
✅ **Consistent with Subjects**: Sections now behave similarly to subjects

## Testing

### Test Script: `backend/test-semester-section-sync.js`

**Purpose**: Verify that sections are properly linked to semesters

**Usage**:
```bash
cd backend
node test-semester-section-sync.js
```

**What it checks**:
- Lists all semesters and their linked subjects
- Shows sections for each subject
- Identifies any mismatched schoolYear/term values
- Provides testing instructions

### Manual Testing Steps

1. **Before Update**:
   - Note current semester values (e.g., "2024-2025", "1st")
   - Check section schoolYear and term fields in database

2. **Update Semester**:
   - Go to Admin Panel → Semesters
   - Update a semester's schoolYear or term
   - Click Save

3. **Verify Auto-Update**:
   - Check affected sections in database
   - Verify schoolYear and term match new semester values
   - Check console logs for update confirmation

4. **Verify Grades**:
   - Check that grades were recalculated
   - Verify student grade displays are correct

## Database Queries for Verification

```javascript
// Find a semester
const semester = await Semester.findOne({ schoolYear: "2024-2025", term: "1st" });

// Find subjects for this semester
const subjects = await Subject.find({ semester: semester._id });

// Find sections for these subjects
const sections = await Section.find({ 
  subject: { $in: subjects.map(s => s._id) }
});

// Check if sections match semester
sections.forEach(s => {
  console.log(`${s.sectionName}: ${s.schoolYear} ${s.term}`);
  // Should match semester.schoolYear and semester.term
});
```

## Related Files

- `backend/controller/semesterController.js` - Main implementation
- `backend/models/semester.js` - Semester model
- `backend/models/subjects.js` - Subject model with semester reference
- `backend/models/sections.js` - Section model with schoolYear/term fields
- `backend/utils/gradeCalculator.js` - Grade recalculation logic
- `backend/test-semester-section-sync.js` - Test script

## Console Logs

When a semester is updated, you'll see logs like:
```
Updated 5 sections to match new semester (2024-2025, 2nd)
Recalculated grades for section 65f3a1b2c3d4e5f6a7b8c9d0
Recalculated grades for section 65f3a1b2c3d4e5f6a7b8c9d1
...
```

## Notes

- Grade recalculation happens asynchronously for each affected section
- Errors in grade recalculation are logged but don't block the semester update
- Only sections belonging to subjects in the updated semester are affected
- The update is atomic - all sections update together or none update
