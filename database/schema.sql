-- SPKS Exams Backend - Complete Database Schema
-- PostgreSQL with Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image_url TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    profile_image_url TEXT,
    roll_number VARCHAR(50) UNIQUE,
    institution VARCHAR(255),
    course VARCHAR(255),
    semester VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    passing_percentage INTEGER DEFAULT 40,
    negative_marking DECIMAL(5,2) DEFAULT 0.00,
    instructions TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    allow_resume BOOLEAN DEFAULT true,
    shuffle_questions BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 1,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_answer')),
    marks INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Options Table
CREATE TABLE IF NOT EXISTS options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Assignments Table
CREATE TABLE IF NOT EXISTS exam_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(exam_id, student_id)
);

-- Student Exam Attempts Table
CREATE TABLE IF NOT EXISTS student_exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_taken_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'abandoned')),
    ip_address VARCHAR(45),
    browser_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Answers Table
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_options TEXT[],
    text_answer TEXT,
    is_correct BOOLEAN,
    marks_obtained DECIMAL(5,2) DEFAULT 0.00,
    time_taken_seconds INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    total_marks INTEGER NOT NULL,
    obtained_marks DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    is_passed BOOLEAN NOT NULL,
    rank INTEGER,
    percentile DECIMAL(5,2),
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    skipped_answers INTEGER DEFAULT 0,
    negative_marks DECIMAL(5,2) DEFAULT 0.00,
    section_wise_scores JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attempt_id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES results(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    certificate_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'student')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('exam_assigned', 'exam_reminder', 'result_published', 'certificate_issued', 'general')),
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_type VARCHAR(20) CHECK (user_type IN ('admin', 'student')),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Admins indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution);

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON subjects(is_active);

-- Exams indexes
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_is_active ON exams(is_active);
CREATE INDEX IF NOT EXISTS idx_exams_is_published ON exams(is_published);
CREATE INDEX IF NOT EXISTS idx_exams_start_date ON exams(start_date);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);

-- Options indexes
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);

-- Exam Assignments indexes
CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_id ON exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_student_id ON exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_is_active ON exam_assignments(is_active);

-- Student Exam Attempts indexes
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_exam_id ON student_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_student_id ON student_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_status ON student_exam_attempts(status);

-- Student Answers indexes
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);

