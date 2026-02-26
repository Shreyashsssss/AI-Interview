'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import { BookOpen, Clock, Target, TrendingUp, ChevronRight, BarChart2, Star, Zap } from 'lucide-react';

const SECTIONS_META = [
  {
    id: 'quantitative',
    title: 'Quantitative Aptitude',
    desc: 'Arithmetic, Algebra, Percentages, Number Systems, Time & Work, Profit & Loss',
    icon: '🔢',
    color: '#a78bfa',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.25)',
    questions: 20,
    duration: 20,
    difficulty: 'Medium',
    topics: ['Arithmetic', 'Algebra', 'Geometry', 'Probability'],
  },
  {
    id: 'logical',
    title: 'Logical Reasoning',
    desc: 'Series, Patterns, Syllogisms, Blood Relations, Direction Sense, Coding-Decoding',
    icon: '🧩',
    color: '#22d3ee',
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.25)',
    questions: 20,
    duration: 25,
    difficulty: 'Hard',
    topics: ['Series', 'Syllogisms', 'Direction Sense', 'Puzzles'],
  },
  {
    id: 'verbal',
    title: 'Verbal Ability',
    desc: 'Reading Comprehension, Grammar, Vocabulary, Para Jumbles, Sentence Completion',
    icon: '📝',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.25)',
    questions: 20,
    duration: 20,
    difficulty: 'Easy',
    topics: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Para Jumbles'],
  },
];

export default function AptitudePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Dynamic stats from DB
  const [sectionStats, setSectionStats] = useState<Record<string, { avg_accuracy: number; best_accuracy: number; attempts: number }>>({});
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/db?action=getQuizStats&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const map: Record<string, any> = {};
        let total = 0;
        for (const s of arr) {
          map[s.section] = { avg_accuracy: s.avg_accuracy || 0, best_accuracy: s.best_accuracy || 0, attempts: s.attempts || 0 };
          total += s.attempts || 0;
        }
        setSectionStats(map);
        setTotalAttempts(total);
      })
      .catch(() => {});
  }, [user?.email]);

  if (!user) return null;

  // Compute overall accuracy from section averages (only sections that have attempts)
  const activeSections = SECTIONS_META.filter(s => sectionStats[s.id]?.attempts > 0);
  const overallAccuracy = activeSections.length > 0
    ? Math.round(activeSections.reduce((sum, s) => sum + (sectionStats[s.id]?.avg_accuracy || 0), 0) / activeSections.length)
    : 0;

  // Best & weak section
  let bestSection = '—';
  let weakSection = '—';
  if (activeSections.length > 0) {
    const sorted = [...activeSections].sort((a, b) => (sectionStats[b.id]?.avg_accuracy || 0) - (sectionStats[a.id]?.avg_accuracy || 0));
    bestSection = sorted[0]?.title.split(' ')[0] || '—';
    weakSection = sorted[sorted.length - 1]?.title.split(' ')[0] || '—';
    if (sorted.length === 1) weakSection = '—'; // only one section attempted
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 6 }}>Aptitude Quiz Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Timed assessments across Quantitative, Logical, and Verbal sections with detailed analytics
          </p>
        </div>

        {/* Overall stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Overall Accuracy', value: `${overallAccuracy}%`, icon: Target, color: '#a78bfa' },
            { label: 'Total Attempts', value: `${totalAttempts}`, icon: BarChart2, color: '#22d3ee' },
            { label: 'Best Section', value: bestSection, icon: Star, color: '#34d399' },
            { label: 'Weak Area', value: weakSection, icon: TrendingUp, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-box">
              <div className="stat-box-icon" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Section cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SECTIONS_META.map(({ id, title, desc, icon, color, bg, border, questions, duration, difficulty, topics }) => {
            const secAttempts = sectionStats[id]?.attempts || 0;
            const secBest = sectionStats[id]?.best_accuracy || 0;
            const secAvg = sectionStats[id]?.avg_accuracy || 0;
            return (
            <div key={id} className="card-no-hover" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                {/* Icon */}
                <div style={{
                  width: 72, height: 72, borderRadius: 18, background: bg, border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0,
                }}>{icon}</div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{title}</h2>
                    <span className={`badge ${difficulty === 'Hard' ? 'badge-red' : difficulty === 'Medium' ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '0.72rem' }}>
                      {difficulty}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{desc}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {topics.map(t => <span key={t} className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{t}</span>)}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                  {[
                    { label: 'Questions', value: questions },
                    { label: 'Duration', value: `${duration}m` },
                    { label: 'Best Score', value: `${secBest}%` },
                    { label: 'Attempts', value: secAttempts },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Score bar + CTA */}
                <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Accuracy</span>
                      <span style={{ color, fontWeight: 700 }}>{secAvg}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${secAvg}%`, background: color }} />
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => router.push(`/aptitude/${id}`)} style={{ width: '100%', padding: '10px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Zap size={14} /> Start Quiz
                  </button>
                  <button className="btn-ghost" onClick={() => router.push(`/aptitude/history?section=${id}`)} style={{ width: '100%', padding: '8px', fontSize: '0.82rem' }}>
                    View History
                  </button>
                </div>
              </div>
            </div>
          );})}
        </div>

        {/* Tips */}
        <div style={{ marginTop: 28, padding: '20px 24px', borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>💡 Pro Tips</div>
          <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>• Manage time: ~1 minute per question</span>
            <span>• Skip hard questions and return later</span>
            <span>• No negative marking—attempt all</span>
            <span>• Review weak areas using the analytics dashboard</span>
          </div>
        </div>
      </main>
    </div>
  );
}
