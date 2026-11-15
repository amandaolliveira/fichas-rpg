// Navegação entre seções usando o "#" da URL (ex.: index.html#ficha).
// Os links já apontam para "#id-da-secao"; ao clicar, o navegador muda o hash
// e dispara o evento "hashchange", que usamos para mostrar só a seção certa.

const secoes = document.querySelectorAll('main > section');
const linksMenu = document.querySelectorAll('.cabecalho nav a');

function mostrarSecao() {
	// Tira o "#" do começo; se a URL não tiver hash, cai no início
	const id = location.hash.slice(1) || 'inicio';
	const existe = document.getElementById(id) !== null;
	const idAtual = existe ? id : 'inicio';

	secoes.forEach((secao) => {
		secao.hidden = secao.id !== idAtual;
	});

	// Marca no menu qual página está aberta (usado por leitores de tela e pelo CSS)
	linksMenu.forEach((link) => {
		if (link.getAttribute('href') === '#' + idAtual) {
			link.setAttribute('aria-current', 'page');
		} else {
			link.removeAttribute('aria-current');
		}
	});

	// Sem isso, o navegador rola até a seção como se fosse uma âncora comum
	window.scrollTo(0, 0);
}

window.addEventListener('hashchange', mostrarSecao);
mostrarSecao(); // roda uma vez ao carregar, para respeitar um link direto tipo "#guia"
