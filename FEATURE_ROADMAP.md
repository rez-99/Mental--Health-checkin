# Feature Roadmap - Evidence-Based Enhancements

## Overview
This roadmap implements structured, evidence-based features to transform the app from a simple check-in tool into a comprehensive well-being support system.

---

## A. Structured Skills "Paths" (Theme 2)

### Goal
Offer evidence-based skill paths after check-ins instead of just "thanks, bye".

### Implementation Plan

#### A1. Database Schema
Add to `schema.prisma`:
```prisma
model SkillPath {
  id          String   @id @default(uuid())
  name        String   // "Feeling anxious", "Feeling sad", "Can't sleep", "Angry / overwhelmed"
  description String?
  icon        String?  // emoji
  modules     Json     // Array of module definitions
  createdAt   DateTime @default(now())
  
  sessions    SkillSession[]
  
  @@map("skill_paths")
}

model SkillSession {
  id          String   @id @default(uuid())
  studentId   String   @map("student_id")
  pathId      String   @map("path_id")
  pathName    String   @map("path_name") // Denormalized for easy queries
  preMood     Int?     @map("pre_mood") // 1-5
  postMood    Int?     @map("post_mood") // 1-5
  completedAt DateTime @map("completed_at")
  createdAt   DateTime @default(now())
  
  student Student @relation(fields: [studentId], references: [id])
  path   SkillPath @relation(fields: [pathId], references: [id])
  
  @@index([studentId])
  @@index([completedAt])
  @@map("skill_sessions")
}
```

#### A2. Skill Path Structure
Each path = 3-5 modules:
1. **Psycho-education** (1-2 screens)
   - "What is anxiety?" / "Why do we feel sad?"
   - Evidence-based, youth-friendly language
2. **Breathing/Grounding Exercise** (1 screen)
   - Interactive breathing guide
   - 4-7-8 technique or box breathing
3. **Thought-Challenging** (1 screen)
   - "What would you tell a friend?"
   - Cognitive reframing exercise
4. **Action Plan** (1 screen)
   - "Tonight I'll try..."
   - Small, concrete commitment

#### A3. Path Recommendations
Hook to check-in results:
- **Anxiety path**: mood ≤ 2 AND worries ≥ 4
- **Sadness path**: mood ≤ 2 AND burden ≥ 4
- **Sleep path**: sleepQuality ≤ 2
- **Anger/Overwhelm path**: energy ≤ 2 AND concentration ≤ 2

#### A4. UI Components
- Skills page/tab with path cards
- Path detail view with module progression
- Completion tracking
- Streak display ("You used skills 3 days this week!")
- Mood comparison graph (before vs. after)

---

## B. Early-Warning Logic with Options (Theme 3)

### Goal
Detect patterns early and give youth control over notifications.

### Implementation Plan

#### B1. Database Schema
Add to `schema.prisma`:
```prisma
model Flag {
  id          String   @id @default(uuid())
  studentId   String   @map("student_id")
  type        FlagType
  severity    String   // "low" | "moderate" | "high"
  resolvedAt  DateTime? @map("resolved_at")
  createdAt   DateTime @default(now())
  
  student Student @relation(fields: [studentId], references: [id])
  
  @@index([studentId])
  @@index([type])
  @@index([createdAt])
  @@map("flags")
}

enum FlagType {
  SUSTAINED_LOW_MOOD_SLEEP
  RAPID_DECLINE
  HIGH_WORRIES
  HIGH_BURDEN
  CRISIS_INDICATOR
}

model StudentNotificationPreference {
  id                String   @id @default(uuid())
  studentId         String   @unique @map("student_id")
  lowMoodReminder   Boolean  @default(true) @map("low_mood_reminder")
  notifyTrustedAdult Boolean @default(false) @map("notify_trusted_adult")
  notifyCounsellor  Boolean  @default(false) @map("notify_counsellor")
  trustedAdultEmail String?  @map("trusted_adult_email")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  student Student @relation(fields: [studentId], references: [id])
  
  @@map("student_notification_preferences")
}
```

