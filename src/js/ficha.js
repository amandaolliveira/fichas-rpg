// FICHA
// o formulário da ficha: puxa o agente selecionado e salva de volta

const formFicha = document.getElementById("form-ficha");

// o formFicha.elements pega os campos pelo name que tá no html, ex.: campos.AGI é o input name="AGI"
function preencherFicha() {
	const campos = formFicha.elements;
	const subtitulo = document.querySelector(".ficha-subtitulo");

	// trocou de agente: os erros do anterior não fazem mais sentido
	limparErrosFicha();

	if (!agenteSelecionado) {
		formFicha.reset();
		campos.agenteId.value = "";
		subtitulo.textContent = "Criando um agente novo.";
		return;
	}

	const agente = agenteSelecionado;
	subtitulo.textContent = "Editando a ficha de " + agente.nomePersonagem + ".";

	campos.agenteId.value = agente.id;
	campos.nomePersonagem.value = agente.nomePersonagem;
	campos.nomeJogador.value = agente.nomeJogador;
	campos.descricao.value = agente.descricao;

	campos.AGI.value = agente.atributos.AGI;
	campos.FOR.value = agente.atributos.FOR;
	campos.INT.value = agente.atributos.INT;
	campos.PRE.value = agente.atributos.PRE;
	campos.VIG.value = agente.atributos.VIG;

	campos.vidaAtual.value = agente.vida.atual;
	campos.vidaMaximo.value = agente.vida.maximo;
	campos.sanidadeAtual.value = agente.sanidade.atual;
	campos.sanidadeMaximo.value = agente.sanidade.maximo;
	campos.esforcoAtual.value = agente.esforco.atual;
	campos.esforcoMaximo.value = agente.esforco.maximo;

	campos.defesa.value = agente.defesa;
}

// o value dos inputs sempre vem como texto, então o Number transforma em número de verdade
function lerFicha() {
	const campos = formFicha.elements;

	return {
		nomePersonagem: campos.nomePersonagem.value.trim(),
		nomeJogador: campos.nomeJogador.value.trim(),
		descricao: campos.descricao.value.trim(),
		atributos: {
			AGI: Number(campos.AGI.value),
			FOR: Number(campos.FOR.value),
			INT: Number(campos.INT.value),
			PRE: Number(campos.PRE.value),
			VIG: Number(campos.VIG.value),
		},
		vida: { atual: Number(campos.vidaAtual.value), maximo: Number(campos.vidaMaximo.value) },
		sanidade: { atual: Number(campos.sanidadeAtual.value), maximo: Number(campos.sanidadeMaximo.value) },
		esforco: { atual: Number(campos.esforcoAtual.value), maximo: Number(campos.esforcoMaximo.value) },
		defesa: Number(campos.defesa.value),
	};
}

// VALIDAÇÃO

function limparErrosFicha() {
	for (const campo of formFicha.querySelectorAll(".is-invalid")) {
		campo.classList.remove("is-invalid");
	}
	for (const erro of formFicha.querySelectorAll(".erro-ficha")) {
		erro.hidden = true;
	}
}

// deixa os campos vermelhos e escreve a mensagem no .erro-ficha certo
function mostrarErroFicha(nomesDosCampos, erro, mensagem) {
	for (const nome of nomesDosCampos) {
		formFicha.elements[nome].classList.add("is-invalid");
	}

	const elemento = formFicha.querySelector('.erro-ficha[data-erro="' + erro + '"]');
	elemento.textContent = mensagem;
	elemento.hidden = false;
}

// regras do Ordem Paranormal: cada atributo de 0 a 3, só um pode ficar em 0 e a soma não passa de 9
// devolve o texto do erro, ou "" se tá tudo certo
function validarAtributos(atributos) {
	let soma = 0;
	let zerados = 0;

	for (const nome in atributos) {
		const valor = atributos[nome];

		// o Number.isInteger barra o 1.5 (e o NaN, se digitar alguma coisa estranha)
		if (!Number.isInteger(valor) || valor < 0 || valor > MAXIMO_ATRIBUTO) {
			return "Cada atributo vai de 0 a " + MAXIMO_ATRIBUTO + ".";
		}

		soma += valor;
		if (valor === 0) {
			zerados++;
		}
	}

	if (zerados > 1) {
		return "Só um atributo pode ficar em 0.";
	}
	if (soma > PONTOS_ATRIBUTOS) {
		return "A soma dos atributos é " + soma + ", o máximo é " + PONTOS_ATRIBUTOS + ".";
	}
	return "";
}

// vida, sanidade e esforço: números inteiros, sem negativo, e o atual não pode passar do máximo
function validarRecurso(recurso) {
	if (!Number.isInteger(recurso.atual) || !Number.isInteger(recurso.maximo) || recurso.atual < 0 || recurso.maximo < 0) {
		return "Use números inteiros a partir de 0.";
	}
	if (recurso.atual > recurso.maximo) {
		return "O valor atual não pode passar do máximo.";
	}
	return "";
}

// valida a ficha inteira e mostra todos os erros de uma vez. devolve true se pode salvar
function fichaValida(dados) {
	limparErrosFicha();
	let valido = true;

	if (dados.nomePersonagem === "") {
		mostrarErroFicha(["nomePersonagem"], "nome", "O personagem precisa de um nome.");
		valido = false;
	}

	const erroAtributos = validarAtributos(dados.atributos);
	if (erroAtributos !== "") {
		mostrarErroFicha(["AGI", "FOR", "INT", "PRE", "VIG"], "atributos", erroAtributos);
		valido = false;
	}

	// os campos do html se chamam vidaAtual, vidaMaximo... então dá pra montar o nome
	const recursos = ["vida", "sanidade", "esforco"];
	for (const recurso of recursos) {
		const erroRecurso = validarRecurso(dados[recurso]);
		if (erroRecurso !== "") {
			mostrarErroFicha([recurso + "Atual", recurso + "Maximo"], recurso, erroRecurso);
			valido = false;
		}
	}

	if (!Number.isInteger(dados.defesa) || dados.defesa < 0) {
		mostrarErroFicha(["defesa"], "defesa", "A defesa tem que ser um número inteiro a partir de 0.");
		valido = false;
	}

	return valido;
}

// tira o vermelho do campo quando a pessoa começa a arrumar
formFicha.addEventListener("input", function (evento) {
	evento.target.classList.remove("is-invalid");
});

formFicha.addEventListener("submit", function (evento) {
	// mesma coisa do wizard: sem isso a página recarrega e vc perde tudo
	evento.preventDefault();

	const dados = lerFicha();

	if (!fichaValida(dados)) {
		// leva o cursor pro primeiro campo com erro
		formFicha.querySelector(".is-invalid").focus();
		return;
	}

	if (agenteSelecionado) {
		agenteSelecionado.nomePersonagem = dados.nomePersonagem;
		agenteSelecionado.nomeJogador = dados.nomeJogador;
		agenteSelecionado.descricao = dados.descricao;
		agenteSelecionado.atributos = dados.atributos;
		agenteSelecionado.vida = dados.vida;
		agenteSelecionado.sanidade = dados.sanidade;
		agenteSelecionado.esforco = dados.esforco;
		agenteSelecionado.defesa = dados.defesa;
		selecionarAgente(agenteSelecionado);
	} else {
		const novo = new Agente(dados);
		agentes.push(novo);
		selecionarAgente(novo);
	}

	// criou ou editou, tanto faz: salva a lista inteira de novo
	salvarAgentes();

	// o nome pode ter mudado, então redesenha as campanhas também
	renderizarCampanhas();
	location.hash = "#agentes";
});
