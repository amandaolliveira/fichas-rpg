// SESSÕES
// cada sessão (dia de jogo) é de uma campanha

const sessoes = [];

// mesmo esquema dos agentes e campanhas. aqui não tem sessão de exemplo, começa vazio
const sessoesSalvas = carregarDoStorage(CHAVE_SESSOES);
if (sessoesSalvas) {
	for (const dados of sessoesSalvas) {
		sessoes.push(Sessao.storageParaJSON(dados));
	}
}

function salvarSessoes() {
	salvarNoStorage(CHAVE_SESSOES, sessoes);
}

function buscarSessao(id) {
	for (const sessao of sessoes) {
		if (sessao.id === id) {
			return sessao;
		}
	}
	return undefined;
}

// todas as sessões de uma campanha
function sessoesDaCampanha(campanhaId) {
	const lista = [];
	for (const sessao of sessoes) {
		if (sessao.campanhaId === campanhaId) {
			lista.push(sessao);
		}
	}
	return lista;
}

// data de hoje no mesmo formato do input date ("AAAA-MM-DD"), assim dá pra comparar texto com texto
function hojeTexto() {
	const hoje = new Date();
	const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // getMonth começa no 0, por isso o +1
	const dia = String(hoje.getDate()).padStart(2, "0");
	return hoje.getFullYear() + "-" + mes + "-" + dia;
}

function formatarDataSessao(data) {
	return new Date(data).toLocaleDateString("pt-BR");
}

// LISTA

function criarCardSessao(sessao) {
	const modeloSessao = document.getElementById("modelo-sessao");
	const card = modeloSessao.content.firstElementChild.cloneNode(true);

	card.dataset.id = sessao.id;
	card.querySelector(".sessao-titulo").textContent = sessao.titulo;

	const badge = card.querySelector(".status-sessao");
	badge.textContent = STATUS_SESSAO[sessao.status];
	badge.classList.add("status-" + sessao.status); // o css escolhe a cor pela classe

	let nomeCampanha = "Campanha não encontrada";
	const campanha = buscarCampanha(sessao.campanhaId);
	if (campanha) {
		nomeCampanha = campanha.nome;
	}
	card.querySelector(".sessao-info").textContent = nomeCampanha + " - " + formatarDataSessao(sessao.data);
	card.querySelector(".sessao-anotacoes").textContent = sessao.anotacoes;

	// cada status mostra só os botões que fazem sentido pra ele
	const agendada = sessao.status === "agendada";
	const emAndamento = sessao.status === "andamento";
	card.querySelector(".btn-comecar-sessao").hidden = !agendada;
	card.querySelector(".btn-cancelar-sessao").hidden = !agendada;
	card.querySelector(".btn-concluir-sessao").hidden = !emAndamento;
	card.querySelector(".btn-editar-sessao").hidden = !agendada && !emAndamento; // concluída e cancelada não editam mais

	card.querySelector(".btn-comecar-sessao").addEventListener("click", function () {
		mudarStatusSessao(sessao, "andamento");
	});

	card.querySelector(".btn-concluir-sessao").addEventListener("click", function () {
		mudarStatusSessao(sessao, "concluida");
	});

	card.querySelector(".btn-cancelar-sessao").addEventListener("click", function () {
		mudarStatusSessao(sessao, "cancelada");
	});

	card.querySelector(".btn-editar-sessao").addEventListener("click", function () {
		abrirModalSessao(sessao);
	});

	card.querySelector(".btn-excluir-sessao").addEventListener("click", function () {
		excluirSessao(sessao);
	});

	return card;
}

// PESQUISA, FILTROS E ORDENAÇÃO

// devolve só as sessões que passam em todos os filtros ao mesmo tempo
function filtrarSessoes() {
	const busca = document.querySelector(".filtro-busca-sessao").value.trim().toLowerCase();
	const status = document.querySelector(".filtro-status-sessao").value;
	const campanhaId = document.querySelector(".filtro-campanha-sessao").value;

	const lista = [];
	for (const sessao of sessoes) {
		// toLowerCase nos dois lados pra pesquisa não ligar pra maiúscula
		const texto = (sessao.titulo + " " + sessao.anotacoes).toLowerCase();

		// o continue pula pra próxima sessão sem colocar essa na lista
		if (busca !== "" && !texto.includes(busca)) {
			continue;
		}
		if (status !== "" && sessao.status !== status) {
			continue;
		}
		if (campanhaId !== "" && sessao.campanhaId !== campanhaId) {
			continue;
		}

		lista.push(sessao);
	}
	return lista;
}

// o sort usa uma função que compara dois itens: negativo = a vem antes, positivo = b vem antes
// a data tá em "AAAA-MM-DD", então comparar como texto já dá a ordem certa
function ordenarSessoes(lista) {
	const ordem = document.querySelector(".ordem-sessao").value;

	lista.sort(function (a, b) {
		if (ordem === "titulo") {
			return a.titulo.localeCompare(b.titulo, "pt-BR");
		}
		if (ordem === "data-desc") {
			return b.data.localeCompare(a.data);
		}
		return a.data.localeCompare(b.data);
	});

	return lista;
}

