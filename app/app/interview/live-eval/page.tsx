'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import { Eye, Code2, Play, BrainCog, Loader2 } from 'lucide-react';

export default function LiveTechEvalPage() {
    const { user } = useAuth();
    const [problemDesc, setProblemDesc] = useState('Implement a LRU Cache');
    const [monacoState, setMonacoState] = useState('');
    const [keystrokeDelta, setKeystrokeDelta] = useState('Added a hash map instantiation.');
    const [voiceTranscript, setVoiceTranscript] = useState('I think we should use a dictionary here.');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{
        logic_analysis?: string;
        confidence_assessment?: string;
        action?: string;
        spoken_response?: string;
    } | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setResult(null);
        try {
            const res = await fetch('/api/realtime-eval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem_description: problemDesc,
                    current_monaco_editor_state: monacoState,
                    what_changed_in_the_last_10_seconds: keystrokeDelta,
                    latest_stt_transcription: voiceTranscript
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content" style={{ padding: '32px 36px', overflowY: 'auto', height: '100vh', width: '100%' }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BrainCog size={22} color="white" />
                            </div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Live Interview Evaluator</h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginLeft: 56 }}>
                            A real-time co-pilot feature for the HR & Tech Interview Dashboard.
                        </p>
                    </div>

                    <div className="card-no-hover" style={{ padding: 24, marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Input State Injections</h2>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Target Problem</label>
                            <input type="text" value={problemDesc} onChange={e => setProblemDesc(e.target.value)} className="input-field" style={{ width: '100%' }} />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Recent Keystroke Delta (Last 10s)</label>
                            <input type="text" value={keystrokeDelta} onChange={e => setKeystrokeDelta(e.target.value)} className="input-field" style={{ width: '100%' }} />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Voice Transcript</label>
                            <textarea value={voiceTranscript} onChange={e => setVoiceTranscript(e.target.value)} rows={2} className="input-field" style={{ width: '100%', resize: 'vertical' }} />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Current Monaco Editor State</label>
                            <textarea value={monacoState} onChange={e => setMonacoState(e.target.value)} rows={6} className="input-field" style={{ width: '100%', fontFamily: 'monospace', resize: 'vertical' }} placeholder="def lru_cache():..." />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            {isAnalyzing ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
                            {isAnalyzing ? 'Analyzing live signals...' : 'Run Real-time AI Evaluation'}
                        </button>
                    </div>

                    {result && (
                        <div className="card-no-hover" style={{ padding: 24, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.05)' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Eye size={20} /> AI Co-Pilot Analysis
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Logic Analysis</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                                        {result.logic_analysis || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Confidence Assessment</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                                        {result.confidence_assessment || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Recommended Action</div>
                                <div style={{
                                    display: 'inline-block', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase',
                                    background: result.action === 'wait' ? 'rgba(245,158,11,0.15)' : result.action === 'interrupt' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                    color: result.action === 'wait' ? '#fbbf24' : result.action === 'interrupt' ? '#f87171' : '#34d399',
                                    border: `1px solid ${result.action === 'wait' ? 'rgba(245,158,11,0.3)' : result.action === 'interrupt' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`
                                }}>
                                    {result.action || 'WAIT'}
                                </div>
                            </div>

                            {result.spoken_response && result.spoken_response.trim() !== '' && (
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>TTS Spoken Response Output</div>
                                    <div style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: 600, fontStyle: 'italic', background: 'rgba(59,130,246,0.1)', padding: '14px 18px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                                        "{result.spoken_response}"
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
