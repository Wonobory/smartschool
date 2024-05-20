function marcarAbsencia() {
    const motiu = parseInt($('.select-absencia')[0].value);
    axios.post('/absencia', {motiu: motiu}).then(res => {
        carregarPagina('/pages/validar_horari.html');
    }).catch(err => {
        console.error(err.response.data.message);
    })
}