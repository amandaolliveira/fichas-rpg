// HISTÓRICO DE ROLAGENS
// toda rolagem fica guardada. se o agente estiver numa sessão em andamento, a rolagem fica ligada a ela

const MAXIMO_HISTORICO = 30; // guarda só as últimas 30, senão o localStorage enche à toa

const historicoRolagens = [];

const rolagensSalvas = carregarDoStorage(CHAVE_ROLAGENS);
if (rolagensSalvas) {
	for (const rolagem of rolagensSalvas) {
		historicoRolagens.push(rolagem);
	}
}

function salvarHistorico() {
	salvarNoStorage(CHAVE_ROLAGENS, historicoRolagens);
}

// procura uma sessão em andamento de alguma campanha que tenha esse agente
function sessaoAtualDoAgente(agente) {
	if (!agente) {
		return undefined;
	}

	for (const sessao of sessoes) {
		if (sessao.status !== "andamento") {
			continue;
		}
		const campanha = buscarCampanha(sessao.campanhaId);
		if (campanha && campanha.agentes.includes(agente.id)) {
			return sessao;
		}
	}
	return undefined;
}

// chamado pelo rolagem.js toda vez que rola um dado
function registrarRolagem(pericia, rolagem) {
	let nomeAgente = "Sem agente";
	let agenteId = "";
	if (agenteSelecionado) {
		nomeAgente = agenteSelecionado.nomePersonagem;
		agenteId = agenteSelecionado.id;
	}

	let sessaoId = "";
	const sessao = sessaoAtualDoAgente(agenteSelecionado);
	if (sessao) {
		sessaoId = sessao.id;
	}

	// unshift coloca no começo da lista, assim a mais nova fica em cima
	historicoRolagens.unshift({
		pericia: pericia,
		agente: nomeAgente,
		agenteId: agenteId,
		resultado: rolagem.resultado,
		valores: rolagem.valores,
		sessaoId: sessaoId,
		data: Date.now(),
	});

	// passou do limite? tira as mais velhas do final
	if (historicoRolagens.length > MAXIMO_HISTORICO) {
		historicoRolagens.length = MAXIMO_HISTORICO;
	}

	salvarHistorico();
	renderizarHistorico();
}

// quantas rolagens aconteceram numa sessão
function contarRolagensDaSessao(sessaoId) {
	let total = 0;
	for (const rolagem of historicoRolagens) {
		if (rolagem.sessaoId === sessaoId) {
			total++;
		}
	}
	return total;
}

function renderizarHistorico() {
	const lista = document.querySelector(".historico-rolagens");
	lista.innerHTML = "";

	for (const rolagem of historicoRolagens) {
		const item = document.createElement("li");
		item.className = "list-group-item d-flex justify-content-between align-items-center gap-3";

		const texto = document.createElement("div");

		const titulo = document.createElement("span");
		titulo.textContent = rolagem.agente + " · " + rolagem.pericia;

		// embaixo: a hora, os dados que caíram e a sessão (se tiver)
		const detalhe = document.createElement("small");
		detalhe.className = "d-block text-body-secondary font-monospace";
		let textoDetalhe = new Date(rolagem.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
		textoDetalhe += " · [" + rolagem.valores.join(", ") + "]";
		const sessao = buscarSessao(rolagem.sessaoId);
		if (sessao) {
			textoDetalhe += " · " + sessao.titulo;
		}
		detalhe.textContent = textoDetalhe;

		texto.append(titulo, detalhe);

		const resultado = document.createElement("span");
		resultado.className = "historico-resultado";
		resultado.textContent = rolagem.resultado;
		// 20 natural é crítico e 1 é desastre, o css pinta cada um de uma cor
		if (rolagem.resultado === 20) {
			resultado.classList.add("critico");
		} else if (rolagem.resultado === 1) {
			resultado.classList.add("desastre");
		}

		item.append(texto, resultado);
		lista.append(item);
	}

	document.querySelector(".historico-vazio").hidden = historicoRolagens.length > 0;
	document.querySelector(".btn-limpar-historico").hidden = historicoRolagens.length === 0;
}

document.querySelector(".btn-limpar-historico").addEventListener("click", function () {
	historicoRolagens.length = 0;
	salvarHistorico();
	renderizarHistorico();
	mostrarAviso("Histórico de rolagens apagado.", "info");
});
