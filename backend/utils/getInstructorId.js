// utils/getInstructorId.js
export const getInstructorId = (req) =>
  req?.instructor?.id ||
  req?.user?.user?._id?.toString?.() ||
  req?.user?.id ||
  req?.user?._id?.toString?.() ||
  null;