function marcarAbsencia() {
    const motiu = parseInt($('.select-absencia')[0].value);
    axios.post('/absencia', {motiu: motiu, dia: window.location.hash.slice(1)}).then(res => {
        // revisar si venim de validar un horari anterior o no
        if (window.location.hash) {
            carregarPagina('/pages/validar_horari.html', 1, window.location.hash.slice(1));
        } else {
            carregarPagina('/pages/validar_horari.html');
        }        
    }).catch(err => {
        console.error(err.response.data.message);
    })
}