-- ============================================
-- Staff Members Table & Data Import
-- ============================================
-- This migration creates a comprehensive staff_members table
-- and imports all staff data from the school system
-- ============================================

-- ============================================
-- TO DROP/CLEAR ALL DEMO DATA, RUN:
-- ============================================
-- DELETE FROM staff_members;
-- DELETE FROM staff_position_types;
-- 
-- OR to completely remove the tables:
-- DROP TABLE IF EXISTS staff_members CASCADE;
-- DROP TABLE IF EXISTS staff_position_types CASCADE;
-- DROP VIEW IF EXISTS v_staff_directory;
-- DROP VIEW IF EXISTS v_teachers_by_class;
-- DROP FUNCTION IF EXISTS update_staff_members_updated_at();
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STAFF MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Position & Title
  position VARCHAR(50) NOT NULL, -- Vaad G, Vaad R, Menahal, Sgan Menahal, Sec, Manager, etc.
  title VARCHAR(20), -- Rabbi, Mrs, Miss
  
  -- Name (English & Hebrew)
  full_name VARCHAR(200) NOT NULL,
  hebrew_name VARCHAR(200),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Contact Info
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  home_phone VARCHAR(30),
  cell_phone VARCHAR(30),
  email VARCHAR(255),
  
  -- Assignment (for teachers)
  class_assignment VARCHAR(100), -- e.g., "א", "ב", "ג/1st", "ד/2nd"
  
  -- Link to app_users (if they have system access)
  app_user_id UUID REFERENCES app_users(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staff_members_position ON staff_members(position);
CREATE INDEX IF NOT EXISTS idx_staff_members_last_name ON staff_members(last_name);
CREATE INDEX IF NOT EXISTS idx_staff_members_is_active ON staff_members(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_members_app_user_id ON staff_members(app_user_id);

-- ============================================
-- POSITION TYPES REFERENCE TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS staff_position_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_english VARCHAR(100) NOT NULL,
  name_hebrew VARCHAR(100),
  category VARCHAR(50), -- administration, teaching, support
  sort_order INTEGER DEFAULT 0
);

-- Insert position types
INSERT INTO staff_position_types (code, name_english, name_hebrew, category, sort_order) VALUES
  ('vaad_g', 'Vaad Gabbai', 'ועד גבאי', 'administration', 1),
  ('vaad_r', 'Vaad Ruchani', 'ועד רוחני', 'administration', 2),
  ('menahal', 'Menahal (Principal)', 'מנהל', 'administration', 3),
  ('sgan_menahal', 'Sgan Menahal (Vice Principal)', 'סגן מנהל', 'administration', 4),
  ('principal', 'Principal', 'מנהל', 'administration', 5),
  ('manager', 'Manager', 'מנהל', 'administration', 6),
  ('bus_manager', 'Bus Manager', 'מנהל הסעות', 'administration', 7),
  ('sec', 'Secretary', 'מזכירה', 'administration', 8),
  ('chinuch_mychud', 'Chinuch Meyuchad (Special Ed)', 'חינוך מיוחד', 'teaching', 10),
  ('melamed', 'Melamed (Teacher)', 'מלמד', 'teaching', 11),
  ('helper', 'Helper (Assistant)', 'עוזר', 'teaching', 12),
  ('english_teacher', 'English Teacher', 'מורה אנגלית', 'teaching', 13),
  ('curriculum', 'Curriculum Implementer', 'מיישם תוכנית לימודים', 'teaching', 14),
  ('driver', 'Driver', 'נהג', 'support', 20)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- IMPORT STAFF DATA
-- ============================================

-- Vaad Gabbai Members
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Vaad G', 'Rabbi', 'Hopstein Moshe', 'משה האפשטיין', 'Moshe', 'Hopstein', '11 Youmans Dr', 'Monsey', 'NY', '10952', '845-352-4343', '201-481-8100'),
  ('Vaad G', 'Rabbi', 'Garfinkel Chaim H.', 'חיים הערש גארפינקל', 'Chaim H.', 'Garfinkel', '15 Hilda Ln', 'Spring Valley', 'NY', '10977', '845-425-2199', NULL),
  ('Vaad G', 'Rabbi', 'Weber Moshe M.', 'משה מרדכי וועבער', 'Moshe M.', 'Weber', '27 Fanley Ave', 'Spring Valley', 'NY', '10977', '845-352-5383', '845-641-1588'),
  ('Vaad G', 'Rabbi', 'Braun Aron', 'אהרן ברוין', 'Aron', 'Braun', '22 Stephens Pl', 'Spring Valley', 'NY', '10977', '845-425-4904', '845-642-1265');

-- Vaad Ruchani Members
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Vaad R', 'Rabbi', 'Appel Hillel', 'הלל אפפעל', 'Hillel', 'Appel', '30 Calvert Dr', 'Monsey', 'NY', '10952', '845-371-6980', '845-596-9790'),
  ('Vaad R', 'Rabbi', 'Rosengarten Yechezkal', 'יחזקאל ראזענגארטן', 'Yechezkal', 'Rosengarten', '15 Walter Dr', 'Monsey', 'NY', '10952', '845-352-1298', NULL),
  ('Vaad R', 'Rabbi', 'Mannes Shlomie', 'שלמה מנס', 'Shlomie', 'Mannes', '6 Collins Ave #111', 'Spring Valley', 'NY', '10977', NULL, '845-608-7661'),
  ('Vaad R', 'Rabbi', 'Lichter Yosef', 'יוסף ליכטער', 'Yosef', 'Lichter', '8 Parker St #212', 'Spring Valley', 'NY', '10977', NULL, '845-422-6870'),
  ('Vaad R', 'Rabbi', 'Friedman Yechezkal Shraga', 'יחזקאל שרגא פרידמאן', 'Yechezkal Shraga', 'Friedman', '116 Grove St #212', 'Monsey', 'NY', '10952', '845-356-0288', '347-276-6131'),
  ('Vaad R', 'Rabbi', 'Weiss Yakov Yosef', 'יעקב יוסף ווייס', 'Yakov Yosef', 'Weiss', '6 Widman Ct #101', 'Spring Valley', 'NY', '10977', '845-425-7466', '845-517-9545'),
  ('Vaad R', 'Rabbi', 'Goldman Shlome', 'שלמה גאלדמאן', 'Shlome', 'Goldman', '567 W. Central Ave.', 'Monsey', 'NY', '10952', NULL, '845-274-8177'),
  ('Vaad R', 'Rabbi', 'Lunger Yoel Z.', 'יואל זיסמאן לונגער', 'Yoel Z.', 'Lunger', '11 Warren Ct #216', 'Monsey', 'NY', '10952', '845-425-1536', '347-742-4562');

-- Menahal (Principals)
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Menahal', 'Rabbi', 'Pal Yitzchok Shaul', 'יצחק שאול פאל', 'Yitzchok Shaul', 'Pal', '57 Washington Ave.', 'New Square', 'NY', '10977', '845-362-7716', '845-499-7925'),
  ('Menahal', 'Rabbi', 'Greenbaum Yochenon', 'יוחנן גרינבוים', 'Yochenon', 'Greenbaum', '70 Ostereh Blvd #301', 'New Square', 'NY', '10977', '845-362-3424', '845-548-6753');

-- Sgan Menahal (Vice Principals)
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Sgan Menahal', 'Rabbi', 'Friesel Aron', 'אהרן פריעזעל', 'Aron', 'Friesel', '39 Decatur Ave #113', 'Spring Valley', 'NY', '10977', '845-362-3848', '845-587-3476'),
  ('Sgan Menahal', 'Rabbi', 'Berger Shloma Aron', 'שלמה אהרן בערגער', 'Shloma Aron', 'Berger', '146 Clinton Ln #8', 'New Square', 'NY', '10977', '845-362-3194', '845-213-5599');

-- Secretaries
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Sec', 'Mrs', 'Lauber', 'מרת לויבער', NULL, 'Lauber', '13 Underwood Rd', 'Monsey', 'NY', '10952', '845-352-6953', '845-517-9607'),
  ('Sec', 'Mrs', 'Blau', 'מרת בלוי', NULL, 'Blau', '44 Cedar Ln #214', 'Monsey', 'NY', '10952', NULL, '845-502-0243'),
  ('Sec', 'Mrs', 'Fogel', 'מיס רובין', NULL, 'Fogel', '22 Maple Ter.', 'Monsey', 'NY', '10952', NULL, '845-502-1239');

-- Managers
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Manager', 'Rabbi', 'Direnfeld Menachem', 'מנחם דירנפעלד', 'Menachem', 'Direnfeld', '9 Elm St #114', 'Monsey', 'NY', '10952', '845-356-9110', '845-263-5052'),
  ('Bus Manager', 'Rabbi', 'Neustadt Zev', 'וועלוועל ניישטאדט', 'Zev', 'Neustadt', '63 Twin Ave #212', 'Spring Valley', 'NY', '10977', '845-425-5945', '845-213-7199');

-- Principal
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Principal', 'Rabbi', 'Ungar Yosef D.', 'יוסף דוד אונגער', 'Yosef D.', 'Ungar', '25 Calvert Dr.', 'Monsey', 'NY', '10952', '845-425-5276', '845-659-6108');

-- Chinuch Meyuchad (Special Education)
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Chinuch Mychud', 'Rabbi', 'Zweig Mayer', 'מאיר יודא צווייג', 'Mayer', 'Zweig', '7 Elm St #101', 'Spring Valley', 'NY', '10977', '845-356-4809', '646-623-0967');

-- Melamed with Drivers
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone, class_assignment) VALUES
  ('Melamed / Driver', 'Rabbi', 'Fromowitz Yida Tzvi', 'יודא צבי פראמאוויטש', 'Yida Tzvi', 'Fromowitz', '31 Polnoya Rd #201', 'New Square', 'NY', '10977', NULL, '845-422-5772', 'פרינ א');

