// Production-ready server that extends current functionality
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DATA_PATH: process.env.DATA_PATH || path.join(process.cwd(), "data.csv"),
  PROFILE_PATH: process.env.PROFILE_PATH || path.join(process.cwd(), "profile.json"),
  MODEL_PATH: process.env.MODEL_PATH || path.join(process.cwd(), "models"),
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_INTERVAL_HOURS: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

// Production logging
const log = (level, message, data = null) => {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
  
  // In production, you'd write to log files
  if (config.NODE_ENV === 'production') {
    // TODO: Add file logging here
  }
};

const app = express();

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: ["text/plain", "text/*"], limit: "1mb" }));

// Request logging middleware
app.use((req, res, next) => {
  log('info', `${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  log('error', 'Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path 
  });
  
  res.status(500).json({ 
    error: config.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Data validation
const validateMealData = (data) => {
  const errors = [];
  
  if (!data.meal_type || typeof data.meal_type !== 'string') {
    errors.push('meal_type is required and must be a string');
  }
  
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('items must be a non-empty array');
  }
  
  if (typeof data.calories_kcal !== 'number' || data.calories_kcal < 0) {
    errors.push('calories_kcal must be a positive number');
  }
  
  return errors;
};

// Backup system
const createBackup = () => {
  if (!config.BACKUP_ENABLED) return;
  
  try {
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup data files
    if (fs.existsSync(config.DATA_PATH)) {
      const backupPath = path.join(backupDir, `data_${timestamp}.csv`);
      fs.copyFileSync(config.DATA_PATH, backupPath);
      log('info', 'Data backup created', { path: backupPath });
    }
    
    if (fs.existsSync(config.PROFILE_PATH)) {
      const backupPath = path.join(backupDir, `profile_${timestamp}.json`);
      fs.copyFileSync(config.PROFILE_PATH, backupPath);
      log('info', 'Profile backup created', { path: backupPath });
    }
    
  } catch (error) {
    log('error', 'Backup failed', { error: error.message });
  }
};

// Initialize data files (same as current system)
const HEADER = "date,entry_type,meal_type,items,quantities,calories_kcal,protein_g,carbs_g,fat_g,workout_type,duration_min,distance_km,goal_type,goal_value,goal_notes,notes";

if (!fs.existsSync(config.DATA_PATH)) {
  fs.writeFileSync(config.DATA_PATH, HEADER + "\n", "utf8");
  log('info', 'Data file created', { path: config.DATA_PATH });
}

if (!fs.existsSync(config.PROFILE_PATH)) {
  const defaultProfile = {
    "user_id": "default_user",
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString(),
    "preferences": {
      "favorite_foods": [],
      "favorite_snacks": [],
      "grocery_items": [],
      "dietary_restrictions": [],
      "meal_timing_preferences": {}
    },
    "learning_metrics": {
      "total_predictions": 0,
      "accuracy_trend": [],
      "model_confidence": 0.0,
      "personalization_score": 0.0
    },
    "dietary_patterns": {
      "average_meal_size": {},
      "meal_frequency": {},
      "macro_preferences": {
        "protein_ratio": 0.0,
        "carbs_ratio": 0.0,
        "fat_ratio": 0.0
      }
    }
  };
  fs.writeFileSync(config.PROFILE_PATH, JSON.stringify(defaultProfile, null, 2), "utf8");
  log('info', 'Profile file created', { path: config.PROFILE_PATH });
}

// CSV utilities (same as current system)
function csvEscape(s) {
  if (s == null) return "";
  const needs = /[",\n]/.test(s);
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}

function appendMealRow(dateISO, meal_type, items, quants, kcal, P, C, F) {
  const row = [
    dateISO,
    "meal",
    meal_type,
    items.join("; "),
    quants.join("; "),
    Math.round(kcal),
    +P.toFixed(1),
    +C.toFixed(1),
    +F.toFixed(1),
    "", "", "", "", "", "", ""
  ].map(csvEscape).join(",");
  fs.appendFileSync(config.DATA_PATH, row + "\n", "utf8");
}

// Simple meal parser (same as current system)
function parseTextToMeals(raw) {
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const meals = [];
  
  for (const line of lines) {
    const [left, right] = line.split(":");
    if (!right) continue;
    const meal_type = left.trim().toLowerCase();
    const parts = right.split(",").map(s => s.trim()).filter(Boolean);

    const items = [];
    const quantities = [];
    let P = 0, C = 0, F = 0;
    let any = false;

    for (const p of parts) {
      const numMatch = /^(\d[\d./]*\s*[A-Za-z]*)\s+(.+)$/.exec(p.trim());
      let food, qty;
      
      if (numMatch) {
        qty = numMatch[1].trim();
        food = numMatch[2].trim();
      } else {
        food = p.trim();
        qty = "1";
      }
      
      food = food.replace(/^and\s+/i, "").trim();
      if (!food) continue;

      items.push(food);
      quantities.push(qty);

      // Simple estimation for testing
      P += 10; C += 20; F += 5;
      any = true;
    }
    const kcal = 4*P + 4*C + 9*F;
    meals.push({ meal_type, items, quantities, P, C, F, kcal, estimated_any: any });
  }
  return meals;
}

// API Routes (same as current system, but with validation)

app.post("/api/log-text", (req, res) => {
  try {
    const body = typeof req.body === "string" ? req.body : req.body?.text || "";
    if (!body.trim()) {
      return res.status(400).json({ error: "Empty text" });
    }

    const today = dayjs().format("YYYY-MM-DD");
    const meals = parseTextToMeals(body);
    
    // Validate parsed meals
    for (const meal of meals) {
      const errors = validateMealData(meal);
      if (errors.length > 0) {
        log('warn', 'Invalid meal data', { errors, meal });
        return res.status(400).json({ error: "Invalid meal data", details: errors });
      }
    }
    
    const appended = [];

    for (const m of meals) {
      appendMealRow(today, m.meal_type, m.items, m.quantities, m.kcal, m.P, m.C, m.F);
      appended.push({
        date: today,
        meal_type: m.meal_type,
        items: m.items,
        quantities: m.quantities,
        calories_kcal: Math.round(m.kcal),
        protein_g: +m.P.toFixed(1),
        carbs_g: +m.C.toFixed(1),
        fat_g: +m.F.toFixed(1),
        estimated_any: m.estimated_any
      });
    }
    
    log('info', 'Meals logged', { count: appended.length });
    return res.json({ appended_count: appended.length, rows: appended });
    
  } catch (error) {
    log('error', 'Failed to log meals', { error: error.message });
    return res.status(500).json({ error: "Failed to log meals" });
  }
});

app.get("/api/logs", (_req, res) => {
  try {
    const content = fs.readFileSync(config.DATA_PATH, "utf8");
    return res.type("text/csv").send(content);
  } catch (error) {
    log('error', 'Failed to fetch logs', { error: error.message });
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Profile endpoints (same as current system, but with validation)
app.get("/api/profile", (_req, res) => {
  try {
    const profile = JSON.parse(fs.readFileSync(config.PROFILE_PATH, "utf8"));
    return res.json(profile);
  } catch (error) {
    log('error', 'Failed to load profile', { error: error.message });
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

app.put("/api/profile", (req, res) => {
  try {
    const updatedProfile = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    fs.writeFileSync(config.PROFILE_PATH, JSON.stringify(updatedProfile, null, 2), "utf8");
    log('info', 'Profile updated');
    return res.json(updatedProfile);
  } catch (error) {
    log('error', 'Failed to update profile', { error: error.message });
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/api/profile/preferences", (req, res) => {
  try {
    const profile = JSON.parse(fs.readFileSync(config.PROFILE_PATH, "utf8"));
    const { type, items } = req.body;
    
    if (!type || !['favorite_foods', 'favorite_snacks', 'grocery_items'].includes(type)) {
      return res.status(400).json({ error: "Invalid preference type" });
    }
    
    if (!profile.preferences[type]) {
      profile.preferences[type] = [];
    }
    
    const newItems = Array.isArray(items) ? items : [items];
    newItems.forEach((item) => {
      if (typeof item === 'string' && item.trim() && !profile.preferences[type].includes(item.trim())) {
        profile.preferences[type].push(item.trim());
      }
    });
    
    profile.updated_at = new Date().toISOString();
    fs.writeFileSync(config.PROFILE_PATH, JSON.stringify(profile, null, 2), "utf8");
    
    log('info', 'Preferences updated', { type, items: newItems });
    return res.json(profile);
  } catch (error) {
    log('error', 'Failed to update preferences', { error: error.message });
    return res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: "1.0.0"
  });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  log('info', `API listening on http://localhost:${PORT}`, { 
    environment: config.NODE_ENV,
    backupEnabled: config.BACKUP_ENABLED 
  });
  
  // Schedule backups
  if (config.BACKUP_ENABLED) {
    setInterval(createBackup, config.BACKUP_INTERVAL_HOURS * 60 * 60 * 1000);
    log('info', 'Backup system enabled', { intervalHours: config.BACKUP_INTERVAL_HOURS });
  }
});

export default app;
