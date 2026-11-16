// WIZARD DE CAMPANHA (criar e editar)
// os 4 passos pra criar ou editar uma campanha, e o excluir também

const formCampanha = document.getElementById("form-campanha");
const TOTAL_PASSOS = 4;

// troca os textos do wizard e pra onde o Cancelar volta, conforme está criando ou editando
function configurarModoWizard() {
	const secao = document.getElementById("wizard-campanha");
	const titulo = secao.querySelector(".wizard-titulo");
	const subtitulo = secao.querySelector(".wizard-subtitulo");
	const botaoCriar = formCampanha.querySelector(".wizard-criar");
	const botaoCancelar = formCampanha.querySelector(".wizard-cancelar");

	if (campanhaEmEdicao) {
		titulo.textContent = "Editar campanha";
		subtitulo.textContent = "Altere o que precisar e salve no último passo.";
		botaoCriar.textContent = "Salvar alterações";
		botaoCancelar.href = "#campanha";
	} else {
		titulo.textContent = "Nova campanha";
		subtitulo.textContent = "Preencha os passos para criar a campanha.";
		botaoCriar.textContent = "Criar campanha";
		botaoCancelar.href = "#campanhas";
	}
}

function fieldsetDoPasso(n) {
	return formCampanha.querySelector('.passo-wizard[data-passo="' + n + '"]');
}

// mostra só o fieldset do passo n, atualiza o indicador e quais botões aparecem
function mostrarPasso(n) {
	passoAtual = n;

	for (const fieldset of formCampanha.querySelectorAll(".passo-wizard")) {
		fieldset.hidden = Number(fieldset.dataset.passo) !== n;
	}

	// os passos de antes ficam como concluídos, e o atual ganha o aria-current (é ele que o css pinta de roxo)
	for (const item of document.querySelectorAll(".passos-wizard > li")) {
		const passo = Number(item.dataset.passo);

		if (passo < n) {
			item.classList.add("concluido");
		} else {
			item.classList.remove("concluido");
		}

		if (passo === n) {
			item.setAttribute("aria-current", "step");
		} else {
			item.removeAttribute("aria-current");
		}
	}

	formCampanha.querySelector(".wizard-voltar").hidden = n === 1;
	formCampanha.querySelector(".wizard-proximo").hidden = n === TOTAL_PASSOS;
	formCampanha.querySelector(".wizard-criar").hidden = n !== TOTAL_PASSOS;

	if (n === 2) {
		atualizarPreviewImagem();
	}
	if (n === 4) {
		preencherRevisao();
	}

	// já deixa o cursor no primeiro campo do passo, se tiver algum
	const primeiroCampo = fieldsetDoPasso(n).querySelector("input, textarea");
	if (primeiroCampo) {
		primeiroCampo.focus();
	}
}

// valida só os campos do passo atual, usando as regras do próprio HTML (required, type="url"...)
function passoValido(n) {
	let valido = true;

	for (const campo of fieldsetDoPasso(n).querySelectorAll("input, textarea")) {
		if (campo.checkValidity()) {
			campo.classList.remove("is-invalid");
		} else {
			campo.classList.add("is-invalid"); // é essa classe que deixa o campo vermelho no bootstrap
			valido = false;
		}
	}

	return valido;
}

// junta o que foi preenchido no formato que o construtor da Campanha espera
function lerFormCampanha() {
	const campos = formCampanha.elements;

	const agentesMarcados = [];
	for (const checkbox of formCampanha.querySelectorAll('input[name="agentes"]:checked')) {
		agentesMarcados.push(checkbox.value);
	}

	return {
		nome: campos.nome.value.trim(),
		mestre: campos.mestre.value.trim(),
		descricao: campos.descricao.value.trim(),
		imagem: campos.imagem.value.trim(),
		agentes: agentesMarcados,
	};
}

function atualizarPreviewImagem() {
	const url = formCampanha.elements.imagem.value.trim();
	formCampanha.querySelector(".wizard-preview-imagem").src = url || IMAGEM_PADRAO_CAMPANHA;
}

function preencherRevisao() {
	const dados = lerFormCampanha();
	const secao = document.getElementById("wizard-campanha");

	const nomesAgentes = [];
	for (const id of dados.agentes) {
		const agente = buscarAgente(id);
		if (agente) {
			nomesAgentes.push(agente.nomePersonagem);
		}
	}

	secao.querySelector(".wizard-revisao-imagem").src = dados.imagem || IMAGEM_PADRAO_CAMPANHA;
	secao.querySelector(".revisao-nome").textContent = dados.nome;
	secao.querySelector(".revisao-mestre").textContent = dados.mestre;
	secao.querySelector(".revisao-descricao").textContent = dados.descricao || "—";
	secao.querySelector(".revisao-agentes").textContent = nomesAgentes.join(", ") || "Nenhum agente";
}

