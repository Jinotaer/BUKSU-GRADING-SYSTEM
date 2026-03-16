import Schedule from "../models/schedule.js";

export const normalizeActivityTitle = (title = "") =>
  String(title)
    .trim()
    .replace(/\s+/g, " ");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildActivityTitleRegex = (title) =>
  new RegExp(`^${escapeRegex(normalizeActivityTitle(title))}$`, "i");

export const getSectionScheduleIds = async (sectionId) => {
  if (!sectionId) {
    return [];
  }

  return Schedule.find({ section: sectionId }).distinct("_id");
};