// as campanhas podem ter mudado desde a última vez, então monta o select de novo sem perder o que tava escolhido
function atualizarFiltroCampanhas() {
	const select = document.querySelector(".filtro-campanha-sessao");
	const escolhida = select.value;

	preencherSelectCampanhas(select, "Todas as campanhas");
	select.value = escolhida;

	// se a campanha escolhida foi excluída, volta pra "todas"
	if (select.selectedIndex === -1) {
		select.selectedIndex = 0;
	}
}

function renderizarSessoes() {
	const container = document.querySelector(".lista-sessoes");
	container.innerHTML = "";

	atualizarFiltroCampanhas();
	const lista = ordenarSessoes(filtrarSessoes());

	for (const sessao of lista) {
		const coluna = document.createElement("div");
		coluna.className = "col-md-6 col-xl-4";
		coluna.append(criarCardSessao(sessao));
		container.append(coluna);
	}

	// mensagem diferente se não tem sessão nenhuma ou se foi o filtro que escondeu tudo
	const vazio = document.querySelector(".lista-sessoes-vazia");
	if (sessoes.length === 0) {
		vazio.textContent = "Nenhuma sessão por aqui.";
	} else {
		vazio.textContent = "Nenhuma sessão encontrada com esses filtros.";
	}
	vazio.hidden = lista.length > 0;
}

// qualquer mudança na pesquisa ou nos selects desenha a lista de novo
document.querySelector(".filtro-busca-sessao").addEventListener("input", renderizarSessoes);
document.querySelector(".filtro-status-sessao").addEventListener("change", renderizarSessoes);
document.querySelector(".filtro-campanha-sessao").addEventListener("change", renderizarSessoes);
document.querySelector(".ordem-sessao").addEventListener("change", renderizarSessoes);

// FORMULÁRIO (modal)

const formSessao = document.getElementById("form-sessao");
const modalSessao = document.getElementById("modal-sessao");
let sessaoEmEdicao = undefined; // undefined = criando uma nova, igual o campanhaEmEdicao do wizard

// coloca uma opção pra cada campanha no select. o primeiro texto muda dependendo de onde usa
function preencherSelectCampanhas(select, textoPrimeiraOpcao) {
	select.innerHTML = "";

	const primeira = document.createElement("option");
	primeira.value = "";
	primeira.textContent = textoPrimeiraOpcao;
	select.append(primeira);

	for (const campanha of campanhas) {
		const opcao = document.createElement("option");
		opcao.value = campanha.id;
		opcao.textContent = campanha.nome;
		select.append(opcao);
	}
}

function abrirModalSessao(sessao) {
	sessaoEmEdicao = sessao;
	formSessao.reset();
	for (const campo of formSessao.querySelectorAll(".is-invalid")) {
		campo.classList.remove("is-invalid");
	}

	const campos = formSessao.elements;
	preencherSelectCampanhas(campos.campanhaId, "Escolha uma campanha");

	if (sessao) {
		modalSessao.querySelector(".modal-title").textContent = "Editar sessão";
		campos.titulo.value = sessao.titulo;
		campos.campanhaId.value = sessao.campanhaId;
		campos.data.value = sessao.data;
		campos.anotacoes.value = sessao.anotacoes;
	} else {
		modalSessao.querySelector(".modal-title").textContent = "Nova sessão";
	}

	// sessão que já começou não pode trocar de campanha nem de data
	const jaComecou = sessao !== undefined && sessao.status === "andamento";
	campos.campanhaId.disabled = jaComecou;
	campos.data.disabled = jaComecou;

	bootstrap.Modal.getOrCreateInstance(modalSessao).show();
}

// required do html + a regra de não agendar no passado
function sessaoValida() {
	let valido = true;

	for (const campo of formSessao.querySelectorAll("input, select, textarea")) {
		if (campo.checkValidity()) {
			campo.classList.remove("is-invalid");
		} else {
			campo.classList.add("is-invalid");
			valido = false;
		}
	}

	const campoData = formSessao.elements.data;
	const erroData = formSessao.querySelector(".erro-data");
	erroData.textContent = "Escolha a data da sessão.";

	// só sessão agendada tem essa regra, uma que já aconteceu pode ter data no passado
	let status = "agendada";
	if (sessaoEmEdicao) {
		status = sessaoEmEdicao.status;
	}

	if (campoData.value !== "" && status === "agendada" && campoData.value < hojeTexto()) {
		campoData.classList.add("is-invalid");
		erroData.textContent = "Essa data já passou, escolha hoje ou uma data depois.";
		valido = false;
	}

	return valido;
}

formSessao.addEventListener("input", function (evento) {
	evento.target.classList.remove("is-invalid");
});

