import React, { useState, useEffect, useMemo } from 'react';
import TypingTest from './components/TypingTest';
import { Keyboard, ShieldCheck, Moon, Sun, LogIn, LogOut, BarChart3, History, User as UserIcon, TrendingUp, Trophy, XCircle, Lock } from 'lucide-react';
import { auth, signInWithGoogle, logout, getUserResults, getUserProfile } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from './lib/utils';
import { Flame } from 'lucide-react';
import AchievementsModal from './components/Achievements';
import PracticeCalendar from './components/Calendar';

import Analysis from './components/Analysis';
import UpgradeModal from './components/UpgradeModal';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'test' | 'analysis'>('test');
  const [results, setResults] = useState<any[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        getUserResults(user.uid, (data) => {
          setResults(data);
        });
        getUserProfile(user.uid, (data) => {
          setProfile(data);
        });
      } else {
        setResults([]);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const isPro = useMemo(() => {
    if (!profile?.proUntil) return false;
    const proUntilDate = profile.proUntil.toDate ? profile.proUntil.toDate() : new Date(profile.proUntil);
    return proUntilDate > new Date();
  }, [profile]);

  const handleViewAnalysis = () => {
    if (!user) {
      handleLogin();
      return;
    }
    if (isPro) {
      setView('analysis');
    } else {
      setShowUpgrade(true);
    }
  };

  const handleViewAchievements = () => {
    if (!user) {
      handleLogin();
      return;
    }
    if (isPro) {
      setShowAchievements(true);
    } else {
      setShowUpgrade(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('test')}>
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Keyboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">ProType <span className="text-blue-600">Exam</span></h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">Official Mock Platform</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <button onClick={() => setView('test')} className={cn("hover:text-blue-600 transition-colors", view === 'test' && "text-blue-600")}>Typing Test</button>
            {user && (
              <button 
                onClick={handleViewAnalysis} 
                className={cn(
                  "flex items-center gap-1 transition-colors", 
                  view === 'analysis' ? "text-blue-600" : "hover:text-blue-600",
                  !isPro && "text-gray-400"
                )}
              >
                Analysis {!isPro && <Lock size={12} />}
              </button>
            )}
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            
            {user && (
              <button 
                onClick={handleViewAchievements}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full border transition-colors",
                  isPro 
                    ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                    : "text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                )}
                title={isPro ? "View Achievements" : "Unlock Achievements"}
              >
                <Trophy size={16} fill={isPro ? "currentColor" : "none"} />
                <span className="font-black text-sm">Achievements</span>
                {!isPro && <Lock size={12} />}
              </button>
            )}

            {user && (
              <button 
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                title="View Practice History"
              >
                <Flame size={16} fill="currentColor" className={profile?.streak > 0 ? 'animate-pulse' : ''} />
                <span className="font-black text-sm">{profile?.streak || 0}</span>
              </button>
            )}
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user?.email === 'koushikibhowmik2000@gmail.com' && (
              <button 
                onClick={() => setShowAdmin(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-black hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/30"
              >
                <ShieldCheck size={18} />
                Admin
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600" />
                  <span className="text-xs font-bold dark:text-white">{user.displayName}</span>
                </div>
                <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-xs"
              >
                <LogIn size={16} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-12 px-4">
          {view === 'test' ? (
            <>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                  Master Your <span className="text-blue-600">Typing Speed</span>
                </h2>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Simulate real-world exam environments for RRB and SSC with precise timing and rule enforcement.
                </p>
              </div>
              <TypingTest results={results} profile={profile} setShowUpgrade={setShowUpgrade} />
            </>
          ) : (
            <Analysis results={results} profile={profile} darkMode={darkMode} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            © 2026 ProType Exam. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-400 dark:text-gray-500">
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Contact Support</a>
          </div>
        </div>
      </footer>

      {showAchievements && (
        <AchievementsModal 
          results={results} 
          profile={profile} 
          onClose={() => setShowAchievements(false)} 
        />
      )}

      {showUpgrade && user && (
        <UpgradeModal 
          userId={user.uid} 
          userEmail={user.email || ''} 
          onClose={() => setShowUpgrade(false)} 
        />
      )}

      {showAdmin && (
        <AdminDashboard onClose={() => setShowAdmin(false)} />
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowCalendar(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowCalendar(false)}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
            >
              <XCircle size={24} />
            </button>
            <PracticeCalendar practiceDates={results.map(r => {
              if (!r.timestamp) return new Date(); // Optimistic update for serverTimestamp
              if (typeof r.timestamp.toDate === 'function') return r.timestamp.toDate();
              return new Date(r.timestamp);
            }).filter(Boolean) as Date[]} />
          </div>
        </div>
      )}
    </div>
  );
}
