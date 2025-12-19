import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

// ---- Auth types ----

interface AuthUser {
  sub: string;
  role: "STUDENT" | "COUNSELLOR" | "PARENT" | "ADMIN";
  schoolId: string;
  userId: string; // User ID from database
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ---- Auth middleware ----
// Verifies JWT tokens and attaches user to request
const authMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = header.slice(7);

  try {
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (
      decoded &&
      typeof decoded === "object" &&
      typeof decoded.sub === "string" &&
      typeof decoded.role === "string" &&
      typeof decoded.schoolId === "string" &&
      typeof decoded.userId === "string"
    ) {
      req.user = {
        sub: decoded.sub,
        role: decoded.role as AuthUser["role"],
        schoolId: decoded.schoolId,
        userId: decoded.userId,
      };
      return next();
    } else {
      return res.status(401).json({ error: "Invalid token structure" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ---- Role-based middleware ----
const requireRole = (...allowedRoles: AuthUser["role"][]) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

// ---- Risk calculation logic ----

function computeRiskScore(payload: {
  mood: number;
  sleepQuality: number;
  concentration: number;
  energy: number;
  worries: number;
  burden: number;
}): number {
  const { mood, sleepQuality, concentration, energy, worries, burden } = payload;

  const moodRisk = 5 - mood;
  const sleepRisk = 5 - sleepQuality;
  const concentrationRisk = 5 - concentration;
  const energyRisk = 5 - energy;

  const weighted =
    moodRisk * 2 +
    sleepRisk * 1.5 +
    concentrationRisk * 1.5 +
    energyRisk * 1.5 +
    worries * 1.5 +
    burden * 2;

  return weighted;
}

function riskLevelFromScore(score: number): "green" | "yellow" | "red" {
  if (score < 12) return "green";
  if (score < 20) return "yellow";
  return "red";
}

// Calculate PHQ-A score (simplified)
function calculatePHQScore(entry: {
  mood: number;
  sleepQuality: number;
  concentration: number;
  energy: number;
  worries: number;
  burden: number;
}): number {
  const moodScore = 5 - entry.mood;
  const energyScore = 5 - entry.energy;
  const sleepScore = 5 - entry.sleepQuality;
  const concentrationScore = 5 - entry.concentration;
  const burdenScore = entry.burden - 1;
  const worriesScore = entry.worries - 1;
  const interestScore = Math.max(0, 5 - entry.energy - 1);
  const appetiteScore = Math.max(0, 5 - entry.energy - 1);
  const selfWorthScore = entry.burden - 1;

  return Math.min(
    27,
    moodScore +
      energyScore +
      sleepScore +
      concentrationScore +
      burdenScore +
      worriesScore +
      interestScore +
      appetiteScore +
      selfWorthScore
  );
}

// Calculate GAD-7 score (simplified)
function calculateGADScore(entry: {
  mood: number;
  sleepQuality: number;
  concentration: number;
  energy: number;
  worries: number;
}): number {
  const worriesScore = entry.worries - 1;
  const restlessnessScore = Math.max(0, 5 - entry.sleepQuality - 1);
  const tiredScore = 5 - entry.energy;
  const concentrationScore = 5 - entry.concentration;
  const irritabilityScore = Math.max(0, 5 - entry.mood - 1);
  const muscleTensionScore = Math.max(0, entry.worries - 2);
  const sleepDisturbanceScore = 5 - entry.sleepQuality;

  return Math.min(
    21,
    worriesScore +
      restlessnessScore +
      tiredScore +
      concentrationScore +
      irritabilityScore +
      muscleTensionScore +
      sleepDisturbanceScore
  );
}

function calculateSafetyRisk(phqScore: number, gadScore: number): string {
  if (phqScore >= 15 || gadScore >= 15) return "high";
  if (phqScore >= 10 || gadScore >= 10) return "moderate";
  return "low";
}

// ---- Routes ----

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // For demo: simple password check (in production, use bcrypt)
    // For now, we'll allow any password if user exists (dev mode)
    // In production: const isValid = await bcrypt.compare(password, user.password);
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";
    const token = jwt.sign(
      {
        sub: user.id,
        userId: user.id,
        role: user.role,
        schoolId: user.schoolId,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Return user info (without password) and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user info
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { school: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Student creates check-in
app.post(
  "/api/students/:studentId/check-ins",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { studentId } = req.params;
      const {
        mood,
        sleepQuality,
        concentration,
        energy,
        worries,
        burden,
        notes,
        cognitiveScore,
        screenUseImpact,
      } = req.body;

      // Validate required fields (1–5 scale)
      if (
        mood == null ||
        sleepQuality == null ||
        concentration == null ||
        energy == null ||
        worries == null ||
        burden == null
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Ensure school exists (dev: auto-create)
      const schoolId = req.user.schoolId;
      const devSchoolName = "Dev School";

      await prisma.school.upsert({
        where: { id: schoolId },
        update: {},
        create: {
          id: schoolId,
          name: devSchoolName,
        },
      });

      // Ensure student exists; in dev, auto-create if missing
      let student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        console.warn(
          `Student ${studentId} not found, creating demo student for dev environment`
        );
        student = await prisma.student.create({
          data: {
            id: studentId, // assumes String id in Prisma schema
            schoolId,
            displayName: "Demo Student",
            grade: 9,
            consentStatus: "GRANTED",
          },
        });
      } else if (student.schoolId !== schoolId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Calculate scores
      const riskScore = computeRiskScore({
        mood,
        sleepQuality,
        concentration,
        energy,
        worries,
        burden,
      });
      const riskLevel = riskLevelFromScore(riskScore);

      const phqScore = calculatePHQScore({
        mood,
        sleepQuality,
        concentration,
        energy,
        worries,
        burden,
      });
      const gadScore = calculateGADScore({
        mood,
        sleepQuality,
        concentration,
        energy,
        worries,
      });
      const safetyRisk = calculateSafetyRisk(phqScore, gadScore);

      // Create check-in
      const checkIn = await prisma.checkIn.create({
        data: {
          studentId,
          mood,
          sleepQuality,
          concentration,
          energy,
          worries,
          burden,
          notes: notes || null,
          cognitiveScore: cognitiveScore || null,
          screenUseImpact: screenUseImpact || null,
          riskScore,
          riskLevel,
          phqScore,
          gadScore,
          safetyRisk,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.sub,
          schoolId,
          studentId,
          type: "CREATE_CHECK_IN",
          details: {
            checkInId: checkIn.id,
            riskLevel,
          } as any,
        },
      });

      return res.status(201).json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Counsellor dashboard overview
app.get("/api/dashboard/overview", authMiddleware, requireRole("COUNSELLOR", "ADMIN"), async (req, res) => {
  try {

    const schoolId = req.user.schoolId;

    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        checkIns: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const overview = {
      students: students.map((student) => {
        const lastCheckIn = student.checkIns[0];
        return {
          id: student.id,
          name: student.displayName,
          grade: student.grade,
          lastCheckIn: lastCheckIn?.createdAt || null,
          lastRiskLevel: lastCheckIn?.riskLevel || null,
          lastRiskScore: lastCheckIn?.riskScore || null,
          consentStatus: student.consentStatus,
        };
      }),
      bigMovers: [] as any[], // TODO
    };

    await prisma.auditLog.create({
      data: {
        userId: req.user.sub,
        schoolId,
        type: "VIEW_DASHBOARD",
      },
    });

    return res.json(overview);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get student check-in history
app.get(
  "/api/students/:studentId/check-ins",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { studentId } = req.params;

      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      if (student.schoolId !== req.user.schoolId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Students can only view their own check-ins
      if (req.user.role === "STUDENT" && studentId !== req.user.sub) {
        return res.status(403).json({ error: "Forbidden: Students can only view their own check-ins" });
      }

      // Parents can only view their child's check-ins (would need parent-student relationship in schema)
      // For now, parents can view any student in their school (you can tighten this later)

      const checkIns = await prisma.checkIn.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.sub,
          schoolId: req.user.schoolId,
          studentId,
          type: "VIEW_STUDENT",
        },
      });

      return res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Frontend URL: ${frontendUrl}`);
  console.log(
    `💾 Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`
  );
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
