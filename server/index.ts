import express from "express";
import cors from "cors";
import * as fs from "node:fs";
import * as path from "node:path";
import dayjs from "dayjs";
import { parseTextToMeals } from "./parser.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: ["text/plain", "text/*"], limit: "1mb" }));

const CSV = path.join(process.cwd(), "data.csv");
const PROFILE_PATH = path.join(process.cwd(), "profile.json");

// Ensure header exists & exact order
const HEADER = "date,entry_type,meal_type,items,quantities,calories_kcal,protein_g,carbs_g,fat_g,workout_type,duration_min,distance_km,goal_type,goal_value,goal_notes,notes";
if (!fs.existsSync(CSV)) {
  fs.writeFileSync(CSV, HEADER + "\n", "utf8");
}

// Ensure profile exists
if (!fs.existsSync(PROFILE_PATH)) {
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
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(defaultProfile, null, 2), "utf8");
}

// Simple CSV row escaper
function csvEscape(s: string) {
  if (s == null) return "";
  const needs = /[",\n]/.test(s);
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}

function appendMealRow(dateISO: string, meal_type: string, items: string[], quants: string[], kcal: number, P: number, C: number, F: number) {
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
  fs.appendFileSync(CSV, row + "\n", "utf8");
}

app.post("/api/log-text", (req, res) => {
  const body: string = typeof req.body === "string" ? req.body : req.body?.text || "";
  if (!body.trim()) return res.status(400).json({ error: "Empty text" });

  const today = dayjs().format("YYYY-MM-DD");
  const meals = parseTextToMeals(body);
  const appended: any[] = [];

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
  return res.json({ appended_count: appended.length, rows: appended });
});

app.get("/api/logs", (_req, res) => {
  const content = fs.readFileSync(CSV, "utf8");
  return res.type("text/csv").send(content);
});

// Profile management endpoints
app.get("/api/profile", (_req, res) => {
  try {
    const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

app.put("/api/profile", (req, res) => {
  try {
    const updatedProfile = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(updatedProfile, null, 2), "utf8");
    return res.json(updatedProfile);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/api/profile/preferences", (req, res) => {
  try {
    const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
    const { type, items } = req.body; // type: 'favorite_foods', 'favorite_snacks', 'grocery_items'
    
    if (!profile.preferences[type]) {
      profile.preferences[type] = [];
    }
    
    // Add new items, avoiding duplicates
    const newItems = Array.isArray(items) ? items : [items];
    newItems.forEach((item: string) => {
      if (!profile.preferences[type].includes(item)) {
        profile.preferences[type].push(item);
      }
    });
    
    profile.updated_at = new Date().toISOString();
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), "utf8");
    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update preferences" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
