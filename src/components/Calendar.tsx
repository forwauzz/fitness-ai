import { useState, useEffect } from "react";
import dayjs from "dayjs";

interface CalendarDay {
  date: string;
  meals: number;
  workouts: number;
  hasData: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface MealInput {
  meal_type: string;
  items: string;
  quantities: string;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealInput, setMealInput] = useState<MealInput>({
    meal_type: 'breakfast',
    items: '',
    quantities: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/calendar/data");
      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    }
  };

  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');
    
    const days: CalendarDay[] = [];
    let current = startOfCalendar;
    
    while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayData = calendarData.find(d => d.date === dateStr) || {
        date: dateStr,
        meals: 0,
        workouts: 0,
        hasData: false,
        isToday: current.isSame(dayjs(), 'day'),
        isSelected: selectedDate === dateStr
      };
      
      days.push({
        ...dayData,
        isToday: current.isSame(dayjs(), 'day'),
        isSelected: selectedDate === dateStr
      });
      
      current = current.add(1, 'day');
    }
    
    return days;
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowMealModal(true);
    setMealInput({
      meal_type: 'breakfast',
      items: '',
      quantities: ''
    });
  };

  const handleMealSubmit = async () => {
    if (!selectedDate || !mealInput.items.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/log-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${mealInput.meal_type}: ${mealInput.items}${mealInput.quantities ? `, ${mealInput.quantities}` : ''}`
        })
      });
      
      if (response.ok) {
        await fetchCalendarData();
        setShowMealModal(false);
        setMealInput({ meal_type: 'breakfast', items: '', quantities: '' });
      }
    } catch (error) {
      console.error("Failed to log meal:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (day: CalendarDay) => {
    if (day.meals > 0 && day.workouts > 0) return 'complete';
    if (day.meals > 0 || day.workouts > 0) return 'partial';
    return 'empty';
  };

  const getDayColor = (day: CalendarDay) => {
    const status = getDayStatus(day);
    if (day.isSelected) return 'bg-blue-500 text-white';
    if (day.isToday) return 'bg-cyan-500 text-white';
    
    switch (status) {
      case 'complete': return 'bg-green-500/80 text-white';
      case 'partial': return 'bg-yellow-500/80 text-white';
      default: return 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50';
    }
  };

  const days = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-800/30 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-blue-300">📅 TRAINING CALENDAR</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-blue-300 transition-colors"
          >
            ←
          </button>
          <span className="text-blue-300 font-semibold min-w-[120px] text-center">
            {currentMonth.format('MMMM YYYY')}
          </span>
          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-blue-300 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/80 rounded"></div>
          <span className="text-blue-200">Complete Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500/80 rounded"></div>
          <span className="text-blue-200">Partial Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cyan-500 rounded"></div>
          <span className="text-blue-200">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-700/50 rounded"></div>
          <span className="text-blue-200">Empty Day</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-blue-300 font-semibold text-sm">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day.date)}
            className={`p-2 h-16 rounded-lg transition-all duration-200 ${getDayColor(day)}`}
          >
            <div className="text-sm font-medium">{dayjs(day.date).format('D')}</div>
            <div className="text-xs mt-1">
              {day.meals > 0 && <span>🍽️ {day.meals}</span>}
              {day.workouts > 0 && <span className="ml-1">💪 {day.workouts}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-400/20 rounded-lg">
          <h3 className="text-blue-300 font-semibold mb-2">
            {dayjs(selectedDate).format('MMMM D, YYYY')}
          </h3>
          <p className="text-blue-200/80 text-sm">
            Click on any day to add meals or workouts. Green = complete day, Yellow = partial day.
          </p>
        </div>
      )}

      {/* Meal Input Modal */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-blue-400/30 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-blue-300 mb-4">
              Add Meal for {dayjs(selectedDate).format('MMMM D, YYYY')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Meal Type
                </label>
                <select
                  value={mealInput.meal_type}
                  onChange={(e) => setMealInput({...mealInput, meal_type: e.target.value})}
                  className="w-full bg-slate-700/50 border border-blue-400/30 rounded-lg p-3 text-blue-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="pre-workout">Pre-Workout</option>
                  <option value="post-workout">Post-Workout</option>
                </select>
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Food Items
                </label>
                <input
                  type="text"
                  value={mealInput.items}
                  onChange={(e) => setMealInput({...mealInput, items: e.target.value})}
                  placeholder="e.g., chicken breast, rice, vegetables"
                  className="w-full bg-slate-700/50 border border-blue-400/30 rounded-lg p-3 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-cyan-400"
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Quantities (Optional)
                </label>
                <input
                  type="text"
                  value={mealInput.quantities}
                  onChange={(e) => setMealInput({...mealInput, quantities: e.target.value})}
                  placeholder="e.g., 150g, 1 cup, 2 pieces"
                  className="w-full bg-slate-700/50 border border-blue-400/30 rounded-lg p-3 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMealModal(false)}
                className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMealSubmit}
                disabled={loading || !mealInput.items.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
