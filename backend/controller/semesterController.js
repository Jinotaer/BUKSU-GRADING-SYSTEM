// controllers/semesterController.js
import Semester from "../models/semester.js";

export const addSemester = async (req, res) => {
  try {
    const { schoolYear, term } = req.body;
    if (!schoolYear || !term) return res.status(400).json({ message: "schoolYear and term are required" });

    const exists = await Semester.findOne({ schoolYear, term });
    if (exists) return res.status(400).json({ message: "Semester already exists" });

    const semester = await Semester.create({ schoolYear, term });
    return res.status(201).json({ success: true, semester });
  } catch (err) {
    console.error("addSemester:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listSemesters = async (req, res) => {
  try {
    const { includeArchived = false } = req.query;
    
    const filter = {};
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    const semesters = await Semester.find(filter).sort({ schoolYear: -1, term: 1 });
    res.json({ success: true, semesters });
  } catch (err) {
    console.error("listSemesters:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolYear, term } = req.body;

    if (!schoolYear || !term) {
      return res.status(400).json({ message: "schoolYear and term are required" });
    }

    // Check if another semester exists with the same schoolYear and term
    const exists = await Semester.findOne({ 
      schoolYear, 
      term, 
      _id: { $ne: id } 
    });
    
    if (exists) {
      return res.status(400).json({ message: "Semester already exists" });
    }

    const semester = await Semester.findByIdAndUpdate(
      id,
      { schoolYear, term },
      { new: true, runValidators: true }
    );

    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.json({ success: true, semester });
  } catch (err) {
    console.error("updateSemester:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const semester = await Semester.findByIdAndDelete(id);
    
    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.json({ success: true, message: "Semester deleted successfully" });
  } catch (err) {
    console.error("deleteSemester:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Archive semester
export const archiveSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin.email;

    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    if (semester.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Semester is already archived",
      });
    }

    semester.isArchived = true;
    semester.archivedAt = new Date();
    semester.archivedBy = adminEmail;
    await semester.save();

    res.status(200).json({
      success: true,
      message: "Semester archived successfully",
      semester: {
        id: semester._id,
        schoolYear: semester.schoolYear,
        term: semester.term,
        isArchived: semester.isArchived,
        archivedAt: semester.archivedAt,
        archivedBy: semester.archivedBy,
      },
    });
  } catch (error) {
    console.error("Archive semester error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unarchive semester
export const unarchiveSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    if (!semester.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Semester is not archived",
      });
    }

    semester.isArchived = false;
    semester.archivedAt = null;
    semester.archivedBy = null;
    await semester.save();

    res.status(200).json({
      success: true,
      message: "Semester unarchived successfully",
      semester: {
        id: semester._id,
        schoolYear: semester.schoolYear,
        term: semester.term,
        isArchived: semester.isArchived,
      },
    });
  } catch (error) {
    console.error("Unarchive semester error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
