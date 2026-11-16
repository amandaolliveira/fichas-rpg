// DADOS 3D
// tudo que é 3D fica aqui. o resto do site não precisa saber como funciona, só chama o rolarDados3D(canvas, valores, quandoParar)

// https://blog.wunderdev.com/blog/DnD/3/
// https://github.com/3d-dice/dice-box-threejs

const RAIO_DADO = 0.9;
const DURACAO_ROLAGEM = 700; // em milissegundos
const CIMA = new THREE.Vector3(0, 1, 0);
const ESPACO_ENTRE_DADOS = RAIO_DADO * 2.6; // distância de um dado pro outro quando param lado a lado

// ficam vazias até a primeira rolagem, aí o iniciarMesa3D preenche
let renderer, cena, camera;
let dados3D = []; // um por dado rolado; vai criando mais conforme precisa e reaproveita os que já existem
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

// cria os dados que faltam pra ter pelo menos n na mesa, e esconde os que sobram da rolagem anterior
function prepararDados(n) {
	while (dados3D.length < n) {
		const dado = criarDado();
		cena.add(dado);
		dados3D.push(dado);
	}
	for (let i = 0; i < dados3D.length; i++) {
		dados3D[i].visible = i < n;
	}
}

// onde cada dado para: lado a lado, quebrando em mais de uma fileira se não couber na largura da tela
function posicoesFinais(n, mesaVisivel) {
	const porFileira = Math.max(1, Math.floor((mesaVisivel.x * 2 - RAIO_DADO * 2) / ESPACO_ENTRE_DADOS));
	const fileiras = Math.ceil(n / porFileira);
	const posicoes = [];

	for (let i = 0; i < n; i++) {
		const fileira = Math.floor(i / porFileira);
		const coluna = i % porFileira;
		const naFileira = Math.min(porFileira, n - fileira * porFileira); // a última fileira pode ter menos dados
		// centraliza a fileira e dá uma tremidinha pra não parecer grade perfeita
		const x = (coluna - (naFileira - 1) / 2) * ESPACO_ENTRE_DADOS + (Math.random() - 0.5) * 0.4;
		const z = mesaVisivel.z * 0.45 + (fileira - (fileiras - 1) / 2) * ESPACO_ENTRE_DADOS + (Math.random() - 0.5) * 0.4;
		posicoes.push(new THREE.Vector3(x, 0, z));
	}
	return posicoes;
}

// rola um dado pra cada valor, cada um para com o seu valor pra cima, e chama o quandoParar quando todos pararem
function rolarDados3D(canvas, valores, quandoParar) {
	if (!renderer) {
		iniciarMesa3D(canvas);
	}
	ajustarTamanho();
	cancelAnimationFrame(animacaoDado); // se tinha uma rolagem rodando, para ela
	prepararDados(valores.length);

	const mesaVisivel = metadeDaMesa();
	const alturaDeRepouso = RAIO_DADO * 0.795;
	const fins = posicoesFinais(valores.length, mesaVisivel);
	const voltas = Math.PI * 2 * 5;

	// tudo que cada dado precisa pra animação: de onde sai, onde para, em que eixo gira e como termina
	const rolagens = [];
	for (let i = 0; i < valores.length; i++) {
		// todos entram pelo mesmo canto, um pouquinho espalhados pra não sair um dentro do outro
		const inicio = new THREE.Vector3(mesaVisivel.x + 2 + Math.random() * 2, 0, mesaVisivel.z + 2 + Math.random() * 2);
		const fim = fins[i];

		// primeiro vira a face sorteada pra cima, depois gira de lado num ângulo aleatório pra não parar sempre igual
		const faceProCima = new THREE.Quaternion().setFromUnitVectors(normaisDasFaces[valores[i]], CIMA);
		const giroAleatorio = new THREE.Quaternion().setFromAxisAngle(CIMA, Math.random() * Math.PI * 2);

		const direcao = fim.clone().sub(inicio).normalize();
		rolagens.push({
			dado: dados3D[i],
			inicio: inicio,
			fim: fim,
			rotacaoFinal: giroAleatorio.multiply(faceProCima),
			eixoDeRolagem: new THREE.Vector3().crossVectors(CIMA, direcao).normalize(),
		});
		dados3D[i].position.copy(inicio);
	}
	renderer.render(cena, camera);

	let comeco = null;

	// o navegador chama essa função a cada quadro (uns 60 por segundo), e cada quadro mexe os dados um pouquinho
	function quadro(agora) {
		if (comeco === null) {
			comeco = agora;
		}
		const t = Math.min((agora - comeco) / DURACAO_ROLAGEM, 1); // progresso de 0 a 1
		const desacelera = 1 - Math.pow(1 - t, 3); // começa rápido e vai freando

		for (const r of rolagens) {
			r.dado.position.lerpVectors(r.inicio, r.fim, desacelera);
			// quiques: |cos| faz os pulos, e o exp vai diminuindo a altura deles até zerar em t = 1
			r.dado.position.y = alturaDeRepouso + 4 * Math.exp(-4 * t) * Math.abs(Math.cos(Math.PI * 3.5 * t));

			// quanto falta girar até a posição final; em t = 1 vira zero e sobra só a rotação final.
			// O sinal negativo é o que faz rolar PARA FRENTE: o ângulo sobe de -voltas até 0
			// (se fosse positivo, ele desceria de +voltas até 0 e o dado giraria de ré)
			const giro = new THREE.Quaternion().setFromAxisAngle(r.eixoDeRolagem, -voltas * (1 - desacelera));
			r.dado.quaternion.multiplyQuaternions(giro, r.rotacaoFinal);
		}

		renderer.render(cena, camera);

		if (t < 1) {
			animacaoDado = requestAnimationFrame(quadro);
		} else {
			quandoParar();
		}
	}

	animacaoDado = requestAnimationFrame(quadro);
}
