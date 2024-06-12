function carregarAfegirTrajecte() {
    const diaInput = $('#dia-trajecte')[0];
    diaInput.value = new Date().toISOString().split('T')[0];
    diaInput.max = diaInput.value;
}

function enviarNouTrajecte() {
    const dia = $('#dia-trajecte')[0];
    const origen = $('#origen')[0];
    const desti = $('#desti')[0];
    const km = $('#km')[0];
    
    if (!dia.checkValidity() || !origen.reportValidity() || !desti.reportValidity() || !km.reportValidity()) {
        console.log("NO")
        return;
    }

    axios.post('/afegir-trajecte', {
        dia: dia.value,
        origen: origen.value,
        desti: desti.value,
        km: km.value
    }).then(res => {
        console.log(res.data);
        carregarPagina('/pages/kilometratge.html');
    }).catch(err => {
        console.error(err);
    })
}