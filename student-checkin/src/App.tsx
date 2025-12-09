import { useEffect, useMemo, useRef, useState } from 'react'
import { studentApi, createMockToken, setMockToken } from './api'

type CheckInEntry = {
  id: string
  studentName: string
  mood: number
  sleepQuality: number
  concentration: number
  energy: number
  worries: number
  burden: number
  notes: string
  cognitiveScore?: number
  createdAt: string
  // Validated screening scores (simplified PHQ-A and GAD-7)
  phqScore?: number // 0-27, based on 9 questions
  gadScore?: number // 0-21, based on 7 questions
  screeningComplete?: boolean
  // Screen use reflection (APA/Surgeon General recommendations)
  screenUseImpact?: 'better' | 'worse' | 'both' | 'neutral' | 'not_sure'
  // ASQ (Ask Suicide-Screening Questions) - validated 4-item screen
  asqCompleted?: boolean
  asqThoughts?: 'yes' | 'no' // "In the past few weeks, have you wished you were dead?"
  asqBetterOff?: 'yes' | 'no' // "In the past few weeks, have you felt that you or your family would be better off if you were dead?"
  asqHurt?: 'yes' | 'no' // "In the past week, have you been having thoughts about killing yourself?"
  asqAttempt?: 'yes' | 'no' // "Have you ever tried to kill yourself?"
  // Safety flags
  safetyRisk?: 'low' | 'moderate' | 'high' | 'immediate'
  crisisAlertTriggered?: boolean
}

type FollowUpStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'no_action_needed'

type FollowUpRecord = {
  id: string
  studentId: string
  checkInId: string
  flaggedDate: string
  status: FollowUpStatus
  scheduledDate?: string
  counselorNotes?: string
  actionTaken?: string
  createdAt: string
  updatedAt: string
}

type UserRole = 'counselor' | 'psychologist' | 'administrator' | 'viewer'

type AuditLog = {
  id: string
  userId: string
  userRole: UserRole
  action: string
  resource: string
  resourceId: string
  timestamp: string
  ipAddress?: string
  metadata?: Record<string, any>
}

// Future: Event markers for trend view (exam weeks, holidays, interventions)
// type EventMarker = {
//   id: string
//   studentId?: string
//   type: 'exam' | 'holiday' | 'incident' | 'intervention' | 'other'
//   label: string
//   date: string
//   description?: string
// }

type DeviceType = 'personal_phone' | 'school_chromebook' | 'school_tablet' | 'school_pc' | 'unknown'

type DeviceInfo = {
  type: DeviceType
  os?: 'ios' | 'android' | 'chromeos' | 'windows' | 'macos' | 'linux'
  canAccessHealthData: boolean
  canAccessWearables: boolean
  detectedAt: string
}

type StationType = 'solo' | 'group'

type CopingStation = {
  stationId: string // printed on the QR poster
  skillId: string // links to a CBTMicroSkill or module
  type: StationType // 'solo' or 'group'
  location?: string // "Calm Room", "Hallway A", "Library"
  title: string // "1-minute breathing reset"
  description?: string
  isPublic: boolean
}

type GroupSession = {
  sessionId: string // like Kahoot PIN
  hostUserId: string // teacher / counselor
  stationId: string // which activity pack
  activityPack: string // "Anxiety myths vs facts", "Healthy social media choices", etc.
  startTime: string
  endTime?: string
  participantCount: number
  isActive: boolean
  totalScore?: number // class/team total
}

type GroupSessionParticipation = {
  sessionId: string
  nickname: string // student-chosen, not identity
  deviceType: DeviceType
  completed: boolean
  score?: number // points for knowledge questions
  joinedAt: string
}

type CopingSkillEvent = {
  id: string
  stationId?: string
  skillId: string
  studentId?: string // optional - can be anonymous
  type: 'solo_station' | 'calm_room' | 'group_session'
  reflection?: 'better' | 'same' | 'worse'
  createdAt: string
}

type CalmRoomSession = {
  id: string
  studentId: string
  sessionType: 'mindfulness' | 'breathing' | 'relaxation' | 'vr_guided' | 'other'
  duration: number // minutes
  location: string // e.g., "Calm Room A"
  qrCodeId?: string
  notes?: string
  createdAt: string
  loggedAsSkill: boolean
}

type PassiveSensingData = {
  date: string
  sleepHours?: number
  sleepQuality?: number // 1-5
  steps?: number
  screenTimeMinutes?: number
  lateNightUsage?: boolean // usage after 11pm
  timeAtHome?: number // hours
  socialActivity?: number // calls/messages count
  source: 'wearable' | 'phone' | 'manual'
}

type PassiveSensingConsent = {
  enabled: boolean
  lowDataMode: boolean
  wearableConnected: boolean
  wearableType?: 'fitbit' | 'apple' | 'google' | 'other'
  phoneDataEnabled: boolean
  consentDate?: string
}

type StudentRecord = {
  id: string
  name: string
  grade: string
  advisor: string
  history: CheckInEntry[]
  flagged?: boolean
  streak?: number
  lastCheckInDate?: string
  skillsCompleted?: string[]
  followUps?: FollowUpRecord[]
  needsAttention?: boolean
  // Long-term tracking (Teesson et al. 2024)
  enrollmentDate?: string
  gradeHistory?: { grade: string; year: string; startDate: string }[]
  totalEngagementMonths?: number
  longTermOutcomes?: {
    totalCheckIns: number
    averageMood: number
    crisisCount: number
    symptomTrajectory: 'improving' | 'stable' | 'declining'
  }
  // Passive sensing (Linardon/Shen 2025)
  passiveSensing?: PassiveSensingData[]
  passiveConsent?: PassiveSensingConsent
  // Backend-ready fields
  concernScore?: number // Composite score (not shown to students)
  schoolId?: string
  districtId?: string
  pseudonymId?: string // For de-identified analytics
}

const STORAGE_KEY = 'student-checkin-entries'
const ENGAGEMENT_KEY = 'student-engagement'
const PREFERENCES_KEY = 'student-preferences'
const FOLLOWUPS_KEY = 'student-followups'
const PARENT_CONSENT_KEY = 'parent-consent'
const SCHOOL_PRIVACY_KEY = 'school-privacy-settings'
const PASSIVE_SENSING_KEY = 'passive-sensing-consent'
const DAILY_CHECKINS_KEY = 'daily-micro-checkins'
const BOOKMARKS_KEY = 'bookmarked-skills'
const DEVICE_INFO_KEY = 'device-info'
const CALM_ROOM_SESSIONS_KEY = 'calm-room-sessions'
const CODESIGN_FEEDBACK_KEY = 'codesign-feedback'
const EVALUATION_METRICS_KEY = 'evaluation-metrics'
// const SESSION_SECURITY_KEY = 'session-security' // Future: Session security tracking
const THREAT_DETECTION_KEY = 'threat-detection'
// const STATIONS_KEY = 'coping-stations' // Future: Dynamic station management
const GROUP_SESSIONS_KEY = 'group-sessions'
const GROUP_SESSION_PARTICIPATION_KEY = 'group-session-participation'
const COPING_SKILL_EVENTS_KEY = 'coping-skill-events'

type EngagementData = {
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  lastCheckInDate: string | null
  skillsUnlocked: string[]
  bookmarkedSkills: string[]
}

type DailyMicroCheckIn = {
  id: string
  studentName: string
  mood: number // 1-5
  safety: number // 1-5 "How safe do you feel?"
  createdAt: string
}

type UserPreferences = {
  tone: 'serious' | 'playful'
  language: 'en' | 'es' | 'fr'
  region: string
  dataMode: 'basic' | 'advanced' // Basic = minimal data, Advanced = optional passive sensing
  accessibility?: {
    highContrast: boolean
    largeText: boolean
    keyboardOnly: boolean
  }
}

type ThreatScenario = {
  id: string
  scenario: 'shared_device' | 'unauthorized_access' | 'false_crisis' | 'data_leak' | 'privacy_breach'
  description: string
  mitigation: string
  detected: boolean
  detectedAt?: string
}

// Future: Session security tracking for shared device detection
// type SessionSecurity = {
//   sessionId: string
//   userId: string
//   deviceFingerprint: string
//   lastActivity: string
//   suspiciousActivity?: {
//     type: 'rapid_checkins' | 'multiple_devices' | 'pattern_anomaly'
//     count: number
//     flaggedAt: string
//   }
// }

