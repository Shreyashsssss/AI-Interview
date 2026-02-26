import Database from 'better-sqlite3';
import path from 'path';

// Store DB in project root
const DB_PATH = path.join(process.cwd(), 'placeai.db');

let _db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // ────────────────────────────────────────────────────────────────
  //  FULL SCHEMA — all tables for the PlaceAI platform
  // ────────────────────────────────────────────────────────────────
  _db.exec(`
    -- 1. USERS
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      email           TEXT UNIQUE NOT NULL,
      password_hash   TEXT NOT NULL DEFAULT 'demo123',
      name            TEXT NOT NULL,
      role            TEXT NOT NULL CHECK(role IN ('student','expert')),
      avatar          TEXT,
      college         TEXT,
      company         TEXT,
      skills          TEXT DEFAULT '[]',
      target_role     TEXT,
      cgpa            TEXT,
      graduation_year TEXT,
      phone           TEXT,
      bio             TEXT,
      linkedin        TEXT,
      github          TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. EXPERT PROFILES (extra details for experts)
    CREATE TABLE IF NOT EXISTS expert_profiles (
      expert_id       TEXT PRIMARY KEY REFERENCES users(id),
      designation     TEXT,
      domain          TEXT,
      expertise       TEXT DEFAULT '[]',
      rating          REAL DEFAULT 4.8,
      total_sessions  INTEGER DEFAULT 0,
      avatar_initials TEXT,
      avatar_color    TEXT DEFAULT '#a78bfa'
    );

    -- 3. EXPERT AVAILABILITY
    CREATE TABLE IF NOT EXISTS expert_availability (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      expert_id   TEXT NOT NULL REFERENCES users(id),
      date        TEXT NOT NULL,
      time_slot   TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      UNIQUE(expert_id, date, time_slot)
    );

    -- 4. BOOKINGS
    CREATE TABLE IF NOT EXISTS bookings (
      id                  TEXT PRIMARY KEY,
      student_id          TEXT NOT NULL REFERENCES users(id),
      student_name        TEXT NOT NULL,
      student_email       TEXT NOT NULL,
      college             TEXT,
      role                TEXT NOT NULL,
      expert_id           TEXT NOT NULL,
      expert_name         TEXT NOT NULL,
      expert_company      TEXT,
      expert_designation  TEXT,
      expert_avatar       TEXT,
      expert_color        TEXT,
      date                TEXT NOT NULL,
      time                TEXT NOT NULL,
      status              TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','confirmed','completed')),
      meeting_room        TEXT,
      meeting_link        TEXT,
      skills              TEXT DEFAULT '[]',
      ai_score            INTEGER DEFAULT 0,
      weak_areas          TEXT DEFAULT '[]',
      aptitude_scores     TEXT DEFAULT '{}',
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. NOTIFICATIONS
    CREATE TABLE IF NOT EXISTS notifications (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL CHECK(type IN ('approved','rejected','info','reminder')),
      student_email   TEXT NOT NULL,
      expert_name     TEXT,
      expert_company  TEXT,
      role            TEXT,
      date            TEXT,
      time            TEXT,
      meeting_link    TEXT,
      meeting_room    TEXT,
      message         TEXT NOT NULL,
      read            INTEGER DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. AI INTERVIEW SESSIONS
    CREATE TABLE IF NOT EXISTS ai_interview_sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email      TEXT NOT NULL,
      user_name       TEXT,
      job_role        TEXT NOT NULL,
      interview_type  TEXT DEFAULT 'full',
      difficulty      TEXT DEFAULT 'medium',
      questions       TEXT DEFAULT '[]',
      answers         TEXT DEFAULT '[]',
      code_snapshots  TEXT DEFAULT '[]',
      scores          TEXT DEFAULT '{}',
      overall_score   INTEGER DEFAULT 0,
      tab_switches    INTEGER DEFAULT 0,
      duration_sec    INTEGER DEFAULT 0,
      completed       INTEGER DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. QUIZ ATTEMPTS
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email  TEXT NOT NULL,
      section     TEXT NOT NULL,
      score       INTEGER NOT NULL,
      total       INTEGER NOT NULL,
      accuracy    REAL NOT NULL,
      time_used   INTEGER DEFAULT 0,
      answers     TEXT DEFAULT '[]',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. SESSION FEEDBACK (expert → student)
    CREATE TABLE IF NOT EXISTS session_feedback (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id  TEXT REFERENCES bookings(id),
      expert_id   TEXT NOT NULL,
      student_id  TEXT NOT NULL,
      student_name TEXT,
      role        TEXT,
      rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      feedback    TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. ACTIVITY LOG
    CREATE TABLE IF NOT EXISTS activity_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email  TEXT NOT NULL,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      detail      TEXT,
      score       TEXT,
      icon        TEXT DEFAULT 'activity',
      color       TEXT DEFAULT '#a78bfa',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. RESUME ANALYSES (kept from original)
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email      TEXT NOT NULL,
      filename        TEXT NOT NULL,
      file_hash       TEXT NOT NULL,
      analyzed_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      ats_score       INTEGER,
      grade           TEXT,
      technical_score INTEGER,
      communication_score INTEGER,
      skills          TEXT,
      suggested_roles TEXT,
      full_analysis   TEXT
    );

    -- 11. USER SKILLS (kept from original)
    CREATE TABLE IF NOT EXISTS user_skills (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email  TEXT NOT NULL,
      skill       TEXT NOT NULL,
      added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_email, skill)
    );

    -- INDEXES
    CREATE INDEX IF NOT EXISTS idx_resume_email ON resume_analyses(user_email);
    CREATE INDEX IF NOT EXISTS idx_resume_hash  ON resume_analyses(file_hash);
    CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_email);
    CREATE INDEX IF NOT EXISTS idx_bookings_expert ON bookings(expert_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_email);
    CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_email);
    CREATE INDEX IF NOT EXISTS idx_ai_session_user ON ai_interview_sessions(user_email);
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_email);
    CREATE INDEX IF NOT EXISTS idx_feedback_expert ON session_feedback(expert_id);
  `);

  // ── Seed demo data if first run ─────────────────────────────────
  seedDemoData(_db);

  return _db;
}

