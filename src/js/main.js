// VARIAVEIS

let campanhaSelecionada = undefined; // a campanha que vc clicou na lista
let campanhaEmEdicao = undefined; // undefined = criando uma nova; senão é a campanha sendo editada
let passoAtual = 1; // em qual passo do wizard vc está

// cada perícia aponta pro atributo que afeta ela
const PERICIAS = {
	Acrobacia: "AGI",
	Adestramento: "PRE",
	Artes: "PRE",
	Atletismo: "FOR",
	Atualidades: "INT",
	Ciências: "INT",
	Crime: "AGI",
	Diplomacia: "PRE",
	Enganação: "PRE",
	Fortitude: "VIG",
	Furtividade: "AGI",
	Iniciativa: "AGI",
	Intimidação: "PRE",
	Intuição: "PRE",
	Investigação: "INT",
	Luta: "FOR",
	Medicina: "INT",
	Ocultismo: "INT",
	Percepção: "PRE",
	Pilotagem: "AGI",
	Pontaria: "AGI",
	Profissão: "INT",
	Reflexos: "AGI",
	Religião: "PRE",
	Sobrevivência: "INT",
	Tática: "INT",
	Tecnologia: "INT",
	Vontade: "PRE",
};

// placeholder já nas cores do tema (fundo escuro, texto roxo)
const IMAGEM_PADRAO_CAMPANHA = "https://placehold.co/800x300/1c1920/b46bff?text=Campanha";

// se o valor não veio, usa o padrão. não dá pra usar o || aqui porque o 0 é um valor válido (atributo 0 existe)
function valorOuPadrao(valor, padrao) {
	if (valor === undefined) {
		return padrao;
	}
	return valor;
}

// vida, sanidade e esforço têm sempre o mesmo formato: valor atual e máximo
function criarRecurso(recurso) {
	if (!recurso) {
		recurso = {};
	}
	return {
		atual: valorOuPadrao(recurso.atual, 0),
		maximo: valorOuPadrao(recurso.maximo, 0),
	};
}

// CLASSES

class Agente {
	// recebe um objeto só (tipo um dictionary) ao invés de vários parâmetros, assim se vc errar a ordem, não quebra
	constructor(dados = {}) {
		this.id = dados.id || crypto.randomUUID(); // o id é gerado igual no java por UUID, assim não precisa ser incremental
		this.nomePersonagem = dados.nomePersonagem || "";
		this.nomeJogador = dados.nomeJogador || "";
		this.descricao = dados.descricao || "";

		// todo atributo começa em 1, se vier preenchido usa o que veio
		const atributos = dados.atributos || {};
		this.atributos = {
			FOR: valorOuPadrao(atributos.FOR, 1),
			AGI: valorOuPadrao(atributos.AGI, 1),
			INT: valorOuPadrao(atributos.INT, 1),
			PRE: valorOuPadrao(atributos.PRE, 1),
			VIG: valorOuPadrao(atributos.VIG, 1),
		};

		this.pericias = dados.pericias || {};

		// Recursos que mudam durante a sessão: valor atual e máximo
		this.vida = criarRecurso(dados.vida);
		this.sanidade = criarRecurso(dados.sanidade);
		this.esforco = criarRecurso(dados.esforco);

		this.defesa = valorOuPadrao(dados.defesa, 10);
	}

	// recria o personagem a partir do que tiver no localStorage
	static storageParaJSON(dados) {
		return new Agente(dados);
	}
}

class Campanha {
	// mesmo esquema do Agente: um objeto só com os dados
	constructor(dados = {}) {
		this.id = dados.id || crypto.randomUUID();
		this.nome = dados.nome || "";
		this.descricao = dados.descricao || "";
		this.imagem = dados.imagem || IMAGEM_PADRAO_CAMPANHA; // se vier vazia, usa o placeholder
		this.mestre = dados.mestre || "";
		this.agentes = dados.agentes || []; // ids dos agentes que participam da campanha
		this.criadoEm = dados.criadoEm || Date.now();
	}

	// recria a campanha a partir do que tiver no localStorage
	static storageParaJSON(dados) {
		return new Campanha(dados);
	}
}

// DADOS 3D

// https://blog.wunderdev.com/blog/DnD/3/
// https://github.com/3d-dice/dice-box-threejs

const RAIO_DADO = 0.9;
const DURACAO_ROLAGEM = 700; // em milissegundos
const CIMA = new THREE.Vector3(0, 1, 0);

