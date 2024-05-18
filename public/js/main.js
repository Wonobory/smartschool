function carregarPagina(url) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById('page-output').innerHTML = html;
            if (url == '/pages/validar_horari.html') {
                carregarHorari();
            } else if (url == '/pages/modificar_horaris.html') {
                carregarModificarHoraris()
            }
            
        });
}



carregarPagina('/pages/validar_horari.html')