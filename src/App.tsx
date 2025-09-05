import { useState } from "react";
import ChatMealLogger from "./components/ChatMealLogger";
import Dashboard from "./components/Dashboard";
import Navigation from "./components/Navigation";

export default function App() {
  const [currentView, setCurrentView] = useState<'meals' | 'dashboard'>('meals');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'meals' ? <ChatMealLogger /> : <Dashboard />}
    </div>
  );
}