// ficam vazias até a primeira rolagem, aí o iniciarMesa3D preenche
let renderer, cena, camera, dado3D;
let normaisDasFaces = []; // normaisDasFaces[n] = pra onde a face com o número n está apontando
let animacaoDado = null;

function iniciarMesa3D(canvas) {
	renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); // alpha: fundo transparente, aparece o backdrop
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;

	cena = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
	camera.position.set(0, 20, 8);
	camera.up.set(0, 0, -1);
	camera.lookAt(0, 0, 0);

	cena.add(new THREE.AmbientLight(0xffffff, 0.55));

	const luz = new THREE.DirectionalLight(0xffffff, 0.9);
	luz.position.set(4, 12, 6);
	luz.castShadow = true;
	luz.shadow.mapSize.set(1024, 1024);
	// tamanho da área onde a sombra aparece
	luz.shadow.camera.left = -15;
	luz.shadow.camera.right = 15;
	luz.shadow.camera.top = 15;
	luz.shadow.camera.bottom = -15;
	cena.add(luz);

	// a mesa é invisível, só aparece a sombra do dado nela
	const mesa = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.65 }));
	mesa.rotation.x = -Math.PI / 2;
	mesa.receiveShadow = true;
	cena.add(mesa);

	dado3D = criarDado();
	cena.add(dado3D);
}

// a face oposta tem o centro exatamente do outro lado, então somando os dois dá (quase) zero
function acharFaceOposta(centros, face) {
	for (let i = 0; i < centros.length; i++) {
		const soma = centros[i].clone().add(centros[face]);
		if (soma.length() < 0.01) {
			return i;
		}
	}
}

function criarDado() {
	const geometria = new THREE.IcosahedronGeometry(RAIO_DADO); // é o formato de 20 lados
	const material = new THREE.MeshStandardMaterial({
		color: 0x7000ac,
		flatShading: true,
		roughness: 0.45,
		metalness: 0.5,
	});
	const malha = new THREE.Mesh(geometria, material);
	malha.castShadow = true;

	// acha o centro de cada face (cada face é um triângulo, então é a média dos 3 pontos)
	const pontos = geometria.attributes.position;
	const centros = [];
	for (let face = 0; face < pontos.count / 3; face++) {
		const centro = new THREE.Vector3();
		for (let v = 0; v < 3; v++) {
			const ponto = new THREE.Vector3();
			ponto.fromBufferAttribute(pontos, face * 3 + v);
			centro.add(ponto);
		}
		centro.divideScalar(3);
		centros.push(centro);
	}

	// bota os números nas faces: cada face + a oposta somam 21, igual num d20 de verdade
	const numeros = [];
	for (let i = 0; i < centros.length; i++) {
		numeros.push(0);
	}
	let proximo = 1;
	for (let face = 0; face < centros.length; face++) {
		if (numeros[face] !== 0) {
			continue; // essa já ganhou número por ser a oposta de outra
		}
		const oposta = acharFaceOposta(centros, face);
		numeros[face] = proximo;
		numeros[oposta] = 21 - proximo;
		proximo++;
	}

	normaisDasFaces = [];
	for (let face = 0; face < centros.length; face++) {
		const normal = centros[face].clone().normalize();
		normaisDasFaces[numeros[face]] = normal;

		// "adesivo" com o número, colado um pouquinho acima da face
		const numero = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), materialDoNumero(numeros[face]));
		numero.position.copy(centros[face]).multiplyScalar(1.01);
		numero.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
		malha.add(numero);
	}

	return malha;
}

// bota o numero em um canvas e coloca nas faces
function materialDoNumero(n) {
	const tela = document.createElement("canvas");
	tela.width = 128;
	tela.height = 128;

	const ctx = tela.getContext("2d");
	ctx.fillStyle = "white";
	ctx.font = 'bold 64px "Special Elite", "Courier New", monospace';
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(n, 64, 70);

	// risquinho embaixo do 6 e do 9 pra não confundir os dois
	if (n === 6 || n === 9) {
		ctx.fillRect(44, 100, 40, 5);
	}

	return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tela), transparent: true });
}

function ajustarTamanho() {
	const largura = window.innerWidth;
	const altura = window.innerHeight;
	renderer.setSize(largura, altura, false);
	camera.aspect = largura / altura;
	camera.updateProjectionMatrix();
}

