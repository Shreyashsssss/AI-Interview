import { supabase } from './supabase';

// ════════════════════════════════════════════════════════════════════
//  USER QUERIES
// ════════════════════════════════════════════════════════════════════

export async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser(user: {
  id: string; email: string; password: string; name: string;
  role: string; college?: string; company?: string;
}) {
  const { error } = await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    password_hash: user.password,
    name: user.name,
    role: user.role,
    college: user.college || null,
    company: user.company || null,
  });
  if (error) throw error;
}

export async function updateUser(email: string, data: Record<string, any>) {
  const colMap: Record<string, string> = {
    targetRole: 'target_role',
    graduationYear: 'graduation_year',
    name: 'name', phone: 'phone', bio: 'bio', college: 'college',
    cgpa: 'cgpa', linkedin: 'linkedin', github: 'github', skills: 'skills',
    company: 'company', avatar: 'avatar',
  };
  const updates: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const col = colMap[key] || key;
    updates[col] = val;
  }
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase.from('users').update(updates).eq('email', email);
  if (error) throw error;
}

export async function getAllExperts() {
  const { data, error } = await supabase
    .from('users')
    .select('*, expert_profiles(*)')
    .eq('role', 'expert');
  if (error) throw error;
  return (data || []).map(flattenExpert);
}

export async function getExpertsByDomain(domain: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, expert_profiles!inner(*)')
    .eq('role', 'expert')
    .eq('expert_profiles.domain', domain);
  if (error) throw error;
  return (data || []).map(flattenExpert);
}

function flattenExpert(row: any) {
  const ep = row.expert_profiles;
  const { expert_profiles, ...user } = row;
  return {
    ...user,
    designation: ep?.designation,
    domain: ep?.domain,
    expertise: ep?.expertise || [],
    rating: ep?.rating || 4.8,
    total_sessions: ep?.total_sessions || 0,
    avatar_initials: ep?.avatar_initials,
    avatar_color: ep?.avatar_color || '#a78bfa',
  };
}

// ════════════════════════════════════════════════════════════════════
//  BOOKING QUERIES
// ════════════════════════════════════════════════════════════════════

export async function createBooking(booking: any) {
  const { error } = await supabase.from('bookings').insert({
    id: booking.id,
    student_id: booking.studentId,
    student_name: booking.studentName,
    student_email: booking.studentEmail,
    college: booking.college,
    role: booking.role,
    expert_id: booking.expertId,
    expert_name: booking.expertName,
    expert_company: booking.expertCompany,
    expert_designation: booking.expertDesignation,
    expert_avatar: booking.expertAvatar,
    expert_color: booking.expertColor,
    date: booking.date,
    time: booking.time,
    status: booking.status || 'pending',
    skills: booking.skills || [],
    ai_score: booking.aiScore || 0,
    weak_areas: booking.weakAreas || [],
    aptitude_scores: booking.aptitudeScores || {},
  });
  if (error) throw error;
}

