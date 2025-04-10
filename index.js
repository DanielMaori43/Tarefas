const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
const axios = require("axios"); // Importando o axios
const app = express();
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true })); // ✅ Corrigido
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database("./db.sqlite");

app.listen(8080, () => {
  console.log("O servidor está aberto na porta 8080");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Tarefas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarefa VARCHAR(50) NOT NULL,
    categoria VARCHAR(50)
  )`);
});

app.get("/tarefas", (req, res) => {
  db.all(`SELECT * FROM Tarefas`, [], (err, rows) => {
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
      res.status(201).json({ id: this.lastID }); // ✅ Retorna ID da tarefa criada
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

// Ping para manter o servidor ativo
setInterval(() => {
  axios.get('https://seu-endereco-de-api') // Endereço da sua API
    .then(response => {
      console.log('Ping enviado com sucesso!');
    })
    .catch(error => {
      console.log('Erro ao enviar o ping:', error);
    });
}, 30 * 60 * 1000); // A cada 30 minutos (em milissegundos)
