import { useState, lazy, Suspense } from "react";
import ChatMealLogger from "./components/ChatMealLogger";
const Dashboard = lazy(() => import("./components/Dashboard"));
import Navigation from "./components/Navigation";

export default function App() {
  const [currentView, setCurrentView] = useState<'meals' | 'dashboard'>('meals');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'meals' ? (
        <ChatMealLogger />
      ) : (
        <Suspense fallback={
          <div className="flex items-center justify-center p-4 pt-8">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-300 text-lg">Loading Dashboard...</p>
            </div>
          </div>
        }>
          <Dashboard />
        </Suspense>
      )}
    </div>
  );
}
