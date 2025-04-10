const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const app = express();
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./db.sqlite");

app.listen(8080, () => {
  console.log("🚀 Servidor rodando na porta 8080");
});

// Verifica e ajusta a tabela Tarefas para incluir criado_em
db.serialize(() => {
  db.all(`PRAGMA table_info(Tarefas)`, (err, columns) => {
    if (err) return console.error("Erro ao verificar colunas:", err.message);

    const tabelaExiste = columns.length > 0;
    const temColunaCriadoEm = columns.some(col => col.name === "criado_em");

    if (!tabelaExiste) {
      db.run(`
        CREATE TABLE Tarefas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tarefa VARCHAR(50) NOT NULL,
          categoria VARCHAR(50),
          criado_em TEXT DEFAULT (datetime('now', 'localtime'))
        )
      `, (err) => {
        if (err) return console.error("Erro ao criar tabela:", err.message);
        console.log("✅ Tabela criada com 'criado_em'");
      });
    } else if (!temColunaCriadoEm) {
      console.log("ℹ️ Coluna 'criado_em' não encontrada. Atualizando tabela...");

      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS Tarefas_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tarefa VARCHAR(50) NOT NULL,
            categoria VARCHAR(50),
            criado_em TEXT DEFAULT (datetime('now', 'localtime'))
          )
        `, (err) => {
          if (err) return console.error("Erro ao criar tabela temporária:", err.message);

          db.run(`
            INSERT INTO Tarefas_temp (id, tarefa, categoria)
            SELECT id, tarefa, categoria FROM Tarefas
          `, (err) => {
            if (err) return console.error("Erro ao copiar dados:", err.message);

            db.run(`DROP TABLE Tarefas`, (err) => {
              if (err) return console.error("Erro ao remover tabela antiga:", err.message);

              db.run(`ALTER TABLE Tarefas_temp RENAME TO Tarefas`, (err) => {
                if (err) return console.error("Erro ao renomear tabela:", err.message);
                console.log("✅ Coluna 'criado_em' adicionada com sucesso!");
              });
            });
          });
        });
      });
    } else {
      console.log("✅ Tabela já contém a coluna 'criado_em'");
    }
  });
});

// Rotas
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
        console.error(err);
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
