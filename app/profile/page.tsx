'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { User, Upload, Plus, X, Save, Briefcase, GraduationCap, Github, Linkedin, CheckCircle } from 'lucide-react';

const SKILL_SUGGESTIONS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++', 'Go', 'SQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Machine Learning', 'Data Science', 'System Design', 'DSA', 'REST APIs', 'GraphQL', 'Kubernetes'];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
    cgpa: user?.cgpa || '',
    graduationYear: user?.graduationYear || '',
    targetRole: user?.targetRole || '',
    bio: user?.bio || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    skills: user?.skills || [],
  });

  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = (skill: string) => {
    if (skill && !form.skills.includes(skill)) {
      set('skills', [...form.skills, skill]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => set('skills', form.skills.filter(s => s !== skill));

  const handleSave = () => {
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 36px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 6 }}>My Profile</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Your data powers personalized AI interviews and job recommendations</p>
            </div>
            <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saved ? <CheckCircle size={16} /> : <Save size={16} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>

          {/* Avatar & Basic */}
          <div className="card-no-hover" style={{ padding: 32, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="var(--accent-purple)" /> Basic Information
            </h2>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {form.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name</label>
                  <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXXXXXXX" />
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Bio</label>
              <textarea className="input-field" value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Brief professional bio..." rows={3} style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>

          {/* Education */}
          <div className="card-no-hover" style={{ padding: 32, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={18} color="var(--accent-cyan)" /> Education & Career
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>College / University</label>
                <input className="input-field" value={form.college} onChange={e => set('college', e.target.value)} placeholder="e.g. IIT Bombay" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>CGPA</label>
                <input className="input-field" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="e.g. 8.7" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Graduation Year</label>
                <input className="input-field" value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)} placeholder="e.g. 2025" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Target Role</label>
                <select className="input-field" value={form.targetRole} onChange={e => set('targetRole', e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Select target role</option>
                  {['Full Stack Developer', 'Backend Engineer', 'Frontend Developer', 'Data Scientist', 'ML Engineer', 'Product Manager', 'DevOps Engineer', 'Mobile Developer'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card-no-hover" style={{ padding: 32, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={18} color="var(--accent-orange)" /> Technical Skills
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>These skills personalize your AI interview questions</p>

            {/* Current skills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {form.skills.map(skill => (
                <span key={skill} className="badge badge-purple" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  {skill}
                  <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 4, padding: 0, display: 'inline-flex' }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              {form.skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills added yet</span>}
            </div>

            {/* Add skill */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill(newSkill)}
                placeholder="Add a skill and press Enter" style={{ flex: 1 }} />
              <button className="btn-primary" onClick={() => addSkill(newSkill)} style={{ padding: '12px 20px', flexShrink: 0 }}>
                <Plus size={18} />
              </button>
            </div>

            {/* Suggestions */}
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Suggested skills:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 12).map(s => (
                  <button key={s} onClick={() => addSkill(s)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Social links + Resume */}
          <div className="card-no-hover" style={{ padding: 32, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Github size={18} color="var(--text-secondary)" /> Links & Resume
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>LinkedIn URL</label>
                <input className="input-field" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/yourname" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>GitHub URL</label>
                <input className="input-field" value={form.github} onChange={e => set('github', e.target.value)} placeholder="github.com/yourname" />
              </div>
            </div>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '28px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-purple)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <Upload size={28} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'white', marginBottom: 4 }}>Upload Resume (PDF)</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Your resume is parsed to personalize AI interview questions</div>
              <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
                Choose PDF File
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '14px 40px', fontSize: '1rem' }}>
              {saved ? '✓ Profile Saved!' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
