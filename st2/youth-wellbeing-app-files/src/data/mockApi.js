import { computeRiskScore, riskLevelFromScore } from '../logic/riskEngine';

let students = [
  {
    id: 's1',
    name: 'Alex Chen',
    history: [],
  },
  {
    id: 's2',
    name: 'Jordan Singh',
    history: [],
  },
  {
    id: 's3',
    name: 'Maya Rodriguez',
    history: [],
  },
];

let currentStudentId = 's1';

export function getCurrentStudent() {
  return students.find(s => s.id === currentStudentId);
}

export function submitWeeklyCheckIn(answers) {
  const student = getCurrentStudent();
  const score = computeRiskScore(answers);
  const level = riskLevelFromScore(score);

  const week = student.history.length + 1;

  const record = {
    week,
    timestamp: new Date().toISOString(),
    answers,
    score,
    level,
  };

  student.history.push(record);

  return { student, record };
}

export function getAllStudents() {
  return students;
}

export function getDashboardOverview() {
  const now = new Date().toISOString();

  const items = students.map(s => {
    const last = s.history[s.history.length - 1];
    const prev = s.history[s.history.length - 2];

    let trend = 'flat';
    if (last && prev) {
      if (last.score - prev.score >= 4) trend = 'up';
      else if (prev.score - last.score >= 4) trend = 'down';
    }

    return {
      id: s.id,
      name: s.name,
      lastRecord: last || null,
      trend,
    };
  });

  const bigMovers = items.filter(i => {
    if (!i.lastRecord) return false;
    if (i.lastRecord.level === 'red') return true;
    return i.trend === 'up';
  });

  return {
    timestamp: now,
    students: items,
    bigMovers,
  };
}

export function getStudentById(id) {
  return students.find(s => s.id === id);
}
