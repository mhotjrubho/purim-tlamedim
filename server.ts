import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("purim_collection.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    phone TEXT,
    class TEXT
  );

  CREATE TABLE IF NOT EXISTS years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hebrew_year TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    year_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (year_id) REFERENCES years(id)
  );
`);

// Helper to convert number to Hebrew year (simplified for 5782-5832 range)
function getHebrewYear(year: number) {
  const units = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];
  
  let result = "ת"; // All years in this range start with 5000 (ה' אלפים) which is omitted or represented by ת (400) + ש (300) = 700? 
  // Actually 5782: 5000 is usually omitted. 700 is תש. 80 is פ. 2 is ב.
  // So 5782 -> תשפ"ב
  
  const yearInCentury = year % 1000; // e.g. 782
  const h = Math.floor(yearInCentury / 100); // 7
  const t = Math.floor((yearInCentury % 100) / 10); // 8
  const u = yearInCentury % 10; // 2

  let hStr = "";
  if (h === 7) hStr = "תש";
  else if (h === 8) hStr = "תת";
  
  let tStr = tens[t];
  let uStr = units[u];

  // Special cases for 15 (ט"ו) and 16 (ט"ז)
  if (t === 1 && (u === 5 || u === 6)) {
    tStr = "ט";
    uStr = u === 5 ? "ו" : "ז";
  }

  let final = hStr + tStr + uStr;
  // Add gershayim before last letter
  if (final.length > 1) {
    final = final.slice(0, -1) + '"' + final.slice(-1);
  } else {
    final = final + "'";
  }
  
  return final;
}

// Populate years if empty
const yearCount = db.prepare("SELECT COUNT(*) as count FROM years").get() as { count: number };
if (yearCount.count === 0) {
  const insertYear = db.prepare("INSERT INTO years (hebrew_year) VALUES (?)");
  for (let i = 0; i < 50; i++) {
    insertYear.run(getHebrewYear(5782 + i));
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/years", (req, res) => {
    const years = db.prepare("SELECT * FROM years ORDER BY id ASC").all();
    res.json(years);
  });

  app.get("/api/students", (req, res) => {
    const students = db.prepare("SELECT * FROM students ORDER BY last_name, first_name").all();
    res.json(students);
  });

  app.post("/api/students", (req, res) => {
    const { id, last_name, first_name, phone, class: shiur } = req.body;
    try {
      db.prepare("INSERT INTO students (id, last_name, first_name, phone, class) VALUES (?, ?, ?, ?, ?)")
        .run(id, last_name, first_name, phone, shiur);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/collections", (req, res) => {
    const collections = db.prepare(`
      SELECT c.*, s.first_name, s.last_name, s.class, y.hebrew_year 
      FROM collections c
      JOIN students s ON c.student_id = s.id
      JOIN years y ON c.year_id = y.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(collections);
  });

  app.post("/api/collections", (req, res) => {
    const { student_id, year_id, amount } = req.body;
    try {
      db.prepare("INSERT INTO collections (student_id, year_id, amount) VALUES (?, ?, ?)")
        .run(student_id, year_id, amount);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
