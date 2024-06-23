function carregarPagina(url, action = 0, dia = null) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById('page-output').innerHTML = html;
            if (url == '/pages/validar_horari.html' && action == 0) {
                window.location.hash = '';
                carregarHorari();
            } else if (url == '/pages/validar_horari.html' && action == 1 && dia != null) {
                window.location.hash = dia;
                carregarHorari();
            } else if (url == '/pages/modificar_horaris.html') {
                carregarModificarHoraris();
            } else if (url == '/pages/registre_mensual.html') {
                carregarRegistre();
            } else if (url == '/pages/validar_dia_anterior.html') {
                carregarValidarHorarisAnteriors();
            } else if (url == '/pages/perfil.html') {
                carregarPerfil();
            } else if (url == '/pages/afegir_trajecte.html') {
                carregarAfegirTrajecte();
            } else if (url == '/pages/kilometratge.html') {
                carregarTrajectes()
            } else if (url == '/pages/regularitzacions.html') {
                carregarRegularitzacions()
            }
        });
}

function carregarPaginaPerfil(url) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            $('.perfil-b2')[0].innerHTML = html;
            if (url == '/pages/configuracio_perfil.html') {
                carregaConfiguracio()
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
        case 2:
            moveSelector(142);
            carregarPagina('/pages/kilometratge.html')
            break;
        case 3:
            moveSelector(190);
            carregarPagina('/pages/validar_dia_anterior.html')
            break;
        case 4:
            moveSelector(238);
            carregarPagina('/pages/registre_mensual.html')
            break;
        case 5:
            moveSelector(286);
            carregarPagina('/pages/regularitzacions.html')
            break;
        case 6:
            moveSelector(334);    
            carregarPagina('/pages/perfil.html')

            
            break;
        case 7:
            axios.get('/logout')
            .then(function(response) {
                window.location.href = '/login';
            })
            .catch(function(error) {
                console.log(error);
            });
            break;
    }
}



carregarPagina('/pages/validar_horari.html')
revisarNotificacio()