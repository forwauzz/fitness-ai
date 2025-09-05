import { useState } from "react";

interface NavigationProps {
  currentView: 'meals' | 'dashboard';
  onViewChange: (view: 'meals' | 'dashboard') => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-blue-400/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Fitness Coach
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            <button
              onClick={() => onViewChange('meals')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                currentView === 'meals'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-blue-200 hover:text-white hover:bg-blue-600/20'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span>Meal Logger</span>
              </div>
            </button>
            
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-blue-200 hover:text-white hover:bg-blue-600/20'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Dashboard</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