-- Melamdim (Pre-Nursery / Nursery / Kindergarten Teachers)
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone, class_assignment) VALUES
  ('Melamed', 'Rabbi', 'Kohl Hillel', 'הלל קאהל', 'Hillel', 'Kohl', '41 Jackson Ave', 'New Square', 'NY', '10977', '845-587-1345', '845-354-2719', 'פרינ ב'),
  ('Melamed', 'Rabbi', 'Margaretten David A.', 'דוד עמרם מארגערטען', 'David A.', 'Margaretten', '36 Skyline Terr.', 'Wesley Hills', 'NY', '10977', '845-354-4396', '845-642-6919', 'נ א'),
  ('Melamed', 'Rabbi', 'Green Naftuli', 'נפתלי גרין', 'Naftuli', 'Green', '173 Route 306 #212', 'Monsey', 'NY', '10952', '845-573-9095', '845-304-7808', 'נ ב'),
  ('Melamed', 'Rabbi', 'Sigler Binyomin', 'בנימין סיגלער', 'Binyomin', 'Sigler', '9 Allik Way Apt 113', 'New Square', 'NY', '10977', '845-596-9884', '845-499-9027', 'נ ג'),
  ('Melamed', 'Rabbi', 'Felberbaum Chaim M.', 'חיים מנחם פעלבערבוים', 'Chaim M.', 'Felberbaum', '10 Zitomer St', 'New Square', 'NY', '10977', '845-654-4085', '845-499-4358', 'קג א'),
  ('Melamed', 'Rabbi', 'Spitzer Abraham', 'אברהם שפיטצער', 'Abraham', 'Spitzer', '18 Zitomer St', 'New Square', 'NY', '10977', '845-354-1771', '646-942-7126', 'קג ב'),
  ('Melamed', 'Rabbi', 'Friedman Yosef', 'יוסף פריעדמאן', 'Yosef', 'Friedman', '22 Decatur Ave.', 'Monsey', 'NY', '10952', NULL, '845-641-1266', 'קג ג');

