import { useState, useEffect } from "react";

interface ProfileData {
  user_id: string;
  created_at: string;
  updated_at: string;
  preferences: {
    favorite_foods: string[];
    favorite_snacks: string[];
    grocery_items: string[];
    dietary_restrictions: string[];
    meal_timing_preferences: Record<string, any>;
  };
  learning_metrics: {
    total_predictions: number;
    accuracy_trend: number[];
    model_confidence: number;
    personalization_score: number;
  };
  dietary_patterns: {
    average_meal_size: Record<string, any>;
    meal_frequency: Record<string, any>;
    macro_preferences: {
      protein_ratio: number;
      carbs_ratio: number;
      fat_ratio: number;
    };
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<'favorite_foods' | 'favorite_snacks' | 'grocery_items'>('favorite_foods');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addPreference = async () => {
    if (!newItem.trim() || !profile) return;

    try {
      const response = await fetch("http://localhost:3000/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedCategory,
          items: newItem.trim()
        })
      });

      if (!response.ok) throw new Error("Failed to add preference");
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setNewItem("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const removePreference = async (category: string, item: string) => {
    if (!profile) return;

    try {
      const updatedPreferences = {
        ...profile.preferences,
        [category]: profile.preferences[category as keyof typeof profile.preferences].filter((i: string) => i !== item)
      };

      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          preferences: updatedPreferences
        })
      });

      if (!response.ok) throw new Error("Failed to remove preference");
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-300">Loading profile...</div>
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

  if (!profile) return null;

  return (
    <div className="flex items-center justify-center p-4 pt-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative bg-gradient-to-br from-blue-800/20 to-slate-800/30 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl shadow-blue-500/20 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent mb-4">
              AI LEARNING PROFILE
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
            <p className="text-blue-200/80 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Personalize your AI coach by sharing your preferences and dietary patterns
            </p>
          </div>

          {/* Learning Metrics */}
          <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-blue-300 mb-4">MODEL LEARNING STATUS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-lg p-4 text-center border border-cyan-400/30">
                <div className="text-2xl font-bold text-cyan-300">{profile.learning_metrics.total_predictions}</div>
                <div className="text-cyan-200/70 text-sm">PREDICTIONS</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/40 to-slate-800/40 rounded-lg p-4 text-center border border-blue-400/30">
                <div className="text-2xl font-bold text-blue-300">{(profile.learning_metrics.model_confidence * 100).toFixed(1)}%</div>
                <div className="text-blue-200/70 text-sm">CONFIDENCE</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800/40 to-cyan-800/40 rounded-lg p-4 text-center border border-slate-400/30">
                <div className="text-2xl font-bold text-slate-300">{(profile.learning_metrics.personalization_score * 100).toFixed(1)}%</div>
                <div className="text-slate-200/70 text-sm">PERSONALIZED</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-800/40 to-blue-800/40 rounded-lg p-4 text-center border border-cyan-400/30">
                <div className="text-2xl font-bold text-cyan-300">{profile.preferences.favorite_foods.length + profile.preferences.favorite_snacks.length + profile.preferences.grocery_items.length}</div>
                <div className="text-cyan-200/70 text-sm">PREFERENCES</div>
              </div>
            </div>
          </div>

          {/* Add Preferences */}
          <div className="mb-8 bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-blue-300 mb-4">ADD PREFERENCES</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="bg-slate-700/50 border border-blue-400/30 rounded-lg p-3 text-blue-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="favorite_foods">Favorite Foods</option>
                <option value="favorite_snacks">Favorite Snacks</option>
                <option value="grocery_items">Grocery Items</option>
              </select>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter item name..."
                className="flex-1 bg-slate-700/50 border border-blue-400/30 rounded-lg p-3 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={addPreference}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Add
              </button>
            </div>
          </div>

          {/* Current Preferences */}
          <div className="space-y-6">
            {(['favorite_foods', 'favorite_snacks', 'grocery_items'] as const).map((category) => (
              <div key={category} className="bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-blue-300 mb-4 capitalize">
                  {category.replace('_', ' ')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences[category].map((item: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-900/40 border border-blue-400/30 rounded-lg px-3 py-2"
                    >
                      <span className="text-blue-200 text-sm">{item}</span>
                      <button
                        onClick={() => removePreference(category, item)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {profile.preferences[category].length === 0 && (
                    <div className="text-blue-300/60 text-sm">No items added yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-blue-300/60 text-sm">
              The more preferences you add, the better your AI coach can personalize predictions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
