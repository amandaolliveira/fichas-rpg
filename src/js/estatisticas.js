// ESTATÍSTICAS

// quantos agentes não estão em nenhuma campanha
function contarAgentesSemCampanha() {
	let total = 0;
	for (const agente of agentes) {
		let estaEmAlguma = false;
		for (const campanha of campanhas) {
			if (campanha.agentes.includes(agente.id)) {
				estaEmAlguma = true;
				break;
			}
		}
		if (!estaEmAlguma) {
			total++;
		}
	}
	return total;
}

// média de agentes por campanha
function mediaAgentesPorCampanha() {
	if (campanhas.length === 0) {
		return 0;
	}
	let soma = 0;
	for (const campanha of campanhas) {
		soma += campanha.agentes.length;
	}
	return Math.round((soma / campanhas.length) * 10) / 10;
}

// média da vida atual em porcentagem
function vidaMediaDosAgentes() {
	let soma = 0;
	let contados = 0;
	for (const agente of agentes) {
		if (agente.vida.maximo > 0) {
			// curou acima do máximo conta como 100%, igual a barra do card
			soma += Math.min(agente.vida.atual / agente.vida.maximo, 1);
			contados++;
		}
	}
	if (contados === 0) {
		return 0;
	}
	return Math.round((soma / contados) * 100);
}

// a campanha mais recente criada
function campanhaMaisRecente() {
	let recente = undefined;
	for (const campanha of campanhas) {
		if (!recente || campanha.criadoEm > recente.criadoEm) {
			recente = campanha;
		}
	}
	return recente;
}

// quantas sessões tem com esse status
function contarSessoesPorStatus(status) {
	let total = 0;
	for (const sessao of sessoes) {
		if (sessao.status === status) {
			total++;
		}
	}
	return total;
}

// a sessão agendada mais perto de hoje (as que já passaram não contam)
function proximaSessao() {
	const hoje = hojeTexto();
	let proxima = undefined;
	for (const sessao of sessoes) {
		if (sessao.status !== "agendada" || sessao.data < hoje) {
			continue;
		}
		if (!proxima || sessao.data < proxima.data) {
			proxima = sessao;
		}
	}
	return proxima;
}

// rolagem que deu 20 natural
function contarCriticos() {
	let total = 0;
	for (const rolagem of historicoRolagens) {
		if (rolagem.resultado === 20) {
			total++;
		}
	}
	return total;
}

function renderizarEstatisticas() {
	document.getElementById("estat-agentes").textContent = agentes.length;
	document.getElementById("estat-campanhas").textContent = campanhas.length;
	document.getElementById("estat-sem-campanha").textContent = contarAgentesSemCampanha();
	document.getElementById("estat-media-agentes").textContent = mediaAgentesPorCampanha().toLocaleString("pt-BR");
	document.getElementById("estat-vida-media").textContent = vidaMediaDosAgentes() + "%";

	const recente = campanhaMaisRecente();
	if (recente) {
		const data = new Date(recente.criadoEm).toLocaleDateString("pt-BR");
		document.getElementById("estat-recente").textContent = recente.nome + " (" + data + ")";
	} else {
		document.getElementById("estat-recente").textContent = "-";
	}

	document.getElementById("estat-sessoes-agendadas").textContent = contarSessoesPorStatus("agendada");
	document.getElementById("estat-sessoes-concluidas").textContent = contarSessoesPorStatus("concluida");
	document.getElementById("estat-rolagens").textContent = historicoRolagens.length + " / " + contarCriticos();

	const proxima = proximaSessao();
	if (proxima) {
		document.getElementById("estat-proxima-sessao").textContent = proxima.titulo + " (" + formatarDataSessao(proxima.data) + ")";
	} else {
		document.getElementById("estat-proxima-sessao").textContent = "-";
	}
}
