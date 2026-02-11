'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Sparkles, GripVertical,
  Lightbulb, Target, Clock, CheckCircle, PartyPopper,
  X, ChevronRight, Calendar, Flame, Star
} from 'lucide-react';

// Types
interface Task {
  id: string;
  text: string;
  createdAt: string;
  completedAt?: string;
}

interface Column {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  tasks: Task[];
}

type ColumnId = 'ideas' | 'thisWeek' | 'inProgress' | 'waiting' | 'done';

// Confetti component
function Confetti() {
  const colors = ['#6366f1', '#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e'];
  const confetti = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{ left: `${c.x}%`, backgroundColor: c.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ 
            y: '100vh', 
            opacity: 0, 
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{ 
            duration: c.duration, 
            delay: c.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Motivational quotes for wins
const winMessages = [
  "Crushed it! 💪",
  "Another one down! 🎯",
  "You're on fire! 🔥",
  "Making moves! 🚀",
  "That's how it's done! ⭐",
  "Momentum building! 📈",
  "Unstoppable! 🏆",
];

// Storage key
const STORAGE_KEY = 'momentum-board-data';

export default function MomentumPage() {
  const [columns, setColumns] = useState<Record<ColumnId, Column>>({
    ideas: {
      id: 'ideas',
      title: 'Ideas',
      icon: <Lightbulb size={16} />,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      tasks: [],
    },
    thisWeek: {
      id: 'thisWeek',
      title: 'This Week',
      icon: <Target size={16} />,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      tasks: [],
    },
    inProgress: {
      id: 'inProgress',
      title: 'In Progress',
      icon: <Flame size={16} />,
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      tasks: [],
    },
    waiting: {
      id: 'waiting',
      title: 'Waiting On',
      icon: <Clock size={16} />,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      tasks: [],
    },
    done: {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle size={16} />,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      tasks: [],
    },
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [activeColumn, setActiveColumn] = useState<ColumnId | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [streak, setStreak] = useState(0);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; fromColumn: ColumnId } | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setColumns(prev => {
          const updated = { ...prev };
          Object.keys(data.columns || {}).forEach(key => {
            if (updated[key as ColumnId]) {
              updated[key as ColumnId].tasks = data.columns[key].tasks || [];
            }
          });
          return updated;
        });
        setStreak(data.streak || 0);
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data = {
      columns: Object.fromEntries(
        Object.entries(columns).map(([k, v]) => [k, { tasks: v.tasks }])
      ),
      streak,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [columns, streak]);

  const addTask = (columnId: ColumnId) => {
    if (!newTaskText.trim()) return;
    
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      createdAt: new Date().toISOString(),
    };

    setColumns(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        tasks: [...prev[columnId].tasks, task],
      },
    }));

    setNewTaskText('');
    setActiveColumn(null);
  };

  const moveTask = (taskId: string, fromColumn: ColumnId, toColumn: ColumnId) => {
    if (fromColumn === toColumn) return;

    const task = columns[fromColumn].tasks.find(t => t.id === taskId);
    if (!task) return;

    // Celebrate completing a task!
    if (toColumn === 'done') {
      setShowConfetti(true);
      setWinMessage(winMessages[Math.floor(Math.random() * winMessages.length)]);
      setStreak(s => s + 1);
      setTimeout(() => {
        setShowConfetti(false);
        setWinMessage('');
      }, 3000);
    }

    setColumns(prev => ({
      ...prev,
      [fromColumn]: {
        ...prev[fromColumn],
        tasks: prev[fromColumn].tasks.filter(t => t.id !== taskId),
      },
      [toColumn]: {
        ...prev[toColumn],
        tasks: [...prev[toColumn].tasks, { 
          ...task, 
          completedAt: toColumn === 'done' ? new Date().toISOString() : undefined 
        }],
      },
    }));
  };

  const deleteTask = (taskId: string, columnId: ColumnId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        tasks: prev[columnId].tasks.filter(t => t.id !== taskId),
      },
    }));
  };

  const clearDone = () => {
    setColumns(prev => ({
      ...prev,
      done: { ...prev.done, tasks: [] },
    }));
  };

  const totalDone = columns.done.tasks.length;
  const totalActive = Object.values(columns)
    .filter(c => c.id !== 'done')
    .reduce((sum, c) => sum + c.tasks.length, 0);

  const columnOrder: ColumnId[] = ['ideas', 'thisWeek', 'inProgress', 'waiting', 'done'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Momentum</h1>
              <p className="text-xs text-white/50">Make it happen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {streak > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400"
              >
                <Flame size={16} />
                <span className="text-sm font-medium">{streak} streak</span>
              </motion.div>
            )}
            <div className="text-right">
              <p className="text-2xl font-bold">{totalDone}</p>
              <p className="text-xs text-white/50">completed</p>
            </div>
          </div>
        </div>
      </header>

      {/* Win message */}
      <AnimatePresence>
        {winMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <PartyPopper size={20} />
              <span className="font-bold">{winMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            return (
              <div
                key={column.id}
                className="flex flex-col bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('ring-2', 'ring-violet-500');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('ring-2', 'ring-violet-500');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('ring-2', 'ring-violet-500');
                  if (draggedTask) {
                    moveTask(draggedTask.task.id, draggedTask.fromColumn, columnId);
                    setDraggedTask(null);
                  }
                }}
              >
                {/* Column header */}
                <div className={`px-3 py-2 border-b border-white/10 flex items-center justify-between ${column.color.split(' ')[0]}`}>
                  <div className="flex items-center gap-2">
                    <span className={column.color.split(' ')[1]}>{column.icon}</span>
                    <span className="font-medium text-sm">{column.title}</span>
                    <span className="text-xs text-white/40">({column.tasks.length})</span>
                  </div>
                  {columnId === 'done' && column.tasks.length > 0 && (
                    <button
                      onClick={clearDone}
                      className="text-xs text-white/40 hover:text-white/60"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                  <AnimatePresence>
                    {column.tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        draggable
                        onDragStart={() => setDraggedTask({ task, fromColumn: columnId })}
                        onDragEnd={() => setDraggedTask(null)}
                        className="group relative p-3 rounded-lg bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-white/20 mt-0.5 shrink-0" />
                          <p className="text-sm flex-1 break-words">{task.text}</p>
                          <button
                            onClick={() => deleteTask(task.id, columnId)}
                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-opacity shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        
                        {/* Quick move buttons */}
                        {columnId !== 'done' && (
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {columnOrder
                              .filter(c => c !== columnId)
                              .slice(0, 3)
                              .map(targetCol => (
                                <button
                                  key={targetCol}
                                  onClick={() => moveTask(task.id, columnId, targetCol)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/60"
                                >
                                  → {columns[targetCol].title.split(' ')[0]}
                                </button>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add task */}
                {activeColumn === columnId ? (
                  <div className="p-2 border-t border-white/10">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addTask(columnId);
                        if (e.key === 'Escape') setActiveColumn(null);
                      }}
                      placeholder="What needs to happen?"
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => addTask(columnId)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setActiveColumn(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveColumn(columnId)}
                    className="m-2 p-2 rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60 transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer tips */}
        <div className="mt-8 text-center text-white/30 text-sm">
          <p>Drag cards between columns • Complete tasks to build your streak 🔥</p>
        </div>
      </main>
    </div>
  );
}
