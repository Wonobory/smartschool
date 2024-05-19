function carregarHorari() {
    axios.get('/horari-esperat').then(res => {
        console.log(res.data);
        /*
            horari:
                ['9:00', '13:00']
                ['17:00', '20:00']

            horesTotals:7
        */

        if (res.data.horariValidat) {
            $('.horari-esperat-h')[0].innerText = 'Horari validat:';
            $('.validar-button')[0].classList.add('disabled');
            $('.validar-button')[0].removeAttribute('onclick');
            $('.validar-button')[0].innerText = 'Validat';
            //remove
            $('.modificar-button')[0].remove()
        }

        const horariDisplay = $('#display-horari')[0]
        const horesTotals = $('.hores-amount')[0]

        // Borrar dades anteriors per si de cas
        horariDisplay.innerHTML = '';
        horesTotals.innerText = '';

        if (res.data.horari == null) {
            horariDisplay.innerText = 'No tens cap hora programada per avui';
            horesTotals.innerText = '0';
            return
        }

        for (var i = 0; i < res.data.horari.length; i++) {
            const span = document.createElement('span');
            span.innerText = `${res.data.horari[i][0]}  -  ${res.data.horari[i][1]}`;
            horariDisplay.appendChild(span);
        }

        horesTotals.innerText = res.data.horesTotals.toFixed(2);
    })
}

function validarHorari() {
    axios.post('/validar-horari').then(res => {
        carregarHorari();
    }).catch(err => {
        alert(err.response.data.message);
    });
}