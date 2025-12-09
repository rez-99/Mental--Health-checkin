// src/logic/riskEngine.js

export function computeRiskScore(answers) {
  const {
    mood,
    sleep,
    concentration,
    energy,
    worries,
    hopelessness,
  } = answers;

  const moodRisk = 5 - mood; // 0 (very happy) to 4 (very sad)

  const weighted =
    moodRisk * 2 +
    sleep * 1.5 +
    concentration * 1.5 +
    energy * 1.5 +
    worries * 1.5 +
    hopelessness * 2;

  return weighted;
}

export function riskLevelFromScore(score) {
  if (score < 12) return 'green';
  if (score < 20) return 'yellow';
  return 'red';
}
