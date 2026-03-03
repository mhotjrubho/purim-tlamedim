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
