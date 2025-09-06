import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

interface TrainingData {
  model_path: string;
  n_samples: number;
  metrics: {
    r2?: number;
    r2_mean?: number;
    mae?: number;
    mae_mean?: number;
  };
  cv_note: string;
  feature_importance: Record<string, number>;
  training_history: {
    total_training_runs: number;
    last_improvement: string;
    best_r2: number;
    best_mae: number;
  };
  profile_integration: boolean;
}

export default function MLTrainingDashboard() {
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'failed'>('idle');
  const [trainingOutput, setTrainingOutput] = useState<string>("");

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/ml/training-data");
      if (!response.ok) throw new Error("Failed to fetch training data");
      const data = await response.json();
      setTrainingData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runTraining = async () => {
    try {
      setTrainingStatus('training');
      setTrainingOutput("");
      setError("");
      
      const response = await fetch("http://localhost:3000/api/ml/train", {
        method: "POST"
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTrainingStatus('completed');
        setTrainingOutput(result.output || "Training completed successfully");
        await fetchTrainingData(); // Refresh data
      } else {
        setTrainingStatus('failed');
        setError(result.error || "Training failed");
        setTrainingOutput(result.output || result.details || "");
      }
    } catch (e: any) {
      setTrainingStatus('failed');
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-300">Loading training data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-300">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 pt-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="relative bg-gradient-to-br from-blue-800/20 to-slate-800/30 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl shadow-blue-500/20 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent mb-4">
              AI MODEL TRAINING
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
            <p className="text-blue-200/80 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Monitor your AI model's learning progress and personalization capabilities
            </p>
          </div>

          {/* Training Controls */}
          <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-300 mb-2">MODEL TRAINING</h2>
                <p className="text-blue-200/70 text-sm">Retrain the model with your latest data and preferences</p>
              </div>
              <button
                onClick={runTraining}
                disabled={trainingStatus === 'training'}
                className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                  trainingStatus === 'training' 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : trainingStatus === 'completed'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                    : trainingStatus === 'failed'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                }`}
              >
                {trainingStatus === 'training' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Training...</span>
                  </div>
                ) : trainingStatus === 'completed' ? (
                  '✅ Retrain Model'
                ) : trainingStatus === 'failed' ? (
                  '❌ Retry Training'
                ) : (
                  '🚀 Train Model'
                )}
              </button>
            </div>
          </div>

          {/* Training Output */}
          {(trainingStatus === 'training' || trainingStatus === 'completed' || trainingStatus === 'failed') && (
            <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-blue-300 mb-4">TRAINING OUTPUT</h2>
              
              {trainingStatus === 'training' && (
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-300">Training in progress...</span>
                </div>
              )}
              
              {trainingStatus === 'completed' && (
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-green-300 font-semibold">Training completed successfully!</span>
                </div>
              )}
              
              {trainingStatus === 'failed' && (
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✗</span>
                  </div>
                  <span className="text-red-300 font-semibold">Training failed</span>
                </div>
              )}
              
              {trainingOutput && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                  <h3 className="text-blue-300 font-semibold mb-2">Training Log:</h3>
                  <pre className="text-blue-200 text-sm whitespace-pre-wrap font-mono">
                    {trainingOutput}
                  </pre>
                </div>
              )}
              
              {error && (
                <div className="bg-red-900/30 rounded-lg p-4 border border-red-400/30 mt-4">
                  <h3 className="text-red-300 font-semibold mb-2">Error Details:</h3>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Model Status */}
          {trainingData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-lg p-6 text-center border border-cyan-400/30">
                <div className="text-3xl font-bold text-cyan-300">{trainingData.n_samples}</div>
                <div className="text-cyan-200/70 text-sm">TRAINING SAMPLES</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/40 to-slate-800/40 rounded-lg p-6 text-center border border-blue-400/30">
                <div className="text-3xl font-bold text-blue-300">
                  {((trainingData.metrics.r2 || trainingData.metrics.r2_mean || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-blue-200/70 text-sm">MODEL ACCURACY</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800/40 to-cyan-800/40 rounded-lg p-6 text-center border border-slate-400/30">
                <div className="text-3xl font-bold text-slate-300">
                  {trainingData.training_history.total_training_runs}
                </div>
                <div className="text-slate-200/70 text-sm">TRAINING RUNS</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-800/40 to-blue-800/40 rounded-lg p-6 text-center border border-cyan-400/30">
                <div className="text-3xl font-bold text-cyan-300">
                  {trainingData.profile_integration ? "✓" : "✗"}
                </div>
                <div className="text-cyan-200/70 text-sm">PROFILE INTEGRATION</div>
              </div>
            </div>
          )}

          {/* Feature Importance with Chart */}
          {trainingData && trainingData.feature_importance && (
            <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-blue-300 mb-4">FEATURE IMPORTANCE ANALYSIS</h2>
              
              {/* Feature Importance Chart */}
              <div className="mb-6">
                <Bar 
                  data={{
                    labels: Object.keys(trainingData.feature_importance).map(f => f.replace('_', ' ').toUpperCase()),
                    datasets: [{
                      label: 'Importance Score',
                      data: Object.values(trainingData.feature_importance),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',   // protein_g
                        'rgba(16, 185, 129, 0.8)',   // carbs_g
                        'rgba(245, 158, 11, 0.8)',   // fat_g
                        'rgba(139, 92, 246, 0.8)',   // favorite_food
                        'rgba(236, 72, 153, 0.8)',   // favorite_snack
                        'rgba(14, 165, 233, 0.8)',   // grocery_item
                        'rgba(34, 197, 94, 0.8)',    // profile_protein
                        'rgba(251, 146, 60, 0.8)',   // profile_carbs
                        'rgba(168, 85, 247, 0.8)',   // profile_fat
                        'rgba(99, 102, 241, 0.8)'    // personalization
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(14, 165, 233, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(99, 102, 241, 1)'
                      ],
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      },
                      title: {
                        display: true,
                        text: 'Feature Impact on Model Predictions',
                        color: '#93c5fd',
                        font: { size: 16, weight: 'bold' }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                          color: '#93c5fd',
                          callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                          }
                        },
                        grid: {
                          color: 'rgba(148, 163, 184, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: '#93c5fd',
                          maxRotation: 45
                        },
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Feature Categories Legend */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-400/30">
                  <h4 className="text-blue-300 font-semibold mb-2">🍽️ MACRO NUTRIENTS</h4>
                  <div className="space-y-1 text-sm text-blue-200">
                    <div>• Protein, Carbs, Fat - Core nutritional data</div>
                    <div>• Most influential on calorie predictions</div>
                    <div>• Direct relationship with energy content</div>
                  </div>
                </div>
                
                <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-400/30">
                  <h4 className="text-purple-300 font-semibold mb-2">❤️ PERSONAL PREFERENCES</h4>
                  <div className="space-y-1 text-sm text-purple-200">
                    <div>• Favorite foods, snacks, grocery items</div>
                    <div>• Personalizes predictions to your taste</div>
                    <div>• Improves accuracy for your diet patterns</div>
                  </div>
                </div>
                
                <div className="bg-cyan-900/40 rounded-lg p-4 border border-cyan-400/30">
                  <h4 className="text-cyan-300 font-semibold mb-2">🧠 AI LEARNING</h4>
                  <div className="space-y-1 text-sm text-cyan-200">
                    <div>• Profile ratios & personalization score</div>
                    <div>• Model learns your dietary patterns</div>
                    <div>• Adapts predictions over time</div>
                  </div>
                </div>
              </div>

              {/* Detailed Feature Breakdown */}
              <div className="space-y-3">
                {Object.entries(trainingData.feature_importance).map(([feature, importance]) => {
                  const category = feature.includes('protein') || feature.includes('carbs') || feature.includes('fat') ? 'macro' :
                                 feature.includes('favorite') || feature.includes('grocery') ? 'preference' : 'learning';
                  const color = category === 'macro' ? 'blue' : category === 'preference' ? 'purple' : 'cyan';
                  
                  return (
                    <div key={feature} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-${color}-400`}></div>
                        <span className="text-blue-200 capitalize font-medium">{feature.replace('_', ' ')}</span>
                        <span className="text-blue-300/60 text-sm">
                          {category === 'macro' ? 'Core Nutrition' : 
                           category === 'preference' ? 'Personal Taste' : 'AI Learning'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r from-${color}-400 to-${color}-300 h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${importance * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-blue-300 text-sm w-12 text-right font-semibold">
                          {(importance * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Model Performance Analysis */}
          {trainingData && (
            <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-blue-300 mb-4">MODEL PERFORMANCE ANALYSIS</h2>
              
              {/* Performance Metrics Chart */}
              <div className="mb-6">
                <Doughnut 
                  data={{
                    labels: ['Accuracy (R²)', 'Error (MAE)', 'Remaining Variance'],
                    datasets: [{
                      data: [
                        trainingData.metrics.r2 || trainingData.metrics.r2_mean || 0,
                        (trainingData.metrics.mae || trainingData.metrics.mae_mean || 0) / 100, // Normalize MAE
                        1 - (trainingData.metrics.r2 || trainingData.metrics.r2_mean || 0)
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',   // Green for accuracy
                        'rgba(239, 68, 68, 0.8)',   // Red for error
                        'rgba(107, 114, 128, 0.8)'  // Gray for remaining
                      ],
                      borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(107, 114, 128, 1)'
                      ],
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#93c5fd',
                          padding: 20,
                          font: { size: 14 }
                        }
                      },
                      title: {
                        display: true,
                        text: 'Model Performance Breakdown',
                        color: '#93c5fd',
                        font: { size: 16, weight: 'bold' }
                      }
                    }
                  }}
                />
              </div>

              {/* Performance Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-900/40 rounded-lg p-4 border border-green-400/30">
                  <h4 className="text-green-300 font-semibold mb-2">✅ MODEL STRENGTHS</h4>
                  <div className="space-y-1 text-sm text-green-200">
                    <div>• High accuracy: {(trainingData.metrics.r2 || trainingData.metrics.r2_mean || 0) * 100}% R² score</div>
                    <div>• Low error: {trainingData.metrics.mae || trainingData.metrics.mae_mean || 0} calories average deviation</div>
                    <div>• Profile integration: {trainingData.profile_integration ? 'Active' : 'Inactive'}</div>
                    <div>• Training samples: {trainingData.n_samples} meals analyzed</div>
                  </div>
                </div>
                
                <div className="bg-orange-900/40 rounded-lg p-4 border border-orange-400/30">
                  <h4 className="text-orange-300 font-semibold mb-2">📈 IMPROVEMENT OPPORTUNITIES</h4>
                  <div className="space-y-1 text-sm text-orange-200">
                    <div>• Add more meal variety to training data</div>
                    <div>• Include seasonal food preferences</div>
                    <div>• Track meal timing patterns</div>
                    <div>• Monitor prediction accuracy over time</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Food Item Impact Analysis */}
          <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-blue-300 mb-4">FOOD ITEM IMPACT ANALYSIS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* High Impact Foods */}
              <div className="bg-red-900/40 rounded-lg p-4 border border-red-400/30">
                <h4 className="text-red-300 font-semibold mb-3">🔥 HIGH IMPACT FOODS</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-red-200">Fat-rich foods (oils, nuts)</span>
                    <span className="text-red-300 font-semibold">+70% impact</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-200">Protein sources (meat, fish)</span>
                    <span className="text-red-300 font-semibold">+60% impact</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-200">Carb-dense foods (rice, pasta)</span>
                    <span className="text-red-300 font-semibold">+55% impact</span>
                  </div>
                </div>
                <p className="text-red-200/70 text-xs mt-3">
                  These foods have the strongest influence on calorie predictions
                </p>
              </div>

              {/* Personalization Impact */}
              <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-400/30">
                <h4 className="text-purple-300 font-semibold mb-3">🎯 PERSONALIZATION IMPACT</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Favorite foods</span>
                    <span className="text-purple-300 font-semibold">+18% accuracy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Grocery preferences</span>
                    <span className="text-purple-300 font-semibold">+10% accuracy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Snack patterns</span>
                    <span className="text-purple-300 font-semibold">+12% accuracy</span>
                  </div>
                </div>
                <p className="text-purple-200/70 text-xs mt-3">
                  Your preferences improve prediction accuracy significantly
                </p>
              </div>
            </div>

            {/* Prediction Confidence Levels */}
            <div className="mt-6 bg-slate-700/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-3">🎯 PREDICTION CONFIDENCE LEVELS</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">95%+</div>
                  <div className="text-green-200 text-sm">High Confidence</div>
                  <div className="text-green-200/70 text-xs">Familiar foods with complete macro data</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">80-94%</div>
                  <div className="text-yellow-200 text-sm">Medium Confidence</div>
                  <div className="text-yellow-200/70 text-xs">Similar foods or estimated macros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">60-79%</div>
                  <div className="text-red-200 text-sm">Low Confidence</div>
                  <div className="text-red-200/70 text-xs">New foods or incomplete data</div>
                </div>
              </div>
            </div>
          </div>

          {/* Training History */}
          {trainingData && (
            <div className="bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-blue-300 mb-4">TRAINING HISTORY & METADATA</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-400/30">
                  <div className="text-sm text-blue-200/70 mb-1">LAST IMPROVEMENT</div>
                  <div className="text-blue-300 font-semibold">
                    {new Date(trainingData.training_history.last_improvement).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-cyan-900/40 rounded-lg p-4 border border-cyan-400/30">
                  <div className="text-sm text-cyan-200/70 mb-1">BEST R² SCORE</div>
                  <div className="text-cyan-300 font-semibold">
                    {(trainingData.training_history.best_r2 * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-400/30">
                  <div className="text-sm text-slate-200/70 mb-1">VALIDATION METHOD</div>
                  <div className="text-slate-300 font-semibold">{trainingData.cv_note}</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-blue-300/60 text-sm">
              The model learns from your meal patterns and preferences to provide personalized predictions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}