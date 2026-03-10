import { createHash } from "node:crypto";

export const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const normalizeIdentifier = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const hashLookupValue = (value) => {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
};

export const buildInstructorLookupFields = ({ email, instructorid }) => ({
  emailHash: hashLookupValue(normalizeEmail(email)),
  instructorIdHash: hashLookupValue(normalizeIdentifier(instructorid)),
});
