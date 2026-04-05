import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Plus, Copy, Check, Trash2, ShieldAlert, Clock, Hash } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [secret, setSecret] = useState('');
  const [count, setCount] = useState(1);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) {
      setError("Admin Secret is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, count, durationDays: duration })
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedKeys(data.keys);
      } else {
        setError(data.error || "Failed to generate keys");
      }
    } catch (err) {
      console.error("Generation failed", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[300] p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full min-h-[600px]">
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-800 p-8 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-600 p-2 rounded-lg text-white">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Admin Panel</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Admin Secret</label>
                <input 
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter Secret"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-red-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Count</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="number"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      min="1"
                      max="50"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-red-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Days</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      min="1"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-red-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? "Generating..." : <><Plus size={18} /> Generate Keys</>}
              </button>

              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            </form>

            <button 
              onClick={onClose}
              className="w-full mt-8 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-bold transition-colors"
            >
              Exit Dashboard
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 bg-white dark:bg-gray-900 overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Generated Keys</h3>
              <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold text-gray-500">
                {generatedKeys.length} Keys
              </span>
            </div>

            {generatedKeys.length > 0 ? (
              <div className="grid gap-4">
                {generatedKeys.map((key, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={key}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 group hover:border-red-200 dark:hover:border-red-900/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400">
                        {index + 1}
                      </div>
                      <code className="text-lg font-mono font-bold text-gray-900 dark:text-white tracking-widest">
                        {key}
                      </code>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(key)}
                      className={cn(
                        "p-3 rounded-xl transition-all",
                        copiedKey === key 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-white dark:bg-gray-900 text-gray-400 hover:text-red-600 dark:hover:text-red-400 shadow-sm"
                      )}
                    >
                      {copiedKey === key ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                  <Key size={32} />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-bold">No keys generated yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Use the sidebar to create new license keys</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
