// utils/gradeUtils.js
export const percentToGrade = (percent) => {
  if (percent >= 97) return 1.0;
  if (percent >= 94) return 1.25;
  if (percent >= 91) return 1.5;
  if (percent >= 88) return 1.75;
  if (percent >= 85) return 2.0;
  if (percent >= 82) return 2.25;
  if (percent >= 79) return 2.5;
  if (percent >= 76) return 2.75;
  if (percent >= 50) return 3.0;
  return 5.0;
};

export const computeScoresByStudent = (activityScores) => {
  const map = {};
  for (const s of activityScores) {
    const sid = s?.student?._id ? String(s.student._id) : null;
    if (!sid) continue;
    const aid = String(s.activity);
    map[sid] ||= {};
    map[sid][aid] = Number(s.score || 0);
  }
  return map;
};

export const avgFor = (acts, student, scoresByStudent) => {
  if (!acts.length) return 0;
  const sMap = scoresByStudent[String(student._id)] || {};
  const percents = acts.map((a) => {
    const score = Number(sMap[String(a._id)] || 0);
    const max = Number(a.maxScore ?? 100) || 0;
    return max > 0 ? (score / max) * 100 : 0;
  });
  return percents.reduce((a, b) => a + b, 0) / percents.length;
};
