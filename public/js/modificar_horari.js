function carregarModificarHoraris() {
    axios.get('/horari-esperat').then(res => {
        console.log(res.data);
        /*
            horari:
                ['9:00', '13:00']
                ['17:00', '20:00']

            horesTotals:7
        */

        if (res.data.horari == null) {
            return
        }

        const displayHorari = $('#display-horari')[0]
        displayHorari.innerHTML = '';

        for (var i = 0; i < res.data.horari.length; i++) {
            const div = document.createElement('div');
            const input = document.createElement('input');
            const input2 = document.createElement('input');
            const span = document.createElement('span');

            input.onblur = function() {
                calcularHores();
            }

            input2.onblur = function() {
                calcularHores();
            }

            span.innerHTML = '-';
            
            input.type = 'time';
            input2.type = 'time';
            input.value = res.data.horari[i][0];
            input2.value = res.data.horari[i][1];

            div.appendChild(input);
            div.appendChild(span);
            div.appendChild(input2);
            displayHorari.appendChild(div);
        }

        const button = document.createElement('button');
        button.innerHTML = '+';
        button.className = 'btn btn-primary afegir-franja';
        displayHorari.appendChild(button);

        calcularHores();
    })
}

function calcularHores() {
    var count = 0
    const inputs = document.querySelectorAll('input[type=time]');
    
    for (var i = 1; i < inputs.length; i+=2) {
        var lastStart = inputs[i-1].value;
        var lastEnd = inputs[i].value;

        const time = lastStart.split(':');
        const time2 = lastEnd.split(':');

        try {
            const h1 = parseInt(time[0]) + parseInt(time[1]) / 60;
            const h2 = parseInt(time2[0]) + parseInt(time2[1]) / 60;

            if (h2 < h1) {
                throw new Error('Hora de final inferior a la d\'inici');
            }

            count += h2 - h1;
            
        } catch (e) {
            continue;
        }
        

        

    }
    $('.hores-amount')[0].innerHTML = count.toFixed(2);

    
}