// ════════════════════════════════════════════════════════════════════
//  SEED DEMO DATA
// ════════════════════════════════════════════════════════════════════
function seedDemoData(db: Database.Database) {
  const count = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as any)?.c;
  if (count > 0) return; // already seeded

  // ── Student ────────────────────────────────────────────────────
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, role, college, company, skills, target_role, cgpa, graduation_year, phone, bio, linkedin, github)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('student-1', 'student@demo.com', 'demo123', 'Arjun Sharma', 'student',
    'IIT Bombay', null,
    JSON.stringify(['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Machine Learning']),
    'Full Stack Developer', '8.7', '2025', '+91 9876543210',
    'Passionate about building scalable web applications and exploring ML.',
    'https://linkedin.com/in/arjun-sharma', 'https://github.com/arjun-sharma');

  // ── Experts ────────────────────────────────────────────────────
  const experts = [
    // Full Stack
    { id: 'expert-fs1', email: 'priya.mehta@expert.com', name: 'Priya Mehta', company: 'Google', skills: ['React','Node.js','System Design'], bio: '8+ years at Google. Ex-interviewer for 3 years.', designation: 'Senior SWE', domain: 'Full Stack Developer', expertise: ['React','Node.js','System Design','Scalability'], rating: 4.9, sessions: 120, initials: 'PM', color: '#a78bfa' },
    { id: 'expert-fs2', email: 'rohit.jain@expert.com', name: 'Rohit Jain', company: 'Flipkart', skills: ['Next.js','TypeScript','Microservices'], bio: 'Staff Engineer at Flipkart. Full stack expert with 6+ years.', designation: 'Staff Engineer', domain: 'Full Stack Developer', expertise: ['Next.js','TypeScript','Microservices','Docker'], rating: 4.8, sessions: 85, initials: 'RJ', color: '#22d3ee' },
    { id: 'expert-fs3', email: 'ananya.das@expert.com', name: 'Ananya Das', company: 'Atlassian', skills: ['MERN Stack','GraphQL','AWS'], bio: 'Tech Lead at Atlassian.', designation: 'Tech Lead', domain: 'Full Stack Developer', expertise: ['MERN Stack','GraphQL','AWS','CI/CD'], rating: 4.7, sessions: 64, initials: 'AD', color: '#34d399' },
    // Backend
    { id: 'expert-be1', email: 'arjun.kapoor@expert.com', name: 'Arjun Kapoor', company: 'Amazon', skills: ['Distributed Systems','Java','AWS'], bio: 'Amazon L7. Expert in distributed systems.', designation: 'Principal Engineer', domain: 'Backend Engineer', expertise: ['Distributed Systems','Java','AWS','Leadership Principles'], rating: 4.9, sessions: 156, initials: 'AK', color: '#22d3ee' },
    { id: 'expert-be2', email: 'karthik.rao@expert.com', name: 'Karthik Rao', company: 'Uber', skills: ['Go','Kafka','System Design'], bio: '5+ years at Uber.', designation: 'Senior Engineer', domain: 'Backend Engineer', expertise: ['Go','Kafka','System Design','Real-time Systems'], rating: 4.8, sessions: 92, initials: 'KR', color: '#f59e0b' },
    { id: 'expert-be3', email: 'neha.gupta@expert.com', name: 'Neha Gupta', company: 'Razorpay', skills: ['Python','PostgreSQL','Docker'], bio: 'EM at Razorpay.', designation: 'Engineering Manager', domain: 'Backend Engineer', expertise: ['Python','PostgreSQL','Docker','Payment Systems'], rating: 4.7, sessions: 78, initials: 'NG', color: '#a78bfa' },
    // Data Science
    { id: 'expert-ds1', email: 'sneha.reddy@expert.com', name: 'Sneha Reddy', company: 'Microsoft', skills: ['Python','ML','Statistics'], bio: 'Azure AI team.', designation: 'Senior Data Scientist', domain: 'Data Scientist', expertise: ['Python','ML','Statistics','Azure ML'], rating: 4.9, sessions: 110, initials: 'SR', color: '#34d399' },
    { id: 'expert-ds2', email: 'aditya.sharma@expert.com', name: 'Aditya Sharma', company: 'Meta', skills: ['Deep Learning','NLP','A/B Testing'], bio: 'Staff DS at Meta.', designation: 'Staff Data Scientist', domain: 'Data Scientist', expertise: ['Deep Learning','NLP','A/B Testing','Recommendation Systems'], rating: 4.8, sessions: 95, initials: 'AS', color: '#a78bfa' },
    { id: 'expert-ds3', email: 'ritu.patel@expert.com', name: 'Ritu Patel', company: 'Swiggy', skills: ['Demand Forecasting','SQL','Tableau'], bio: 'Senior DS at Swiggy.', designation: 'Senior Data Scientist', domain: 'Data Scientist', expertise: ['Demand Forecasting','SQL','Tableau','Business Analytics'], rating: 4.6, sessions: 47, initials: 'RP', color: '#f59e0b' },
    // ML
    { id: 'expert-ml1', email: 'vikram.iyer@expert.com', name: 'Vikram Iyer', company: 'NVIDIA', skills: ['PyTorch','CUDA','MLOps'], bio: 'ML Infra Lead at NVIDIA.', designation: 'ML Infra Lead', domain: 'ML Engineer', expertise: ['PyTorch','CUDA','MLOps','GPU Optimization'], rating: 4.9, sessions: 88, initials: 'VI', color: '#22d3ee' },
    { id: 'expert-ml2', email: 'deepa.nair@expert.com', name: 'Deepa Nair', company: 'Google DeepMind', skills: ['TensorFlow','Reinforcement Learning','Computer Vision'], bio: 'Research Engineer at DeepMind.', designation: 'Research Engineer', domain: 'ML Engineer', expertise: ['TensorFlow','RL','Computer Vision','Research'], rating: 4.8, sessions: 72, initials: 'DN', color: '#34d399' },
    { id: 'expert-ml3', email: 'saurabh.verma@expert.com', name: 'Saurabh Verma', company: 'Amazon Science', skills: ['Feature Engineering','SageMaker','NLP'], bio: 'Applied Scientist at Amazon.', designation: 'Applied Scientist', domain: 'ML Engineer', expertise: ['Feature Engineering','SageMaker','NLP','Production ML'], rating: 4.7, sessions: 61, initials: 'SV', color: '#f59e0b' },
    // Frontend
    { id: 'expert-fe1', email: 'kavya.krishnan@expert.com', name: 'Kavya Krishnan', company: 'Airbnb', skills: ['React','CSS Architecture','Performance'], bio: 'Senior FE at Airbnb.', designation: 'Senior Frontend Engineer', domain: 'Frontend Developer', expertise: ['React','CSS Architecture','Performance','Design Systems'], rating: 4.8, sessions: 74, initials: 'KK', color: '#a78bfa' },
    { id: 'expert-fe2', email: 'manish.tiwari@expert.com', name: 'Manish Tiwari', company: 'Razorpay', skills: ['Next.js','TypeScript','Testing'], bio: 'Frontend Lead at Razorpay.', designation: 'Frontend Lead', domain: 'Frontend Developer', expertise: ['Next.js','TypeScript','Testing','Checkout SDKs'], rating: 4.7, sessions: 58, initials: 'MT', color: '#22d3ee' },
    { id: 'expert-fe3', email: 'shruti.bose@expert.com', name: 'Shruti Bose', company: 'Figma', skills: ['WebGL','Canvas','State Management'], bio: 'Staff Engineer at Figma.', designation: 'Staff Engineer', domain: 'Frontend Developer', expertise: ['WebGL','Canvas','State Management','Rendering Engines'], rating: 4.9, sessions: 86, initials: 'SB', color: '#34d399' },
    // DevOps
    { id: 'expert-do1', email: 'rajesh.kumar@expert.com', name: 'Rajesh Kumar', company: 'Netflix', skills: ['Kubernetes','Terraform','CI/CD'], bio: 'Senior SRE at Netflix.', designation: 'Senior SRE', domain: 'DevOps Engineer', expertise: ['Kubernetes','Terraform','CI/CD','Chaos Engineering'], rating: 4.9, sessions: 102, initials: 'RK', color: '#f59e0b' },
    { id: 'expert-do2', email: 'pooja.singh@expert.com', name: 'Pooja Singh', company: 'AWS', skills: ['AWS','CloudFormation','Security'], bio: 'Solutions Architect at AWS.', designation: 'Solutions Architect', domain: 'DevOps Engineer', expertise: ['AWS','CloudFormation','Security','Multi-Cloud'], rating: 4.8, sessions: 93, initials: 'PS', color: '#a78bfa' },
    { id: 'expert-do3', email: 'amit.desai@expert.com', name: 'Amit Desai', company: 'Zomato', skills: ['Docker','Prometheus','Linux'], bio: 'Platform Engineer at Zomato.', designation: 'Platform Engineer', domain: 'DevOps Engineer', expertise: ['Docker','Prometheus','Linux','Monitoring'], rating: 4.6, sessions: 45, initials: 'AD2', color: '#22d3ee' },
    // Product
    { id: 'expert-pm1', email: 'vikram.singh@expert.com', name: 'Vikram Singh', company: 'Flipkart', skills: ['Product Strategy','Analytics','UX'], bio: 'Director of Product at Flipkart.', designation: 'Director of Product', domain: 'Product Manager', expertise: ['Product Strategy','Analytics','UX','Go-to-Market'], rating: 4.9, sessions: 134, initials: 'VS', color: '#f59e0b' },
    { id: 'expert-pm2', email: 'megha.arora@expert.com', name: 'Megha Arora', company: 'Google', skills: ['Data Products','Growth','Roadmapping'], bio: 'Group PM at Google.', designation: 'Group PM', domain: 'Product Manager', expertise: ['Data Products','Growth','Roadmapping','User Research'], rating: 4.8, sessions: 87, initials: 'MA', color: '#a78bfa' },
    { id: 'expert-pm3', email: 'nitin.bhatt@expert.com', name: 'Nitin Bhatt', company: 'Cred', skills: ['Fintech','User Research','GTM Strategy'], bio: 'Senior PM at CRED.', designation: 'Senior PM', domain: 'Product Manager', expertise: ['Fintech','User Research','GTM Strategy','0-to-1 Products'], rating: 4.7, sessions: 56, initials: 'NB', color: '#34d399' },
  ];

  const insertExpertProfile = db.prepare(`
    INSERT OR IGNORE INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    for (const e of experts) {
      insertUser.run(e.id, e.email, 'demo123', e.name, 'expert', null, e.company,
        JSON.stringify(e.skills), null, null, null, null, e.bio, null, null);
      insertExpertProfile.run(e.id, e.designation, e.domain, JSON.stringify(e.expertise),
        e.rating, e.sessions, e.initials, e.color);
    }

    // Seed some demo quiz attempts for the student
    const insertQuiz = db.prepare(`INSERT INTO quiz_attempts (user_email, section, score, total, accuracy, time_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    insertQuiz.run('student@demo.com', 'quantitative', 8, 10, 80.0, 420, '2026-02-24T10:00:00Z');
    insertQuiz.run('student@demo.com', 'quantitative', 7, 10, 70.0, 380, '2026-02-20T10:00:00Z');
    insertQuiz.run('student@demo.com', 'quantitative', 8, 10, 80.0, 350, '2026-02-18T10:00:00Z');
    insertQuiz.run('student@demo.com', 'quantitative', 9, 10, 90.0, 400, '2026-02-15T10:00:00Z');
    insertQuiz.run('student@demo.com', 'logical', 9, 10, 90.0, 300, '2026-02-25T10:00:00Z');
    insertQuiz.run('student@demo.com', 'logical', 10, 10, 100.0, 280, '2026-02-23T10:00:00Z');
    insertQuiz.run('student@demo.com', 'logical', 8, 10, 80.0, 320, '2026-02-21T10:00:00Z');
    insertQuiz.run('student@demo.com', 'logical', 9, 10, 90.0, 310, '2026-02-19T10:00:00Z');
    insertQuiz.run('student@demo.com', 'logical', 9, 10, 90.0, 290, '2026-02-16T10:00:00Z');
    insertQuiz.run('student@demo.com', 'logical', 10, 10, 100.0, 270, '2026-02-14T10:00:00Z');
    insertQuiz.run('student@demo.com', 'verbal', 7, 10, 70.0, 450, '2026-02-22T10:00:00Z');
    insertQuiz.run('student@demo.com', 'verbal', 6, 10, 60.0, 480, '2026-02-17T10:00:00Z');
    insertQuiz.run('student@demo.com', 'verbal', 6, 10, 60.0, 500, '2026-02-13T10:00:00Z');

    // Seed AI interview sessions
    const insertSession = db.prepare(`INSERT INTO ai_interview_sessions (user_email, user_name, job_role, interview_type, difficulty, scores, overall_score, tab_switches, duration_sec, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);
    insertSession.run('student@demo.com', 'Arjun Sharma', 'Full Stack Developer', 'full', 'medium',
      JSON.stringify({ technical: 85, problemSolving: 78, communication: 82, optimization: 80 }), 82, 0, 1800, '2026-02-25T14:00:00Z');
    insertSession.run('student@demo.com', 'Arjun Sharma', 'Full Stack Developer', 'dsa', 'medium',
      JSON.stringify({ technical: 88, problemSolving: 82, communication: 79, optimization: 85 }), 84, 1, 1500, '2026-02-23T11:00:00Z');
    insertSession.run('student@demo.com', 'Arjun Sharma', 'Backend Engineer', 'full', 'hard',
      JSON.stringify({ technical: 76, problemSolving: 72, communication: 80, optimization: 70 }), 75, 0, 2100, '2026-02-21T16:00:00Z');
    insertSession.run('student@demo.com', 'Arjun Sharma', 'Data Scientist', 'behavioral', 'easy',
      JSON.stringify({ technical: 70, problemSolving: 75, communication: 90, optimization: 68 }), 76, 0, 1200, '2026-02-19T09:00:00Z');

    // Seed activity log
    const insertActivity = db.prepare(`INSERT INTO activity_log (user_email, type, title, detail, score, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertActivity.run('student@demo.com', 'quiz', 'Completed Quantitative Aptitude Quiz', 'quantitative', '80%', 'book', '#a78bfa', '2026-02-26T08:00:00Z');
    insertActivity.run('student@demo.com', 'interview', 'AI Interview — Full Stack Developer', 'Full Stack Developer', '84%', 'code', '#22d3ee', '2026-02-25T14:00:00Z');
    insertActivity.run('student@demo.com', 'booking', 'Mock Interview booked with Priya Mehta', 'Full Stack Developer', null, 'calendar', '#34d399', '2026-02-24T10:00:00Z');
    insertActivity.run('student@demo.com', 'quiz', 'Completed Logical Reasoning quiz', 'logical', '91%', 'brain', '#f59e0b', '2026-02-23T09:00:00Z');

    // Seed confirmed bookings (must be before feedback due to FK)
    const insertBooking = db.prepare(`INSERT OR IGNORE INTO bookings (id, student_id, student_name, student_email, college, role, expert_id, expert_name, expert_company, expert_designation, expert_avatar, expert_color, date, time, status, skills, ai_score, weak_areas, aptitude_scores, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insertBooking.run('b1', 'student-1', 'Rahul Verma', 'rahul@demo.com', 'IIT Delhi', 'Backend Engineer',
      'expert-be1', 'Arjun Kapoor', 'Amazon', 'Principal Engineer', 'AK', '#22d3ee',
      'Feb 27, 2026', '11:00 AM', 'confirmed',
      JSON.stringify(['Java','Spring Boot','SQL','Redis']), 79,
      JSON.stringify(['System Design','Optimization']),
      JSON.stringify({ quantitative: 82, logical: 78, verbal: 65 }), '2026-02-26T08:00:00Z');
    insertBooking.run('b2', 'student-1', 'Anjali Nair', 'anjali@demo.com', 'NIT Trichy', 'Full Stack Developer',
      'expert-fs1', 'Priya Mehta', 'Google', 'Senior SWE', 'PM', '#a78bfa',
      'Feb 28, 2026', '3:00 PM', 'confirmed',
      JSON.stringify(['React','Node.js','MongoDB','AWS']), 85,
      JSON.stringify(['Behavioral','Leadership questions']),
      JSON.stringify({ quantitative: 91, logical: 88, verbal: 72 }), '2026-02-26T09:00:00Z');

    // Seed some session feedback (after bookings due to FK constraint)
    const insertFeedback = db.prepare(`INSERT INTO session_feedback (booking_id, expert_id, student_id, student_name, role, rating, feedback, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertFeedback.run('b1', 'expert-be1', 'student-1', 'Kartik Rao', 'Data Scientist', 4, 'Strong ML concepts, needs work on statistics', '2026-02-24T15:00:00Z');
    insertFeedback.run('b2', 'expert-fs1', 'student-1', 'Meera Shah', 'Frontend Developer', 5, 'Excellent React knowledge and communication!', '2026-02-22T15:00:00Z');
  });

  seedAll();
}

// ════════════════════════════════════════════════════════════════════
//  USER QUERIES
// ════════════════════════════════════════════════════════════════════
export function findUserByEmail(email: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any | undefined;
}

export function getUserById(id: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any | undefined;
}

export function createUser(user: { id: string; email: string; password: string; name: string; role: string; college?: string; company?: string }) {
  const db = getDB();
  db.prepare(`INSERT INTO users (id, email, password_hash, name, role, college, company) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, user.email, user.password, user.name, user.role, user.college || null, user.company || null);
}

export function updateUser(email: string, data: Record<string, any>) {
  const db = getDB();
  const fields = Object.keys(data);
  const colMap: Record<string, string> = {
    targetRole: 'target_role', graduationYear: 'graduation_year',
    name: 'name', phone: 'phone', bio: 'bio', college: 'college',
    cgpa: 'cgpa', linkedin: 'linkedin', github: 'github', skills: 'skills',
    company: 'company', avatar: 'avatar',
  };
  const sets: string[] = [];
  const vals: any[] = [];
  for (const f of fields) {
    const col = colMap[f] || f;
    let val = data[f];
    if (Array.isArray(val)) val = JSON.stringify(val);
    sets.push(`${col} = ?`);
    vals.push(val);
  }
  if (sets.length === 0) return;
  vals.push(email);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE email = ?`).run(...vals);
}

export function getAllExperts() {
  const db = getDB();
  return db.prepare(`
    SELECT u.*, ep.designation, ep.domain, ep.expertise, ep.rating, ep.total_sessions, ep.avatar_initials, ep.avatar_color
    FROM users u JOIN expert_profiles ep ON u.id = ep.expert_id
    WHERE u.role = 'expert'
    ORDER BY ep.rating DESC
  `).all() as any[];
}

export function getExpertsByDomain(domain: string) {
  const db = getDB();
  return db.prepare(`
    SELECT u.*, ep.designation, ep.domain, ep.expertise, ep.rating, ep.total_sessions, ep.avatar_initials, ep.avatar_color
    FROM users u JOIN expert_profiles ep ON u.id = ep.expert_id
    WHERE ep.domain = ?
    ORDER BY ep.rating DESC
  `).all(domain) as any[];
}

// ════════════════════════════════════════════════════════════════════
//  BOOKING QUERIES
// ════════════════════════════════════════════════════════════════════
export function createBooking(booking: any) {
  const db = getDB();
  db.prepare(`
    INSERT INTO bookings (id, student_id, student_name, student_email, college, role, expert_id, expert_name, expert_company, expert_designation, expert_avatar, expert_color, date, time, status, skills, ai_score, weak_areas, aptitude_scores)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(booking.id, booking.studentId, booking.studentName, booking.studentEmail, booking.college,
    booking.role, booking.expertId, booking.expertName, booking.expertCompany, booking.expertDesignation,
    booking.expertAvatar, booking.expertColor, booking.date, booking.time, booking.status || 'pending',
    JSON.stringify(booking.skills || []), booking.aiScore || 0,
    JSON.stringify(booking.weakAreas || []), JSON.stringify(booking.aptitudeScores || {}));
}

export function getBookingsByExpert(expertId: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM bookings WHERE expert_id = ? ORDER BY created_at DESC`).all(expertId) as any[];
}

export function getBookingsByStudent(email: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM bookings WHERE student_email = ? ORDER BY created_at DESC`).all(email) as any[];
}

export function updateBookingStatus(bookingId: string, status: string, meetingRoom?: string, meetingLink?: string) {
  const db = getDB();
  if (meetingRoom && meetingLink) {
    db.prepare(`UPDATE bookings SET status = ?, meeting_room = ?, meeting_link = ? WHERE id = ?`)
      .run(status, meetingRoom, meetingLink, bookingId);
  } else {
    db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(status, bookingId);
  }
}

export function getBookingById(id: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as any | undefined;
}

// ════════════════════════════════════════════════════════════════════
//  NOTIFICATION QUERIES
// ════════════════════════════════════════════════════════════════════
export function createNotification(notif: any) {
  const db = getDB();
  db.prepare(`
    INSERT INTO notifications (id, type, student_email, expert_name, expert_company, role, date, time, meeting_link, meeting_room, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(notif.id, notif.type, notif.studentEmail, notif.expertName, notif.expertCompany,
    notif.role, notif.date, notif.time, notif.meetingLink || null, notif.meetingRoom || null, notif.message);
}

export function getNotificationsByStudent(email: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM notifications WHERE student_email = ? ORDER BY created_at DESC`).all(email) as any[];
}

export function markNotificationRead(id: string) {
  const db = getDB();
  db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
}

// ════════════════════════════════════════════════════════════════════
//  AI INTERVIEW SESSION QUERIES
// ════════════════════════════════════════════════════════════════════
export function saveAISession(session: any) {
  const db = getDB();
  db.prepare(`
    INSERT INTO ai_interview_sessions (user_email, user_name, job_role, interview_type, difficulty, questions, answers, code_snapshots, scores, overall_score, tab_switches, duration_sec, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(session.userEmail, session.userName, session.jobRole, session.interviewType, session.difficulty,
    JSON.stringify(session.questions || []), JSON.stringify(session.answers || []),
    JSON.stringify(session.codeSnapshots || []), JSON.stringify(session.scores || {}),
    session.overallScore || 0, session.tabSwitches || 0, session.durationSec || 0, session.completed ? 1 : 0);
}

export function getAISessions(userEmail: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM ai_interview_sessions WHERE user_email = ? ORDER BY created_at DESC`).all(userEmail) as any[];
}

export function getAISessionStats(userEmail: string) {
  const db = getDB();
  return db.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      ROUND(AVG(overall_score), 1) as avg_score,
      MAX(overall_score) as best_score,
      SUM(duration_sec) as total_time
    FROM ai_interview_sessions WHERE user_email = ? AND completed = 1
  `).get(userEmail) as any;
}

// ════════════════════════════════════════════════════════════════════
//  QUIZ QUERIES
// ════════════════════════════════════════════════════════════════════
export function saveQuizAttempt(attempt: any) {
  const db = getDB();
  db.prepare(`INSERT INTO quiz_attempts (user_email, section, score, total, accuracy, time_used, answers) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(attempt.userEmail, attempt.section, attempt.score, attempt.total, attempt.accuracy, attempt.timeUsed || 0, JSON.stringify(attempt.answers || []));
}

export function getQuizAttempts(userEmail: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM quiz_attempts WHERE user_email = ? ORDER BY created_at DESC`).all(userEmail) as any[];
}

export function getQuizStats(userEmail: string) {
  const db = getDB();
  return db.prepare(`
    SELECT
      section,
      COUNT(*) as attempts,
      ROUND(AVG(accuracy), 1) as avg_accuracy,
      MAX(accuracy) as best_accuracy,
      MAX(score) as best_score,
      SUM(time_used) as total_time
    FROM quiz_attempts WHERE user_email = ? GROUP BY section
  `).all(userEmail) as any[];
}

export function getQuizTotalAttempts(userEmail: string) {
  const db = getDB();
  return (db.prepare(`SELECT COUNT(*) as c FROM quiz_attempts WHERE user_email = ?`).get(userEmail) as any)?.c || 0;
}

// ════════════════════════════════════════════════════════════════════
//  SESSION FEEDBACK QUERIES
// ════════════════════════════════════════════════════════════════════
export function saveFeedback(fb: any) {
  const db = getDB();
  db.prepare(`INSERT INTO session_feedback (booking_id, expert_id, student_id, student_name, role, rating, feedback) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(fb.bookingId, fb.expertId, fb.studentId, fb.studentName, fb.role, fb.rating, fb.feedback);
}

export function getFeedbackByExpert(expertId: string) {
  const db = getDB();
  return db.prepare(`SELECT * FROM session_feedback WHERE expert_id = ? ORDER BY created_at DESC`).all(expertId) as any[];
}

export function getExpertStats(expertId: string) {
  const db = getDB();
  return db.prepare(`
    SELECT
      COUNT(*) as total_feedback,
      ROUND(AVG(rating), 1) as avg_rating,
      SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) * 100.0 / MAX(COUNT(*), 1) as positive_pct
    FROM session_feedback WHERE expert_id = ?
  `).get(expertId) as any;
}

// ════════════════════════════════════════════════════════════════════
//  ACTIVITY LOG QUERIES
// ════════════════════════════════════════════════════════════════════
export function logActivity(entry: any) {
  const db = getDB();
  db.prepare(`INSERT INTO activity_log (user_email, type, title, detail, score, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(entry.userEmail, entry.type, entry.title, entry.detail || null, entry.score || null, entry.icon || 'activity', entry.color || '#a78bfa');
}

export function getRecentActivity(userEmail: string, limit = 10) {
  const db = getDB();
  return db.prepare(`SELECT * FROM activity_log WHERE user_email = ? ORDER BY created_at DESC LIMIT ?`).all(userEmail, limit) as any[];
}

// ════════════════════════════════════════════════════════════════════
//  ANALYTICS / AGGREGATION QUERIES
// ════════════════════════════════════════════════════════════════════
export function getStudentDashboardStats(userEmail: string) {
  const db = getDB();
  const aiStats = db.prepare(`
    SELECT COUNT(*) as total, ROUND(AVG(overall_score),0) as avg_score FROM ai_interview_sessions WHERE user_email = ? AND completed = 1
  `).get(userEmail) as any;
  const quizTotal = (db.prepare(`SELECT COUNT(*) as c FROM quiz_attempts WHERE user_email = ?`).get(userEmail) as any)?.c || 0;
  const expertSessions = (db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE student_email = ? AND status IN ('confirmed','approved','completed')`).get(userEmail) as any)?.c || 0;
  return {
    aiInterviews: aiStats?.total || 0,
    avgScore: aiStats?.avg_score || 0,
    quizzesDone: quizTotal,
    expertSessions,
  };
}

export function getScoreTrend(userEmail: string) {
  const db = getDB();
  return db.prepare(`
    SELECT DATE(created_at) as date, overall_score as score
    FROM ai_interview_sessions WHERE user_email = ? AND completed = 1
    ORDER BY created_at ASC
  `).all(userEmail) as any[];
}

// ════════════════════════════════════════════════════════════════════
//  RESUME (kept from original)
// ════════════════════════════════════════════════════════════════════
export function saveResumeAnalysis(
  userEmail: string,
  filename: string,
  fileHash: string,
  analysis: any
) {
  const db = getDB();
  const skills = analysis.extracted?.skills || [];
  const suggestedRoles = analysis.extracted?.suggestedRoles || [];

  db.prepare(`
    INSERT INTO resume_analyses
      (user_email, filename, file_hash, ats_score, grade, technical_score, communication_score, skills, suggested_roles, full_analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userEmail, filename, fileHash,
    analysis.ats?.score ?? 0, analysis.ats?.grade ?? 'C',
    analysis.extracted?.technicalScore ?? 0, analysis.extracted?.communicationScore ?? 0,
    JSON.stringify(skills), JSON.stringify(suggestedRoles), JSON.stringify(analysis)
  );

  const upsert = db.prepare(`INSERT OR IGNORE INTO user_skills (user_email, skill) VALUES (?, ?)`);
  const insertMany = db.transaction((s: string[]) => { for (const sk of s) upsert.run(userEmail, sk); });
  insertMany(skills);
}

export function getCachedAnalysis(fileHash: string) {
  const db = getDB();
  const row = db.prepare(`SELECT full_analysis FROM resume_analyses WHERE file_hash = ? ORDER BY analyzed_at DESC LIMIT 1`).get(fileHash) as { full_analysis: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.full_analysis);
}

export function getUserSkills(userEmail: string): string[] {
  const db = getDB();
  const rows = db.prepare(`SELECT skill FROM user_skills WHERE user_email = ? ORDER BY added_at DESC`).all(userEmail) as { skill: string }[];
  return rows.map(r => r.skill);
}

export function getLatestAnalysis(userEmail: string) {
  const db = getDB();
  const row = db.prepare(`SELECT full_analysis FROM resume_analyses WHERE user_email = ? ORDER BY analyzed_at DESC LIMIT 1`).get(userEmail) as { full_analysis: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.full_analysis);
}