// quanto da mesa a câmera enxerga, do centro até a borda
function metadeDaMesa() {
	const metadeAltura = camera.position.y * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
	return { x: metadeAltura * camera.aspect, z: metadeAltura };
}

// rola o dado até parar com o valor pra cima, e chama o quandoParar no final
function rolarDado3D(canvas, valor, quandoParar) {
	if (!renderer) {
		iniciarMesa3D(canvas);
	}
	ajustarTamanho();
	cancelAnimationFrame(animacaoDado); // se tinha uma rolagem rodando, para ela

	const mesaVisivel = metadeDaMesa();
	const alturaDeRepouso = RAIO_DADO * 0.795;

	// entra pelo canto da tela e para perto do meio
	const inicio = new THREE.Vector3(mesaVisivel.x + 2, 0, mesaVisivel.z + 2);
	const fim = new THREE.Vector3((Math.random() - 0.5) * 2, 0, mesaVisivel.z * 0.45);

	// primeiro vira a face sorteada pra cima, depois gira de lado num ângulo aleatório pra não parar sempre igual
	const faceProCima = new THREE.Quaternion().setFromUnitVectors(normaisDasFaces[valor], CIMA);
	const giroAleatorio = new THREE.Quaternion().setFromAxisAngle(CIMA, Math.random() * Math.PI * 2);
	const rotacaoFinal = giroAleatorio.multiply(faceProCima);

	const direcao = fim.clone().sub(inicio).normalize();
	const eixoDeRolagem = new THREE.Vector3().crossVectors(CIMA, direcao).normalize();
	const voltas = Math.PI * 2 * 5;

	dado3D.position.copy(inicio);
	renderer.render(cena, camera);

	let comeco = null;

	// o navegador chama essa função a cada quadro (uns 60 por segundo), e cada quadro mexe o dado um pouquinho
	function quadro(agora) {
		if (comeco === null) {
			comeco = agora;
		}
		const t = Math.min((agora - comeco) / DURACAO_ROLAGEM, 1); // progresso de 0 a 1
		const desacelera = 1 - Math.pow(1 - t, 3); // começa rápido e vai freando

		dado3D.position.lerpVectors(inicio, fim, desacelera);
		// quiques: |cos| faz os pulos, e o exp vai diminuindo a altura deles até zerar em t = 1
		dado3D.position.y = alturaDeRepouso + 4 * Math.exp(-4 * t) * Math.abs(Math.cos(Math.PI * 3.5 * t));

		// quanto falta girar até a posição final; em t = 1 vira zero e sobra só a rotação final.
		// O sinal negativo é o que faz rolar PARA FRENTE: o ângulo sobe de -voltas até 0
		// (se fosse positivo, ele desceria de +voltas até 0 e o dado giraria de ré)
		const giro = new THREE.Quaternion().setFromAxisAngle(eixoDeRolagem, -voltas * (1 - desacelera));
		dado3D.quaternion.multiplyQuaternions(giro, rotacaoFinal);

		renderer.render(cena, camera);

		if (t < 1) {
			animacaoDado = requestAnimationFrame(quadro);
		} else {
			quandoParar();
		}
	}

	animacaoDado = requestAnimationFrame(quadro);
}

// ROLAGEM DE DADOS

// usa o template para criar todas perícias na lista de dados
const modeloPericia = document.getElementById("modelo-pericia");

for (const nome in PERICIAS) {
	const atributo = PERICIAS[nome];
	const pericia = modeloPericia.content.firstElementChild.cloneNode(true);

	pericia.dataset.pericia = nome;
	pericia.querySelector("span").textContent = nome;

	document.getElementById("dados-" + atributo).append(pericia);
}

const somDado = new Audio("sound/dado_rolando.mp3");

function rolarD20() {
	return Math.floor(Math.random() * 20) + 1;
}

function mostrarResultado(pericia, valor) {
	const dialog = document.getElementById("resultado-rolagem");
	dialog.querySelector(".resultado-pericia").textContent = pericia;
	dialog.querySelector(".resultado-valor").textContent = valor;
	dialog.classList.add("rolando"); // esconde o resultado enquanto o dado rola
	dialog.showModal();

	rolarDado3D(dialog.querySelector(".mesa-3d"), valor, function () {
		dialog.classList.remove("rolando");
	});

	somDado.currentTime = 0;
	somDado.play();
}

