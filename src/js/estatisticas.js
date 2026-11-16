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
}
