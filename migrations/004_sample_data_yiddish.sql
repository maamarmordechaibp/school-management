-- ============================================
-- Sample Data - Yiddish Boys School
-- ============================================
-- Run this AFTER 003_school_management_complete.sql
-- ============================================

-- ============================================
-- 1. GRADES (כיתות)
-- ============================================
INSERT INTO grades (id, name, grade_number, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'כיתה א', 1, 'כיתה ראשונה'),
  ('11111111-1111-1111-1111-111111111102', 'כיתה ב', 2, 'כיתה שניה'),
  ('11111111-1111-1111-1111-111111111103', 'כיתה ג', 3, 'כיתה שלישית'),
  ('11111111-1111-1111-1111-111111111104', 'כיתה ד', 4, 'כיתה רביעית'),
  ('11111111-1111-1111-1111-111111111105', 'כיתה ה', 5, 'כיתה חמישית'),
  ('11111111-1111-1111-1111-111111111106', 'כיתה ו', 6, 'כיתה ששית'),
  ('11111111-1111-1111-1111-111111111107', 'כיתה ז', 7, 'כיתה שביעית'),
  ('11111111-1111-1111-1111-111111111108', 'כיתה ח', 8, 'כיתה שמינית')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STAFF (Teachers, Principals, Tutors)
