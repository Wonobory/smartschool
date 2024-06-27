function carregarHorari() {
    axios.get('/horari-esperat', { params: { dia: window.location.hash.slice(1) }}).then(res => {
        if (res.data.horariValidat) {
            $('.horari-esperat-h')[0].innerText = 'Horari validat:';
            $('.validar-button')[0].classList.add('disabled');
            $('.validar-button')[0].removeAttribute('onclick');
            $('.validar-button')[0].innerText = 'Validat';
            //remove
            $('.modificar-button')[0].remove()
        }

        if (res.data.absencia) {
            const motius = ["Festiu", "Canvi de torn", "Personal", "Absentisme", "Baixa mèdica", "Permís retribuït", "Vacances"];
            $('#absencia-display')[0].style.display = 'flex'
            $('#motiu-absencia')[0].innerText = motius[res.data.motiu - 1];
        }        

        if (window.location.hash) {
            let [dia, mes, any] = window.location.hash.slice(1).split('-');
            mostrarDia(new Date(any, mes - 1, dia));
            
        } else {
            mostrarDia();
        }
        
        const horariDisplay = $('#display-horari')[0]
        const horesTotals = $('.hores-amount')[0]

        // Borrar dades anteriors per si de cas
        horariDisplay.innerHTML = '';
        horesTotals.innerText = '';

        if (res.data.horari == null || res.data.horari.length == 0) {
            horariDisplay.innerText = 'No tens cap hora programada';
            horesTotals.innerText = '0.00';
            return
        }

        for (var i = 0; i < res.data.horari.length; i++) {
            const span = document.createElement('span');
            span.innerText = `${res.data.horari[i][0]}  -  ${res.data.horari[i][1]}`;
            horariDisplay.appendChild(span);
        }

        horesTotals.innerText = res.data.horesTotals.toFixed(2);
    }).catch(err => {
        console.error(err);
    });
}

function validarHorari() {
    axios.post('/validar-horari', {dia: window.location.hash.slice(1)}).then(res => {
        carregarHorari();
        revisarNotificacio();
    }).catch(err => {
        alert(err.response.data.message);
    });
}

function mostrarDia(date = new Date()) {
    const dies = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
    const avui = dies[date.getDay()];
    $('#dia-avui')[0].innerText = `${avui} ${date.toLocaleDateString()}`;
}