import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getDashboardAnalytics, getGoals, addGoal } from "../lib/api";
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

interface DashboardData {
  dailyData: any[];
  weeklyTotals: any;
  todayData: any;
  period: { start: string; end: string };
}

interface Goal {
  date: string;
  goal_type: string;
  goal_value: number;
  goal_notes: string;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newGoal, setNewGoal] = useState({ type: "", value: 0, notes: "" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState<'meals' | 'workouts'>('meals');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analytics, goalsData] = await Promise.all([
        getDashboardAnalytics(),
        getGoals()
      ]);
      setDashboardData(analytics);
      setGoals(goalsData);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDayData = () => {
    if (!dashboardData) return null;
    return dashboardData.dailyData.find(day => day.date === selectedDate) || null;
  };

  const getSelectedDayGoals = () => {
    if (!goals) return [];
    return goals.filter(goal => goal.date === selectedDate);
  };

  const handleAddGoal = async () => {
    if (!newGoal.type || newGoal.value <= 0) return;
    
    try {
      await addGoal(newGoal.type, newGoal.value, newGoal.notes);
      setNewGoal({ type: "", value: 0, notes: "" });
      setShowGoalForm(false);
      fetchData(); // Refresh data
    } catch (e: any) {
      setError(e.message || "Failed to add goal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 pt-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 pt-8">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-blue-300">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Chart configurations
  const caloriesChartData = {
    labels: dashboardData.dailyData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Calories',
      data: dashboardData.dailyData.map(d => d.calories),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  const workoutsChartData = {
    labels: dashboardData.dailyData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Workout Duration (min)',
      data: dashboardData.dailyData.map(d => d.workoutDuration),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1
    }]
  };

  const macroChartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [
        dashboardData.weeklyTotals.totalProtein,
        dashboardData.weeklyTotals.totalCarbs,
        dashboardData.weeklyTotals.totalFat
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)'
      ],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(191, 219, 254)'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgb(191, 219, 254)' },
        grid: { color: 'rgba(59, 130, 246, 0.1)' }
      },
      y: {
        ticks: { color: 'rgb(191, 219, 254)' },
        grid: { color: 'rgba(59, 130, 246, 0.1)' }
      }
    }
  };

  return (
    <div className="p-4 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent mb-4">
            FITNESS DASHBOARD
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
          <p className="text-blue-200/80 text-lg">
            Advanced Analytics & Goal Tracking
          </p>
        </div>

        {/* Date Picker and Daily Summary */}
        <div className="bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div>
                <label className="block text-blue-300 font-semibold mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-700/50 border border-blue-400/30 rounded-lg p-3 text-blue-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-blue-300 font-semibold mb-2">View Mode</label>
                <div className="flex bg-slate-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('meals')}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      viewMode === 'meals'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    Meals
                  </button>
                  <button
                    onClick={() => setViewMode('workouts')}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      viewMode === 'workouts'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    Workouts
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">
                {dayjs(selectedDate).format('MMMM DD, YYYY')}
              </div>
              <div className="text-blue-200/70 text-sm">
                {dayjs(selectedDate).format('dddd')}
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          {(() => {
            const dayData = getSelectedDayData();
            const dayGoals = getSelectedDayGoals();
            
            if (!dayData) {
              return (
                <div className="text-center py-8">
                  <div className="text-blue-300/60 text-lg">No data available for this date</div>
                  <div className="text-blue-300/40 text-sm mt-2">Try selecting a different date</div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meals Summary */}
                {viewMode === 'meals' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-blue-300 mb-4">🍽️ MEALS SUMMARY</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-400/30">
                        <div className="text-2xl font-bold text-blue-300">{dayData.calories}</div>
                        <div className="text-blue-200/70 text-sm">Total Calories</div>
                      </div>
                      <div className="bg-cyan-900/40 rounded-lg p-4 border border-cyan-400/30">
                        <div className="text-2xl font-bold text-cyan-300">{dayData.meals}</div>
                        <div className="text-cyan-200/70 text-sm">Meals Logged</div>
                      </div>
                      <div className="bg-green-900/40 rounded-lg p-4 border border-green-400/30">
                        <div className="text-2xl font-bold text-green-300">{dayData.protein.toFixed(1)}g</div>
                        <div className="text-green-200/70 text-sm">Protein</div>
                      </div>
                      <div className="bg-yellow-900/40 rounded-lg p-4 border border-yellow-400/30">
                        <div className="text-2xl font-bold text-yellow-300">{dayData.carbs.toFixed(1)}g</div>
                        <div className="text-yellow-200/70 text-sm">Carbs</div>
                      </div>
                      <div className="bg-orange-900/40 rounded-lg p-4 border border-orange-400/30">
                        <div className="text-2xl font-bold text-orange-300">{dayData.fat.toFixed(1)}g</div>
                        <div className="text-orange-200/70 text-sm">Fat</div>
                      </div>
                      <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-400/30">
                        <div className="text-2xl font-bold text-purple-300">
                          {((dayData.protein * 4 + dayData.carbs * 4 + dayData.fat * 9) / dayData.calories * 100).toFixed(1)}%
                        </div>
                        <div className="text-purple-200/70 text-sm">Macro Accuracy</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workouts Summary */}
                {viewMode === 'workouts' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-blue-300 mb-4">💪 WORKOUTS SUMMARY</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-900/40 rounded-lg p-4 border border-green-400/30">
                        <div className="text-2xl font-bold text-green-300">{dayData.workouts}</div>
                        <div className="text-green-200/70 text-sm">Workouts</div>
                      </div>
                      <div className="bg-cyan-900/40 rounded-lg p-4 border border-cyan-400/30">
                        <div className="text-2xl font-bold text-cyan-300">{dayData.workoutDuration}</div>
                        <div className="text-cyan-200/70 text-sm">Minutes</div>
                      </div>
                      <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-400/30">
                        <div className="text-2xl font-bold text-blue-300">{dayData.distance.toFixed(1)}km</div>
                        <div className="text-blue-200/70 text-sm">Distance</div>
                      </div>
                      <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-400/30">
                        <div className="text-2xl font-bold text-purple-300">
                          {dayData.workouts > 0 ? (dayData.workoutDuration / dayData.workouts).toFixed(0) : 0}
                        </div>
                        <div className="text-purple-200/70 text-sm">Avg Duration</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goals for Selected Date */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">🎯 GOALS FOR THIS DAY</h3>
                  {dayGoals.length > 0 ? (
                    <div className="space-y-3">
                      {dayGoals.map((goal, index) => (
                        <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-400/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-blue-300 capitalize">{goal.goal_type}</h4>
                              <p className="text-blue-200/70 text-sm">{goal.goal_notes}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-cyan-300">{goal.goal_value}</div>
                              <div className="text-cyan-200/70 text-xs">Target</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-blue-300/60">No goals set for this date</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-800/30 to-slate-800/40 backdrop-blur-xl border border-blue-400/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-300">{dashboardData.todayData.calories}</div>
            <div className="text-blue-200/70 text-sm">CALORIES TODAY</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-800/30 to-blue-800/40 backdrop-blur-xl border border-cyan-400/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-cyan-300">{dashboardData.todayData.meals}</div>
            <div className="text-cyan-200/70 text-sm">MEALS TODAY</div>
          </div>
          <div className="bg-gradient-to-br from-green-800/30 to-cyan-800/40 backdrop-blur-xl border border-green-400/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-300">{dashboardData.todayData.workoutDuration}</div>
            <div className="text-green-200/70 text-sm">MINUTES WORKED OUT</div>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-blue-800/40 backdrop-blur-xl border border-purple-400/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-300">{dashboardData.weeklyTotals.activeDays}</div>
            <div className="text-purple-200/70 text-sm">ACTIVE DAYS</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Calories Chart */}
          <div className="bg-slate-800/40 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-blue-300 mb-4 text-center">Daily Calories</h3>
            <Line data={caloriesChartData} options={chartOptions} />
          </div>

          {/* Workouts Chart */}
          <div className="bg-slate-800/40 border border-green-400/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-green-300 mb-4 text-center">Workout Duration</h3>
            <Bar data={workoutsChartData} options={chartOptions} />
          </div>

          {/* Weekly Totals */}
          <div className="bg-slate-800/40 border border-cyan-400/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-cyan-300 mb-4 text-center">Weekly Totals</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Total Calories:</span>
                <span className="text-blue-300 font-bold">{dashboardData.weeklyTotals.totalCalories}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Total Meals:</span>
                <span className="text-blue-300 font-bold">{dashboardData.weeklyTotals.totalMeals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Total Workouts:</span>
                <span className="text-blue-300 font-bold">{dashboardData.weeklyTotals.totalWorkouts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Total Distance:</span>
                <span className="text-blue-300 font-bold">{dashboardData.weeklyTotals.totalDistance.toFixed(1)} km</span>
              </div>
            </div>
          </div>

          {/* Macro Distribution */}
          <div className="bg-slate-800/40 border border-yellow-400/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-yellow-300 mb-4 text-center">Weekly Macros</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={macroChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    labels: { color: 'rgb(191, 219, 254)' }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-slate-800/40 border border-purple-400/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-purple-300">Goals & Progress</h3>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              {showGoalForm ? 'Cancel' : 'Add Goal'}
            </button>
          </div>

          {showGoalForm && (
            <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-purple-400/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Goal Type (e.g., calories, workouts)"
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                  className="bg-slate-800/50 border border-purple-400/30 rounded-lg p-3 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-purple-400"
                />
                <input
                  type="number"
                  placeholder="Target Value"
                  value={newGoal.value || ''}
                  onChange={(e) => setNewGoal({...newGoal, value: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800/50 border border-purple-400/30 rounded-lg p-3 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-purple-400"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newGoal.notes}
                  onChange={(e) => setNewGoal({...newGoal, notes: e.target.value})}
                  className="bg-slate-800/50 border border-purple-400/30 rounded-lg p-3 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <button
                onClick={handleAddGoal}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Add Goal
              </button>
            </div>
          )}

          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-blue-200/60 text-center py-8">No goals set yet. Add your first goal above!</p>
            ) : (
              goals.map((goal, index) => (
                <div key={index} className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-purple-300 capitalize">{goal.goal_type}</h4>
                      <p className="text-blue-200/80 text-sm">{goal.goal_notes}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-300 font-bold">{goal.goal_value}</div>
                      <div className="text-blue-200/60 text-xs">{new Date(goal.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchData}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
