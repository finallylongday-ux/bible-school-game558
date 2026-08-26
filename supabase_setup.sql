-- =========================================================
-- BIBLE SCHOOL GAME - SUPABASE SETUP & RLS FIX
-- قم بنسخ هذا الكود بالكامل ولصقه في SQL Editor داخل Supabase
-- ثم اضغط RUN لحل جميع مشاكل الصلاحيات والحفظ.
-- =========================================================

-- 1. إلغاء الـ Row Level Security (RLS) للسماح بالحفظ والتعديل من الويب سايت
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_stations DISABLE ROW LEVEL SECURITY;

-- 2. إعطاء الصلاحيات الكاملة لجميع المستخدمين (anon & authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. إنشاء الجداول في حالة عدم وجودها
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    balance INT DEFAULT 0,
    engineers INT DEFAULT 0,
    progress INT DEFAULT 0,
    completed_parts INT DEFAULT 0,
    stations INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parts (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    price INT NOT NULL,
    build_time INT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    reward INT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_parts (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    part_id BIGINT NOT NULL,
    status TEXT DEFAULT 'building',
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_stations (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    station_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إدخال أو تحديث بيانات الفرق الافتراضية
INSERT INTO teams (id, name, pin, balance, engineers, progress, completed_parts, stations)
VALUES
    (1, 'فريق 1', '1111', 0, 0, 0, 0, 0),
    (2, 'فريق 2', '2222', 0, 0, 0, 0, 0),
    (3, 'فريق 3', '3333', 0, 0, 0, 0, 0),
    (4, 'فريق 4', '4444', 0, 0, 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    pin = EXCLUDED.pin;

-- 5. إدخال أجزاء الخيمة (13 جزء)
INSERT INTO parts (id, name, price, build_time, icon)
VALUES
    (1, 'سور الخيمة', 800, 20, '🪵'),
    (2, 'باب الخيمة', 700, 20, '🚪'),
    (3, 'مرحضة', 900, 25, '🪣'),
    (4, 'مذبح المحرقة', 1200, 30, '🔥'),
    (5, 'الأغطية', 1000, 25, '🧵'),
    (6, 'القدس', 1400, 30, '🏛️'),
    (7, 'المنارة الذهبية', 1800, 35, '🕎'),
    (8, 'مذبح البخور', 1500, 30, '🪔'),
    (9, 'مائدة خبز الوجوه', 1300, 30, '🍞'),
    (10, 'قدس الأقداس', 2000, 40, '✨'),
    (11, 'تابوت العهد', 2500, 45, '📦'),
    (12, 'لباس رئيس الكهنة', 1700, 35, '👑'),
    (13, 'مواد الخيمة', 1100, 25, '🧰')
ON CONFLICT (id) DO NOTHING;

-- 6. إدخال المحطات (7 محطات)
INSERT INTO stations (id, name, reward, icon)
VALUES
    (1, 'محطة البداية', 500, '🌴'),
    (2, 'محطة الصحراء', 700, '🏜️'),
    (3, 'محطة الإيمان', 900, '📖'),
    (4, 'محطة الحكمة', 1100, '💡'),
    (5, 'محطة الفريق', 1300, '🤝'),
    (6, 'محطة المغامرة', 1500, '🧭'),
    (7, 'المحطة الأخيرة', 2000, '🏆')
ON CONFLICT (id) DO NOTHING;
