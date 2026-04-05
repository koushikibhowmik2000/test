import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, BarChart3, Trophy, XCircle, CheckCircle2, Lock, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

interface UpgradeModalProps {
  onClose: () => void;
  userId: string;
  userEmail: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, userId, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/redeem-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), userId })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Success! Your Pro access has been activated.");
        onClose();
        window.location.reload(); // Refresh to update profile state
      } else {
        setError(data.error || "Failed to redeem key");
      }
    } catch (error) {
      console.error("Redemption failed", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <XCircle size={24} />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Redeem <span className="text-blue-600">PRO</span> Access</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Enter your 16-character license key to unlock all professional features for 30 days.
          </p>

          <form onSubmit={handleRedeem} className="space-y-4 mb-8">
            <div>
              <input 
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-blue-500 outline-none font-mono text-center text-xl tracking-widest uppercase"
                maxLength={20}
                required
              />
              {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
            </div>

            <button 
              type="submit"
              disabled={loading || !key.trim()}
              className={cn(
                "w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2",
                (loading || !key.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "Verifying..." : "Redeem Now"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Unlock Advanced Analysis & Charts</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Unlimited Daily Typing Tests</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Unlock All Achievements & Badges</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-8 uppercase tracking-widest font-bold">
            Contact site owner to get your license key
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradeModal;
