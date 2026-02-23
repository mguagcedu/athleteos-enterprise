const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'athleteos.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach',
  avatar TEXT,
  org_name TEXT DEFAULT 'Central Youth Sports',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  age_group TEXT,
  season TEXT,
  coach_id INTEGER REFERENCES users(id),
  color TEXT DEFAULT '#0ea5e9',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT,
  jersey_number TEXT,
  position TEXT,
  team_id INTEGER REFERENCES teams(id),
  status TEXT DEFAULT 'active',
  avatar TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  notes TEXT,
  member_since TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  signed_at TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'practice',
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  facility_id INTEGER REFERENCES facilities(id),
  team_id INTEGER REFERENCES teams(id),
  opponent TEXT,
  notes TEXT,
  notify_parents INTEGER DEFAULT 1,
  require_rsvp INTEGER DEFAULT 0,
  repeat_rule TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  capacity INTEGER,
  description TEXT,
  status TEXT DEFAULT 'available',
  maintenance_note TEXT,
  maintenance_return TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER REFERENCES facilities(id),
  event_id INTEGER REFERENCES events(id),
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  booked_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  player_id INTEGER REFERENCES players(id),
  family_name TEXT,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  order_type TEXT DEFAULT 'dues',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  receipt_sent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  unit_price REAL DEFAULT 0,
  sizes TEXT,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER REFERENCES users(id),
  sender_name TEXT,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  type TEXT DEFAULT 'direct',
  team_id INTEGER REFERENCES teams(id),
  unread_count INTEGER DEFAULT 0,
  last_message TEXT,
  last_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT DEFAULT 'all',
  team_id INTEGER REFERENCES teams(id),
  priority TEXT DEFAULT 'normal',
  pinned INTEGER DEFAULT 0,
  author_id INTEGER REFERENCES users(id),
  author_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_docs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_name TEXT,
  signed_at TEXT,
  expires_at TEXT,
  status TEXT DEFAULT 'missing',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coach_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id),
  author_name TEXT,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ── Seed ───────────────────────────────────────────────────────────────────

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const hash = bcrypt.hashSync('demo1234', 10);

  // Users
  const insertUser = db.prepare(`INSERT INTO users (name,email,password,role,avatar) VALUES (?,?,?,?,?)`);
  const u1 = insertUser.run('Alex Rivera','alex@demo.com',hash,'admin','https://i.pravatar.cc/150?img=11').lastInsertRowid;
  const u2 = insertUser.run('Mike Chen','mike@demo.com',hash,'coach','https://i.pravatar.cc/150?img=52').lastInsertRowid;
  const u3 = insertUser.run('Sarah Torres','sarah@demo.com',hash,'coach','https://i.pravatar.cc/150?img=47').lastInsertRowid;

  // Teams
  const insertTeam = db.prepare(`INSERT INTO teams (name,sport,age_group,season,coach_id,color) VALUES (?,?,?,?,?,?)`);
  const t1 = insertTeam.run('Varsity Soccer','Soccer','U14','Spring 2024',u2,'#0ea5e9').lastInsertRowid;
  const t2 = insertTeam.run('JV Soccer','Soccer','U12','Spring 2024',u3,'#8b5cf6').lastInsertRowid;
  const t3 = insertTeam.run('U12 Basketball','Basketball','U12','Spring 2024',u2,'#f59e0b').lastInsertRowid;
  const t4 = insertTeam.run('U10 Soccer','Soccer','U10','Spring 2024',u3,'#10b981').lastInsertRowid;

  // Facilities
  const insertFac = db.prepare(`INSERT INTO facilities (name,type,capacity,description,status) VALUES (?,?,?,?,?)`);
  const f1 = insertFac.run('Field A — Central Park','outdoor_field',120,'Full-size grass field','available').lastInsertRowid;
  const f2 = insertFac.run('Field B — Central Park','outdoor_field',60,'Half-size turf field','available').lastInsertRowid;
  const f3 = insertFac.run('Main Gymnasium','indoor_court',80,'Indoor basketball / volleyball court','in_use').lastInsertRowid;
  const f4 = insertFac.run('Aquatic Center','pool',40,'Olympic pool + lanes','maintenance').lastInsertRowid;
  db.prepare(`UPDATE facilities SET maintenance_note=?,maintenance_return=? WHERE id=?`)
    .run('Pump system repair in progress','2024-02-28',f4);
  const f5 = insertFac.run('Conference Room A','meeting_room',30,'Meeting space with AV equipment','available').lastInsertRowid;
  const f6 = insertFac.run('North Park Field','outdoor_field',100,'Outdoor multi-use field','available').lastInsertRowid;

  // Players
  const insertPlayer = db.prepare(`INSERT INTO players (first_name,last_name,dob,jersey_number,position,team_id,status,avatar,parent_name,parent_email,parent_phone,member_since) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const players = [
    ['Marcus','Johnson','2011-03-12','7','Midfielder',t1,'active','https://i.pravatar.cc/150?img=12','David Johnson','d.johnson@email.com','555-012-3456','2022-09'],
    ['Jamal','Wilson','2010-07-04','11','Forward',t1,'active','https://i.pravatar.cc/150?img=32','Sarah Wilson','s.wilson@email.com','555-234-5678','2023-01'],
    ['Sarah','Chen','2011-11-02','3','Goalkeeper',t2,'active','https://i.pravatar.cc/150?img=45','Wei Chen','w.chen@email.com','555-345-6789','2022-09'],
    ['Tyler','Brooks','2011-05-18','24','Point Guard',t3,'active','https://i.pravatar.cc/150?img=20','James Brooks','j.brooks@email.com','555-456-7890','2023-09'],
    ['Emma','Rodriguez','2013-09-09','5','Winger',t4,'active','https://i.pravatar.cc/150?img=33','Carlos Rodriguez','c.rodriguez@email.com','555-567-8901','2023-01'],
    ['Liam','Carter','2010-01-15','9','Striker',t1,'active','https://i.pravatar.cc/150?img=55','Anna Carter','a.carter@email.com','555-678-9012','2021-09'],
    ['Noah','Davis','2011-08-22','15','Defender',t2,'inactive','https://i.pravatar.cc/150?img=60','Mark Davis','m.davis@email.com','555-789-0123','2022-01'],
    ['Ava','Martinez','2012-04-30',null,null,t3,'waitlist','https://i.pravatar.cc/150?img=17','Lisa Martinez','l.martinez@email.com','555-890-1234','2024-01'],
    ['Sofia','Nguyen','2012-06-14','2','Midfielder',t2,'active','https://i.pravatar.cc/150?img=25','Hoa Nguyen','h.nguyen@email.com','555-901-2345','2023-09'],
    ['Ethan','Kim','2013-12-03','8','Winger',t4,'active','https://i.pravatar.cc/150?img=15','Ji Kim','ji.kim@email.com','555-012-3457','2024-01'],
  ];
  const pids = players.map(p => insertPlayer.run(...p).lastInsertRowid);

  // Forms for each player
  const insertForm = db.prepare(`INSERT INTO player_forms (player_id,form_type,signed_at,status) VALUES (?,?,?,?)`);
  const forms = ['registration','medical','photo_release'];
  pids.forEach((pid, i) => {
    forms.forEach(ft => {
      const signed = (i !== 6 && !(i === 4 && ft === 'registration'));
      insertForm.run(pid, ft, signed ? '2024-01-28' : null, signed ? 'complete' : 'missing');
    });
  });

  // Compliance docs
  const insertDoc = db.prepare(`INSERT INTO compliance_docs (player_id,doc_type,file_name,signed_at,status) VALUES (?,?,?,?,?)`);
  pids.forEach((pid, i) => {
    insertDoc.run(pid,'registration_form','registration.pdf','2024-01-28',i===6?'missing':'complete');
    insertDoc.run(pid,'medical_form','medical.pdf','2024-01-28',i===6?'missing':'complete');
    insertDoc.run(pid,'photo_release','photo_release.pdf','2024-01-28',i===6?'missing':'complete');
  });

  // Coach notes
  const insertNote = db.prepare(`INSERT INTO coach_notes (player_id,author_id,author_name,body,created_at) VALUES (?,?,?,?,?)`);
  insertNote.run(pids[0],u2,'Coach Chen','Strong performance in last scrimmage. Work on left-foot passing accuracy. Ready for starting position consideration.','2024-02-18');
  insertNote.run(pids[0],u1,'Coach Rivera','Good attitude and coachability. Encourage more vocal leadership on field.','2024-01-30');
  insertNote.run(pids[1],u2,'Coach Chen','Excellent acceleration. Needs to improve off-ball movement.','2024-02-15');
  insertNote.run(pids[2],u3,'Coach Torres','Commanding in the box. Work on distribution from back.','2024-02-10');

  // Events
  const insertEvent = db.prepare(`INSERT INTO events (title,event_type,date,start_time,end_time,facility_id,team_id,opponent,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  insertEvent.run('Varsity Practice','practice','2024-02-23','16:00','18:00',f1,t1,null,'Pre-game warmup focus',u2);
  insertEvent.run('Parent Meeting','meeting','2024-02-23','18:30','20:00',f5,null,null,'Spring season overview',u1);
  insertEvent.run('JV Practice','practice','2024-02-19','15:00','17:00',f2,t2,null,null,u3);
  insertEvent.run('U12 Game vs Riverside','game','2024-02-24','09:00','11:00',f1,t3,'Riverside FC','Home game',u2);
  insertEvent.run('Varsity Game vs Northside','game','2024-02-24','12:00','14:00',f1,t1,'Northside United','Away game',u2);
  insertEvent.run('Basketball Camp','camp','2024-02-20','16:00','18:00',f3,t3,null,'Open to all ages',u1);
  insertEvent.run('U10 Practice','practice','2024-02-21','16:00','17:30',f2,t4,null,null,u3);
  insertEvent.run('Varsity Practice','practice','2024-02-26','16:00','18:00',f1,t1,null,null,u2);
  insertEvent.run('Forms Deadline','other','2024-02-28',null,null,null,null,null,'All outstanding forms due',u1);

  // Bookings
  const insertBooking = db.prepare(`INSERT INTO bookings (facility_id,date,start_time,end_time,booked_by) VALUES (?,?,?,?,?)`);
  insertBooking.run(f1,'2024-02-23','16:00','18:00',u2);
  insertBooking.run(f5,'2024-02-23','18:30','20:00',u1);
  insertBooking.run(f3,'2024-02-20','16:00','18:00',u1);

  // Orders
  const insertOrder = db.prepare(`INSERT INTO orders (order_number,player_id,family_name,description,amount,order_type,status,payment_method,paid_at) VALUES (?,?,?,?,?,?,?,?,?)`);
  insertOrder.run('#12847',pids[4],'Thompson Family','Spring Dues — Soccer',250,'dues','paid','card','2024-02-23');
  insertOrder.run('#12846',pids[0],'Johnson Family','Game Jersey + Shorts',62,'store','pending',null,null);
  insertOrder.run('#12845',pids[4],'Rodriguez Family','Spring Registration × 2',500,'registration','paid','card','2024-02-20');
  insertOrder.run('#12844',pids[6],'Davis Family','Spring Dues — Basketball',400,'dues','overdue',null,null);
  insertOrder.run('#12843',pids[3],'Brooks Family','Water Bottle + Bag',45,'store','paid','cash','2024-02-19');
  insertOrder.run('#12842',pids[5],'Carter Family','Spring Dues — Soccer',250,'dues','refunded','card',null);
  insertOrder.run('#12841',pids[1],'Wilson Family','Spring Dues — Soccer',250,'dues','paid','venmo','2024-02-18');
  insertOrder.run('#12840',pids[2],'Chen Family','Spring Dues — Soccer',250,'dues','overdue',null,null);
  insertOrder.run('#12839',pids[8],'Nguyen Family','Uniform Package',85,'store','paid','card','2024-02-17');
  insertOrder.run('#12838',pids[9],'Kim Family','Spring Registration',250,'registration','pending',null,null);

  // Inventory
  const insertInv = db.prepare(`INSERT INTO inventory (name,sku,category,quantity,low_stock_threshold,unit_price,sizes,location) VALUES (?,?,?,?,?,?,?,?)`);
  insertInv.run('Game Jersey — Home','JRY-HM-001','uniforms',45,10,32.00,'XS,S,M,L,XL','Equipment Room A');
  insertInv.run('Game Jersey — Away','JRY-AW-001','uniforms',8,10,32.00,'S,M,L','Equipment Room A');
  insertInv.run('Training Shorts','SHT-TRN-001','uniforms',30,10,18.00,'XS,S,M,L,XL','Equipment Room A');
  insertInv.run('Soccer Balls (Size 5)','BALL-SC5-001','equipment',24,6,25.00,null,'Storage Room');
  insertInv.run('Basketball (Size 6)','BALL-BK6-001','equipment',12,4,30.00,null,'Gymnasium Storage');
  insertInv.run('Training Cones (Set of 20)','CONE-TRN-001','equipment',15,3,12.00,null,'Storage Room');
  insertInv.run('First Aid Kit','FAK-STD-001','safety',4,2,45.00,null,'Office');
  insertInv.run('AED Defibrillator','AED-001','safety',2,1,1200.00,null,'Main Office');
  insertInv.run('Water Bottles — Team','WBT-TM-001','accessories',60,15,8.00,null,'Equipment Room B');
  insertInv.run('Drawstring Bags','BAG-DS-001','accessories',3,10,12.00,null,'Equipment Room B');
  insertInv.run('Goalkeeper Gloves','GK-GLV-001','equipment',6,3,28.00,'S,M,L','Equipment Room A');

  // Conversations + Messages
  const insertConv = db.prepare(`INSERT INTO conversations (name,type,team_id,last_message,last_at) VALUES (?,?,?,?,?)`);
  const c1 = insertConv.run('Varsity Soccer Team','team',t1,'See everyone at 4pm sharp!','2024-02-23 10:15').lastInsertRowid;
  const c2 = insertConv.run('Spring Parents Group','group',null,'Reminder — forms due Feb 28','2024-02-23 09:00').lastInsertRowid;
  const c3 = insertConv.run('Coaching Staff','group',null,"I'll cover warmups",'2024-02-22 14:30').lastInsertRowid;

  const insertMsg = db.prepare(`INSERT INTO messages (conversation_id,sender_id,sender_name,body,created_at) VALUES (?,?,?,?,?)`);
  insertMsg.run(c1,u2,'Coach Chen','Good morning team! Practice is on for 4pm today at Field A. Please arrive 10 minutes early.','2024-02-23 09:02');
  insertMsg.run(c1,u2,'Coach Chen','Also — please make sure everyone has their forms submitted by end of day.','2024-02-23 09:03');
  insertMsg.run(c1,u1,'Alex Rivera','See everyone at 4pm sharp! Weather looks great for practice.','2024-02-23 10:15');
  insertMsg.run(c2,u1,'Alex Rivera','Reminder — all outstanding forms must be submitted by Feb 28. Check your email for links.','2024-02-23 09:00');
  insertMsg.run(c3,u3,'Sarah Torres',"I'll cover warmups on Friday — Coach Chen will be 10 min late.",'2024-02-22 14:30');
  insertMsg.run(c3,u2,'Mike Chen','Thanks Sarah, appreciate it!','2024-02-22 14:45');

  // Announcements
  const insertAnn = db.prepare(`INSERT INTO announcements (title,body,audience,priority,pinned,author_id,author_name,created_at) VALUES (?,?,?,?,?,?,?,?)`);
  insertAnn.run('Spring 2024 Season Kickoff!','We are thrilled to announce the start of our Spring 2024 season. All teams begin practice this week. Please ensure all registration forms and payments are complete before the first game.','all','high',1,u1,'Alex Rivera','2024-02-01');
  insertAnn.run('Form Submission Deadline — Feb 28','All player registration, medical, and photo release forms must be submitted by February 28th. Players with missing forms will not be cleared to participate.','all','high',1,u1,'Alex Rivera','2024-02-15');
  insertAnn.run('Aquatic Center Temporarily Closed','The Aquatic Center will be closed for pump system maintenance until approximately February 28th. We apologize for any inconvenience.','all','normal',0,u1,'Alex Rivera','2024-02-20');
  insertAnn.run('Varsity Game This Saturday!','Our Varsity Soccer team takes on Northside United this Saturday at 12:00 PM. Come out and support your team!','all','normal',0,u2,'Coach Chen','2024-02-22');
  insertAnn.run('Coaching Staff Volunteers Needed','We are looking for 2 volunteer assistant coaches for U10 and U12 teams. Please contact Alex Rivera if interested.','all','normal',0,u1,'Alex Rivera','2024-02-10');

  console.log('✅ Database seeded successfully');
}

seed();

module.exports = db;
