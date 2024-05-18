function carregarPagina(url) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            console.log(html);
            document.getElementById('page-output').innerHTML = html;
        });
}

carregarPagina('/pages/validar_horari.html')