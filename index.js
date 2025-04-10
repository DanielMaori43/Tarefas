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
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database("./db.sqlite");

// Verifica e adiciona a coluna criado_em se não existir
db.serialize(() => {
  db.get("PRAGMA table_info(Tarefas)", (err, info) => {
    if (err) {
      console.error("Erro ao verificar tabela:", err);
      return;
    }

    db.all("PRAGMA table_info(Tarefas)", (err, columns) => {
      const temCriadoEm = columns.some(col => col.name === "criado_em");

      if (!temCriadoEm) {
        db.run(`ALTER TABLE Tarefas ADD COLUMN criado_em DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
          if (err) {
            console.error("Erro ao adicionar coluna criado_em:", err.message);
          } else {
            console.log("Coluna criado_em adicionada com sucesso.");
          }
        });
      }
    });
  });
});

app.listen(8080, () => {
  console.log("O servidor está aberto na porta 8080");
});

// Retorna todas as tarefas
app.get("/tarefas", (req, res) => {
  db.all(`SELECT * FROM Tarefas ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao buscar tarefas" });
    }
    res.json(rows);
  });
});

// Cria nova tarefa
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

// Exclui tarefa
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

// Serve a página principal
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint para manter ativo no Render
app.get('/ping', (req, res) => {
  res.status(200).json({ message: "Pong" });
});

// Envia ping a cada 30 minutos
setInterval(() => {
  axios.get('https://tarefas-4hbd.onrender.com/ping')
    .then(() => {
      console.log('Ping enviado com sucesso!');
    })
    .catch(error => {
      console.log('Erro ao enviar o ping:', error.message);
    });
}, 30 * 60 * 1000); // 30 minutos