export async function getBookingsByExpert(expertId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('expert_id', expertId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getBookingsByStudent(email: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('student_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateBookingStatus(
  bookingId: string, status: string, meetingRoom?: string, meetingLink?: string
) {
  const updates: any = { status };
  if (meetingRoom) updates.meeting_room = meetingRoom;
  if (meetingLink) updates.meeting_link = meetingLink;
  const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId);
  if (error) throw error;
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ════════════════════════════════════════════════════════════════════
//  NOTIFICATION QUERIES
// ════════════════════════════════════════════════════════════════════

export async function createNotification(notif: any) {
  const { error } = await supabase.from('notifications').insert({
    id: notif.id,
    type: notif.type,
    student_email: notif.studentEmail,
    expert_name: notif.expertName,
    expert_company: notif.expertCompany,
    role: notif.role,
    date: notif.date,
    time: notif.time,
    meeting_link: notif.meetingLink || null,
    meeting_room: notif.meetingRoom || null,
    message: notif.message,
  });
  if (error) throw error;
}

export async function getNotificationsByStudent(email: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('student_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════════════
//  AI INTERVIEW SESSION QUERIES
// ════════════════════════════════════════════════════════════════════

export async function saveAISession(session: any) {
  const { error } = await supabase.from('ai_interview_sessions').insert({
    user_email: session.userEmail,
    user_name: session.userName,
    job_role: session.jobRole,
    interview_type: session.interviewType,
    difficulty: session.difficulty,
    questions: session.questions || [],
    answers: session.answers || [],
    code_snapshots: session.codeSnapshots || [],
    scores: session.scores || {},
    overall_score: session.overallScore || 0,
    tab_switches: session.tabSwitches || 0,
    duration_sec: session.durationSec || 0,
    completed: session.completed ? true : false,
  });
  if (error) throw error;
}

export async function getAISessions(userEmail: string) {
  const { data, error } = await supabase
    .from('ai_interview_sessions')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAISessionStats(userEmail: string) {
  const { data, error } = await supabase
    .from('ai_interview_sessions')
    .select('overall_score, duration_sec')
    .eq('user_email', userEmail)
    .eq('completed', true);
  if (error) throw error;
  const rows = data || [];
  if (rows.length === 0) return { total_sessions: 0, avg_score: 0, best_score: 0, total_time: 0 };
  const totalSessions = rows.length;
  const avgScore = Math.round(rows.reduce((s, r) => s + (r.overall_score || 0), 0) / totalSessions * 10) / 10;
  const bestScore = Math.max(...rows.map(r => r.overall_score || 0));
  const totalTime = rows.reduce((s, r) => s + (r.duration_sec || 0), 0);
  return { total_sessions: totalSessions, avg_score: avgScore, best_score: bestScore, total_time: totalTime };
}

// ════════════════════════════════════════════════════════════════════
//  QUIZ QUERIES
// ════════════════════════════════════════════════════════════════════

export async function saveQuizAttempt(attempt: any) {
  const { error } = await supabase.from('quiz_attempts').insert({
    user_email: attempt.userEmail,
    section: attempt.section,
    score: attempt.score,
    total: attempt.total,
    accuracy: attempt.accuracy,
    time_used: attempt.timeUsed || 0,
    answers: attempt.answers || [],
  });
  if (error) throw error;
}

export async function getQuizAttempts(userEmail: string) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getQuizStats(userEmail: string) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('section, score, total, accuracy, time_used')
    .eq('user_email', userEmail);
  if (error) throw error;
  const rows = data || [];
  const grouped: Record<string, any[]> = {};
  for (const r of rows) {
    if (!grouped[r.section]) grouped[r.section] = [];
    grouped[r.section].push(r);
  }
  return Object.entries(grouped).map(([section, items]) => ({
    section,
    attempts: items.length,
    avg_accuracy: Math.round(items.reduce((s, i) => s + i.accuracy, 0) / items.length * 10) / 10,
    best_accuracy: Math.max(...items.map(i => i.accuracy)),
    best_score: Math.max(...items.map(i => i.score)),
    total_time: items.reduce((s, i) => s + (i.time_used || 0), 0),
  }));
}

export async function getQuizTotalAttempts(userEmail: string) {
  const { count, error } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', userEmail);
  if (error) throw error;
  return count || 0;
}

// ════════════════════════════════════════════════════════════════════
//  SESSION FEEDBACK QUERIES
// ════════════════════════════════════════════════════════════════════

export async function saveFeedback(fb: any) {
  const { error } = await supabase.from('session_feedback').insert({
    booking_id: fb.bookingId,
    expert_id: fb.expertId,
    student_id: fb.studentId,
    student_name: fb.studentName,
    role: fb.role,
    rating: fb.rating,
    feedback: fb.feedback,
  });
  if (error) throw error;
}

export async function getFeedbackByExpert(expertId: string) {
  const { data, error } = await supabase
    .from('session_feedback')
    .select('*')
    .eq('expert_id', expertId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getExpertStats(expertId: string) {
  const { data, error } = await supabase
    .from('session_feedback')
    .select('rating')
    .eq('expert_id', expertId);
  if (error) throw error;
  const rows = data || [];
  if (rows.length === 0) return { total_feedback: 0, avg_rating: 0, positive_pct: 0 };
  const totalFeedback = rows.length;
  const avgRating = Math.round(rows.reduce((s, r) => s + r.rating, 0) / totalFeedback * 10) / 10;
  const positivePct = Math.round(rows.filter(r => r.rating >= 4).length * 100.0 / totalFeedback * 10) / 10;
  return { total_feedback: totalFeedback, avg_rating: avgRating, positive_pct: positivePct };
}

// ════════════════════════════════════════════════════════════════════
//  ACTIVITY LOG QUERIES
// ════════════════════════════════════════════════════════════════════

export async function logActivity(entry: any) {
  const { error } = await supabase.from('activity_log').insert({
    user_email: entry.userEmail,
    type: entry.type,
    title: entry.title,
    detail: entry.detail || null,
    score: entry.score || null,
    icon: entry.icon || 'activity',
    color: entry.color || '#a78bfa',
  });
  if (error) throw error;
}

export async function getRecentActivity(userEmail: string, limit = 10) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ════════════════════════════════════════════════════════════════════
//  ANALYTICS / AGGREGATION QUERIES
// ════════════════════════════════════════════════════════════════════

export async function getStudentDashboardStats(userEmail: string) {
  // AI interviews count + avg score
  const { data: aiData } = await supabase
    .from('ai_interview_sessions')
    .select('overall_score')
    .eq('user_email', userEmail)
    .eq('completed', true);
  const aiRows = aiData || [];
  const aiInterviews = aiRows.length;
  const avgScore = aiRows.length > 0
    ? Math.round(aiRows.reduce((s, r) => s + (r.overall_score || 0), 0) / aiRows.length)
    : 0;

  // Quiz count
  const { count: quizCount } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', userEmail);

  // Expert sessions count
  const { count: expertCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('student_email', userEmail)
    .in('status', ['confirmed', 'approved', 'completed']);

  return {
    aiInterviews,
    avgScore,
    quizzesDone: quizCount || 0,
    expertSessions: expertCount || 0,
  };
}

export async function getScoreTrend(userEmail: string) {
  const { data, error } = await supabase
    .from('ai_interview_sessions')
    .select('created_at, overall_score')
    .eq('user_email', userEmail)
    .eq('completed', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    date: r.created_at ? r.created_at.substring(0, 10) : '',
    score: r.overall_score,
  }));
}

// ════════════════════════════════════════════════════════════════════
//  RESUME
// ════════════════════════════════════════════════════════════════════

export async function saveResumeAnalysis(
  userEmail: string, filename: string, fileHash: string, analysis: any
) {
  const skills = analysis.extracted?.skills || [];
  const suggestedRoles = analysis.extracted?.suggestedRoles || [];

  const { error } = await supabase.from('resume_analyses').insert({
    user_email: userEmail,
    filename,
    file_hash: fileHash,
    ats_score: analysis.ats?.score ?? 0,
    grade: analysis.ats?.grade ?? 'C',
    technical_score: analysis.extracted?.technicalScore ?? 0,
    communication_score: analysis.extracted?.communicationScore ?? 0,
    skills,
    suggested_roles: suggestedRoles,
    full_analysis: analysis,
  });
  if (error) throw error;

  // Upsert skills
  for (const sk of skills) {
    await supabase.from('user_skills').upsert(
      { user_email: userEmail, skill: sk },
      { onConflict: 'user_email,skill' }
    );
  }
}

export async function getCachedAnalysis(fileHash: string) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('full_analysis')
    .eq('file_hash', fileHash)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.full_analysis || null;
}

export async function getUserSkills(userEmail: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('skill')
    .eq('user_email', userEmail)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => r.skill);
}

export async function getLatestAnalysis(userEmail: string) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('full_analysis')
    .eq('user_email', userEmail)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.full_analysis || null;
}
