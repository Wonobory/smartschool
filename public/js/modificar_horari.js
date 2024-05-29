function carregarModificarHoraris() {
    axios.get('/horari-esperat').then(res => {
        const displayHorari = $('#display-horari')[0]
        displayHorari.innerHTML = '';

        //Per els casos en que no hi ha cap horari programat per aquell dia
        if (res.data.horari != null) {
            for (var i = 0; i < res.data.horari.length; i++) {
                afegirFranja(res.data.horari[i][0], res.data.horari[i][1], displayHorari, null);
            }
        }        

        const button = document.createElement('button');
        button.onclick = function() {
            afegirFranja('', '', displayHorari, this);
        }

        button.innerHTML = '+';
        button.className = 'btn btn-primary afegir-franja';
        displayHorari.appendChild(button);

        if (window.location.hash) {
            let [dia, mes, any] = window.location.hash.slice(1).split('-');
            mostrarDia(new Date(any, mes - 1, dia));
            
        } else {
            mostrarDia();
        }

        calcularHores();

        $('.modificar-button')[0].onclick = function() {
            // revisar si venim de validar un horari anterior o no
            if (window.location.hash) {
                carregarPagina('/pages/validar_horari.html', 1, window.location.hash.slice(1));
            } else {
                carregarPagina('/pages/validar_horari.html');
            }
        }
    })
}

function afegirFranja(inputVal1, inputVal2, where, button) {
    const div = document.createElement('div');
    const input = document.createElement('input');
    const input2 = document.createElement('input');
    const span = document.createElement('span');

    const img = document.createElement('img');
    img.src = '/svg/delete.svg';
    img.className = 'img-button';
    img.onclick = function() {
        where.removeChild(div);
        calcularHores();
    }

    input.onblur = function() {
        calcularHores();
    }

    input2.onblur = function() {
        calcularHores();
    }

    span.innerHTML = '-';
    
    input.type = 'time';
    input2.type = 'time';
    input.value = inputVal1;
    input2.value = inputVal2;

    div.appendChild(input);
    div.appendChild(span);
    div.appendChild(input2);
    div.appendChild(img);
    where.appendChild(div);

    if (button != null) {
        where.insertBefore(div, button);
    }
}

function calcularHores() {
    var count = 0
    const inputs = document.querySelectorAll('input[type=time]');
    
    let franjes = [];

    for (var i = 1; i < inputs.length; i+=2) {
        var lastStart = inputs[i-1].value;
        var lastEnd = inputs[i].value;

        const time = lastStart.split(':');
        const time2 = lastEnd.split(':');

        //treure el tag de classe malament si existeix
        const parent = inputs[i-1].parentElement;
        parent.classList.remove('input-malament-div');
        inputs[i-1].classList.remove('input-malament');
        inputs[i].classList.remove('input-malament');

        try {
            const h1 = parseInt(time[0]) + parseInt(time[1]) / 60;
            const h2 = parseInt(time2[0]) + parseInt(time2[1]) / 60;

            console.log(h1, h2)

            if (h2 < h1 || h2 === h1) {
                inputs[i-1].classList.add('input-malament');
                inputs[i].classList.add('input-malament');
                parent.classList.add('input-malament-div');
                throw new Error('Hora de final inferior a la d\'inici');
            }

            if (isNaN(h2) || isNaN(h1)) {
                throw new Error('Franja de temps buida');
            }

            for (var j = 0; j < franjes.length; j++) {
                if (h1 >= franjes[j][0] && h1 <= franjes[j][1]) {
                    inputs[i-1].classList.add('input-malament');
                    inputs[i].classList.add('input-malament');
                    parent.classList.add('input-malament-div');
                    throw new Error('Franja ja ocupada');
                }
                if (h2 >= franjes[j][0] && h2 <= franjes[j][1]) {
                    inputs[i-1].classList.add('input-malament');
                    inputs[i].classList.add('input-malament');
                    parent.classList.add('input-malament-div');
                    throw new Error('Franja ja ocupada');
                }

                //check if the old franja is inside the new one
                if (franjes[j][0] >= h1 && franjes[j][1] <= h2) {
                    inputs[i-1].classList.add('input-malament');
                    inputs[i].classList.add('input-malament');
                    parent.classList.add('input-malament-div');
                    throw new Error('Franja ja ocupada');
                }
            }

            count += h2 - h1;
            franjes.push([h1, h2]);
            
        } catch (e) {
            continue;
        }
        

        

    }
    $('.hores-amount')[0].innerHTML = count.toFixed(2);    
}

function validarHorariModificat() {
    const inputs = document.querySelectorAll('input[type=time]');
    let horari = [];

    for (var i = 1; i < inputs.length; i+=2) {
        horari.push([inputs[i-1].value, inputs[i].value]);
    }

    console.log(horari);

    axios.post('/validar-horari', {horari: horari}).then(res => {
        //revisar si venim de validar un horari anterior o no
        if (window.location.hash) {
            carregarPagina('/pages/validar_horari.html', 1, window.location.hash.slice(1));
            
        } else {
            carregarPagina('/pages/validar_horari.html');
        }
    }).catch(err => {
        console.error(err.response.data.message);
    })
}