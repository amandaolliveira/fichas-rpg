// FICHA
// o formulário da ficha: puxa o agente selecionado e salva de volta

const formFicha = document.getElementById("form-ficha");

// o formFicha.elements pega os campos pelo name que tá no html, ex.: campos.AGI é o input name="AGI"
function preencherFicha() {
	const campos = formFicha.elements;
	const subtitulo = document.querySelector(".ficha-subtitulo");

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

formFicha.addEventListener("submit", function (evento) {
	// mesma coisa do wizard: sem isso a página recarrega e vc perde tudo
	evento.preventDefault();

	const dados = lerFicha();

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

	// o nome pode ter mudado, então redesenha as campanhas também
	renderizarCampanhas();
	location.hash = "#agentes";
});