formSessao.addEventListener("submit", function (evento) {
	evento.preventDefault();

	if (!sessaoValida()) {
		return;
	}

	const campos = formSessao.elements;
	const dados = {
		titulo: campos.titulo.value.trim(),
		campanhaId: campos.campanhaId.value,
		data: campos.data.value,
		anotacoes: campos.anotacoes.value.trim(),
	};

	if (sessaoEmEdicao) {
		sessaoEmEdicao.titulo = dados.titulo;
		sessaoEmEdicao.campanhaId = dados.campanhaId;
		sessaoEmEdicao.data = dados.data;
		sessaoEmEdicao.anotacoes = dados.anotacoes;
		mostrarAviso('"' + dados.titulo + '" foi salva.');
	} else {
		sessoes.push(new Sessao(dados));
		mostrarAviso('"' + dados.titulo + '" foi agendada.');
	}

	salvarSessoes();
	renderizarSessoes();
	bootstrap.Modal.getInstance(modalSessao).hide();
});

// sem campanha não tem como ter sessão
document.querySelector(".btn-nova-sessao").addEventListener("click", function () {
	if (campanhas.length === 0) {
		mostrarAviso("Crie uma campanha antes de agendar uma sessão.", "warning");
		return;
	}
	abrirModalSessao(undefined);
});

// EXCLUIR SESSÃO (mesmo esquema do agente: o botão abre o modal, o modal exclui)

const modalExcluirSessao = document.getElementById("modal-excluir-sessao");
let sessaoParaExcluir = undefined;

function excluirSessao(sessao) {
	sessaoParaExcluir = sessao;
	modalExcluirSessao.querySelector(".excluir-sessao-nome").textContent = sessao.titulo;
	bootstrap.Modal.getOrCreateInstance(modalExcluirSessao).show();
}

modalExcluirSessao.querySelector(".btn-confirmar-exclusao-sessao").addEventListener("click", function () {
	const indice = sessoes.indexOf(sessaoParaExcluir);
	if (indice !== -1) {
		sessoes.splice(indice, 1);
	}
	salvarSessoes();

	bootstrap.Modal.getInstance(modalExcluirSessao).hide();
	mostrarAviso('"' + sessaoParaExcluir.titulo + '" foi excluída.', "info");
	sessaoParaExcluir = undefined;
	renderizarSessoes();
});

// quando uma campanha é excluída, as sessões dela não têm mais pra onde apontar, então vão junto
function excluirSessoesDaCampanha(campanhaId) {
	const sobraram = [];
	for (const sessao of sessoes) {
		if (sessao.campanhaId !== campanhaId) {
			sobraram.push(sessao);
		}
	}

	// esvazia a lista e coloca de volta só as que sobraram (a lista é const, então não dá pra fazer sessoes = sobraram)
	sessoes.length = 0;
	for (const sessao of sobraram) {
		sessoes.push(sessao);
	}
	salvarSessoes();
}

// STATUS DA SESSÃO
// o caminho é: agendada -> em andamento -> concluída. ou então agendada -> cancelada

// a sessão que está rolando agora nessa campanha (se tiver)
function sessaoEmAndamento(campanhaId) {
	for (const sessao of sessoes) {
		if (sessao.campanhaId === campanhaId && sessao.status === "andamento") {
			return sessao;
		}
	}
	return undefined;
}

function mudarStatusSessao(sessao, novoStatus) {
	// não deixa pular etapa: começar e cancelar só se tiver agendada, concluir só se tiver em andamento
	if ((novoStatus === "andamento" || novoStatus === "cancelada") && sessao.status !== "agendada") {
		return;
	}
	if (novoStatus === "concluida" && sessao.status !== "andamento") {
		return;
	}

	if (novoStatus === "andamento") {
		// regra 1: sem agente na campanha não tem quem jogar
		const campanha = buscarCampanha(sessao.campanhaId);
		if (!campanha || campanha.agentes.length === 0) {
			mostrarAviso("A campanha precisa ter pelo menos um agente pra sessão começar.", "warning");
			return;
		}

		// regra 2: só uma sessão em andamento por campanha
		const outra = sessaoEmAndamento(sessao.campanhaId);
		if (outra) {
			mostrarAviso('"' + outra.titulo + '" ainda está em andamento nessa campanha, conclua ela primeiro.', "warning");
			return;
		}

		// se começou antes do dia marcado, a data passa a ser hoje
		sessao.data = hojeTexto();
	}

	sessao.status = novoStatus;
	salvarSessoes();
	renderizarSessoes();

	if (novoStatus === "andamento") {
		mostrarAviso('"' + sessao.titulo + '" começou. Bom jogo!');
	} else if (novoStatus === "concluida") {
		mostrarAviso('"' + sessao.titulo + '" foi concluída.');
	} else {
		mostrarAviso('"' + sessao.titulo + '" foi cancelada.', "info");
	}
}