-- ============================================
INSERT INTO app_users (id, first_name, last_name, name, email, phone, role, is_active) VALUES
  -- Principals
  ('22222222-2222-2222-2222-222222222201', 'Yosef', 'Goldstein', 'Yosef Goldstein', 'ygoldstein@yeshiva.edu', '718-555-0101', 'admin', true),
  ('22222222-2222-2222-2222-222222222202', 'Shlomo', 'Weiss', 'Shlomo Weiss', 'sweiss@yeshiva.edu', '718-555-0102', 'principal_hebrew', true),
  ('22222222-2222-2222-2222-222222222203', 'David', 'Katz', 'David Katz', 'dkatz@yeshiva.edu', '718-555-0103', 'principal_english', true),
  
  -- Hebrew Teachers (Rebbeim)
  ('22222222-2222-2222-2222-222222222204', 'Moshe', 'Friedman', 'Moshe Friedman', 'mfriedman@yeshiva.edu', '718-555-0104', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222205', 'Chaim', 'Schwartz', 'Chaim Schwartz', 'cschwartz@yeshiva.edu', '718-555-0105', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222206', 'Avraham', 'Klein', 'Avraham Klein', 'aklein@yeshiva.edu', '718-555-0106', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222207', 'Yitzchok', 'Rosenberg', 'Yitzchok Rosenberg', 'yrosenberg@yeshiva.edu', '718-555-0107', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222208', 'Menachem', 'Stern', 'Menachem Stern', 'mstern@yeshiva.edu', '718-555-0108', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222209', 'Boruch', 'Levy', 'Boruch Levy', 'blevy@yeshiva.edu', '718-555-0109', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222210', 'Yankel', 'Berkowitz', 'Yankel Berkowitz', 'yberkowitz@yeshiva.edu', '718-555-0110', 'teacher_hebrew', true),
  ('22222222-2222-2222-2222-222222222211', 'Sruly', 'Eisenberg', 'Sruly Eisenberg', 'seisenberg@yeshiva.edu', '718-555-0111', 'teacher_hebrew', true),
  
  -- English Teachers
  ('22222222-2222-2222-2222-222222222212', 'Michael', 'Green', 'Michael Green', 'mgreen@yeshiva.edu', '718-555-0112', 'teacher_english', true),
  ('22222222-2222-2222-2222-222222222213', 'Jonathan', 'Silver', 'Jonathan Silver', 'jsilver@yeshiva.edu', '718-555-0113', 'teacher_english', true),
  ('22222222-2222-2222-2222-222222222214', 'Daniel', 'Roth', 'Daniel Roth', 'droth@yeshiva.edu', '718-555-0114', 'teacher_english', true),
  ('22222222-2222-2222-2222-222222222215', 'Aaron', 'Shapiro', 'Aaron Shapiro', 'ashapiro@yeshiva.edu', '718-555-0115', 'teacher_english', true),
  
  -- Tutors
  ('22222222-2222-2222-2222-222222222216', 'Shmuel', 'Teitelbaum', 'Shmuel Teitelbaum', 'steitelbaum@yeshiva.edu', '718-555-0116', 'tutor', true),
  ('22222222-2222-2222-2222-222222222217', 'Yechiel', 'Horowitz', 'Yechiel Horowitz', 'yhorowitz@yeshiva.edu', '718-555-0117', 'tutor', true),
  ('22222222-2222-2222-2222-222222222218', 'Dovid', 'Landau', 'Dovid Landau', 'dlandau@yeshiva.edu', '718-555-0118', 'tutor', true),
  ('22222222-2222-2222-2222-222222222219', 'Zalman', 'Glick', 'Zalman Glick', 'zglick@yeshiva.edu', '718-555-0119', 'tutor', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CLASSES
-- ============================================
INSERT INTO classes (id, grade_id, name, hebrew_teacher_id, english_teacher_id, academic_year, is_active) VALUES
  -- Grade 1
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'א-1', '22222222-2222-2222-2222-222222222204', '22222222-2222-2222-2222-222222222212', '2024-2025', true),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', 'א-2', '22222222-2222-2222-2222-222222222205', '22222222-2222-2222-2222-222222222212', '2024-2025', true),
  -- Grade 2
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111102', 'ב-1', '22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222213', '2024-2025', true),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111102', 'ב-2', '22222222-2222-2222-2222-222222222207', '22222222-2222-2222-2222-222222222213', '2024-2025', true),
  -- Grade 3
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111103', 'ג-1', '22222222-2222-2222-2222-222222222208', '22222222-2222-2222-2222-222222222214', '2024-2025', true),
  -- Grade 4
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111104', 'ד-1', '22222222-2222-2222-2222-222222222209', '22222222-2222-2222-2222-222222222214', '2024-2025', true),
  -- Grade 5
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111105', 'ה-1', '22222222-2222-2222-2222-222222222210', '22222222-2222-2222-2222-222222222215', '2024-2025', true),
  -- Grade 6
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111106', 'ו-1', '22222222-2222-2222-2222-222222222211', '22222222-2222-2222-2222-222222222215', '2024-2025', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. STUDENTS
-- ============================================
INSERT INTO students (id, first_name, last_name, hebrew_name, name, class_id, father_name, father_phone, mother_name, mother_phone, address, city, status) VALUES
  -- Class א-1 (Grade 1)
  ('44444444-4444-4444-4444-444444444401', 'Moishy', 'Goldberger', 'משה יהודה', 'Moishy Goldberger', '33333333-3333-3333-3333-333333333301', 'Yankel Goldberger', '718-555-1001', 'Rivka Goldberger', '718-555-1002', '123 Lee Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444402', 'Shloime', 'Weissman', 'שלמה זלמן', 'Shloime Weissman', '33333333-3333-3333-3333-333333333301', 'Dovid Weissman', '718-555-1003', 'Malka Weissman', '718-555-1004', '456 Bedford Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444403', 'Yitzy', 'Kaufman', 'יצחק אייזיק', 'Yitzy Kaufman', '33333333-3333-3333-3333-333333333301', 'Shmuel Kaufman', '718-555-1005', 'Chana Kaufman', '718-555-1006', '789 Division Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444404', 'Sruly', 'Berkowitz', 'ישראל מאיר', 'Sruly Berkowitz', '33333333-3333-3333-3333-333333333301', 'Chaim Berkowitz', '718-555-1007', 'Leah Berkowitz', '718-555-1008', '321 Ross St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444405', 'Duvy', 'Fried', 'דוד אריה', 'Duvy Fried', '33333333-3333-3333-3333-333333333301', 'Menachem Fried', '718-555-1009', 'Sarah Fried', '718-555-1010', '654 Keap St', 'Brooklyn', 'active'),
  
  -- Class א-2 (Grade 1)
  ('44444444-4444-4444-4444-444444444406', 'Yanky', 'Teitelbaum', 'יעקב צבי', 'Yanky Teitelbaum', '33333333-3333-3333-3333-333333333302', 'Moshe Teitelbaum', '718-555-1011', 'Gittel Teitelbaum', '718-555-1012', '987 Wythe Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444407', 'Mendy', 'Steinberg', 'מנחם מענדל', 'Mendy Steinberg', '33333333-3333-3333-3333-333333333302', 'Yosef Steinberg', '718-555-1013', 'Bracha Steinberg', '718-555-1014', '147 Clymer St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444408', 'Shloimy', 'Hershkowitz', 'שלום', 'Shloimy Hershkowitz', '33333333-3333-3333-3333-333333333302', 'Avrum Hershkowitz', '718-555-1015', 'Miriam Hershkowitz', '718-555-1016', '258 Hooper St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444409', 'Chaim', 'Lefkowitz', 'חיים דוב', 'Chaim Lefkowitz', '33333333-3333-3333-3333-333333333302', 'Berish Lefkowitz', '718-555-1017', 'Rochel Lefkowitz', '718-555-1018', '369 Hewes St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444410', 'Avrumi', 'Kohn', 'אברהם יהושע', 'Avrumi Kohn', '33333333-3333-3333-3333-333333333302', 'Zelig Kohn', '718-555-1019', 'Esther Kohn', '718-555-1020', '741 Penn St', 'Brooklyn', 'active'),

  -- Class ב-1 (Grade 2)
  ('44444444-4444-4444-4444-444444444411', 'Naftuli', 'Schwartz', 'נפתלי הירש', 'Naftuli Schwartz', '33333333-3333-3333-3333-333333333303', 'Eliezer Schwartz', '718-555-1021', 'Chaya Schwartz', '718-555-1022', '852 Marcy Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444412', 'Tzvi', 'Gluck', 'צבי אלימלך', 'Tzvi Gluck', '33333333-3333-3333-3333-333333333303', 'Yisroel Gluck', '718-555-1023', 'Devorah Gluck', '718-555-1024', '963 Harrison Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444413', 'Berel', 'Friedlander', 'דב בער', 'Berel Friedlander', '33333333-3333-3333-3333-333333333303', 'Shlomo Friedlander', '718-555-1025', 'Yitta Friedlander', '718-555-1026', '159 Rutledge St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444414', 'Hershy', 'Pollak', 'צבי הירש', 'Hershy Pollak', '33333333-3333-3333-3333-333333333303', 'Meilech Pollak', '718-555-1027', 'Baila Pollak', '718-555-1028', '753 Flushing Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444415', 'Leiby', 'Moskowitz', 'אריה לייב', 'Leiby Moskowitz', '33333333-3333-3333-3333-333333333303', 'Shia Moskowitz', '718-555-1029', 'Shprintza Moskowitz', '718-555-1030', '486 Broadway', 'Brooklyn', 'active'),

  -- Class ב-2 (Grade 2)
  ('44444444-4444-4444-4444-444444444416', 'Motty', 'Greenfeld', 'מרדכי', 'Motty Greenfeld', '33333333-3333-3333-3333-333333333304', 'Yoily Greenfeld', '718-555-1031', 'Hindy Greenfeld', '718-555-1032', '297 Wallabout St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444417', 'Pinny', 'Landau', 'פנחס', 'Pinny Landau', '33333333-3333-3333-3333-333333333304', 'Lazer Landau', '718-555-1033', 'Perel Landau', '718-555-1034', '184 Throop Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444418', 'Yossi', 'Adler', 'יוסף חיים', 'Yossi Adler', '33333333-3333-3333-3333-333333333304', 'Mottel Adler', '718-555-1035', 'Zlata Adler', '718-555-1036', '572 Myrtle Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444419', 'Ari', 'Rubin', 'אריה זאב', 'Ari Rubin', '33333333-3333-3333-3333-333333333304', 'Hershel Rubin', '718-555-1037', 'Sury Rubin', '718-555-1038', '638 Park Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444420', 'Eli', 'Weinstock', 'אליהו מאיר', 'Eli Weinstock', '33333333-3333-3333-3333-333333333304', 'Zalman Weinstock', '718-555-1039', 'Tziporah Weinstock', '718-555-1040', '429 Kent Ave', 'Brooklyn', 'active'),

  -- Class ג-1 (Grade 3)
  ('44444444-4444-4444-4444-444444444421', 'Shea', 'Horowitz', 'יהושע העשיל', 'Shea Horowitz', '33333333-3333-3333-3333-333333333305', 'Nuta Horowitz', '718-555-1041', 'Chana Ruchel Horowitz', '718-555-1042', '831 Classon Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444422', 'Zishe', 'Lieberman', 'אלימלך זושא', 'Zishe Lieberman', '33333333-3333-3333-3333-333333333305', 'Beryl Lieberman', '718-555-1043', 'Nechama Lieberman', '718-555-1044', '246 Franklin Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444423', 'Burech', 'Greenberg', 'ברוך בנימין', 'Burech Greenberg', '33333333-3333-3333-3333-333333333305', 'Yidel Greenberg', '718-555-1045', 'Shaindel Greenberg', '718-555-1046', '517 DeKalb Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444424', 'Velvel', 'Rosenstein', 'זאב וואלף', 'Velvel Rosenstein', '33333333-3333-3333-3333-333333333305', 'Moishe Rosenstein', '718-555-1047', 'Gitty Rosenstein', '718-555-1048', '693 Lafayette Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444425', 'Usher', 'Wertheimer', 'אשר זעליג', 'Usher Wertheimer', '33333333-3333-3333-3333-333333333305', 'Pesach Wertheimer', '718-555-1049', 'Toba Wertheimer', '718-555-1050', '824 Greene Ave', 'Brooklyn', 'active'),

  -- Class ד-1 (Grade 4)
  ('44444444-4444-4444-4444-444444444426', 'Kalman', 'Reich', 'קלמן יהודא', 'Kalman Reich', '33333333-3333-3333-3333-333333333306', 'Gershon Reich', '718-555-1051', 'Fruma Reich', '718-555-1052', '135 Lexington Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444427', 'Shimmy', 'Braunstein', 'שמעון', 'Shimmy Braunstein', '33333333-3333-3333-3333-333333333306', 'Leib Braunstein', '718-555-1053', 'Yocheved Braunstein', '718-555-1054', '268 Quincy St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444428', 'Lazer', 'Weingarten', 'אליעזר', 'Lazer Weingarten', '33333333-3333-3333-3333-333333333306', 'Bentzion Weingarten', '718-555-1055', 'Faiga Weingarten', '718-555-1056', '391 Monroe St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444429', 'Zundel', 'Fishman', 'אלכסנדר זונדל', 'Zundel Fishman', '33333333-3333-3333-3333-333333333306', 'Mordechai Fishman', '718-555-1057', 'Yehudis Fishman', '718-555-1058', '514 Madison St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444430', 'Getzel', 'Fixler', 'גדליה', 'Getzel Fixler', '33333333-3333-3333-3333-333333333306', 'Avrohom Fixler', '718-555-1059', 'Sheindel Fixler', '718-555-1060', '627 Putnam Ave', 'Brooklyn', 'active'),

  -- Class ה-1 (Grade 5)
  ('44444444-4444-4444-4444-444444444431', 'Mechel', 'Spitzer', 'יחיאל מיכל', 'Mechel Spitzer', '33333333-3333-3333-3333-333333333307', 'Hersh Spitzer', '718-555-1061', 'Blima Spitzer', '718-555-1062', '738 Jefferson Ave', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444432', 'Feivel', 'Deutsch', 'שרגא פייוול', 'Feivel Deutsch', '33333333-3333-3333-3333-333333333307', 'Usher Deutsch', '718-555-1063', 'Hudis Deutsch', '718-555-1064', '849 Hancock St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444433', 'Yoel', 'Schreiber', 'יואל', 'Yoel Schreiber', '33333333-3333-3333-3333-333333333307', 'Tzvi Schreiber', '718-555-1065', 'Pessy Schreiber', '718-555-1066', '962 Halsey St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444434', 'Sender', 'Birnbaum', 'אלכסנדר סענדער', 'Sender Birnbaum', '33333333-3333-3333-3333-333333333307', 'Yechezkel Birnbaum', '718-555-1067', 'Brucha Birnbaum', '718-555-1068', '175 Macon St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444435', 'Hersh', 'Zilberstein', 'צבי הירש', 'Hersh Zilberstein', '33333333-3333-3333-3333-333333333307', 'Nachman Zilberstein', '718-555-1069', 'Kreindel Zilberstein', '718-555-1070', '286 Bainbridge St', 'Brooklyn', 'active'),

  -- Class ו-1 (Grade 6)
  ('44444444-4444-4444-4444-444444444436', 'Shmelky', 'Waldman', 'שמואל', 'Shmelky Waldman', '33333333-3333-3333-3333-333333333308', 'Anshel Waldman', '718-555-1071', 'Rivka Waldman', '718-555-1072', '397 Chauncey St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444437', 'Yiddy', 'Perlmutter', 'יהודא', 'Yiddy Perlmutter', '33333333-3333-3333-3333-333333333308', 'Shulem Perlmutter', '718-555-1073', 'Zissel Perlmutter', '718-555-1074', '418 Marion St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444438', 'Motti', 'Schnitzer', 'מתתיהו', 'Motti Schnitzer', '33333333-3333-3333-3333-333333333308', 'Yochanan Schnitzer', '718-555-1075', 'Chaya Sara Schnitzer', '718-555-1076', '529 Sumpter St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444439', 'Hershel', 'Guttman', 'צבי אריה', 'Hershel Guttman', '33333333-3333-3333-3333-333333333308', 'Mayer Guttman', '718-555-1077', 'Malky Guttman', '718-555-1078', '642 McDonough St', 'Brooklyn', 'active'),
  ('44444444-4444-4444-4444-444444444440', 'Shloime', 'Eckstein', 'שלמה זלמן', 'Shloime Eckstein', '33333333-3333-3333-3333-333333333308', 'Yankel Eckstein', '718-555-1079', 'Nechama Eckstein', '718-555-1080', '753 Decatur St', 'Brooklyn', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. TUTOR ASSIGNMENTS
-- ============================================
INSERT INTO tutor_assignments (id, tutor_id, student_id, subject, sessions_per_week, status) VALUES
  ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222216', '44444444-4444-4444-4444-444444444403', 'chumash', 2, 'active'),
  ('55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222216', '44444444-4444-4444-4444-444444444411', 'gemara', 2, 'active'),
  ('55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222217', '44444444-4444-4444-4444-444444444421', 'reading', 3, 'active'),
  ('55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222217', '44444444-4444-4444-4444-444444444426', 'math', 2, 'active'),
  ('55555555-5555-5555-5555-555555555505', '22222222-2222-2222-2222-222222222218', '44444444-4444-4444-4444-444444444431', 'gemara', 2, 'active'),
  ('55555555-5555-5555-5555-555555555506', '22222222-2222-2222-2222-222222222219', '44444444-4444-4444-4444-444444444407', 'kriah', 3, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. STUDENT ISSUES (בעיות תלמידים)
-- ============================================
INSERT INTO student_issues (id, student_id, title, description, category, severity, status, reported_by) VALUES
  ('66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444403', 'קשיים עם אלף-בית', 'יצחק''לע האט שווער צו דערקענען די אותיות. דארף מער אויפמערקזאמקייט ביים קריאה.', 'academic', 'medium', 'in_progress', '22222222-2222-2222-2222-222222222204'),
  ('66666666-6666-6666-6666-666666666602', '44444444-4444-4444-4444-444444444411', 'קשיי ריכוז', 'נפתלי האט שווער צו זיצן רואיג אין כיתה. עלטערן זענען אויפן בילד און ארבעטן מיט אונז.', 'behavioral', 'medium', 'open', '22222222-2222-2222-2222-222222222206'),
  ('66666666-6666-6666-6666-666666666603', '44444444-4444-4444-4444-444444444421', 'פעלט אפט', 'שעי''ע האט געפעלט 5 טעג דעם חודש. דארף נאכגיין מיט די עלטערן.', 'attendance', 'high', 'open', '22222222-2222-2222-2222-222222222208'),
  ('66666666-6666-6666-6666-666666666604', '44444444-4444-4444-4444-444444444426', 'שווער מיט חשבון', 'קלמן דארף מער הילף מיט די לוח הכפל.', 'academic', 'low', 'resolved', '22222222-2222-2222-2222-222222222214'),
  ('66666666-6666-6666-6666-666666666605', '44444444-4444-4444-4444-444444444436', 'סאציאלע שוועריגקייטן', 'שמואל''קע האט שווער צו מאכן חברים. קען זיין אז א חברותא פראגראם וועט העלפן.', 'social', 'medium', 'in_progress', '22222222-2222-2222-2222-222222222211')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. CALL LOGS (טעלעפאן רופן)
-- ============================================
INSERT INTO call_logs (id, student_id, call_type, contact_person, phone_number, subject, summary, outcome, follow_up_needed, logged_by, call_date) VALUES
  ('77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444403', 'outgoing', 'יענקל גאלדבערגער (טאטי)', '718-555-1005', 'באריכט וועגן פראגרעס', 'גערעדט וועגן יצחק''לעס פראגרעס אין קריאה. דער טאטי איז זייער שטיצנד און וועט איבן אינדערהיים.', 'reached', false, '22222222-2222-2222-2222-222222222204', NOW() - INTERVAL '3 days'),
  ('77777777-7777-7777-7777-777777777702', '44444444-4444-4444-4444-444444444411', 'outgoing', 'אליעזר שווארץ (טאטי)', '718-555-1021', 'שמועס וועגן אויפפירונג', 'גערעדט וועגן נפתלי''ס ריכוז. עלטערן וועלן גיין צום דאקטאר.', 'reached', true, '22222222-2222-2222-2222-222222222206', NOW() - INTERVAL '5 days'),
  ('77777777-7777-7777-7777-777777777703', '44444444-4444-4444-4444-444444444421', 'outgoing', 'נתא האראוויץ (טאטי)', '718-555-1041', 'וועגן פעלן', 'געלאזט א מעסעדזש וועגן שעי''עס פעלן. געבעטן צוריק רופן.', 'voicemail', true, '22222222-2222-2222-2222-222222222202', NOW() - INTERVAL '1 day'),
  ('77777777-7777-7777-7777-777777777704', '44444444-4444-4444-4444-444444444421', 'incoming', 'חנה רחל האראוויץ (מאמע)', '718-555-1042', 'נאכגיין וועגן פעלן', 'שעי''ע איז געווען קראנק. דער דאקטאר נאוט וועט געשיקט ווערן. ער קומט צוריק מארגן.', 'reached', false, '22222222-2222-2222-2222-222222222202', NOW()),
  ('77777777-7777-7777-7777-777777777705', '44444444-4444-4444-4444-444444444436', 'outgoing', 'אנשל וואלדמאן (טאטי)', '718-555-1071', 'סאציאלע ענינים', 'גערעדט וועגן שמואל''קעס סאציאלע שוועריגקייטן. צוגעארדנט א חברותא מיט יודא.', 'reached', false, '22222222-2222-2222-2222-222222222211', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. MEETINGS (פגישות)
-- ============================================
INSERT INTO meetings (id, meeting_type, title, description, student_id, organizer_id, meeting_date, scheduled_date, start_time, location, status) VALUES
  ('88888888-8888-8888-8888-888888888801', 'parent_teacher', 'פגישת עלטערן-מורה - יצחק קויפמאן', 'רעדן וועגן קריאה פראגרעס און לערן פלאן', '44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222204', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', '16:00', 'כיתה א-1', 'scheduled'),
  ('88888888-8888-8888-8888-888888888802', 'staff', 'וויכנטליכע שטאב פגישה', 'איבערקוקן תלמידים פראגרעס און קומענדיגע געשעענישן', NULL, '22222222-2222-2222-2222-222222222202', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', '15:00', 'לערער צימער', 'confirmed'),
  ('88888888-8888-8888-8888-888888888803', 'parent_teacher', 'פגישה וועגן נפתלי שווארץ', 'רעדן וועגן ריכוז און אינטערווענציע פלאן', '44444444-4444-4444-4444-444444444411', '22222222-2222-2222-2222-222222222202', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', '10:00', 'פרינציפאל ביורא', 'scheduled'),
  ('88888888-8888-8888-8888-888888888804', 'tutor_session', 'איבערקוקן טוטאר - שעי''ע האראוויץ', 'אויסווערטן פראגרעס מיטן טוטאר', '44444444-4444-4444-4444-444444444421', '22222222-2222-2222-2222-222222222217', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', '14:00', 'לערן צימער ב', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. BOOKS (ספרים)
-- ============================================
INSERT INTO books (id, title, author, category, subject, price, quantity_in_stock, is_active) VALUES
  ('99999999-9999-9999-9999-999999999901', 'חומש בראשית עם רש"י', NULL, 'hebrew', 'chumash', 25.00, 50, true),
  ('99999999-9999-9999-9999-999999999902', 'חומש שמות עם רש"י', NULL, 'hebrew', 'chumash', 25.00, 45, true),
  ('99999999-9999-9999-9999-999999999903', 'סידור תפלה', NULL, 'hebrew', 'tefilla', 15.00, 100, true),
  ('99999999-9999-9999-9999-999999999904', 'גמרא ברכות', NULL, 'hebrew', 'gemara', 35.00, 30, true),
  ('99999999-9999-9999-9999-999999999905', 'גמרא שבת', NULL, 'hebrew', 'gemara', 35.00, 25, true),
  ('99999999-9999-9999-9999-999999999906', 'חשבון ווערקבוך כיתה א', NULL, 'english', 'math', 18.00, 60, true),
  ('99999999-9999-9999-9999-999999999907', 'חשבון ווערקבוך כיתה ב', NULL, 'english', 'math', 18.00, 55, true),
  ('99999999-9999-9999-9999-999999999908', 'חשבון ווערקבוך כיתה ג', NULL, 'english', 'math', 20.00, 40, true),
  ('99999999-9999-9999-9999-999999999909', 'לייענען ווערקבוך שטאפל 1', NULL, 'english', 'reading', 22.00, 50, true),
  ('99999999-9999-9999-9999-999999999910', 'לייענען ווערקבוך שטאפל 2', NULL, 'english', 'reading', 22.00, 45, true),
  ('99999999-9999-9999-9999-999999999911', 'קריאה ווערקבוך', NULL, 'hebrew', 'kriah', 12.00, 80, true),
  ('99999999-9999-9999-9999-999999999912', 'כתיבה ווערקבוך', NULL, 'hebrew', 'kesiva', 12.00, 75, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. FEE TYPES (סוגי תשלומים)
-- ============================================
INSERT INTO fee_types (id, name, description, category, default_amount, is_active) VALUES
  ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'שכר לימוד', 'חודשליכע שכר לימוד', 'tuition', 850.00, true),
  ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA02', 'רעגיסטראציע', 'יערליכע רעגיסטראציע געלט', 'registration', 150.00, true),
  ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA03', 'ספרים', 'ספרים און ווערקביכער', 'books', NULL, true),
  ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA04', 'טריפ', 'כיתה אויספלוגן', 'trip', NULL, true),
  ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA05', 'סופלייס', 'שול סופלייס', 'supplies', 75.00, true),
  ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA06', 'מיטאג', 'הייסע מיטאג פראגראם', 'other', 200.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. FEES (תשלומים)
-- ============================================
INSERT INTO fees (id, fee_type_id, name, description, amount, scope, due_date, academic_year, status) VALUES
  ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA02', 'רעגיסטראציע 2024-2025', 'יערליכע רעגיסטראציע געלט', 150.00, 'school_wide', '2024-09-01', '2024-2025', 'active'),
  ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA05', 'סופלייס געלט', 'שול סופלייס פארן יאר', 75.00, 'school_wide', '2024-09-15', '2024-2025', 'active'),
  ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB03', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA04', 'חנוכה טריפ', 'טריפ צו אינדאר פארגעניגן פארק', 45.00, 'school_wide', '2024-12-20', '2024-2025', 'active'),
  ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB04', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAA06', 'הייסע מיטאג - ווינטער', 'הייסע מיטאג פראגראם יאנואר-מערץ', 200.00, 'school_wide', '2025-01-01', '2024-2025', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 12. STUDENT FEES (טשאַרדזשעס אויף תלמידים)
-- ============================================
-- Apply fees to students (using correct student IDs: 44444444-...)
INSERT INTO student_fees (id, student_id, fee_id, amount, amount_paid, status, notes) VALUES
  -- Moishy Goldberger (44444444-...401) - paid in full
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC01', '44444444-4444-4444-4444-444444444401', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 150.00, 'paid', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC02', '44444444-4444-4444-4444-444444444401', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 75.00, 'paid', NULL),
  
  -- Shloime Weissman (44444444-...402) - partial payment
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC03', '44444444-4444-4444-4444-444444444402', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 100.00, 'partial', 'באצאלט טיילווייז'),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC04', '44444444-4444-4444-4444-444444444402', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 0.00, 'pending', NULL),
  
  -- Yitzy Kaufman (44444444-...403) - pending
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC05', '44444444-4444-4444-4444-444444444403', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 0.00, 'pending', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC06', '44444444-4444-4444-4444-444444444403', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 0.00, 'pending', NULL),
  
  -- Sruly Berkowitz (44444444-...404) - paid
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC07', '44444444-4444-4444-4444-444444444404', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 150.00, 'paid', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC08', '44444444-4444-4444-4444-444444444404', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 75.00, 'paid', NULL),
  
  -- Duvy Fried (44444444-...405) - waived (scholarship)
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC09', '44444444-4444-4444-4444-444444444405', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 0.00, 'waived', 'סטיפענדיע'),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC10', '44444444-4444-4444-4444-444444444405', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 0.00, 'waived', 'סטיפענדיע'),
  
  -- Yanky Teitelbaum (44444444-...406) - partial
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC11', '44444444-4444-4444-4444-444444444406', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 50.00, 'partial', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC12', '44444444-4444-4444-4444-444444444406', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 75.00, 'paid', NULL),
  
  -- Mendy Steinberg (44444444-...407) - pending
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC13', '44444444-4444-4444-4444-444444444407', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 0.00, 'pending', NULL),
  
  -- Shloimy Hershkowitz (44444444-...408) - paid
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC14', '44444444-4444-4444-4444-444444444408', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 150.00, 'paid', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC15', '44444444-4444-4444-4444-444444444408', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 75.00, 'paid', NULL),
  
  -- Chaim Lefkowitz (44444444-...409) - partial
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC16', '44444444-4444-4444-4444-444444444409', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 75.00, 'partial', NULL),
  
  -- Avrumi Kohn (44444444-...410) - pending
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC17', '44444444-4444-4444-4444-444444444410', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB01', 150.00, 0.00, 'pending', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC18', '44444444-4444-4444-4444-444444444410', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB02', 75.00, 0.00, 'pending', NULL),
  
  -- Chanukah trip for some students
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC19', '44444444-4444-4444-4444-444444444401', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB03', 45.00, 45.00, 'paid', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC20', '44444444-4444-4444-4444-444444444402', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB03', 45.00, 0.00, 'pending', NULL),
  ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC21', '44444444-4444-4444-4444-444444444404', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBB03', 45.00, 45.00, 'paid', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 13. PAYMENTS (צאָלונגען)
