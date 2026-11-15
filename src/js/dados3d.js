// https://blog.wunderdev.com/blog/DnD/3/
// https://github.com/3d-dice/dice-box-threejs

const Dado3D = (() => {
	const RAIO = 0.9;
	const DURACAO_MS = 700;
	const CIMA = new THREE.Vector3(0, 1, 0);

	let renderer, cena, camera, dado;
	let normais = [];
	let animacao = null;

	function iniciar(canvas) {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); // alpha: fundo transparente, aparece o backdrop
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
		Object.assign(luz.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
		cena.add(luz);

		const mesa = new THREE.Mesh(
			new THREE.PlaneGeometry(100, 100),
			new THREE.ShadowMaterial({ opacity: 0.65 })
		);
		mesa.rotation.x = -Math.PI / 2;
		mesa.receiveShadow = true;
		cena.add(mesa);

		dado = criarDado();
		cena.add(dado);
	}

	function criarDado() {
		const geometria = new THREE.IcosahedronGeometry(RAIO); // é o formato de 20 lados
		const material = new THREE.MeshStandardMaterial({
			color: 0x7000ac,
			flatShading: true,
			roughness: 0.45,
			metalness: 0.5
		});
		const malha = new THREE.Mesh(geometria, material);
		malha.castShadow = true;

		const pos = geometria.attributes.position;
		const centros = [];
		for (let f = 0; f < pos.count / 3; f++) {
			const centro = new THREE.Vector3();
			for (let v = 0; v < 3; v++) {
				centro.add(new THREE.Vector3().fromBufferAttribute(pos, f * 3 + v));
			}
			centros.push(centro.divideScalar(3));
		}

		// bota os números nas faces
		const numeros = new Array(centros.length).fill(0);
		let proximo = 1;
		centros.forEach((centro, f) => {
			if (numeros[f]) return;
			const oposta = centros.findIndex((c) => c.clone().add(centro).length() < 0.01);
			numeros[f] = proximo;
			numeros[oposta] = 21 - proximo;
			proximo++;
		});

		normais = [];
		centros.forEach((centro, f) => {
			const normal = centro.clone().normalize();
			normais[numeros[f]] = normal;

			// "adesivo" com o número, colado um pouquinho acima da face
			const numero = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), materialDoNumero(numeros[f]));
			numero.position.copy(centro).multiplyScalar(1.01);
			numero.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
			malha.add(numero);
		});

		return malha;
	}

	// bota o numero em um canvas e coloca nas faces
	function materialDoNumero(n) {
		const tela = document.createElement('canvas');
		tela.width = tela.height = 128;
		const ctx = tela.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.font = 'bold 64px "Special Elite", "Courier New", monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(n, 64, 70);
		if (n === 6 || n === 9) ctx.fillRect(44, 100, 40, 5);

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

	function rolar(canvas, valor) {
		if (!renderer) iniciar(canvas);
		ajustarTamanho();
		cancelAnimationFrame(animacao);

		const mesaVisivel = metadeDaMesa();
		const alturaDeRepouso = RAIO * 0.795;

		const inicio = new THREE.Vector3(mesaVisivel.x + 2, 0, mesaVisivel.z + 2);
		const fim = new THREE.Vector3((Math.random() - 0.5) * 2, 0, mesaVisivel.z * 0.45);

		const rotacaoFinal = new THREE.Quaternion()
			.setFromAxisAngle(CIMA, Math.random() * Math.PI * 2)
			.multiply(new THREE.Quaternion().setFromUnitVectors(normais[valor], CIMA));

		const direcao = fim.clone().sub(inicio).normalize();
		const eixoDeRolagem = new THREE.Vector3().crossVectors(CIMA, direcao).normalize();
		const voltas = Math.PI * 2 * 5;

		dado.position.copy(inicio);
		renderer.render(cena, camera);

		let comeco = null;

		return new Promise((resolve) => {
			function quadro(agora) {
				if (comeco === null) comeco = agora;
				const t = Math.min((agora - comeco) / DURACAO_MS, 1); // progresso de 0 a 1
				const desacelera = 1 - Math.pow(1 - t, 3); // começa rápido e vai freando

				dado.position.lerpVectors(inicio, fim, desacelera);
				// quiques: |cos| faz os pulos, e o exp vai diminuindo a altura deles até zerar em t = 1
				dado.position.y = alturaDeRepouso + 4 * Math.exp(-4 * t) * Math.abs(Math.cos(Math.PI * 3.5 * t));

				// quanto falta girar até a posição final; em t = 1 vira zero e sobra só a rotação final.
				// O sinal negativo é o que faz rolar PARA FRENTE: o ângulo sobe de -voltas até 0
				// (se fosse positivo, ele desceria de +voltas até 0 e o dado giraria de ré)
				const giro = new THREE.Quaternion().setFromAxisAngle(eixoDeRolagem, -voltas * (1 - desacelera));
				dado.quaternion.multiplyQuaternions(giro, rotacaoFinal);

				renderer.render(cena, camera);

				if (t < 1) {
					animacao = requestAnimationFrame(quadro);
				} else {
					resolve();
				}
			}
			animacao = requestAnimationFrame(quadro);
		});
	}

	return { rolar };
})();