// cria um checkbox pra cada agente que existir (recriado toda vez, pra pegar agentes novos)
function renderizarAgentesWizard() {
	const lista = formCampanha.querySelector(".wizard-lista-agentes");
	lista.innerHTML = "";

	for (const agente of agentes) {
		const item = document.createElement("label");
		item.className = "list-group-item list-group-item-action d-flex align-items-center gap-2";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "form-check-input m-0";
		checkbox.name = "agentes";
		checkbox.value = agente.id;

		const nome = document.createElement("span");
		nome.textContent = agente.nomePersonagem;

		const jogador = document.createElement("small");
		jogador.className = "text-body-secondary ms-auto";
		jogador.textContent = agente.nomeJogador;

		item.append(checkbox, nome, jogador);
		lista.append(item);
	}
}

// volta o wizard pro passo 1 limpo, no modo "criar"
function resetarWizard() {
	campanhaEmEdicao = undefined;
	formCampanha.reset();

	for (const campo of formCampanha.querySelectorAll(".is-invalid")) {
		campo.classList.remove("is-invalid");
	}

	renderizarAgentesWizard();
	configurarModoWizard();
	mostrarPasso(1);
}

// abre o wizard no modo "editar", já preenchido com os dados da campanha
function carregarCampanhaNoWizard(campanha) {
	resetarWizard();
	campanhaEmEdicao = campanha;

	const campos = formCampanha.elements;
	campos.nome.value = campanha.nome;
	campos.mestre.value = campanha.mestre;
	campos.descricao.value = campanha.descricao;

	// se está usando o placeholder, deixa o campo vazio (é o mesmo que "sem imagem")
	if (campanha.imagem === IMAGEM_PADRAO_CAMPANHA) {
		campos.imagem.value = "";
	} else {
		campos.imagem.value = campanha.imagem;
	}

	for (const checkbox of formCampanha.querySelectorAll('input[name="agentes"]')) {
		checkbox.checked = campanha.agentes.includes(checkbox.value);
	}

	configurarModoWizard();
	mostrarPasso(1);
}

formCampanha.querySelector(".wizard-proximo").addEventListener("click", function () {
	if (passoValido(passoAtual)) {
		mostrarPasso(passoAtual + 1);
	}
});

formCampanha.querySelector(".wizard-voltar").addEventListener("click", function () {
	mostrarPasso(passoAtual - 1);
});

// tira o vermelho do campo assim que a pessoa começa a corrigir
formCampanha.addEventListener("input", function (evento) {
	evento.target.classList.remove("is-invalid");

	if (evento.target.name === "imagem") {
		atualizarPreviewImagem();
	}
});

// se a URL não carregar, mostra o placeholder no lugar da imagem quebrada
for (const imagem of document.querySelectorAll(".wizard-preview-imagem, .wizard-revisao-imagem")) {
	imagem.addEventListener("error", function () {
		if (imagem.src !== IMAGEM_PADRAO_CAMPANHA) {
			imagem.src = IMAGEM_PADRAO_CAMPANHA;
		}
	});
}

formCampanha.addEventListener("submit", function (evento) {
	evento.preventDefault(); // sem isso o form recarrega a página e vc perde tudo

	// apertar Enter no meio do wizard dispara submit: nesse caso só avança o passo
	if (passoAtual < TOTAL_PASSOS) {
		if (passoValido(passoAtual)) {
			mostrarPasso(passoAtual + 1);
		}
		return;
	}

	const dados = lerFormCampanha();

	if (campanhaEmEdicao) {
		// editando: troca só os dados, o id e o criadoEm continuam os mesmos
		campanhaEmEdicao.nome = dados.nome;
		campanhaEmEdicao.mestre = dados.mestre;
		campanhaEmEdicao.descricao = dados.descricao;
		campanhaEmEdicao.imagem = dados.imagem || IMAGEM_PADRAO_CAMPANHA; // imagem vazia vira placeholder, igual no construtor
		campanhaEmEdicao.agentes = dados.agentes;

		renderizarCampanhas();
		renderizarDetalheCampanha(campanhaEmEdicao);
		resetarWizard();
		location.hash = "#campanha"; // volta pros detalhes da campanha editada
		return;
	}

	campanhas.push(new Campanha(dados));
	renderizarCampanhas();
	resetarWizard();
	location.hash = "#campanhas";
});

// toda vez que abre o wizard pelo botão, começa do zero
document.querySelector(".btn-nova-campanha").addEventListener("click", resetarWizard);

// EDITAR E EXCLUIR CAMPANHA (botões da tela de detalhes)

document.querySelector(".btn-editar-campanha").addEventListener("click", function () {
	carregarCampanhaNoWizard(campanhaSelecionada);
});

const modalExcluirCampanha = document.getElementById("modal-excluir-campanha");

modalExcluirCampanha.querySelector(".btn-confirmar-exclusao").addEventListener("click", function () {
	// acha a posição da campanha na lista e tira ela de lá (o splice remove 1 item a partir dessa posição)
	const indice = campanhas.indexOf(campanhaSelecionada);
	if (indice !== -1) {
		campanhas.splice(indice, 1);
	}

	bootstrap.Modal.getInstance(modalExcluirCampanha).hide();
	campanhaSelecionada = undefined;
	renderizarCampanhas();
	location.hash = "#campanhas";
});
