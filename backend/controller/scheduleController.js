import Schedule from '../models/schedule.js';
import Section from '../models/sections.js';
import Subject from '../models/subjects.js';
import Student from '../models/student.js';
import Instructor from '../models/instructor.js';
import googleCalendarService from '../services/googleCalendarService.js';
import emailService from '../services/emailService.js';
import mongoose from 'mongoose';

// Helper: normalize datetime-local strings to include seconds if missing
// Exported here at module scope so both createSchedule and updateSchedule can use it.
const normalizeDateTimeString = (s) => {
  if (!s) return s;
  // If format is YYYY-MM-DDTHH:MM (no seconds), append :00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
};

export const createSchedule = async (req, res) => {
  try {
    // Get instructor ID from the authenticated user (from auth middleware)
    // Prioritize Google OAuth structure (req.user.user._id)
    const instructorId = req.user?.user?._id || req.instructor?.id || req.user?._id;
    
    console.log('=== Schedule Creation Debug ===');
    console.log('req.instructor:', req.instructor);
    console.log('req.user:', req.user);
    console.log('req.user.user:', req.user?.user);
    console.log('Extracted instructorId:', instructorId);
    
    if (!instructorId) {
      return res.status(401).json({
        success: false,
        message: 'Instructor authentication required'
      });
    }

    const {
      title,
      description,
      eventType,
      startDateTime,
      endDateTime,
      sectionId,
      subjectId,
      location,
      notes,
      syncToGoogleCalendar
    } = req.body;

    // Helper: normalize datetime-local strings to include seconds if missing
    const normalizeDateTimeString = (s) => {
      if (!s) return s;
      // If format is YYYY-MM-DDTHH:MM (no seconds), append :00
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
      return s;
    };

    const normalizedStart = normalizeDateTimeString(startDateTime);
    const normalizedEnd = normalizeDateTimeString(endDateTime);

    // Validate that end is after start
    if (normalizedStart && normalizedEnd) {
      const startDateObj = new Date(normalizedStart);
      const endDateObj = new Date(normalizedEnd);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      if (startDateObj >= endDateObj) {
        return res.status(400).json({ success: false, message: 'End date/time must be after start date/time' });
      }
    }

    // Validate required fields
    if (!title || !eventType || !startDateTime || !endDateTime || !sectionId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Verify section and subject exist
    const section = await Section.findById(sectionId);
    const subject = await Subject.findById(subjectId);

    if (!section || !subject) {
      return res.status(404).json({
        success: false,
        message: 'Section or subject not found'
      });
    }

    // Verify that the instructor is assigned to this section
    const sectionInstructorId = section.instructor.toString();
    const currentInstructorId = instructorId.toString();
    
    console.log('Schedule creation - Section instructor:', sectionInstructorId);
    console.log('Schedule creation - Current instructor:', currentInstructorId);
    console.log('Schedule creation - Match:', sectionInstructorId === currentInstructorId);
    
    if (sectionInstructorId !== currentInstructorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create schedules for sections assigned to you',
        debug: {
          sectionInstructor: sectionInstructorId,
          currentInstructor: currentInstructorId
        }
      });
    }

    // Create schedule object
    const scheduleData = {
      title,
      description,
      eventType,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      section: sectionId,
      subject: subjectId,
      instructor: instructorId,
      location,
      notes
    };

    // Sync to Google Calendar if requested
    if (syncToGoogleCalendar) {
      // Get instructor's Google Calendar credentials
      const instructorWithTokens = await Instructor.findById(instructorId).select(
        'googleAccessToken googleRefreshToken googleCalendarConnected'
      );

      if (instructorWithTokens && instructorWithTokens.googleCalendarConnected) {
        // Use the original datetime-local strings sent from the client instead of
        // scheduleData.startDateTime.toISOString() which converts to UTC and
        // causes unwanted shifts when Google interprets the value.
        // The `startDateTime` / `endDateTime` variables come from req.body and
        // represent the user's local intended date/time (e.g. "2025-11-11T10:30").
        const calendarEventData = {
          title: `${title} - ${subject.subjectCode}`,
          description: `${description || ''}\n\nSection: ${section.sectionName}\nType: ${eventType.toUpperCase()}`,
          // Use normalized values (with seconds) to satisfy RFC3339 requirements
          startDateTime: normalizedStart || startDateTime,
          endDateTime: normalizedEnd || endDateTime,
          location: location || '',
          eventType
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

    // Populate references
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('section', 'sectionName students')
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'firstName lastName email fullName');

    // Send email notifications to all students in the section
    try {
      // Get full section details with populated students
      const sectionWithStudents = await Section.findById(sectionId)
        .populate('students', 'email firstName lastName fullName');
      
      // Get instructor details
      const instructor = await Instructor.findById(instructorId);
      const instructorName = instructor?.fullName || instructor?.firstName + ' ' + instructor?.lastName || 'Your Instructor';

      if (sectionWithStudents && sectionWithStudents.students && sectionWithStudents.students.length > 0) {
        const scheduleDetails = {
          title,
          eventType,
          startDateTime,
          endDateTime,
          location: location || 'Not specified',
          description: description || '',
          sectionName: populatedSchedule.section.sectionName,
          subjectCode: populatedSchedule.subject.subjectCode,
          subjectName: populatedSchedule.subject.subjectName
        };

        // Send emails to all students in the section
        const emailPromises = sectionWithStudents.students.map(student => {
          const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
          return emailService.sendScheduleNotification({
            studentEmail: student.email,
            studentName,
            instructorName,
            scheduleDetails
          });
        });

        // Send all emails in parallel but don't wait for them to complete
        Promise.all(emailPromises)
          .then(results => {
            const successCount = results.filter(r => r.success).length;
            console.log(`✅ Schedule notification emails sent: ${successCount}/${sectionWithStudents.students.length}`);
          })
          .catch(error => {
            console.error('❌ Error sending schedule notification emails:', error);
          });
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('❌ Error sending schedule notification emails:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule: populatedSchedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating schedule',
      error: error.message
    });
  }
};

export const getInstructorSchedules = async (req, res) => {
  try {
    // Prioritize Google OAuth structure (req.user.user._id)
    const instructorId = req.user?.user?._id || req.instructor?.id || req.user?._id;
    const { startDate, endDate, eventType, sectionId } = req.query;

    // Build query
    const query = { instructor: instructorId, isActive: true };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.startDateTime = {};
      if (startDate) query.startDateTime.$gte = new Date(startDate);
      if (endDate) query.startDateTime.$lte = new Date(endDate);
    }

    // Add event type filter
    if (eventType) {
      query.eventType = eventType;
    }

    // Add section filter
    if (sectionId) {
      query.section = sectionId;
    }

    const schedules = await Schedule.find(query)
      .populate('section', 'sectionName')
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'firstName lastName email')
      .sort({ startDateTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules',
      error: error.message
    });
  }
};

