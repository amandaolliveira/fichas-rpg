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

	card.querySelector(".btn-editar-sessao").addEventListener("click", function () {
		abrirModalSessao(sessao);
	});

	return card;
}

function renderizarSessoes() {
	const container = document.querySelector(".lista-sessoes");
	container.innerHTML = "";

	for (const sessao of sessoes) {
		const coluna = document.createElement("div");
		coluna.className = "col-md-6 col-xl-4";
		coluna.append(criarCardSessao(sessao));
		container.append(coluna);
	}

	document.querySelector(".lista-sessoes-vazia").hidden = sessoes.length > 0;
}

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