-- Results indexes
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON results(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_is_passed ON results(is_passed);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_exam_id ON certificates(exam_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Activity Logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- VIEWS
-- ============================================

-- View for Exam Statistics
CREATE OR REPLACE VIEW exam_statistics AS
SELECT 
    e.id,
    e.title,
    e.subject_id,
    s.name as subject_name,
    e.duration_minutes,
    e.total_marks,
    e.start_date,
    e.end_date,
    COUNT(DISTINCT sea.student_id) as total_attempts,
    COUNT(DISTINCT CASE WHEN sea.status = 'submitted' THEN sea.student_id END) as completed_attempts,
    AVG(r.percentage) as average_percentage,
    COUNT(CASE WHEN r.is_passed = true THEN 1 END) as passed_count,
    COUNT(CASE WHEN r.is_passed = false THEN 1 END) as failed_count
FROM exams e
LEFT JOIN subjects s ON e.subject_id = s.id
LEFT JOIN student_exam_attempts sea ON e.id = sea.exam_id
LEFT JOIN results r ON sea.id = r.attempt_id
GROUP BY e.id, s.name;

-- View for Student Performance
CREATE OR REPLACE VIEW student_performance AS
SELECT 
    st.id as student_id,
    st.full_name,
    st.email,
    st.roll_number,
    COUNT(DISTINCT sea.exam_id) as exams_attempted,
    COUNT(DISTINCT CASE WHEN r.is_passed = true THEN sea.exam_id END) as exams_passed,
    AVG(r.percentage) as average_percentage,
    SUM(r.obtained_marks) as total_marks_obtained,
    SUM(r.total_marks) as total_marks_possible
FROM students st
LEFT JOIN student_exam_attempts sea ON st.id = sea.student_id
LEFT JOIN results r ON sea.id = r.attempt_id
GROUP BY st.id, st.full_name, st.email, st.roll_number;

-- View for Leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    st.id as student_id,
    st.full_name,
    st.roll_number,
    st.institution,
    e.id as exam_id,
    e.title as exam_title,
    r.obtained_marks,
    r.percentage,
    r.rank,
    r.generated_at
FROM results r
JOIN students st ON r.student_id = st.id
JOIN exams e ON r.exam_id = e.id
ORDER BY r.percentage DESC, r.generated_at ASC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate exam results
CREATE OR REPLACE FUNCTION calculate_exam_result(attempt_id UUID)
RETURNS TABLE(
    total_marks INTEGER,
    obtained_marks DECIMAL,
    percentage DECIMAL,
    is_passed BOOLEAN,
    correct_answers INTEGER,
    wrong_answers INTEGER,
    skipped_answers INTEGER,
    negative_marks DECIMAL
) AS $$
DECLARE
    exam_record RECORD;
    passing_percentage INTEGER;
    total_obtained DECIMAL := 0;
    correct_count INTEGER := 0;
    wrong_count INTEGER := 0;
    skipped_count INTEGER := 0;
    negative_total DECIMAL := 0;
BEGIN
    -- Get exam details
    SELECT e.total_marks, e.passing_percentage, e.negative_marking
    INTO exam_record
    FROM exams e
    JOIN student_exam_attempts sea ON e.id = sea.exam_id
    WHERE sea.id = attempt_id;
    
    passing_percentage := COALESCE(exam_record.passing_percentage, 40);
    
    -- Calculate marks
    SELECT 
        COALESCE(SUM(sa.marks_obtained), 0),
        COALESCE(COUNT(CASE WHEN sa.is_correct = true THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN sa.is_correct = false AND sa.selected_options IS NOT NULL THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN sa.selected_options IS NULL AND sa.text_answer IS NULL THEN 1 END), 0),
        COALESCE(SUM(CASE WHEN sa.is_correct = false AND sa.selected_options IS NOT NULL 
                    THEN (q.marks * exam_record.negative_marking) ELSE 0 END), 0)
    INTO total_obtained, correct_count, wrong_count, skipped_count, negative_total
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.attempt_id = attempt_id;
    
    RETURN QUERY SELECT
        exam_record.total_marks,
        total_obtained - negative_total,
        ((total_obtained - negative_total) / exam_record.total_marks) * 100,
        ((total_obtained - negative_total) / exam_record.total_marks) * 100 >= passing_percentage,
        correct_count,
        wrong_count,
        skipped_count,
        negative_total;
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_user_type VARCHAR,
    p_action VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_logs (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent, metadata)
    VALUES (p_user_id, p_user_type, p_action, p_entity_type, p_entity_id, p_ip_address, p_user_agent, p_metadata)
    RETURNING id INTO log_id;
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for admins table
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for students table
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subjects table
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for exams table
CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for questions table
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all admins" ON admins
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert admins" ON admins
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update admins" ON admins
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Student policies
CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Students can update their own data" ON students
    FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);

-- Subject policies
CREATE POLICY "Authenticated users can view subjects" ON subjects
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Exam policies
CREATE POLICY "Authenticated users can view published exams" ON exams
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- Question policies
CREATE POLICY "Authenticated users can view questions" ON questions
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Student exam attempts policies
CREATE POLICY "Students can view their own attempts" ON student_exam_attempts
    FOR SELECT USING (auth.uid()::TEXT = student_id::TEXT);

CREATE POLICY "Students can insert their own attempts" ON student_exam_attempts
    FOR INSERT WITH CHECK (auth.uid()::TEXT = student_id::TEXT);

-- Student answers policies
CREATE POLICY "Students can view their own answers" ON student_answers
    FOR SELECT USING (
        auth.uid()::TEXT IN (
            SELECT student_id::TEXT 
            FROM student_exam_attempts 
            WHERE id = attempt_id
        )
    );

CREATE POLICY "Students can insert their own answers" ON student_answers
    FOR INSERT WITH CHECK (
        auth.uid()::TEXT IN (
            SELECT student_id::TEXT 
            FROM student_exam_attempts 
            WHERE id = attempt_id
        )
    );

-- Results policies
CREATE POLICY "Students can view their own results" ON results
    FOR SELECT USING (auth.uid()::TEXT = student_id::TEXT);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::TEXT = recipient_id::TEXT);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::TEXT = recipient_id::TEXT);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('super_admin', 'Super Administrator with full access'),
('admin', 'Administrator with limited access'),
('student', 'Student with exam access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, module) VALUES
('manage_students', 'Create, update, delete students', 'students'),
('manage_subjects', 'Create, update, delete subjects', 'subjects'),
('manage_exams', 'Create, update, delete exams', 'exams'),
('manage_questions', 'Create, update, delete questions', 'questions'),
('view_results', 'View all exam results', 'results'),
('manage_results', 'Manage and publish results', 'results'),
('view_reports', 'View analytics and reports', 'reports'),
('manage_settings', 'Manage system settings', 'settings'),
('take_exams', 'Take assigned exams', 'exams'),
('view_own_results', 'View own exam results', 'results')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' 
AND p.name IN ('manage_students', 'manage_subjects', 'manage_exams', 'manage_questions', 'view_results', 'manage_results', 'view_reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'student'
AND p.name IN ('take_exams', 'view_own_results')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
('default_exam_duration', '60', 'Default exam duration in minutes', 'exam'),
('default_passing_percentage', '40', 'Default passing percentage', 'exam'),
('default_negative_marking', '0.25', 'Default negative marking per wrong answer', 'exam'),
('max_upload_size', '5242880', 'Maximum file upload size in bytes', 'upload'),
('allowed_image_types', 'image/jpeg,image/png,image/jpg,image/webp', 'Allowed image file types', 'upload'),
('email_notification_enabled', 'true', 'Enable email notifications', 'notification'),
('result_auto_publish', 'false', 'Auto publish results after exam', 'exam'),
('certificate_enabled', 'true', 'Enable certificate generation', 'certificate')
ON CONFLICT (key) DO NOTHING;

-- Insert sample subject
INSERT INTO subjects (name, code, description, category, is_active) VALUES
('Mathematics', 'MATH101', 'Fundamental Mathematics', 'Science', true),
('Physics', 'PHY101', 'Fundamental Physics', 'Science', true),
('Chemistry', 'CHEM101', 'Fundamental Chemistry', 'Science', true),
('Computer Science', 'CS101', 'Introduction to Computer Science', 'Technology', true)
ON CONFLICT (code) DO NOTHING;
