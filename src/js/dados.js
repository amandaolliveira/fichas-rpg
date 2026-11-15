// usa o template para criar todas perícias na lista de dados
const modelo = document.getElementById('modelo-pericia');

for (const [nome, atributo] of Object.entries(PERICIAS)) {
	const pericia = modelo.content.firstElementChild.cloneNode(true);

	pericia.dataset.pericia = nome;
	pericia.querySelector('span').textContent = nome;

	document.getElementById('dados-' + atributo).append(pericia);
}

const somDado = new Audio('sound/dado_rolando.mp3');

function rolarD20() {
	return Math.floor(Math.random() * 20) + 1;
}

function mostrarResultado(pericia, valor) {
	const dialog = document.getElementById('resultado-rolagem');
	dialog.querySelector('.resultado-pericia').textContent = pericia;
	dialog.querySelector('.resultado-valor').textContent = valor;
	dialog.classList.add('rolando');
	dialog.showModal();

	Dado3D.rolar(dialog.querySelector('.mesa-3d'), valor).then(() => {
		dialog.classList.remove('rolando');
	});

	somDado.currentTime = 0;
	somDado.play();
}

document.querySelector('.categorias-pericias').addEventListener('click', (evento) => {
	if (evento.target.tagName !== 'IMG') return;

	const dado = evento.target.closest('.dado');
	mostrarResultado(dado.dataset.pericia, rolarD20());
});

document.getElementById('resultado-rolagem').addEventListener('click', (evento) => {
	const dialog = evento.currentTarget;
	if (dialog.classList.contains('fechando')) return;

	dialog.classList.add('fechando');
	dialog.addEventListener('animationend', () => {
		dialog.classList.remove('fechando');
		dialog.close();
	}, { once: true });
});