-- ============================================
INSERT INTO payments (id, student_id, student_fee_id, amount, payment_method, reference_number, payment_date, notes) VALUES
  -- Moishy Goldberger payments
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD01', '44444444-4444-4444-4444-444444444401', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC01', 150.00, 'check', '1001', '2024-09-01', 'רעגיסטראציע באצאלט'),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD02', '44444444-4444-4444-4444-444444444401', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC02', 75.00, 'check', '1001', '2024-09-01', 'סופלייס באצאלט'),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD03', '44444444-4444-4444-4444-444444444401', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC19', 45.00, 'cash', NULL, '2024-12-15', 'טריפ געלט'),
  
  -- Shloime Weissman partial payment
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD04', '44444444-4444-4444-4444-444444444402', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC03', 50.00, 'cash', NULL, '2024-09-05', 'ערשטע צאלונג'),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD05', '44444444-4444-4444-4444-444444444402', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC03', 50.00, 'cash', NULL, '2024-10-01', 'צווייטע צאלונג'),
  
  -- Sruly Berkowitz - full payment by credit card
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD06', '44444444-4444-4444-4444-444444444404', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC07', 150.00, 'credit_card', '4242', '2024-08-28', NULL),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD07', '44444444-4444-4444-4444-444444444404', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC08', 75.00, 'credit_card', '4242', '2024-08-28', NULL),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD08', '44444444-4444-4444-4444-444444444404', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC21', 45.00, 'cash', NULL, '2024-12-18', NULL),
  
  -- Yanky Teitelbaum partial
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD09', '44444444-4444-4444-4444-444444444406', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC11', 50.00, 'check', '5522', '2024-09-10', NULL),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD10', '44444444-4444-4444-4444-444444444406', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC12', 75.00, 'check', '5523', '2024-09-15', NULL),
  
  -- Shloimy Hershkowitz - paid by bank transfer
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD11', '44444444-4444-4444-4444-444444444408', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC14', 150.00, 'bank_transfer', 'ACH-9921', '2024-08-30', NULL),
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD12', '44444444-4444-4444-4444-444444444408', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC15', 75.00, 'bank_transfer', 'ACH-9921', '2024-08-30', NULL),
  
  -- Chaim Lefkowitz partial
  ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDD13', '44444444-4444-4444-4444-444444444409', 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCC16', 75.00, 'cash', NULL, '2024-09-20', 'האלב באצאלט')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'Created: 8 grades, 19 staff members, 8 classes, 40 students';
  RAISE NOTICE 'Plus: tutor assignments, issues, call logs, meetings, books, fees, student_fees, and payments';
END $$;
