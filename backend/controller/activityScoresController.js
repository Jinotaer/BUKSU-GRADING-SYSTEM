// controller/activityScoresController.js
import Activity from "../models/activity.js";
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import Student from "../models/student.js";
import ActivityScore from "../models/activityScore.js";
import emailService from "../services/emailService.js";
import { getInstructorId } from "../utils/getInstructorId.js";
import { calculateAndUpdateGrades } from "../utils/gradeCalculator.js";
import { bulkDecryptUserData, decryptInstructorData } from "./decryptionController.js";

// GET /activities/:activityId/scores?sectionId=...
export const getActivityScores = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { sectionId } = req.query;

    if (!sectionId) {
      return res.status(400).json({ success:false, message:"sectionId is required" });
    }

    // Check user role to determine access level
    const userRole = req.user?.role;
    const userId = req.user?.user?._id;

    const section = await Section.findById(sectionId)
      .populate("students", "fullName email studid")
      .populate("subject", "subjectCode subjectName");
    if (!section) return res.status(404).json({ success:false, message:"Section not found" });

    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ success:false, message:"Activity not found" });

    // If student, verify they are enrolled in this section
    if (userRole === 'student') {
      const isEnrolled = section.students.some(student => String(student._id) === String(userId));
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: "Access denied. Not enrolled in this section." });
      }
    }

    const scores = await ActivityScore.find({ activity:activityId, section:sectionId })
      .select("student score maxScore")
      .lean();

    const scoreMap = new Map(scores.map(s => [String(s.student), s]));
    
    // Decrypt student data before sending to frontend
    const decryptedStudents = bulkDecryptUserData(
      section.students.map(s => s.toObject()),
      'student'
    );
    
    let rows;
    if (userRole === 'student') {
      // Students only see their own scores
      const studentRecord = decryptedStudents.find(stu => String(stu._id) === String(userId));
      if (studentRecord) {
        rows = [{
          studentId: String(studentRecord._id),
          fullName: studentRecord.fullName,
          email: studentRecord.email,
          studid: studentRecord.studid,
          score: scoreMap.get(String(studentRecord._id))?.score ?? null,
          maxScore: scoreMap.get(String(studentRecord._id))?.maxScore ?? activity.maxScore ?? 100,
        }];
      } else {
        rows = [];
      }
    } else {
      // Instructors see all students' scores
      rows = decryptedStudents.map(stu => ({
        studentId: String(stu._id),
        fullName: stu.fullName,
        email: stu.email,
        studid: stu.studid,
        score: scoreMap.get(String(stu._id))?.score ?? null,
        maxScore: scoreMap.get(String(stu._id))?.maxScore ?? activity.maxScore ?? 100,
      }));
    }

    return res.json({
      success: true,
      section: {
        id: String(section._id),
        sectionName: section.sectionName,
        subjectCode: section.subject?.subjectCode,
        subjectName: section.subject?.subjectName,
      },
      activity: {
        id: String(activity._id),
        title: activity.title,
        maxScore: activity.maxScore,
      },
      rows,
    });
  } catch (err) {
    console.error("getActivityScores:", err);
    return res.status(500).json({ success:false, message:"Server error" });
  }
};