#### B2. Flag Engine (Backend)
Add to `server/src/index.ts`:
```typescript
// Run after each check-in
async function checkForFlags(studentId: string, checkIn: CheckIn) {
  // Get last 3 check-ins
  const recent = await prisma.checkIn.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 3
  })
  
  // Rule: 3 days in a row with mood ≤ 2 + sleep ≤ 2
  if (recent.length >= 3) {
    const allLow = recent.every(c => c.mood <= 2 && c.sleepQuality <= 2)
    if (allLow) {
      await prisma.flag.upsert({
        where: {
          studentId_type: {
            studentId,
            type: 'SUSTAINED_LOW_MOOD_SLEEP'
          }
        },
        update: {},
        create: {
          studentId,
          type: 'SUSTAINED_LOW_MOOD_SLEEP',
          severity: 'moderate'
        }
      })
    }
  }
  
  // Add more rules...
}
```

#### B3. Youth Control (Frontend)
Add to settings/preferences:
- Checkboxes for notification preferences
- "If my mood stays low for a few days:"
  - ☐ Just remind me
  - ☐ Also notify my trusted adult
  - ☐ Also notify school counsellor

#### B4. Counsellor Dashboard
New panel: "Students with new flags this week"
- Columns: Name | Last check-in | Flag type | Suggested action
- Filter by flag type
- Mark as resolved

---

## C. Safety Plan + Crisis Flow (Theme 6)

### Goal
High-impact safety planning without hardware requirements.

### Implementation Plan

#### C1. Database Schema
Add to `schema.prisma`:
```prisma
model SafetyPlan {
  id                String   @id @default(uuid())
  studentId         String   @unique @map("student_id")
  warningSigns      String[] @map("warning_signs") // Array of strings
  copingStrategies  String[] @map("coping_strategies")
  reasonsToStaySafe String[] @map("reasons_to_stay_safe")
  peopleWhoCanHelp  Json     @map("people_who_can_help") // [{name, contact, relationship}]
  crisisResources   Json?    @map("crisis_resources") // Local crisis lines
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  student Student @relation(fields: [studentId], references: [id])
  
  @@map("safety_plans")
}
```

#### C2. Safety Plan Wizard (Frontend)
Multi-step form:
1. "Warning signs for me..." (multi-select or text)
2. "Things that help me calm down..." (multi-select or text)
3. "Reasons I want to stay safe..." (text area)
4. "People who can help..." (name, contact, relationship)

#### C3. Trigger on Risky Check-ins
If PHQ ≥ 15 OR GAD ≥ 15 OR burden ≥ 4:
- Show: "Let's review your safety plan" button
- Offer to update or create safety plan
- Show crisis resources (configurable per country)

#### C4. Crisis Resources
Configurable per region:
- Crisis Text Line
- National Suicide Prevention Lifeline
- Local emergency numbers
- School-specific resources

---

## D. Engagement Features (Theme 5)

### Goal
Make it engaging without full gamification.

### Implementation Plan

#### D1. Skills Badges
- Badge when completing first skill path
- Badge for 7-day skill streak
- Badge for completing all paths

#### D2. Avatar Customization
Simple options:
- Animal avatars (cat, dog, bird, etc.)
- Color themes
- Non-human options (robot, star, etc.)

#### D3. Enhanced Streaks
- Check-in streak (already exists)
- Skills streak ("You used skills 3 days this week!")
- Combined streak display

---

## Implementation Priority

### Phase 1 (High Impact, Quick Wins)
1. ✅ Skills paths UI (frontend only, localStorage)
2. ✅ Flag engine (backend)
3. ✅ Safety plan wizard (frontend)

### Phase 2 (Database Integration)
1. Add database tables
2. Migrate localStorage data
3. Add API endpoints

### Phase 3 (Advanced Features)
1. Counsellor flag dashboard
2. Youth notification preferences
3. Avatar customization
4. Badge system

---

## Next Steps

1. Start with Skills Paths UI (can work with localStorage first)
2. Add database schema for all new tables
3. Implement flag engine on backend
4. Build safety plan wizard
5. Add engagement features incrementally

