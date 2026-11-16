// CAMPANHAS
// lista de campanhas e a tela de detalhes


const campanhas = [];

// mesmo esquema dos agentes: se tem salvo usa, senão começa com a de teste
const campanhasSalvas = carregarDoStorage(CHAVE_CAMPANHAS);
if (campanhasSalvas) {
	for (const dados of campanhasSalvas) {
		campanhas.push(Campanha.storageParaJSON(dados));
	}
} else {
	campanhas.push(
		new Campanha({
			nome: "One-shot de Teste",
			descricao: "Campanha sem imagem e sem agentes, pra testar os valores padrão.",
			mestre: "Jogador 1",
		}),
	);
}

function salvarCampanhas() {
	salvarNoStorage(CHAVE_CAMPANHAS, campanhas);
}

// procura o agente pelo id, se não achar devolve undefined
function buscarAgente(id) {
	for (const agente of agentes) {
		if (agente.id === id) {
			return agente;
		}
	}
	return undefined;
}

function buscarCampanha(id) {
	for (const campanha of campanhas) {
		if (campanha.id === id) {
			return campanha;
		}
	}
	return undefined;
}

function formatarCriadoEm(timestamp) {
	return "Criado em " + new Date(timestamp).toLocaleDateString("pt-BR");
}

function formatarQuantidadeAgentes(quantidade) {
	if (quantidade === 1) {
		return "1 agente";
	}
	return quantidade + " agentes";
}

// usa o template para criar um card pra cada campanha
function renderizarCampanhas() {
	const modeloCampanha = document.getElementById("modelo-campanha");
	const container = document.querySelector(".lista-campanhas");
	container.innerHTML = ""; // limpa antes de desenhar de novo

	for (const campanha of campanhas) {
		const card = modeloCampanha.content.firstElementChild.cloneNode(true);

		card.querySelector(".card-campanha").dataset.id = campanha.id;

		const imagem = card.querySelector("img");
		imagem.src = campanha.imagem;
		imagem.alt = "Imagem da campanha " + campanha.nome;

		card.querySelector(".campanha-nome").textContent = campanha.nome;
		card.querySelector(".campanha-descricao").textContent = campanha.descricao;
		card.querySelector(".campanha-info").textContent = "Mestre: " + campanha.mestre + " - " + formatarQuantidadeAgentes(campanha.agentes.length);
		card.querySelector(".campanha-criado").textContent = formatarCriadoEm(campanha.criadoEm);

		container.append(card);
	}
}

// preenche a seção #campanha com os dados da campanha escolhida
function renderizarDetalheCampanha(campanha) {
	const secao = document.getElementById("campanha");

	const imagem = secao.querySelector(".detalhe-campanha-imagem");
	imagem.src = campanha.imagem;
	imagem.alt = "Imagem da campanha " + campanha.nome;

	secao.querySelector(".detalhe-campanha-nome").textContent = campanha.nome;
	secao.querySelector(".detalhe-campanha-mestre").textContent = campanha.mestre;
	secao.querySelector(".detalhe-campanha-criado").textContent = formatarCriadoEm(campanha.criadoEm);
	secao.querySelector(".detalhe-campanha-descricao").textContent = campanha.descricao;
	document.querySelector(".excluir-campanha-nome").textContent = campanha.nome; // nome no modal de exclusão

	// troca os ids pelos agentes de verdade (ignora id que não existir mais)
	const lista = secao.querySelector(".detalhe-campanha-agentes");
	lista.innerHTML = "";

	for (const id of campanha.agentes) {
		const agente = buscarAgente(id);
		if (!agente) {
			continue;
		}

		const item = document.createElement("li");
		item.className = "list-group-item d-flex justify-content-between";

		const personagem = document.createElement("span");
		personagem.textContent = agente.nomePersonagem;

		const jogador = document.createElement("small");
		jogador.className = "text-body-secondary";
		jogador.textContent = agente.nomeJogador;

		item.append(personagem, jogador);
		lista.append(item);
	}

	if (lista.children.length === 0) {
		const vazio = document.createElement("li");
		vazio.className = "list-group-item text-body-secondary";
		vazio.textContent = "Nenhum agente nesta campanha.";
		lista.append(vazio);
	}
}

// o card é um link pra #campanha, então aqui só guarda qual foi clicada antes do hashchange
document.querySelector(".lista-campanhas").addEventListener("click", function (evento) {
	const card = evento.target.closest(".card-campanha");
	if (!card) {
		return;
	}

	campanhaSelecionada = buscarCampanha(card.dataset.id);
	renderizarDetalheCampanha(campanhaSelecionada);
});
