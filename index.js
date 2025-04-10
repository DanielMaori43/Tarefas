const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const db = new sqlite3.Database("./db.sqlite");

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.listen(8080, () => {
  console.log("🚀 Servidor rodando na porta 8080");
});

// Verifica se a coluna criado_em existe e adiciona, se necessário
db.all(`PRAGMA table_info(Tarefas)`, (err, columns) => {
  if (err) return console.error("Erro ao verificar colunas:", err.message);

  const existeCriadoEm = columns.some(col => col.name === "criado_em");

  if (!existeCriadoEm) {
    db.run(`ALTER TABLE Tarefas ADD COLUMN criado_em TEXT DEFAULT (datetime('now', 'localtime'))`, (err) => {
      if (err) {
        console.error("Erro ao adicionar coluna criado_em:", err.message);
      } else {
        console.log("✅ Coluna criado_em adicionada com sucesso.");
      }
    });
  }
});

// Cria tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS Tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarefa TEXT NOT NULL,
    categoria TEXT,
    criado_em TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

app.get("/tarefas", (req, res) => {
  db.all(`SELECT * FROM Tarefas ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao buscar tarefas" });
    }
    res.json(rows);
  });
});

app.post("/tarefa", (req, res) => {
  const { tarefa, categoria } = req.body;

  if (!tarefa || !categoria) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  db.run(
    `INSERT INTO Tarefas (tarefa, categoria) VALUES (?, ?)`,
    [tarefa, categoria],
    function (err) {
      if (err) {
        console.error("Erro ao salvar tarefa:", err.message);
        return res.status(500).json({ erro: "Erro ao salvar tarefa" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.delete("/tarefa/:id", (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM Tarefas WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao excluir tarefa" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ erro: "Tarefa não encontrada" });
    }

    res.json({ sucesso: true });
  });
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint de ping
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "Pong" });
});

// Ping automático para manter o Render acordado
setInterval(() => {
  axios
    .get("https://tarefas-4hbd.onrender.com/ping")
    .then(() => console.log("🔁 Ping enviado com sucesso"))
    .catch((err) => console.log("Erro ao enviar ping:", err.message));
}, 30 * 60 * 1000); // A cada 30 minutos
