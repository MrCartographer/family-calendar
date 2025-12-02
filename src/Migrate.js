import React, { useState } from 'react';
import { Calendar, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const Migrate = () => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState([]);

  const handleMigrate = async (e) => {
    e.preventDefault();
    setMigrating(true);
    setResults([]);
    setStatus({ type: '', message: '' });

    const years = [2025, 2026];
    const newResults = [];

    for (const year of years) {
      const localKey = `family-calendar-weeks-${year}`;
      const savedWeeks = localStorage.getItem(localKey);

      if (!savedWeeks) {
        newResults.push({
          year,
          success: false,
          message: `No local data found for ${year}`,
          skipped: true
        });
        continue;
      }

      try {
        const weeks = JSON.parse(savedWeeks);
        const res = await fetch(`${API_BASE}/migrate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Family-Password': password
          },
          body: JSON.stringify({ year, weeks })
        });

        const data = await res.json();

        if (res.ok) {
          newResults.push({
            year,
            success: !data.skipped,
            message: data.message,
            skipped: data.skipped
          });
        } else {
          newResults.push({
            year,
            success: false,
            message: data.error || 'Migration failed'
          });
        }
      } catch (error) {
        newResults.push({
          year,
          success: false,
          message: `Error: ${error.message}`
        });
      }
    }

    setResults(newResults);
    setMigrating(false);

    const successCount = newResults.filter(r => r.success).length;
    if (successCount > 0) {
      setStatus({
        type: 'success',
        message: `Successfully migrated ${successCount} year(s) to Redis!`
      });
    } else if (newResults.every(r => r.skipped)) {
      setStatus({
        type: 'warning',
        message: 'No new data to migrate (already exists in Redis or no local data)'
      });
    } else {
      setStatus({
        type: 'error',
        message: 'Migration failed. Check the results below.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="text-center mb-8">
          <Calendar className="mx-auto text-blue-600 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Data Migration</h1>
          <p className="text-gray-600">
            Transfer your calendar data from localStorage to Redis for multi-device sync
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Before you begin:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Make sure you're on the device with your calendar data</li>
                <li>This will copy data TO Redis (won't delete local data)</li>
                <li>Existing Redis data won't be overwritten</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleMigrate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter family password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={migrating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            {migrating ? 'Migrating...' : 'Migrate Data to Redis'}
          </button>
        </form>

        {status.message && (
          <div className={`mt-6 p-4 rounded-lg ${
            status.type === 'success' ? 'bg-green-50 border border-green-200' :
            status.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              status.type === 'success' ? 'text-green-800' :
              status.type === 'warning' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              {status.message}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-700">Migration Results:</h3>
            {results.map((result) => (
              <div
                key={result.year}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.success ? 'bg-green-50' :
                  result.skipped ? 'bg-gray-50' :
                  'bg-red-50'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : result.skipped ? (
                  <AlertCircle className="text-gray-400" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <div>
                  <p className="font-medium text-gray-800">{result.year}</p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go to Calendar
          </a>
        </div>
      </div>
    </div>
  );
};

export default Migrate;