-- Helpers (Pre-Nursery / Nursery / Kindergarten)
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone, class_assignment) VALUES
  ('Helper', 'Rabbi', 'Fischel Moshe', 'משה יודא פישל', 'Moshe', 'Fischel', '7 Willson Ave', 'New Square', 'NY', '10978', '845-354-5747', '845-521-2482', 'פרי נ א'),
  ('Helper', 'Rabbi', 'Perlman Shmuel', 'שמואל פערלמאן', 'Shmuel', 'Perlman', '157 Maple Ave #4', 'Spring Valley', 'NY', '10977', NULL, '845-587-8073', 'פרי נ ב'),
  ('Helper', 'Rabbi', 'Schonfeld Moshe', 'משה שאנפעלד', 'Moshe', 'Schonfeld', '17 Allik Way #213', 'Spring Valley', 'NY', '10977', '845-354-5850', '845-499-9471', 'נ א'),
  ('Helper', 'Rabbi', 'Eisenbach Efroim', 'אפרים אייזענבאך', 'Efroim', 'Eisenbach', '17 Old Nyack Turnpike Unit', 'Monsey', 'NY', '10952', NULL, '845-400-0222', 'נ ב'),
  ('Helper', 'Rabbi', 'Mayer Kraus', 'מאיר קרויס', 'Mayer', 'Kraus', '16 Jeffrey Place', 'Monsey', 'NY', '10952', NULL, '845-608-5614', 'נ ג'),
  ('Helper', 'Rabbi', 'Neustadt Mendel', 'מענדל ניישטאדט', 'Mendel', 'Neustadt', '5 Stysly Ln', 'Spring Valley', 'NY', '10977', '845-356-1659', '845-213-7330', 'קג א'),
  ('Helper', 'Rabbi', 'Felsenburg Yitzchok Aron', 'יצחק אהרן פעלזנבורג', 'Yitzchok Aron', 'Felsenburg', '19 Stern St. #102', 'New Square', 'NY', '10977', '845-263-7030', '845-263-9108', 'קג ב'),
  ('Helper', 'Rabbi', 'Bineth Yakov Yeshua', 'יעקב יושע בינעטה', 'Yakov Yeshua', 'Bineth', '36 Old Nyack Turnpike Unit 202', 'New Square', 'NY', '10977', '845-502-3768', '347-228-7355', 'קג ג'),
  ('Helper', 'Rabbi', 'Breuer Levi Yitzchok', 'לוי יצחק ברויער', 'Levi Yitzchok', 'Breuer', '26 Tammy Rd.', 'Spring Valley', 'NY', '10977', NULL, '845-540-1738', NULL);