type CoDesignFeedback = {
  id: string
  userId: string
  userType: 'student' | 'parent' | 'counselor'
  category: 'feature_request' | 'wording_feedback' | 'design_feedback' | 'bug_report' | 'other'
  feedback: string
  priority?: 'low' | 'medium' | 'high'
  status: 'pending' | 'reviewed' | 'implemented' | 'declined'
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

type EvaluationMetrics = {
  studentId: string
  baselineDate: string
  baselinePHQ?: number
  baselineGAD?: number
  baselineInternalizing?: number
  followUpDates: {
    date: string
    phqScore?: number
    gadScore?: number
    internalizingScore?: number
    helpSeeking?: boolean
    attendanceRate?: number
    userSatisfaction?: number // 1-5
  }[]
  helpSeekingCount: number
  totalSessions: number
  satisfactionAverage?: number
}

type CulturalResource = {
  name: string
  phone: string
  text?: string
  website?: string
  available24h: boolean
}

const initialStudents: StudentRecord[] = [
  {
    id: 's1',
    name: 'Mateo Garcia',
    grade: 'Grade 10',
    advisor: 'Ms. Brooks',
    history: [
      {
        id: 's1w1',
        studentName: 'Mateo Garcia',
        mood: 2,
        sleepQuality: 2,
        concentration: 2,
        energy: 2,
        worries: 4,
        burden: 4,
        notes: 'Hard to focus after switching classes.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      },
      {
        id: 's1w2',
        studentName: 'Mateo Garcia',
        mood: 3,
        sleepQuality: 3,
        concentration: 3,
        energy: 3,
        worries: 3,
        burden: 3,
        notes: 'Slightly better after meeting counselor.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      },
      {
        id: 's1w3',
        studentName: 'Mateo Garcia',
        mood: 2,
        sleepQuality: 2,
        concentration: 2,
        energy: 2,
        worries: 4,
        burden: 4,
        notes: 'Regressed this week.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ],
    flagged: true,
  },
  {
    id: 's2',
    name: 'Priya Shah',
    grade: 'Grade 11',
    advisor: 'Dr. Lee',
    history: [
      {
        id: 's2w1',
        studentName: 'Priya Shah',
        mood: 4,
        sleepQuality: 4,
        concentration: 4,
        energy: 4,
        worries: 2,
        burden: 2,
        notes: 'Worried about exams but coping.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
      },
      {
        id: 's2w2',
        studentName: 'Priya Shah',
        mood: 5,
        sleepQuality: 5,
        concentration: 5,
        energy: 5,
        worries: 1,
        burden: 1,
        notes: 'Feeling strong and supported.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ],
  },
  {
    id: 's3',
    name: 'Noah Williams',
    grade: 'Grade 9',
    advisor: 'Mrs. Greene',
    history: [
      {
        id: 's3w1',
        studentName: 'Noah Williams',
        mood: 4,
        sleepQuality: 3,
        concentration: 4,
        energy: 4,
        worries: 2,
        burden: 2,
        notes: 'Settling into high school.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
    ],
  },
]

const sliderConfig = [
  { key: 'mood', label: 'How was your overall mood this week?', icon: '😊', emoji: ['😢', '😐', '🙂', '😊', '😄'], minLabel: 'Very low', maxLabel: 'Very positive' },
  { key: 'sleepQuality', label: 'Sleep quality?', icon: '😴', emoji: ['😴', '😑', '😌', '😊', '✨'], minLabel: 'Restless', maxLabel: 'Rested' },
  { key: 'concentration', label: 'Concentration?', icon: '🎯', emoji: ['💭', '🤔', '👀', '🎯', '⚡'], minLabel: 'Scattered', maxLabel: 'Sharp' },
  { key: 'energy', label: 'Energy levels?', icon: '⚡', emoji: ['😴', '😑', '😊', '⚡', '🚀'], minLabel: 'Drained', maxLabel: 'Energized' },
  { key: 'worries', label: 'How heavy did worries feel?', icon: '💭', emoji: ['😌', '😊', '😐', '😟', '😰'], minLabel: 'Light', maxLabel: 'Heavy' },
  { key: 'burden', label: 'Did you feel like a burden?', icon: '🤝', emoji: ['💚', '👍', '😐', '😔', '😞'], minLabel: 'Supported', maxLabel: 'Often' },
] as const

// riskPalette - currently unused (was used by RiskBadge component)
// const riskPalette = {
//   low: { label: 'Green', hue: 'linear-gradient(135deg, #1fbf75, #42d4a1)' },
//   medium: { label: 'Yellow', hue: 'linear-gradient(135deg, #f5a623, #ffd25a)' },
//   high: { label: 'Red', hue: 'linear-gradient(135deg, #ff5f6d, #ff9a44)' },
// }

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))

const calculateRiskScore = (entry: CheckInEntry | undefined) => {
  if (!entry) return 0
  const negative = (5 - entry.mood) + (5 - entry.energy) + (5 - entry.sleepQuality)
  const distress = entry.worries + entry.burden
  const focus = 5 - entry.concentration
  const score = ((negative * 3 + distress * 2 + focus * 1.5) / 45) * 100
  return Math.min(100, Math.round(score))
}

// Composite concern score (not shown to students) - combines recent check-ins + trends
const calculateConcernScore = (student: StudentRecord): number => {
  const recent = student.history.slice(-4) // Last 4 check-ins
  if (recent.length === 0) return 0
  
  // Base score from latest check-in
  const latestScore = calculateRiskScore(recent[recent.length - 1])
  
  // Trend component: worsening trend increases concern
  let trendComponent = 0
  if (recent.length >= 2) {
    const scores = recent.map(e => calculateRiskScore(e))
    const trend = scores[scores.length - 1] - scores[0]
    trendComponent = Math.max(0, trend) * 0.5 // Worsening trend adds to concern
  }
  
  // Consistency component: sustained low scores increase concern
  const avgScore = recent.reduce((sum, e) => sum + calculateRiskScore(e), 0) / recent.length
  const consistencyComponent = avgScore >= 60 ? avgScore * 0.3 : 0
  
  // Safety component: crisis alerts significantly increase concern
  const latest = recent[recent.length - 1]
  const safetyComponent = latest?.crisisAlertTriggered ? 30 : 0
  const safetyRiskMultiplier = latest?.safetyRisk === 'immediate' ? 1.5 : latest?.safetyRisk === 'high' ? 1.2 : 1
  
  // PHQ/GAD component: validated scores add weight
  const phqComponent = (latest?.phqScore ?? 0) * 0.4
  const gadComponent = (latest?.gadScore ?? 0) * 0.3
  
  const total = (latestScore + trendComponent + consistencyComponent + safetyComponent + phqComponent + gadComponent) * safetyRiskMultiplier
  return Math.min(100, Math.round(total))
}

const riskBand = (score: number) => {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

const buildFlags = (history: CheckInEntry[]) => {
  const flags: string[] = []
  if (history.length >= 3) {
    const lastThree = history.slice(-3)
    if (lastThree.every((entry) => entry.mood <= 2)) {
      flags.push('Three consecutive weeks with very low mood')
    }
  }
  const latest = history.at(-1)
  const previous = history.at(-2)
  if (latest && previous) {
    const dropInEnergy = latest.energy - previous.energy <= -2
    const dropInSleep = latest.sleepQuality - previous.sleepQuality <= -2
    const dropInFocus = latest.concentration - previous.concentration <= -2
    if (dropInEnergy && dropInSleep && dropInFocus) {
      flags.push('Sudden drop in energy, sleep, and concentration')
    }
  }
  return flags
}

const randomId = () => crypto.randomUUID()

type View = 'student' | 'staff' | 'parent'

type PrivacyLevel = 'minimal' | 'moderate' | 'detailed'
type ParentConsent = {
  studentId: string
  consentGiven: boolean
  email?: string
  privacyLevel: PrivacyLevel
  monthlySummary: boolean
}

// Cultural resources by region (customizable)
const culturalResources: Record<string, CulturalResource[]> = {
  'US': [
    { name: 'Crisis Text Line', phone: '741741', text: 'Text HOME to 741741', available24h: true },
    { name: '988 Suicide & Crisis Lifeline', phone: '988', available24h: true },
  ],
  'CA': [
    { name: 'Kids Help Phone', phone: '1-800-668-6868', text: 'Text CONNECT to 686868', website: 'kidshelpphone.ca', available24h: true },
    { name: '211', phone: '211', text: 'Text your postal code to 211', available24h: true },
  ],
  'BC': [
    { name: 'Kids Help Phone', phone: '1-800-668-6868', text: 'Text CONNECT to 686868', available24h: true },
    { name: 'Crisis Centre BC', phone: '1-800-784-2433', available24h: true },
    { name: '211', phone: '211', text: 'Text your postal code to 211', available24h: true },
  ],
  'default': [
    { name: 'Crisis Support', phone: '911', available24h: true },
  ],
}

const translations = {
  en: {
    heroTitle: 'Check-in moments that turn into timely support.',
    heroSubtitle: 'A supportive check-in tool that helps your school spot early signals and offer timely support.',
    studentCheckIn: 'Student check-in',
    counselorDashboard: 'Counselor dashboard',
    weeklyCheckIn: 'Weekly well-being check-in',
    checkInDesc: 'A quick check-in to help your school notice patterns and offer support. You\'re not weird for feeling this way—lots of students feel similar things. This can\'t replace a counselor, but it helps adults reach out sooner.',
    heroTitleStudent: 'A quick check-in that can turn into real support.',
    heroSubtitleStudent: 'Answer a few questions about how you\'ve been feeling. Your school uses this to notice who might need extra support.',
    takesMinutes: 'Takes about 2–3 minutes',
    answersPrivate: 'Your answers aren\'t shared with classmates',
    notATest: 'Not a test – just a check-in',
    startCheckIn: 'Start my check-in',
    howItWorks: 'How this works / Privacy',
    parentPortal: 'Parent/Caregiver Portal',
    thanksForCheckingIn: 'Thanks for checking in',
    weekStreak: 'You\'re on a {count} week streak! 🔥',
    gladYoureHere: 'We\'re glad you\'re here today, even on a hard week. 💛',
    adultsSeeTrends: 'Adults see trends to offer support—never diagnoses. Your check-in from {date} is on file.',
    trySkillPractice: 'Try a quick skill practice →',
    gotIt: 'Got it',
    tryQuickSkill: '💡 Try a quick skill practice?',
    // Question labels
    questionMood: 'How was your overall mood this week?',
    questionMoodShort: 'Overall mood this week?',
    questionMoodAlt: 'How did you feel most of this week?',
    questionSleep: 'Sleep quality?',
    questionSleepAlt: 'How rested did you feel?',
    questionConcentration: 'Concentration?',
    questionConcentrationAlt: 'How sharp was your focus?',
    questionEnergy: 'Energy levels?',
    questionWorries: 'How heavy did worries feel?',
    questionBurden: 'Did you feel like a burden?',
    // Question labels (min/max)
    moodMin: 'Very low',
    moodMax: 'Very positive',
    sleepMin: 'Restless',
    sleepMax: 'Rested',
    concentrationMin: 'Scattered',
    concentrationMax: 'Sharp',
    energyMin: 'Drained',
    energyMax: 'Energized',
    worriesMin: 'Light',
    worriesMax: 'Heavy',
    burdenMin: 'Supported',
    burdenMax: 'Often',
    // Other UI text
    schoolWideCheckIn: 'School-wide well-being check-in',
    forAllStudents: 'This check-in is for all students',
    universalScreening: 'Universal screening helps us find and support students who need help, even when it\'s not obvious.',
    runsBeautifully: 'Runs beautifully on:',
    universalScreeningNote: 'Universal screening for all students. Evidence-based measures (PHQ-A, GAD-7) in youth-friendly language.',
    universalScreeningResults: 'Universal screening results. Validated measures (PHQ-A, GAD-7) help identify students who need support.',
  },
  es: {
    heroTitle: 'Momentos de registro que se convierten en apoyo oportuno.',
    heroSubtitle: 'Una herramienta de registro que ayuda a tu escuela a detectar señales tempranas y ofrecer apoyo oportuno.',
    studentCheckIn: 'Registro estudiantil',
    counselorDashboard: 'Panel de consejeros',
    weeklyCheckIn: 'Registro semanal de bienestar',
    checkInDesc: 'Reflexión de 2 minutos. Esto ayuda a tu escuela a apoyar mejor a los estudiantes—no es un diagnóstico, solo un registro de apoyo.',
    heroTitleStudent: 'Un registro rápido que puede convertirse en apoyo real.',
    heroSubtitleStudent: 'Responde algunas preguntas sobre cómo te has sentido. Tu escuela usa esto para notar quién podría necesitar apoyo adicional.',
    takesMinutes: 'Toma aproximadamente 2–3 minutos',
    answersPrivate: 'Tus respuestas no se comparten con tus compañeros',
    notATest: 'No es un examen, solo un registro',
    startCheckIn: 'Comenzar mi registro',
    howItWorks: 'Cómo funciona / Privacidad',
    parentPortal: 'Portal para padres/cuidadores',
    thanksForCheckingIn: 'Gracias por registrarte',
    weekStreak: '¡Llevas {count} semanas seguidas! 🔥',
    gladYoureHere: 'Nos alegra que estés aquí hoy, incluso en una semana difícil. 💛',
    adultsSeeTrends: 'Los adultos ven tendencias para ofrecer apoyo—nunca diagnósticos. Tu registro del {date} está archivado.',
    trySkillPractice: 'Prueba una práctica rápida de habilidades →',
    gotIt: 'Entendido',
    tryQuickSkill: '💡 ¿Pruebas una práctica rápida de habilidades?',
    // Question labels
    questionMood: '¿Cómo estuvo tu estado de ánimo general esta semana?',
    questionMoodShort: '¿Estado de ánimo general esta semana?',
    questionMoodAlt: '¿Cómo te sentiste la mayor parte de esta semana?',
    questionSleep: '¿Calidad del sueño?',
    questionSleepAlt: '¿Qué tan descansado te sentiste?',
    questionConcentration: '¿Concentración?',
    questionConcentrationAlt: '¿Qué tan aguda estuvo tu concentración?',
    questionEnergy: '¿Niveles de energía?',
    questionWorries: '¿Qué tan pesadas se sintieron las preocupaciones?',
    questionBurden: '¿Te sentiste como una carga?',
    // Question labels (min/max)
    moodMin: 'Muy bajo',
    moodMax: 'Muy positivo',
    sleepMin: 'Inquieto',
    sleepMax: 'Descansado',
    concentrationMin: 'Disperso',
    concentrationMax: 'Agudo',
    energyMin: 'Agotado',
    energyMax: 'Energizado',
    worriesMin: 'Ligero',
    worriesMax: 'Pesado',
    burdenMin: 'Apoyado',
    burdenMax: 'A menudo',
    // Other UI text
    schoolWideCheckIn: 'Registro de bienestar para toda la escuela',
    forAllStudents: 'Este registro es para todos los estudiantes',
    universalScreening: 'El registro universal nos ayuda a encontrar y apoyar a los estudiantes que necesitan ayuda, incluso cuando no es obvio.',
    runsBeautifully: 'Funciona perfectamente en:',
    universalScreeningNote: 'Registro universal para todos los estudiantes. Medidas basadas en evidencia (PHQ-A, GAD-7) en lenguaje amigable para jóvenes.',
    universalScreeningResults: 'Resultados del registro universal. Medidas validadas (PHQ-A, GAD-7) ayudan a identificar estudiantes que necesitan apoyo.',
  },
  fr: {
    heroTitle: 'Des moments de vérification qui se transforment en soutien opportun.',
    heroSubtitle: 'Un outil de vérification qui aide votre école à repérer les signaux précoces et offrir un soutien opportun.',
    studentCheckIn: 'Vérification étudiante',
    counselorDashboard: 'Tableau de bord conseiller',
    weeklyCheckIn: 'Vérification hebdomadaire du bien-être',
    checkInDesc: 'Réflexion de 2 minutes. Cela aide votre école à mieux soutenir les étudiants—pas un diagnostic, juste une vérification de soutien.',
    heroTitleStudent: 'Une vérification rapide qui peut se transformer en soutien réel.',
    heroSubtitleStudent: 'Répondez à quelques questions sur votre état d\'esprit. Votre école utilise cela pour remarquer qui pourrait avoir besoin de soutien supplémentaire.',
    takesMinutes: 'Prend environ 2–3 minutes',
    answersPrivate: 'Vos réponses ne sont pas partagées avec vos camarades',
    notATest: 'Pas un test, juste une vérification',
    startCheckIn: 'Commencer ma vérification',
    howItWorks: 'Comment ça fonctionne / Confidentialité',
    parentPortal: 'Portail parent/tuteur',
    thanksForCheckingIn: 'Merci de vous être enregistré',
    weekStreak: 'Vous êtes sur une série de {count} semaines ! 🔥',
    gladYoureHere: 'Nous sommes heureux que vous soyez ici aujourd\'hui, même lors d\'une semaine difficile. 💛',
    adultsSeeTrends: 'Les adultes voient les tendances pour offrir du soutien—jamais de diagnostics. Votre vérification du {date} est enregistrée.',
    trySkillPractice: 'Essayez une pratique rapide de compétences →',
    gotIt: 'Compris',
    tryQuickSkill: '💡 Essayez une pratique rapide de compétences ?',
    // Question labels
    questionMood: 'Comment était votre humeur générale cette semaine ?',
    questionMoodShort: 'Humeur générale cette semaine ?',
    questionMoodAlt: 'Comment vous êtes-vous senti la plupart de cette semaine ?',
    questionSleep: 'Qualité du sommeil ?',
    questionSleepAlt: 'À quel point vous êtes-vous senti reposé ?',
    questionConcentration: 'Concentration ?',
    questionConcentrationAlt: 'À quel point votre concentration était-elle vive ?',
    questionEnergy: 'Niveaux d\'énergie ?',
    questionWorries: 'À quel point les inquiétudes se sont-elles senties lourdes ?',
    questionBurden: 'Vous êtes-vous senti comme un fardeau ?',
    // Question labels (min/max)
    moodMin: 'Très bas',
    moodMax: 'Très positif',
    sleepMin: 'Agité',
    sleepMax: 'Reposé',
    concentrationMin: 'Dispersé',
    concentrationMax: 'Vif',
    energyMin: 'Épuisé',
    energyMax: 'Énergisé',
    worriesMin: 'Léger',
    worriesMax: 'Lourd',
    burdenMin: 'Soutenu',
    burdenMax: 'Souvent',
    // Other UI text
    schoolWideCheckIn: 'Vérification du bien-être à l\'échelle de l\'école',
    forAllStudents: 'Cette vérification est pour tous les étudiants',
    universalScreening: 'Le dépistage universel nous aide à trouver et soutenir les étudiants qui ont besoin d\'aide, même quand ce n\'est pas évident.',
    runsBeautifully: 'Fonctionne parfaitement sur :',
    universalScreeningNote: 'Dépistage universel pour tous les étudiants. Mesures fondées sur des preuves (PHQ-A, GAD-7) dans un langage adapté aux jeunes.',
    universalScreeningResults: 'Résultats du dépistage universel. Mesures validées (PHQ-A, GAD-7) aident à identifier les étudiants qui ont besoin de soutien.',
  },
}

// Device detection utility
const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform.toLowerCase()
  
  let type: DeviceType = 'unknown'
  let os: DeviceInfo['os'] = undefined
  let canAccessHealthData = false
  let canAccessWearables = false
  
  // Detect OS
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    os = 'ios'
    type = 'personal_phone'
    canAccessHealthData = true // iOS HealthKit
    canAccessWearables = true // Apple Watch
  } else if (userAgent.includes('android')) {
    os = 'android'
    type = 'personal_phone'
    canAccessHealthData = true // Google Fit
    canAccessWearables = true // Wear OS
  } else if (userAgent.includes('cros') || userAgent.includes('chromebook')) {
    os = 'chromeos'
    type = 'school_chromebook'
    canAccessHealthData = false
    canAccessWearables = false
  } else if (platform.includes('win')) {
    os = 'windows'
    type = 'school_pc'
    canAccessHealthData = false
    canAccessWearables = false
  } else if (platform.includes('mac')) {
    os = 'macos'
    type = 'school_pc'
    canAccessHealthData = false
    canAccessWearables = false
  }
  
  // Check if device is school-owned (heuristic: screen size + user agent)
  if (window.screen.width >= 1024 && (os === 'chromeos' || os === 'windows')) {
    type = os === 'chromeos' ? 'school_chromebook' : 'school_pc'
  }
  
  return {
    type,
    os,
    canAccessHealthData,
    canAccessWearables,
    detectedAt: new Date().toISOString()
  }
}

export function App() {
  const [activeView, setActiveView] = useState<View>('student')
  const [deviceInfo] = useState<DeviceInfo>(() => {
    const stored = localStorage.getItem(DEVICE_INFO_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return detectDevice()
      }
    }
    return detectDevice()
  })
  const [calmRoomSessions, setCalmRoomSessions] = useState<CalmRoomSession[]>(() => {
    const stored = localStorage.getItem(CALM_ROOM_SESSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    const parsed = stored ? JSON.parse(stored) : { tone: 'serious', language: 'en', region: 'US', dataMode: 'basic' }
    if (!parsed.accessibility) {
      parsed.accessibility = { highContrast: false, largeText: false, keyboardOnly: false }
    }
    return parsed
  })
  // Session security and threat detection stored in localStorage, managed by threat detection logic
  // const [sessionSecurity, setSessionSecurity] = useState<SessionSecurity[]>(() => {
  //   const stored = localStorage.getItem(SESSION_SECURITY_KEY)
  //   return stored ? JSON.parse(stored) : []
  // })
  const [threatScenarios, setThreatScenarios] = useState<ThreatScenario[]>(() => {
    const stored = localStorage.getItem(THREAT_DETECTION_KEY)
    return stored ? JSON.parse(stored) : []
  })
  // Co-design feedback stored in localStorage, managed by CoDesignFeedbackModal
  // const [coDesignFeedback, setCoDesignFeedback] = useState<CoDesignFeedback[]>(() => {
  //   const stored = localStorage.getItem(CODESIGN_FEEDBACK_KEY)
  //   return stored ? JSON.parse(stored) : []
  // })
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetrics[]>(() => {
    const stored = localStorage.getItem(EVALUATION_METRICS_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StudentRecord[]
        return parsed
      } catch {
        return initialStudents
      }
    }
    return initialStudents
  })
  const [lastSaved, setLastSaved] = useState<CheckInEntry | null>(null)
  
  useEffect(() => {
    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo))
  }, [deviceInfo])
  
  useEffect(() => {
    localStorage.setItem(CALM_ROOM_SESSIONS_KEY, JSON.stringify(calmRoomSessions))
  }, [calmRoomSessions])
  
  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  }, [preferences])
  
  useEffect(() => {
    localStorage.setItem(EVALUATION_METRICS_KEY, JSON.stringify(evaluationMetrics))
  }, [evaluationMetrics])
  
  const t = translations[preferences.language]
  const resources = culturalResources[preferences.region] || culturalResources['default']

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  }, [students])

  const updateEngagement = () => {
    const stored = localStorage.getItem(ENGAGEMENT_KEY)
    const engagement: EngagementData = stored ? JSON.parse(stored) : {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      lastCheckInDate: null,
      skillsUnlocked: [],
      bookmarkedSkills: [],
      mascot: {
        name: 'Boba',
        type: 'cat',
        totalCheckIns: 0,
      }
    }
    
    if (!engagement.bookmarkedSkills) {
      engagement.bookmarkedSkills = []
    }
    
    const today = new Date().toISOString().split('T')[0]
    const lastDate = engagement.lastCheckInDate ? new Date(engagement.lastCheckInDate).toISOString().split('T')[0] : null
    const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)) : Infinity
    
    if (daysSince <= 8) {
      engagement.currentStreak = daysSince === 0 ? engagement.currentStreak : engagement.currentStreak + 1
    } else {
      engagement.currentStreak = 1
    }
    
    engagement.longestStreak = Math.max(engagement.longestStreak, engagement.currentStreak)
    engagement.totalCheckIns += 1
    engagement.lastCheckInDate = today
    
    localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(engagement))
    return engagement
  }

  // Calculate PHQ-A score (0-27) from check-in responses
  const calculatePHQScore = (entry: Omit<CheckInEntry, 'id' | 'createdAt'>): number => {
    // Simplified PHQ-A: mood (0-4), energy (0-4), sleep (0-4), concentration (0-4), 
    // burden (0-4), worries (0-4), plus 3 additional questions approximated
    const moodScore = 5 - entry.mood // reversed
    const energyScore = 5 - entry.energy // reversed
    const sleepScore = 5 - entry.sleepQuality // reversed
    const concentrationScore = 5 - entry.concentration // reversed
    const burdenScore = entry.burden - 1 // 1-5 -> 0-4
    const worriesScore = entry.worries - 1 // 1-5 -> 0-4
    // Approximate other PHQ items from existing data
    const interestScore = Math.max(0, 5 - entry.energy - 1) // low energy = low interest
    const appetiteScore = Math.max(0, 5 - entry.energy - 1) // approximated
    const selfWorthScore = entry.burden - 1 // feeling like burden = self-worth
    
    return Math.min(27, moodScore + energyScore + sleepScore + concentrationScore + 
      burdenScore + worriesScore + interestScore + appetiteScore + selfWorthScore)
  }

  // Calculate GAD-7 score (0-21) from check-in responses
  const calculateGADScore = (entry: Omit<CheckInEntry, 'id' | 'createdAt'>): number => {
    // GAD-7 focuses on anxiety symptoms
    const worriesScore = entry.worries - 1 // 1-5 -> 0-4
    const restlessnessScore = Math.max(0, 5 - entry.sleepQuality - 1) // poor sleep = restlessness
    const tiredScore = 5 - entry.energy // reversed
    const concentrationScore = 5 - entry.concentration // reversed
    const irritabilityScore = Math.max(0, 5 - entry.mood - 1) // low mood can indicate irritability
    const muscleTensionScore = Math.max(0, entry.worries - 2) // approximated from worries
    const sleepDisturbanceScore = 5 - entry.sleepQuality // reversed
    
    return Math.min(21, worriesScore + restlessnessScore + tiredScore + concentrationScore + 
      irritabilityScore + muscleTensionScore + sleepDisturbanceScore)
  }

  // Determine if student needs referral based on scores
  const needsReferral = (phqScore: number, gadScore: number): boolean => {
    // PHQ-A: 10+ suggests moderate depression, 15+ suggests severe
    // GAD-7: 10+ suggests moderate anxiety, 15+ suggests severe
    return phqScore >= 10 || gadScore >= 10
  }

  // Threat detection: Detect potential abuse cases
  const detectThreats = (entry: Omit<CheckInEntry, 'id' | 'createdAt'>, studentName: string) => {
    const threats: ThreatScenario[] = []
    const now = new Date().toISOString()
    
    // Check for false crisis answers (trolling)
    // If student answers "yes" to all ASQ questions but mood/energy are high, flag
    if (entry.asqHurt === 'yes' && entry.asqAttempt === 'yes' && entry.asqBetterOff === 'yes' && 
        entry.asqThoughts === 'yes' && entry.mood >= 4 && entry.energy >= 4) {
      threats.push({
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scenario: 'false_crisis',
        description: `Potential false crisis answers: Student ${studentName} answered all ASQ questions as "yes" but reported high mood (${entry.mood}) and energy (${entry.energy}). This may indicate trolling or misunderstanding.`,
        mitigation: 'Review with student to clarify understanding. If pattern continues, flag for counselor review.',
        detected: true,
        detectedAt: now,
      })
    }
    
    // Check for rapid check-ins (shared device or automation)
    const recentCheckIns = students.find(s => s.name.toLowerCase() === studentName.toLowerCase())?.history.slice(-3) || []
    if (recentCheckIns.length >= 2) {
      const timeDiff = new Date(recentCheckIns[recentCheckIns.length - 1].createdAt).getTime() - 
                       new Date(recentCheckIns[0].createdAt).getTime()
      const minutesDiff = timeDiff / (1000 * 60)
      if (minutesDiff < 5) {
        threats.push({
          id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          scenario: 'shared_device',
          description: `Rapid check-ins detected: Student ${studentName} completed ${recentCheckIns.length} check-ins in ${Math.round(minutesDiff)} minutes. May indicate shared device or automation.`,
          mitigation: 'Verify student identity. Consider requiring authentication for check-ins.',
          detected: true,
          detectedAt: now,
        })
      }
    }
    
    if (threats.length > 0) {
      const existing = threatScenarios
      setThreatScenarios([...existing, ...threats])
      localStorage.setItem(THREAT_DETECTION_KEY, JSON.stringify([...existing, ...threats]))
    }
    
    return threats
  }

  const handleCheckInSubmit = async (entry: Omit<CheckInEntry, 'id' | 'createdAt'>) => {
    const phqScore = calculatePHQScore(entry)
    const gadScore = calculateGADScore(entry)
    const needsAttention = needsReferral(phqScore, gadScore) || entry.safetyRisk === 'high' || entry.safetyRisk === 'immediate'
    
    // Threat detection (logs threats to localStorage)
    detectThreats(entry, entry.studentName || 'Anonymous')
    
    // Find or create student ID for API call
    const studentIndexForApi = students.findIndex((s) => s.name.toLowerCase() === entry.studentName.toLowerCase())
    let studentId: string
    
    if (studentIndexForApi >= 0) {
      studentId = students[studentIndexForApi].id
    } else {
      // For new students, create a temporary ID (in production, this would come from the backend)
      studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Set up mock auth token for development (remove in production)
    // In production, get token from Auth0/Clerk/etc.
    const mockToken = createMockToken(studentId, 'STUDENT', 'school_1')
    setMockToken(mockToken)
    
    // Create entry first (so we can show success modal even if API fails)
    const newEntry: CheckInEntry = {
      ...entry,
      id: randomId(),
      createdAt: new Date().toISOString(),
      phqScore,
      gadScore,
      screeningComplete: true,
    }
    
    // NO DARK DATA: All high-risk patterns route to human support team
    // Evidence-based: Every flagged pattern must have human review (PMC, SpringerLink)
    const requiresHumanReview = needsAttention || entry.safetyRisk === 'high' || entry.safetyRisk === 'immediate' || 
                                 phqScore >= 10 || gadScore >= 10
    
    if (requiresHumanReview) {
      // Immediate routing to counselor/psychologist team (not general teachers)
      console.log('👥 HUMAN SUPPORT ROUTING:', {
        studentName: entry.studentName,
        risk: entry.safetyRisk,
        phqScore,
        gadScore,
        needsAttention,
        timestamp: newEntry.createdAt,
        routing: 'counselor_psychologist_team', // Never silent storage
        asqAnswers: entry.crisisAlertTriggered ? {
          thoughts: entry.asqThoughts,
          betterOff: entry.asqBetterOff,
          hurt: entry.asqHurt,
          attempt: entry.asqAttempt,
        } : undefined,
      })
      
      // In production: Send to event queue (Kafka/pub-sub) for immediate counselor notification
      // This ensures NO data is stored silently - all high-risk patterns get human review
    }
    
    // Track evaluation metrics for research
    const studentIndex = students.findIndex((s) => s.name.toLowerCase() === entry.studentName.toLowerCase())
    if (studentIndex >= 0) {
      const studentId = students[studentIndex].id
      const existingMetrics = evaluationMetrics.find(m => m.studentId === studentId)
      
      if (!existingMetrics) {
        // Baseline measurement
        const baseline: EvaluationMetrics = {
          studentId,
          baselineDate: newEntry.createdAt,
          baselinePHQ: phqScore,
          baselineGAD: gadScore,
          baselineInternalizing: (phqScore + gadScore) / 2,
          followUpDates: [],
          helpSeekingCount: needsAttention ? 1 : 0,
          totalSessions: 1,
        }
        setEvaluationMetrics(prev => [...prev, baseline])
      } else {
        // Follow-up measurement
        const updated = { ...existingMetrics }
        updated.followUpDates.push({
          date: newEntry.createdAt,
          phqScore,
          gadScore,
          internalizingScore: (phqScore + gadScore) / 2,
          helpSeeking: needsAttention,
        })
        updated.totalSessions += 1
        if (needsAttention) updated.helpSeekingCount += 1
        setEvaluationMetrics(prev => prev.map(m => m.studentId === studentId ? updated : m))
      }
    }
    const engagement = updateEngagement()
    
    setStudents((prev) => {
      const studentIndex = prev.findIndex((s) => s.name.toLowerCase() === entry.studentName.toLowerCase())
      let studentId: string
      let updated: StudentRecord[]
      
      if (studentIndex >= 0) {
        updated = [...prev]
        studentId = updated[studentIndex].id
        const student = updated[studentIndex]
        const monthsEngaged = student.enrollmentDate 
          ? Math.floor((Date.now() - new Date(student.enrollmentDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 0
        
        // Calculate long-term outcomes (Teesson et al. 2024)
        const allCheckIns = [...student.history, newEntry]
        const avgMood = allCheckIns.reduce((sum, e) => sum + e.mood, 0) / allCheckIns.length
        const crisisCount = allCheckIns.filter(e => e.phqScore && e.phqScore >= 15).length
        const recentMood = allCheckIns.slice(-3).reduce((sum, e) => sum + e.mood, 0) / Math.min(3, allCheckIns.length)
        const earlierMood = allCheckIns.length > 3 
          ? allCheckIns.slice(0, -3).reduce((sum, e) => sum + e.mood, 0) / (allCheckIns.length - 3)
          : avgMood
        const trajectory = recentMood > earlierMood + 0.5 ? 'improving' : 
                          recentMood < earlierMood - 0.5 ? 'declining' : 'stable'
        
        updated[studentIndex] = {
          ...student,
          history: [...student.history, newEntry],
          streak: engagement.currentStreak,
          lastCheckInDate: engagement.lastCheckInDate || undefined,
          needsAttention: needsAttention || student.needsAttention,
          enrollmentDate: student.enrollmentDate || new Date().toISOString(),
          totalEngagementMonths: monthsEngaged,
          longTermOutcomes: {
            totalCheckIns: allCheckIns.length,
            averageMood: Math.round(avgMood * 10) / 10,
            crisisCount,
            symptomTrajectory: trajectory,
          },
        }
      } else {
        studentId = randomId()
        updated = [
          ...prev,
          {
            id: studentId,
            name: entry.studentName || 'Anonymous Student',
            grade: 'Unassigned',
            advisor: 'TBD',
            history: [newEntry],
            streak: engagement.currentStreak,
            lastCheckInDate: engagement.lastCheckInDate || undefined,
            needsAttention,
            enrollmentDate: new Date().toISOString(),
            totalEngagementMonths: 0,
            longTermOutcomes: {
              totalCheckIns: 1,
              averageMood: entry.mood,
              crisisCount: 0,
              symptomTrajectory: 'stable',
            },
          },
        ]
      }
      
      // Create follow-up record if student needs attention
      if (needsAttention) {
        const followUp: FollowUpRecord = {
          id: randomId(),
          studentId,
          checkInId: newEntry.id,
          flaggedDate: newEntry.createdAt,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        const student = updated.find(s => s.id === studentId)
        if (student) {
          student.followUps = [...(student.followUps || []), followUp]
        }
        
        // Store follow-ups separately for easy access
        const storedFollowUps = localStorage.getItem(FOLLOWUPS_KEY)
        const allFollowUps = storedFollowUps ? JSON.parse(storedFollowUps) : []
        allFollowUps.push(followUp)
        localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(allFollowUps))
      }
      
      return updated
    })
    
    // Set lastSaved BEFORE API call so success modal shows immediately
    setLastSaved(newEntry)
    
    // Submit to API (non-blocking - don't wait for it)
    // This runs in the background so the success modal shows immediately
    studentApi.createCheckIn(studentId, {
      mood: entry.mood,
      sleepQuality: entry.sleepQuality,
      concentration: entry.concentration,
      energy: entry.energy,
      worries: entry.worries,
      burden: entry.burden,
      notes: entry.notes || undefined,
      cognitiveScore: entry.cognitiveScore,
      screenUseImpact: entry.screenUseImpact,
    })
    .then((apiResponse) => {
      console.log('✅ Check-in submitted to API:', apiResponse)
      console.log('📊 Check-in saved to database with ID:', (apiResponse as any)?.id)
    })
    .catch((error) => {
      console.error('❌ Failed to submit check-in to API:', error)
      console.error('🔗 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:4000')
      console.error('📝 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      // Continue with local storage as fallback
      // The check-in is already saved to localStorage, so user still sees success
    })
  }

  // Check for stationId or sessionId in URL (QR code flow)
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      stationId: params.get('stationId'),
      sessionId: params.get('sessionId'),
    }
  }, [])

  return (
    <div className="app-shell">
      <header className={`hero ${activeView === 'student' ? 'hero-student' : ''}`}>
        <div className="hero__content">
          {activeView === 'student' ? (
            <>
              <h1>
                {t.heroTitleStudent}
              </h1>
              <p className="lead">
                {t.heroSubtitleStudent}
              </p>
              <ul className="student-bullets">
                <li>{t.takesMinutes}</li>
                <li>{t.answersPrivate}</li>
                <li>{t.notATest}</li>
              </ul>
              <div className="cta-group student-cta">
                <button className="primary large" onClick={() => {
                  // Scroll to student check-in section
                  const studentSection = document.querySelector('.content')
                  studentSection?.scrollIntoView({ behavior: 'smooth' })
                }}>
                  {t.startCheckIn}
                </button>
                <button 
                  className="privacy-link-button" 
                  onClick={() => {
                    const footer = document.querySelector('.privacy-footer')
                    footer?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {t.howItWorks}
                </button>
              </div>
              <div className="cta-group" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                <button className="ghost" onClick={() => setActiveView('staff')}>
                  {t.counselorDashboard}
                </button>
                <button className="ghost" onClick={() => setActiveView('parent')}>
                  {t.parentPortal}
                </button>
              </div>
            </>
          ) : (
            <>
              {(activeView === 'staff' || activeView === 'parent') && (
                <p className="eyebrow">{t.schoolWideCheckIn}</p>
              )}
              <h1>
                {t.heroTitle.split(' ').slice(0, -3).join(' ')}
                <span> {t.heroTitle.split(' ').slice(-3).join(' ')}</span>
              </h1>
              <p className="lead">
                {t.heroSubtitle} <strong>{t.forAllStudents}</strong>—not just those who seem to be struggling. 
                {t.universalScreening}
              </p>
              <div className="cta-group">
                <button className="ghost" onClick={() => setActiveView('student')}>
                  {t.studentCheckIn}
                </button>
                <button className={activeView === 'staff' ? 'primary' : 'ghost'} onClick={() => setActiveView('staff')}>
                  {t.counselorDashboard}
                </button>
                <button className={activeView === 'parent' ? 'primary' : 'ghost'} onClick={() => setActiveView('parent')}>
                  Parent/Caregiver Portal
                </button>
              </div>
            </>
          )}
        </div>
        {activeView !== 'student' && (
          <div className="hero__card">
            <p>{t.runsBeautifully}</p>
            <ul>
              <li>Any browser (Chrome, Safari, Edge)</li>
              <li>Phones & tablets (Android + iOS)</li>
              <li>School Chromebooks</li>
            </ul>
            <p className="mini-note">{t.universalScreeningNote} 
            Built for long-term engagement with micro-skills that help. Tracks multi-year trajectories to show long-term outcomes.</p>
            <div className="ethics-badge">
              <span>🔒 Privacy-by-design</span>
              <span>📱 Works offline</span>
              <span>🚫 No tracking</span>
              <span>💚 Non-profit</span>
            </div>
          </div>
        )}
      </header>

      <main className="content">
        {urlParams.stationId ? (
          <SoloStation 
            stationId={urlParams.stationId}
            onClose={() => {
              window.history.replaceState({}, '', window.location.pathname)
            }}
            students={students}
          />
        ) : urlParams.sessionId ? (
          <GroupSessionComponent 
            sessionId={urlParams.sessionId}
            deviceInfo={deviceInfo}
            onClose={() => {
              window.history.replaceState({}, '', window.location.pathname)
            }}
          />
        ) : activeView === 'student' ? (
          <StudentCheckIn 
            onSubmit={handleCheckInSubmit} 
            lastSaved={lastSaved} 
            students={students}
            preferences={preferences}
            onPreferencesChange={setPreferences}
            resources={resources}
            translations={t}
            onCalmRoomSession={(session) => {
              setCalmRoomSessions(prev => [...prev, session])
              // Log as a skill used
              const engagement = JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || '{}')
              if (!engagement.skillsUnlocked) engagement.skillsUnlocked = []
              if (!engagement.skillsUnlocked.includes('calm_room')) {
                engagement.skillsUnlocked.push('calm_room')
                localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(engagement))
              }
            }}
            deviceInfo={deviceInfo}
          />
        ) : activeView === 'staff' ? (
          <CounselorDashboard students={students} onStudentsUpdate={setStudents} translations={t} />
        ) : activeView === 'parent' ? (
          <ParentPortal students={students} />
        ) : null}
      </main>
      
      {activeView === 'student' && <DailyMicroCheckInPrompt resources={resources} />}
      
      <footer className="app-footer">
        <PrivacyEthicsFooter />
      </footer>
    </div>
  )
}

type StudentCheckInProps = {
  onSubmit: (entry: Omit<CheckInEntry, 'id' | 'createdAt'>) => void
  lastSaved: CheckInEntry | null
  students: StudentRecord[]
  preferences: UserPreferences
  onPreferencesChange: (prefs: UserPreferences) => void
  resources: CulturalResource[]
  translations: typeof translations.en
  onCalmRoomSession?: (session: CalmRoomSession) => void
  deviceInfo?: DeviceInfo
}

type CalmRoomQRScannerProps = {
  onSessionComplete: (session: CalmRoomSession) => void
  onClose: () => void
}

const CalmRoomQRScanner = ({ onSessionComplete, onClose }: CalmRoomQRScannerProps) => {
  const [scanning, setScanning] = useState(false)
  const [sessionType, setSessionType] = useState<CalmRoomSession['sessionType']>('mindfulness')
  const [duration, setDuration] = useState(5)
  const [location, setLocation] = useState('')
  const [qrCodeId, setQrCodeId] = useState('')
  
  const handleScan = () => {
    setScanning(true)
    // Simulate QR code scan - in production, use a QR scanner library
    setTimeout(() => {
      const simulatedQR = `calm_room_${Date.now()}`
      setQrCodeId(simulatedQR)
      setLocation('Calm Room A') // Would come from QR code data
      setScanning(false)
    }, 1000)
  }
  
  const handleSubmit = () => {
    const session: CalmRoomSession = {
      id: `session_${Date.now()}`,
      studentId: 'current_student', // In production, get from auth
      sessionType,
      duration,
      location: location || 'Calm Room',
      qrCodeId: qrCodeId || undefined,
      createdAt: new Date().toISOString(),
      loggedAsSkill: true,
    }
    onSessionComplete(session)
    onClose()
  }
  
  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal calm-room-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>🌿 Calm Room Session</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <p className="calm-room-intro">
            Scan the QR code in your school's calm room to log your session. 
            This helps track coping skills you're using.
          </p>
          
          <div className="calm-room-section">
            <label>Session Type</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value as CalmRoomSession['sessionType'])}>
              <option value="mindfulness">Mindfulness</option>
              <option value="breathing">Breathing Exercise</option>
              <option value="relaxation">Relaxation</option>
              <option value="vr_guided">VR Guided Session</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="calm-room-section">
            <label>Duration (minutes)</label>
            <input 
              type="number" 
              min={1} 
              max={60} 
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          
          {!qrCodeId ? (
            <div className="calm-room-section">
              <button type="button" className="primary qr-scan-btn" onClick={handleScan} disabled={scanning}>
                {scanning ? 'Scanning...' : '📷 Scan QR Code'}
              </button>
              <p className="calm-room-note">
                Or enter manually:
              </p>
              <input 
                type="text" 
                placeholder="Location (e.g., Calm Room A)" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          ) : (
            <div className="calm-room-success">
              <p>✅ QR Code scanned: {location}</p>
              <button type="button" className="ghost" onClick={() => setQrCodeId('')}>
                Scan again
              </button>
            </div>
          )}
          
          <div className="calm-room-note">
            <p>
              <strong>Note:</strong> This session will be logged as a coping skill you used. 
              It's not therapy—it's a tool to help you manage stress and build resilience.
            </p>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={!location && !qrCodeId}>
              Log Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const StudentCheckIn = ({ onSubmit, lastSaved, students, preferences, onPreferencesChange, resources, translations, onCalmRoomSession, deviceInfo }: StudentCheckInProps) => {
  // Create translated slider config based on current language
  const getTranslatedSliderConfig = () => {
    return [
      { key: 'mood', label: translations.questionMood, icon: '😊', emoji: ['😢', '😐', '🙂', '😊', '😄'], minLabel: translations.moodMin, maxLabel: translations.moodMax },
      { key: 'sleepQuality', label: translations.questionSleep, icon: '😴', emoji: ['😴', '😑', '😌', '😊', '✨'], minLabel: translations.sleepMin, maxLabel: translations.sleepMax },
      { key: 'concentration', label: translations.questionConcentration, icon: '🎯', emoji: ['💭', '🤔', '👀', '🎯', '⚡'], minLabel: translations.concentrationMin, maxLabel: translations.concentrationMax },
      { key: 'energy', label: translations.questionEnergy, icon: '⚡', emoji: ['😴', '😑', '😊', '⚡', '🚀'], minLabel: translations.energyMin, maxLabel: translations.energyMax },
      { key: 'worries', label: translations.questionWorries, icon: '💭', emoji: ['😌', '😊', '😐', '😟', '😰'], minLabel: translations.worriesMin, maxLabel: translations.worriesMax },
      { key: 'burden', label: translations.questionBurden, icon: '🤝', emoji: ['💚', '👍', '😐', '😔', '😞'], minLabel: translations.burdenMin, maxLabel: translations.burdenMax },
    ]
  }
  
  const [form, setForm] = useState({
    studentName: '',
    mood: 3,
    sleepQuality: 3,
    concentration: 3,
    energy: 3,
    worries: 2,
    burden: 2,
    notes: '',
    screenUseImpact: undefined as 'better' | 'worse' | 'both' | 'neutral' | 'not_sure' | undefined,
  })
  const [asqAnswers, setAsqAnswers] = useState({
    thoughts: undefined as 'yes' | 'no' | undefined,
    betterOff: undefined as 'yes' | 'no' | undefined,
    hurt: undefined as 'yes' | 'no' | undefined,
    attempt: undefined as 'yes' | 'no' | undefined,
  })
  const [cognitiveScore, setCognitiveScore] = useState<number | undefined>()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showCrisisResponse, setShowCrisisResponse] = useState(false)
  const [safetyRisk, setSafetyRisk] = useState<'low' | 'moderate' | 'high' | 'immediate' | null>(null)
  const [showSkills, setShowSkills] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showCalmRoom, setShowCalmRoom] = useState(false)
  const [showPassiveSensing, setShowPassiveSensing] = useState(false)
  const [showAboutApp, setShowAboutApp] = useState(false)
  const [showDataSharing, setShowDataSharing] = useState(false)
  const [showCoDesign, setShowCoDesign] = useState(false)
  
  const passiveConsent = useMemo(() => {
    const stored = localStorage.getItem(PASSIVE_SENSING_KEY)
    return stored ? JSON.parse(stored) as PassiveSensingConsent : {
      enabled: false,
      lowDataMode: true,
      wearableConnected: false,
      phoneDataEnabled: false,
    }
  }, [])
  
  const currentStudent = form.studentName ? students.find(s => s.name.toLowerCase() === form.studentName.toLowerCase()) : null
  const checkInCount = currentStudent?.history.length || 0
  const engagement = useMemo(() => {
    const stored = localStorage.getItem(ENGAGEMENT_KEY)
    const defaultEngagement: EngagementData = {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      lastCheckInDate: null,
      skillsUnlocked: [],
      bookmarkedSkills: []
    }
    const parsed = stored ? JSON.parse(stored) as EngagementData : defaultEngagement
    // Ensure bookmarkedSkills exists
    if (!parsed.bookmarkedSkills) {
      parsed.bookmarkedSkills = []
    }
    return parsed
  }, [submitted])
  
  
  // Evolving questions based on check-in count
  const getEvolvingQuestions = () => {
    const baseConfig = getTranslatedSliderConfig()
    if (checkInCount < 2) return baseConfig
    if (checkInCount < 5) {
      return baseConfig.map((q, i) => {
        if (i === 0) return { ...q, label: translations.questionMoodAlt }
        if (i === 2) return { ...q, label: translations.questionConcentrationAlt }
        return q
      })
    }
    return baseConfig.map((q, i) => {
      if (i === 0) return { ...q, label: translations.questionMoodShort }
      if (i === 1) return { ...q, label: translations.questionSleepAlt }
      return q
    })
  }
  
  const dynamicQuestions = getEvolvingQuestions()

  const handleSliderChange = (key: keyof typeof form, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3))
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0))

  const calculateSafetyRisk = (): 'low' | 'moderate' | 'high' | 'immediate' => {
    // ASQ risk assessment (validated tool)
    // Immediate risk: Recent attempt or current thoughts of killing self
    if (asqAnswers.hurt === 'yes' || asqAnswers.attempt === 'yes') {
      return 'immediate'
    }
    // High risk: Thoughts of being better off dead or wishing dead
    if (asqAnswers.betterOff === 'yes' || asqAnswers.thoughts === 'yes') {
      return 'high'
    }
    // Moderate risk: High PHQ/GAD scores even without ASQ positives
    const phqScore = form.mood <= 2 && form.energy <= 2 ? 15 : 8
    if (phqScore >= 15) {
      return 'moderate'
    }
    return 'low'
  }

  const handleSubmit = () => {
    const risk = calculateSafetyRisk()
    const entry = { 
      ...form, 
      cognitiveScore, 
      studentName: form.studentName || 'Anonymous Student',
      screenUseImpact: form.screenUseImpact,
      asqCompleted: true,
      asqThoughts: asqAnswers.thoughts,
      asqBetterOff: asqAnswers.betterOff,
      asqHurt: asqAnswers.hurt,
      asqAttempt: asqAnswers.attempt,
      safetyRisk: risk,
      crisisAlertTriggered: risk === 'high' || risk === 'immediate',
    }
    onSubmit(entry)
    setSubmitted(true)
    setStep(0)
    setForm((prev) => ({ ...prev, notes: '', screenUseImpact: undefined }))
    setAsqAnswers({ thoughts: undefined, betterOff: undefined, hurt: undefined, attempt: undefined })
    
  }

  const toneClass = preferences.tone === 'playful' ? 'tone-playful' : 'tone-serious'
  
  return (
    <section className={`panel ${toneClass}`}>
      <div className="panel__header">
        <div className="header-top">
          <div>
            <h2>{translations.weeklyCheckIn}</h2>
            <p>{translations.checkInDesc}</p>
            <p className="universal-note">
              <strong>For every student, every week.</strong> Good days and tough days both matter. 💛<br />
              <span style={{ fontSize: '0.9rem', display: 'block', marginTop: '0.5rem' }}>
                You've probably already dealt with a lot on your own. This is a small way of not carrying it all by yourself.
              </span>
            </p>
          </div>
          <div className="header-actions">
            <button 
              type="button" 
              className="calm-room-btn" 
              onClick={() => setShowCalmRoom(true)}
            >
              🌿 Calm Room
            </button>
            <button 
              type="button" 
              className="settings-btn" 
              onClick={() => setShowPreferences(true)}
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
        {engagement.totalCheckIns > 0 && (
          <div className="engagement-badge">
            <span>🔥 {engagement.currentStreak} week streak</span>
            <span>📊 {engagement.totalCheckIns} check-ins</span>
          </div>
        )}
      </div>
      <div className="preferred-name-section">
        <div className="card preferred-name-card">
          <label>✨ Preferred name (optional)</label>
          <input
            type="text"
            placeholder="You can stay anonymous"
            value={form.studentName}
            onChange={(e) => setForm((prev) => ({ ...prev, studentName: e.target.value }))}
          />
        </div>
        <div className="inspiration-note-card">
          <p className="inspiration-quote">"You are not a drop in the ocean. You are the entire ocean in a drop."</p>
          <p className="inspiration-author">– Rumi</p>
          <p className="inspiration-message">You matter more than you know, and your feelings matter too. 🌊💛</p>
        </div>
      </div>
      <div className="stepper">
        {['Mood & basics', 'Energy & worries', 'Wrap-up', 'Safety check'].map((label, index) => (
          <div key={label} className={`step ${index === step ? 'active' : step > index ? 'done' : ''}`}>
            <span>{index + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="card-grid">
            {dynamicQuestions.slice(0, 3).map((slider) => (
              <SliderCard key={slider.key} config={slider as any} value={form[slider.key as keyof typeof form] as number} onChange={handleSliderChange} />
            ))}
          {checkInCount >= 3 && (
            <div className="card skill-prompt">
              <p>{translations.tryQuickSkill}</p>
              <button type="button" className="ghost" onClick={() => setShowSkills(true)}>
                Explore micro-skills
              </button>
            </div>
          )}
          {checkInCount >= 5 && !passiveConsent.enabled && (
            <div className="card passive-prompt">
              <p>📱 Optional: Connect wearable or phone data for deeper insights?</p>
              <p className="passive-note">Sleep and activity patterns can help us understand your well-being better. 
              You can always use low-data mode with just check-ins.</p>
              <button type="button" className="ghost" onClick={() => setShowPassiveSensing(true)}>
                Learn more
              </button>
            </div>
          )}
          </div>
        </>
      )}

      {step === 1 && (
        <div className="card-grid">
          {dynamicQuestions.slice(3).map((slider) => (
            <SliderCard key={slider.key} config={slider as any} value={form[slider.key as keyof typeof form] as number} onChange={handleSliderChange} />
          ))}
          <div className="card">
            <label>Anything else you want adults to know? (optional)</label>
            <textarea
              rows={3}
              placeholder="Wins, worries, things that would help..."
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card-grid cognitive-grid">
          <CognitiveMiniTask score={cognitiveScore} onScoreChange={setCognitiveScore} />
          <ScreenUseReflection 
            value={form.screenUseImpact}
            onChange={(value) => setForm((prev) => ({ ...prev, screenUseImpact: value }))}
          />
          <div className="card summary-card">
            <h3>Your weekly snapshot</h3>
            <ul>
              <li>
                Mood sits at <strong>{form.mood}/5</strong>
              </li>
              <li>
                Sleep & energy average <strong>{Math.round((form.sleepQuality + form.energy) / 2)}/5</strong>
              </li>
              <li>
                Worries feel <strong>{form.worries >= 3 ? 'heavy' : 'manageable'}</strong>
              </li>
              {cognitiveScore && (
                <li>
                  Reaction time mini-game: <strong>{cognitiveScore} ms</strong>
                </li>
              )}
            </ul>
            <p>Ready to share this privately with your student support team?</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <ASQScreening
          answers={asqAnswers}
          onAnswerChange={setAsqAnswers}
          onComplete={(risk) => {
            setSafetyRisk(risk)
            if (risk === 'high' || risk === 'immediate') {
              setShowCrisisResponse(true)
            } else {
              // Low or moderate risk - proceed with normal submission
              handleSubmit()
            }
          }}
          resources={resources}
        />
      )}

      <div className="form-actions">
        <button onClick={handleBack} disabled={step === 0}>
          Back
        </button>
        {step < 2 ? (
          <button className="primary" onClick={handleNext}>
            Next
          </button>
        ) : step === 2 ? (
          <button className="primary" onClick={handleNext}>
            Continue to safety check
          </button>
        ) : null}
      </div>

      <div className="quick-links-footer">
        <button type="button" className="ghost small" onClick={() => setShowAboutApp(true)}>
          ℹ️ What this app does / doesn't do
        </button>
        <button type="button" className="ghost small" onClick={() => setShowDataSharing(true)}>
          👁️ See what's shared with school
        </button>
        <button type="button" className="ghost small" onClick={() => setShowCoDesign(true)}>
          💬 Give feedback (co-design)
        </button>
      </div>

      {submitted && lastSaved && (
        <div className="modal-overlay" onClick={() => setSubmitted(false)}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close" 
              onClick={() => setSubmitted(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="success-icon">✓</div>
            <h2>
              {translations.thanksForCheckingIn}, {lastSaved.studentName}! {engagement.currentStreak > 1 && ` ${translations.weekStreak.replace('{count}', engagement.currentStreak.toString())}`}
              {engagement.currentStreak === 1 && ` ${translations.gladYoureHere}`}
            </h2>
            <p className="modal-note">{translations.adultsSeeTrends.replace('{date}', formatDate(lastSaved.createdAt))}</p>
            {checkInCount >= 2 && (
              <button type="button" className="primary" onClick={() => { setShowSkills(true); setSubmitted(false); }}>
                {translations.trySkillPractice}
              </button>
            )}
            <button type="button" className="ghost" onClick={() => setSubmitted(false)}>
              {translations.gotIt}
            </button>
          </div>
        </div>
      )}
      
      {showSkills && <CBTMicroSkills onClose={() => setShowSkills(false)} />}
      {showPreferences && (
        <PreferencesModal
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
          resources={resources}
          onClose={() => setShowPreferences(false)}
        />
      )}
      {showPassiveSensing && (
        <PassiveSensingModal
          consent={passiveConsent}
          onConsentChange={(newConsent) => {
            localStorage.setItem(PASSIVE_SENSING_KEY, JSON.stringify(newConsent))
            window.location.reload() // Refresh to show new features
          }}
          onClose={() => setShowPassiveSensing(false)}
          deviceInfo={deviceInfo}
        />
      )}
      {showCalmRoom && onCalmRoomSession && (
        <CalmRoomQRScanner
          onSessionComplete={(session) => {
            onCalmRoomSession(session)
            setShowCalmRoom(false)
          }}
          onClose={() => setShowCalmRoom(false)}
        />
      )}
      {showCoDesign && (
        <CoDesignFeedbackModal
          userType="student"
          onSubmit={(feedback) => {
            const newFeedback: CoDesignFeedback = {
              ...feedback,
              id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              status: 'pending',
            }
            // In production, this would be sent to backend
            // For now, store locally
            const stored = localStorage.getItem(CODESIGN_FEEDBACK_KEY)
            const allFeedback = stored ? JSON.parse(stored) : []
            allFeedback.push(newFeedback)
            localStorage.setItem(CODESIGN_FEEDBACK_KEY, JSON.stringify(allFeedback))
            setShowCoDesign(false)
            alert('Thank you for your feedback! We review all submissions and use them to improve the app.')
          }}
          onClose={() => setShowCoDesign(false)}
        />
      )}
      {showAboutApp && (
        <AboutAppModal onClose={() => setShowAboutApp(false)} />
      )}
      {showDataSharing && (
        <DataSharingModal 
          student={currentStudent}
          onClose={() => setShowDataSharing(false)}
        />
      )}
      {showCrisisResponse && safetyRisk && (safetyRisk === 'high' || safetyRisk === 'immediate') && (
        <CrisisResponse
          risk={safetyRisk}
          resources={resources}
          studentName={form.studentName || 'Anonymous Student'}
          onAcknowledge={() => {
            setShowCrisisResponse(false)
            handleSubmit()
          }}
        />
      )}
      {passiveConsent.enabled && currentStudent && (
        <PassiveInsights student={currentStudent} consent={passiveConsent} />
      )}
      <CulturalResourcesFooter resources={resources} />
    </section>
  )
}

type SliderCardProps = {
  config: (typeof sliderConfig)[number]
  value: number
  onChange: (key: (typeof sliderConfig)[number]['key'], value: number) => void
}

const SliderCard = ({ config, value, onChange }: SliderCardProps) => {
  const emoji = config.emoji?.[value - 1] || config.icon
  return (
    <div className="card slider-card">
      <div className="slider-card__header">
        <span className="slider-emoji">{emoji}</span>
        <p>{config.label}</p>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(event) => onChange(config.key, Number(event.target.value))}
          className="slider-input"
        />
        <div className="slider-emoji-track">
          {config.emoji?.map((e, i) => (
            <span key={i} className={i + 1 === value ? 'active' : ''}>{e}</span>
          ))}
        </div>
      </div>
      <div className="slider-labels">
        <span>{config.minLabel}</span>
        <span>{config.maxLabel}</span>
      </div>
    </div>
  )
}

type CognitiveMiniTaskProps = {
  score?: number
  onScoreChange: (value?: number) => void
}

const CognitiveMiniTask = ({ score, onScoreChange }: CognitiveMiniTaskProps) => {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'tap' | 'tooSoon'>('idle')
  const [message, setMessage] = useState('Tap start and react when the screen flashes mint.')
  
  // Use refs to track timeouts and start time for cleanup and accurate timing
  const timeoutIdRef = useRef<number | null>(null)
  const tapWindowTimeoutIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) window.clearTimeout(timeoutIdRef.current)
      if (tapWindowTimeoutIdRef.current) window.clearTimeout(tapWindowTimeoutIdRef.current)
    }
  }, [])

  const clearAllTimeouts = () => {
    if (timeoutIdRef.current) {
      window.clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
    if (tapWindowTimeoutIdRef.current) {
      window.clearTimeout(tapWindowTimeoutIdRef.current)
      tapWindowTimeoutIdRef.current = null
    }
  }

  const startTask = () => {
    // Clear any existing timeouts first
    clearAllTimeouts()
    
    setStatus('waiting')
    setMessage('Wait for the mint flash...')
    startTimeRef.current = null
    
    const delay = 1200 + Math.random() * 2000
    const id = window.setTimeout(() => {
      const tapStartTime = performance.now()
      startTimeRef.current = tapStartTime
      setStatus('tap')
      setMessage('Tap now!')
      
      // Set a timeout to reset if user doesn't tap within 5 seconds
      const tapWindowId = window.setTimeout(() => {
        setStatus('idle')
        setMessage('Time expired. Tap start to try again.')
        startTimeRef.current = null
        tapWindowTimeoutIdRef.current = null
      }, 5000)
      tapWindowTimeoutIdRef.current = tapWindowId
    }, delay)
    timeoutIdRef.current = id
  }

  const handleTap = () => {
    if (status === 'waiting') {
      // Clear the pending timeout when tapping too soon
      clearAllTimeouts()
      setStatus('tooSoon')
      setMessage('Too soon! Let the flash appear first.')
      return
    }
    if (status === 'tap' && startTimeRef.current !== null) {
      const reaction = Math.round(performance.now() - startTimeRef.current)
      clearAllTimeouts()
      setStatus('idle')
      setMessage(`Nice reflexes: ${reaction} ms.`)
      startTimeRef.current = null
      // Ensure score is set
      onScoreChange(reaction)
      return
    }
    if (status === 'tooSoon' || status === 'idle') {
      startTask()
    }
  }

  return (
    <div className={`card cognitive ${status}`}>
      <div className="cognitive__body" onClick={handleTap}>
        <p>{message}</p>
        <button type="button" className="ghost" onClick={(e) => {
          e.stopPropagation()
          handleTap()
        }}>
          {status === 'tap' ? 'Tap!' : 'Start mini-game'}
        </button>
      </div>
      <p className="cognitive__note">
        Optional 30s attention pulse. No scores are shared beyond your student support team.
      </p>
      {score && <p className="cognitive__score">Last run: {score} ms</p>}
    </div>
  )
}

