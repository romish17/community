require("dotenv").config();

const path = require("path");
const bcrypt = require("bcryptjs");
const express = require("express");
const session = require("express-session");
const { connectWithRetry, getPool } = require("./db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  return next();
}

app.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/dashboard");
  }
  return res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("login", { error: "Merci de renseigner email et mot de passe." });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT id, password_hash FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.render("login", { error: "Identifiants invalides." });
    }
    const user = rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.render("login", { error: "Identifiants invalides." });
    }

    req.session.userId = user.id;
    return res.redirect("/dashboard");
  } catch (error) {
    return res.render("login", { error: "Erreur serveur, veuillez réessayer." });
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render("register", { error: "Tous les champs sont obligatoires." });
  }

  try {
    const pool = getPool();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.render("register", { error: "Cet email est déjà utilisé." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    req.session.userId = result.insertId;
    return res.redirect("/dashboard");
  } catch (error) {
    return res.render("register", { error: "Erreur serveur, veuillez réessayer." });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/dashboard", requireAuth, async (req, res) => {
  const pool = getPool();
  const [cards] = await pool.query(
    "SELECT id, title, content, created_at FROM cards WHERE user_id = ? ORDER BY created_at DESC",
    [req.session.userId]
  );
  res.render("dashboard", { cards });
});

app.post("/cards", requireAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.redirect("/dashboard");
  }

  const pool = getPool();
  await pool.query("INSERT INTO cards (user_id, title, content) VALUES (?, ?, ?)", [
    req.session.userId,
    title,
    content,
  ]);

  return res.redirect("/dashboard");
});

const port = process.env.PORT || 3000;

connectWithRetry()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database", error);
    process.exit(1);
  });
