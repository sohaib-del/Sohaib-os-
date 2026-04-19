const PUSHUP_BASE = 15;
const INCREMENT_EVERY = 20; // days

export function getPushupTarget(startDate) {
  if (!startDate) return PUSHUP_BASE;
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );
  const increments = Math.max(0, Math.floor(daysSinceStart / INCREMENT_EVERY));
  return PUSHUP_BASE + increments;
}
