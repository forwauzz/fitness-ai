import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import { spawn } from "child_process";

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
  fs.appendFileSync(CSV, row + "\n", "utf8");
}

// Simple meal parser for testing
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

app.post("/api/log-text", (req, res) => {
  const body = typeof req.body === "string" ? req.body : req.body?.text || "";
  if (!body.trim()) return res.status(400).json({ error: "Empty text" });

  const today = dayjs().format("YYYY-MM-DD");
  const meals = parseTextToMeals(body);
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
    newItems.forEach((item) => {
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

// ML Analytics endpoints
app.get("/api/ml/model-metrics", (req, res) => {
  try {
    const metadataPath = path.join(process.cwd(), "models", "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: "Model metadata not found" });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return res.json(metadata);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load model metrics" });
  }
});

app.get("/api/ml/training-progress", (req, res) => {
  try {
    const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
    const metadataPath = path.join(process.cwd(), "models", "metadata.json");
    const metadata = fs.existsSync(metadataPath) ? 
      JSON.parse(fs.readFileSync(metadataPath, "utf8")) : null;
    
    const progress = {
      totalSamples: metadata?.n_samples || 0,
      profileItems: (profile.preferences.favorite_foods?.length || 0) + 
                   (profile.preferences.favorite_snacks?.length || 0) + 
                   (profile.preferences.grocery_items?.length || 0),
      modelConfidence: metadata?.metrics?.r2 || 0,
      personalizationScore: profile.learning_metrics?.personalization_score || 0,
      lastTraining: metadata?.saved_at || null,
      trainingFrequency: 1 // Could be calculated from historical data
    };
    
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load training progress" });
  }
});

app.get("/api/ml/feature-importance", (req, res) => {
  try {
    const metadataPath = path.join(process.cwd(), "models", "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: "Model metadata not found" });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const schema = metadata.schema || [];
    
    // Calculate mock feature importance (in real implementation, this would come from the model)
    const featureImportance = schema.map((feature, index) => {
      let importance = 0;
      let impact = 'neutral';
      
      if (feature.includes('protein') || feature.includes('carbs') || feature.includes('fat')) {
        importance = 0.3 + (Math.random() * 0.2); // Core features
        impact = 'positive';
      } else if (feature.includes('favorite')) {
        importance = 0.1 + (Math.random() * 0.1); // Profile features
        impact = 'positive';
      } else if (feature.includes('profile')) {
        importance = 0.05 + (Math.random() * 0.05); // Profile ratios
        impact = 'neutral';
      }
      
      return {
        feature: feature,
        importance: importance,
        impact: impact
      };
    });
    
    return res.json(featureImportance);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load feature importance" });
  }
});

app.post("/api/ml/retrain", (req, res) => {
  try {
    // Trigger model retraining
    const { spawn } = require('child_process');
    const python = spawn('python', ['train.py'], { cwd: process.cwd() });
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        return res.json({ 
          success: true, 
          message: "Model retrained successfully",
          output: output
        });
      } else {
        return res.status(500).json({ 
          error: "Model retraining failed", 
          details: error 
        });
      }
    });
    
  } catch (error) {
    return res.status(500).json({ error: "Failed to trigger retraining" });
  }
});

// Calendar API endpoint
app.get("/api/calendar/data", (req, res) => {
  try {
    const content = fs.readFileSync(CSV, "utf8");
    const lines = content.split('\n').filter(line => line.trim());
    
    // Parse CSV data and group by date
    const dailyData = {};
    
    lines.slice(1).forEach(line => {
      const cols = line.split(',');
      if (cols.length >= 10) {
        const date = cols[0];
        const entryType = cols[1];
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date: date,
            meals: 0,
            workouts: 0,
            hasData: false
          };
        }
        
        if (entryType === 'meal' && cols[2]) { // meal_type exists
          dailyData[date].meals++;
          dailyData[date].hasData = true;
        } else if (entryType === 'workout' && cols[9]) { // workout_type exists
          dailyData[date].workouts++;
          dailyData[date].hasData = true;
        }
      }
    });
    
    // Convert to array and sort by date
    const calendarData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return res.json(calendarData);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load calendar data" });
  }
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

    Object.values(dailyData).forEach(day => {
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
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
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

// ML Training API endpoints
app.get("/api/ml/training-data", (req, res) => {
  try {
    const metadataPath = path.join(process.cwd(), "models", "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: "No training data found. Train the model first." });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: "Failed to load training data" });
  }
});

app.post("/api/ml/train", (req, res) => {
  try {
    console.log("Starting model training...");
    // Use the virtual environment's Python if it exists
    const pythonPath = process.platform === 'win32' 
      ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
      : path.join(process.cwd(), '.venv', 'bin', 'python');
    
    const pythonCommand = fs.existsSync(pythonPath) ? pythonPath : 'python';
    
    const pythonProcess = spawn(pythonCommand, ["train.py"], { 
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = "";
    let errorOutput = "";
    
    pythonProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.log("Training output:", text);
    });
    
    pythonProcess.stderr.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log("Training error:", text);
    });
    
    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      res.status(500).json({ 
        error: "Failed to start training process", 
        details: error.message 
      });
    });
    
    pythonProcess.on("close", (code) => {
      console.log(`Training process exited with code ${code}`);
      if (code === 0) {
        res.json({ 
          success: true, 
          message: "Training completed successfully", 
          output: output.trim(),
          exitCode: code
        });
      } else {
        res.status(500).json({ 
          error: "Training failed", 
          output: errorOutput.trim(),
          exitCode: code
        });
      }
    });
  } catch (error) {
    console.error("Training API error:", error);
    res.status(500).json({ 
      error: "Failed to start training process", 
      details: error.message 
    });
  }
});

// Calendar API endpoints
app.get("/api/calendar/data", (req, res) => {
  try {
    const content = fs.readFileSync(CSV, "utf8");
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",");
    const data = lines.slice(1).map(line => {
      const values = line.split(",");
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    // Group data by date
    const calendarData = {};
    data.forEach(row => {
      if (row.date && row.date.trim()) {
        if (!calendarData[row.date]) {
          calendarData[row.date] = {
            date: row.date,
            meals: [],
            workouts: [],
            goals: []
          };
        }

        if (row.entry_type === 'meal' && row.meal_type) {
          calendarData[row.date].meals.push({
            type: row.meal_type,
            items: row.items,
            calories: parseFloat(row.calories_kcal) || 0,
            protein: parseFloat(row.protein_g) || 0,
            carbs: parseFloat(row.carbs_g) || 0,
            fat: parseFloat(row.fat_g) || 0
          });
        }

        if (row.workout_type) {
          calendarData[row.date].workouts.push({
            type: row.workout_type,
            duration: parseFloat(row.duration_min) || 0,
            distance: parseFloat(row.distance_km) || 0
          });
        }

        if (row.goal_type) {
          calendarData[row.date].goals.push({
            type: row.goal_type,
            value: parseFloat(row.goal_value) || 0,
            notes: row.goal_notes
          });
        }
      }
    });

    res.json(calendarData);
  } catch (error) {
    res.status(500).json({ error: "Failed to load calendar data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});


