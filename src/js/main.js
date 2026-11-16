// VARIAVEIS

let campanhaSelecionada = undefined;

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

function valorOuPadrao(valor, padrao) {
	if (valor === undefined) {
		return padrao;
	}
	return valor;
}

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
const DURACAO_ROLAGEM = 700;
const CIMA = new THREE.Vector3(0, 1, 0);

let renderer, cena, camera, dado3D;
let normaisDasFaces = [];
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
	luz.shadow.camera.left = -15;
	luz.shadow.camera.right = 15;
	luz.shadow.camera.top = 15;
	luz.shadow.camera.bottom = -15;
	cena.add(luz);

	const mesa = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.65 }));
	mesa.rotation.x = -Math.PI / 2;
	mesa.receiveShadow = true;
	cena.add(mesa);

	dado3D = criarDado();
	cena.add(dado3D);
}

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

	// bota os números nas faces
	const numeros = [];
	for (let i = 0; i < centros.length; i++) {
		numeros.push(0);
	}
	let proximo = 1;
	for (let face = 0; face < centros.length; face++) {
		if (numeros[face] !== 0) {
			continue;
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

function metadeDaMesa() {
	const metadeAltura = camera.position.y * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
	return { x: metadeAltura * camera.aspect, z: metadeAltura };
}

function rolarDado3D(canvas, valor, quandoParar) {
	if (!renderer) {
		iniciarMesa3D(canvas);
	}
	ajustarTamanho();
	cancelAnimationFrame(animacaoDado);

	const mesaVisivel = metadeDaMesa();
	const alturaDeRepouso = RAIO_DADO * 0.795;

	const inicio = new THREE.Vector3(mesaVisivel.x + 2, 0, mesaVisivel.z + 2);
	const fim = new THREE.Vector3((Math.random() - 0.5) * 2, 0, mesaVisivel.z * 0.45);

	const faceProCima = new THREE.Quaternion().setFromUnitVectors(normaisDasFaces[valor], CIMA);
	const giroAleatorio = new THREE.Quaternion().setFromAxisAngle(CIMA, Math.random() * Math.PI * 2);
	const rotacaoFinal = giroAleatorio.multiply(faceProCima);

	const direcao = fim.clone().sub(inicio).normalize();
	const eixoDeRolagem = new THREE.Vector3().crossVectors(CIMA, direcao).normalize();
	const voltas = Math.PI * 2 * 5;

	dado3D.position.copy(inicio);
	renderer.render(cena, camera);

	let comeco = null;

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
	dialog.classList.add("rolando");
	dialog.showModal();

	rolarDado3D(dialog.querySelector(".mesa-3d"), valor, function () {
		dialog.classList.remove("rolando");
	});

	somDado.currentTime = 0;
	somDado.play();
}

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
		card.querySelector(".campanha-info").textContent = "Mestre: " + campanha.mestre + " · " + formatarQuantidadeAgentes(campanha.agentes.length);
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
