// AGENTES
// lista de agentes, os cards e quem tá selecionado

// dados de exemplo enquanto não tem localStorage, depois isso sai
const agentes = [];
for (let n = 1; n <= 4; n++) {
	agentes.push(
		new Agente({
			nomePersonagem: "Placeholder " + n,
			nomeJogador: "Jogador " + n,
			vida: { atual: 17 - n * 3, maximo: 17 },
			sanidade: { atual: 16 - n * 2, maximo: 16 },
			esforco: { atual: 5 - n, maximo: 4 },
		}),
	);
}
agenteSelecionado = agentes[0];

// quanto da barra fica pintado. se o máximo for 0 a conta ia dividir por zero, então já volta 0 direto
function calcularPorcentagem(recurso) {
	if (recurso.maximo === 0) {
		return 0;
	}
	const porcentagem = Math.round((recurso.atual / recurso.maximo) * 100);
	// curou acima do máximo? a barra não passa de 100%, senão vaza do card
	return Math.min(porcentagem, 100);
}

function preencherBarra(barra, recurso) {
	barra.textContent = recurso.atual + " / " + recurso.maximo;
	// o css lê esse --preenchimento pra saber até onde pintar a barra
	barra.style.setProperty("--preenchimento", calcularPorcentagem(recurso) + "%");
}

// usa o template pra criar o card de um agente
function criarCardAgente(agente) {
	const modeloAgente = document.getElementById("modelo-agente");
	const card = modeloAgente.content.firstElementChild.cloneNode(true);

	card.dataset.id = agente.id;
	card.querySelector("img").alt = "Foto de " + agente.nomePersonagem;
	card.querySelector(".agente-nome").textContent = agente.nomePersonagem;

	for (const badge of card.querySelectorAll(".atributo")) {
		const atributo = badge.dataset.atributo;
		badge.textContent = atributo + " " + agente.atributos[atributo];
	}

	preencherBarra(card.querySelector(".barra-vida"), agente.vida);
	preencherBarra(card.querySelector(".barra-sanidade"), agente.sanidade);
	preencherBarra(card.querySelector(".barra-esforco"), agente.esforco);
	card.querySelector(".agente-defesa").textContent = agente.defesa;

	if (agente === agenteSelecionado) {
		card.classList.add("selecionado");
	}

	// cada card ganha os próprios cliques, e a função lembra de qual agente ela é (closure, se quiser pesquisar o nome chique)
	card.querySelector(".btn-editar-agente").addEventListener("click", function () {
		selecionarAgente(agente);
	});

	card.querySelector(".btn-excluir-agente").addEventListener("click", function () {
		excluirAgente(agente);
	});

	return card;
}

function renderizarAgentes() {
	const container = document.querySelector(".lista-agentes");
	container.innerHTML = "";

	for (const agente of agentes) {
		const card = criarCardAgente(agente);

		// clicar em qualquer lugar do card troca o agente atual
		card.addEventListener("click", function (evento) {
			// se o clique foi no Editar ou no Excluir, eles já cuidam do resto (sem isso, excluir ia selecionar o agente que acabou de sumir)
			if (evento.target.closest("a, button")) {
				return;
			}
			selecionarAgente(agente);
		});

		const coluna = document.createElement("div");
		coluna.className = "col-6 col-md-4 col-xl-3";
		coluna.append(card);
		container.append(coluna);
	}

	// o "nenhum agente" só aparece se a lista estiver vazia
	document.querySelector(".lista-agentes-vazia").hidden = agentes.length > 0;
}

function renderizarCardDados() {
	const container = document.querySelector(".agente-dados");
	const vazio = document.querySelector(".agente-dados-vazio");
	container.innerHTML = "";

	if (!agenteSelecionado) {
		vazio.hidden = false;
		return;
	}

	vazio.hidden = true;
	const card = criarCardAgente(agenteSelecionado);
	card.classList.remove("selecionado");
	// na seção de dados não faz sentido excluir, então tira o botão. e como só tem ele ali, não precisa da borda de selecionado
	card.querySelector(".btn-excluir-agente").remove();
	container.append(card);
}

function selecionarAgente(agente) {
	agenteSelecionado = agente;
	renderizarAgentes();
	renderizarCardDados();
}

function excluirAgente(agente) {
	// confirm é aquela caixinha feia do navegador, mas funciona e devolve true/false
	if (!confirm("Excluir " + agente.nomePersonagem + "? Isso não pode ser desfeito.")) {
		return;
	}

	const indice = agentes.indexOf(agente);
	if (indice !== -1) {
		agentes.splice(indice, 1);
	}

	// tira o agente das campanhas também, senão elas ficam contando gente que não existe mais
	for (const campanha of campanhas) {
		const idsQueSobraram = [];
		for (const id of campanha.agentes) {
			if (id !== agente.id) {
				idsQueSobraram.push(id);
			}
		}
		campanha.agentes = idsQueSobraram;
	}

	if (agenteSelecionado === agente) {
		agenteSelecionado = agentes[0];
	}

	renderizarAgentes();
	renderizarCardDados();
	renderizarCampanhas();
}

// sem agente selecionado a ficha abre vazia, pronta pra criar um novo
document.querySelector(".btn-novo-agente").addEventListener("click", function () {
	selecionarAgente(undefined);
});
