'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Video, VideoOff, Mic, MicOff, Phone, Monitor, MessageSquare, Users, Clock, Shield, ArrowLeft, Copy, CheckCircle, ExternalLink } from 'lucide-react';

interface MeetingInfo {
  roomName: string;
  bookingId: string;
  expertName: string;
  expertCompany: string;
  studentName: string;
  role: string;
  date: string;
  time: string;
}

export default function InterviewRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  // Extract meeting info from URL params
  useEffect(() => {
    const room = searchParams.get('room');
    const bookingId = searchParams.get('bookingId') || '';
    const expertName = searchParams.get('expertName') || '';
    const expertCompany = searchParams.get('expertCompany') || '';
    const studentName = searchParams.get('studentName') || '';
    const role = searchParams.get('role') || '';
    const date = searchParams.get('date') || '';
    const time = searchParams.get('time') || '';

    if (room) {
      setMeetingInfo({ roomName: room, bookingId, expertName, expertCompany, studentName, role, date, time });
    }
  }, [searchParams]);

  // Timer when joined
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isJoined]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const copyMeetingLink = () => {
    if (!meetingInfo) return;
    const link = `https://meet.jit.si/${meetingInfo.roomName}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinMeeting = () => {
    if (!meetingInfo || !jitsiContainerRef.current) return;
    setIsJoined(true);

    // Load Jitsi Meet external API
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

      const api = new JitsiMeetExternalAPI('meet.jit.si', {
        roomName: meetingInfo.roomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'chat',
            'raisehand', 'tileview', 'fullscreen', 'hangup',
            'recording', 'settings', 'videoquality',
          ],
          enableWelcomePage: false,
          enableClosePage: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#0a0a14',
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          FILM_STRIP_MAX_HEIGHT: 120,
        },
        userInfo: {
          displayName: user?.name || 'Participant',
          email: user?.email || '',
        },
      });

      api.addEventListener('readyToClose', () => {
        setIsJoined(false);
        router.push(user?.role === 'expert' ? '/expert/dashboard' : '/dashboard');
      });

      setJitsiLoaded(true);
    };
    document.head.appendChild(script);
  };

  if (!user) return null;

  if (!meetingInfo) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-no-hover" style={{ padding: 40, textAlign: 'center', maxWidth: 440 }}>
          <VideoOff size={48} color="#f87171" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.4rem', marginBottom: 10 }}>No Meeting Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This meeting link is invalid or has expired.</p>
          <button className="btn-primary" onClick={() => router.push(user.role === 'expert' ? '/expert/dashboard' : '/dashboard')} style={{ padding: '12px 32px' }}>
            <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (!isJoined) {
    const meetLink = `https://meet.jit.si/${meetingInfo.roomName}`;
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="blob blob-1" style={{ opacity: 0.06 }} />
        <div className="blob blob-2" style={{ opacity: 0.04 }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, padding: '0 20px' }}>
          <button onClick={() => router.push(user.role === 'expert' ? '/expert/dashboard' : '/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div className="card-no-hover" style={{ padding: 40, textAlign: 'center' }}>
            {/* Video icon animation */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(124,58,237,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              <Video size={36} color="#a78bfa" />
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Ready to Join Interview?</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 28 }}>
              Your video conference room is ready. Click join to start.
            </p>

            {/* Meeting details card */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 20, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                Interview Details
              </div>
              {[
                { icon: Users, label: user.role === 'expert' ? 'Student' : 'Expert', value: user.role === 'expert' ? meetingInfo.studentName : `${meetingInfo.expertName} (${meetingInfo.expertCompany})` },
                { icon: Monitor, label: 'Role', value: meetingInfo.role },
                { icon: Clock, label: 'Scheduled', value: `${meetingInfo.date} at ${meetingInfo.time}` },
                { icon: Video, label: 'Platform', value: 'PlaceAI Video Conference' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Icon size={16} color="#a78bfa" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', minWidth: 70 }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Meeting link */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 28,
            }}>
              <Shield size={14} color="#a78bfa" />
              <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meetLink}
              </span>
              <button onClick={copyMeetingLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#a78bfa' }}>
                {copied ? <CheckCircle size={16} color="#34d399" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Join buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={joinMeeting} className="btn-primary" style={{
                flex: 2, padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <Video size={20} /> Join Interview Now
              </button>
              <a href={meetLink} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                textDecoration: 'none', transition: 'all 0.2s',
              }}>
                <ExternalLink size={16} /> Open External
              </a>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 16 }}>
              🔒 End-to-end encrypted • No downloads required
            </p>
          </div>
        </div>
      </div>
    );
  }

  // In-meeting view with embedded Jitsi
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a14' }}>
      {/* Top bar */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'rgba(10,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88rem' }}>
            PlaceAI Interview — {meetingInfo.role}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            with {user.role === 'expert' ? meetingInfo.studentName : meetingInfo.expertName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Clock size={14} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsedTime)}</span>
          </div>
          <button onClick={copyMeetingLink} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {copied ? <CheckCircle size={12} color="#34d399" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Jitsi container */}
      <div ref={jitsiContainerRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
}
