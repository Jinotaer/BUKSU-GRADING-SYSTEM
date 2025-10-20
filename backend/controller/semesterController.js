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
    const semesters = await Semester.find().sort({ schoolYear: -1, term: 1 });
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
