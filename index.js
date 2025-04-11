async function baixarTarefas() {
  try {
    const resposta = await fetch(`${API_URL}/tarefas`);
    const tarefas = await resposta.json();

    const ol = document.getElementById("listaDeTarefas");
    ol.innerHTML = "";

    tarefas.forEach((item) => {
      const li = document.createElement("li");

      let dataFormatada = "Data não disponível";
      if (item.criado_em) {
        try {
          // Se a data vier no formato ISO (ex: 2025-04-10T21:10:00), isso funciona
          const dataUTC = new Date(item.criado_em);
          if (!isNaN(dataUTC.getTime())) {
            const dataBrasilia = new Date(dataUTC.getTime() - 3 * 60 * 60 * 1000);
            dataFormatada = dataBrasilia.toLocaleString("pt-BR");
          }
        } catch (e) {
          console.warn("Data inválida:", item.criado_em);
        }
      }

      li.innerHTML = `
        <div class="tarefa-topo">
          ${item.categoria === "casa" ? "🏠" : "💻"}
          <button onclick="excluirTarefa(${item.id})">Excluir</button>
        </div>
        <span>${item.tarefa}</span>
        <small>🕒 ${dataFormatada}</small>
      `;

      ol.appendChild(li);
    });
  } catch (err) {
    console.error("Erro ao buscar tarefas:", err);
  }
}
