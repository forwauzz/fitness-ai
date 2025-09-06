import { useState } from "react";
import ChatMealLogger from "./components/ChatMealLogger";
import Dashboard from "./components/Dashboard";
import Navigation from "./components/Navigation";
import Profile from "./components/Profile";
import MLTrainingDashboard from "./components/MLTrainingDashboard";
import Calendar from "./components/Calendar";

export default function App() {
  const [currentView, setCurrentView] = useState<'meals' | 'dashboard' | 'profile' | 'ml-training' | 'calendar'>('meals');

  const renderView = () => {
    switch (currentView) {
      case 'meals':
        return <ChatMealLogger />;
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'ml-training':
        return <MLTrainingDashboard />;
      case 'calendar':
        return <Calendar />;
      default:
        return <ChatMealLogger />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {renderView()}
    </div>
  );
}
