//


// essa funcao nao usa parametro, ela pega direto da URL a seção que vc clicou pra ir
function trocarSection() {
	const id = location.hash.slice(1) || 'inicio'; // pega a url que vc está tentando ir, ou coloca inicio como default
	const nova = document.getElementById(id); // procura a seção nos elementos
	const antiga = document.querySelector('main > section:not([hidden])');

	// vê pela hash se existe a seção, se vc clicou na mesma seção ignora
	if (!nova || nova.tagName !== 'SECTION' || nova === antiga) return;

	// pra evitar duas transições ao mesmo tempo
	if (document.querySelector('.secao-saindo')) return;

	// procura nos links em NAV o que bater com a seção aberta, só pra alterar a cor pra roxo kkkkkk (pra vc saber qual seção está né)
	document.querySelectorAll('header nav a').forEach((link) => {
		if (link.hash === '#' + id) {
			link.setAttribute('aria-current', 'page');
		} else {
			link.removeAttribute('aria-current');
		}
	});

	// não preciso explicar, só ler
	antiga.classList.add('secao-saindo');

	// tbm não preciso
	antiga.addEventListener('animationend', () => {
		antiga.hidden = true;
		antiga.classList.remove('secao-saindo');

		nova.hidden = false;
		nova.classList.add('secao-entrando');
		window.scrollTo(0, 0);
	}, { once: true });

	nova.addEventListener('animationend', () => {
		nova.classList.remove('secao-entrando');
	}, { once: true });
}

window.addEventListener('hashchange', trocarSection); // tive que cavar pra achar esse hashchange
trocarSection(); // chama a função no rodar da página, pra tocar até na hora de carregar