-- Melamdim (Grade Level Teachers - א through ט)
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone, class_assignment) VALUES
  ('Melamed', 'Rabbi', 'Hertzel Kalmen', 'יחיאל קלמן הערצל', 'Kalmen', 'Hertzel', '10 Stonehouse Rd', 'Spring Valley', 'NY', '10977', '845-426-0084', '917-620-1574', 'א'),
  ('Melamed', 'Rabbi', 'Hochhauser Mordicha Usher', 'מרדכי אשר האכהייזער', 'Mordicha Usher', 'Hochhauser', '152 Blauvelt Rd', 'Monsey', 'NY', '10952', '845-352-8564', '845-641-7380', 'א'),
  ('Melamed', 'Rabbi', 'Biston Avrum Sh. H.', 'אברהם יושע העשיל ביסטאן', 'Avrum Sh. H.', 'Biston', '30 Polnoya Rd #104', 'New Square', 'NY', '10977', '845-354-8153', '845-608-9561', 'ב'),
  ('Melamed', 'Rabbi', 'Silberman Eliazer', 'אליעזר זילבערמאן', 'Eliazer', 'Silberman', '493 W. Central Ave. #103', 'Spring Valley', 'NY', '10977', '845-263-3013', '845-587-0776', 'ב'),
  ('Melamed', 'Rabbi', 'Felberbaum Moshe', 'משה פעלבערבוים', 'Moshe', 'Felberbaum', '22 Ostereh Blvd #211', 'New Square', 'NY', '10977', '845-354-0487', '845-558-9908', 'ג'),
  ('Melamed', 'Rabbi', 'Bayer David', 'דוד בייער', 'David', 'Bayer', '8 Mezritch Rd. #114', 'New Square', 'NY', '10977', '845-362-5313', '845-570-3684', 'ג'),
  ('Melamed', 'Rabbi', 'Silber Yochenon', 'יוחנן זילבער', 'Yochenon', 'Silber', '63 Ostereh Blvd #101', 'New Square', 'NY', '10977', '845-354-1146', '845-263-6445', 'ד'),
  ('Melamed', 'Rabbi', 'Bayer Yecheskal', 'יחזקאל בייער', 'Yecheskal', 'Bayer', '19 Ostereh Blvd #114', 'New Square', 'NY', '10977', '845-354-1026', '845-587-3175', 'ד'),
  ('Melamed', 'Rabbi', 'Fischer Pinchas', 'פינחס פישער', 'Pinchas', 'Fischer', '13 Jackson Ave', 'Spring Valley', 'NY', '10977', '845-354-5931', '845-376-6786', 'ה'),
  ('Melamed', 'Rabbi', 'Elimelach Feder', 'אלימלך פעדער', 'Elimelach', 'Feder', '8 Ziessner Ln', 'Spring Valley', 'NY', '10977', NULL, '845-263-5849', 'ה'),
  ('Melamed', 'Rabbi', 'Rosenfeld Moshe Chaim', 'משה חיים ראזענפעלד', 'Moshe Chaim', 'Rosenfeld', '13 Ronald Dr #201', 'Monsey', 'NY', '10952', '845-352-2049', '718-954-0721', 'ו'),
  ('Melamed', 'Rabbi', 'Spitzer Yakov Yosef', 'יעקב יוסף שפיטצער', 'Yakov Yosef', 'Spitzer', '223 Blauvelt Rd #216', 'Monsey', 'NY', '10952', '845-425-1832', '845-521-1160', 'ו נאכמיטאג'),
  ('Melamed', 'Rabbi', 'Goldstein Yakov Pinchas', 'יעקב פינחס גאלדשטיין', 'Yakov Pinchas', 'Goldstein', '3 Buchanan Rd #F', 'New Square', 'NY', '10977', '845-362-3820', '845-376-6207', 'ו'),
  ('Melamed', 'Rabbi', 'Simonowitz Avrohom', 'אברהם שימאנאוויטש', 'Avrohom', 'Simonowitz', '15 Bluefield Dr #101', 'Monsey', 'NY', '10952', '845-352-2543', '845-213-0872', 'ז'),
  ('Melamed', 'Rabbi', 'Friedman Duvid', 'דוד פרידמאן', 'Duvid', 'Friedman', '82 Washington Ave', 'New Square', 'NY', '10977', '845-354-2145', '845-499-8834', 'ז'),
  ('Melamed', 'Rabbi', 'Wulliger Simcha', 'שמחה ווילליגער', 'Simcha', 'Wulliger', '31 Ellish Pkwy', 'Spring Valley', 'NY', '10977', '845-352-5919', '845-540-2600', 'ח'),
  ('Melamed', 'Rabbi', 'Green Nuchem', 'מנחם נחום גרין', 'Nuchem', 'Green', '29 Washington Ave', 'New Square', 'NY', '10977', '845-354-7263', '845-274-2738', 'ח'),
  ('Melamed', 'Rabbi', 'Weingarten Yosef Mayer', 'יוסף מאיר וויינגארטען', 'Yosef Mayer', 'Weingarten', '14 Phyllis Ter. #114', 'Monsey', 'NY', '10952', NULL, '845-213-8119', 'ח'),
  ('Melamed', 'Rabbi', 'Biston Zisha', 'זושא ביסטאן', 'Zisha', 'Biston', '30 Wilson Ave. #212', 'New Square', 'NY', '10977', '845-354-0495', '845-304-4166', 'ט'),
  ('Melamed', 'Rabbi', 'Lipa Green', 'ליפא גרין', 'Lipa', 'Green', '9 Elener Ln. 201', 'Spring Valley', 'NY', '10977', '845-538-0534', '845-274-8140', 'ט'),
  ('Melamed', 'Rabbi', 'Silberman Moshe', 'משה זילבערמאן', 'Moshe', 'Silberman', '8 Hopal Ln. #101', 'Monsey', 'NY', '10952', '845-577-9224', '845-263-9199', 'ט'),
  ('Melamed', 'Rabbi', 'Silberman Eluzer Yonah', 'אלעזר יונה מרדכי זילבערמאן', 'Eluzer Yonah', 'Silberman', '10 Edwin Ln. B 1', 'Monsey', 'NY', '10952', '845-352-6564', '845-376-5814', 'ט');

