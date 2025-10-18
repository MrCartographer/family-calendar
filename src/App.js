import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Calendar, LogOut } from 'lucide-react';

// Simple password authentication
const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const isAuth = localStorage.getItem('family-calendar-auth') === 'true';
    if (isAuth) {
      setAuthenticated(true);
      setUser({ id: 'family-user', name: 'Family Member' });
    }
  }, []);
  
  const login = (password) => {
    const correctPassword = process.env.REACT_APP_FAMILY_PASSWORD || 'Bruno';
    if (password === correctPassword) {
      localStorage.setItem('family-calendar-auth', 'true');
      setAuthenticated(true);
      setUser({ id: 'family-user', name: 'Family Member' });
      return true;
    }
    return false;
  };
  
  const logout = () => {
    localStorage.removeItem('family-calendar-auth');
    setAuthenticated(false);
    setUser(null);
  };
  
  return { authenticated, user, login, logout };
};

// Simple local storage for calendar data with year separation
const localAPI = {
  getCalendar: async (year) => {
    const savedWeeks = localStorage.getItem(`family-calendar-weeks-${year}`);
    return {
      id: 1,
      name: 'Family Calendar',
      year: year,
      weeks: savedWeeks ? JSON.parse(savedWeeks) : []
    };
  },
  updateWeeks: async (year, weeks) => {
    localStorage.setItem(`family-calendar-weeks-${year}`, JSON.stringify(weeks));
    return true;
  },
  getTripData: async () => {
    const savedDays = localStorage.getItem('family-calendar-trip-turks-caicos-2025');
    return savedDays ? JSON.parse(savedDays) : [];
  },
  updateTripData: async (days) => {
    localStorage.setItem('family-calendar-trip-turks-caicos-2025', JSON.stringify(days));
    return true;
  }
};

