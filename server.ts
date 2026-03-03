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
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    phone TEXT,
    class_id INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(id)
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
    effort BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (year_id) REFERENCES years(id)
  );

  CREATE TABLE IF NOT EXISTS color_thresholds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    min_amount REAL NOT NULL,
    color TEXT NOT NULL
  );
`);

// Migrations: Add columns if they don't exist (for existing databases)
try {
  const studentsInfo = db.prepare("PRAGMA table_info(students)").all() as any[];
  if (!studentsInfo.find(col => col.name === 'class_id')) {
    db.exec("ALTER TABLE students ADD COLUMN class_id INTEGER REFERENCES classes(id)");
  }
} catch (e) {
  console.log("Migration for students table skipped or failed:", e);
}

try {
  const collectionsInfo = db.prepare("PRAGMA table_info(collections)").all() as any[];
  if (!collectionsInfo.find(col => col.name === 'effort')) {
    db.exec("ALTER TABLE collections ADD COLUMN effort BOOLEAN DEFAULT 0");
  }
} catch (e) {
  console.log("Migration for collections table skipped or failed:", e);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/years", (req, res) => {
    const years = db.prepare("SELECT * FROM years ORDER BY hebrew_year DESC").all();
    res.json(years);
  });

  app.post("/api/years", (req, res) => {
    const { hebrew_year } = req.body;
    try {
      db.prepare("INSERT INTO years (hebrew_year) VALUES (?)").run(hebrew_year);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/years/:id", (req, res) => {
    const { id } = req.params;
    try {
      // Check if year is used in collections
      const used = db.prepare("SELECT COUNT(*) as count FROM collections WHERE year_id = ?").get(id) as { count: number };
      if (used.count > 0) {
        return res.status(400).json({ error: "לא ניתן למחוק שנה שיש לה רשומות גבייה" });
      }
      db.prepare("DELETE FROM years WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/students", (req, res) => {
    const students = db.prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.last_name, s.first_name
    `).all();
    res.json(students);
  });

  app.post("/api/students", (req, res) => {
    const { id, last_name, first_name, phone, class_id } = req.body;
    try {
      db.prepare("INSERT INTO students (id, last_name, first_name, phone, class_id) VALUES (?, ?, ?, ?, ?)")
        .run(id, last_name, first_name, phone, class_id);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/classes", (req, res) => {
    const classes = db.prepare("SELECT * FROM classes ORDER BY name ASC").all();
    res.json(classes);
  });

  app.post("/api/classes", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO classes (name) VALUES (?)").run(name);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/classes/:id", (req, res) => {
    const { id } = req.params;
    try {
      const used = db.prepare("SELECT COUNT(*) as count FROM students WHERE class_id = ?").get(id) as { count: number };
      if (used.count > 0) {
        return res.status(400).json({ error: "לא ניתן למחוק שיעור המשויך לתלמידים" });
      }
      db.prepare("DELETE FROM classes WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/color-thresholds", (req, res) => {
    const thresholds = db.prepare("SELECT * FROM color_thresholds ORDER BY min_amount ASC").all();
    res.json(thresholds);
  });

  app.post("/api/color-thresholds", (req, res) => {
    const { min_amount, color } = req.body;
    try {
      db.prepare("INSERT INTO color_thresholds (min_amount, color) VALUES (?, ?)").run(min_amount, color);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/color-thresholds/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM color_thresholds WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/collections", (req, res) => {
    const collections = db.prepare(`
      SELECT c.*, s.first_name, s.last_name, s.class_id, cl.name as class_name, y.hebrew_year 
      FROM collections c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      JOIN years y ON c.year_id = y.id
      ORDER BY c.created_at ASC
    `).all();
    res.json(collections);
  });

  app.post("/api/collections", (req, res) => {
    const { student_id, year_id, amount, effort } = req.body;
    try {
      db.prepare("INSERT INTO collections (student_id, year_id, amount, effort) VALUES (?, ?, ?, ?)")
        .run(student_id, year_id, amount, effort ? 1 : 0);
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
