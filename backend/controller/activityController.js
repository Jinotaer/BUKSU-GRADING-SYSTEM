// controllers/activityController.js
import Activity from "../models/activity.js";
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import Semester from "../models/semester.js";

// Safely get the current instructor id from the request, regardless of shape
const getInstructorId = (req) =>
  req?.instructor?.id ||
  req?.user?.id ||
  req?.user?.user?._id?.toString() ||
  null;

// Create new activity
export const createActivity = async (req, res) => {
  try {
    const { title, description, category, maxScore, sectionId } = req.body;

    // Validate required fields
    if (!title || !category || !maxScore || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Title, category, max score, and sectionId are required",
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

    // Map section term -> activity term display
    const termMapping = { "1st": "First", "2nd": "Second", Summer: "Summer" };
    const activityTerm = termMapping[section.term] || section.term;

    // Ensure Semester exists for (schoolYear, term as stored on Section)
    let semester = await Semester.findOne({
      schoolYear: section.schoolYear,
      term: section.term,
    });
    if (!semester) {
      semester = new Semester({ schoolYear: section.schoolYear, term: section.term });
      await semester.save();
    }

    // Create activity
    const activity = new Activity({
      title,
      description: description || "",
      category,
      maxScore: parseInt(maxScore, 10),
      subject: section.subject._id,
      instructor: instructorId, // owner
      semester: semester._id,
      schoolYear: section.schoolYear,
      term: activityTerm,
      isActive: true,
    });

    await activity.save();

    return res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity,
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

    // Map section term -> activity term display
    const termMapping = { "1st": "First", "2nd": "Second", Summer: "Summer" };
    const activityTerm = termMapping[section.term] || section.term;

    // Only active activities for this subject/year/term
    const activities = await Activity.find({
      subject: section.subject,
      schoolYear: section.schoolYear,
      term: activityTerm,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, activities });
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

    const updateData = req.body;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Only the owner can update (if owner is set)
    if (activity.instructor && String(activity.instructor) !== String(instructorId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this activity" });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(activityId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      activity: updatedActivity,
    });
  } catch (error) {
    console.error("Update activity error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete activity (soft delete)
export const deleteActivity = async (req, res) => {
  try {
    const instructorId = getInstructorId(req);
    if (!instructorId) {
      return res.status(401).json({ success: false, message: "Unauthorized: instructor missing" });
    }

    const { activityId } = req.params;
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Only the owner can delete (if owner is set)
    if (activity.instructor && activity.instructor.toString() !== instructorId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    activity.isActive = false;
    await activity.save();

    return res.json({ success: true, message: "Activity deleted" });
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
