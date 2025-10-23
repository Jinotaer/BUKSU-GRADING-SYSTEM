// controller/activityScoresController.js
import Activity from "../models/activity.js";
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import Student from "../models/student.js";
import ActivityScore from "../models/activityScore.js";
import emailService from "../services/emailService.js";
import { getInstructorId } from "../utils/getInstructorId.js";

// GET /activities/:activityId/scores?sectionId=...
export const getActivityScores = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { sectionId } = req.query;

    if (!sectionId) {
      return res.status(400).json({ success:false, message:"sectionId is required" });
    }

    const section = await Section.findById(sectionId)
      .populate("students", "fullName email studid")
      .populate("subject", "subjectCode subjectName");
    if (!section) return res.status(404).json({ success:false, message:"Section not found" });

    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ success:false, message:"Activity not found" });

    const scores = await ActivityScore.find({ activity:activityId, section:sectionId })
      .select("student score maxScore")
      .lean();

    const scoreMap = new Map(scores.map(s => [String(s.student), s]));
    const rows = section.students.map(stu => ({
      studentId: String(stu._id),
      fullName: stu.fullName,
      email: stu.email,
      studid: stu.studid,
      score: scoreMap.get(String(stu._id))?.score ?? null,
      maxScore: scoreMap.get(String(stu._id))?.maxScore ?? activity.maxScore ?? 100,
    }));

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

    const incoming = rows
      .map(r => ({ studentId: String(r.studentId), score: Number(r.score ?? 0) }))
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
    const prevMap = new Map(prevDocs.map(d => [String(d.student), Number(d.score)]));

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
              score: Math.max(0, Math.min(max, Number(score))),
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
      .filter(({ studentId, score }) => prevMap.get(studentId) !== Number(score))
      .map(r => r.studentId);

    if (notify && changedIds.length) {
      const lookup = new Map(section.students.map(s => [String(s._id), s]));
      const instructorName = section?.instructor?.fullName || "Your Instructor";
      const { subjectCode, subjectName } = section.subject;
      const sectionName = section.sectionName;
      const activityTitle = activity.title;

      const base = process.env.STUDENT_PORTAL_BASE_URL || "http://localhost:5173";
      const viewUrl = `${base}/student/sections/${sectionId}/activities/${activityId}`;

      Promise.allSettled(
        changedIds.map((sid) => {
          const s = lookup.get(sid);
          if (!s?.email) return Promise.resolve();
          const newScore = incoming.find(r => r.studentId === sid)?.score ?? 0;
          return emailService.sendActivityScoreNotification({
            studentEmail: s.email,
            studentName: s.fullName,
            instructorName,
            sectionName,
            subjectCode,
            subjectName,
            activityTitle,
            score: newScore,
            maxScore: max,
            viewUrl,
          });
        })
      ).catch(() => {});
    }

    return res.json({ success:true, message:"Scores saved" });
  } catch (err) {
    console.error("upsertActivityScoresBulk:", err);
    return res.status(500).json({ success:false, message:"Server error" });
  }
};
