function carregarPagina(url) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById('page-output').innerHTML = html;
            if (url == '/pages/validar_horari.html') {
                carregarHorari();
            } else if (url == '/pages/modificar_horaris.html') {
                carregarModificarHoraris();
            } else if (url == '/pages/registre_mensual.html') {
                carregarRegistre();
            }
            
        });
}

function moveSelector(top) {
    document.getElementById('selector').style.top = top + 'px';
}

function seleccionar(num) {
    switch (num) {
        case 1:
            moveSelector(94);
            carregarPagina('/pages/validar_horari.html')
            break;
        case 4:
            moveSelector(238);
            carregarPagina('/pages/registre_mensual.html')
            break;
    }
}



carregarPagina('/pages/validar_horari.html')