// um clique só pra lista toda, ao invés de um por dado. o closest sobe no html até achar o .dado que foi clicado
document.querySelector(".categorias-pericias").addEventListener("click", function (evento) {
	if (evento.target.tagName !== "IMG") {
		return;
	}

	const dado = evento.target.closest(".dado");
	mostrarResultado(dado.dataset.pericia, rolarD20());
});

document.getElementById("resultado-rolagem").addEventListener("click", function () {
	const dialog = document.getElementById("resultado-rolagem");
	if (dialog.classList.contains("fechando")) {
		return;
	}

	dialog.classList.add("fechando");
	// o once faz o evento rodar uma vez só e se apagar sozinho, senão ia acumulando a cada clique
	dialog.addEventListener(
		"animationend",
		function () {
			dialog.classList.remove("fechando");
			dialog.close();
		},
		{ once: true },
	);
});

// CAMPANHAS

// dados de exemplo enquanto não tem localStorage, depois isso sai
const agentes = [];
for (let n = 1; n <= 4; n++) {
	agentes.push(new Agente({ nomePersonagem: "Placeholder " + n, nomeJogador: "Jogador " + n }));
}

// no Date o mês começa do 0, então 8 = setembro. não fui eu que inventei isso
const campanhas = [
	new Campanha({
		nome: "O Segredo na Floresta",
		descricao:
			"Um grupo de agentes é enviado para investigar desaparecimentos numa cidade pequena cercada por uma floresta. Ninguém que entrou nela depois do pôr do sol voltou igual.",
		mestre: "Carlos",
		agentes: [agentes[0].id, agentes[1].id, agentes[2].id],
		criadoEm: new Date(2026, 8, 12).getTime(),
	}),
	new Campanha({
		nome: "Ordem Paranormal: Desconjuração",
		descricao: "Uma seita está tentando abrir uma passagem para o Outro Lado. Os agentes têm até a lua cheia para impedir o ritual.",
		mestre: "Carlos",
		agentes: [agentes[2].id, agentes[3].id],
		criadoEm: new Date(2026, 9, 3).getTime(),
	}),
	new Campanha({
		nome: "One-shot de Teste",
		descricao: "Campanha sem imagem e sem agentes, pra testar os valores padrão.",
		mestre: "Jogador 1",
	}),
];

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

renderizarCampanhas();

// WIZARD DE CAMPANHA (criar e editar)

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

resetarWizard();

// PRINCIPAL

// essa funcao nao usa parametro, ela pega direto da URL a seção que vc clicou pra ir
function trocarSection() {
	// pega a url que vc está tentando ir, ou coloca inicio como default
	let id = location.hash.slice(1);
	if (id === "") {
		id = "inicio";
	}

	// sem campanha escolhida (ex.: recarregou a página em #campanha) não tem o que mostrar, volta pra lista
	// o replace troca a URL sem criar histórico, e dispara o hashchange de novo
	if (id === "campanha" && !campanhaSelecionada) {
		location.replace("#campanhas");
		return;
	}

	const nova = document.getElementById(id); // procura a seção nos elementos
	const antiga = document.querySelector("main > section:not([hidden])");

	// vê pela hash se existe a seção, se vc clicou na mesma seção ignora
	if (!nova || nova.tagName !== "SECTION" || nova === antiga) {
		return;
	}

	// pra evitar duas transições ao mesmo tempo
	if (document.querySelector(".secao-saindo")) {
		return;
	}

	// procura nos links em NAV o que bater com a seção aberta, só pra alterar a cor pra roxo kkkkkk (pra vc saber qual seção está né)
	for (const link of document.querySelectorAll("header nav a")) {
		if (link.hash === "#" + id) {
			link.setAttribute("aria-current", "page");
		} else {
			link.removeAttribute("aria-current");
		}
	}

	// não preciso explicar, só ler
	antiga.classList.add("secao-saindo");

	// tbm não preciso
	antiga.addEventListener(
		"animationend",
		function () {
			antiga.hidden = true;
			antiga.classList.remove("secao-saindo");

			nova.hidden = false;
			nova.classList.add("secao-entrando");
			window.scrollTo(0, 0);
		},
		{ once: true },
	);

	nova.addEventListener(
		"animationend",
		function () {
			nova.classList.remove("secao-entrando");
		},
		{ once: true },
	);
}

window.addEventListener("hashchange", trocarSection); // tive que cavar pra achar esse hashchange
trocarSection(); // chama a função no rodar da página, pra tocar até na hora de carregar
