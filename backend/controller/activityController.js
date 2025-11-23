// controllers/activityController.js
import Activity from "../models/activity.js";
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import Semester from "../models/semester.js";
import Schedule from "../models/schedule.js";
import Instructor from "../models/instructor.js";
import googleCalendarService from "../services/googleCalendarService.js";
import emailService from "../services/emailService.js";
import { bulkDecryptUserData, decryptInstructorData } from "./decryptionController.js";

// Safely get the current instructor id from the request, regardless of shape
const getInstructorId = (req) =>
  req?.instructor?.id ||
  req?.user?.id ||
  req?.user?.user?._id?.toString() ||
  null;

// Helper: normalize datetime-local strings to include seconds if missing
const normalizeDateTimeString = (s) => {
  if (!s) return s;
  // If format is YYYY-MM-DDTHH:MM (no seconds), append :00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
};

// Create new activity
export const createActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      notes,
      category, 
      maxScore, 
      sectionId,
      term,
      eventType,
      location,
      startDateTime,
      endDateTime,
      syncToGoogleCalendar
    } = req.body;

    // Validate required fields - now including schedule fields
    if (!title || !category || !maxScore || !sectionId || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Title, category, max score, sectionId, start date/time, and end date/time are required",
      });
    }

    // Normalize and validate datetime strings
    const normalizedStart = normalizeDateTimeString(startDateTime);
    const normalizedEnd = normalizeDateTimeString(endDateTime);

    if (!normalizedStart || !normalizedEnd) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both start and end date/time'
      });
    }

    const startObj = new Date(normalizedStart);
    const endObj = new Date(normalizedEnd);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format'
      });
    }

    if (startObj >= endObj) {
      return res.status(400).json({
        success: false,
        message: 'End date/time must be after start date/time'
      });
    }

    // Verify section
    const section = await Section.findById(sectionId).populate("subject");
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    // Require an authenticated instructor and set as owner
    const instructorId = getInstructorId(req);
    if (!instructorId) {
      return res.status(401).json({ success: false, message: "Unauthorized: instructor missing" });
    }

    // Verify that the instructor is assigned to this section
    const sectionInstructorId = section.instructor.toString();
    const currentInstructorId = instructorId.toString();
    
    if (sectionInstructorId !== currentInstructorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create activities for sections assigned to you'
      });
    }

    // Map section term -> activity term display
    const termMapping = { "1st": "Midterm", "2nd": "Finalterm", Summer: "Summer" };
    // Use term from request body if provided, otherwise map from section term
    const activityTerm = term || termMapping[section.term] || section.term;

    // Ensure Semester exists for (schoolYear, term as stored on Section)
    let semester = await Semester.findOne({
      schoolYear: section.schoolYear,
      term: section.term,
    });
    if (!semester) {
      semester = new Semester({ schoolYear: section.schoolYear, term: section.term });
      await semester.save();
    }

    // Create schedule first
    const scheduleData = {
      title,
      description: description || "",
      eventType: eventType || 'quiz',
      startDateTime: startObj,
      endDateTime: endObj,
      section: sectionId,
      subject: section.subject._id,
      instructor: instructorId,
      location: location || '',
      notes: notes || ''
    };

    // Handle Google Calendar sync if requested
    if (syncToGoogleCalendar) {
      // Get instructor's Google Calendar credentials
      const instructorWithTokens = await Instructor.findById(instructorId).select(
        'googleAccessToken googleRefreshToken googleCalendarConnected'
      );

      if (instructorWithTokens && instructorWithTokens.googleCalendarConnected) {
        const calendarEventData = {
          title: `${title} - ${section.subject.subjectCode}`,
          description: `${description || ''}\n\nSection: ${section.sectionName}\nType: ${(eventType || 'quiz').toUpperCase()}`,
          startDateTime: normalizedStart,
          endDateTime: normalizedEnd,
          location: location || '',
          eventType: eventType || 'quiz'
        };

        const calendarResult = await googleCalendarService.createEvent(
          calendarEventData,
          instructorWithTokens.googleAccessToken,
          instructorWithTokens.googleRefreshToken
        );

        if (calendarResult.success) {
          scheduleData.googleEventId = calendarResult.eventId;
          scheduleData.isGoogleCalendarSynced = true;
        } else {
          console.warn('Failed to sync to Google Calendar:', calendarResult.error);
        }
      } else {
        console.warn('Instructor has not connected Google Calendar');
      }
    }

    // Create schedule
    const schedule = await Schedule.create(scheduleData);

    // Create activity with schedule reference
    const activity = new Activity({
      title,
      description: description || "",
      notes: notes || "",
      category,
      maxScore: parseInt(maxScore, 10),
      subject: section.subject._id,
      instructor: instructorId, // owner
      semester: semester._id,
      schoolYear: section.schoolYear,
      term: activityTerm,
      schedule: schedule._id,
      eventType: eventType || 'quiz',
      location: location || '',
      startDateTime: startObj,
      endDateTime: endObj,
      syncToGoogleCalendar: syncToGoogleCalendar || false,
      isActive: true,
    });

    await activity.save();

    // Link the schedule back to the activity
    schedule.activity = activity._id;
    await schedule.save();

    // Send email notifications to students in the section
    try {
      const sectionWithStudents = await Section.findById(sectionId)
        .populate('students', 'email firstName lastName fullName');
      
      const instructor = await Instructor.findById(instructorId);
      // Decrypt instructor data
      const decryptedInstructor = instructor ? decryptInstructorData(instructor.toObject()) : null;
      const instructorName = decryptedInstructor?.fullName || 'Your Instructor';

      if (sectionWithStudents && sectionWithStudents.students && sectionWithStudents.students.length > 0) {
        const scheduleDetails = {
          title,
          eventType: eventType || 'quiz',
          startDateTime: startObj,
          endDateTime: endObj,
          location: location || 'Not specified',
          description: description || '',
          sectionName: section.sectionName,
          subjectCode: section.subject.subjectCode,
          subjectName: section.subject.subjectName
        };

        // Decrypt student data before sending emails
        // Convert Mongoose documents to plain objects first
        const plainStudents = sectionWithStudents.students.map(s => s.toObject());
        const decryptedStudents = bulkDecryptUserData(plainStudents, 'student');

        console.log(`📧 Preparing to send schedule notifications to ${decryptedStudents.length} students`);
        console.log('📧 Student emails:', decryptedStudents.map(s => s.email));

        // Filter students with email addresses
        const studentsWithEmail = decryptedStudents.filter(student => student.email);
        const studentsWithoutEmail = decryptedStudents.filter(student => !student.email);

        if (studentsWithoutEmail.length > 0) {
          console.warn(`⚠️ ${studentsWithoutEmail.length} student(s) have no email address:`,
            studentsWithoutEmail.map(s => `${s.firstName} ${s.lastName} (${s.studid})`).join(', ')
          );
        }

        console.log(`✉️ Sending emails to ${studentsWithEmail.length} students with email addresses`);

        const emailPromises = studentsWithEmail.map(student => {
          const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
          console.log(`  → Queuing email for ${studentName} (${student.email})`);
          return emailService.sendScheduleNotification({
            studentEmail: student.email,
            studentName,
            instructorName,
            scheduleDetails
          });
        });

        if (emailPromises.length > 0) {
          Promise.all(emailPromises)
            .then(results => {
              const successCount = results.filter(r => r.success).length;
              console.log(`✅ Activity schedule notification emails sent: ${successCount}/${studentsWithEmail.length}`);
            })
            .catch(error => {
              console.error('❌ Error sending activity schedule notification emails:', error);
            });
        } else {
          console.warn('⚠️ No schedule notification emails sent - no students have email addresses');
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending activity schedule notification emails:', emailError);
    }

    // Populate the activity for response
    const populatedActivity = await Activity.findById(activity._id)
      .populate('schedule')
      .populate('subject', 'subjectCode subjectName');

    return res.status(201).json({
      success: true,
      message: "Activity and schedule created successfully",
      activity: populatedActivity,
      schedule: schedule
    });
  } catch (error) {
    console.error("Create activity error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get activities for a section
export const getSectionActivities = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    // Fetch all active activities for this section's subject and school year
    // Activities are tied to subject + schoolYear, so they persist across term changes
    // but should match the section's current schoolYear
    const activities = await Activity.find({
      subject: section.subject,
      schoolYear: section.schoolYear,
      isActive: true,
    })
    .populate('schedule')
    .populate('subject', 'subjectCode subjectName')
    .sort({ startDateTime: 1, createdAt: -1 }); // Sort by schedule time first, then creation date

    return res.status(200).json({ success: true, activities, section: { schoolYear: section.schoolYear, term: section.term } });
  } catch (error) {
    console.error("Get section activities error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get activities for a subject
export const getSubjectActivities = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const activities = await Activity.find({
      subject: subjectId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("Get subject activities error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update activity
export const updateActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const instructorId = getInstructorId(req);
    if (!instructorId) {
      return res.status(401).json({ success: false, message: "Unauthorized: instructor missing" });
    }

    const {
      title,
      description,
      notes,
      category,
      maxScore,
      term,
      eventType,
      location,
      startDateTime,
      endDateTime,
      syncToGoogleCalendar
    } = req.body;

    const activity = await Activity.findById(activityId).populate('schedule');
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Only the owner can update (if owner is set)
    if (activity.instructor && String(activity.instructor) !== String(instructorId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this activity" });
    }

    // Validate datetime if provided
    let startObj, endObj;
    if (startDateTime && endDateTime) {
      const normalizedStart = normalizeDateTimeString(startDateTime);
      const normalizedEnd = normalizeDateTimeString(endDateTime);

      startObj = new Date(normalizedStart);
      endObj = new Date(normalizedEnd);

      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date/time format'
        });
      }

      if (startObj >= endObj) {
        return res.status(400).json({
          success: false,
          message: 'End date/time must be after start date/time'
        });
      }
    }

    // Update activity fields
    const activityUpdateData = {};
    if (title) activityUpdateData.title = title;
    if (description !== undefined) activityUpdateData.description = description;
    if (notes !== undefined) activityUpdateData.notes = notes;
    if (category) activityUpdateData.category = category;
    if (maxScore) activityUpdateData.maxScore = parseInt(maxScore, 10);
    if (term) activityUpdateData.term = term;
    if (eventType) activityUpdateData.eventType = eventType;
    if (location !== undefined) activityUpdateData.location = location;
    if (startObj) activityUpdateData.startDateTime = startObj;
    if (endObj) activityUpdateData.endDateTime = endObj;
    if (syncToGoogleCalendar !== undefined) activityUpdateData.syncToGoogleCalendar = syncToGoogleCalendar;

    // Update the related schedule if it exists
    if (activity.schedule) {
      const schedule = await Schedule.findById(activity.schedule);
      if (schedule) {
        const scheduleUpdateData = {};
        if (title) scheduleUpdateData.title = title;
        if (description !== undefined) scheduleUpdateData.description = description;
        if (notes !== undefined) scheduleUpdateData.notes = notes;
        if (eventType) scheduleUpdateData.eventType = eventType;
        if (location !== undefined) scheduleUpdateData.location = location;
        if (startObj) scheduleUpdateData.startDateTime = startObj;
        if (endObj) scheduleUpdateData.endDateTime = endObj;

        // Update Google Calendar event if synced
        if (syncToGoogleCalendar && schedule.googleEventId) {
          const instructorWithTokens = await Instructor.findById(instructorId).select(
            'googleAccessToken googleRefreshToken googleCalendarConnected'
          );

          if (instructorWithTokens && instructorWithTokens.googleCalendarConnected) {
            const subject = await Subject.findById(schedule.subject);
            const section = await Section.findById(schedule.section);

            const normalizedStartUpdate = startDateTime ? normalizeDateTimeString(startDateTime) : null;
            const normalizedEndUpdate = endDateTime ? normalizeDateTimeString(endDateTime) : null;

            const formattedStart = normalizedStartUpdate || (schedule.startDateTime instanceof Date ? schedule.startDateTime.toISOString().replace(/\.\d{3}Z$/, '') : schedule.startDateTime);
            const formattedEnd = normalizedEndUpdate || (schedule.endDateTime instanceof Date ? schedule.endDateTime.toISOString().replace(/\.\d{3}Z$/, '') : schedule.endDateTime);

            const calendarEventData = {
              title: `${title || schedule.title} - ${subject.subjectCode}`,
              description: `${description || schedule.description || ''}\n\nSection: ${section.sectionName}\nType: ${(eventType || schedule.eventType).toUpperCase()}`,
              startDateTime: formattedStart,
              endDateTime: formattedEnd,
              location: location || schedule.location || '',
              eventType: eventType || schedule.eventType
            };

            const updateResult = await googleCalendarService.updateEvent(
              schedule.googleEventId,
              calendarEventData,
              instructorWithTokens.googleAccessToken,
              instructorWithTokens.googleRefreshToken
            );

            if (!updateResult.success) {
              console.warn('Failed to update Google Calendar event:', updateResult.error);
            }
          }
        }

        await Schedule.findByIdAndUpdate(schedule._id, scheduleUpdateData, {
          new: true,
          runValidators: true
        });
      }
    }

    const updatedActivity = await Activity.findByIdAndUpdate(activityId, activityUpdateData, {
      new: true,
      runValidators: true,
    }).populate('schedule').populate('subject', 'subjectCode subjectName');

    // Send email notifications about the update
    try {
      const section = await Section.findById(updatedActivity.schedule ? 
        (await Schedule.findById(updatedActivity.schedule)).section : null)
        .populate('students', 'email firstName lastName fullName');
      
      const instructor = await Instructor.findById(instructorId);
      // Decrypt instructor data
      const decryptedInstructor = instructor ? decryptInstructorData(instructor.toObject()) : null;
      const instructorName = decryptedInstructor?.fullName || 'Your Instructor';

      if (section && section.students && section.students.length > 0) {
        const scheduleDetails = {
          title: updatedActivity.title,
          eventType: updatedActivity.eventType,
          startDateTime: updatedActivity.startDateTime,
          endDateTime: updatedActivity.endDateTime,
          location: updatedActivity.location || 'Not specified',
          description: `[UPDATED] ${updatedActivity.description || ''}`,
          sectionName: section.sectionName,
          subjectCode: updatedActivity.subject.subjectCode,
          subjectName: updatedActivity.subject.subjectName
        };

        // Decrypt student data before sending emails
        // Convert Mongoose documents to plain objects first
        const plainStudents = section.students.map(s => s.toObject());
        const decryptedStudents = bulkDecryptUserData(plainStudents, 'student');

        console.log(`📧 Preparing to send activity update notifications to ${decryptedStudents.length} students`);
        console.log('📧 Student emails:', decryptedStudents.map(s => s.email));

        // Filter students with email addresses
        const studentsWithEmail = decryptedStudents.filter(student => student.email);
        const studentsWithoutEmail = decryptedStudents.filter(student => !student.email);

        if (studentsWithoutEmail.length > 0) {
          console.warn(`⚠️ ${studentsWithoutEmail.length} student(s) have no email address:`,
            studentsWithoutEmail.map(s => `${s.firstName} ${s.lastName} (${s.studid})`).join(', ')
          );
        }

        console.log(`✉️ Sending update emails to ${studentsWithEmail.length} students with email addresses`);

        const emailPromises = studentsWithEmail.map(student => {
          const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
          console.log(`  → Queuing email for ${studentName} (${student.email})`);
          return emailService.sendScheduleNotification({
            studentEmail: student.email,
            studentName,
            instructorName,
            scheduleDetails
          });
        });

        if (emailPromises.length > 0) {
          Promise.all(emailPromises)
            .then(results => {
              const successCount = results.filter(r => r.success).length;
              console.log(`✅ Activity update notification emails sent: ${successCount}/${studentsWithEmail.length}`);
            })
            .catch(error => {
              console.error('❌ Error sending activity update notification emails:', error);
            });
        } else {
          console.warn('⚠️ No activity update notification emails sent - no students have email addresses');
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending activity update notification emails:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Activity and schedule updated successfully",
      activity: updatedActivity,
    });
  } catch (error) {
    console.error("Update activity error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete activity (hard delete - permanently removes from database)
export const deleteActivity = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    if (!instructorId) {
      return res.status(401).json({ success: false, message: "Unauthorized: instructor missing" });
    }

    const { activityId } = req.params;
    const activity = await Activity.findById(activityId).populate('schedule');
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Only the owner can delete (if owner is set)
    if (activity.instructor && String(activity.instructor) !== String(instructorId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this activity" });
    }

    // Also delete the related schedule
    if (activity.schedule) {
      const schedule = await Schedule.findById(activity.schedule);
      if (schedule) {
        // Delete from Google Calendar if synced
        if (schedule.googleEventId) {
          const instructorWithTokens = await Instructor.findById(instructorId).select(
            'googleAccessToken googleRefreshToken googleCalendarConnected'
          );

          if (instructorWithTokens && instructorWithTokens.googleCalendarConnected) {
            const deleteResult = await googleCalendarService.deleteEvent(
              schedule.googleEventId,
              instructorWithTokens.googleAccessToken,
              instructorWithTokens.googleRefreshToken
            );

            if (!deleteResult.success) {
              console.warn('Failed to delete Google Calendar event:', deleteResult.error);
            }
          }
        }

        // Permanently delete the schedule from database
        await Schedule.findByIdAndDelete(activity.schedule);
      }
    }

    // Permanently delete the activity from database
    await Activity.findByIdAndDelete(activityId);

    return res.json({ success: true, message: "Activity and schedule deleted successfully" });
  } catch (error) {
    console.error("Delete activity error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Toggle activity status (active/inactive)
export const toggleActivityStatus = async (req, res) => {
  try {
    const { activityId } = req.params;
    const instructorId = getInstructorId(req);
    if (!instructorId) {
      return res.status(401).json({ success: false, message: "Unauthorized: instructor missing" });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Only the owner can toggle (if owner is set)
    if (activity.instructor && String(activity.instructor) !== String(instructorId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to modify this activity" });
    }

    activity.isActive = !activity.isActive;
    await activity.save();

    return res.status(200).json({
      success: true,
      message: `Activity ${activity.isActive ? "activated" : "deactivated"} successfully`,
      activity,
    });
  } catch (error) {
    console.error("Toggle activity status error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
