-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PlaceAI (Enigma 2.0 — The Dyno) — Supabase SQL Queries                  ║
-- ║  Copy & paste this ENTIRE file into the Supabase SQL Editor and run it.   ║
-- ║  It will create all 11 tables, indexes, and seed demo data.               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════
--  SECTION 1: DROP EXISTING TABLES (fresh start) — OPTIONAL
--  Uncomment the lines below ONLY if you want to reset everything.
-- ════════════════════════════════════════════════════════════════════

-- DROP TABLE IF EXISTS user_skills CASCADE;
-- DROP TABLE IF EXISTS resume_analyses CASCADE;
-- DROP TABLE IF EXISTS activity_log CASCADE;
-- DROP TABLE IF EXISTS session_feedback CASCADE;
-- DROP TABLE IF EXISTS quiz_attempts CASCADE;
-- DROP TABLE IF EXISTS ai_interview_sessions CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS expert_availability CASCADE;
-- DROP TABLE IF EXISTS expert_profiles CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;


-- ════════════════════════════════════════════════════════════════════
--  SECTION 2: CREATE TABLES
-- ════════════════════════════════════════════════════════════════════

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL DEFAULT 'demo123',
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('student', 'expert')),
  avatar          TEXT,
  college         TEXT,
  company         TEXT,
  skills          JSONB DEFAULT '[]'::jsonb,
  target_role     TEXT,
  cgpa            TEXT,
  graduation_year TEXT,
  phone           TEXT,
  bio             TEXT,
  linkedin        TEXT,
  github          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. EXPERT PROFILES (extra details for experts)
CREATE TABLE IF NOT EXISTS expert_profiles (
  expert_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  designation     TEXT,
  domain          TEXT,
  expertise       JSONB DEFAULT '[]'::jsonb,
  rating          REAL DEFAULT 4.8,
  total_sessions  INTEGER DEFAULT 0,
  avatar_initials TEXT,
  avatar_color    TEXT DEFAULT '#a78bfa'
);

-- 3. EXPERT AVAILABILITY
CREATE TABLE IF NOT EXISTS expert_availability (
  id           SERIAL PRIMARY KEY,
  expert_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,
  time_slot    TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(expert_id, date, time_slot)
);

-- 4. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id                  TEXT PRIMARY KEY,
  student_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','confirmed','completed')),
  meeting_room        TEXT,
  meeting_link        TEXT,
  skills              JSONB DEFAULT '[]'::jsonb,
  ai_score            INTEGER DEFAULT 0,
  weak_areas          JSONB DEFAULT '[]'::jsonb,
  aptitude_scores     JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 5. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL CHECK (type IN ('approved','rejected','info','reminder')),
  student_email   TEXT NOT NULL,
  expert_name     TEXT,
  expert_company  TEXT,
  role            TEXT,
  date            TEXT,
  time            TEXT,
  meeting_link    TEXT,
  meeting_room    TEXT,
  message         TEXT NOT NULL,
  read            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. AI INTERVIEW SESSIONS