-- Drivers
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Driver', 'Rabbi', 'Spierer Yakov M.', 'יעקב מאיר שפיערער', 'Yakov M.', 'Spierer', '195 Adar Ct. #113', 'Monsey', 'NY', '10952', '845-426-5405', '845-263-6717'),
  ('Driver', 'Rabbi', 'Krausz Menachem', 'מנחם קרויס', 'Menachem', 'Krausz', NULL, NULL, NULL, NULL, NULL, '845-376-4061'),
  ('Driver', 'Rabbi', 'Unger', NULL, NULL, 'Unger', NULL, NULL, NULL, NULL, NULL, NULL);

-- English Teachers
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone, class_assignment) VALUES
  ('English Teacher', 'Rabbi', 'Mendel Klein', 'מענדל קליין', 'Mendel', 'Klein', NULL, NULL, NULL, NULL, NULL, '718-744-5238', 'ג / 1st'),
  ('English Teacher', 'Rabbi', 'Pinchas Gold', 'פינחס גאלד', 'Pinchas', 'Gold', NULL, NULL, NULL, NULL, NULL, '917-504-7860', 'ג / 1st'),
  ('English Teacher', 'Rabbi', 'Silber Yochenon', 'יוחנן זילבער', 'Yochenon', 'Silber', '63 Ostereh Blvd #101', 'New Square', 'NY', '10977', '845-354-1146', '845-263-6445', 'ד/2nd'),
  ('English Teacher', 'Rabbi', 'Bayer Yecheskal', 'יחזקאל בייער', 'Yecheskal', 'Bayer', '19 Ostereh Blvd #114', 'New Square', 'NY', '10977', '845-354-1026', '845-587-3175', 'ד/2nd'),
  ('English Teacher', 'Rabbi', 'Yisroel Bluming', 'ישראל בלומינג', 'Yisroel', 'Bluming', NULL, NULL, NULL, NULL, NULL, '845-376-2530', 'ה/3rd'),
  ('English Teacher', 'Rabbi', 'Yoneson Feig', 'יונתן פייג', 'Yoneson', 'Feig', NULL, NULL, NULL, NULL, NULL, '845-659-3154', 'ה/3rd'),
  ('English Teacher', 'Rabbi', 'Burech Avrohom Kalisch', 'ברוך אברהם קאליש', 'Burech Avrohom', 'Kalisch', NULL, NULL, NULL, NULL, NULL, '845-538-3675', 'ו/4th'),
  ('English Teacher', 'Rabbi', 'Naftuli Gefner', 'נפתלי געפנער', 'Naftuli', 'Gefner', NULL, NULL, NULL, NULL, NULL, '845-598-5748', 'ו/4th'),
  ('English Teacher', 'Rabbi', 'Shea Feketa', 'יושע פעקעטה', 'Shea', 'Feketa', NULL, NULL, NULL, NULL, NULL, '347-587-0659', 'ז/5th'),
  ('English Teacher', 'Rabbi', 'Simonowitz Avrohom', 'אברהם שימאנאוויטש', 'Avrohom', 'Simonowitz', '15 Bluefield Dr #101', 'Monsey', 'NY', '10952', '845-352-2543', '845-213-0872', 'ז/5th'),
  ('English Teacher', 'Rabbi', 'Elimelach Feder', 'אלימלך פעדער', 'Elimelach', 'Feder', '8 Ziessner Ln', 'Spring Valley', 'NY', '10977', NULL, '845-263-5849', 'ח/6th'),
  ('English Teacher', 'Rabbi', 'Green Nuchem', 'מנחם נחום גרין', 'Nuchem', 'Green', '29 Washington Ave', 'New Square', 'NY', '10977', '845-354-7263', '845-274-2738', 'ח/6th');