// POST /activities/:activityId/scores
// body: { sectionId, rows: [{studentId, score}], notify?: boolean }
export const upsertActivityScoresBulk = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { sectionId, rows, notify = true } = req.body;
    const instructorId = getInstructorId(req);

    if (!sectionId) return res.status(400).json({ success:false, message:"sectionId is required" });
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success:false, message:"rows must be a non-empty array" });
    }

    const section = await Section.findById(sectionId)
      .populate("students", "fullName email")
      .populate("subject", "subjectCode subjectName")
      .populate("instructor", "fullName");
    if (!section) return res.status(404).json({ success:false, message:"Section not found" });

    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ success:false, message:"Activity not found" });

    const max = Number(activity.maxScore ?? 100);
    const validIds = new Set(section.students.map(s => String(s._id)));

    // Preserve null for empty scores. Do not coerce null/undefined to 0 here.
    const incoming = rows
      .map(r => ({
        studentId: String(r.studentId),
        score: r.score === null || r.score === undefined ? null : Number(r.score),
      }))
      .filter(r => validIds.has(r.studentId));

    if (incoming.length === 0) {
      return res.status(400).json({ success:false, message:"No valid rows to save" });
    }

    // previous scores for changed detection
    const prevDocs = await ActivityScore.find({
      activity: activityId,
      section: sectionId,
      student: { $in: incoming.map(r => r.studentId) },
    }, { student:1, score:1 });
    // Keep null as null when comparing previous values
    const prevMap = new Map(prevDocs.map(d => [String(d.student), d.score === null || d.score === undefined ? null : Number(d.score)]));

    // upsert
    await ActivityScore.bulkWrite(
      incoming.map(({ studentId, score }) => ({
        updateOne: {
          filter: { activity: activityId, section: sectionId, student: studentId },
          update: {
            $set: {
              activity: activityId,
              section: sectionId,
              subject: section.subject._id,
              student: studentId,
              // If score is null, store null; otherwise bound it between 0 and max
              score: score === null ? null : Math.max(0, Math.min(max, Number(score))),
              maxScore: max,
              gradedBy: instructorId || null,
              gradedAt: new Date(),
            },
          },
          upsert: true,
        },
      }))
    );

    // email notifications only for changed scores
    const changedIds = incoming
      .filter(({ studentId, score }) => {
        const prev = prevMap.get(studentId);
        const curr = score === null ? null : Number(score);
        return prev !== curr;
      })
      .map(r => r.studentId);

    if (notify && changedIds.length) {
      // Decrypt student data before sending emails
      // Convert Mongoose documents to plain objects first
      const plainStudents = section.students.map(s => s.toObject());
      const decryptedStudents = bulkDecryptUserData(plainStudents, 'student');
      const lookup = new Map(decryptedStudents.map(s => [String(s._id), s]));
      console.log('📧 Notifying students about score changes:', decryptedStudents.filter(s => changedIds.includes(String(s._id))).map(s => s.email));
      
      // Decrypt instructor data
      const decryptedInstructor = section?.instructor ? decryptInstructorData(section.instructor.toObject()) : null;
      const instructorName = decryptedInstructor?.fullName || "Your Instructor";
      const { subjectCode, subjectName } = section.subject;
      const sectionName = section.sectionName;
      const activityTitle = activity.title;

      const base = process.env.STUDENT_PORTAL_BASE_URL || "http://localhost:5173";
      const viewUrl = `${base}/student/sections/${sectionId}/activities/${activityId}`;

      Promise.allSettled(
        changedIds.map((sid) => {
          const s = lookup.get(sid);
          if (!s?.email) return Promise.resolve();
          const inc = incoming.find(r => r.studentId === sid);
          const newScore = inc ? inc.score : null;
          // Only send notification if there's an actual numeric score change
          if (newScore === null) return Promise.resolve();
          return emailService.sendActivityScoreNotification({
            studentEmail: s.email,
            studentName: s.fullName,
            instructorName,
            sectionName,
            subjectCode,
            subjectName,
            activityTitle,
            score: Number(newScore),
            maxScore: max,
            viewUrl,
          });
        })
      ).catch(() => {});
    }

    // Send notifications to students with NO scores (only if this is a bulk upload)
    if (notify && incoming.length > 1) {
      const uploadedStudentIds = new Set(incoming.map(r => r.studentId));
      
      // Decrypt student data
      // Convert Mongoose documents to plain objects first
      const plainStudents = section.students.map(s => s.toObject());
      const decryptedStudents = bulkDecryptUserData(plainStudents, 'student');
      console.log('📧 Notifying students with no scores:', decryptedStudents.filter(s => !uploadedStudentIds.has(String(s._id))).map(s => s.email));
      const studentsWithNoScores = decryptedStudents.filter(
        student => !uploadedStudentIds.has(String(student._id))
      );

      if (studentsWithNoScores.length > 0) {
        // Decrypt instructor data
        const decryptedInstructor = section?.instructor ? decryptInstructorData(section.instructor.toObject()) : null;
        const instructorName = decryptedInstructor?.fullName || "Your Instructor";
        const { subjectCode, subjectName } = section.subject;
        const sectionName = section.sectionName;
        const activityTitle = activity.title;

        const base = process.env.STUDENT_PORTAL_BASE_URL || "http://localhost:5173";
        const viewUrl = `${base}/student/sections/${sectionId}/activities`;

        Promise.allSettled(
          studentsWithNoScores.map((student) => {
            if (!student.email) return Promise.resolve();
            return emailService.sendNoScoreNotification({
              studentEmail: student.email,
              studentName: student.fullName,
              instructorName,
              sectionName,
              subjectCode,
              subjectName,
              activityTitle,
              maxScore: max,
              viewUrl,
            });
          })
        ).then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          console.log(`[activityScores] Sent no-score notifications to ${successful}/${studentsWithNoScores.length} students`);
        }).catch(() => {});
      }
    }

    // Recalculate grades for all affected students in real-time
    const affectedStudentIds = incoming.map(r => r.studentId);
    if (affectedStudentIds.length > 0) {
      // Run grade calculation in background (non-blocking)
      calculateAndUpdateGrades(affectedStudentIds, sectionId, instructorId)
        .then(results => {
          console.log(`[activityScores] Grades updated for ${results.successful.length} students in section ${sectionId}`);
          if (results.failed.length > 0) {
            console.error(`[activityScores] Failed to update grades for ${results.failed.length} students:`, results.failed);
          }
        })
        .catch(err => {
          console.error('[activityScores] Error updating grades:', err);
        });
    }

    return res.json({ success:true, message:"Scores saved" });
  } catch (err) {
    console.error("upsertActivityScoresBulk:", err);
    return res.status(500).json({ success:false, message:"Server error" });
  }
};