CREATE TABLE IF NOT EXISTS ai_interview_sessions (
  id              SERIAL PRIMARY KEY,
  user_email      TEXT NOT NULL,
  user_name       TEXT,
  job_role        TEXT NOT NULL,
  interview_type  TEXT DEFAULT 'full',
  difficulty      TEXT DEFAULT 'medium',
  questions       JSONB DEFAULT '[]'::jsonb,
  answers         JSONB DEFAULT '[]'::jsonb,
  code_snapshots  JSONB DEFAULT '[]'::jsonb,
  scores          JSONB DEFAULT '{}'::jsonb,
  overall_score   INTEGER DEFAULT 0,
  tab_switches    INTEGER DEFAULT 0,
  duration_sec    INTEGER DEFAULT 0,
  completed       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id          SERIAL PRIMARY KEY,
  user_email  TEXT NOT NULL,
  section     TEXT NOT NULL,
  score       INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  accuracy    REAL NOT NULL,
  time_used   INTEGER DEFAULT 0,
  answers     JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 8. SESSION FEEDBACK (expert → student)
CREATE TABLE IF NOT EXISTS session_feedback (
  id           SERIAL PRIMARY KEY,
  booking_id   TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  expert_id    TEXT NOT NULL,
  student_id   TEXT NOT NULL,
  student_name TEXT,
  role         TEXT,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback     TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 9. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id          SERIAL PRIMARY KEY,
  user_email  TEXT NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  detail      TEXT,
  score       TEXT,
  icon        TEXT DEFAULT 'activity',
  color       TEXT DEFAULT '#a78bfa',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 10. RESUME ANALYSES
CREATE TABLE IF NOT EXISTS resume_analyses (
  id                  SERIAL PRIMARY KEY,
  user_email          TEXT NOT NULL,
  filename            TEXT NOT NULL,
  file_hash           TEXT NOT NULL,
  analyzed_at         TIMESTAMPTZ DEFAULT now(),
  ats_score           INTEGER,
  grade               TEXT,
  technical_score     INTEGER,
  communication_score INTEGER,
  skills              JSONB,
  suggested_roles     JSONB,
  full_analysis       JSONB
);

-- 11. USER SKILLS
CREATE TABLE IF NOT EXISTS user_skills (
  id          SERIAL PRIMARY KEY,
  user_email  TEXT NOT NULL,
  skill       TEXT NOT NULL,
  added_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_email, skill)
);


-- ════════════════════════════════════════════════════════════════════
--  SECTION 3: CREATE INDEXES
-- ════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_resume_email       ON resume_analyses(user_email);
CREATE INDEX IF NOT EXISTS idx_resume_hash        ON resume_analyses(file_hash);
CREATE INDEX IF NOT EXISTS idx_bookings_student   ON bookings(student_email);
CREATE INDEX IF NOT EXISTS idx_bookings_expert    ON bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_stud ON notifications(student_email);
CREATE INDEX IF NOT EXISTS idx_quiz_user          ON quiz_attempts(user_email);
CREATE INDEX IF NOT EXISTS idx_ai_session_user    ON ai_interview_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_user      ON activity_log(user_email);
CREATE INDEX IF NOT EXISTS idx_feedback_expert    ON session_feedback(expert_id);


-- ════════════════════════════════════════════════════════════════════
--  SECTION 4: SEED DEMO DATA
-- ════════════════════════════════════════════════════════════════════

-- ── 4.1 Student User ─────────────────────────────────────────────
INSERT INTO users (id, email, password_hash, name, role, college, company, skills, target_role, cgpa, graduation_year, phone, bio, linkedin, github)
VALUES (
  'student-1',
  'student@demo.com',
  'demo123',
  'Arjun Sharma',
  'student',
  'IIT Bombay',
  NULL,
  '["Python","JavaScript","React","Node.js","SQL","Machine Learning"]'::jsonb,
  'Full Stack Developer',
  '8.7',
  '2025',
  '+91 9876543210',
  'Passionate about building scalable web applications and exploring ML.',
  'https://linkedin.com/in/arjun-sharma',
  'https://github.com/arjun-sharma'
) ON CONFLICT (id) DO NOTHING;


-- ── 4.2 Expert Users + Profiles ──────────────────────────────────

-- Expert: Priya Mehta (Full Stack)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-fs1', 'priya.mehta@expert.com', 'demo123', 'Priya Mehta', 'expert', 'Google', '["React","Node.js","System Design"]'::jsonb, '8+ years at Google. Ex-interviewer for 3 years.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-fs1', 'Senior SWE', 'Full Stack Developer', '["React","Node.js","System Design","Scalability"]'::jsonb, 4.9, 120, 'PM', '#a78bfa')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Rohit Jain (Full Stack)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-fs2', 'rohit.jain@expert.com', 'demo123', 'Rohit Jain', 'expert', 'Flipkart', '["Next.js","TypeScript","Microservices"]'::jsonb, 'Staff Engineer at Flipkart. Full stack expert with 6+ years.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-fs2', 'Staff Engineer', 'Full Stack Developer', '["Next.js","TypeScript","Microservices","Docker"]'::jsonb, 4.8, 85, 'RJ', '#22d3ee')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Ananya Das (Full Stack)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-fs3', 'ananya.das@expert.com', 'demo123', 'Ananya Das', 'expert', 'Atlassian', '["MERN Stack","GraphQL","AWS"]'::jsonb, 'Tech Lead at Atlassian.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-fs3', 'Tech Lead', 'Full Stack Developer', '["MERN Stack","GraphQL","AWS","CI/CD"]'::jsonb, 4.7, 64, 'AD', '#34d399')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Arjun Kapoor (Backend)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-be1', 'arjun.kapoor@expert.com', 'demo123', 'Arjun Kapoor', 'expert', 'Amazon', '["Distributed Systems","Java","AWS"]'::jsonb, 'Amazon L7. Expert in distributed systems.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-be1', 'Principal Engineer', 'Backend Engineer', '["Distributed Systems","Java","AWS","Leadership Principles"]'::jsonb, 4.9, 156, 'AK', '#22d3ee')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Karthik Rao (Backend)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-be2', 'karthik.rao@expert.com', 'demo123', 'Karthik Rao', 'expert', 'Uber', '["Go","Kafka","System Design"]'::jsonb, '5+ years at Uber.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-be2', 'Senior Engineer', 'Backend Engineer', '["Go","Kafka","System Design","Real-time Systems"]'::jsonb, 4.8, 92, 'KR', '#f59e0b')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Neha Gupta (Backend)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-be3', 'neha.gupta@expert.com', 'demo123', 'Neha Gupta', 'expert', 'Razorpay', '["Python","PostgreSQL","Docker"]'::jsonb, 'EM at Razorpay.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-be3', 'Engineering Manager', 'Backend Engineer', '["Python","PostgreSQL","Docker","Payment Systems"]'::jsonb, 4.7, 78, 'NG', '#a78bfa')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Sneha Reddy (Data Science)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-ds1', 'sneha.reddy@expert.com', 'demo123', 'Sneha Reddy', 'expert', 'Microsoft', '["Python","ML","Statistics"]'::jsonb, 'Azure AI team.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-ds1', 'Senior Data Scientist', 'Data Scientist', '["Python","ML","Statistics","Azure ML"]'::jsonb, 4.9, 110, 'SR', '#34d399')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Aditya Sharma (Data Science)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-ds2', 'aditya.sharma@expert.com', 'demo123', 'Aditya Sharma', 'expert', 'Meta', '["Deep Learning","NLP","A/B Testing"]'::jsonb, 'Staff DS at Meta.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-ds2', 'Staff Data Scientist', 'Data Scientist', '["Deep Learning","NLP","A/B Testing","Recommendation Systems"]'::jsonb, 4.8, 95, 'AS', '#a78bfa')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Ritu Patel (Data Science)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-ds3', 'ritu.patel@expert.com', 'demo123', 'Ritu Patel', 'expert', 'Swiggy', '["Demand Forecasting","SQL","Tableau"]'::jsonb, 'Senior DS at Swiggy.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-ds3', 'Senior Data Scientist', 'Data Scientist', '["Demand Forecasting","SQL","Tableau","Business Analytics"]'::jsonb, 4.6, 47, 'RP', '#f59e0b')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Vikram Iyer (ML)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-ml1', 'vikram.iyer@expert.com', 'demo123', 'Vikram Iyer', 'expert', 'NVIDIA', '["PyTorch","CUDA","MLOps"]'::jsonb, 'ML Infra Lead at NVIDIA.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-ml1', 'ML Infra Lead', 'ML Engineer', '["PyTorch","CUDA","MLOps","GPU Optimization"]'::jsonb, 4.9, 88, 'VI', '#22d3ee')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Deepa Nair (ML)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-ml2', 'deepa.nair@expert.com', 'demo123', 'Deepa Nair', 'expert', 'Google DeepMind', '["TensorFlow","Reinforcement Learning","Computer Vision"]'::jsonb, 'Research Engineer at DeepMind.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-ml2', 'Research Engineer', 'ML Engineer', '["TensorFlow","RL","Computer Vision","Research"]'::jsonb, 4.8, 72, 'DN', '#34d399')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Saurabh Verma (ML)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-ml3', 'saurabh.verma@expert.com', 'demo123', 'Saurabh Verma', 'expert', 'Amazon Science', '["Feature Engineering","SageMaker","NLP"]'::jsonb, 'Applied Scientist at Amazon.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-ml3', 'Applied Scientist', 'ML Engineer', '["Feature Engineering","SageMaker","NLP","Production ML"]'::jsonb, 4.7, 61, 'SV', '#f59e0b')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Kavya Krishnan (Frontend)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-fe1', 'kavya.krishnan@expert.com', 'demo123', 'Kavya Krishnan', 'expert', 'Airbnb', '["React","CSS Architecture","Performance"]'::jsonb, 'Senior FE at Airbnb.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-fe1', 'Senior Frontend Engineer', 'Frontend Developer', '["React","CSS Architecture","Performance","Design Systems"]'::jsonb, 4.8, 74, 'KK', '#a78bfa')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Manish Tiwari (Frontend)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-fe2', 'manish.tiwari@expert.com', 'demo123', 'Manish Tiwari', 'expert', 'Razorpay', '["Next.js","TypeScript","Testing"]'::jsonb, 'Frontend Lead at Razorpay.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-fe2', 'Frontend Lead', 'Frontend Developer', '["Next.js","TypeScript","Testing","Checkout SDKs"]'::jsonb, 4.7, 58, 'MT', '#22d3ee')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Shruti Bose (Frontend)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-fe3', 'shruti.bose@expert.com', 'demo123', 'Shruti Bose', 'expert', 'Figma', '["WebGL","Canvas","State Management"]'::jsonb, 'Staff Engineer at Figma.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-fe3', 'Staff Engineer', 'Frontend Developer', '["WebGL","Canvas","State Management","Rendering Engines"]'::jsonb, 4.9, 86, 'SB', '#34d399')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Rajesh Kumar (DevOps)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-do1', 'rajesh.kumar@expert.com', 'demo123', 'Rajesh Kumar', 'expert', 'Netflix', '["Kubernetes","Terraform","CI/CD"]'::jsonb, 'Senior SRE at Netflix.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-do1', 'Senior SRE', 'DevOps Engineer', '["Kubernetes","Terraform","CI/CD","Chaos Engineering"]'::jsonb, 4.9, 102, 'RK', '#f59e0b')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Pooja Singh (DevOps)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-do2', 'pooja.singh@expert.com', 'demo123', 'Pooja Singh', 'expert', 'AWS', '["AWS","CloudFormation","Security"]'::jsonb, 'Solutions Architect at AWS.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-do2', 'Solutions Architect', 'DevOps Engineer', '["AWS","CloudFormation","Security","Multi-Cloud"]'::jsonb, 4.8, 93, 'PS', '#a78bfa')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Amit Desai (DevOps)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-do3', 'amit.desai@expert.com', 'demo123', 'Amit Desai', 'expert', 'Zomato', '["Docker","Prometheus","Linux"]'::jsonb, 'Platform Engineer at Zomato.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-do3', 'Platform Engineer', 'DevOps Engineer', '["Docker","Prometheus","Linux","Monitoring"]'::jsonb, 4.6, 45, 'AD2', '#22d3ee')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Vikram Singh (Product Manager)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-pm1', 'vikram.singh@expert.com', 'demo123', 'Vikram Singh', 'expert', 'Flipkart', '["Product Strategy","Analytics","UX"]'::jsonb, 'Director of Product at Flipkart.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-pm1', 'Director of Product', 'Product Manager', '["Product Strategy","Analytics","UX","Go-to-Market"]'::jsonb, 4.9, 134, 'VS', '#f59e0b')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Megha Arora (Product Manager)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-pm2', 'megha.arora@expert.com', 'demo123', 'Megha Arora', 'expert', 'Google', '["Data Products","Growth","Roadmapping"]'::jsonb, 'Group PM at Google.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-pm2', 'Group PM', 'Product Manager', '["Data Products","Growth","Roadmapping","User Research"]'::jsonb, 4.8, 87, 'MA', '#a78bfa')
ON CONFLICT (expert_id) DO NOTHING;

-- Expert: Nitin Bhatt (Product Manager)
INSERT INTO users (id, email, password_hash, name, role, company, skills, bio)
VALUES ('expert-pm3', 'nitin.bhatt@expert.com', 'demo123', 'Nitin Bhatt', 'expert', 'Cred', '["Fintech","User Research","GTM Strategy"]'::jsonb, 'Senior PM at CRED.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expert_profiles (expert_id, designation, domain, expertise, rating, total_sessions, avatar_initials, avatar_color)
VALUES ('expert-pm3', 'Senior PM', 'Product Manager', '["Fintech","User Research","GTM Strategy","0-to-1 Products"]'::jsonb, 4.7, 56, 'NB', '#34d399')
ON CONFLICT (expert_id) DO NOTHING;


-- ── 4.3 Demo Quiz Attempts ───────────────────────────────────────

INSERT INTO quiz_attempts (user_email, section, score, total, accuracy, time_used, created_at) VALUES
  ('student@demo.com', 'quantitative', 8, 10, 80.0, 420, '2026-02-24T10:00:00Z'),
  ('student@demo.com', 'quantitative', 7, 10, 70.0, 380, '2026-02-20T10:00:00Z'),
  ('student@demo.com', 'quantitative', 8, 10, 80.0, 350, '2026-02-18T10:00:00Z'),
  ('student@demo.com', 'quantitative', 9, 10, 90.0, 400, '2026-02-15T10:00:00Z'),
  ('student@demo.com', 'logical', 9, 10, 90.0, 300, '2026-02-25T10:00:00Z'),
  ('student@demo.com', 'logical', 10, 10, 100.0, 280, '2026-02-23T10:00:00Z'),
  ('student@demo.com', 'logical', 8, 10, 80.0, 320, '2026-02-21T10:00:00Z'),
  ('student@demo.com', 'logical', 9, 10, 90.0, 310, '2026-02-19T10:00:00Z'),
  ('student@demo.com', 'logical', 9, 10, 90.0, 290, '2026-02-16T10:00:00Z'),
  ('student@demo.com', 'logical', 10, 10, 100.0, 270, '2026-02-14T10:00:00Z'),
  ('student@demo.com', 'verbal', 7, 10, 70.0, 450, '2026-02-22T10:00:00Z'),
  ('student@demo.com', 'verbal', 6, 10, 60.0, 480, '2026-02-17T10:00:00Z'),
  ('student@demo.com', 'verbal', 6, 10, 60.0, 500, '2026-02-13T10:00:00Z');


-- ── 4.4 Demo AI Interview Sessions ──────────────────────────────

INSERT INTO ai_interview_sessions (user_email, user_name, job_role, interview_type, difficulty, scores, overall_score, tab_switches, duration_sec, completed, created_at) VALUES
  ('student@demo.com', 'Arjun Sharma', 'Full Stack Developer', 'full', 'medium',
    '{"technical":85,"problemSolving":78,"communication":82,"optimization":80}'::jsonb, 82, 0, 1800, true, '2026-02-25T14:00:00Z'),
  ('student@demo.com', 'Arjun Sharma', 'Full Stack Developer', 'dsa', 'medium',
    '{"technical":88,"problemSolving":82,"communication":79,"optimization":85}'::jsonb, 84, 1, 1500, true, '2026-02-23T11:00:00Z'),
  ('student@demo.com', 'Arjun Sharma', 'Backend Engineer', 'full', 'hard',
    '{"technical":76,"problemSolving":72,"communication":80,"optimization":70}'::jsonb, 75, 0, 2100, true, '2026-02-21T16:00:00Z'),
  ('student@demo.com', 'Arjun Sharma', 'Data Scientist', 'behavioral', 'easy',
    '{"technical":70,"problemSolving":75,"communication":90,"optimization":68}'::jsonb, 76, 0, 1200, true, '2026-02-19T09:00:00Z');


-- ── 4.5 Demo Activity Log ────────────────────────────────────────

INSERT INTO activity_log (user_email, type, title, detail, score, icon, color, created_at) VALUES
  ('student@demo.com', 'quiz', 'Completed Quantitative Aptitude Quiz', 'quantitative', '80%', 'book', '#a78bfa', '2026-02-26T08:00:00Z'),
  ('student@demo.com', 'interview', 'AI Interview — Full Stack Developer', 'Full Stack Developer', '84%', 'code', '#22d3ee', '2026-02-25T14:00:00Z'),
  ('student@demo.com', 'booking', 'Mock Interview booked with Priya Mehta', 'Full Stack Developer', NULL, 'calendar', '#34d399', '2026-02-24T10:00:00Z'),
  ('student@demo.com', 'quiz', 'Completed Logical Reasoning quiz', 'logical', '91%', 'brain', '#f59e0b', '2026-02-23T09:00:00Z');


-- ── 4.6 Demo Bookings ────────────────────────────────────────────

INSERT INTO bookings (id, student_id, student_name, student_email, college, role, expert_id, expert_name, expert_company, expert_designation, expert_avatar, expert_color, date, time, status, skills, ai_score, weak_areas, aptitude_scores, created_at) VALUES
  ('b1', 'student-1', 'Rahul Verma', 'rahul@demo.com', 'IIT Delhi', 'Backend Engineer',
    'expert-be1', 'Arjun Kapoor', 'Amazon', 'Principal Engineer', 'AK', '#22d3ee',
    'Feb 27, 2026', '11:00 AM', 'confirmed',
    '["Java","Spring Boot","SQL","Redis"]'::jsonb, 79,
    '["System Design","Optimization"]'::jsonb,
    '{"quantitative":82,"logical":78,"verbal":65}'::jsonb, '2026-02-26T08:00:00Z'),
  ('b2', 'student-1', 'Anjali Nair', 'anjali@demo.com', 'NIT Trichy', 'Full Stack Developer',
    'expert-fs1', 'Priya Mehta', 'Google', 'Senior SWE', 'PM', '#a78bfa',
    'Feb 28, 2026', '3:00 PM', 'confirmed',
    '["React","Node.js","MongoDB","AWS"]'::jsonb, 85,
    '["Behavioral","Leadership questions"]'::jsonb,
    '{"quantitative":91,"logical":88,"verbal":72}'::jsonb, '2026-02-26T09:00:00Z');


-- ── 4.7 Demo Session Feedback ────────────────────────────────────

INSERT INTO session_feedback (booking_id, expert_id, student_id, student_name, role, rating, feedback, created_at) VALUES
  ('b1', 'expert-be1', 'student-1', 'Kartik Rao', 'Data Scientist', 4, 'Strong ML concepts, needs work on statistics', '2026-02-24T15:00:00Z'),
  ('b2', 'expert-fs1', 'student-1', 'Meera Shah', 'Frontend Developer', 5, 'Excellent React knowledge and communication!', '2026-02-22T15:00:00Z');


-- ════════════════════════════════════════════════════════════════════
--  SECTION 5: ENABLE ROW LEVEL SECURITY (RLS) — OPTIONAL
--  Uncomment these if you want per-user data isolation.
-- ════════════════════════════════════════════════════════════════════

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_interview_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════════════
--  SECTION 6: USEFUL QUERY EXAMPLES (for testing in Supabase SQL Editor)
-- ════════════════════════════════════════════════════════════════════

-- Get student dashboard stats:
-- SELECT
--   (SELECT COUNT(*) FROM ai_interview_sessions WHERE user_email = 'student@demo.com' AND completed = true) AS ai_interviews,
--   (SELECT ROUND(AVG(overall_score)) FROM ai_interview_sessions WHERE user_email = 'student@demo.com' AND completed = true) AS avg_score,
--   (SELECT COUNT(*) FROM quiz_attempts WHERE user_email = 'student@demo.com') AS quizzes_done,
--   (SELECT COUNT(*) FROM bookings WHERE student_email = 'student@demo.com' AND status IN ('confirmed','approved','completed')) AS expert_sessions;

-- Get quiz stats grouped by section:
-- SELECT section, COUNT(*) AS attempts, ROUND(AVG(accuracy)::numeric, 1) AS avg_accuracy,
--        MAX(accuracy) AS best_accuracy, MAX(score) AS best_score, SUM(time_used) AS total_time
-- FROM quiz_attempts WHERE user_email = 'student@demo.com' GROUP BY section;

-- Get AI session stats:
-- SELECT COUNT(*) AS total_sessions, ROUND(AVG(overall_score)::numeric, 1) AS avg_score,
--        MAX(overall_score) AS best_score, SUM(duration_sec) AS total_time
-- FROM ai_interview_sessions WHERE user_email = 'student@demo.com' AND completed = true;

-- Get score trend:
-- SELECT created_at::date AS date, overall_score AS score
-- FROM ai_interview_sessions WHERE user_email = 'student@demo.com' AND completed = true
-- ORDER BY created_at ASC;

-- Get all experts with profiles:
-- SELECT u.*, ep.designation, ep.domain, ep.expertise, ep.rating, ep.total_sessions, ep.avatar_initials, ep.avatar_color
-- FROM users u JOIN expert_profiles ep ON u.id = ep.expert_id WHERE u.role = 'expert' ORDER BY ep.rating DESC;

-- Get recent activity:
-- SELECT * FROM activity_log WHERE user_email = 'student@demo.com' ORDER BY created_at DESC LIMIT 10;

-- Get expert feedback stats:
-- SELECT COUNT(*) AS total_feedback, ROUND(AVG(rating)::numeric, 1) AS avg_rating,
--        ROUND(SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) * 100.0 / GREATEST(COUNT(*), 1), 1) AS positive_pct
-- FROM session_feedback WHERE expert_id = 'expert-be1';


-- ════════════════════════════════════════════════════════════════════
--  DONE! All tables created and demo data seeded.
--  Login credentials: student@demo.com / demo123
--  All 21 experts: [name]@expert.com / demo123
-- ════════════════════════════════════════════════════════════════════
