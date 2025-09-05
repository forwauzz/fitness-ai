import { useState, useEffect } from "react";
import { logMealsText } from "../lib/api";

export default function ChatMealLogger() {
  const [text, setText] = useState<string>(
`pre workout: 1 banana, 1 tbsp honey
breakfast: 3 eggs, 60 g oats, 150 g yogurt
lunch: 180 g shrimp, 129 g pasta, 1 glass mango juice`
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [dailyTotals, setDailyTotals] = useState<any>(null);

  async function fetchDailyTotals() {
    try {
      const response = await fetch("http://localhost:3001/api/logs");
      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      const today = new Date().toISOString().split('T')[0];
      
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let mealCount = 0;
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 10 && columns[0] === today && columns[1] === 'meal') {
          const calories = parseFloat(columns[5]) || 0;
          const protein = parseFloat(columns[6]) || 0;
          const carbs = parseFloat(columns[7]) || 0;
          const fat = parseFloat(columns[8]) || 0;
          
          totalCalories += calories;
          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
          mealCount++;
        }
      }
      
      setDailyTotals({
        totalCalories: Math.round(totalCalories),
        totalProtein: +totalProtein.toFixed(1),
        totalCarbs: +totalCarbs.toFixed(1),
        totalFat: +totalFat.toFixed(1),
        mealCount
      });
    } catch (e) {
      console.error("Failed to fetch daily totals:", e);
    }
  }

  async function onSubmit() {
    setLoading(true); setErr(""); setResult(null);
    try {
      const data = await logMealsText(text);
      setResult(data);
      // Refresh daily totals after logging new meals
      await fetchDailyTotals();
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally { setLoading(false); }
  }

  // Fetch daily totals on component mount
  useEffect(() => {
    fetchDailyTotals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Main Container */}
        <div className="relative bg-gradient-to-br from-blue-800/20 to-slate-800/30 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl shadow-blue-500/20 p-8 md:p-12">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent mb-4">
                AI FITNESS COACH
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
              <p className="text-blue-200/80 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Advanced meal logging system with intelligent macro estimation
              </p>
            </div>

            {/* Input Section */}
            <div className="mb-8">
              <label className="block text-blue-200/90 text-sm font-medium mb-3 text-center">
                MEAL INPUT PROTOCOL
              </label>
              <div className="relative">
                <textarea
                  className="w-full h-48 md:h-56 bg-slate-800/50 border border-blue-400/30 rounded-xl p-4 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 backdrop-blur-sm resize-none"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Enter your meals in the format:&#10;meal type: item1, item2, item3&#10;&#10;Example:&#10;breakfast: 2 eggs, 100g oats, 1 banana"
                />
                <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center mb-8">
              <button
                onClick={onSubmit}
                disabled={loading}
                className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-400/40"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      LOG MEALS
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Error Display */}
            {err && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 text-red-300">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">SYSTEM ERROR:</span>
                  <span>{err}</span>
                </div>
              </div>
            )}

            {/* Daily Totals - Always Show */}
            {dailyTotals && (
              <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-blue-300">DAILY PROGRESS</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-lg p-4 text-center border border-cyan-400/30">
                    <div className="text-2xl font-bold text-cyan-300">{dailyTotals.totalCalories}</div>
                    <div className="text-cyan-200/70 text-sm">CALORIES</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/40 to-slate-800/40 rounded-lg p-4 text-center border border-blue-400/30">
                    <div className="text-2xl font-bold text-blue-300">{dailyTotals.totalProtein}g</div>
                    <div className="text-blue-200/70 text-sm">PROTEIN</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/40 to-cyan-800/40 rounded-lg p-4 text-center border border-slate-400/30">
                    <div className="text-2xl font-bold text-slate-300">{dailyTotals.totalCarbs}g</div>
                    <div className="text-slate-200/70 text-sm">CARBS</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-800/40 to-blue-800/40 rounded-lg p-4 text-center border border-cyan-400/30">
                    <div className="text-2xl font-bold text-cyan-300">{dailyTotals.totalFat}g</div>
                    <div className="text-cyan-200/70 text-sm">FAT</div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <div className="text-blue-300/80 text-sm">
                    {dailyTotals.mealCount} meals logged today
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="bg-slate-800/40 border border-cyan-400/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-cyan-300">MISSION ACCOMPLISHED</h2>
                </div>
                
                {/* Current Meal Totals */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 text-center">CURRENT MEAL TOTALS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-900/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-300">{result.appended_count}</div>
                      <div className="text-blue-200/70 text-sm">MEALS LOGGED</div>
                    </div>
                    <div className="bg-cyan-900/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-cyan-300">
                        {result.rows.reduce((sum: number, row: any) => sum + row.calories_kcal, 0)}
                      </div>
                      <div className="text-cyan-200/70 text-sm">CALORIES</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-slate-300">
                        {result.rows.reduce((sum: number, row: any) => sum + row.protein_g, 0).toFixed(1)}g
                      </div>
                      <div className="text-slate-200/70 text-sm">PROTEIN</div>
                    </div>
                  </div>
                </div>


                <div className="space-y-3">
                  {result.rows.map((row: any, index: number) => (
                    <div key={index} className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-300 capitalize">{row.meal_type}</h3>
                        <div className="text-cyan-300 font-bold">{row.calories_kcal} kcal</div>
                      </div>
                      <div className="text-blue-200/80 text-sm mb-2">{row.items.join(", ")}</div>
                      <div className="flex gap-4 text-xs text-slate-300">
                        <span>P: {row.protein_g}g</span>
                        <span>C: {row.carbs_g}g</span>
                        <span>F: {row.fat_g}g</span>
                        {row.estimated_any && <span className="text-cyan-400">• AI ESTIMATED</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-300/60 text-sm">
            Powered by Advanced AI Nutrition Analysis
          </p>
        </div>
      </div>
    </div>
  );
}
