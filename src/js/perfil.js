// PERFIL
// o nome do jogador fica salvo, e as abas mostram o que é dele (compara pelo nome do jogador da ficha e pelo mestre da campanha)

const formPerfil = document.getElementById("form-perfil");

function nomeDoPerfil() {
	return localStorage.getItem(CHAVE_PERFIL) || "";
}

// compara sem ligar pra maiúscula e espaço sobrando ("carlos " é igual a "Carlos")
function mesmoNome(nomeA, nomeB) {
	return nomeA.trim().toLowerCase() === nomeB.trim().toLowerCase();
}

function meusAgentes(nome) {
	const lista = [];
	for (const agente of agentes) {
		if (mesmoNome(agente.nomeJogador, nome)) {
			lista.push(agente);
		}
	}
	return lista;
}

// campanhas que têm pelo menos um agente meu
function minhasCampanhas(nome) {
	const meus = meusAgentes(nome);
	const lista = [];
	for (const campanha of campanhas) {
		for (const agente of meus) {
			if (campanha.agentes.includes(agente.id)) {
				lista.push(campanha);
				break; // já achou um, não precisa olhar os outros agentes
			}
		}
	}
	return lista;
}

function campanhasQueMestro(nome) {
	const lista = [];
	for (const campanha of campanhas) {
		if (mesmoNome(campanha.mestre, nome)) {
			lista.push(campanha);
		}
	}
	return lista;
}

// monta uma lista simples: texto principal na esquerda e um detalhe pequeno na direita
function preencherListaPerfil(seletor, itens, textoVazio) {
	const lista = document.querySelector(seletor);
	lista.innerHTML = "";

	for (const item of itens) {
		const li = document.createElement("li");
		li.className = "list-group-item d-flex justify-content-between gap-2";

		const principal = document.createElement("span");
		principal.textContent = item.principal;

		const detalhe = document.createElement("small");
		detalhe.className = "text-body-secondary";
		detalhe.textContent = item.detalhe;

		li.append(principal, detalhe);
		lista.append(li);
	}

	if (itens.length === 0) {
		const vazio = document.createElement("li");
		vazio.className = "list-group-item text-body-secondary";
		vazio.textContent = textoVazio;
		lista.append(vazio);
	}
}

function renderizarPerfil() {
	const nome = nomeDoPerfil();
	formPerfil.elements.nomeJogador.value = nome;

	// sem nome não tem como saber o que é seu, então esconde as abas
	document.querySelector(".perfil-conteudo").hidden = nome === "";
	document.querySelector(".perfil-sem-nome").hidden = nome !== "";
	if (nome === "") {
		return;
	}

	document.querySelector(".perfil-ola").textContent = "Olá, " + nome + "!";

	const itensAgentes = [];
	for (const agente of meusAgentes(nome)) {
		itensAgentes.push({ principal: agente.nomePersonagem, detalhe: "Vida " + agente.vida.atual + "/" + agente.vida.maximo });
	}

	const itensCampanhas = [];
	for (const campanha of minhasCampanhas(nome)) {
		itensCampanhas.push({ principal: campanha.nome, detalhe: "Mestre: " + campanha.mestre });
	}

	const itensMestre = [];
	for (const campanha of campanhasQueMestro(nome)) {
		itensMestre.push({ principal: campanha.nome, detalhe: sessoesDaCampanha(campanha.id).length + " sessões" });
	}

	preencherListaPerfil(".perfil-agentes", itensAgentes, "Nenhum agente com o seu nome de jogador.");
	preencherListaPerfil(".perfil-campanhas", itensCampanhas, "Nenhum agente seu está em campanha.");
	preencherListaPerfil(".perfil-mestre", itensMestre, "Você não mestra nenhuma campanha.");

	// o número do lado do nome de cada aba
	document.querySelector(".contador-agentes").textContent = itensAgentes.length;
	document.querySelector(".contador-campanhas").textContent = itensCampanhas.length;
	document.querySelector(".contador-mestre").textContent = itensMestre.length;
}

formPerfil.addEventListener("submit", function (evento) {
	evento.preventDefault();

	const campo = formPerfil.elements.nomeJogador;
	const nome = campo.value.trim();

	if (nome === "") {
		campo.classList.add("is-invalid");
		return;
	}

	campo.classList.remove("is-invalid");
	localStorage.setItem(CHAVE_PERFIL, nome);
	renderizarPerfil();
	mostrarAviso("Perfil salvo.");
});
