import Semester from "../models/semester.js";

export const requireActiveSemester = async (req, res, next) => {
  try {
    const hasActiveSemester = await Semester.exists({
      isArchived: { $ne: true },
      isActive: true,
    });

    if (!hasActiveSemester) {
      return res.status(409).json({
        success: false,
        code: "NO_ACTIVE_TERM",
        message:
          "No Current Active Term is set. Please set an active semester before performing this action.",
      });
    }

    return next();
  } catch (error) {
    console.error("requireActiveSemester middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
