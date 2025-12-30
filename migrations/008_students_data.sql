-- ============================================
-- Students Data Import
-- ============================================
-- Generated from kids.csv
-- Total students: 362
-- ============================================

-- ============================================
-- CLEAR OLD DATA FIRST
-- ============================================
DELETE FROM students;

-- Insert students linked to their classes

-- ג - א (30 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Adler', 'משי אדלער', '2018-08-22',
  'Shmiel', 'געלא בילא', '38 Skylark Dr', 'Spring Valley', '10977-1315',
  '(845)263-4565', '(845)521-8384', 'shmiliadler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Bayer', 'משה בייער', '2018-12-13',
  'Tzvi', 'ממל', '26 Brockton Rd', 'Spring Valley', '10977-2124',
  '(845)521-8626', '(845)376-3108', 'healthybayer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mordechai Pinchas', 'Blau', 'מרדכי פנחס בלויא', '2018-08-07',
  'Elexander', 'רינא', '21 Vincent Rd UNIT 111', 'Spring Valley', '10977-4169',
  '(845)587-5855', '(845)521-5380', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Ciment', 'דוד צימענד', '2019-03-01',
  'Yitzchok', 'צארטי', '9 Fairway Oval', 'Spring Valley', '10977-1724',
  '(845)422-0788', '(845)548-8742', 'yitzchokciment@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Dancziger', 'שמעון דאנציגער', '2018-04-25',
  'Levi Yitzchok', 'אסתי', '2 Bluefield Dr 301', 'Spring Valley', '10977-3461',
  '(845)304-9240', '(845)641-3122', 'levi@woappliances.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Feder', 'שמעון פעדער', '2019-03-21',
  'Shulem', 'טראני', '31 N. Madison Ave. #301', 'Spring Valley', '10977-4810',
  '(845)570-1179', '(845)558-8384', 'shulem1179@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid Shmuel', 'Feldman', 'דוד שמואל פעלדמאן', '2018-07-23',
  'Isaac', 'אסתר פייגי', '4 N Rigaud Rd # 102', 'Spring Valley', '10977-2532',
  '(845)521-6422', '(845)587-6955', '5216422@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Zisha', 'Felsenburg', 'זושא פעלזנבורג', '2018-08-01',
  'Menachem Moshe', 'שרי', '12 Lane St. #111', 'Monsey', '10952-3140',
  '(845)376-0247', '(845)274-5202', 'm8453760247@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eluzer', 'Frank', 'אלעזר פראנק', '2019-01-25',
  'Yoel', 'ליבא בלומא', '31 North Rigaud Rd.', 'Spring Valley', '10977-2533',
  '(845)213-8823', '(845)502-6737', '4260424@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Leiby', 'Frieder', 'לייבי פריעדער', '2019-01-29',
  'Shloima', 'טויבי', '35 Franka Pl.', 'Spring Valley', '10977-3836',
  '(845)422-1208', '(845)596-3835', 'shf2580@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Michael', 'Gold', 'מיכאל גאלד', '2018-05-25',
  'Eluzer', 'חנה', '6 Marman Pl. #201', 'Spring Valley', '10977-3839',
  '(845)517-7100', '(845)659-1382', 'Eli8752@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Efraim', 'Gross', 'אפרים גראסס', '2018-10-09',
  'Elimelech', 'רחל', '67 Twin Ave.', 'Spring Valley', '10977-4191',
  '(845)499-5318', '(845)499-5456', 'meilechgross@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Herzog', 'יצחק הערצאג', '2018-05-10',
  'Yakov Avrohom', 'טראני', '20 Pennington Way', 'Spring Valley', '10977-1415',
  '(845)825-2147', '(845)608-9997', 'yah8252147@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Binem', 'Hirschler', 'בינום הירשלער', '2019-05-13',
  'Yossi', 'זיסי', '6 Ewing Ave UNIT 301', 'Spring Valley', '10977-4352',
  '(845)587-6721', '(845)422-2459', 'yossih23@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel Mechl', 'Hoffman', 'יחיאל מיכל האפפמאן', '2018-10-09',
  'Shimshon', 'בלומא ליפשא', '122 Bates Dr.', 'Monsey', '10952-2889',
  '(718)935-0367', '(845)826-2185', 'shimshyhoffman@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Jacobs', 'חיים דזשעקאבס', '2018-08-16',
  'Avrohom', 'טראני', '66 S Madison Ave', 'Spring Valley', '10977',
  '(845)274-4194', '(845)608-7242', 'avrumy4194@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yossi', 'Kaufman', 'יוסי קויפמאן', '2018-12-27',
  'Yidel', 'יודית', '3 First St', 'Spring Valley', '10977-5292',
  '(845)274-8321', '(845)828-0460', '3623760@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Reuven', 'Koenig', 'ראובן קעניג', '2018-11-06',
  'Duvid', 'הינדא', '6 Ewing Ave UNIT 103', 'Spring Valley', '10977-4352',
  '(845)587-6584', '(845)659-2750', 'davidkoenig6584@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Amrom', 'Lichter', 'עמרם ליכטער', '2018-12-07',
  'Yosef Mordechai', 'אסתר רחל', '8 Parker St. #212', 'Spring Valley', '10977-4838',
  '(845)422-6870', '(845)608-7462', 'ymlichter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Moshel', 'שלמי מאשעל', '2018-10-30',
  'Gavriel Leib', 'בילא אסתר', '11 Elm St. Unit 312', 'Spring Valley', '10977-4508',
  '(845)826-2711', '(347)678-3809', 'gymoshel@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Arye Leibish', 'Pfeiffer', 'ארי'' לייביש פייפער', '2018-06-19',
  'Duvid', 'אסתר רחל', '50 Francis Pl Unit 201', 'Monsey', '10952-6617',
  '(347)757-1925', '(347)232-0790', 'esther54268@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Reuven', 'Schmelczer', 'ראובן שמעלצער', '2018-08-23',
  'Zisha', 'לאה', '10 Elm St. #112', 'Spring Valley', '10977-8314',
  '(845)521-1601', '(845)659-1196', '3562070@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Schwartz', 'יצחק שווארץ', '2018-08-30',
  'Bentzion', 'רבקה', '2 Willows Rd', 'Monsey', '10952-1239',
  '(845)422-1112', '(845)274-0306', 'Bschwartz@easternunion.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel Avraham', 'Silberman', 'ישראל אברהם זילבערמאן', '2018-10-25',
  'Yakov', 'סלאווא', '192 Adar Ct.', 'Monsey', '10952-3361',
  '(845)422-1316', '(845)263-6830', 'slavas0541@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yona', 'Spitzer', 'יוני שפיטצער', '2019-04-12',
  'Moshe', 'רחל אסתר חנה', '15 Sneden Ct #104', 'Spring Valley', '10977-4142',
  '(845)263-0018', '(845)376-4750', '123moishe@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Amrom', 'Tambor', 'עמרם טאמבאר', '2019-03-08',
  'Menachem Mendel', 'שרה בריינדל', '12 Wiener Dr UNIT 301', 'Monsey', '10952-1848',
  '(845)587-6926', '(845)587-6927', 'mendyt26@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shia', 'Ungar', 'יושע אונגאר', '2018-04-23',
  'Aron', 'פרומט', '24 Jacaruso Dr', 'Spring Valley', '10977-2526',
  '(917)364-4663', '(845)709-0451', '3644663@GMAIL.COM',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Walter', 'יעקב וואלטער', '2019-03-22',
  'Shmiel Yida', 'הינדא', '591 Union Rd', 'Spring Valley', '10977-2115',
  '(845)499-5526', '(845)263-4848', 'shmuelwalter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Judah', 'Weiss', 'יהודה ווייס', '2018-01-30',
  'Mordechai', 'הינדא', '81 Tennyson Drive', 'Nanuet', '10954',
  '(917)627-1301', '(347)743-1870', 'bssp22@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok Zev', 'Weisz', 'יצחק זאב ווייס', '2018-11-30',
  'Nissan', 'בת שבע', '123 Route 306 #311', 'Monsey', '10952-5709',
  '(845)587-8494', '(914)393-8770', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - א';

-- ג - ב (30 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burach Avrum', 'Braun', 'ברוך אברהם ברוין', '2019-03-12',
  'Yoel Usher', 'מרים', '97 South Madison Ave', 'Spring Valley', '10977-5489',
  '(845)641-3096', '(914)582-0776', 'yoelklein142@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Braun', 'משי ברוין', '2018-11-19',
  'Mordechai', 'ציפורה', '6 Grandview Ave.', 'Spring Valley', '10977-1626',
  '(845)709-1605', '(845)825-9631', 'mbraun@aviryakov.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tuli', 'Breuer', 'נפתלי צבי ברייער', '2018-12-11',
  'Aron', 'פראדל', '65 Twin Ave. #111', 'Spring Valley', '10977-4154',
  '(845)376-2222', NULL, 'frady8969@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Berl', 'Elewitz', 'בערל עלעוויטץ', '2019-04-08',
  'Pinchas', 'פייגא', '2 Lori Ct', 'Spring Valley', '10977-1200',
  '(845)587-6444', NULL, 'felewitz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yida Shaul', 'Farkas', 'יודא שאול פארקאש', '2019-03-17',
  'Lipa', NULL, '6 Lanzut Ct UNIT 316', 'Monsey', '10952-3657',
  '(845)213-9090', '(845)587-5642', 'y2139090@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Meir', 'Fischel', 'מאיר פישעל', '2018-06-17',
  'Moshe Leib', 'בלומי', '81 N Lorna Lane', 'Suffern', '10901-7129',
  '(718)812-7282', '(718)757-8339', 'Mark@handyequip.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Efraim', 'Fischer', 'אפרים פישער', '2018-06-27',
  'Yisroel Moshe', 'חוי', '15 Keith Dr.', 'Monsey', '10952-5013',
  '(845)222-3311', '(347)581-4163', 'fischerym@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Fischer', 'משה פישער', '2019-01-22',
  'Shlomo', 'טראני', '144 Blauvelt Rd. #101', 'Monsey', '10952-2462',
  '(845)608-5200', '(845)608-1499', 'yitzchok27@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burach Yechiel', 'Fried', 'ברוך  פריעד', '2018-12-22',
  'Yosef', 'פיגא', '10 Jacaruso Dr.', 'Spring Valley', '10977-2526',
  '(845)596-4529', '(329)205-4494', '5964529@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yidi', 'Frieder', 'יודי פריעדער', '2018-12-03',
  'Pinchus', 'יודית', '3 Lane St UNIT 214', 'Monsey', '10952-3286',
  '(845)521-8673', '(845)570-7789', 'pinchasfrieder@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eluzer Yona', 'Friedman', 'אלעזר יונה פריעדמאן', '2019-04-19',
  'Avrohom Yitzchok', 'ברכה אסתר מלכה', '6 Ewing Ave UNIT 303', 'Spring Valley', '10977-4352',
  '(845)422-5741', '(845)304-2706', '3621525@koshermail.net',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eliezer Zisya', 'Glancz', 'אליעזר זוסיא גלאנץ', '2018-07-31',
  'Yitzchok Aron', 'חנה ברכה', '21 New County Rd.', 'Monsey', '10952-3523',
  '(845)323-7559', '(845)608-5159', 'Glanczyitzchok@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Green', 'יצחק גרין', '2019-01-20',
  'Yosef', 'ציפורה', '63 Blauvelt Rd #205', 'Monsey', '10952-2187',
  '(845)222-5987', '(845)274-5207', '3977629@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef', 'Greenwald', 'ברוך יוסף אריה גרינוואלד', '2018-09-26',
  'Yisroel', 'רחל חנה', '63 Meron Rd  #202', 'Monsey', '10952-2215',
  '(917)474-7041', '(929)617-0533', 'yisroelgrunwald@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Efraim', 'Gross', 'אפרים מנחם מענדל גרויס', '2018-11-29',
  'Yakov Yosef', 'פעסיל שרה לאה', '5 Ridge Ave. #206', 'Spring Valley', '10977-9411',
  '(845)376-2437', '(347)525-5519', '3762437@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Ezriel', 'Gruber', 'עזריאל גרובער', '2018-05-29',
  'Yisroel', 'דינה', '29 Park Gardens Ct.', 'Spring Valley', '10977-5937',
  '(845)274-0989', '(845)540-3516', 'gruber0989@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Grunwald', 'יצחק גרינוואלד', '2018-08-09',
  'Burech Avraham', NULL, '17 Bluefield Dr. #102', 'Spring Valley', '10977-3369',
  '(347)831-5673', '(929)271-6434', 'bg07087@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aberham', 'Hochhauser', 'אברהם הלל האכהייזער', '2017-07-19',
  'Yosef', 'טראני', '106 Decatur Ave', 'Spring Valley', '10977-4347',
  '(845)587-7970', '(845)596-4392', 'juicery100@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem Mendel', 'Kaufman', 'מנחם מענדל קויפמאן', '2019-01-01',
  'Mordechai Eliezer', 'לעפקאוויטש', '36 Ellish Pkwy UNIT 313', 'Spring Valley', '10977-4378',
  '(845)659-8877', '(845)213-7109', 'mottykaufman@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Kaufman', 'משי קויפמאן', '2018-05-17',
  'Shraga Avigdor', 'פערל בלומא', '17 Ellish Pkwy UNIT 201', 'Spring Valley', '10977-3880',
  '(845)323-2363', '(845)502-1013', 'avigdor0277@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eluzer', 'Rausman', 'אלעזר רויזמאן', '2018-10-09',
  'Chaim', 'הענטשא', '7 Dolson Rd.', 'Monsey', '10952-2820',
  '(347)585-1908', '(347)628-7706', 'rausman20c@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid Yida', 'Reichman', 'דוד יודא רייכמאן', '2019-03-30',
  'Yakov Yosef', 'גיטי', '17 Witzel Ct.', 'Monsey', '10952-7833',
  '(845)661-9058', '(347)432-4747', 'yybandh@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moishe', 'Schwartz', 'משה שווארץ', '2018-07-26',
  'Yidel', 'בילא פערל', '31 E. Willow Tree Rd.', 'Spring Valley', '10977-1120',
  '(845)746-8357', NULL, 'yidel3519@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Zev', 'Spierer', 'חיים זאב שפיערער', '2018-10-27',
  'Yakov Mayer', 'צבי'' אסתר', '195 Adar Ct. #113', 'Monsey', '10952-3472',
  '(845)263-6717', '(845)828-1655', 'yakovspierer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Meir', 'Sputz', 'מאיר שפוטץ', '2018-05-17',
  'Eliezer', 'טראני', '35 Elener Ln. #202', 'Spring Valley', '10977-2523',
  '(845)263-0902', '(845)263-5825', 'ezsputz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem Nuchem', 'Sternberg', 'מנחם נחום שטערנבערג', '2018-10-11',
  'Sender', 'רבקה רחל הינדא', '60 Brewer Road', 'Monsey', '10952-4008',
  '(845)570-7313', '(845)826-5143', 'rsternberg@refuahhealth.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Naftali', 'Ungar', 'נפתלי אונגאר', '2018-07-20',
  'Yitzchok Aron', 'אסתר בריינא', '4 Heara Ln', 'Spring Valley', '10977-3343',
  '(914)521-0627', '(845)502-6131', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Matisyahu', 'Weiss', 'מתתי'' ווייס', '2018-10-31',
  'Shmuel Binyomin', 'אסתר', '21 Sam Law #202', 'Monsey', '10952-2325',
  '(845)376-4992', '(845)587-1037', '2469664@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Yakov', 'Wosner', 'אברהם יעקב וואזנער', '2018-12-24',
  'Moshe', 'חוה', '3 Horizon Ct UNIT 301', 'Monsey', '10952-7808',
  '(845)376-5427', '(845)548-2583', 'wosner5427@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Noach', 'Zabner', 'נח זאבנער', '2019-01-09',
  'Yakov Moshe', 'פייגי', '17 Francis Pl. #A', 'Monsey', '10952-2603',
  '(845)274-0575', '(845)263-6368', 'fz1572@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ג - ב';

-- ד - א (31 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Bier', 'משה נפתלי ביער', '2017-12-06',
  'Eliezer', 'דינא בריינא', '16 Calvert Dr # 203', 'Monsey', '10952-2194',
  '(347)675-6814', '(845)538-5659', 'B3476756814@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehuda', 'Bleier', 'יהודה בלייער', '2017-10-19',
  'Chaim Arya', 'רבקי', '14 Kingston Dr', 'Spring Valley', '10977-1206',
  '(646)689-3318', '(845)459-7446', 'rivky7446@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avruhmy', 'Braun', 'אברהם אהרן ברוין', '2017-09-20',
  'Arya Mordechai', 'חי'' ברכה', '201 Blauvelt Rd UNIT 218', 'Monsey', '10952-3262',
  '(845)499-7884', '(845)304-3399', 'mochy7884@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrumy', 'Braun', 'אברהם נח ברוין', '2017-02-10',
  'Moishe Shia', 'חני', '5 Salem Ct.', 'Spring Valley', '10977',
  '(845)499-7260', '(845)659-8950', 'chany6644@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'David', 'Braun', 'דוד ברוין', '2018-02-12',
  'Chaim', 'סימי', '7 Elm St Unit 212', 'Spring Valley', '10977-8324',
  '(845)323-2457', '(845)538-7522', 'simibraun7@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef', 'Brettler', 'יוסף אריה ברעטלער', '2017-05-30',
  'Shimon Yitzchok', 'בלומא', '12 Valley View Terrace #101', 'Spring Valley', '10977-3608',
  '(845)222-8766', '(845)608-1390', 'sybrettler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Elkunah Mechel', 'Brim', 'אלקנה מיכל ברים', '2017-12-23',
  'Yechiel Arye', 'מלכה', '26 Calvert Dr. #114', 'Monsey', '10952-2183',
  '(845)558-5591', NULL, 'aryebrim@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Efroim', 'Eisenbach', 'אפרים אייזענבאך', '2018-01-17',
  'Bery', 'חי'' דאבע', '4 E Blossom Rd.', 'Suffern', '10901-6702',
  '(845)521-4567', '(845)570-7311', 'bery@residex.us',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrum', 'Elewitz', 'אברהם עלעוויטץ', '2018-02-03',
  'Efraim Tzvi', 'חי'' מלכה', '42 Phyllis Ter.', 'Monsey', '10952-2729',
  '(845)548-6102', '(845)521-6442', 'malkaelewitz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Elewitz', 'חיים עלעוויטץ', '2018-03-22',
  'Pinchas', 'פייגא', '2 Lori Ct', 'Spring Valley', '10977-1200',
  '(845)587-6444', NULL, 'felewitz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burech Tzvi', 'Feldman', 'ברוך צבי פעלדמאן', '2017-05-30',
  'Chanoch Dov', 'דבורה אסתר', '573 Union Rd', 'Spring Valley', '10977-2115',
  '(845)262-9973', '(845)538-7020', 'feldmanhd@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yossi', 'Fischer', 'יוסי פישער', '2017-06-10',
  'Menachem Yehoshua', 'פראדל', '16 Calvert Drive #201', 'Monsey', '10952-2194',
  '(718)930-2003', '(347)799-4633', 'Fischer.yehoshua@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Frank', 'דוד פראנק', '2017-08-07',
  'Yoel', 'הענדי', '1 Garden Terr.', 'Spring Valley', '10977-2118',
  '(718)809-9427', '(718)812-6119', 'yoilf114@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel Mechl', 'Gold', 'יחיאל מיכל גאלד', '2018-03-16',
  'Aron', 'רבקה פעסיא', '6 Anthony Dr', 'Spring Valley', '10977-3635',
  '(845)608-7552', '(845)422-0977', 'Ariinisrael@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Lazer', 'Green', 'אליעזר אהרן גרין', '2017-11-20',
  'Yisroel', 'צפורה ברכה', '33 Collins Ave #312', 'Spring Valley', '10977-4743',
  '(845)222-0700', '(917)751-5184', 'ygmanager@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shaul', 'Greenbaum', 'שאול גרינבוים', '2018-01-13',
  'Shraga Feivel', 'חנה', '15 Crestview Terrace', 'Monsey', '10952',
  '(845)422-6465', '(845)422-3609', 'sfgreenbaum@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Reuven', 'Hirschler', 'ראובן הירשלער', '2018-04-24',
  'Yosef Shloma Burach', 'ברכה גיטל', '12 Twin Ave.', 'Spring Valley', '10977-3949',
  '(845)587-2060', '(845)587-2762', 'yossi2060@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burach Avrohom Lipa', 'Loeffler', 'ברוך אברהם ליפא לאפללער', '2017-12-30',
  'Aharon', 'לאה', '29 Meron Rd.', 'Monsey', '10952',
  '(845)499-8649', NULL, 'aryloeffler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehoushua', 'Lowy', 'יושע לעוויא', '2017-10-28',
  'Aron', 'גיטל', '22 Lancaster Ln.', 'Monsey', '10952-4905',
  '(845)608-7837', '(845)538-6968', 'lowyaron@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moishe', 'Lunger', 'משה לונגער', '2018-03-27',
  'Shmuel', 'חנה גיטל', '8 Wilson Ct.', 'Spring Valley', '10977-1330',
  '(845)304-4341', '(845)213-8633', 'lungershmily@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yossi', 'Lunger', 'יוסי לונגער', '2018-02-28',
  'Shloma', 'טראני', '2 Skylane Ct.', 'Suffern', '10901-6404',
  '(845)642-9317', '(845)659-8863', 'shlomie3997@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'David', 'Neuman', 'אליעזר דוד ניימאן', '2017-10-26',
  'Tovia Meir', 'צארטי', '5 Ridge Ave. #202', 'Spring Valley', '10977-9411',
  '(347)971-1630', '(917)636-3010', 'sh17936@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Elizer Tzvi', 'Preisler', 'אליעזר צבי פרייזלער', '2017-11-22',
  'Chaim Sh.', 'יוטא רחל', '9 Gibbs Ct. #201', 'Monsey', '10952-1867',
  '(845)521-1541', '(845)213-8490', 'hypreisler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aron Zev', 'Reichman', 'אהרן זאב רייכמאן', '2018-03-09',
  'Eli', 'ברכה רחל', '49 N Cole Ave', 'Spring Valley', '10977-4736',
  '(845)659-3916', '(845)521-4849', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Sigall', 'יצחק סיגל', '2018-01-22',
  'Lipa', 'שרה מלכה', '119 Horton Dr', 'Monsey', '10952-2858',
  '(845)499-8706', '(845)608-6471', 'lipasigall@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Yechiel Mechl', 'Silberman', 'חיים יחיאל מיכל זילבערמאן', '2017-08-02',
  'Yitzchok', NULL, '39 Jacaruso Dr.', 'Spring Valley', '10977-2528',
  '(845)213-0326', '(845)502-0664', 'ys2130326@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eluzer Yona', 'Silberman', 'אלעזר יונה זילבערמאן', '2018-01-09',
  'Tzvi Meir', 'סלאבי', '4 Horizon Ct.#103', 'Monsey', '10952-7810',
  '(845)521-9399', '(914)262-0950', 'ssilberman3142@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom', 'Spitzer', 'אברהם שפיטצער', '2017-07-25',
  'Eli', 'אלי', '3 Nancy Ln 202', 'Monsey', '10952',
  '(845)304-1435', '(845)825-5598', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Dov', 'Spitzer', 'דוב שפיטצער', '2017-08-01',
  'Yechezkel Shraga', 'מרים', '10 Vincent Rd UNIT 202', 'Spring Valley', '10977-4166',
  '(845)659-2389', '(845)521-9318', 'ms3562012@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel', 'Weber', 'שמואלי וועבער', '2017-12-22',
  'Moshe Mordechai', 'זלאטי', '27 Fanley Ave. #101', 'Spring Valley', '10977-3815',
  '(845)641-1588', '(845)263-9696', 'mosheweber1@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloma Zalman', 'Weisz', 'שלמה זלמן ווייס', '2017-10-17',
  'Yisroel', 'רויזא בלומא', '1 Ashlawn Ave.', 'Spring Valley', '10977-1618',
  '(845)263-4871', '(646)242-5504', 'srullyweisz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - א';

-- ד - ב (32 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Blau', 'חיים בלויא', '2017-08-03',
  'Dovid Yosef', 'חוי', '15 King Terrace #211', 'Spring Valley', '10977-3602',
  '(845)304-7962', '(845)587-0716', 'dovidyblau@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chezky', 'Brailofsky', 'חזקי ברילובסקי', '2017-12-31',
  'Levi Yitzchok', 'טראני', '11 Collins Ave.', 'Spring Valley', '10977',
  '(845)263-9719', '(845)422-3188', 'levyyb@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem Nuchem', 'Braun', 'מנחם נחום ברוין', '2017-07-20',
  'Yakov Yosef', 'בתי''', '21 Walter Dr.', 'Monsey', '10952-3130',
  '(845)545-7900', '(845)263-2786', 'yaakobbraun@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yesuchar Dov', 'Breuer', 'ישכר דוב ברייער', '2017-05-30',
  'Chaim Yida', 'גיטל', '88 West St #301', 'Spring Valley', '10977-3800',
  '(845)642-8892', '(845)587-5394', 'yehudahbreuer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Chaim', 'Brim', 'אברהם חיים ברים', '2018-01-05',
  'Mordcha Duvid', 'יענטא בלומא יהודית', '491 W Central Ave UNIT 202', 'Spring Valley', '10977-5962',
  '(845)376-9973', '(845)422-2777', '3769973@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Chaim', 'Brim', 'אברהם חיים ברים', '2017-07-19',
  'Moshe', 'צפורה ריזל', '8 Leon Dr UNIT 213', 'Monsey', '10952-3486',
  '(845)521-5148', '(845)213-0555', 'mbrim0983@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmeil', 'Einhorn', 'שמואל יוסף איינהארן', '2017-07-19',
  'Mordche Yida', 'רבקה', '9 Kaufman Ct #B', 'Monsey', '10952-3344',
  '(845)652-3816', '(845)376-3110', 'myeinhorn@baistrany.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Eisenberg', 'משה לייב אייזענבערג', '2017-09-15',
  'Ephraim', 'ביילא', '8 Charles Lane #13', 'Spring Valley', '10977-3329',
  '(845)558-4713', '(845)608-1699', 'ephraimbyy@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon Yosef', 'Eisenberger', 'שמעון יוסף אייזענבערגער', '2017-10-17',
  'Eliezer Amrom', 'מרים', '16 Sherri Ln.', 'Spring Valley', '10977-1308',
  '(845)548-5059', '(845)538-7323', 'mimie2025@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehuda', 'Feldman', 'יהודה פעלדמאן', '2018-02-06',
  'Yitzchok Yisoscher', 'חנה רבקה', '11 Maple Leaf Rd 202', 'Monsey', '10952-3196',
  '(845)587-9686', '(845)304-4494', 'a8452634321@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Sender', 'Frieder', 'סנדר פריעדער', '2016-10-26',
  'Shia', 'פיגא', '15 Bluefield Drive #202', 'Spring Valley', '10977-3367',
  '(347)432-0548', '(845)641-8517', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Hershy', 'Friesel', 'הערשי פריעזעל', '2017-08-09',
  'Aron', 'אסתי', '39 Decatur Ave UNIT 113', 'Spring Valley', '10977-5868',
  '(845)587-3476', '(845)587-0621', '5873476@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Fuchs', 'יעקב פוקס', '2017-06-11',
  'Moshe', 'שרה', '92 Francis Pl', 'Spring Valley', '10977',
  '(718)812-6768', '(347)682-0592', 'surifuchs@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrum Yakov', 'Green', 'אברהם יעקב גרין', '2017-11-30',
  'Naftuli', 'ריינא', '173 Route 306 #212', 'Monsey', '10952-1980',
  '(845)304-7808', '(845)642-8852', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Green', 'ישראל גרין', '2017-06-08',
  'Yosef', 'ציפורה', '63 Blauvelt Rd #205', 'Monsey', '10952-2187',
  '(845)222-5987', '(845)274-5207', '3977629@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Dov', 'Greenbaum', 'דובי גרינבוים', '2017-06-19',
  'Mendel', 'שיינדל', '10 Ralph Blvd.', 'Monsey', '10952-3437',
  '(845)274-8923', '(845)274-2031', '2748923@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Duvid', 'Greenberg', 'חיים דוד גרינבערג', '2017-08-09',
  'Yakov Yosef', 'גיטל', '202 Bates Dr.', 'Monsey', '10952-2891',
  '(845)825-7366', '(845)596-8040', 'Ygreenberg@chesed247.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendy', 'Hirschler', 'מענדי הירשלער', '2017-11-28',
  'Yossi', 'זיסי', '6 Ewing Ave UNIT 301', 'Spring Valley', '10977-4352',
  '(845)587-6721', '(845)422-2459', 'yossih23@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shragy', 'Kohn', 'שרגא קאהן', '2017-07-06',
  'Moshe', 'פרומט', '2 Albert Drive #101', 'Monsey', '10952-2901',
  '(347)288-2139', '(845)274-3894', 'moseskohn@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yisroel Shulem', 'Leichtag', 'יעקב ישראל שלום לייכטאג', '2018-03-11',
  'Duvid Pinchas', 'בריינא', '3 Brook St.', 'Spring Valley', '10977',
  '(845)263-0515', '(845)587-4952', '3561697@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Lisz', 'יצחק ליש', '2018-02-12',
  'Yakov Mordechai', 'פעלא', '2 Wiener Dr UNIT 114', 'Monsey', '10952-1971',
  '(845)502-1733', '(646)357-0150', 'yakovmgl@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe Zev', 'Morris', 'משה זאב מאריס', '2017-11-28',
  'Avrohom Zalmen', 'איטא אסתר', '15 Sneden Ct #304', 'Spring Valley', '10977-4142',
  '(845)263-2383', '(845)587-8905', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Yakov', 'Nitzlich', 'אברהם יעקב ניצליך', '2018-02-05',
  'Naftuli Hertz', 'טראני', '11 Maple Leaf Rd #113', 'Monsey', '10952-3196',
  '(845)263-4321', '(845)608-9912', 'a8452634321@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Levy', 'Nitzlich', 'לוי ניצליך', '2017-09-13',
  'Duvid', 'טראני', '75 W. Church St.', 'Spring Valley', '10977-4733',
  '(845)274-5454', '(845)274-5260', 'duvie5454@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shaya', 'Parnes', 'ישעי פרנס', '2017-06-18',
  'Burach Gedalya', 'פייגי', '3 Marman Pl # 101', 'Spring Valley', '10977-3840',
  '(845)729-5396', '(845)459-8759', 'faigygrossman@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Preisler', 'משה פרייזלער', '2017-03-20',
  'Tovia', 'הענטשי', '12 Suzanne Dr.', 'Monsey', '10952-2759',
  '(845)558-4490', '(845)659-4493', 'tpreisler18@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Eliezer', 'Rottenberg', 'חיים אלעזר ראטטענבערג', '2017-09-19',
  'Yosef Shmuel', 'חמי', '7 Hana Ln #213', 'Spring Valley', '10977',
  '(845)274-6857', '(845)548-0193', 'r2746857@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Dovid', 'Rubin', 'דוד רובין', '2017-09-25',
  'Yosef', 'חי', '12 Elener Ln. #101', 'Spring Valley', '10977-2521',
  '(845)587-2160', '(845)587-2160', 'yrubin33@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Chaim', 'Spitzer', 'אברהם חיים שפיטצער', '2017-05-30',
  'Yakov Yosef', 'רבקה רחי', '25 Meron Rd.', 'Monsey', '10952',
  '(845)521-4905', '(845)540-3523', '2743884@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Twersky', 'חיים טווערסקי', '2018-03-03',
  'Yakov Yosef', 'באשא', '577 Union Rd', 'Spring Valley', '10977-2115',
  '(845)587-0909', '(845)746-1622', 'twersky4680@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Lipa', 'Twersky', 'ליפא טווערסקי', '2017-08-11',
  'Zev', 'גיטל', '63 Twin Ave # 301', 'Spring Valley', '10977-3953',
  '(845)323-5116', '(845)422-5899', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Elexander Zev', 'Zabner', 'אלכסנדר זאב זאבנער', '2018-01-31',
  'Eliyahu Meyer', 'יודית', '20 Jacaruso Dr.', 'Spring Valley', '10977-2526',
  '(845)445-5629', '(845)746-8473', 'yzabner123@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ד - ב';

-- ה - א (27 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel Mechl', 'Adler', 'יחיאל מיכל אדלער', '2016-11-25',
  'Shmiel', 'געלא בילא', '38 Skylark Dr', 'Spring Valley', '10977-1315',
  '(845)263-4565', '(845)521-8384', 'shmiliadler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Blau', 'יעקב בלויא', '2017-05-15',
  'Moishe Y.', 'טראני', '7 Meron Rd', 'Monsey', '10952-2215',
  '(845)422-3094', '(845)274-2974', 'fraidahblau@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Bransdorfer', 'שלמה בראנדסדארפער', '2017-02-13',
  'Yitzchok', 'טראני', '110 N. Cole Ave. #201', 'Spring Valley', '10977-4361',
  '(845)521-5869', '(845)608-5776', 'yitzchokbransdorfer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Hershy', 'Braun', 'נחמן צבי ברוין', '2016-03-29',
  'Arya Mordechai', 'חי'' ברכה', '201 Blauvelt Rd UNIT 218', 'Monsey', '10952-3262',
  '(845)499-7884', '(845)304-3399', 'mochy7884@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef Mordechai', 'Braun', 'יוסף מרדכי ברוין', '2016-04-28',
  'Yom Tov', 'דינה', '21 Widman Ct. Unit 102', 'Spring Valley', '10977-8307',
  '(845)263-2538', '(845)376-4667', '18452632538@email36.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Chaim', 'Breuer', 'אברהם חיים ברויער', '2016-11-19',
  'Berl', 'אסתר', '4 Bay Ct', 'Spring Valley', '10977-2003',
  '(845)746-1450', '(917)405-8661', 'dovbreuer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Dov', 'Breuer', 'חיים דוב ברייער', '2016-11-20',
  'Yitzchok', 'ברכה', '80 Francis Pl. #202', 'Spring Valley', '10977-3316',
  '(845)263-6457', '(845)587-7469', 'Yitzybreuer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Hershy', 'Ciment', 'הערשי צימענד', '2016-05-23',
  'Yitzchok', 'צארטי', '9 Fairway Oval', 'Spring Valley', '10977-1724',
  '(845)422-0788', '(845)548-8742', 'yitzchokciment@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Diamant', 'דוד הכהן דיאמאנט', '2016-04-13',
  'Mendl', 'רבקה', '10 Ashlawn Ct.', 'Spring Valley', '10977-1329',
  '(845)499-8299', '(845)309-7363', 'diamantmendy@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Fischer', 'משה פישער', '2016-11-08',
  'Yakov Zev', 'מרים בלומא', '45 Ashel Ln. #B', 'Monsey', '10952-2653',
  '(845)604-1752', '(845)274-0473', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloma Zalman', 'Frank', 'שלמה זלמן פראנק', '2017-03-02',
  'Yoel', 'ליבא בלומא', '31 North Rigaud Rd.', 'Spring Valley', '10977-2533',
  '(845)213-8823', '(845)502-6737', '4260424@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Greenbaum', 'דוד גרינבוים', '2017-04-22',
  'Dov', 'חוה חיילה', '14 Anthony Dr. #211', 'Spring Valley', '10977-3635',
  '(845)213-9667', '(845)274-6355', '2139667@Gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Motty', 'Greenberg', 'מרדכי גרינבערג', '2016-05-16',
  'Yitzchok', 'איידי', '18 Skylark Dr.', 'Spring Valley', '10977-1312',
  '(845)608-5155', '(845)570-7400', 'aidybreuer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Nussen Yisroel Aharon', 'Klein', 'נתן ישראל אהרן קליין', '2017-03-12',
  'Eliezer', 'ברכה', '8 Widman Ct #301', 'Spring Valley', '10977-3353',
  '(845)376-2709', '(845)274-0676', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Koenig', 'שלומי קעניג', '2016-11-05',
  'Yitzchok N', 'טראני', '13 Anthony Dr.', 'Spring Valley', '10977',
  '(845)213-0228', '(845)596-3406', 'tullyluxury@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Kupperman', 'חיים קופפערמאן', '2016-10-03',
  'Elchonon', 'פיגא נחמה', '40 Cedar Ln  #115', 'Monsey', '10952-2143',
  '(845)376-5863', NULL, NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Lichter', 'שלומי ליכטער', '2017-01-15',
  'Yosef Mordechai', 'אסתר רחל', '8 Parker St. #212', 'Spring Valley', '10977-4838',
  '(845)422-6870', '(845)608-7462', 'ymlichter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aryeh', 'Lisz', 'ארי'' לייביש ליש', '2016-05-25',
  'Yakov Mordechai', 'פעלא', '2 Wiener Dr UNIT 114', 'Monsey', '10952-1971',
  '(845)502-1733', '(646)357-0150', 'yakovmgl@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe Yakov Shulem', 'Lunger', 'משה יעקב שלום לונגער', '2016-06-23',
  'Yoel Z', 'חי''', '43 Yale Dr #211', 'Monsey', '10952-2631',
  '(347)742-4562', '(845)422-6451', 'zismanlunger@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloma Zalmen', 'Lunger', 'שלמה זלמן לונגער', '2016-09-26',
  'Shmuel', 'חנה גיטל', '8 Wilson Ct.', 'Spring Valley', '10977-1330',
  '(845)304-4341', '(845)213-8633', 'lungershmily@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Zev Nuchem', 'Mandelbaum', 'זאב נחום מאנדעלבוים', '2016-10-13',
  'Shmuel', 'מלכי', '7 Elm St. #311', 'Spring Valley', '10977',
  '(929)226-5079', '(845)376-0491', 'shmielmandel@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Shia', 'Mayteles', 'יעקב יהושע מייטעלעס', '2016-11-27',
  'Yitzchok M', NULL, '8 Horizon Ct. #303', 'Monsey', '10952-7812',
  '(845)596-9829', '(845)274-3267', 'ymayteles@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mordechai Pinchas', 'Reichman', 'מרדכי פנחס רייכמאן', '2016-06-17',
  'Yosef', 'אסתר חנה', '103 West St. #111', 'Spring Valley', '10977-1523',
  '(845)213-0371', '(845)422-1877', '3522098@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Hershy', 'Silber', 'הערשי זילבער', '2016-09-28',
  'Yitzchok', 'דינה', '4 South Riguad Rd.', 'Spring Valley', '10977-2536',
  '(845)709-3443', '(845)709-1484', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shea', 'Sobel', 'יושע סאבעל', '2016-02-15',
  'Yakov Mayer', 'מירי', '5 Francis Pl Unit 216', 'Monsey', '10952-3563',
  '(917)418-0791', '(347)930-7406', 'jacksobel@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yossi', 'Tevlovits', 'יוסף טעוולאוויטש', '2016-07-13',
  'Avrohom', 'שינא רויזא', '32 Calvert Dr # 1', 'Monsey', '10952-1835',
  '(845)422-7058', '(845)262-9114', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok Eisik', 'Unger', 'יצחק אייזיק אונגער', '2016-09-20',
  'Binyomin Zev', 'לאה', '64 Herrick Ave. #102', 'Spring Valley', '10977-7710',
  '(845)828-1870', '(845)538-3069', '6086046@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - א';

-- ה - ב (26 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Ezriel Hertzka Yona', 'Breuer', 'הירצקא  ברייער', '2016-08-25',
  'Shmuel Binyomen', 'בילא', '31 Skylark Dr.', 'Spring Valley', '10977-1314',
  '(718)388-7003', '(718)607-2346', 'sam@breuerllc.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel Mechl', 'Breuer', 'יחיאל מיכל ברייער', '2017-03-13',
  'Shmuel Binyomin', 'שרה', '20 Herrick Ave. #113', 'Spring Valley', '10977-5056',
  '(845)263-9015', '(845)274-2952', 'shmilibreuer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Buxbaum', 'יעקב יוסף בוקסבוים', '2016-11-04',
  'Mechael', 'חנה', '21 Jasinski Rd', 'Spring Valley', '10977-3927',
  '(845)499-9263', '(845)499-5431', 'ymb5169@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel', 'Einhorn', 'שמואל איינהארן', '2016-07-22',
  'Mendel', 'זעלדא חיה ביילא', '49 Ashel Ln 301', 'Monsey', '10952-2697',
  '(845)826-2561', '(845)499-6806', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Feder', 'חיים פעדער', '2016-09-03',
  'Moshe', 'פרומט פעסיל', '42 N Myrtle Ave #201', 'Spring Valley', '10977-4897',
  '(845)274-5808', NULL, 'moishyfeder@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Feldman', 'שמעון פעלדמאן', '2016-09-05',
  'Yakov Yosef', 'ביילא גיטי', '47 Ridge Ave. #112', 'Spring Valley', '10977-5446',
  '(845)521-4745', '(347)549-5495', 'jf8455214745@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Feldman', 'שלמה פעלדמאן', '2016-07-06',
  'Isaac', 'אסתר פייגי', '4 N Rigaud Rd # 102', 'Spring Valley', '10977-2532',
  '(845)521-6422', '(845)587-6955', '5216422@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tuli', 'Friedman', 'נפתלי פריעדמאן', '2017-01-09',
  'Yisroel', 'אסתר צערל', '2 Eros Dr.', 'Monsey', '10952-4114',
  '(845)499-5025', NULL, '4995025@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Gobioff', 'יצחק גביוף', '2016-11-28',
  'Yakov Y.', 'איידל', '46 College Rd', 'Monsey', '10952-2825',
  '(845)274-7314', '(845)376-4893', 'yaygob@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Green', 'ישראל גרין', '2016-03-14',
  'Naftuli', 'שרי', '13 Red Rock Rd.', 'New City', '10956',
  '(845)376-3996', '(845)570-7035', '3542468@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Motty', 'Greenberg', 'מרדכי גרינבערג', '2016-06-15',
  'Mendy', 'רבקי', '20 Skylark Dr.', 'Spring Valley', '10977-1312',
  '(845)263-2010', '(845)422-7076', 'mgreenberg247@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Gruber', 'שמעון גרובער', '2016-12-04',
  'Yisroel', 'דינה', '29 Park Gardens Ct.', 'Spring Valley', '10977-5937',
  '(845)274-0989', '(845)540-3516', 'gruber0989@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Pinchas', 'Kaufman', 'פנחס קויפמאן', '2016-12-18',
  'Mordechai Eliezer', 'לעפקאוויטש', '36 Ellish Pkwy UNIT 313', 'Spring Valley', '10977-4378',
  '(845)659-8877', '(845)213-7109', 'mottykaufman@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Pinchos', 'Klein', 'פנחס ברייער', '2016-12-16',
  'Shmelka', 'טראני', '69 Fairview Ave # 211', 'Spring Valley', '10977-5811',
  '(347)797-8439', NULL, 'shmelkaklein@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shulem', 'Koth', 'שלום קאטה', '2017-04-08',
  'Moshe Mayer', 'מלכה', '17 Anthony Dr. #202', 'Spring Valley', '10977-3634',
  '(646)522-6960', '(646)942-2832', 'moshe@monseyfish.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel Mechl', 'Leichtag', 'יחיאל מיכל לייכטאג', '2017-01-03',
  'Duvid Pinchas', 'בריינא', '3 Brook St.', 'Spring Valley', '10977',
  '(845)263-0515', '(845)587-4952', '3561697@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Loeffler', 'שמעון לאפפלער', '2016-09-22',
  'Yoel', 'נחמה יוטל', '37 Witzel Ct.', 'Monsey', '10952-2848',
  '(845)826-6536', '(845)826-6968', 'yoelc24@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mordechai', 'Rausman', 'מרדכי רויזמאן', '2017-03-05',
  'Chaim', 'הענטשא', '7 Dolson Rd.', 'Monsey', '10952-2820',
  '(347)585-1908', '(347)628-7706', 'rausman20c@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Kalmen', 'Reichman', 'קלמן רייכמאן', '2016-06-09',
  'Yakov Yosef', 'גיטי', '17 Witzel Ct.', 'Monsey', '10952-7833',
  '(845)661-9058', '(347)432-4747', 'yybandh@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shlome Dov', 'Reichman', 'שלמה דוב רייכמאן', '2016-07-20',
  'Eli', 'ברכה רחל', '49 N Cole Ave', 'Spring Valley', '10977-4736',
  '(845)659-3916', '(845)521-4849', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Rothchild', 'יצחק אייזיק ראטשילד', '2017-04-14',
  'Yakov Yosef', 'חני', '83 Union Rd.', 'Spring Valley', '10977-3310',
  '(845)422-2654', '(845)274-2640', '4222654@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Spira', 'משה שפירא', '2016-06-19',
  'Hershl', 'פייגי', '13 Anthony Dr.', 'Spring Valley', '10977',
  '(845)274-0102', '(845)608-2582', '6082582@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmiel Naftuli', 'Spitz', 'שמואל נפתלי שפיץ', '2016-08-05',
  'Usher', 'צפורי', '146 Rt 59 # 203', 'Monsey', '10952',
  '(845)499-3051', '(845)263-4310', 'usherspitz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Solomon', 'Taub', 'שלומי טויב', '2016-11-16',
  'Yakov Yosef', 'טראני', '8 Harriet Ln.', 'Spring Valley', '10977-1301',
  '(845)422-2912', '(845)213-8465', 'yytaub@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef', 'Tevlovits', 'יוסף טעוולאוויטש', '2016-08-02',
  'Yona', 'בת שבע', '48 Calvert Dr. #201', 'Monsey', '10952-3544',
  '(845)538-7139', '(845)300-0636', 'yonitev@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Lipa', 'Weisz', 'ליפא ווייס', '2016-10-27',
  'Nissan', 'בת שבע', '123 Route 306 #311', 'Monsey', '10952-5709',
  '(845)587-8494', '(914)393-8770', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ה - ב';

-- ו - א (25 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloma', 'Adler', 'שלמה אדלער', '2015-10-23',
  'Shmiel', 'געלא בילא', '38 Skylark Dr', 'Spring Valley', '10977-1315',
  '(845)263-4565', '(845)521-8384', 'shmiliadler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aron', 'Bluming', 'אהרן בלומינג', '2016-03-06',
  'Chananya Dov', 'מרים חנה', '11 Lancaster Dr.', 'Suffern', '10901',
  '(914)587-0311', '(929)969-4128', 'dovybluming@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmiel Eliezer Yom Tov Lipa', 'Braun', 'שמואל אליעזר יוט ליפא ברוין', '2015-04-26',
  'Yoel Usher', 'מרים', '97 South Madison Ave', 'Spring Valley', '10977-5489',
  '(845)641-3096', '(914)582-0776', 'yoelklein142@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendel', 'Eisenberg', 'יצחק ישכר מנחם מענדל אייזענבערג', '2015-10-10',
  'Ephraim', 'ביילא', '8 Charles Lane #13', 'Spring Valley', '10977-3329',
  '(845)558-4713', '(845)608-1699', 'ephraimbyy@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechial Mechl', 'Feldman', 'יחיאל מיכל פעלדמאן', '2015-08-20',
  'Chanoch Dov', 'דבורה אסתר', '573 Union Rd', 'Spring Valley', '10977-2115',
  '(845)262-9973', '(845)538-7020', 'feldmanhd@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel Tzvi', 'Fischer', 'יחיאל צבי פישער', '2015-11-15',
  'Shlomo', 'טראני', '144 Blauvelt Rd. #101', 'Monsey', '10952-2462',
  '(845)608-5200', '(845)608-1499', 'yitzchok27@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Frieder', 'יצחק פריעדער', '2015-08-19',
  'Pinchus', 'יודית', '3 Lane St UNIT 214', 'Monsey', '10952-3286',
  '(845)521-8673', '(845)570-7789', 'pinchasfrieder@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehoshua', 'Goldman', 'יהושע גולדמאן', '2016-01-26',
  'Yitzchok Aron', 'טראנא', '111 Route 306 #301', 'Monsey', '10952-2731',
  '(845)275-5725', NULL, NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Gross', 'דוד גראסס', '2016-02-05',
  'Elimelech', 'רחל', '67 Twin Ave.', 'Spring Valley', '10977-4191',
  '(845)499-5318', '(845)499-5456', 'meilechgross@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Kantor', 'שלמי קענטאר', '2015-12-08',
  'Yerachmiel', 'פערל', '10 Elm St Unit 411', 'Spring Valley', '10977-8314',
  '(845)499-9037', '(845)213-9332', 'pkantor@refuahhealth.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Kaufman', 'שמעון קויפמאן', '2015-07-09',
  'Yidel', 'יודית', '3 First St', 'Spring Valley', '10977-5292',
  '(845)274-8321', '(845)828-0460', '3623760@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Loeffler', 'יעקב יוסף לאפפלער', '2016-04-13',
  'Zevy', 'טראני', '7 Kaufman Ct.', 'Monsey', '10952',
  '(845)499-0746', '(845)641-7608', '4990746@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendy', 'Moshel', 'מנחם מענדל מאשעל', '2015-07-10',
  'Gavriel Leib', 'בילא אסתר', '11 Elm St. Unit 312', 'Spring Valley', '10977-4508',
  '(845)826-2711', '(347)678-3809', 'gymoshel@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrum', 'Neustadt', 'אברהם ניישטאדט', '2015-10-13',
  'Zev', 'טשארני', '63 Twin Ave UNIT 212', 'Spring Valley', '10977-3953',
  '(845)213-7199', '(718)594-6668', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom', 'Polatseck', 'אברהם פאלאטשעק', '2016-02-17',
  'Bentzion', 'מאטיל לאה', '12 Fanley Ave. #211', 'Spring Valley', '10977-4136',
  '(845)825-6356', '(845)825-9371', 'mpolatseck@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef Mordcha', 'Pollak', 'יוסף מרדכי פאללאק', '2015-10-12',
  'Benjamin', 'ליבא', '8 Elm St Unit 101', 'Spring Valley', '10977-8326',
  '(347)243-9800', '(845)213-5036', 'bennypollak8@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chanoch Henach', 'Rosenbaum', 'חנוך העניך ראזענבוים', '2015-08-06',
  'David Mayer', 'פייגא יענטא', '9 Park St', 'Spring Valley', '10977-4354',
  '(845)659-5323', '(845)376-4880', 'maiyu10@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Ezriel Hertzka Yona', 'Schmeltczer', 'עזריאל הירצקא יונה שמעלצער', '2015-11-23',
  'Bentzion Pinchas', 'מרים', '2 Kentor Ln', 'Monsey', '10952-1208',
  '(718)637-7525', '(718)809-1733', 'benzyschmelczer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'David', 'Schonfeld', 'דוד שאנפעלד', '2016-02-20',
  'Yakov Yosef', 'בתי''', '542 W Central Ave', 'Monsey', '10952-3465',
  '(845)538-5332', '(845)263-2313', '542monsey@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel Efraim Zalmen', 'Spira', 'שמואל אפרים זלמן שפירא', '2016-02-16',
  'Yosef Chanina', 'ברכה זיסל', '15 Mcnamara Rd', 'Spring Valley', '10977-1404',
  '(845)499-6066', '(845)641-9309', 'yosefspira@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Maytisyuhi Burach', 'Tambor', 'מתתי'' ברוך טאמבאר', '2016-04-18',
  'Abraham Yitzchok', 'מרים פרומטשא', '15 Bluefield Dr. #201', 'Spring Valley', '10977-3367',
  '(917)352-1819', '(845)269-0026', 'ayt@atamborcpa.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon Chaim', 'Ungar', 'שמעון חיים אונגאר', '2016-05-22',
  'Yitzchok Aron', 'אסתר בריינא', '4 Heara Ln', 'Spring Valley', '10977-3343',
  '(914)521-0627', '(845)502-6131', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloma Yishai', 'Ungar', 'שלמה ישי אונגער', '2015-06-20',
  'Mordechai', 'שינדל גאלדא', '21 Elener Ln #201', 'Spring Valley', '10977-2523',
  '(347)793-9628', '(929)275-2600', 'Mutty197@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Wertzberger', 'שמעון ווערצבערגער', '2016-01-14',
  'Hershey', 'פריידא מלכה', '8 Park St UNIT 301', 'Spring Valley', '10977-4356',
  '(845)596-2847', '(845)538-7177', 'fw3711998@yahoo.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Eluzer', 'Yankovitch', 'חיים אלעזר יאנקאוויטש', '2015-08-31',
  'Hershy', 'הדסה', '27 Meron Rd', 'Monsey', '10952',
  '(718)598-0109', '(845)274-1958', 'hhyankovitch@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - א';

-- ו - ב (22 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Isaac', 'Bier', 'יצחק אהרן ביער', '2015-05-14',
  'Eliezer', 'דינא בריינא', '16 Calvert Dr # 203', 'Monsey', '10952-2194',
  '(347)675-6814', '(845)538-5659', 'B3476756814@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Yida', 'Bineth', 'אברהם יודא בינעטה', '2015-12-07',
  'Moshe', 'חנה רחל', '13 Brewer Rd', 'Monsey', '10952-4002',
  '(347)645-8442', '(845)545-8323', 'neumanheshy@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Nussy', 'Direnfeld', 'נתן דירנפעלד', '2015-12-21',
  'Menachem', 'פערי', '9 Elm St. Unit 411', 'Spring Valley', '10977-8328',
  '(845)263-5052', '(845)274-1895', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Fried', 'חיים פריעד', '2016-03-09',
  'Yosef', 'פיגא', '10 Jacaruso Dr.', 'Spring Valley', '10977-2526',
  '(845)596-4529', '(329)205-4494', '5964529@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Rephael', 'Gestetner', 'רפאל געשטעטנער', '2015-09-24',
  'Avrohom', 'ליבא פרומט ברכה', '6 Kaufman Ct', 'Monsey', '10952-3377',
  '(845)422-2614', '(845)502-6827', 'gestetnerlibby@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimmy', 'Goldklang', 'שימי גאלדקלאנג', '2016-04-22',
  'Burach', 'רבקה ריזל', '5 Milford Ct.', 'Spring Valley', '10977-1412',
  '(845)709-7977', '(845)709-4069', 'Burach.goldklang@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendy', 'Green', 'מענדי גרין', '2016-01-20',
  'Ephraim Shraga', 'טראני', '21 Herrick Ave. #211', 'Spring Valley', '10977-7704',
  '(845)741-4444', '(845)263-9953', 'Greenefraim@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Matisyahu', 'Holczler', 'מתתי'' האלצלער', '2015-09-22',
  'Moshe', 'האדל נחמה', '9 Fleetwood Av.', 'Spring Valley', '10977-7004',
  '(845)274-4812', NULL, 'holczlermoshe@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avruhom', 'Kaufman', 'אברהם קויפמאן', '2015-08-04',
  'Shraga Avigdor', 'פערל בלומא', '17 Ellish Pkwy UNIT 201', 'Spring Valley', '10977-3880',
  '(845)323-2363', '(845)502-1013', 'avigdor0277@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Klein', 'יעקב יוסף קליין', '2015-07-09',
  'Shloma', 'זיסל דבורה', '3 Crest Ct. # 304', 'Monsey', '10952-2133',
  '(845)274-3776', '(845)587-4121', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tzvi Elimelech', 'Langsam', 'צבי אלימלך לאנגסאם', '2015-11-19',
  'Yakov Y.', 'אסתר', '166 Horton Dr', 'Monsey', '10952-2887',
  '(845)200-1836', '(845)837-8048', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yochenen', 'Loeffler', 'יוחנן לאפפלער', '2016-03-21',
  'Yitzchok', 'אסתר פריידי', '3 Lane St Unit 114', 'Monsey', '10952-3286',
  '(845)517-7578', '(845)861-1670', 'yitloe12@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mayer Menachem Mendel', 'Mannes', 'מאיר מנחם מענדל מנס', '2015-07-27',
  'Shloime', 'טראני', '8 Collins Ave. #111', 'Spring Valley', '10977-5881',
  '(845)608-7661', '(845)263-6362', 'mannes0615@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Arye Leibish', 'Neuman', 'ארי'' לייביש ניימאן', '2015-09-18',
  'Tovia Meir', 'צארטי', '5 Ridge Ave. #202', 'Spring Valley', '10977-9411',
  '(347)971-1630', '(917)636-3010', 'sh17936@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Rausman', 'יעקב רויזמאן', '2015-08-30',
  'Chaim', 'הענטשא', '7 Dolson Rd.', 'Monsey', '10952-2820',
  '(347)585-1908', '(347)628-7706', 'rausman20c@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Chaim', 'Spitzer', 'אברהם חיים שפיטצער', '2015-06-23',
  'Yechezkel Shraga', 'מרים', '10 Vincent Rd UNIT 202', 'Spring Valley', '10977-4166',
  '(845)659-2389', '(845)521-9318', 'ms3562012@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shlomo Dov', 'Sternberg', 'שלמה דוב שטערנבערג', '2015-12-27',
  'Sender', 'רבקה רחל הינדא', '60 Brewer Road', 'Monsey', '10952-4008',
  '(845)570-7313', '(845)826-5143', 'rsternberg@refuahhealth.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moishy', 'Walter', 'משה וואלטער', '2016-03-02',
  'Yisroel Aron', 'בריינא זלאטע', '26 Calvert Dr #213', 'Monsey', '10952-2183',
  '(845)263-5550', '(845)274-6484', 'yisraelwalter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Weingarten', 'ישראל וויינגארטן', '2016-04-18',
  'Yida Arya', 'קילא', '555 Union Rd.', 'Spring Valley', '10977-2757',
  '(845)422-2005', '(845)499-8445', 'yehudaw20@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom Yeshaya', 'Weisz', 'אברהם ישעי'' ווייס', '2015-05-19',
  'Nissan', 'בת שבע', '123 Route 306 #311', 'Monsey', '10952-5709',
  '(845)587-8494', '(914)393-8770', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Berl', 'Weisz', 'בערל ווייס', '2015-07-19',
  'Yisroel', 'רויזא בלומא', '1 Ashlawn Ave.', 'Spring Valley', '10977-1618',
  '(845)263-4871', '(646)242-5504', 'srullyweisz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef', 'Wertzberger', 'יוסף ווערצבערגער', '2016-01-14',
  'Hershey', 'פריידא מלכה', '8 Park St UNIT 301', 'Spring Valley', '10977-4356',
  '(845)596-2847', '(845)538-7177', 'fw3711998@yahoo.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ו - ב';

-- ז - א (19 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yossi', 'Brim', 'יוסף יואל ברים', '2014-11-14',
  'Yechiel Arye', 'מלכה', '26 Calvert Dr. #114', 'Monsey', '10952-2183',
  '(845)558-5591', NULL, 'aryebrim@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom', 'Ciment', 'אברמי צימענד', '2014-09-02',
  'Yitzchok', 'צארטי', '9 Fairway Oval', 'Spring Valley', '10977-1724',
  '(845)422-0788', '(845)548-8742', 'yitzchokciment@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimshon', 'Cinner', 'שמשון ציננער', '2015-01-15',
  'Gershon', 'נחמה רות', '19 Charles Ln.', 'Spring Valley', '10977-3331',
  '(845)825-2581', '(845)499-9804', 'twentymore@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mayer', 'Dancziger', 'ברוך מאיר דוב דאנציגער', '2015-02-09',
  'Aron Eluzer', 'טראני', '5 Bluefield Dr. #201', 'Spring Valley', '10977-3359',
  '(845)521-6014', '(845)263-9770', 'LuzyDancziger@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Einhorn', 'ישראל איינהארן', '2014-10-14',
  'Mendel', 'זעלדא חיה ביילא', '49 Ashel Ln 301', 'Monsey', '10952-2697',
  '(845)826-2561', '(845)499-6806', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Eisenbach', 'שמעון אייזענבאך', '2015-05-07',
  'Bery', 'חי'' דאבע', '4 E Blossom Rd.', 'Suffern', '10901-6702',
  '(845)521-4567', '(845)570-7311', 'bery@residex.us',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burach', 'Eisenberg', 'ברוך אייזענבערג', '2014-07-21',
  'Moshe', 'מינדל זיסל', '15 Dawn Ln', 'Airmont', '10901-6636',
  '(845)222-9224', '(845)659-9241', 'moishe.eisenberg@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Elbaum', 'דוד איילבוים', '2015-01-15',
  'Yosef', 'הענא טאלצא', '38 Regina Rd', 'Airmont', '10952-4537',
  '(347)232-5596', '(845)422-5947', 'yossi157@yahoo.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Fried', 'שלמה מנחם מענדל פריעד', '2015-02-26',
  'Yosef', 'פיגא', '10 Jacaruso Dr.', 'Spring Valley', '10977-2526',
  '(845)596-4529', '(329)205-4494', '5964529@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe Eliezer', 'Fromowitz', 'משה אליעזר פראמאוויטש', '2014-12-18',
  'Shimon', 'חנה יענטא', '13 Collins Ave', 'Spring Valley', '10977-4742',
  '(845)642-8306', '(845)376-6380', 'billing.aquaplumbing@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel David', 'Glancz', 'שמואל דוד גלאנץ', '2014-05-18',
  'Yitzchok Aron', 'חנה ברכה', '21 New County Rd.', 'Monsey', '10952-3523',
  '(845)323-7559', '(845)608-5159', 'Glanczyitzchok@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yekusial', 'Kupperman', 'יקותיאל קופפערמאן', '2015-01-03',
  'Elchonon', 'פיגא נחמה', '40 Cedar Ln  #115', 'Monsey', '10952-2143',
  '(845)376-5863', NULL, NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yoneson', 'Lichter', 'יונתן ליכטער', '2014-09-02',
  'Menachem', 'פריידא', '50 E. Concord Dr.', 'Monsey', '10952-1719',
  '(845)608-9098', '(845)659-2902', 'menachemlichter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Loeffler', 'משה לאפפלער', '2014-08-19',
  'Yoel', 'נחמה יוטל', '37 Witzel Ct.', 'Monsey', '10952-2848',
  '(845)826-6536', '(845)826-6968', 'yoelc24@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Dov', 'Rosengarten', 'ישכר דוב הכהן ראזענגארטן', '2014-12-07',
  'Mordechai', 'בלימא אסתר', '16 Herrick Ave. #112', 'Spring Valley', '10977-5046',
  '(845)274-0212', NULL, NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Zalman', 'Sigall', 'אברהם שלמה זלמן  סיגל', '2014-07-29',
  'Lipa', 'שרה מלכה', '119 Horton Dr', 'Monsey', '10952-2858',
  '(845)499-8706', '(845)608-6471', 'lipasigall@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yona', 'Spitzer', 'יונה שפיטצער', '2015-05-05',
  'Yakov', 'ברכה גיטי', '8 Pasadena Pl', 'Spring Valley', '10977-1209',
  '(845)499-6946', '(845)499-3800', 'Yankeyspitzer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Bentzion', 'Walter', 'בנציון וואלטער', '2014-08-05',
  'Yisroel Aron', 'בריינא זלאטע', '26 Calvert Dr #213', 'Monsey', '10952-2183',
  '(845)263-5550', '(845)274-6484', 'yisraelwalter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Dov Ber', 'Wolfberg', 'חיים דוב בער וואלפבערג', '2014-10-31',
  'Matisyahu', 'חי'' שרה', '371 Remsen Ave', 'Monsey', '10952-2467',
  '(845)642-4619', '(845)709-7288', 'm@notspeeding.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - א';

-- ז - ב (22 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Nissan', 'Bayer', 'ניסן בייער', '2015-02-21',
  'Yakov Yosef', 'מרים', '9 Elener Ln # 201', 'Spring Valley', '10977-2522',
  '(845)263-4470', '(845)422-7525', 'jandbwholesale@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Benzion Chaim', 'Blau', 'בנציון חיים בלויא', '2014-08-11',
  'Yedidya', 'פריידי', '20 Dale Rd.', 'Monsey', '10952-4112',
  '(347)986-9482', '(718)576-9366', 'Yidyblau22@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yedidya', 'Blau', 'ידידי'' יהודה בלויא', '2015-04-09',
  'Moishe Y.', 'טראני', '7 Meron Rd', 'Monsey', '10952-2215',
  '(845)422-3094', '(845)274-2974', 'fraidahblau@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Bentzion David', 'Bluming', 'בנציון דוד בלומינג', '2015-01-12',
  'Shlomo Simcha', 'יהדות שינדל', '3 Dana Rd', 'Monsey', '10952-2306',
  '(845)608-9743', '(845)499-8975', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moishy', 'Brim', 'מאיר משה ברים', '2014-11-14',
  'Yechiel Arye', 'מלכה', '26 Calvert Dr. #114', 'Monsey', '10952-2183',
  '(845)558-5591', NULL, 'aryebrim@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Sholom Dov', 'Brim', 'שלום דוב ברים', '2015-03-19',
  'Mordcha Duvid', 'יענטא בלומא יהודית', '491 W Central Ave UNIT 202', 'Spring Valley', '10977-5962',
  '(845)376-9973', '(845)422-2777', '3769973@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Eisenberg', 'יעקב יוסף אייזענבערג', '2014-12-24',
  'Aron Arya', 'חנה אסתר', '25 Alik Way Suite 101 PMB 555', 'Spring Valley', '10977-8991',
  '(718)207-7820', '(917)913-4918', 'Aroneisenberg@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Zev', 'Feldman', 'זאב פעלדמאן', '2014-10-14',
  'Isaac', 'אסתר פייגי', '4 N Rigaud Rd # 102', 'Spring Valley', '10977-2532',
  '(845)521-6422', '(845)587-6955', '5216422@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Aron', 'Horowitz', 'חיים  אהרן הורוויץ', '2014-09-09',
  'Yakov Tzvi', 'לאה זיסל', '36 Fastov Ave.', 'Spring Valley', '10977',
  '(845)709-4496', '(845)608-4496', '7094496@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem Mendel', 'Horowitz', 'מנחם מענדל הורוויץ', '2014-10-22',
  'Moshe', 'הענטשא', '26 Pascack Rd', 'Pearl River', '10965-1008',
  '(845)659-7364', '(845)659-7555', '6597555@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chananya Dov', 'Kohn', 'חנני'' דוב קאהן', '2014-09-30',
  'Moshe', 'פרומט', '2 Albert Drive #101', 'Monsey', '10952-2901',
  '(347)288-2139', '(845)274-3894', 'moseskohn@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Elchonon', 'Kramer', 'אלחנן קראמער', '2014-11-21',
  'Yisroel Moshe', 'יהודית', '3 Bluefield Dr. #102', 'Spring Valley', '10977-3459',
  '(347)598-7331', '(845)587-3600', 'ymoshek@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Sender', 'Lichter', 'אלכסנדר זאב ליכטער', '2014-04-29',
  'Yosef Mordechai', 'אסתר רחל', '8 Parker St. #212', 'Spring Valley', '10977-4838',
  '(845)422-6870', '(845)608-7462', 'ymlichter@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Lisz', 'חיים שלמה ליש', '2014-06-03',
  'Yakov Mordechai', 'פעלא', '2 Wiener Dr UNIT 114', 'Monsey', '10952-1971',
  '(845)502-1733', '(646)357-0150', 'yakovmgl@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Loeffler', 'משה אליעזר לאפפלער', '2014-04-01',
  'Yitzchok', 'אסתר פריידי', '3 Lane St Unit 114', 'Monsey', '10952-3286',
  '(845)517-7578', '(845)861-1670', 'yitloe12@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem Mendel', 'Mermelstein', 'מנחם מענדל מערמעלשטיין', '2014-11-01',
  'Yakov Tzvi', 'פרידא', '4 Gel Ct', 'Monsey', '10952-1956',
  '(212)933-9773', NULL, 'yanky@yan.ky',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mechel', 'Schwartz', 'מעכל שווארץ', '2015-01-26',
  'Eliezer Menachem', 'עטי', '10 Ibeck Ct.', 'Spring Valley', '10977-3500',
  '(845)538-6027', '(845)825-6167', 'ems4521@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmiel Yosef', 'Silberman', 'שמואל יוסף זילבערמאן', '2014-09-14',
  'Moishe Shimon', 'שרה', '14 Suzanne Dr. #201', 'Monsey', '10952-2942',
  '(845)596-4161', NULL, 'msilberman@baistrany.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehuda', 'Spitz', 'יהודה שפיץ', '2015-02-13',
  'Menachem Mendel', 'בילא ברכה', '28 Eisenhower Ave UNIT 301', 'Spring Valley', '10977-8927',
  '(845)608-9360', '(845)263-5433', '6089360@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Steinmetz', 'דוד שטיינמעץ', '2014-12-20',
  'Yosef', 'ממל', '111 Union Rd UNIT 203B', 'Spring Valley', '10977-3444',
  '(917)687-4478', '(845)274-6828', 'josephsteinmetz1@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Efraim', 'Tevlowitz', 'פישעל טעוולאוויטש', '2014-08-08',
  'Avrohom', 'שינא רויזא', '32 Calvert Dr # 1', 'Monsey', '10952-1835',
  '(845)422-7058', '(845)262-9114', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Weiss', 'חיים ווייס', '2014-09-14',
  'Yakov Yosef', 'חי'' פערל', '29 Decatur Ave. Apt. 2', 'Spring Valley', '10977-4782',
  '(845)517-9472', '(845)376-6233', 'nurbismcha@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ז - ב';

-- ח - א (29 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Azrylewitz', 'משה אזרילעוויטש', '2014-02-07',
  'Chaim Zev', 'שעניא מרים', '12 Alpha Ln', 'Airmont', '10952-4305',
  '(845)641-4196', '(845)263-6942', 'chaimazrylewitz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avrohom', 'Bayer', 'אברהם בייער', '2014-04-28',
  'Menasha', 'מירל נחמה', '51 Bluefield Dr #201', 'Spring Valley', '10977',
  '(845)422-6789', '(845)517-8648', 'bayermenash@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Efraim', 'Braun', 'אפרים ברוין', '2014-01-07',
  'Eliezer Zisia', 'חי''לע', '167 E. Willow Tree', 'Spring Valley', '10977-1018',
  '(845)422-3128', '(845)641-8492', 'ruchy6468@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Braun', 'משה ברוין', '2014-04-15',
  'Arya Mordechai', 'חי'' ברכה', '201 Blauvelt Rd UNIT 218', 'Monsey', '10952-3262',
  '(845)499-7884', '(845)304-3399', 'mochy7884@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe Y.', 'Brettler', 'משה יושע ברעטלער', '2014-03-12',
  'Shimon Yitzchok', 'בלומא', '12 Valley View Terrace #101', 'Spring Valley', '10977-3608',
  '(845)222-8766', '(845)608-1390', 'sybrettler@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shlome', 'Breuer', 'ברוך שלמה זלמן ברייער', '2014-02-18',
  'Pinchus', 'צפורה', '23 Widman Ct. #201', 'Spring Valley', '10977-8308',
  '(845)570-3505', '(845)502-4701', 'pinkaas@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Brim', 'ישראל שמעון ברים', '2013-04-30',
  'Yechiel Arye', 'מלכה', '26 Calvert Dr. #114', 'Monsey', '10952-2183',
  '(845)558-5591', NULL, 'aryebrim@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tzvi', 'Buxbaum', 'הערשי בוקסבוים', '2013-06-11',
  'Mechael', 'חנה', '21 Jasinski Rd', 'Spring Valley', '10977-3927',
  '(845)499-9263', '(845)499-5431', 'ymb5169@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mordechia', 'Direnfeld', 'מרדכי דירנפעלד', '2013-09-03',
  'Menachem', 'פערי', '9 Elm St. Unit 411', 'Spring Valley', '10977-8328',
  '(845)263-5052', '(845)274-1895', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Beinish', 'Eisenberg', 'בייניש אייזענבערג', '2013-12-06',
  'Yisroel', NULL, '491 West Central #216', 'Spring Valley', '10977',
  '(718)344-5491', '(347)768-4069', '3445491@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shalom', 'Friedman', 'שלום פרידמאן', '2013-05-20',
  'Meir Nussen', 'האנטשא מרים', '16 Pine Rd', 'Suffern', '10901-4007',
  '(718)759-7473', NULL, 'kmumonsey@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Fuchs', 'ישראל פוקס', '2014-03-09',
  'Moshe', 'שרה', '92 Francis Pl', 'Spring Valley', '10977',
  '(718)812-6768', '(347)682-0592', 'surifuchs@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tzvi', 'Glancz', 'הערשי גלאנץ', '2013-05-27',
  'Yakov Yisroel', 'טראני', '23 Allik Way Unit 111', 'Spring Valley', '10977',
  '(845)499-7200', '(845)608-6063', 'yakovglancz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eliezer Aron', 'Green', 'אליעזר אהרן גרין', '2013-06-12',
  'Zurach', 'ביילא', '222 Blauvelt Rd #102', 'Monsey', '10952-2574',
  '(845)499-3877', '(845)587-8491', 'greenzorach@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shraga Fivel', 'Greenbaum', 'שרגא פייוול גרינבוים', '2014-05-06',
  'Dov', 'חוה חיילה', '14 Anthony Dr. #211', 'Spring Valley', '10977-3635',
  '(845)213-9667', '(845)274-6355', '2139667@Gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shulem', 'Greenberger', 'שלום גרינבערגער', '2014-01-15',
  'Fishel', 'שיינא צירל', '20 Widman Ct Unit 201', 'Spring Valley', '10977-8303',
  '(347)631-1675', '(845)659-5649', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem Mendel', 'Greenfeld', 'מנחם מענדל גרינפעלד', '2013-03-01',
  'Yakov', 'טראני', '6 Orchard St.', 'Monsey', '10952',
  '(845)558-4642', '(845)558-9286', 'greenfeld.home@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aron Zev', 'Kantor', 'אהרן זאב קענטאר', '2014-01-02',
  'Yerachmiel', 'פערל', '10 Elm St Unit 411', 'Spring Valley', '10977-8314',
  '(845)499-9037', '(845)213-9332', 'pkantor@refuahhealth.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Pinchos', 'Kaufman', 'פנחס קויפמאן', '2014-01-29',
  'Shraga Avigdor', 'פערל בלומא', '17 Ellish Pkwy UNIT 201', 'Spring Valley', '10977-3880',
  '(845)323-2363', '(845)502-1013', 'avigdor0277@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Kleinman', 'יצחק אייזיק קליינמאן', '2013-11-20',
  'Yisroel', 'טויבא', '32 Wolfe Dr', 'Spring Valley', '10977-5371',
  '(347)907-1651', '(347)907-1643', 'srulyk53@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mordechai', 'Koenig', 'מרדכי קעניג', '2014-01-25',
  'Yitzchok N', 'טראני', '13 Anthony Dr.', 'Spring Valley', '10977',
  '(845)213-0228', '(845)596-3406', 'tullyluxury@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendy', 'Pfeiffer', 'אליעזר מנחם מענדל פייפער', '2014-01-14',
  'Duvid', 'אסתר רחל', '50 Francis Pl Unit 201', 'Monsey', '10952-6617',
  '(347)757-1925', '(347)232-0790', 'esther54268@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Rausman', 'דוד רויזמאן', '2013-12-02',
  'Chaim', 'הענטשא', '7 Dolson Rd.', 'Monsey', '10952-2820',
  '(347)585-1908', '(347)628-7706', 'rausman20c@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Nissan', 'Silber', 'ישעי'' ניסן זילבער', '2013-10-04',
  'Shmiel', 'חנה', '15 Neil Rd. #102', 'Spring Valley', '10977-3898',
  '(845)659-4515', '(845)274-1223', 'shmielsilber@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Spira', 'שמעון שפירא', '2013-12-12',
  'Yosef Chanina', 'ברכה זיסל', '15 Mcnamara Rd', 'Spring Valley', '10977-1404',
  '(845)499-6066', '(845)641-9309', 'yosefspira@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Surkis', 'יעקב סורקיס', '2013-04-19',
  'Avrohom Yida', 'טראני', '38 N. Riguad Rd.', 'Spring Valley', '10977-2547',
  '(845)825-2645', '(845)521-5045', 'aysurkis@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Usher A', 'Ungar', 'אשר אנשיל אונגער', '2013-08-02',
  'Mordechai', 'שינדל גאלדא', '21 Elener Ln #201', 'Spring Valley', '10977-2523',
  '(347)793-9628', '(929)275-2600', 'Mutty197@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eli', 'Weber', 'אלי'' ברוך וועבער', '2013-11-28',
  'Moshe Mordechai', 'זלאטי', '27 Fanley Ave. #101', 'Spring Valley', '10977-3815',
  '(845)641-1588', '(845)263-9696', 'mosheweber1@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Avruhmy', 'Wosner', 'אברהם וואזנער', '2014-05-14',
  'Shimon', 'ברכה יוטא', '27 Hoyt St APT 201', 'Spring Valley', '10977-4832',
  '(845)274-2066', '(845)376-6404', 'Shwosner@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - א';

-- ח - ב (27 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yeshauhi', 'Bayer', 'ישעי'' דוד בייער', '2013-08-29',
  'Yakov Yosef', 'מרים', '9 Elener Ln # 201', 'Spring Valley', '10977-2522',
  '(845)263-4470', '(845)422-7525', 'jandbwholesale@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Beck', 'שמעון בעק', '2013-11-13',
  'Moshe Yakov', 'רויזא בלומא', '15 Sneden Ct Unit 301', 'Spring Valley', '10977-4142',
  '(845)422-0542', '(845)323-8972', 'rbyb2325@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Alexander Zev', 'Braun', 'אלכסנדר זאב ברוין', '2014-01-07',
  'Yom Tov', 'דינה', '21 Widman Ct. Unit 102', 'Spring Valley', '10977-8307',
  '(845)263-2538', '(845)376-4667', '18452632538@email36.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Pinchos', 'Braun', 'פינחס ברוין', '2014-01-12',
  'Yakov Yosef', 'בתי''', '21 Walter Dr.', 'Monsey', '10952-3130',
  '(845)545-7900', '(845)263-2786', 'yaakobbraun@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Zevy', 'Buchinger', 'זאבי בוכינגער', '2013-08-27',
  'Eliezer', 'טראני', '33 S. Cole Ave.', 'Spring Valley', '10977-5413',
  '(845)570-7422', '(845)263-9228', 'eliezerbuchinger@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shabsi Shulem', 'Diamant', 'שבתי שלום דיאמאנט', '2013-04-29',
  'Yosef Chaim', 'צייטל עלקא', '9 Elm St. #412', 'Spring Valley', '10977-8328',
  '(845)517-8676', '(845)213-5481', 'td10952@Gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Einhorn', 'ישראל איינהארן', '2013-06-14',
  'Mordche Yida', 'רבקה', '9 Kaufman Ct #B', 'Monsey', '10952-3344',
  '(845)652-3816', '(845)376-3110', 'myeinhorn@baistrany.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tzvi Elimelech', 'Feldman', 'הערש אלימלך פעלדמאן', '2013-07-12',
  'Yitzchok Yisoscher', 'חנה רבקה', '11 Maple Leaf Rd 202', 'Monsey', '10952-3196',
  '(845)587-9686', '(845)304-4494', 'a8452634321@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmiel Duvid', 'Fischer', 'שמואל דוד הכהן פישער', '2013-08-01',
  'Menachem Yehoshua', 'פראדל', '16 Calvert Drive #201', 'Monsey', '10952-2194',
  '(718)930-2003', '(347)799-4633', 'Fischer.yehoshua@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Frank', 'יצחק הלוי פראנק', '2013-05-14',
  'Yoel', 'ליבא בלומא', '31 North Rigaud Rd.', 'Spring Valley', '10977-2533',
  '(845)213-8823', '(845)502-6737', '4260424@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim Duvid', 'Frieder', 'חיים דוד פריעדער', '2014-01-21',
  'Pinchus', 'יודית', '3 Lane St UNIT 214', 'Monsey', '10952-3286',
  '(845)521-8673', '(845)570-7789', 'pinchasfrieder@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Hershy', 'Frieder', 'הערשי פריעדער', '2013-06-06',
  'Shia', 'פיגא', '15 Bluefield Drive #202', 'Spring Valley', '10977-3367',
  '(347)432-0548', '(845)641-8517', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shulem', 'Green', 'שלום גרין', '2013-10-02',
  'Aron Yonosen', 'חוה', '1-C Milton Place', 'Spring Valley', '10977-3824',
  '(845)494-5333', '(845)709-4920', '4945333@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehoshua', 'Green', 'יושע גרין', '2013-08-16',
  'Yosef', 'ציפורה', '63 Blauvelt Rd #205', 'Monsey', '10952-2187',
  '(845)222-5987', '(845)274-5207', '3977629@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tzvi (hersh Meilech)', 'Grossman', 'הערש אלימלך גרוסמאן', '2014-01-22',
  'Aaron', 'חי'' שרה', '7 First St.', 'Spring Valley', '10977-3814',
  '(845)659-6306', '(845)659-6696', 'arong79@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yaakov Shmiel', 'Hochhauser', 'יעקב שמואל האכהייזער', '2013-10-30',
  'Eli Chaim', 'חנה', '27 Bluefield Dr. Unit 101', 'Spring Valley', '10977-3382',
  '(845)659-0977', '(845)659-0761', '6590977@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Nussy', 'Lunger', 'נתן צבי לונגער', '2014-03-25',
  'Yoel Z', 'חי''', '43 Yale Dr #211', 'Monsey', '10952-2631',
  '(347)742-4562', '(845)422-6451', 'zismanlunger@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aharon', 'Mermelstein', 'אהרן מערמעלשטיין', '2013-08-11',
  'Yakov Tzvi', 'פרידא', '4 Gel Ct', 'Monsey', '10952-1956',
  '(212)933-9773', NULL, 'yanky@yan.ky',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe', 'Moshel', 'משה הערש מאשעל', '2013-05-28',
  'Gavriel Leib', 'בילא אסתר', '11 Elm St. Unit 312', 'Spring Valley', '10977-4508',
  '(845)826-2711', '(347)678-3809', 'gymoshel@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehuda', 'Rottenberg', 'יהודה ראטטענבערג', '2012-12-20',
  'Kloinumus Avraham', 'חנה', '17 Neil Rd.', 'Spring Valley', '10977-3826',
  '(845)596-6441', NULL, 'klonirottenberg@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe Mordechai', 'Tambor', 'משה מרדכי טאמבאר', '2013-12-15',
  'Abraham Yitzchok', 'מרים פרומטשא', '15 Bluefield Dr. #201', 'Spring Valley', '10977-3367',
  '(917)352-1819', '(845)269-0026', 'ayt@atamborcpa.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Tevlovits', 'דוד טעוולאוויטש', '2013-04-17',
  'Yona', 'בת שבע', '48 Calvert Dr. #201', 'Monsey', '10952-3544',
  '(845)538-7139', '(845)300-0636', 'yonitev@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burach', 'Unger', 'ברוך אונגער', '2013-08-20',
  NULL, 'רחל', '137 Route 306 #104', 'Monsey', '10952-2753',
  NULL, '(845)274-4370', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Meir', 'Walter', 'מאיר וואלטער', '2013-11-12',
  'David', 'מרים', '9 Kelly Ct', 'Airmont', '10952-4119',
  '(917)579-8632', '(347)351-7705', 'DWNY@YMAIL.COM',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef Yida', 'Weber', 'יוסף יודא וועבער', '2013-07-01',
  'Binyomin', 'שינא רחל', '20 Merrick Dr', 'Spring Valley', '10977-2501',
  '(845)213-5719', '(845)608-1377', 'BenyominWeber@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Elimelech', 'Wieder', 'אלימלך וויעדער', '2013-11-24',
  'Chaim Amrom', 'ברכי', '3204 Corner St.', 'Spring Valley', '10977',
  '(845)540-3999', '(845)587-0065', 'chiamwieder@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yosef', 'Zabner', 'יוסף מרדכי זאבנער', '2014-03-04',
  'Abraham', 'אסתר', '177 Blauvelt Rd', 'Monsey', '10952-2477',
  '(845)608-9337', '(845)376-5473', '6089337@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ח - ב';

-- ט - א (21 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shimon', 'Appel', 'שמעון אפפעל', '2013-04-05',
  'Hillel', 'פריידא', '30 Calvert Dr Apt 3', 'Monsey', '10952-2136',
  '(845)596-9790', '(845)422-7529', 'fredaappel1@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel', 'Bier', 'שמואל ביער', '2013-01-08',
  'Eliezer', 'דינא בריינא', '16 Calvert Dr # 203', 'Monsey', '10952-2194',
  '(347)675-6814', '(845)538-5659', 'B3476756814@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Braun', 'חיים יששכר דוב  ברוין', '2012-05-11',
  'Arya Mordechai', 'חי'' ברכה', '201 Blauvelt Rd UNIT 218', 'Monsey', '10952-3262',
  '(845)499-7884', '(845)304-3399', 'mochy7884@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yom Tov', 'Eisenbach', 'יום טוב זוסמאן אייזענבאך', '2013-01-21',
  'Yisroel', 'רחל', '6 Sharon Drive', 'Spring Valley', '10977-6029',
  '(845)826-2260', '(845)709-7433', 'yisroeleplanning@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendy', 'Fischer', 'מנחם מענדל פישער', '2012-09-27',
  'Mordechai', 'מרים רבקה', '114 Remsen Ave.', 'Monsey', '10952-2461',
  '(845)222-1830', '(845)721-7493', 'motty@bhlawn.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yisroel', 'Fishman', 'ישראל פישמאן', '2012-12-06',
  'Yosef', 'שרה אסתר', '3 Hopal Ln UNIT 102', 'Monsey', '10952-3268',
  NULL, '(845)517-7128', 'zev371@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Elimelech', 'Friedman', 'אלימלך פריעדמאן', '2012-12-24',
  'Yechezkal Shraga', 'רחל', '116 Grove St. #212', 'Monsey', '10952-3650',
  '(347)276-6131', '(347)564-2554', 'yfriedman@ykop.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yehuda Shmiel', 'Gestetner', 'יהודא שמואל געשטעטנער', '2012-09-27',
  NULL, 'ציפורה לאה', '46 Horton Dr.', 'Monsey', '10952-2851',
  NULL, '(845)269-9136', 'leahgestetner46@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Gold', 'יעקב יוסף גאלד', '2012-06-12',
  'Eluzer', 'חנה', '6 Marman Pl. #201', 'Spring Valley', '10977-3839',
  '(845)517-7100', '(845)659-1382', 'Eli8752@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel', 'Greenwald', 'יחיאל מתותי-הו גרינוואלד', '2012-08-31',
  'Yehoshua', 'אסתר', '197 Saddle River Rd', 'Monsey', '10952-4600',
  '(845)356-5310', NULL, NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mordechai Pinchas', 'Gruber', 'מרדכי פנחס גרובער', '2012-09-25',
  'Yisroel', 'דינה', '29 Park Gardens Ct.', 'Spring Valley', '10977-5937',
  '(845)274-0989', '(845)540-3516', 'gruber0989@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'David', 'Kaufman', 'דוד קויפמאן', '2012-05-24',
  'Shraga Avigdor', 'פערל בלומא', '17 Ellish Pkwy UNIT 201', 'Spring Valley', '10977-3880',
  '(845)323-2363', '(845)502-1013', 'avigdor0277@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Burech', 'Kupperman', 'ברוך קופפערמאן', '2013-02-09',
  'Elchonon', 'פיגא נחמה', '40 Cedar Ln  #115', 'Monsey', '10952-2143',
  '(845)376-5863', NULL, NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tovi', 'Lebron', 'טובי'' יואל לברון', '2012-04-30',
  'Meshilum Zalmon', 'טשארנא בלומא', '1 Clayton Dr', 'Spring Valley', '10977-3302',
  '(845)517-7062', '(845)200-4994', 'zalmen7062@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yechiel', 'Mannes', 'יחיאל מיכל מנס', '2012-11-09',
  'Shloime', 'טראני', '8 Collins Ave. #111', 'Spring Valley', '10977-5881',
  '(845)608-7661', '(845)263-6362', 'mannes0615@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Naftuli', 'Mayteles', 'נפתלי מייטעלעס', '2013-01-06',
  'Yitzchok M', NULL, '8 Horizon Ct. #303', 'Monsey', '10952-7812',
  '(845)596-9829', '(845)274-3267', 'ymayteles@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shloimy', 'Ort', 'שלמה ארט', '2012-12-28',
  'Mattis', 'דבורה', '67 Twin Ave. #211', 'Spring Valley', '10977-4191',
  '(845)213-9096', '(845)499-7849', 'ortmattis@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Reichman', 'יעקב יוסף רייכמאן', '2012-10-30',
  'David Moshe', NULL, '5 Elaine Pl #202', 'Spring Valley', '10977-3995',
  '(347)726-1525', '(347)415-6080', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Eluzer', 'Twersky', 'אלעזר שלום טווערסקי', '2013-04-11',
  'Avrohom Tzvi', 'חנה', '32 Jill Ln.', 'Monsey', '10952-2239',
  '(845)608-9439', '(845)826-6076', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Pinchus', 'Twersky', 'פנחס אליהו טווערסקי', '2013-01-02',
  'Yakov Yosef', 'באשא', '577 Union Rd', 'Spring Valley', '10977-2115',
  '(845)587-0909', '(845)746-1622', 'twersky4680@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel', 'Yankovitch', 'שמואל הכהן יאנקאוויטש', '2012-09-24',
  'Hershy', 'הדסה', '27 Meron Rd', 'Monsey', '10952',
  '(718)598-0109', '(845)274-1958', 'hhyankovitch@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - א';

-- ט - ב (21 students)
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chesky', 'Berger', 'יחזקאל בערגער', '2013-01-05',
  'Chaim', 'לאה', '29 Pennington Way', 'Spring Valley', '10977-1416',
  '(845)494-0257', '(845)521-9784', 'chaimberger92@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moishy', 'Bransdorfer', 'משה בראנדסדארפער', '2012-09-26',
  'Yitzchok', 'טראני', '110 N. Cole Ave. #201', 'Spring Valley', '10977-4361',
  '(845)521-5869', '(845)608-5776', 'yitzchokbransdorfer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Chaim', 'Braun', 'חיים ברוין', '2013-01-09',
  'Mordechai', 'ציפורה', '6 Grandview Ave.', 'Spring Valley', '10977-1626',
  '(845)709-1605', '(845)825-9631', 'mbraun@aviryakov.org',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'David', 'Breuer', 'דוד ברייער', '2013-01-09',
  'Chaim Yida', 'גיטל', '88 West St #301', 'Spring Valley', '10977-3800',
  '(845)642-8892', '(845)587-5394', 'yehudahbreuer@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Moshe Shloime Aorn', 'Eisenbach', 'משה שלמה אהרן אייזענבאך', '2013-01-21',
  'Yisroel', 'רחל', '6 Sharon Drive', 'Spring Valley', '10977-6029',
  '(845)826-2260', '(845)709-7433', 'yisroeleplanning@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Feldman', 'זיידא יעקב פעלדמאן', '2012-12-28',
  'Chanoch Dov', 'דבורה אסתר', '573 Union Rd', 'Spring Valley', '10977-2115',
  '(845)262-9973', '(845)538-7020', 'feldmanhd@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Aron D', 'Fischel', 'אהרן דוד פישעל', '2012-09-08',
  'Moshe Leib', 'בלומי', '81 N Lorna Lane', 'Suffern', '10901-7129',
  '(718)812-7282', '(718)757-8339', 'Mark@handyequip.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Mendy', 'Greenbaum', 'ברוך מנחם מענדל גרינבוים', '2012-12-07',
  'Dov', 'חוה חיילה', '14 Anthony Dr. #211', 'Spring Valley', '10977-3635',
  '(845)213-9667', '(845)274-6355', '2139667@Gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yitzchok', 'Gruenzweig', 'יצחק גרינצווייג', '2013-04-04',
  'Avraham', 'הענצא ברכה', '14 Herrick Ave. #302', 'Spring Valley', '10977-4888',
  '(845)304-4007', '(845)659-0901', 'ag6594733@icloud.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov', 'Hoffman', 'יעקב הלוי האפפמאן', '2012-06-07',
  'Mendy', 'מרים', '4 Hilltop Ln.', 'Monsey', '10952-2525',
  '(845)659-2264', '(917)344-9278', 'hoffmanmendy@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yochonan', 'Katz', 'יוחנן אליעזר כץ', '2013-02-26',
  'Shimshon Hillel', 'רחל זיסל', '36 Fairway Oval', 'Spring Valley', '10977-1723',
  '(718)930-0843', '(347)661-4847', 'shimshy930@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov Yosef', 'Korn', 'יעקב יוסף קארן', '2012-09-25',
  'Aron', 'חיה רחל העניא', '2 Rockingham Rd', 'Spring Valley', '10977-1114',
  '(914)420-8831', '(845)558-2265', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Joseph', 'Lebovitz', 'יוסף אביגדר לעבאוויטש', '2012-04-26',
  'Tzvi', 'שיפי', '39 Paiken Dr. #201', 'Spring Valley', '10977-3846',
  '(845)499-3071', '(845)499-3072', 'hershy73@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menachem', 'Lebron', 'מנחם מאניס זאב לברון', '2012-04-30',
  'Meshilum Zalmon', 'טשארנא בלומא', '1 Clayton Dr', 'Spring Valley', '10977-3302',
  '(845)517-7062', '(845)200-4994', 'zalmen7062@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Isreal', 'Rausman', 'יוסף דוב רויזמאן', '2012-02-23',
  'Chaim', 'הענטשא', '7 Dolson Rd.', 'Monsey', '10952-2820',
  '(347)585-1908', '(347)628-7706', 'rausman20c@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Menasha', 'Schlesinger', 'מנשה שלעזינגער', '2013-02-20',
  'Burech Moshe', 'רויזא', '9 Blueberry Hill Rd # 212', 'Spring Valley', '10977-2546',
  '(845)499-8793', '(845)422-0328', NULL,
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Shmuel', 'Schwartz', 'שמואל בנימין נח הכהן  שווארץ', '2012-12-27',
  'Eli', 'שרה מרים', '111 Union Rd. #203', 'Spring Valley', '10977-3444',
  '(845)538-7943', '(347)534-8131', 'mcs7943@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Duvid', 'Sigall', 'חיים דוד סיגל', '2012-10-29',
  'Lipa', 'שרה מלכה', '119 Horton Dr', 'Monsey', '10952-2858',
  '(845)499-8706', '(845)608-6471', 'lipasigall@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Fishel', 'Sobel', 'פישעל סאבעל', '2012-03-15',
  'Yakov Mayer', 'מירי', '5 Francis Pl Unit 216', 'Monsey', '10952-3563',
  '(917)418-0791', '(347)930-7406', 'jacksobel@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Yakov P', 'Spitzer', 'יעקב פנחס שפיטצער', '2012-11-08',
  'Chananya Dov', 'רעלי', '7 Crown Rd UNIT 203', 'Monsey', '10952-2198',
  '(845)499-7730', '(845)587-3623', 'cds.chayeiolam@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';
INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  'Tzvi', 'Sputz', 'צבי שפוטץ', '2012-08-10',
  'Eliezer', 'טראני', '35 Elener Ln. #202', 'Spring Valley', '10977-2523',
  '(845)263-0902', '(845)263-5825', 'ezsputz@gmail.com',
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = 'ט - ב';

-- ============================================
-- SUMMARY
-- ============================================
-- Total Students: 362
-- Classes:
--   ג - א: 30 students
--   ג - ב: 30 students
--   ד - א: 31 students
--   ד - ב: 32 students
--   ה - א: 27 students
--   ה - ב: 26 students
--   ו - א: 25 students
--   ו - ב: 22 students
--   ז - א: 19 students
--   ז - ב: 22 students
--   ח - א: 29 students
--   ח - ב: 27 students
--   ט - א: 21 students
--   ט - ב: 21 students
-- ============================================
