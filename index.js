const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const db = new sqlite3.Database("./db.sqlite");
const cron = required("node-cron")
const nodefetch = required("node-fetch")
const url = 'https://tarefas-4hbd.onrender.com/home'
app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Porta dinâmica para Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Verifica e adiciona a coluna criado_em se necessário
db.serialize(() => {
  db.all(`PRAGMA table_info(Tarefas)`, (err, columns) => {
    if (err) return console.error("Erro ao verificar colunas:", err.message);

    const existeCriadoEm = columns.some(col => col.name === "criado_em");

    if (!existeCriadoEm) {
      db.run(`ALTER TABLE Tarefas ADD COLUMN criado_em TEXT`, (err) => {
        if (err) console.error("Erro ao adicionar coluna criado_em:", err.message);
        else console.log("✅ Coluna criado_em adicionada.");
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS Tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarefa VARCHAR(50) NOT NULL,
      categoria VARCHAR(50),
      criado_em TEXT
    )
  `);
});

// Endpoint para buscar todas as tarefas
app.get("/tarefas", (req, res) => {
  db.all(`SELECT * FROM Tarefas ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar tarefas" });
    res.json(rows);
  });
});

// Endpoint para adicionar nova tarefa com data de criação
app.post("/tarefa", (req, res) => {
  const { tarefa, categoria } = req.body;
  if (!tarefa || !categoria) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  // Horário de criação no formato ISO (sem ajustar o fuso manualmente)
  const criado_em = new Date().toISOString();

  db.run(
    `INSERT INTO Tarefas (tarefa, categoria, criado_em) VALUES (?, ?, ?)`,
    [tarefa, categoria, criado_em],
    function (err) {
      if (err) return res.status(500).json({ erro: "Erro ao salvar tarefa" });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Excluir tarefa
app.delete("/tarefa/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM Tarefas WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ erro: "Erro ao excluir tarefa" });
    if (this.changes === 0) return res.status(404).json({ erro: "Tarefa não encontrada" });
    res.json({ sucesso: true });
  });
});

// Serve o HTML
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint de ping
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "Pong" });
});

cron.schedule('*/14 * * * *', async () =>{
    const res = await fetch(url);
    const status =- res.status; 
}
  )