export const getStudentSchedules = async (req, res) => {
  try {
    // Extract student ID - prioritize Google OAuth structure (req.user.user._id)
    const studentId = req.user?.user?._id || req.student?.id || req.user?._id;
    const { startDate, endDate, eventType } = req.query;

    console.log('=== Get Student Schedules Debug ===');
    console.log('req.student:', req.student);
    console.log('req.user:', req.user);
    console.log('req.user.user:', req.user?.user);
    console.log('Extracted studentId:', studentId);

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Student authentication required'
      });
    }

    // Find all sections the student is enrolled in
    const sections = await Section.find({ students: studentId });
    const sectionIds = sections.map(section => section._id);
    
    console.log('Student enrolled in sections:', sectionIds.length);

    if (sectionIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        schedules: []
      });
    }

    // Build query
    const query = { section: { $in: sectionIds }, isActive: true };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.startDateTime = {};
      if (startDate) query.startDateTime.$gte = new Date(startDate);
      if (endDate) query.startDateTime.$lte = new Date(endDate);
    }

    // Add event type filter
    if (eventType) {
      query.eventType = eventType;
    }

    const schedules = await Schedule.find(query)
      .populate('section', 'sectionName')
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'firstName lastName email fullName')
      .sort({ startDateTime: 1 });

    console.log('=== Student Schedules Query Result ===');
    console.log('Student schedules found:', schedules.length);
    if (schedules.length > 0) {
      console.log('First schedule instructor ID (raw):', schedules[0].instructor);
      console.log('First schedule instructor populated:', JSON.stringify(schedules[0].instructor, null, 2));
      console.log('Has instructor?:', !!schedules[0].instructor);
      if (schedules[0].instructor) {
        console.log('Instructor firstName:', schedules[0].instructor.firstName);
        console.log('Instructor lastName:', schedules[0].instructor.lastName);
        console.log('Instructor fullName:', schedules[0].instructor.fullName);
      }
    }

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules',
      error: error.message
    });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract user ID - prioritize Google OAuth structure (req.user.user._id)
    const userId = req.user?.user?._id || req.instructor?.id || req.student?.id || req.user?._id;
    const userRole = req.user?.role || req.instructor ? 'instructor' : req.student ? 'student' : req.user?.userType;

    const schedule = await Schedule.findById(id)
      .populate('section', 'sectionName students')
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'firstName lastName email');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user has permission to view this schedule
    if (userRole === 'instructor' && schedule.instructor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this schedule'
      });
    }

    if (userRole === 'student' && !schedule.section.students.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this schedule'
      });
    }

    res.status(200).json({
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedule',
      error: error.message
    });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract instructor ID - prioritize Google OAuth structure (req.user.user._id)
    const instructorId = req.user?.user?._id || req.instructor?.id || req.user?._id;
    const {
      title,
      description,
      eventType,
      startDateTime,
      endDateTime,
      location,
      notes,
      syncToGoogleCalendar
    } = req.body;

    console.log('=== Update Schedule Debug ===');
    console.log('req.instructor:', req.instructor);
    console.log('req.user:', req.user);
    console.log('req.user.user:', req.user?.user);
    console.log('Extracted instructorId:', instructorId);

    if (!instructorId) {
      return res.status(401).json({
        success: false,
        message: 'Instructor authentication required'
      });
    }

    // Find schedule
    const schedule = await Schedule.findById(id).populate('section');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const scheduleInstructorId = schedule.instructor._id || schedule.instructor;
    const sectionInstructorId = schedule.section.instructor._id || schedule.section.instructor;
    
    console.log('Schedule instructor ID:', scheduleInstructorId.toString());
    console.log('Section instructor ID:', sectionInstructorId.toString());
    console.log('Current instructor ID:', instructorId.toString());
    console.log('Schedule match:', scheduleInstructorId.toString() === instructorId.toString());
    console.log('Section match:', sectionInstructorId.toString() === instructorId.toString());

    // Check if user is the instructor who created this schedule
    // Use equals() method for proper MongoDB ObjectId comparison
    const scheduleMatch = scheduleInstructorId.equals 
      ? scheduleInstructorId.equals(instructorId) 
      : scheduleInstructorId.toString() === instructorId.toString();

    if (!scheduleMatch) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this schedule',
        debug: {
          scheduleInstructor: scheduleInstructorId.toString(),
          currentInstructor: instructorId.toString(),
          reason: 'Schedule owner mismatch'
        }
      });
    }

    // Verify that the instructor is still assigned to this section
    const sectionMatch = sectionInstructorId.equals 
      ? sectionInstructorId.equals(instructorId) 
      : sectionInstructorId.toString() === instructorId.toString();

    if (!sectionMatch) {
      return res.status(403).json({
        success: false,
        message: 'You can only update schedules for sections assigned to you',
        debug: {
          sectionInstructor: sectionInstructorId.toString(),
          currentInstructor: instructorId.toString(),
          reason: 'Section instructor mismatch'
        }
      });
    }

    // Update fields
    if (title) schedule.title = title;
    if (description !== undefined) schedule.description = description;
    if (eventType) schedule.eventType = eventType;
    if (startDateTime) schedule.startDateTime = new Date(startDateTime);
    if (endDateTime) schedule.endDateTime = new Date(endDateTime);
    if (location !== undefined) schedule.location = location;
    if (notes !== undefined) schedule.notes = notes;

    // Update Google Calendar event if synced
    if (syncToGoogleCalendar && schedule.googleEventId) {
      // Get instructor's Google Calendar credentials
      const instructorWithTokens = await Instructor.findById(instructorId).select(
        'googleAccessToken googleRefreshToken googleCalendarConnected'
      );

      if (instructorWithTokens && instructorWithTokens.googleCalendarConnected) {
        const subject = await Subject.findById(schedule.subject);
        const section = await Section.findById(schedule.section);

        // If the client provided updated start/end strings use them (they are
        // datetime-local strings). Otherwise, format the existing Date object
        // to a local-like string without the trailing Z to avoid UTC conversion.
        // Normalize any provided incoming datetimes and validate them if both are present
        const normalizedStartUpdate = normalizeDateTimeString(startDateTime);
        const normalizedEndUpdate = normalizeDateTimeString(endDateTime);

        if (normalizedStartUpdate && normalizedEndUpdate) {
          const s = new Date(normalizedStartUpdate);
          const e = new Date(normalizedEndUpdate);
          if (isNaN(s.getTime()) || isNaN(e.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
          }
          if (s >= e) {
            return res.status(400).json({ success: false, message: 'End date/time must be after start date/time' });
          }
        }

        // When updating, prefer the provided normalized values, otherwise format existing Date
        const formattedStart = normalizedStartUpdate || (schedule.startDateTime instanceof Date ? schedule.startDateTime.toISOString().replace(/\.\d{3}Z$/, '') : schedule.startDateTime);
        const formattedEnd = normalizedEndUpdate || (schedule.endDateTime instanceof Date ? schedule.endDateTime.toISOString().replace(/\.\d{3}Z$/, '') : schedule.endDateTime);

        const calendarEventData = {
          title: `${schedule.title} - ${subject.subjectCode}`,
          description: `${schedule.description || ''}\n\nSection: ${section.sectionName}\nType: ${schedule.eventType.toUpperCase()}`,
          startDateTime: formattedStart,
          endDateTime: formattedEnd,
          location: schedule.location || '',
          eventType: schedule.eventType
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

    await schedule.save();

    // Populate references
    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate('section', 'sectionName students')
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'firstName lastName email fullName');

    // Send email notifications to all students in the section about the update
    try {
      const sectionWithStudents = await Section.findById(schedule.section._id)
        .populate('students', 'email firstName lastName fullName');
      
      const instructor = await Instructor.findById(instructorId);
      const instructorName = instructor?.fullName || instructor?.firstName + ' ' + instructor?.lastName || 'Your Instructor';

      if (sectionWithStudents && sectionWithStudents.students && sectionWithStudents.students.length > 0) {
        const scheduleDetails = {
          title: schedule.title,
          eventType: schedule.eventType,
          startDateTime: schedule.startDateTime,
          endDateTime: schedule.endDateTime,
          location: schedule.location || 'Not specified',
          description: `[UPDATED] ${schedule.description || ''}`,
          sectionName: updatedSchedule.section.sectionName,
          subjectCode: updatedSchedule.subject.subjectCode,
          subjectName: updatedSchedule.subject.subjectName
        };

        const emailPromises = sectionWithStudents.students.map(student => {
          const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
          return emailService.sendScheduleNotification({
            studentEmail: student.email,
            studentName,
            instructorName,
            scheduleDetails
          });
        });

        Promise.all(emailPromises)
          .then(results => {
            const successCount = results.filter(r => r.success).length;
            console.log(`✅ Schedule update notification emails sent: ${successCount}/${sectionWithStudents.students.length}`);
          })
          .catch(error => {
            console.error('❌ Error sending schedule update notification emails:', error);
          });
      }
    } catch (emailError) {
      console.error('❌ Error sending schedule update notification emails:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating schedule',
      error: error.message
    });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract instructor ID - prioritize Google OAuth structure (req.user.user._id)
    const instructorId = req.user?.user?._id || req.instructor?.id || req.user?._id;

    console.log('=== Delete Schedule Debug ===');
    console.log('req.instructor:', req.instructor);
    console.log('req.user:', req.user);
    console.log('req.user.user:', req.user?.user);
    console.log('Extracted instructorId:', instructorId);

    if (!instructorId) {
      return res.status(401).json({
        success: false,
        message: 'Instructor authentication required'
      });
    }

    // Find schedule
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const scheduleInstructorId = schedule.instructor._id || schedule.instructor;
    console.log('Schedule instructor ID:', scheduleInstructorId.toString());
    console.log('Current instructor ID:', instructorId.toString());
    console.log('Match:', scheduleInstructorId.toString() === instructorId.toString());

    // Check if user is the instructor who created this schedule
    // Use equals() method for proper MongoDB ObjectId comparison
    const scheduleMatch = scheduleInstructorId.equals 
      ? scheduleInstructorId.equals(instructorId) 
      : scheduleInstructorId.toString() === instructorId.toString();

    if (!scheduleMatch) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this schedule',
        debug: {
          scheduleInstructor: scheduleInstructorId.toString(),
          currentInstructor: instructorId.toString(),
          reason: 'Schedule owner mismatch'
        }
      });
    }

    // Delete from Google Calendar if synced
    if (schedule.googleEventId) {
      // Get instructor's Google Calendar credentials
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

    // Soft delete - mark as inactive
    schedule.isActive = false;
    await schedule.save();

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting schedule',
      error: error.message
    });
  }
};

export const getUpcomingSchedules = async (req, res) => {
  try {
    // Extract user ID - prioritize Google OAuth structure (req.user.user._id)
    const userId = req.user?.user?._id || req.instructor?.id || req.student?.id || req.user?._id;
    const userRole = req.user?.role || (req.instructor ? 'instructor' : req.student ? 'student' : req.user?.userType);
    const limit = parseInt(req.query.limit) || 5;

    let query = { isActive: true, startDateTime: { $gte: new Date() } };

    if (userRole === 'instructor') {
      query.instructor = userId;
    } else if (userRole === 'student') {
      // Find sections student is enrolled in
      const sections = await Section.find({ students: userId });
      const sectionIds = sections.map(section => section._id);
      query.section = { $in: sectionIds };
    }

    const schedules = await Schedule.find(query)
      .populate('section', 'sectionName')
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'firstName lastName email')
      .sort({ startDateTime: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching upcoming schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming schedules',
      error: error.message
    });
  }
};