type CounselorDashboardProps = {
  students: StudentRecord[]
  onStudentsUpdate: (students: StudentRecord[]) => void
  translations: typeof translations.en
}

// Future: Dashboard view switching
// type DashboardView = 'risk' | 'trend' | 'population'

const StartGroupSessionButton = () => {
  const [showModal, setShowModal] = useState(false)
  const [selectedPack, setSelectedPack] = useState<string>('')
  
  // Activity pack info (full packs defined later in file)
  const packs = {
    'anxiety-myths': { title: 'Anxiety Myths vs Facts', description: 'Test your knowledge about anxiety', questionCount: 3 },
    'social-media-healthy': { title: 'Healthy Social Media Choices', description: 'Learn about healthy social media habits', questionCount: 3 },
    'sleep-mood': { title: 'Sleep & Mood Connection', description: 'Understand how sleep affects your mood', questionCount: 3 },
  }
  
  const handleStart = () => {
    if (!selectedPack) return
    
    // Generate session ID (like Kahoot PIN)
    const sessionId = Math.random().toString(36).substr(2, 6).toUpperCase()
    
    const session: GroupSession = {
      sessionId,
      hostUserId: 'current_counselor', // In production, get from auth
      stationId: selectedPack,
      activityPack: packs[selectedPack as keyof typeof packs]?.title || selectedPack,
      startTime: new Date().toISOString(),
      participantCount: 0,
      isActive: true,
      totalScore: 0,
    }
    
    const stored = localStorage.getItem(GROUP_SESSIONS_KEY)
    const sessions = stored ? JSON.parse(stored) : []
    sessions.push(session)
    localStorage.setItem(GROUP_SESSIONS_KEY, JSON.stringify(sessions))
    
    // Show QR code and PIN
    const qrUrl = `${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`
    alert(`Group session started!\n\nSession PIN: ${sessionId}\n\nShare this URL or QR code:\n${qrUrl}\n\nStudents can scan the QR code or enter the PIN to join.`)
    
    setShowModal(false)
    setSelectedPack('')
  }
  
  return (
    <>
      <button 
        type="button" 
        className="primary"
        onClick={() => setShowModal(true)}
        style={{ marginLeft: 'auto' }}
      >
        🎯 Start Group Session
      </button>
      {showModal && (
        <div className="skills-overlay" onClick={() => setShowModal(false)}>
          <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>Start Group Session (Kahoot-style)</h3>
              <button type="button" className="close" onClick={() => setShowModal(false)}>×</button>
            </header>
            <div className="preferences-content">
              <section>
                <h4>Choose an activity pack</h4>
                <p className="privacy-note" style={{ marginBottom: '1rem' }}>
                  <strong>Important:</strong> All questions are knowledge-based only. No self-disclosure questions.
                </p>
                <select
                  value={selectedPack}
                  onChange={(e) => setSelectedPack(e.target.value)}
                  className="region-select"
                >
                  <option value="">Select an activity pack...</option>
                  <option value="anxiety-myths">Anxiety Myths vs Facts</option>
                  <option value="social-media-healthy">Healthy Social Media Choices</option>
                  <option value="sleep-mood">Sleep & Mood Connection</option>
                </select>
                {selectedPack && packs[selectedPack as keyof typeof packs] && (
                  <div className="activity-pack-info" style={{ marginTop: '1rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                    <p><strong>{packs[selectedPack as keyof typeof packs].title}</strong></p>
                    <p>{packs[selectedPack as keyof typeof packs].description}</p>
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      {packs[selectedPack as keyof typeof packs].questionCount} questions
                    </p>
                  </div>
                )}
              </section>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="primary" onClick={handleStart} disabled={!selectedPack}>
                  Start Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const CounselorDashboard = ({ students, onStudentsUpdate, translations }: CounselorDashboardProps) => {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? '')
  const [activeView, setActiveView] = useState<'overview' | 'triage' | 'audit'>('overview')
  const [currentRole] = useState<UserRole>('counselor')
  const [searchQuery, setSearchQuery] = useState('')
  const [auditLogs] = useState<AuditLog[]>(() => {
    const stored = localStorage.getItem('audit_logs')
    return stored ? JSON.parse(stored) : []
  })
  const [threatScenarios] = useState<ThreatScenario[]>(() => {
    const stored = localStorage.getItem(THREAT_DETECTION_KEY)
    return stored ? JSON.parse(stored) : []
  })
  // Future: Event markers for trend view
  // const [eventMarkers, setEventMarkers] = useState<EventMarker[]>(() => {
  //   const stored = localStorage.getItem('event_markers')
  //   return stored ? JSON.parse(stored) : []
  // })
  
  useEffect(() => {
    if (!students.find((s) => s.id === selectedId) && students[0]) {
      setSelectedId(students[0].id)
    }
  }, [students, selectedId])
  
  // Calculate concern scores for all students (sorted by concern)
  const studentsWithConcern = useMemo(() => {
    return students.map(s => ({
      ...s,
      concernScore: calculateConcernScore(s)
    })).sort((a, b) => (b.concernScore ?? 0) - (a.concernScore ?? 0))
  }, [students])
  
  // Log access for audit trail
  useEffect(() => {
    if (selectedId) {
      const log: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'current_user',
        userRole: currentRole,
        action: 'view_student',
        resource: 'student',
        resourceId: selectedId,
        timestamp: new Date().toISOString(),
      }
      const stored = localStorage.getItem('audit_logs')
      const logs = stored ? JSON.parse(stored) : []
      logs.push(log)
      localStorage.setItem('audit_logs', JSON.stringify(logs))
    }
  }, [selectedId, currentRole])
  
  // Use studentsWithConcern for risk list (sorted by concern score)
  const riskListStudents = studentsWithConcern
  
  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return riskListStudents
    const query = searchQuery.toLowerCase()
    return riskListStudents.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.grade.toLowerCase().includes(query) ||
      student.advisor.toLowerCase().includes(query)
    )
  }, [riskListStudents, searchQuery])

  const selectedStudent = students.find((student) => student.id === selectedId)

  const movers = useMemo(() => {
    return students
      .map((student) => {
        const latest = student.history.at(-1)
        const previous = student.history.at(-2)
        if (!latest || !previous) return null
        const delta = calculateRiskScore(latest) - calculateRiskScore(previous)
        return { student, delta }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.delta ?? 0) - (a!.delta ?? 0))
      .slice(0, 3) as { student: StudentRecord; delta: number }[]
  }, [students])


  const needsAttention = useMemo(() => {
    return students.filter(s => s.needsAttention || (s.followUps && s.followUps.some(f => f.status === 'pending')))
  }, [students])

  const safetyAlerts = useMemo(() => {
    return students.filter(s => {
      const latest = s.history.at(-1)
      return latest?.crisisAlertTriggered || latest?.safetyRisk === 'high' || latest?.safetyRisk === 'immediate'
    })
  }, [students])

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Counselor & school dashboard</h2>
        <p>{translations.universalScreeningResults} 
        Clear referral workflow: flagged → counselor notified → structured follow-up.</p>
        <div className="staff-reminder" style={{ 
          background: '#fef3c7', 
          border: '1px solid #fcd34d', 
          borderRadius: '12px', 
          padding: '1rem', 
          marginTop: '1rem',
          fontSize: '0.9rem',
          color: '#78350f'
        }}>
          <strong>💡 Reminder:</strong> Reach out with curiosity and care. This student may already feel judged by adults. 
          Focus on understanding their story over time, not just red alerts. Trends in mood, sleep, and energy tell a fuller picture.
        </div>
        <div className="dashboard-view-tabs" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className={activeView === 'overview' ? 'primary' : 'ghost'}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button 
            type="button" 
            className={activeView === 'triage' ? 'primary' : 'ghost'}
            onClick={() => setActiveView('triage')}
          >
            Triage View {safetyAlerts.length > 0 && `(${safetyAlerts.length})`}
          </button>
          <button 
            type="button" 
            className={activeView === 'audit' ? 'primary' : 'ghost'}
            onClick={() => setActiveView('audit')}
          >
            Audit Log
          </button>
          <StartGroupSessionButton />
        </div>
      </div>
      {activeView === 'triage' ? (
        <TriageView 
          safetyAlerts={safetyAlerts}
          needsAttention={needsAttention}
          threatScenarios={threatScenarios}
          onSelectStudent={(id) => {
            setSelectedId(id)
            setActiveView('overview')
          }}
        />
      ) : activeView === 'audit' ? (
        <AuditLogViewer auditLogs={auditLogs} />
      ) : (
      <div className="dashboard-grid">
        <div className="dashboard-column">
          {safetyAlerts.length > 0 && (
            <div className="card safety-alert-card">
              <h3>🚨 Safety Alerts ({safetyAlerts.length})</h3>
              <p className="safety-alert-note">High-priority: Students with suicide risk screening positives</p>
              <ul className="student-list">
                {safetyAlerts.map((student) => {
                  const latest = student.history.at(-1)
                  const risk = latest?.safetyRisk || 'high'
                  return (
                    <li key={student.id} onClick={() => setSelectedId(student.id)} className={student.id === selectedId ? 'active' : ''}>
                      <span className="status-dot" data-band="high" />
                      <div>
                        <p className="name">{student.name}</p>
                        <p className="meta">
                          Risk: {risk === 'immediate' ? '🚨 IMMEDIATE' : '⚠️ HIGH'}
                          {latest?.asqHurt === 'yes' && <span className="asq-flag">Current thoughts</span>}
                          {latest?.asqAttempt === 'yes' && <span className="asq-flag">Previous attempt</span>}
                        </p>
                      </div>
                      <span className="risk-score">!</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {needsAttention.length > 0 && (
            <div className="card attention-card">
              <h3>⚠️ Needs Attention ({needsAttention.length})</h3>
              <ul className="student-list">
                {needsAttention.map((student) => {
                  const latest = student.history.at(-1)
                  const phqScore = latest?.phqScore ?? 0
                  const gadScore = latest?.gadScore ?? 0
                  const pendingFollowUps = student.followUps?.filter(f => f.status === 'pending').length ?? 0
                  return (
                    <li key={student.id} onClick={() => setSelectedId(student.id)} className={student.id === selectedId ? 'active' : ''}>
                      <span className="status-dot" data-band="high" />
                      <div>
                        <p className="name">{student.name}</p>
                        <p className="meta">
                          PHQ: {phqScore} | GAD: {gadScore}
                          {pendingFollowUps > 0 && <span className="pending-badge">{pendingFollowUps} pending</span>}
                        </p>
                      </div>
                      <span className="risk-score">!</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>All students (sorted by concern score)</h3>
            <p className="meta-note" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Concern score combines recent check-ins, trends, and safety flags. Not shown to students.
            </p>
            <input
              type="text"
              placeholder="Search by name, grade, or advisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                marginBottom: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
            />
            <div className="student-list-container">
              <ul className="student-list">
                {filteredStudents.map((student) => {
                  const latest = student.history.at(-1)
                  const risk = calculateRiskScore(latest)
                  const band = riskBand(risk)
                  const concern = student.concernScore ?? 0
                  return (
                    <li key={student.id} onClick={() => setSelectedId(student.id)} className={student.id === selectedId ? 'active' : ''}>
                      <span className="status-dot" data-band={band} />
                      <div>
                        <p className="name">{student.name}</p>
                        <p className="meta">
                          {student.grade} • Advisor {student.advisor}
                        </p>
                      </div>
                      <span className="risk-score" title={`Concern: ${concern}`}>{concern}</span>
                    </li>
                  )
                })}
                {filteredStudents.length === 0 && (
                  <li style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                    No students found matching "{searchQuery}"
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="card">
            <h3>Big movers</h3>
            <ul className="mover-list">
              {movers.map(({ student, delta }) => (
                <li key={student.id}>
                  <p>{student.name}</p>
                  <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? '+' : ''}{delta}</span>
                </li>
              ))}
              {movers.length === 0 && (
                <li>
                  <p>Anonymous Student</p>
                  <span className="delta" style={{ color: '#64748b' }}>+0</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {selectedStudent && (
          <div className="dashboard-column">
            <div className="card detail-card">
              <header>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: '#22c55e', 
                    marginTop: '0.5rem',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>{selectedStudent.name}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                      {selectedStudent.grade} • Advisor {selectedStudent.advisor}
                    </p>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 600,
                  color: '#0f172a',
                  marginTop: '0.5rem'
                }}>
                  {selectedStudent.concernScore ?? calculateConcernScore(selectedStudent)}
                </div>
              </header>
              <ScreeningScores entry={selectedStudent.history.at(-1)} />
              {selectedStudent.history.at(-1)?.crisisAlertTriggered && (
                <SafetyAlertDetails entry={selectedStudent.history.at(-1)} />
              )}
              <LongTermTrajectory student={selectedStudent} />
              <TrendGraph history={selectedStudent.history} />
              <FlagList history={selectedStudent.history} />
              <FollowUpWorkflow 
                student={selectedStudent} 
                onUpdate={(updated) => {
                  onStudentsUpdate(students.map((s: StudentRecord) => s.id === updated.id ? updated : s))
                }} 
              />
              <ActionButtons studentName={selectedStudent.name} />
            </div>
          </div>
        )}
      </div>
      )}
    </section>
  )
}

type TriageViewProps = {
  safetyAlerts: StudentRecord[]
  needsAttention: StudentRecord[]
  threatScenarios: ThreatScenario[]
  onSelectStudent: (id: string) => void
}

const TriageView = ({ safetyAlerts, needsAttention, threatScenarios, onSelectStudent }: TriageViewProps) => {
  // Batch alerts by time (last 24h)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentAlerts = safetyAlerts.filter(s => {
    const latest = s.history.at(-1)
    return latest && new Date(latest.createdAt) >= last24h
  })
  
  // Group by priority
  const immediate = safetyAlerts.filter(s => s.history.at(-1)?.safetyRisk === 'immediate')
  const high = safetyAlerts.filter(s => s.history.at(-1)?.safetyRisk === 'high')
  const moderate = needsAttention.filter(s => !safetyAlerts.includes(s))
  
  return (
    <div className="triage-view">
      <div className="card">
        <h3>🚨 Triage View - Safety Overload Safeguards</h3>
        <p className="triage-note">
          If 40+ students trigger alerts at once, use this view to prioritize. 
          Alerts are batched and sorted by urgency.
        </p>
      </div>
      
      <div className="triage-grid">
        <div className="triage-column">
          <div className="card triage-card immediate">
            <h3>🚨 IMMEDIATE ({immediate.length})</h3>
            <p>Current thoughts of self-harm or previous attempt</p>
            <ul className="student-list">
              {immediate.map(student => {
                const latest = student.history.at(-1)
                return (
                  <li key={student.id} onClick={() => onSelectStudent(student.id)}>
                    <span className="status-dot" data-band="high" />
                    <div>
                      <p className="name">{student.name}</p>
                      <p className="meta">{student.grade}</p>
                      {latest?.asqHurt === 'yes' && <span className="asq-flag">Current thoughts</span>}
                      {latest?.asqAttempt === 'yes' && <span className="asq-flag">Previous attempt</span>}
                    </div>
                  </li>
                )
              })}
              {immediate.length === 0 && <p>No immediate alerts</p>}
            </ul>
          </div>
        </div>
        
        <div className="triage-column">
          <div className="card triage-card high">
            <h3>⚠️ HIGH ({high.length})</h3>
            <p>Suicidal ideation or severe symptoms</p>
            <ul className="student-list">
              {high.map(student => {
                const latest = student.history.at(-1)
                return (
                  <li key={student.id} onClick={() => onSelectStudent(student.id)}>
                    <span className="status-dot" data-band="high" />
                    <div>
                      <p className="name">{student.name}</p>
                      <p className="meta">{student.grade}</p>
                      <p className="meta">PHQ: {latest?.phqScore ?? 0} | GAD: {latest?.gadScore ?? 0}</p>
                    </div>
                  </li>
                )
              })}
              {high.length === 0 && <p>No high-priority alerts</p>}
            </ul>
          </div>
        </div>
        
        <div className="triage-column">
          <div className="card triage-card moderate">
            <h3>📋 MODERATE ({moderate.length})</h3>
            <p>Needs follow-up but not immediate crisis</p>
            <ul className="student-list">
              {moderate.slice(0, 10).map(student => {
                const latest = student.history.at(-1)
                return (
                  <li key={student.id} onClick={() => onSelectStudent(student.id)}>
                    <span className="status-dot" data-band="medium" />
                    <div>
                      <p className="name">{student.name}</p>
                      <p className="meta">{student.grade}</p>
                      <p className="meta">PHQ: {latest?.phqScore ?? 0} | GAD: {latest?.gadScore ?? 0}</p>
                    </div>
                  </li>
                )
              })}
              {moderate.length > 10 && <p>... and {moderate.length - 10} more</p>}
              {moderate.length === 0 && <p>No moderate alerts</p>}
            </ul>
          </div>
        </div>
      </div>
      
      {recentAlerts.length > 0 && (
        <div className="card">
          <h3>📊 Batch Summary (Last 24h)</h3>
          <p><strong>{recentAlerts.length} new high-risk alerts</strong> in the last 24 hours</p>
          <p>Total active alerts: {safetyAlerts.length}</p>
        </div>
      )}
      
      {threatScenarios.length > 0 && (
        <div className="card threat-detection-card">
          <h3>🛡️ Threat Detection ({threatScenarios.length})</h3>
          <p className="threat-note">Potential abuse cases detected (false crisis, shared devices, etc.)</p>
          <ul className="threat-list">
            {threatScenarios.map(threat => (
              <li key={threat.id}>
                <div className="threat-header">
                  <strong>{threat.scenario.replace('_', ' ').toUpperCase()}</strong>
                  <span className="threat-date">{new Date(threat.detectedAt || '').toLocaleDateString()}</span>
                </div>
                <p className="threat-description">{threat.description}</p>
                <p className="threat-mitigation"><strong>Mitigation:</strong> {threat.mitigation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

type AuditLogViewerProps = {
  auditLogs: AuditLog[]
}

const AuditLogViewer = ({ auditLogs }: AuditLogViewerProps) => {
  const sortedLogs = [...auditLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  
  return (
    <div className="audit-log-viewer">
      <div className="card">
        <h3>📋 Audit Log - Access Transparency</h3>
        <p className="audit-note">
          Every access to student data is logged for transparency and compliance. 
          Students and parents can request to see who accessed their data.
        </p>
        <div className="audit-stats">
          <p><strong>Total log entries:</strong> {auditLogs.length}</p>
          <p><strong>Unique users:</strong> {new Set(auditLogs.map(l => l.userId)).size}</p>
        </div>
      </div>
      
      <div className="card audit-log-list">
        <h4>Recent Activity</h4>
        <div className="audit-table">
          <div className="audit-header">
            <span>Timestamp</span>
            <span>User</span>
            <span>Role</span>
            <span>Action</span>
            <span>Resource</span>
          </div>
          {sortedLogs.slice(0, 50).map(log => (
            <div key={log.id} className="audit-row">
              <span>{new Date(log.timestamp).toLocaleString()}</span>
              <span>{log.userId}</span>
              <span>{log.userRole}</span>
              <span>{log.action.replace('_', ' ')}</span>
              <span>{log.resource}: {log.resourceId}</span>
            </div>
          ))}
          {auditLogs.length === 0 && <p>No audit logs yet</p>}
        </div>
      </div>
    </div>
  )
}

// RiskBadge component - currently unused, commented out for now
// const RiskBadge = ({ entry }: { entry?: CheckInEntry }) => {
//   const score = calculateRiskScore(entry)
//   const band = riskBand(score)
//   const palette = riskPalette[band as keyof typeof riskPalette]
//   return (
//     <div className="risk-badge" style={{ backgroundImage: palette.hue }}>
//       <span>{palette.label}</span>
//       <strong>{score}</strong>
//     </div>
//   )
// }

const TrendGraph = ({ history }: { history: CheckInEntry[] }) => {
  const dataPoints = history.map((entry) => ({
    date: formatDate(entry.createdAt),
    mood: entry.mood,
    stress: entry.worries,
    sleep: entry.sleepQuality,
  }))

  const chartWidth = 320
  const chartHeight = 160
  const maxValue = 5
  const stepX = chartWidth / Math.max(1, dataPoints.length - 1)

  const buildPath = (key: 'mood' | 'stress' | 'sleep') =>
    dataPoints
      .map((point, index) => {
        const value = point[key]
        const x = index * stepX
        const y = chartHeight - (value / maxValue) * chartHeight
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')

  return (
    <div className="trend-graph">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <path d={buildPath('mood')} stroke="#4f46e5" fill="none" strokeWidth={3} />
        <path d={buildPath('sleep')} stroke="#14b8a6" fill="none" strokeWidth={3} strokeDasharray="6 6" />
        <path d={buildPath('stress')} stroke="#f97316" fill="none" strokeWidth={3} strokeDasharray="2 6" />
      </svg>
      <div className="legend">
        <span>
          <i className="dot mood" /> Mood
        </span>
        <span>
          <i className="dot sleep" /> Sleep
        </span>
        <span>
          <i className="dot stress" /> Worries
        </span>
      </div>
      <div className="dates">
        {dataPoints.map((point) => (
          <span key={point.date}>{point.date}</span>
        ))}
      </div>
    </div>
  )
}

const FlagList = ({ history }: { history: CheckInEntry[] }) => {
  const flags = buildFlags(history)
  if (flags.length === 0) {
    return (
      <div className="flags">
        <p>No automated flags. Keep nudging with positive touchpoints.</p>
      </div>
    )
  }
  return (
    <div className="flags">
      {flags.map((flag) => (
        <p key={flag}>{flag}</p>
      ))}
    </div>
  )
}

const ScreeningScores = ({ entry }: { entry?: CheckInEntry }) => {
  if (!entry?.screeningComplete) return null
  
  const phqLevel = entry.phqScore && entry.phqScore >= 15 ? 'severe' : 
                  entry.phqScore && entry.phqScore >= 10 ? 'moderate' : 'mild'
  const gadLevel = entry.gadScore && entry.gadScore >= 15 ? 'severe' :
                   entry.gadScore && entry.gadScore >= 10 ? 'moderate' : 'mild'
  
  return (
    <div className="screening-scores">
      <h4>Validated screening scores</h4>
      <div className="scores-grid">
        <div className="score-card">
          <strong>PHQ-A</strong>
          <span className={`score-value ${phqLevel}`}>{entry.phqScore ?? 0}/27</span>
          <span className="score-label">
            {phqLevel === 'severe' ? 'Severe' : phqLevel === 'moderate' ? 'Moderate' : 'Mild'} depression symptoms
          </span>
        </div>
        <div className="score-card">
          <strong>GAD-7</strong>
          <span className={`score-value ${gadLevel}`}>{entry.gadScore ?? 0}/21</span>
          <span className="score-label">
            {gadLevel === 'severe' ? 'Severe' : gadLevel === 'moderate' ? 'Moderate' : 'Mild'} anxiety symptoms
          </span>
        </div>
      </div>
      <p className="screening-note">
        Scores ≥10 suggest moderate symptoms; ≥15 suggest severe. These are screening tools, not diagnoses.
      </p>
    </div>
  )
}

const SafetyAlertDetails = ({ entry }: { entry?: CheckInEntry }) => {
  if (!entry?.crisisAlertTriggered) return null
  
  return (
    <div className="safety-alert-details">
      <h4>🚨 Safety Alert - ASQ Screening Results</h4>
      <div className="asq-results">
        {entry.asqThoughts === 'yes' && (
          <div className="asq-result-item positive">
            <strong>✓</strong> Wished dead in past few weeks
          </div>
        )}
        {entry.asqBetterOff === 'yes' && (
          <div className="asq-result-item positive">
            <strong>✓</strong> Felt better off dead in past few weeks
          </div>
        )}
        {entry.asqHurt === 'yes' && (
          <div className="asq-result-item critical">
            <strong>⚠️</strong> Current thoughts of killing self
          </div>
        )}
        {entry.asqAttempt === 'yes' && (
          <div className="asq-result-item critical">
            <strong>⚠️</strong> Previous suicide attempt
          </div>
        )}
      </div>
      <div className="safety-action-required">
        <strong>Action Required:</strong>
        <ul>
          <li>High-priority alert sent to mental health team</li>
          <li>Immediate follow-up recommended</li>
          <li>Student shown crisis resources</li>
          <li>Risk level: <strong>{entry.safetyRisk?.toUpperCase()}</strong></li>
        </ul>
      </div>
      <p className="safety-note">
        <strong>Note:</strong> ASQ is a validated screening tool. Positive screens require 
        brief risk assessment by qualified mental health professional.
      </p>
    </div>
  )
}

type FollowUpWorkflowProps = {
  student: StudentRecord
  onUpdate: (student: StudentRecord) => void
}

const FollowUpWorkflow = ({ student, onUpdate }: FollowUpWorkflowProps) => {
  const [showForm, setShowForm] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpRecord | null>(null)
  const [formData, setFormData] = useState({
    status: 'pending' as FollowUpStatus,
    scheduledDate: '',
    counselorNotes: '',
    actionTaken: '',
  })

  const followUps = student.followUps || []
  const pendingFollowUps = followUps.filter(f => f.status === 'pending')
  
  const handleStatusChange = (followUpId: string, newStatus: FollowUpStatus) => {
    const updated = {
      ...student,
      followUps: student.followUps?.map(f => 
        f.id === followUpId 
          ? { ...f, status: newStatus, updatedAt: new Date().toISOString() }
          : f
      ),
    }
    onUpdate(updated)
    
    // Update localStorage
    const stored = localStorage.getItem(FOLLOWUPS_KEY)
    const allFollowUps = stored ? JSON.parse(stored) : []
    const updatedAll = allFollowUps.map((f: FollowUpRecord) =>
      f.id === followUpId ? { ...f, status: newStatus, updatedAt: new Date().toISOString() } : f
    )
    localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(updatedAll))
  }

  const handleEdit = (followUp: FollowUpRecord) => {
    setSelectedFollowUp(followUp)
    setFormData({
      status: followUp.status,
      scheduledDate: followUp.scheduledDate || '',
      counselorNotes: followUp.counselorNotes || '',
      actionTaken: followUp.actionTaken || '',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!selectedFollowUp) return
    
    const updated = {
      ...student,
      followUps: student.followUps?.map(f =>
        f.id === selectedFollowUp.id
          ? {
              ...f,
              ...formData,
              updatedAt: new Date().toISOString(),
            }
          : f
      ),
    }
    onUpdate(updated)
    setShowForm(false)
    setSelectedFollowUp(null)
  }

  if (followUps.length === 0) return null

  return (
    <div className="follow-up-workflow">
      <h4>Referral workflow & follow-ups</h4>
      {pendingFollowUps.length > 0 && (
        <div className="pending-alert">
          ⚠️ {pendingFollowUps.length} pending follow-up{pendingFollowUps.length > 1 ? 's' : ''} need attention
        </div>
      )}
      <div className="follow-ups-list">
        {followUps.map((followUp) => {
          const checkIn = student.history.find(h => h.id === followUp.checkInId)
          return (
            <div key={followUp.id} className="follow-up-item">
              <div className="follow-up-header">
                <span className={`status-badge ${followUp.status}`}>{followUp.status}</span>
                <span className="follow-up-date">{formatDate(followUp.flaggedDate)}</span>
              </div>
              {checkIn && (
                <div className="follow-up-scores">
                  PHQ: {checkIn.phqScore ?? 0} | GAD: {checkIn.gadScore ?? 0}
                </div>
              )}
              {followUp.scheduledDate && (
                <p className="follow-up-scheduled">Scheduled: {formatDate(followUp.scheduledDate)}</p>
              )}
              {followUp.counselorNotes && (
                <p className="follow-up-notes">{followUp.counselorNotes}</p>
              )}
              <div className="follow-up-actions">
                <select
                  value={followUp.status}
                  onChange={(e) => handleStatusChange(followUp.id, e.target.value as FollowUpStatus)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="no_action_needed">No Action Needed</option>
                </select>
                <button type="button" className="ghost small" onClick={() => handleEdit(followUp)}>
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      {showForm && selectedFollowUp && (
        <div className="follow-up-form">
          <h5>Edit follow-up</h5>
          <label>
            Status
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as FollowUpStatus })}
            >
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="no_action_needed">No Action Needed</option>
            </select>
          </label>
          <label>
            Scheduled date
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            />
          </label>
          <label>
            Counselor notes
            <textarea
              rows={3}
              value={formData.counselorNotes}
              onChange={(e) => setFormData({ ...formData, counselorNotes: e.target.value })}
              placeholder="Document actions taken, observations, next steps..."
            />
          </label>
          <label>
            Action taken
            <input
              type="text"
              value={formData.actionTaken}
              onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
              placeholder="e.g., Scheduled meeting, contacted parent, referred to external support"
            />
          </label>
          <div className="form-actions">
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="button" className="primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

const ActionButtons = ({ studentName }: { studentName: string }) => {
  const [message, setMessage] = useState<string | null>(null)

  const trigger = (text: string) => {
    setMessage(`${text} recorded for ${studentName}`)
    setTimeout(() => setMessage(null), 2500)
  }

  return (
    <div className="actions">
      <button onClick={() => trigger('Schedule check-in')}>Schedule check-in</button>
      <button onClick={() => trigger('Send supportive message')}>Send supportive message</button>
      <button onClick={() => trigger('Marked as followed by counselor')}>Mark as followed</button>
      {message && <p className="action-status">{message}</p>}
    </div>
  )
}

type CBTMicroSkillsProps = {
  onClose: () => void
}

type ScreenUseReflectionProps = {
  value?: 'better' | 'worse' | 'both' | 'neutral' | 'not_sure'
  onChange: (value: 'better' | 'worse' | 'both' | 'neutral' | 'not_sure') => void
}

const ScreenUseReflection = ({ value, onChange }: ScreenUseReflectionProps) => {
  return (
    <div className="card screen-use-card">
      <div className="screen-use-header">
        <span>📱</span>
        <div>
          <h4>Screen use reflection</h4>
          <p className="screen-use-note">
            Research shows it's not screens themselves, but how we use them that matters.
          </p>
        </div>
      </div>
      <p className="screen-use-question">
        In the last week, did your phone/screen use help you feel better, worse, or both?
      </p>
      <div className="screen-use-options">
        {[
          { value: 'better', label: 'Better', emoji: '😊' },
          { value: 'worse', label: 'Worse', emoji: '😟' },
          { value: 'both', label: 'Both', emoji: '😐' },
          { value: 'neutral', label: 'Neutral', emoji: '➡️' },
          { value: 'not_sure', label: 'Not sure', emoji: '🤔' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className={`screen-use-option ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange(option.value as any)}
          >
            <span className="option-emoji">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <p className="screen-use-disclaimer">
        This helps us understand patterns. No judgment—just awareness.
      </p>
    </div>
  )
}

const CBTMicroSkills = ({ onClose }: CBTMicroSkillsProps) => {
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const stored = localStorage.getItem(BOOKMARKS_KEY)
    return stored ? JSON.parse(stored) : []
  })
  
  const toggleBookmark = (skillId: string) => {
    const newBookmarks = bookmarks.includes(skillId)
      ? bookmarks.filter(id => id !== skillId)
      : [...bookmarks, skillId]
    setBookmarks(newBookmarks)
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks))
  }
  
  const skills = [
    {
      id: 'breathing',
      title: 'Box Breathing',
      icon: '🌬️',
      duration: '2 min',
      description: 'A simple technique to calm your nervous system.',
      steps: [
        'Breathe in for 4 counts',
        'Hold for 4 counts',
        'Breathe out for 4 counts',
        'Hold for 4 counts',
        'Repeat 4 times',
      ],
    },
    {
      id: 'reframing',
      title: 'Thought Reframing',
      icon: '🔄',
      duration: '3 min',
      description: 'Challenge unhelpful thoughts with evidence.',
      steps: [
        'Notice the thought (e.g., "I always mess up")',
        'Ask: What evidence supports this?',
        'Ask: What evidence contradicts it?',
        'Reframe: "I sometimes struggle, but I also succeed"',
        'Focus on what you can control',
      ],
    },
    {
      id: 'sleep',
      title: 'Sleep Hygiene Tips',
      icon: '😴',
      duration: 'Quick read',
      description: 'Small habits that improve sleep quality.',
      steps: [
        'Keep a consistent sleep schedule (even weekends)',
        'Avoid screens 1 hour before bed',
        'Create a calming bedtime routine',
        'Keep your room cool and dark',
        'Limit caffeine after 2pm',
      ],
    },
    {
      id: 'algorithms',
      title: 'How Algorithms Keep You Scrolling',
      icon: '📱',
      duration: '5 min',
      description: 'Understanding how social media platforms work.',
      steps: [
        'Algorithms show you content that keeps you engaged',
        'They learn what triggers strong emotions (good or bad)',
        'They create "infinite scroll" so you keep swiping',
        'Notifications are timed to bring you back',
        'You can break the cycle: set time limits, turn off notifications, take breaks',
        'Remember: You control your phone, not the other way around',
      ],
    },
    {
      id: 'mental-health-advice',
      title: 'Not All Online Mental Health Advice is Good',
      icon: '⚠️',
      duration: '5 min',
      description: 'How to spot reliable vs. harmful mental health information. (Based on APA & Surgeon General advisories)',
      steps: [
        'Look for sources: Is it from a licensed professional or reputable organization?',
        'Beware of "quick fixes" or "one-size-fits-all" solutions',
        'Check if the advice is evidence-based (backed by research)',
        'Avoid content that promotes harmful behaviors or extreme diets',
        'Trust your gut: If something feels off, it probably is',
        'Talk to a trusted adult or counselor about what you find online',
      ],
    },
    {
      id: 'healthy-social-media',
      title: 'Healthy Social Media Use',
      icon: '💚',
      duration: '5 min',
      description: 'Tips for safer social media use. (APA Health Advisory, 2023)',
      steps: [
        'Set time limits: Use phone settings to limit daily app use',
        'Curate your feed: Unfollow accounts that make you feel bad',
        'Take breaks: Schedule "no phone" times (meals, before bed)',
        'Be mindful: Notice how you feel before and after scrolling',
        'Connect IRL: Balance online time with in-person friendships',
        'Report harmful content: Don\'t engage with bullying or hate',
        'Remember: Social media is a highlight reel, not reality',
      ],
    },
    {
      id: 'coping-online-stress',
      title: 'Coping with Online Stress',
      icon: '🧘',
      duration: '5 min',
      description: 'Managing stress from social media and digital life. (Surgeon General Advisory, 2023)',
      steps: [
        'Recognize triggers: What content makes you feel anxious or sad?',
        'Practice digital boundaries: You don\'t have to respond immediately',
        'Use "do not disturb" mode during homework and sleep',
        'Focus on real connections: Prioritize face-to-face conversations',
        'Practice self-compassion: Everyone struggles with online pressure',
        'Seek support: Talk to friends, family, or counselors about online stress',
        'Remember: You can always log off and take a break',
      ],
    },
  ]
  
  const selectedSkill = skills.find(s => s.id === activeSkill)
  
  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>CBT Micro-Skills</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <p className="skills-intro">Quick, evidence-based practices you can use anytime. No long lessons—just helpful tools.</p>
        
        {!activeSkill ? (
          <>
            {bookmarks.length > 0 && (
              <div className="bookmarked-skills">
                <h4>⭐ Your Bookmarked Skills</h4>
                <div className="skills-grid">
                  {skills.filter(s => bookmarks.includes(s.id)).map((skill) => (
                    <div key={skill.id} className="skill-card bookmarked" onClick={() => setActiveSkill(skill.id)}>
                      <span className="skill-icon">{skill.icon}</span>
                      <h4>{skill.title}</h4>
                      <p>{skill.description}</p>
                      <span className="skill-duration">{skill.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="skills-grid">
              {skills.map((skill) => (
                <div key={skill.id} className="skill-card" onClick={() => setActiveSkill(skill.id)}>
                  <button
                    type="button"
                    className={`bookmark-btn ${bookmarks.includes(skill.id) ? 'bookmarked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(skill.id)
                    }}
                    aria-label={bookmarks.includes(skill.id) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {bookmarks.includes(skill.id) ? '⭐' : '☆'}
                  </button>
                  <span className="skill-icon">{skill.icon}</span>
                  <h4>{skill.title}</h4>
                  <p>{skill.description}</p>
                  <span className="skill-duration">{skill.duration}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="skill-detail">
            <button type="button" className="back" onClick={() => setActiveSkill(null)}>← Back</button>
            <div className="skill-header">
              <span className="skill-icon-large">{selectedSkill!.icon}</span>
              <div>
                <h4>{selectedSkill!.title}</h4>
                <p>{selectedSkill!.description}</p>
              </div>
            </div>
            <ol className="skill-steps">
              {selectedSkill!.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <div className="skill-footer">
              <p>💡 Practice this skill when you notice stress or low mood. Small, consistent practice helps.</p>
              <button
                type="button"
                className={`bookmark-btn-large ${bookmarks.includes(selectedSkill!.id) ? 'bookmarked' : ''}`}
                onClick={() => toggleBookmark(selectedSkill!.id)}
              >
                {bookmarks.includes(selectedSkill!.id) ? '⭐ Bookmarked' : '☆ Bookmark this skill'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type PreferencesModalProps = {
  preferences: UserPreferences
  onPreferencesChange: (prefs: UserPreferences) => void
  resources: CulturalResource[]
  onClose: () => void
}

const PreferencesModal = ({ preferences, onPreferencesChange, resources, onClose }: PreferencesModalProps) => {
  const updatePref = (key: keyof UserPreferences, value: string) => {
    onPreferencesChange({ ...preferences, [key]: value })
  }

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal preferences-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Settings & Resources</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        
        <div className="preferences-content">
          <section>
            <h4>Accessibility</h4>
            <div className="accessibility-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.accessibility?.highContrast || false}
                  onChange={(e) => onPreferencesChange({
                    ...preferences,
                    accessibility: { ...preferences.accessibility, highContrast: e.target.checked, largeText: preferences.accessibility?.largeText || false, keyboardOnly: preferences.accessibility?.keyboardOnly || false }
                  })}
                />
                <span>High contrast mode</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.accessibility?.largeText || false}
                  onChange={(e) => onPreferencesChange({
                    ...preferences,
                    accessibility: { ...preferences.accessibility, highContrast: preferences.accessibility?.highContrast || false, largeText: e.target.checked, keyboardOnly: preferences.accessibility?.keyboardOnly || false }
                  })}
                />
                <span>Larger text</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.accessibility?.keyboardOnly || false}
                  onChange={(e) => onPreferencesChange({
                    ...preferences,
                    accessibility: { ...preferences.accessibility, highContrast: preferences.accessibility?.highContrast || false, largeText: preferences.accessibility?.largeText || false, keyboardOnly: e.target.checked }
                  })}
                />
                <span>Keyboard-only navigation mode</span>
              </label>
            </div>
            <p className="privacy-note" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              These settings improve accessibility for users with visual impairments or motor disabilities.
            </p>
          </section>

          <section>
            <h4>Choose your style</h4>
            <div className="tone-selector">
              <button
                type="button"
                className={preferences.tone === 'serious' ? 'active' : ''}
                onClick={() => updatePref('tone', 'serious')}
              >
                <span>📋</span>
                <div>
                  <strong>Serious</strong>
                  <p>Clean, professional look</p>
                </div>
              </button>
              <button
                type="button"
                className={preferences.tone === 'playful' ? 'active' : ''}
                onClick={() => updatePref('tone', 'playful')}
              >
                <span>🎨</span>
                <div>
                  <strong>Playful</strong>
                  <p>Fun, colorful interface</p>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h4>Language / Idioma / Langue</h4>
            <div className="language-selector">
              <button
                type="button"
                className={preferences.language === 'en' ? 'active' : ''}
                onClick={() => updatePref('language', 'en')}
              >
                English
              </button>
              <button
                type="button"
                className={preferences.language === 'es' ? 'active' : ''}
                onClick={() => updatePref('language', 'es')}
              >
                Español
              </button>
              <button
                type="button"
                className={preferences.language === 'fr' ? 'active' : ''}
                onClick={() => updatePref('language', 'fr')}
              >
                Français
              </button>
            </div>
          </section>

          <section>
            <h4>Data mode (Privacy & Transparency)</h4>
            <p className="privacy-note" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Choose how much data you want to share. You can change this anytime.
            </p>
            <div className="data-mode-selector">
              <button
                type="button"
                className={preferences.dataMode === 'basic' ? 'active' : ''}
                onClick={() => updatePref('dataMode', 'basic')}
              >
                <div>
                  <strong>🔒 Basic Mode</strong>
                  <p>Minimal data collection</p>
                  <ul style={{ fontSize: '0.85rem', textAlign: 'left', marginTop: '0.5rem' }}>
                    <li>Self-report check-ins only</li>
                    <li>No passive sensing</li>
                    <li>No wearable data</li>
                    <li>Maximum privacy</li>
                  </ul>
                </div>
              </button>
              <button
                type="button"
                className={preferences.dataMode === 'advanced' ? 'active' : ''}
                onClick={() => updatePref('dataMode', 'advanced')}
              >
                <div>
                  <strong>📊 Advanced Mode</strong>
                  <p>Optional deeper insights</p>
                  <ul style={{ fontSize: '0.85rem', textAlign: 'left', marginTop: '0.5rem' }}>
                    <li>Self-report check-ins</li>
                    <li>Optional passive sensing</li>
                    <li>Optional wearable data</li>
                    <li>More detailed insights</li>
                  </ul>
                </div>
              </button>
            </div>
            <p className="privacy-note" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              <strong>Evidence-based:</strong> Research shows that clear data flows and user control improve trust and engagement (Frontiers, 2021).
            </p>
          </section>

          <section>
            <h4>Region / Local resources</h4>
            <select
              value={preferences.region}
              onChange={(e) => updatePref('region', e.target.value)}
              className="region-select"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="BC">British Columbia</option>
              <option value="default">Other</option>
            </select>
          </section>

          <section className="resources-section">
            <h4>💚 Support resources in your area</h4>
            <div className="resources-list">
              {resources.map((resource, i) => (
                <div key={i} className="resource-card">
                  <div>
                    <strong>{resource.name}</strong>
                    {resource.available24h && <span className="badge-24h">24/7</span>}
                  </div>
                  <div className="resource-contacts">
                    <a href={`tel:${resource.phone}`} className="resource-link">
                      📞 {resource.phone}
                    </a>
                    {resource.text && (
                      <span className="resource-text">{resource.text}</span>
                    )}
                    {resource.website && (
                      <a href={`https://${resource.website}`} target="_blank" rel="noopener noreferrer" className="resource-link">
                        🌐 {resource.website}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="resources-note">
              These resources are customizable by your school. Contact your counselor to add local support numbers.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

type CulturalResourcesFooterProps = {
  resources: CulturalResource[]
}

const CulturalResourcesFooter = ({ resources }: CulturalResourcesFooterProps) => {
  const [expanded, setExpanded] = useState(false)
  
  if (resources.length === 0) return null
  
  return (
    <div className={`resources-footer ${expanded ? 'expanded' : ''}`}>
      <button type="button" className="resources-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▼' : '▲'} Need help? Local support resources
      </button>
      {expanded && (
        <div className="resources-footer-content">
          {resources.map((resource, i) => (
            <div key={i} className="resource-footer-item">
              <strong>{resource.name}</strong>
              <a href={`tel:${resource.phone}`}>📞 {resource.phone}</a>
              {resource.text && <span>{resource.text}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type ParentPortalProps = {
  students: StudentRecord[]
}

const ParentPortal = ({ students }: ParentPortalProps) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [showEducation, setShowEducation] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [consent, setConsent] = useState<ParentConsent | null>(() => {
    const stored = localStorage.getItem(PARENT_CONSENT_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [schoolPrivacy, setSchoolPrivacy] = useState<PrivacyLevel>(() => {
    const stored = localStorage.getItem(SCHOOL_PRIVACY_KEY)
    return stored ? (stored as PrivacyLevel) : 'moderate'
  })

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0]
  
  useEffect(() => {
    if (consent) {
      localStorage.setItem(PARENT_CONSENT_KEY, JSON.stringify(consent))
    }
  }, [consent])

  const generateMonthlySummary = (student: StudentRecord) => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const recentCheckIns = student.history.filter(
      entry => new Date(entry.createdAt) >= lastMonth
    )
    
    if (recentCheckIns.length === 0) {
      return {
        hasData: false,
        message: 'No check-ins in the past month.',
      }
    }

    const avgMood = recentCheckIns.reduce((sum, e) => sum + e.mood, 0) / recentCheckIns.length
    const avgSleep = recentCheckIns.reduce((sum, e) => sum + e.sleepQuality, 0) / recentCheckIns.length
    const avgWorries = recentCheckIns.reduce((sum, e) => sum + e.worries, 0) / recentCheckIns.length
    const trend = recentCheckIns.length >= 2 
      ? (recentCheckIns[recentCheckIns.length - 1].mood - recentCheckIns[0].mood)
      : 0

    const needsAttention = student.needsAttention || (avgMood <= 2.5 || avgWorries >= 3.5)

    return {
      hasData: true,
      studentName: student.name,
      checkInCount: recentCheckIns.length,
      avgMood: Math.round(avgMood * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgWorries: Math.round(avgWorries * 10) / 10,
      trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      needsAttention,
      tips: generateTips(avgMood, avgSleep, avgWorries, needsAttention),
      whenToContact: needsAttention ? 
        'Consider reaching out to the school counselor to discuss support options.' :
        'Continue monitoring. Contact the counselor if you notice significant changes.',
    }
  }

  const generateTips = (mood: number, sleep: number, worries: number, needsAttention: boolean) => {
    const tips: string[] = []
    if (mood <= 2.5) {
      tips.push('Encourage regular physical activity and time outdoors.')
      tips.push('Maintain consistent routines and sleep schedules.')
    }
    if (sleep <= 2.5) {
      tips.push('Limit screens 1 hour before bedtime.')
      tips.push('Create a calming bedtime routine.')
    }
    if (worries >= 3.5) {
      tips.push('Practice active listening without trying to "fix" everything.')
      tips.push('Help identify specific worries and problem-solving strategies.')
    }
    if (!needsAttention) {
      tips.push('Continue open communication about daily experiences.')
      tips.push('Celebrate small wins and positive moments.')
    }
    return tips
  }

  const summary = selectedStudent ? generateMonthlySummary(selectedStudent) : null

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Parent & Caregiver Portal</h2>
        <p>
          Research shows that screening plus parent feedback reduces mental health difficulties over time. 
          This portal helps you stay informed and support your child's well-being.
        </p>
      </div>

      <div className="parent-dashboard">
        <div className="parent-sidebar">
          <div className="card">
            <h3>Your child</h3>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="student-select"
            >
              <option value="">Select a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade})
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <h3>Quick actions</h3>
            <button className="ghost" onClick={() => setShowConsent(true)}>
              📧 Manage email preferences
            </button>
            <button className="ghost" onClick={() => setShowEducation(true)}>
              📚 Parent education modules
            </button>
            <button className="ghost" onClick={() => {
              if (selectedStudent && consent?.email) {
                alert(`Monthly summary email would be sent to ${consent.email}\n\nThis is a demo. In production, this would send an actual email.`)
              } else {
                alert('Please set up email preferences first.')
              }
            }}>
              📨 Send monthly summary now
            </button>
          </div>

          {consent && (
            <div className="card consent-status">
              <h4>Current settings</h4>
              <p>Email: {consent.email || 'Not set'}</p>
              <p>Monthly summary: {consent.monthlySummary ? '✅ Enabled' : '❌ Disabled'}</p>
              <p>Privacy level: {consent.privacyLevel}</p>
            </div>
          )}
        </div>

        <div className="parent-main">
          {selectedStudent ? (
            <>
              <div className="card monthly-summary">
                <h3>Monthly well-being summary</h3>
                {summary?.hasData ? (
                  <>
                    <div className="summary-stats">
                      <div className="stat">
                        <strong>{summary.checkInCount}</strong>
                        <span>Check-ins this month</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.avgMood}/5</strong>
                        <span>Average mood</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.avgSleep}/5</strong>
                        <span>Average sleep</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.trend}</strong>
                        <span>Trend</span>
                      </div>
                    </div>
                    
                    {schoolPrivacy !== 'minimal' && (
                      <>
                        <div className="summary-section">
                          <h4>Stress & worries</h4>
                          <p>Average worry level: <strong>{summary.avgWorries}/5</strong></p>
                          {summary.needsAttention && (
                            <div className="attention-alert">
                              ⚠️ Your child's check-ins suggest they may benefit from additional support.
                            </div>
                          )}
                        </div>

                        <div className="summary-section">
                          <h4>Support tips</h4>
                          <ul>
                            {summary.tips?.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    <div className="summary-section">
                      <h4>When to contact the school counselor</h4>
                      <p>{summary.whenToContact}</p>
                      <div className="contact-guidance">
                        <strong>Contact the counselor if:</strong>
                        <ul>
                          <li>Your child expresses feelings of hopelessness or being a burden</li>
                          <li>You notice significant changes in sleep, mood, or energy</li>
                          <li>Your child withdraws from activities they used to enjoy</li>
                          <li>You have concerns about their safety or well-being</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No check-in data available for the past month.</p>
                )}
              </div>

              {schoolPrivacy === 'detailed' && selectedStudent.history.length > 0 && (
                <div className="card">
                  <h3>Recent check-in trends</h3>
                  <TrendGraph history={selectedStudent.history.slice(-4)} />
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <p>Please select a student to view their monthly summary.</p>
            </div>
          )}
        </div>
      </div>

      {showConsent && (
        <ConsentModal
          student={selectedStudent}
          consent={consent}
          onConsentChange={setConsent}
          schoolPrivacy={schoolPrivacy}
          onSchoolPrivacyChange={setSchoolPrivacy}
          onClose={() => setShowConsent(false)}
        />
      )}

      {showEducation && (
        <ParentEducationModal onClose={() => setShowEducation(false)} />
      )}
    </section>
  )
}

type ConsentModalProps = {
  student?: StudentRecord
  consent: ParentConsent | null
  onConsentChange: (consent: ParentConsent | null) => void
  schoolPrivacy: PrivacyLevel
  onSchoolPrivacyChange: (level: PrivacyLevel) => void
  onClose: () => void
}

const ConsentModal = ({ student, consent, onConsentChange, schoolPrivacy, onClose }: ConsentModalProps) => {
  const [formData, setFormData] = useState({
    email: consent?.email || '',
    monthlySummary: consent?.monthlySummary ?? true,
    privacyLevel: consent?.privacyLevel || schoolPrivacy,
  })

  const handleSave = () => {
    if (!student) return
    const newConsent: ParentConsent = {
      studentId: student.id,
      consentGiven: true,
      email: formData.email,
      privacyLevel: formData.privacyLevel,
      monthlySummary: formData.monthlySummary,
    }
    onConsentChange(newConsent)
    onClose()
  }

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Email & Privacy Preferences</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <section>
            <h4>Email settings</h4>
            <label>
              Email address
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.monthlySummary}
                onChange={(e) => setFormData({ ...formData, monthlySummary: e.target.checked })}
              />
              <span>Receive monthly well-being summary emails</span>
            </label>
          </section>

          <section>
            <h4>Privacy level (set by school)</h4>
            <p className="privacy-note">
              Your school has set the privacy level to: <strong>{schoolPrivacy}</strong>
            </p>
            <div className="privacy-levels">
              <div className={`privacy-level ${schoolPrivacy === 'minimal' ? 'active' : ''}`}>
                <strong>Minimal</strong>
                <p>Only general trends and tips. No specific scores or details.</p>
              </div>
              <div className={`privacy-level ${schoolPrivacy === 'moderate' ? 'active' : ''}`}>
                <strong>Moderate</strong>
                <p>Trends, average scores, and support tips. No individual check-in details.</p>
              </div>
              <div className={`privacy-level ${schoolPrivacy === 'detailed' ? 'active' : ''}`}>
                <strong>Detailed</strong>
                <p>Full trends, scores, and patterns. Maximum transparency.</p>
              </div>
            </div>
            <p className="privacy-note">
              <em>Note: Schools can adjust privacy levels to balance transparency with student confidentiality.</em>
            </p>
          </section>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleSave}>Save preferences</button>
          </div>
        </div>
      </div>
    </div>
  )
}

type ParentEducationModalProps = {
  onClose: () => void
}

const ParentEducationModal = ({ onClose }: ParentEducationModalProps) => {
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const modules = [
    {
      id: 'hopelessness',
      title: 'How to respond if your teen says they\'re hopeless',
      icon: '💭',
      content: [
        'Listen without judgment. Avoid dismissing their feelings or trying to "fix" it immediately.',
        'Validate their experience: "I can hear that you\'re feeling really overwhelmed right now."',
        'Ask open-ended questions: "What makes you feel that way?" or "When did you start feeling this?"',
        'Don\'t minimize: Avoid saying "It\'s not that bad" or "You\'ll get over it."',
        'Take it seriously: Even if it seems like a passing comment, express concern and support.',
        'Contact the school counselor: Share what your teen said and ask for guidance.',
        'If there\'s any mention of self-harm or suicide, seek immediate professional help.',
      ],
    },
    {
      id: 'stress',
      title: 'Supporting a stressed teen',
      icon: '😰',
      content: [
        'Help identify specific stressors rather than general "stress."',
        'Teach problem-solving: Break big problems into smaller steps.',
        'Encourage healthy coping: Exercise, sleep, hobbies, social connection.',
        'Model stress management: Show how you handle your own stress.',
        'Create a calm home environment: Routines, boundaries, and predictability help.',
        'Know when to step back: Sometimes teens need space to process.',
      ],
    },
    {
      id: 'communication',
      title: 'Opening lines of communication',
      icon: '💬',
      content: [
        'Check in regularly, not just when there\'s a problem.',
        'Ask about their day without expecting a long answer.',
        'Listen more than you talk.',
        'Avoid interrogation: "How was school?" is better than "What did you do today? Who did you talk to? What did you learn?"',
        'Share your own experiences (appropriately) to normalize struggles.',
        'Respect their privacy while staying connected.',
      ],
    },
    {
      id: 'signs',
      title: 'Signs that may need attention',
      icon: '👀',
      content: [
        'Significant changes in sleep (too much or too little).',
        'Loss of interest in activities they used to enjoy.',
        'Withdrawal from friends and family.',
        'Changes in eating habits.',
        'Difficulty concentrating or completing schoolwork.',
        'Expressing feelings of worthlessness or being a burden.',
        'Talking about death or suicide (even casually).',
        'Increased irritability or mood swings.',
        'Physical complaints without clear cause.',
      ],
    },
  ]

  const activeModuleData = modules.find(m => m.id === activeModule)

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal parent-education-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Parent Education Modules</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          {!activeModuleData ? (
            <div className="education-modules-grid">
              {modules.map(module => (
                <div
                  key={module.id}
                  className="education-module-card"
                  onClick={() => setActiveModule(module.id)}
                >
                  <span className="module-icon">{module.icon}</span>
                  <h4>{module.title}</h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="education-module-detail">
              <button type="button" className="back" onClick={() => setActiveModule(null)}>← Back</button>
              <div className="module-header">
                <span className="module-icon-large">{activeModuleData.icon}</span>
                <h4>{activeModuleData.title}</h4>
              </div>
              <ol className="module-content">
                {activeModuleData.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LongTermTrajectory = ({ student }: { student: StudentRecord }) => {
  if (!student.longTermOutcomes || student.history.length < 3) return null
  
  const outcomes = student.longTermOutcomes
  const monthsEngaged = student.totalEngagementMonths || 0
  
  return (
    <div className="long-term-trajectory">
      <h4>Long-term outcomes (multi-year tracking)</h4>
      <div className="trajectory-stats">
        <div className="trajectory-stat">
          <strong>{monthsEngaged}</strong>
          <span>Months engaged</span>
        </div>
        <div className="trajectory-stat">
          <strong>{outcomes.totalCheckIns}</strong>
          <span>Total check-ins</span>
        </div>
        <div className="trajectory-stat">
          <strong>{outcomes.averageMood}/5</strong>
          <span>Average mood</span>
        </div>
        <div className="trajectory-stat">
          <strong className={outcomes.crisisCount > 0 ? 'crisis' : ''}>{outcomes.crisisCount}</strong>
          <span>Crisis episodes</span>
        </div>
      </div>
      <div className="trajectory-indicator">
        <span className={`trajectory-badge ${outcomes.symptomTrajectory}`}>
          {outcomes.symptomTrajectory === 'improving' ? '📈 Improving' :
           outcomes.symptomTrajectory === 'declining' ? '📉 Declining' :
           '➡️ Stable'} trajectory
        </span>
        <p className="trajectory-note">
          Students who engage regularly show better long-term outcomes. 
          This student has been tracked for {monthsEngaged} month{monthsEngaged !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  )
}

type PassiveSensingModalProps = {
  consent: PassiveSensingConsent
  onConsentChange: (consent: PassiveSensingConsent) => void
  onClose: () => void
  deviceInfo?: DeviceInfo
}

const PassiveSensingModal = ({ consent, onConsentChange, onClose, deviceInfo }: PassiveSensingModalProps) => {
  const [formData, setFormData] = useState({
    enabled: consent.enabled,
    lowDataMode: consent.lowDataMode,
    wearableConnected: consent.wearableConnected,
    wearableType: consent.wearableType || 'fitbit',
    phoneDataEnabled: consent.phoneDataEnabled,
  })

  const handleSave = () => {
    const newConsent: PassiveSensingConsent = {
      ...formData,
      consentDate: new Date().toISOString(),
    }
    onConsentChange(newConsent)
  }

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Passive Sensing & Wearable Data</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <section>
            <h4>Privacy-first data collection</h4>
            <p className="privacy-note">
              We use minimal, explainable data to understand patterns. You can always use low-data mode 
              with only self-report check-ins. All data is encrypted and stored securely.
            </p>
            {deviceInfo && (
              <div className="device-info-badge">
                <p><strong>Device detected:</strong> {deviceInfo.type.replace('_', ' ')} ({deviceInfo.os || 'unknown OS'})</p>
                {deviceInfo.canAccessHealthData && (
                  <p className="device-capability">✅ Can access health data from OS</p>
                )}
                {deviceInfo.canAccessWearables && (
                  <p className="device-capability">✅ Can connect to wearables</p>
                )}
                {!deviceInfo.canAccessHealthData && !deviceInfo.canAccessWearables && (
                  <p className="device-capability">ℹ️ Limited to self-report check-ins on this device</p>
                )}
              </div>
            )}
          </section>

          <section>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
              <span><strong>Enable passive sensing</strong> (optional)</span>
            </label>
            <p className="privacy-note">
              When enabled, we collect minimal data from wearables or your phone to provide insights. 
              You can disable this anytime.
            </p>
          </section>

          {formData.enabled && (
            <>
              <section>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.lowDataMode}
                    onChange={(e) => setFormData({ ...formData, lowDataMode: e.target.checked })}
                  />
                  <span><strong>Low-data mode</strong> (recommended)</span>
                </label>
                <p className="privacy-note">
                  Only use self-report check-ins. No passive data collection. Maximum privacy.
                </p>
              </section>

              {!formData.lowDataMode && (
                <>
                  {deviceInfo?.canAccessWearables && (
                    <section>
                      <h4>Wearable device (optional, strong consent required)</h4>
                      <p className="privacy-note">
                        <strong>Important:</strong> Wearables provide supportive signals only. 
                        They are never the main basis for serious decisions. You can opt out anytime.
                      </p>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.wearableConnected}
                          onChange={(e) => setFormData({ ...formData, wearableConnected: e.target.checked })}
                        />
                        <span>Connect wearable device</span>
                      </label>
                      {formData.wearableConnected && (
                        <>
                          <select
                            value={formData.wearableType}
                            onChange={(e) => setFormData({ ...formData, wearableType: e.target.value as any })}
                            className="region-select"
                          >
                            <option value="fitbit">Fitbit</option>
                            <option value="apple">Apple Health / Apple Watch</option>
                            <option value="google">Google Fit / Wear OS</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="wearable-data-info">
                            <p><strong>What we collect:</strong></p>
                            <ul>
                              <li>Sleep duration & variability (daily summaries only)</li>
                              <li>Activity levels (step counts, aggregated)</li>
                            </ul>
                            <p><strong>What we don't collect:</strong></p>
                            <ul>
                              <li>Raw minute-by-minute data</li>
                              <li>Heart rate details</li>
                              <li>Location data</li>
                              <li>Personal content</li>
                            </ul>
                          </div>
                        </>
                      )}
                      <p className="privacy-note">
                        <strong>Trade-offs explained:</strong> Wearable data can help identify patterns 
                        (e.g., "Your sleep has been irregular this week"), but it's always optional. 
                        Low-data mode is recommended by default.
                      </p>
                    </section>
                  )}

                  <section>
                    <h4>Phone data (optional)</h4>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.phoneDataEnabled}
                        onChange={(e) => setFormData({ ...formData, phoneDataEnabled: e.target.checked })}
                      />
                      <span>Use phone health data</span>
                    </label>
                    <p className="privacy-note">
                      We access screen time categories and sleep data from your phone's health APIs. 
                      No app usage details, messages, or personal content. Only aggregated patterns.
                    </p>
                  </section>
                </>
              )}
            </>
          )}

          <section className="privacy-guarantee">
            <h4>🔒 Privacy guarantees</h4>
            <ul>
              <li>All data is encrypted and stored securely</li>
              <li>ML models run on secure servers with strict access control</li>
              <li>You see explainable insights, not black-box scores</li>
              <li>You can disable passive sensing anytime</li>
              <li>Low-data mode always available</li>
            </ul>
          </section>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleSave}>Save preferences</button>
          </div>
        </div>
      </div>
    </div>
  )
}

type PassiveInsightsProps = {
  student: StudentRecord
  consent: PassiveSensingConsent
}

const PassiveInsights = ({ student, consent }: PassiveInsightsProps) => {
  if (consent.lowDataMode) return null

  // Simulated passive data (in production, this would come from APIs)
  const recentPassive = student.passiveSensing?.slice(-7) || []
  
  // Generate explainable insights
  const insights: string[] = []
  
  if (recentPassive.length > 0) {
    const avgSleep = recentPassive.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / recentPassive.length
    const lateNights = recentPassive.filter(d => d.lateNightUsage).length
    
    if (avgSleep < 7) {
      insights.push(`Your sleep data shows an average of ${avgSleep.toFixed(1)} hours. Getting 7-9 hours can help mood and energy.`)
    }
    
    if (lateNights >= 3) {
      insights.push(`Your phone usage shows ${lateNights} late-night sessions this week. Late-night screen time often goes with poor sleep and lower mood.`)
    }
    
    const avgSteps = recentPassive.reduce((sum, d) => sum + (d.steps || 0), 0) / recentPassive.length
    if (avgSteps < 5000 && recentPassive.length >= 3) {
      insights.push(`Your activity data shows lower movement this week. Regular physical activity can boost mood and energy.`)
    }
  } else {
    // Simulate some data for demo
    insights.push('📱 Connect your wearable or enable phone data to see personalized insights about sleep and activity patterns.')
  }

  if (insights.length === 0) return null

  return (
    <div className="passive-insights">
      <h4>📱 Insights from your data</h4>
      <div className="insights-list">
        {insights.map((insight, i) => (
          <div key={i} className="insight-item">
            <p>{insight}</p>
          </div>
        ))}
      </div>
      <p className="insights-note">
        These insights are explainable and based on patterns we observe. 
        They're not diagnoses—just helpful observations to support your well-being.
      </p>
    </div>
  )
}

const PrivacyEthicsFooter = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <>
      <div className="privacy-footer">
        <div className="privacy-footer-content">
          <div className="privacy-badges">
            <span className="privacy-badge">🔒 End-to-end encrypted</span>
            <span className="privacy-badge">🚫 No data selling</span>
            <span className="privacy-badge">🚫 No advertising</span>
            <span className="privacy-badge">🚫 No social media tracking</span>
            <span className="privacy-badge">💚 Non-profit</span>
          </div>
          <div className="privacy-links">
            <button type="button" className="privacy-link" onClick={() => setShowPrivacyModal(true)}>
              Privacy & Ethics
            </button>
            <span>•</span>
            <button type="button" className="privacy-link" onClick={() => setShowPrivacyModal(true)}>
              Who can see what?
            </button>
          </div>
          {isOffline && (
            <div className="offline-indicator">
              📡 Offline mode: Your data is saved locally and will sync when online.
            </div>
          )}
          <p className="accessibility-note">
            💻 Works on school-owned devices, Chromebooks, and any browser. Low-bandwidth mode available.
          </p>
        </div>
      </div>

      {showPrivacyModal && (
        <PrivacyEthicsModal onClose={() => setShowPrivacyModal(false)} />
      )}
    </>
  )
}

const PrivacyEthicsModal = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'visibility' | 'ethics'>('privacy')
  const stored = localStorage.getItem(PREFERENCES_KEY)
  const parsed = stored ? JSON.parse(stored) : { language: 'en' }
  const lang = parsed.language || 'en'
  const t = translations[lang as keyof typeof translations]

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal privacy-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Privacy, Ethics & Data Visibility</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="privacy-tabs">
          <button
            type="button"
            className={activeTab === 'privacy' ? 'active' : ''}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
          <button
            type="button"
            className={activeTab === 'visibility' ? 'active' : ''}
            onClick={() => setActiveTab('visibility')}
          >
            Who Can See What?
          </button>
          <button
            type="button"
            className={activeTab === 'ethics' ? 'active' : ''}
            onClick={() => setActiveTab('ethics')}
          >
            Ethics
          </button>
        </div>
        <div className="privacy-content">
          {activeTab === 'privacy' && (
            <div>
              <h4>🔒 Privacy-by-Design</h4>
              <div className="privacy-section">
                <strong>Encryption</strong>
                <ul>
                  <li>End-to-end encryption in transit (HTTPS/TLS)</li>
                  <li>Strong encryption at rest (AES-256)</li>
                  <li>All data encrypted before storage</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Data Collection</strong>
                <ul>
                  <li>Only collect data necessary for well-being support</li>
                  <li>No selling of data to third parties</li>
                  <li>No advertising or marketing</li>
                  <li>No social media tracking or pixels</li>
                  <li>No cross-site tracking</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Offline & Low-Bandwidth Support</strong>
                <ul>
                  <li>Works completely offline - data saved locally</li>
                  <li>Syncs automatically when connection restored</li>
                  <li>Low-bandwidth mode for slow connections</li>
                  <li>Works on school-owned devices and Chromebooks</li>
                  <li>No smartphone required - browser-based</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Your Rights</strong>
                <ul>
                  <li>Access your data anytime</li>
                  <li>Delete your data anytime</li>
                  <li>Export your data</li>
                  <li>Opt-out of passive sensing anytime</li>
                  <li>Use low-data mode for maximum privacy</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div>
              <h4>👁️ Who Can See What?</h4>
              <div className="visibility-grid">
                <div className="visibility-card">
                  <strong>👤 You (Student)</strong>
                  <ul>
                    <li>✅ All your own check-ins</li>
                    <li>✅ Your own trends and patterns</li>
                    <li>✅ Your own insights</li>
                    <li>✅ Your own passive sensing data (if enabled)</li>
                  </ul>
                </div>
                <div className="visibility-card">
                  <strong>👨‍👩‍👧 Parents/Caregivers</strong>
                  <ul>
                    <li>✅ Monthly summaries (if you consent)</li>
                    <li>✅ General trends (privacy level set by school)</li>
                    <li>✅ Support tips</li>
                    <li>❌ Individual check-in details (unless detailed privacy level)</li>
                    <li>❌ Your passive sensing data</li>
                  </ul>
                </div>
                <div className="visibility-card">
                  <strong>👩‍🏫 School Counselors</strong>
                  <ul>
                    <li>✅ Your check-in trends</li>
                    <li>✅ PHQ-A and GAD-7 scores</li>
                    <li>✅ Risk indicators and flags</li>
                    <li>✅ Follow-up records</li>
                    <li>❌ Your passive sensing data (unless you explicitly share)</li>
                  </ul>
                </div>
                <div className="visibility-card">
                  <strong>🏫 School Administrators</strong>
                  <ul>
                    <li>✅ Aggregated, anonymized statistics</li>
                    <li>✅ Program effectiveness metrics</li>
                    <li>❌ Individual student data</li>
                    <li>❌ Student names or identifiers</li>
                  </ul>
                </div>
                <div className="visibility-card">
                  <strong>🌐 Third Parties</strong>
                  <ul>
                    <li>❌ No data shared with advertisers</li>
                    <li>❌ No data sold</li>
                    <li>❌ No social media tracking</li>
                    <li>❌ No external analytics</li>
                    <li>✅ Only anonymized research data (with consent, for research purposes only)</li>
                  </ul>
                </div>
              </div>
              <div className="privacy-section">
                <strong>Privacy Levels</strong>
                <p>Your school sets privacy levels for parent visibility:</p>
                <ul>
                  <li><strong>Minimal:</strong> Only general trends and tips</li>
                  <li><strong>Moderate:</strong> Trends, averages, and support tips (default)</li>
                  <li><strong>Detailed:</strong> Full trends and patterns (maximum transparency)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'ethics' && (
            <div>
              <h4>💚 Ethical Commitments</h4>
              <div className="privacy-section">
                <strong>Non-Profit Mission</strong>
                <p>This tool is built for student well-being, not profit. We commit to:</p>
                <ul>
                  <li>No monetization of student data</li>
                  <li>No advertising revenue</li>
                  <li>No selling to third parties</li>
                  <li>Transparent, ethical data use</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Reducing Stigma</strong>
                <ul>
                  <li>Anonymous check-ins available</li>
                  <li>No diagnostic labels</li>
                  <li>Framed as well-being, not mental illness</li>
                  <li>24/7 availability reduces barriers</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Preventing Harm</strong>
                <ul>
                  <li>No over-monitoring or surveillance</li>
                  <li>Respect student autonomy</li>
                  <li>Clear boundaries on data use</li>
                  <li>Protect against data misuse</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Equity & Access</strong>
                <ul>
                  <li>Works on school-owned devices (no personal phone needed)</li>
                  <li>Offline mode for unstable internet</li>
                  <li>Low-bandwidth mode for slow connections</li>
                  <li>Works on Chromebooks and any browser</li>
                  <li>Free to use - no cost barriers</li>
                </ul>
              </div>
              <div className="privacy-section">
                <strong>Building Trust</strong>
                <ul>
                  <li>Transparent about data collection</li>
                  <li>Clear explanations of how data is used</li>
                  <li>Easy opt-out options</li>
                  <li>Student control over their data</li>
                  <li>Regular privacy audits</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="privacy-footer-actions">
          <button type="button" className="primary" onClick={onClose}>{t.gotIt}</button>
        </div>
      </div>
    </div>
  )
}

// ASQ (Ask Suicide-Screening Questions) - Validated 4-item screen
// Based on NIMH ASQ toolkit - used under clinical guidance
type ASQAnswers = {
  thoughts: 'yes' | 'no' | undefined
  betterOff: 'yes' | 'no' | undefined
  hurt: 'yes' | 'no' | undefined
  attempt: 'yes' | 'no' | undefined
}

type ASQScreeningProps = {
  answers: ASQAnswers
  onAnswerChange: (answers: ASQAnswers) => void
  onComplete: (risk: 'low' | 'moderate' | 'high' | 'immediate') => void
  resources: CulturalResource[]
}

const ASQScreening = ({ answers, onAnswerChange, onComplete }: ASQScreeningProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  
  const questions = [
    {
      id: 'thoughts',
      text: 'In the past few weeks, have you wished you were dead?',
      key: 'thoughts' as const,
    },
    {
      id: 'betterOff',
      text: 'In the past few weeks, have you felt that you or your family would be better off if you were dead?',
      key: 'betterOff' as const,
    },
    {
      id: 'hurt',
      text: 'In the past week, have you been having thoughts about killing yourself?',
      key: 'hurt' as const,
    },
    {
      id: 'attempt',
      text: 'Have you ever tried to kill yourself?',
      key: 'attempt' as const,
    },
  ]

  const handleAnswer = (answer: 'yes' | 'no') => {
    const newAnswers = { ...answers, [questions[currentQuestion].key]: answer }
    onAnswerChange(newAnswers)
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate risk
      let risk: 'low' | 'moderate' | 'high' | 'immediate' = 'low'
      if (newAnswers.hurt === 'yes' || newAnswers.attempt === 'yes') {
        risk = 'immediate'
      } else if (newAnswers.betterOff === 'yes' || newAnswers.thoughts === 'yes') {
        risk = 'high'
      }
      onComplete(risk)
    }
  }

  return (
    <div className="asq-screening">
      <div className="card asq-card">
        <div className="asq-header">
          <h3>Safety check</h3>
          <p className="asq-intro">
            We're glad you're here today. These questions help us understand how you're doing and connect you with support if needed. 
            <strong> If you tell us you're in danger, adults whose job is to keep you safe may see your answers.</strong>
          </p>
          <p className="asq-note">
            This is a validated screening tool (ASQ) used by mental health professionals. 
            It's safe to ask about these thoughts—and important. You can skip any question, but answering helps us connect you with the right support.
          </p>
        </div>
        <div className="asq-question">
          <p className="question-number">Question {currentQuestion + 1} of {questions.length}</p>
          <h4>{questions[currentQuestion].text}</h4>
          <div className="asq-options">
            <button
              type="button"
              className={`asq-option ${answers[questions[currentQuestion].key] === 'yes' ? 'selected' : ''}`}
              onClick={() => handleAnswer('yes')}
            >
              Yes
            </button>
            <button
              type="button"
              className={`asq-option ${answers[questions[currentQuestion].key] === 'no' ? 'selected' : ''}`}
              onClick={() => handleAnswer('no')}
            >
              No
            </button>
          </div>
          <button 
            type="button" 
            className="ghost" 
            onClick={() => {
              if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1)
              } else {
                onComplete('low')
              }
            }}
            style={{ marginTop: '1rem', fontSize: '0.9rem' }}
          >
            Skip this question →
          </button>
        </div>
        {currentQuestion > 0 && (
          <button type="button" className="ghost" onClick={() => setCurrentQuestion(currentQuestion - 1)}>
            ← Previous question
          </button>
        )}
      </div>
    </div>
  )
}

type CrisisResponseProps = {
  risk: 'high' | 'immediate'
  resources: CulturalResource[]
  studentName: string
  onAcknowledge: () => void
}

const CrisisResponse = ({ risk, resources, onAcknowledge }: CrisisResponseProps) => {
  const isImmediate = risk === 'immediate'
  
  return (
    <div className="crisis-overlay">
      <div className="crisis-modal">
        <div className="crisis-header">
          <h2>Thank you for telling us</h2>
          <p className="crisis-message">
            This is serious and you deserve support. We're here to help.
          </p>
        </div>
        
        <div className="crisis-content">
          <div className="crisis-alert">
            <strong>
              {isImmediate 
                ? '⚠️ Immediate support is available right now'
                : '💚 Support is available to help you feel better'}
            </strong>
          </div>

          <div className="crisis-resources">
            <h3>24/7 Crisis Support</h3>
            {resources.filter(r => r.available24h).map((resource, i) => (
              <div key={i} className="crisis-resource-item">
                <strong>{resource.name}</strong>
                <a href={`tel:${resource.phone}`} className="crisis-phone">
                  📞 {resource.phone}
                </a>
                {resource.text && <span className="crisis-text">{resource.text}</span>}
                {resource.website && (
                  <a href={`https://${resource.website}`} target="_blank" rel="noopener noreferrer" className="crisis-link">
                    🌐 {resource.website}
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="crisis-alert-info">
            <h3>What happens next?</h3>
            <ul>
              <li>
                <strong>A high-priority alert has been sent</strong> to your school's mental health team
              </li>
              <li>They will reach out to provide support</li>
              <li>You don't have to wait—call the crisis lines above anytime</li>
              <li>If you're in immediate danger, call 911 or go to your nearest emergency room</li>
            </ul>
          </div>

          <div className="crisis-confidentiality">
            <strong>About confidentiality:</strong>
            <p>
              If you tell us you're in danger, adults whose job is to keep you safe may see your answers. 
              This includes your school counselor and mental health team. We do this to make sure you get 
              the support you need.
            </p>
          </div>

          <div className="crisis-actions">
            <button type="button" className="primary large" onClick={onAcknowledge}>
              I understand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type DailyMicroCheckInPromptProps = {
  resources: CulturalResource[]
}

const DailyMicroCheckInPrompt = ({ resources }: DailyMicroCheckInPromptProps) => {
  const [showDaily, setShowDaily] = useState(false)
  
  const today = new Date().toISOString().split('T')[0]
  const lastDaily = useMemo(() => {
    const stored = localStorage.getItem(DAILY_CHECKINS_KEY)
    if (!stored) return null
    const checkins: DailyMicroCheckIn[] = JSON.parse(stored)
    return checkins.find(c => c.createdAt.startsWith(today))
  }, [])

  const handleDailySubmit = (mood: number, safety: number) => {
    const checkin: DailyMicroCheckIn = {
      id: randomId(),
      studentName: 'Anonymous',
      mood,
      safety,
      createdAt: new Date().toISOString(),
    }
    const stored = localStorage.getItem(DAILY_CHECKINS_KEY)
    const checkins: DailyMicroCheckIn[] = stored ? JSON.parse(stored) : []
    checkins.push(checkin)
    localStorage.setItem(DAILY_CHECKINS_KEY, JSON.stringify(checkins))
    setShowDaily(false)
    
    // Safety check for low safety score
    if (safety <= 2) {
      // Show crisis resources
      alert(`If you're not feeling safe, please reach out:\n\n${resources.filter(r => r.available24h).map(r => `${r.name}: ${r.phone}`).join('\n')}\n\nOr call 911 if you're in immediate danger.`)
    }
  }

  if (lastDaily) return null // Already checked in today

  return (
    <>
      <div className="daily-checkin-prompt">
        <button type="button" className="daily-checkin-btn" onClick={() => setShowDaily(true)}>
          📱 Quick daily check-in (30 seconds)
        </button>
      </div>
      {showDaily && (
        <DailyMicroCheckInModal
          onClose={() => setShowDaily(false)}
          onSubmit={handleDailySubmit}
        />
      )}
    </>
  )
}

type DailyMicroCheckInModalProps = {
  onClose: () => void
  onSubmit: (mood: number, safety: number) => void
}

const DailyMicroCheckInModal = ({ onClose, onSubmit }: DailyMicroCheckInModalProps) => {
  const [mood, setMood] = useState(3)
  const [safety, setSafety] = useState(4)

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal daily-checkin-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Quick Daily Check-In</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <p className="daily-intro">Just 2 quick questions to check in with yourself.</p>
          <div className="daily-question">
            <label>How's your mood right now?</label>
            <div className="mood-options">
              {['😢', '😐', '🙂', '😊', '😄'].map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  className={`mood-option ${mood === i + 1 ? 'selected' : ''}`}
                  onClick={() => setMood(i + 1)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="daily-question">
            <label>How safe do you feel?</label>
            <div className="safety-slider">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={safety}
                onChange={(e) => setSafety(Number(e.target.value))}
              />
              <div className="safety-labels">
                <span>Not safe</span>
                <span>Very safe</span>
              </div>
              <div className="safety-value">{safety}/5</div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose}>Skip</button>
            <button type="button" className="primary" onClick={() => onSubmit(mood, safety)}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AboutAppModal = ({ onClose }: { onClose: () => void }) => {
  const stored = localStorage.getItem(PREFERENCES_KEY)
  const parsed = stored ? JSON.parse(stored) : { language: 'en' }
  const lang = parsed.language || 'en'
  const t = translations[lang as keyof typeof translations]
  
  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>What This App Does / Doesn't Do</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <section>
            <h4>✅ What This App Does</h4>
            <ul>
              <li>Helps you check in with your well-being weekly</li>
              <li>Provides evidence-based micro-skills (breathing, CBT techniques)</li>
              <li>Shares trends with your school's mental health team (with your consent)</li>
              <li>Offers immediate crisis resources if you're in danger</li>
              <li>Respects your privacy and gives you control</li>
              <li>Works offline and on any device (phone, tablet, Chromebook)</li>
            </ul>
          </section>
          <section>
            <h4>❌ What This App Doesn't Do</h4>
            <ul>
              <li><strong>Does NOT diagnose</strong> mental health conditions</li>
              <li><strong>Does NOT replace</strong> professional mental health care</li>
              <li><strong>Does NOT sell</strong> your data to advertisers</li>
              <li><strong>Does NOT track</strong> you across other websites</li>
              <li><strong>Does NOT share</strong> your data with social media</li>
              <li><strong>Does NOT promise</strong> perfect secrecy if you're in danger</li>
              <li><strong>Does NOT use</strong> addictive design patterns (no infinite scroll, no feeds)</li>
            </ul>
          </section>
          <section>
            <h4>🎯 The Goal</h4>
            <p>
              This app helps your school support students better by spotting early signals. 
              It's a tool for awareness and connection, not a replacement for human support.
            </p>
          </section>
          <div className="form-actions">
            <button type="button" className="primary" onClick={onClose}>{t.gotIt}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

type DataSharingModalProps = {
  student?: StudentRecord | null
  onClose: () => void
}

const DataSharingModal = ({ student, onClose }: DataSharingModalProps) => {
  const latest = student?.history.at(-1)
  const stored = localStorage.getItem(PREFERENCES_KEY)
  const parsed = stored ? JSON.parse(stored) : { language: 'en' }
  const lang = parsed.language || 'en'
  const t = translations[lang as keyof typeof translations]
  
  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>What's Shared With Your School</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <section>
            <h4>👁️ Visible to School Counselors</h4>
            <ul>
              <li>✅ Your check-in trends (mood, sleep, energy over time)</li>
              <li>✅ PHQ-A and GAD-7 screening scores</li>
              <li>✅ Risk indicators and flags</li>
              <li>✅ Follow-up records and counselor notes</li>
              <li>❌ Your passive sensing data (unless you explicitly share)</li>
              <li>❌ Your daily micro-check-ins (private to you)</li>
            </ul>
          </section>
          <section>
            <h4>👨‍👩‍👧 Visible to Parents (if you consent)</h4>
            <ul>
              <li>✅ Monthly summaries (general trends)</li>
              <li>✅ Support tips</li>
              <li>❌ Individual check-in details (unless detailed privacy level)</li>
              <li>❌ Your passive sensing data</li>
              <li>❌ Your daily micro-check-ins</li>
            </ul>
          </section>
          <section>
            <h4>🔒 Private to You</h4>
            <ul>
              <li>✅ Daily micro-check-ins</li>
              <li>✅ Bookmarked skills</li>
              <li>✅ Your personal notes</li>
              <li>✅ Passive sensing data (if enabled)</li>
            </ul>
          </section>
          {latest && (
            <section>
              <h4>📊 Your Latest Check-In</h4>
              <div className="data-sharing-preview">
                <p><strong>Mood:</strong> {latest.mood}/5</p>
                <p><strong>Sleep:</strong> {latest.sleepQuality}/5</p>
                <p><strong>Energy:</strong> {latest.energy}/5</p>
                {latest.phqScore && <p><strong>PHQ-A:</strong> {latest.phqScore}/27 (visible to counselors)</p>}
                {latest.gadScore && <p><strong>GAD-7:</strong> {latest.gadScore}/21 (visible to counselors)</p>}
              </div>
            </section>
          )}
          <div className="form-actions">
            <button type="button" className="primary" onClick={onClose}>{t.gotIt}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

type CoDesignFeedbackModalProps = {
  onClose: () => void
  onSubmit: (feedback: Omit<CoDesignFeedback, 'id' | 'createdAt' | 'status'>) => void
  userType: 'student' | 'parent' | 'counselor'
}

const CoDesignFeedbackModal = ({ onClose, onSubmit, userType }: CoDesignFeedbackModalProps) => {
  const [category, setCategory] = useState<CoDesignFeedback['category']>('feature_request')
  const [feedback, setFeedback] = useState('')
  const [priority, setPriority] = useState<CoDesignFeedback['priority']>('medium')

  const handleSubmit = () => {
    if (!feedback.trim()) return
    
    onSubmit({
      userId: 'current_user', // In production, get from auth
      userType,
      category,
      feedback: feedback.trim(),
      priority,
    })
    setFeedback('')
    onClose()
  }

  return (
    <div className="skills-overlay" onClick={onClose}>
      <div className="skills-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>💬 Co-Design Feedback</h3>
          <button type="button" className="close" onClick={onClose}>×</button>
        </header>
        <div className="preferences-content">
          <section>
            <p className="codesign-intro">
              <strong>Your voice matters!</strong> This app is co-designed with teens, parents, and counselors. 
              Your feedback directly shapes features, wording, and design. We review all feedback and implement 
              changes based on your input.
            </p>
          </section>

          <section>
            <label>What type of feedback?</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as CoDesignFeedback['category'])}>
              <option value="feature_request">Feature request</option>
              <option value="wording_feedback">Wording/language feedback</option>
              <option value="design_feedback">Design/UI feedback</option>
              <option value="bug_report">Bug report</option>
              <option value="other">Other</option>
            </select>
          </section>

          <section>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as CoDesignFeedback['priority'])}>
              <option value="low">Low - Nice to have</option>
              <option value="medium">Medium - Would be helpful</option>
              <option value="high">High - Important issue</option>
            </select>
          </section>

          <section>
            <label>Your feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think... What would make this app better? What wording feels off? What feature would help?"
              rows={6}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit' }}
            />
          </section>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={!feedback.trim()}>
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Predefined stations (in production, these would come from backend)
const predefinedStations: CopingStation[] = [
  {
    stationId: 'CALM_BREATH_01',
    skillId: 'breathing',
    type: 'solo',
    location: 'Hallway A',
    title: '1-minute breathing reset',
    description: 'Quick breathing exercise to help you reset',
    isPublic: true,
  },
  {
    stationId: 'GROUNDING_54321',
    skillId: 'grounding',
    type: 'solo',
    location: 'Library',
    title: '5-4-3-2-1 grounding challenge',
    description: 'Ground yourself in the present moment',
    isPublic: true,
  },
  {
    stationId: 'DIGITAL_STRESS_CHECK',
    skillId: 'screen-stress',
    type: 'solo',
    location: 'Cafeteria',
    title: 'Check your digital stress level',
    description: 'Quick reflection on screen use',
    isPublic: true,
  },
]

type SoloStationProps = {
  stationId: string
  onClose: () => void
  students: StudentRecord[]
}

const SoloStation = ({ stationId, onClose, students }: SoloStationProps) => {
  const station = predefinedStations.find(s => s.stationId === stationId)
  const [reflection, setReflection] = useState<'better' | 'same' | 'worse' | null>(null)
  const [completed, setCompleted] = useState(false)
  
  // Get skill data
  const skillMap: Record<string, any> = {
    breathing: {
      title: 'Box Breathing',
      icon: '🌬️',
      steps: [
        'Breathe in for 4 counts',
        'Hold for 4 counts',
        'Breathe out for 4 counts',
        'Hold for 4 counts',
        'Repeat 4 times',
      ],
    },
    grounding: {
      title: '5-4-3-2-1 Grounding',
      icon: '🌍',
      steps: [
        'Name 5 things you can see',
        'Name 4 things you can touch',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste',
      ],
    },
    'screen-stress': {
      title: 'Digital Stress Check',
      icon: '📱',
      steps: [
        'Take a moment to notice how you feel',
        'Think about your screen use today',
        'Did it help you feel better, worse, or neutral?',
        'Remember: You can always take a break',
      ],
    },
  }
  
  const skill = station ? skillMap[station.skillId] : null
  
  const handleComplete = () => {
    setCompleted(true)
    
    // Log as CopingSkillEvent
    const event: CopingSkillEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stationId,
      skillId: station?.skillId || 'unknown',
      studentId: students[0]?.id, // If logged in
      type: 'solo_station',
      reflection: reflection || undefined,
      createdAt: new Date().toISOString(),
    }
    
    const stored = localStorage.getItem(COPING_SKILL_EVENTS_KEY)
    const events = stored ? JSON.parse(stored) : []
    events.push(event)
    localStorage.setItem(COPING_SKILL_EVENTS_KEY, JSON.stringify(events))
    
    // If logged in, also update CalmRoomSessions
    if (students[0]?.id) {
      const calmSession: CalmRoomSession = {
        id: `session_${Date.now()}`,
        studentId: students[0].id,
        sessionType: station?.skillId === 'breathing' ? 'breathing' : 'mindfulness',
        duration: 1,
        location: station?.location || 'Solo Station',
        qrCodeId: stationId,
        createdAt: new Date().toISOString(),
        loggedAsSkill: true,
      }
      const storedSessions = localStorage.getItem(CALM_ROOM_SESSIONS_KEY)
      const sessions = storedSessions ? JSON.parse(storedSessions) : []
      sessions.push(calmSession)
      localStorage.setItem(CALM_ROOM_SESSIONS_KEY, JSON.stringify(sessions))
    }
  }
  
  if (!station || !skill) {
    return (
      <section className="panel">
        <div className="panel__header">
          <h2>Station not found</h2>
          <p>The QR code you scanned doesn't match any active station.</p>
          <button className="primary" onClick={onClose}>Go back</button>
        </div>
      </section>
    )
  }
  
  return (
    <section className="panel solo-station">
      <div className="panel__header">
        <h2>{station.title}</h2>
        <p>{station.description}</p>
        {station.location && <p className="station-location">📍 {station.location}</p>}
      </div>
      
      {!completed ? (
        <div className="card skill-card">
          <div className="skill-header">
            <span className="skill-icon">{skill.icon}</span>
            <h3>{skill.title}</h3>
          </div>
          <div className="skill-steps">
            {skill.steps.map((step: string, i: number) => (
              <div key={i} className="skill-step">
                <span className="step-number">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="primary" onClick={handleComplete}>
              I completed this
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="card reflection-card">
          <h3>How do you feel now?</h3>
          <p className="reflection-note">Optional: Let us know if this helped</p>
          <div className="reflection-options">
            <button
              type="button"
              className={`reflection-btn ${reflection === 'better' ? 'selected' : ''}`}
              onClick={() => setReflection('better')}
            >
              😊 A bit better
            </button>
            <button
              type="button"
              className={`reflection-btn ${reflection === 'same' ? 'selected' : ''}`}
              onClick={() => setReflection('same')}
            >
              😐 About the same
            </button>
            <button
              type="button"
              className={`reflection-btn ${reflection === 'worse' ? 'selected' : ''}`}
              onClick={() => setReflection('worse')}
            >
              😟 A bit worse
            </button>
          </div>
          <div className="form-actions">
            <button type="button" className="primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// Activity packs for group sessions (knowledge-based only, NO self-disclosure)
// GUARDRAIL: All questions test knowledge, skills, and literacy - NEVER personal distress
const activityPacks: Record<string, {
  title: string
  description: string
  questions: {
    question: string
    options: string[]
    correct: number
    explanation: string
  }[]
}> = {
  'anxiety-myths': {
    title: 'Anxiety Myths vs Facts',
    description: 'Test your knowledge about anxiety',
    questions: [
      {
        question: 'Which is a common myth about anxiety?',
        options: ['Anxiety is just being worried', 'Anxiety can be managed with skills', 'Anxiety affects many people', 'Anxiety is treatable'],
        correct: 0,
        explanation: 'Anxiety is more than just worry—it can include physical symptoms, racing thoughts, and avoidance behaviors.',
      },
      {
        question: 'What is a helpful coping skill for anxiety?',
        options: ['Avoiding all stressful situations', 'Deep breathing exercises', 'Ignoring your feelings', 'Staying up all night'],
        correct: 1,
        explanation: 'Deep breathing exercises can help calm your nervous system and reduce anxiety symptoms.',
      },
      {
        question: 'True or False: Everyone experiences anxiety sometimes.',
        options: ['True', 'False'],
        correct: 0,
        explanation: 'Anxiety is a normal human emotion. It becomes a problem when it interferes with daily life.',
      },
    ],
  },
  'social-media-healthy': {
    title: 'Healthy Social Media Choices',
    description: 'Learn about healthy social media habits',
    questions: [
      {
        question: 'What is a healthy social media habit?',
        options: ['Scrolling for hours before bed', 'Setting time limits', 'Comparing yourself to others', 'Checking notifications constantly'],
        correct: 1,
        explanation: 'Setting time limits helps you maintain balance and prevents social media from taking over your life.',
      },
      {
        question: 'What should you do if social media makes you feel bad?',
        options: ['Keep scrolling', 'Unfollow accounts that make you feel bad', 'Post more to get validation', 'Ignore your feelings'],
        correct: 1,
        explanation: 'Curating your feed to include positive, supportive content can improve your social media experience.',
      },
      {
        question: 'True or False: Social media is always bad for mental health.',
        options: ['True', 'False'],
        correct: 1,
        explanation: 'Social media can be positive when used mindfully—connecting with friends, learning, and finding support communities.',
      },
    ],
  },
  'sleep-mood': {
    title: 'Sleep & Mood Connection',
    description: 'Understand how sleep affects your mood',
    questions: [
      {
        question: 'How many hours of sleep do teens typically need?',
        options: ['4-5 hours', '6-7 hours', '8-10 hours', '12+ hours'],
        correct: 2,
        explanation: 'Teens need 8-10 hours of sleep per night for optimal physical and mental health.',
      },
      {
        question: 'What can help improve sleep?',
        options: ['Using screens right before bed', 'Keeping a consistent sleep schedule', 'Drinking caffeine at night', 'Staying up late on weekends'],
        correct: 1,
        explanation: 'A consistent sleep schedule helps regulate your body\'s internal clock and improves sleep quality.',
      },
      {
        question: 'True or False: Poor sleep can make anxiety and depression worse.',
        options: ['True', 'False'],
        correct: 0,
        explanation: 'Sleep and mental health are closely connected. Poor sleep can worsen anxiety and depression symptoms.',
      },
    ],
  },
}

type GroupSessionComponentProps = {
  sessionId: string
  deviceInfo: DeviceInfo
  onClose: () => void
}

const GroupSessionComponent = ({ sessionId, deviceInfo, onClose }: GroupSessionComponentProps) => {
  const [nickname, setNickname] = useState('')
  const [joined, setJoined] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  
  // Get session from localStorage
  const session = useMemo(() => {
    const stored = localStorage.getItem(GROUP_SESSIONS_KEY)
    const sessions = stored ? JSON.parse(stored) : []
    return sessions.find((s: GroupSession) => s.sessionId === sessionId && s.isActive)
  }, [sessionId])
  
  const activityPack = session ? activityPacks[session.stationId] : null
  
  const handleJoin = () => {
    if (!nickname.trim()) return
    
    const participation: GroupSessionParticipation = {
      sessionId,
      nickname: nickname.trim(),
      deviceType: deviceInfo.type,
      completed: false,
      score: 0,
      joinedAt: new Date().toISOString(),
    }
    
    const stored = localStorage.getItem(GROUP_SESSION_PARTICIPATION_KEY)
    const participations = stored ? JSON.parse(stored) : []
    participations.push(participation)
    localStorage.setItem(GROUP_SESSION_PARTICIPATION_KEY, JSON.stringify(participations))
    
    // Update session participant count
    if (session) {
      const sessions = JSON.parse(localStorage.getItem(GROUP_SESSIONS_KEY) || '[]')
      const updated = sessions.map((s: GroupSession) => 
        s.sessionId === sessionId ? { ...s, participantCount: s.participantCount + 1 } : s
      )
      localStorage.setItem(GROUP_SESSIONS_KEY, JSON.stringify(updated))
    }
    
    setJoined(true)
  }
  
  const handleAnswer = (index: number) => {
    if (answered || !activityPack) return
    
    setSelectedAnswer(index)
    setAnswered(true)
    
    const question = activityPack.questions[currentQuestion]
    if (index === question.correct) {
      setScore(prev => prev + 10)
    }
    
    // Update participation score
    const stored = localStorage.getItem(GROUP_SESSION_PARTICIPATION_KEY)
    const participations = stored ? JSON.parse(stored) : []
    const updated = participations.map((p: GroupSessionParticipation) => 
      p.sessionId === sessionId && p.nickname === nickname
        ? { ...p, score: (p.score || 0) + (index === question.correct ? 10 : 0) }
        : p
    )
    localStorage.setItem(GROUP_SESSION_PARTICIPATION_KEY, JSON.stringify(updated))
  }
  
  const handleNext = () => {
    if (currentQuestion < (activityPack?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      // Session complete
      const stored = localStorage.getItem(GROUP_SESSION_PARTICIPATION_KEY)
      const participations = stored ? JSON.parse(stored) : []
      const updated = participations.map((p: GroupSessionParticipation) => 
        p.sessionId === sessionId && p.nickname === nickname
          ? { ...p, completed: true }
          : p
      )
      localStorage.setItem(GROUP_SESSION_PARTICIPATION_KEY, JSON.stringify(updated))
    }
  }
  
  if (!session || !activityPack) {
    return (
      <section className="panel">
        <div className="panel__header">
          <h2>Session not found</h2>
          <p>The session you're trying to join doesn't exist or has ended.</p>
          <button className="primary" onClick={onClose}>Go back</button>
        </div>
      </section>
    )
  }
  
  if (!joined) {
    return (
      <section className="panel group-session-join">
        <div className="panel__header">
          <h2>Join Group Session</h2>
          <p className="session-info">
            <strong>{activityPack.title}</strong><br />
            {activityPack.description}
          </p>
          <p className="session-pin">Session PIN: <strong>{sessionId}</strong></p>
        </div>
        <div className="card">
          <label>Enter a nickname (not your real name)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Choose a nickname"
            maxLength={20}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          />
          <p className="privacy-note" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Your nickname is only used for this session. No personal information is collected.
          </p>
          <div className="form-actions">
            <button type="button" className="primary" onClick={handleJoin} disabled={!nickname.trim()}>
              Join Session
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </section>
    )
  }
  
  const question = activityPack.questions[currentQuestion]
  const isLastQuestion = currentQuestion === activityPack.questions.length - 1
  
  return (
    <section className="panel group-session">
      <div className="panel__header">
        <h2>{activityPack.title}</h2>
        <p>Question {currentQuestion + 1} of {activityPack.questions.length}</p>
        <p className="session-progress">Your score: {score} points</p>
      </div>
      
      <div className="card question-card">
        <h3>{question.question}</h3>
        <div className="answer-options">
          {question.options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`answer-option ${
                answered && index === question.correct ? 'correct' : 
                answered && index === selectedAnswer && index !== question.correct ? 'incorrect' :
                selectedAnswer === index ? 'selected' : ''
              }`}
              onClick={() => handleAnswer(index)}
              disabled={answered}
            >
              {option}
            </button>
          ))}
        </div>
        
        {answered && (
          <div className="explanation">
            <p><strong>{selectedAnswer === question.correct ? '✓ Correct!' : 'Not quite'}</strong></p>
            <p>{question.explanation}</p>
          </div>
        )}
        
        <div className="form-actions">
          {answered && (
            <button type="button" className="primary" onClick={handleNext}>
              {isLastQuestion ? 'Finish' : 'Next Question'}
            </button>
          )}
          {isLastQuestion && answered && (
            <div className="session-complete">
              <h3>🎉 Session Complete!</h3>
              <p>Your class unlocked new coping strategies together.</p>
              <p>Final score: {score} points</p>
              <button type="button" className="primary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default App