-- Curriculum Implementers
INSERT INTO staff_members (position, title, full_name, hebrew_name, first_name, last_name, address, city, state, zip_code, home_phone, cell_phone) VALUES
  ('Curriculum Implementer', 'Rabbi', 'Weingarten Yosef Mayer', 'יוסף מאיר וויינגארטען', 'Yosef Mayer', 'Weingarten', '14 Phyllis Ter. #114', 'Monsey', 'NY', '10952', NULL, '845-213-8119'),
  ('Curriculum Implementer', 'Rabbi', 'Goldstein Yakov Pinchas', 'יעקב פינחס גאלדשטיין', 'Yakov Pinchas', 'Goldstein', '3 Buchanan Rd #F', 'New Square', 'NY', '10977', '845-362-3820', '845-376-6207');

-- ============================================
-- UPDATE TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_staff_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_staff_members_updated_at ON staff_members;
CREATE TRIGGER trigger_staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_members_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- Policy for viewing staff (all authenticated users can view)
CREATE POLICY "Staff members are viewable by authenticated users" 
  ON staff_members FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy for managing staff (only admins and principals)
CREATE POLICY "Staff members can be managed by admin users" 
  ON staff_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_id = auth.uid() 
      AND role IN ('admin', 'principal', 'principal_hebrew', 'principal_english', 'menahal')
    )
  );

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- View for staff directory with formatted info
CREATE OR REPLACE VIEW v_staff_directory AS
SELECT 
  id,
  position,
  title,
  full_name,
  hebrew_name,
  CONCAT(first_name, ' ', last_name) as name_formatted,
  address,
  CONCAT(city, ', ', state, ' ', zip_code) as full_address,
  home_phone,
  cell_phone,
  class_assignment,
  is_active
FROM staff_members
WHERE is_active = true
ORDER BY 
  CASE position
    WHEN 'Vaad G' THEN 1
    WHEN 'Vaad R' THEN 2
    WHEN 'Menahal' THEN 3
    WHEN 'Sgan Menahal' THEN 4
    WHEN 'Principal' THEN 5
    WHEN 'Manager' THEN 6
    WHEN 'Bus Manager' THEN 7
    WHEN 'Sec' THEN 8
    WHEN 'Chinuch Mychud' THEN 9
    WHEN 'Melamed' THEN 10
    WHEN 'Melamed / Driver' THEN 11
    WHEN 'Helper' THEN 12
    WHEN 'English Teacher' THEN 13
    WHEN 'Curriculum Implementer' THEN 14
    WHEN 'Driver' THEN 15
    ELSE 99
  END,
  last_name;

-- View for teachers by class
CREATE OR REPLACE VIEW v_teachers_by_class AS
SELECT 
  class_assignment,
  full_name,
  hebrew_name,
  cell_phone,
  position
FROM staff_members
WHERE position IN ('Melamed', 'Melamed / Driver', 'English Teacher', 'Helper')
  AND class_assignment IS NOT NULL
  AND is_active = true
ORDER BY class_assignment, position;
