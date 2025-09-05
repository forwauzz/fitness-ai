import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import { parseTextToMeals } from "./parser.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: ["text/plain", "text/*"], limit: "1mb" }));

const CSV = path.join(process.cwd(), "data.csv");

// Ensure header exists & exact order
const HEADER = "date,entry_type,meal_type,items,quantities,calories_kcal,protein_g,carbs_g,fat_g,workout_type,duration_min,distance_km,goal_type,goal_value,goal_notes,notes";
if (!fs.existsSync(CSV)) {
  fs.writeFileSync(CSV, HEADER + "\n", "utf8");
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
    Math.round(kcal).toString(),
    P.toFixed(1),
    C.toFixed(1),
    F.toFixed(1),
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

// Dashboard Analytics API
app.get("/api/dashboard/analytics", (req, res) => {
  try {
    const content = fs.readFileSync(CSV, "utf8");
    const lines = content.split('\n').filter(line => line.trim());
    const today = dayjs().format("YYYY-MM-DD");
    const weekAgo = dayjs().subtract(7, 'day').format("YYYY-MM-DD");
    
    // Parse CSV data
    const data = lines.slice(1).map(line => {
      const cols = line.split(',');
      return {
        date: cols[0],
        entry_type: cols[1],
        meal_type: cols[2],
        calories_kcal: parseFloat(cols[5]) || 0,
        protein_g: parseFloat(cols[6]) || 0,
        carbs_g: parseFloat(cols[7]) || 0,
        fat_g: parseFloat(cols[8]) || 0,
        workout_type: cols[9],
        duration_min: parseFloat(cols[10]) || 0,
        distance_km: parseFloat(cols[11]) || 0,
        goal_type: cols[12],
        goal_value: parseFloat(cols[13]) || 0,
        goal_notes: cols[14],
        notes: cols[15]
      };
    }).filter(row => row.date >= weekAgo);

    // Daily aggregations
    const dailyData = {};
    data.forEach(row => {
      if (!dailyData[row.date]) {
        dailyData[row.date] = {
          date: row.date,
          meals: 0,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          workouts: 0,
          workoutDuration: 0,
          distance: 0,
          goals: []
        };
      }
      
      if (row.entry_type === 'meal' && row.calories_kcal > 0) {
        dailyData[row.date].meals++;
        dailyData[row.date].calories += row.calories_kcal;
        dailyData[row.date].protein += row.protein_g;
        dailyData[row.date].carbs += row.carbs_g;
        dailyData[row.date].fat += row.fat_g;
      }
      
      if (row.workout_type && row.duration_min > 0) {
        dailyData[row.date].workouts++;
        dailyData[row.date].workoutDuration += row.duration_min;
        dailyData[row.date].distance += row.distance_km;
      }
      
      if (row.goal_type && row.goal_value > 0) {
        dailyData[row.date].goals.push({
          type: row.goal_type,
          value: row.goal_value,
          notes: row.goal_notes
        });
      }
    });

    // Weekly totals
    const weeklyTotals = {
      totalMeals: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalWorkouts: 0,
      totalWorkoutDuration: 0,
      totalDistance: 0,
      activeDays: Object.keys(dailyData).length
    };

    Object.values(dailyData).forEach((day: any) => {
      weeklyTotals.totalMeals += day.meals;
      weeklyTotals.totalCalories += day.calories;
      weeklyTotals.totalProtein += day.protein;
      weeklyTotals.totalCarbs += day.carbs;
      weeklyTotals.totalFat += day.fat;
      weeklyTotals.totalWorkouts += day.workouts;
      weeklyTotals.totalWorkoutDuration += day.workoutDuration;
      weeklyTotals.totalDistance += day.distance;
    });

    // Today's data
    const todayData = dailyData[today] || {
      date: today,
      meals: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      workouts: 0,
      workoutDuration: 0,
      distance: 0,
      goals: []
    };

    res.json({
      dailyData: Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      weeklyTotals,
      todayData,
      period: { start: weekAgo, end: today }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate analytics" });
  }
});

// Goals API
app.get("/api/goals", (req, res) => {
  try {
    const content = fs.readFileSync(CSV, "utf8");
    const lines = content.split('\n').filter(line => line.trim());
    
    const goals = lines.slice(1).map(line => {
      const cols = line.split(',');
      return {
        date: cols[0],
        goal_type: cols[12],
        goal_value: parseFloat(cols[13]) || 0,
        goal_notes: cols[14]
      };
    }).filter(row => row.goal_type && row.goal_value > 0);

    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

app.post("/api/goals", (req, res) => {
  try {
    const { goal_type, goal_value, goal_notes } = req.body;
    const today = dayjs().format("YYYY-MM-DD");
    
    // Add goal to CSV
    const row = [
      today, "goal", "", "", "", 0, 0, 0, 0, "", 0, 0, goal_type, goal_value, goal_notes, ""
    ].map(csvEscape).join(",");
    
    fs.appendFileSync(CSV, row + "\n", "utf8");
    
    res.json({ success: true, message: "Goal added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add goal" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
