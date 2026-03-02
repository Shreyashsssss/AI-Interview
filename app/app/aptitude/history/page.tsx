'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import { Clock, Target, TrendingUp, ChevronLeft, Filter, Calendar, Award } from 'lucide-react';

const SECTION_META: Record<string, { title: string; icon: string; color: string }> = {
  quantitative: { title: 'Quantitative Aptitude', icon: '🔢', color: '#a78bfa' },
  logical: { title: 'Logical Reasoning', icon: '🧩', color: '#22d3ee' },
  verbal: { title: 'Verbal Ability', icon: '📝', color: '#f59e0b' },
};

type Attempt = {
  id: number;
  section: string;
  score: number;
  total: number;
  accuracy: number;
  time_used: number;
  created_at: string;
};

export default function QuizHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('section') || 'all';

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(filterParam);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/db?action=getQuizAttempts&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        setAttempts(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (!user) return null;

  const filtered = filter === 'all' ? attempts : attempts.filter(a => a.section === filter);

  const formatTime = (s: number) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  // Summary stats for filtered attempts
  const totalFiltered = filtered.length;
  const avgAccuracy = totalFiltered > 0
    ? Math.round(filtered.reduce((s, a) => s + a.accuracy, 0) / totalFiltered)
    : 0;
  const bestAccuracy = totalFiltered > 0
    ? Math.max(...filtered.map(a => a.accuracy))
    : 0;
  const avgTime = totalFiltered > 0
    ? Math.round(filtered.reduce((s, a) => s + (a.time_used || 0), 0) / totalFiltered)
    : 0;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button className="btn-ghost" onClick={() => router.push('/aptitude')} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Quiz History</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View all your past quiz attempts and performance</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Sections' },
            { id: 'quantitative', label: '🔢 Quantitative' },
            { id: 'logical', label: '🧩 Logical' },
            { id: 'verbal', label: '📝 Verbal' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${filter === id ? 'var(--accent-purple)' : 'var(--border)'}`,
                background: filter === id ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: filter === id ? '#a78bfa' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Attempts', value: totalFiltered, icon: Calendar, color: '#a78bfa' },
            { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: Target, color: '#22d3ee' },
            { label: 'Best Score', value: `${bestAccuracy}%`, icon: Award, color: '#34d399' },
            { label: 'Avg Time', value: formatTime(avgTime), icon: Clock, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-box">
              <div className="stat-box-icon" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Attempts list */}
        {loading ? (
          <div className="card-no-hover" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading history...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-no-hover" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>No Quiz Attempts Yet</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              {filter === 'all' ? 'Start a quiz to see your history here.' : `No attempts in ${SECTION_META[filter]?.title || filter}. Take a quiz!`}
            </div>
            <button className="btn-primary" onClick={() => router.push('/aptitude')} style={{ padding: '12px 28px' }}>
              Go to Aptitude Hub
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((attempt, idx) => {
              const meta = SECTION_META[attempt.section] || { title: attempt.section, icon: '📋', color: '#a78bfa' };
              const isGood = attempt.accuracy >= 80;
              const isMid = attempt.accuracy >= 60;
              const accentColor = isGood ? '#34d399' : isMid ? '#f59e0b' : '#f87171';

              return (
                <div
                  key={attempt.id || idx}
                  className="card-no-hover"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    borderLeft: `3px solid ${accentColor}`,
                  }}
                >
                  {/* Section icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 4 }}>{meta.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDate(attempt.created_at)}
                    </div>
                  </div>

                  {/* Score details */}
                  <div style={{ display: 'flex', gap: 28, flexShrink: 0, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: accentColor }}>{attempt.accuracy}%</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Accuracy</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{attempt.score}/{attempt.total}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Score</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatTime(attempt.time_used)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Time</div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                      background: isGood ? 'rgba(16,185,129,0.15)' : isMid ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: accentColor,
                      border: `1px solid ${accentColor}30`,
                    }}>
                      {isGood ? 'Excellent' : isMid ? 'Good' : 'Needs Work'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
