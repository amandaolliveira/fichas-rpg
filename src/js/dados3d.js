// DADOS 3D
// tudo que é 3D fica aqui. o resto do site não precisa saber como funciona, só chama o rolarDado3D(canvas, valor, quandoParar)

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
