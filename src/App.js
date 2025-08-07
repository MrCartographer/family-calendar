import React, { useState, useEffect } from 'react';
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
    const correctPassword = process.env.REACT_APP_FAMILY_PASSWORD || 'family2026';
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

// Simple local storage for calendar data
const localAPI = {
  getCalendar: async () => {
    const savedWeeks = localStorage.getItem('family-calendar-weeks');
    return {
      id: 1,
      name: 'Family Calendar',
      weeks: savedWeeks ? JSON.parse(savedWeeks) : []
    };
  },
  updateWeeks: async (calendarId, weeks) => {
    localStorage.setItem('family-calendar-weeks', JSON.stringify(weeks));
    return true;
  }
};

const WeeklyCalendar = () => {
  const { user, authenticated, login, logout } = useAuth();
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

  // Initialize 52 weeks with default data
  const initializeWeeks = () => {
    const weeks = [];
    const startDate = new Date(2026, 0, 5); // January 5, 2026 (first Monday)
    
    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        id: i + 1,
        theme: '',
        dateRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        events: [],
        expanded: false
      });
    }
    return weeks;
  };

  // Load calendar data on mount
  useEffect(() => {
    if (authenticated) {
      loadCalendarData();
    }
  }, [authenticated]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const calendarData = await localAPI.getCalendar();
      
      setCalendar(calendarData);
      
      if (calendarData.weeks && calendarData.weeks.length > 0) {
        setWeeks(calendarData.weeks);
      } else {
        setWeeks(initializeWeeks());
      }
    } catch (error) {
      console.error('Failed to load calendar:', error);
      setWeeks(initializeWeeks());
    } finally {
      setLoading(false);
    }
  };

  // Save weeks to local storage whenever they change
  useEffect(() => {
    if (calendar && weeks.length > 0 && authenticated) {
      const debounceTimer = setTimeout(() => {
        localAPI.updateWeeks(calendar.id, weeks);
      }, 1000); // Debounce saves by 1 second
      
      return () => clearTimeout(debounceTimer);
    }
  }, [weeks, calendar, authenticated]);

  const updateWeekTheme = (weekId, newTheme) => {
    setWeeks(prev => prev.map(week => 
      week.id === weekId ? { ...week, theme: newTheme } : week
    ));
  };

  const toggleWeekExpanded = (weekId) => {
    setWeeks(prev => prev.map(week => 
      week.id === weekId ? { ...week, expanded: !week.expanded } : week
    ));
  };

  const addEvent = (weekId) => {
    const newEvent = {
      id: Date.now(),
      text: 'New event',
      day: 'Monday'
    };
    
    setWeeks(prev => prev.map(week => 
      week.id === weekId ? { 
        ...week, 
        events: [...week.events, newEvent],
        expanded: true 
      } : week
    ));
    setEditingEvent(newEvent.id);
  };

  const updateEvent = (weekId, eventId, newText) => {
    setWeeks(prev => prev.map(week => 
      week.id === weekId ? {
        ...week,
        events: week.events.map(event => 
          event.id === eventId ? { ...event, text: newText } : event
        )
      } : week
    ));
  };

  const deleteEvent = (weekId, eventId) => {
    setWeeks(prev => prev.map(week => 
      week.id === weekId ? {
        ...week,
        events: week.events.filter(event => event.id !== eventId)
      } : week
    ));
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
                <h1 className="text-2xl font-bold text-gray-800">2026 Weekly Planner</h1>
                <p className="text-gray-600">52 weeks to plan and theme your year</p>
              </div>
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
        
        <div className="divide-y divide-gray-100">
          {weeks.map((week) => (
            <div key={week.id} className="hover:bg-gray-50 transition-colors group">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleWeekExpanded(week.id)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                  >
                    {week.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  <div className="w-12 text-sm text-gray-400 font-medium">
                    W{week.id}
                  </div>
                  
                  <div className="flex-1">
                    {editingWeek === week.id ? (
                      <input
                        type="text"
                        value={week.theme}
                        onChange={(e) => updateWeekTheme(week.id, e.target.value)}
                        onBlur={() => setEditingWeek(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingWeek(null);
                          if (e.key === 'Escape') setEditingWeek(null);
                        }}
                        placeholder="Enter week theme..."
                        className="w-full px-2 py-1 border rounded font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        autoFocus
                      />
                    ) : week.theme ? (
                      <span 
                        className="font-medium text-gray-800 cursor-pointer hover:text-blue-600 px-2 py-1 hover:bg-blue-50 rounded"
                        onClick={() => setEditingWeek(week.id)}
                      >
                        {week.theme}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value=""
                        onChange={(e) => {
                          updateWeekTheme(week.id, e.target.value);
                          setEditingWeek(week.id);
                        }}
                        placeholder="Enter week theme..."
                        className="w-full px-2 py-1 border rounded font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        onFocus={() => setEditingWeek(week.id)}
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {week.dateRange}
                  </div>
                  
                  {week.events.length > 0 && (
                    <div className="flex gap-1">
                      {week.events.slice(0, 3).map((event, idx) => (
                        <div key={idx} className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      ))}
                      {week.events.length > 3 && (
                        <span className="text-xs text-gray-400">+{week.events.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {week.expanded && (
                <div className="px-4 pb-4 ml-8 border-l-2 border-blue-100">
                  <div className="space-y-2">
                    {week.events.map((event) => (
                      <div key={event.id} className="flex items-center gap-2 group">
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                        {editingEvent === event.id ? (
                          <input
                            type="text"
                            value={event.text}
                            onChange={(e) => updateEvent(week.id, event.id, e.target.value)}
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
                          onClick={() => deleteEvent(week.id, event.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addEvent(week.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add event
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;