const WeeklyCalendar = () => {
  const { authenticated, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setLoginError('Incorrect password');
      setPassword('');
    } else {
      setLoginError('');
    }
  };
  const [calendar, setCalendar] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [editingWeek, setEditingWeek] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempTheme1, setTempTheme1] = useState('');
  const [tempTheme2, setTempTheme2] = useState('');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedView, setSelectedView] = useState('2026'); // '2025', '2026', or 'trip'
  const [tripDays, setTripDays] = useState([]);

  // Get current week number of the year
  const getCurrentWeekNumber = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Only highlight if we're viewing the current year
    if (selectedYear !== currentYear) return -1;
    
    // Find first Monday of the year
    let startOfYear = new Date(currentYear, 0, 1);
    while (startOfYear.getDay() !== 1) {
      startOfYear.setDate(startOfYear.getDate() + 1);
    }
    
    // Calculate weeks since first Monday
    const timeDiff = now - startOfYear;
    const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
    return weeksDiff + 1;
  };

  // Initialize 52 weeks with default data for a given year
  const initializeWeeks = (year) => {
    const weeks = [];
    // Find the first Monday of the year
    let startDate = new Date(year, 0, 1);
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }

    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weeks.push({
        id: i + 1,
        year: year,
        theme1: '',
        theme2: '',
        dateRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        events: [],
        expanded: false
      });
    }
    return weeks;
  };

  // Initialize trip days for Turks & Caicos (Oct 24 - Nov 6, 2025)
  const initializeTripDays = () => {
    const days = [];
    const startDate = new Date(2025, 9, 24); // Oct 24, 2025 (month is 0-indexed)

    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      days.push({
        id: i + 1,
        date: currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        theme1: '',
        theme2: '',
        events: [],
        expanded: false
      });
    }
    return days;
  };

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);

      const calendarData = await localAPI.getCalendar(selectedYear);

      setCalendar(calendarData);

      if (calendarData.weeks && calendarData.weeks.length > 0) {
        // Migrate existing single theme to dual theme structure
        const migratedWeeks = calendarData.weeks.map(week => {
          if (week.theme !== undefined && week.theme1 === undefined) {
            return {
              ...week,
              theme1: week.theme || '',
              theme2: '',
              theme: undefined,
              year: selectedYear
            };
          }
          return { ...week, year: selectedYear };
        });
        setWeeks(migratedWeeks);
      } else {
        setWeeks(initializeWeeks(selectedYear));
      }
    } catch (error) {
      console.error('Failed to load calendar:', error);
      setWeeks(initializeWeeks(selectedYear));
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const loadTripData = useCallback(async () => {
    try {
      setLoading(true);
      const savedDays = await localAPI.getTripData();

      if (savedDays && savedDays.length > 0) {
        setTripDays(savedDays);
      } else {
        setTripDays(initializeTripDays());
      }
    } catch (error) {
      console.error('Failed to load trip data:', error);
      setTripDays(initializeTripDays());
    } finally {
      setLoading(false);
    }
  }, []);

  // Load calendar data on mount and when year/view changes
  useEffect(() => {
    if (authenticated) {
      if (selectedView === 'trip') {
        loadTripData();
      } else {
        loadCalendarData();
      }
    }
  }, [authenticated, selectedYear, selectedView, loadCalendarData, loadTripData]);

  // Save weeks to local storage whenever they change (no debounce to prevent data loss)
  useEffect(() => {
    if (calendar && weeks.length > 0 && authenticated && selectedView !== 'trip') {
      localAPI.updateWeeks(selectedYear, weeks);
    }
  }, [weeks, calendar, authenticated, selectedYear, selectedView]);

  // Save trip days to local storage whenever they change (no debounce to prevent data loss)
  useEffect(() => {
    if (tripDays.length > 0 && authenticated && selectedView === 'trip') {
      localAPI.updateTripData(tripDays);
    }
  }, [tripDays, authenticated, selectedView]);

  const updateWeekTheme = (weekId, theme1, theme2 = '') => {
    if (selectedView === 'trip') {
      setTripDays(prev => prev.map(day =>
        day.id === weekId ? { ...day, theme1, theme2 } : day
      ));
    } else {
      setWeeks(prev => prev.map(week =>
        week.id === weekId ? { ...week, theme1, theme2 } : week
      ));
    }
  };

  const startEditingTheme = (week) => {
    setEditingWeek(week.id);
    setTempTheme1(week.theme1 || '');
    setTempTheme2(week.theme2 || '');
  };

  const finishEditingTheme = (weekId) => {
    updateWeekTheme(weekId, tempTheme1, tempTheme2);
    setEditingWeek(null);
    setTempTheme1('');
    setTempTheme2('');
  };

  const cancelEditingTheme = () => {
    setEditingWeek(null);
    setTempTheme1('');
    setTempTheme2('');
  };

  const toggleWeekExpanded = (weekId) => {
    if (selectedView === 'trip') {
      setTripDays(prev => prev.map(day =>
        day.id === weekId ? { ...day, expanded: !day.expanded } : day
      ));
    } else {
      setWeeks(prev => prev.map(week =>
        week.id === weekId ? { ...week, expanded: !week.expanded } : week
      ));
    }
  };

  const addEvent = (weekId) => {
    const newEvent = {
      id: Date.now(),
      text: 'New event',
      day: 'Monday'
    };

    if (selectedView === 'trip') {
      setTripDays(prev => prev.map(day =>
        day.id === weekId ? {
          ...day,
          events: [...day.events, newEvent],
          expanded: true
        } : day
      ));
    } else {
      setWeeks(prev => prev.map(week =>
        week.id === weekId ? {
          ...week,
          events: [...week.events, newEvent],
          expanded: true
        } : week
      ));
    }
    setEditingEvent(newEvent.id);
  };

  const updateEvent = (weekId, eventId, newText) => {
    if (selectedView === 'trip') {
      setTripDays(prev => prev.map(day =>
        day.id === weekId ? {
          ...day,
          events: day.events.map(event =>
            event.id === eventId ? { ...event, text: newText } : event
          )
        } : day
      ));
    } else {
      setWeeks(prev => prev.map(week =>
        week.id === weekId ? {
          ...week,
          events: week.events.map(event =>
            event.id === eventId ? { ...event, text: newText } : event
          )
        } : week
      ));
    }
  };

  const deleteEvent = (weekId, eventId) => {
    if (selectedView === 'trip') {
      setTripDays(prev => prev.map(day =>
        day.id === weekId ? {
          ...day,
          events: day.events.filter(event => event.id !== eventId)
        } : day
      ));
    } else {
      setWeeks(prev => prev.map(week =>
        week.id === weekId ? {
          ...week,
          events: week.events.filter(event => event.id !== eventId)
        } : week
      ));
    }
  };

  // Simplified - no complex member management for family use

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Calendar className="mx-auto text-blue-600 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Family Calendar</h1>
            <p className="text-gray-600">Enter the family password to access your calendar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter family password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2">{loginError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Access Calendar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto text-blue-600 mb-4 animate-pulse" size={48} />
          <p className="text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }


  // Main calendar view
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedView === 'trip' ? 'Turks & Caicos Trip Planner' : `${selectedYear} Weekly Planner`}
                </h1>
                <p className="text-gray-600">
                  {selectedView === 'trip' ? 'Oct 24 - Nov 6, 2025 • 14 days of paradise' : '52 weeks to plan and theme your year'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setSelectedYear(2025);
                    setSelectedView('2025');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === '2025'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  2025
                </button>
                <button
                  onClick={() => {
                    setSelectedYear(2026);
                    setSelectedView('2026');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === '2026'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  2026
                </button>
                <button
                  onClick={() => setSelectedView('trip')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedView === 'trip'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Turks & Caicos 2025
                </button>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {(selectedView === 'trip' ? tripDays : weeks).map((item) => {
            const currentWeekNumber = getCurrentWeekNumber();
            const isCurrentWeek = selectedView !== 'trip' && currentWeekNumber === item.id;

            return (
            <div key={item.id} className={`hover:bg-gray-50 transition-colors group ${isCurrentWeek ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleWeekExpanded(item.id)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                  >
                    {item.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <div className="w-12 text-sm text-gray-400 font-medium">
                    {selectedView === 'trip' ? `D${item.id}` : `W${item.id}`}
                  </div>
                  
                  <div className="flex-1">
                    {editingWeek === item.id ? (
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          value={tempTheme1}
                          onChange={(e) => setTempTheme1(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishEditingTheme(item.id);
                            if (e.key === 'Escape') cancelEditingTheme();
                          }}
                          placeholder="First theme..."
                          className="flex-1 px-2 py-1 border rounded font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 touch-manipulation"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={tempTheme2}
                          onChange={(e) => setTempTheme2(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishEditingTheme(item.id);
                            if (e.key === 'Escape') cancelEditingTheme();
                          }}
                          placeholder="Second theme..."
                          className="flex-1 px-2 py-1 border rounded font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 touch-manipulation"
                        />
                        <button
                          onClick={() => finishEditingTheme(item.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 touch-manipulation"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (item.theme1 || item.theme2) ? (
                      <div
                        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors touch-manipulation"
                        onClick={() => startEditingTheme(item)}
                      >
                        {item.theme1 && (
                          <span className="font-medium text-gray-800 hover:text-blue-600">
                            {item.theme1}
                          </span>
                        )}
                        {item.theme1 && item.theme2 && (
                          <span className="text-gray-400 mx-2">•</span>
                        )}
                        {item.theme2 && (
                          <span className="font-medium text-gray-800 hover:text-blue-600">
                            {item.theme2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditingTheme(item)}
                        className="w-full px-2 py-1 border rounded font-medium text-gray-400 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors touch-manipulation"
                      >
                        {selectedView === 'trip' ? 'Enter day theme...' : 'Enter week theme...'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {selectedView === 'trip' ? item.date : item.dateRange}
                  </div>

                  {item.events.length > 0 && (
                    <div className="flex gap-1">
                      {item.events.slice(0, 3).map((event, idx) => (
                        <div key={idx} className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      ))}
                      {item.events.length > 3 && (
                        <span className="text-xs text-gray-400">+{item.events.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {item.expanded && (
                <div className="px-4 pb-4 ml-8 border-l-2 border-blue-100">
                  <div className="space-y-2">
                    {item.events.map((event) => (
                      <div key={event.id} className="flex items-center gap-2 group">
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                        {editingEvent === event.id ? (
                          <input
                            type="text"
                            value={event.text}
                            onChange={(e) => updateEvent(item.id, event.id, e.target.value)}
                            onBlur={() => setEditingEvent(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingEvent(null);
                              if (e.key === 'Escape') setEditingEvent(null);
                            }}
                            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-blue-600"
                            onClick={() => setEditingEvent(event.id)}
                          >
                            {event.text}
                          </span>
                        )}
                        <button
                          onClick={() => deleteEvent(item.id, event.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addEvent(item.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add event
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;