const MOTIUS = ["Festiu", "Canvi de torn", "Personal", "Absentisme", "Baixa mèdica", "Permís retribuït", "Vacances"];
const MESOS = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];

function carregarRegistre() {
    axios.get('/registre-mensual').then(res => {
        const registres = $('#registres')[0];
        let data = res.data;

        let horesTotals = 0;

        data.sort((a, b) => {
            return parseInt(a.dia.slice(8, 10)) - parseInt(b.dia.slice(8, 10));
        });

        for (var i = 0; i < data.length; i++) {
            const div = document.createElement('div');
            div.className = 'registre-diari-menu-mensual-container';
    
            const div2 = document.createElement('div');
            div2.className = 'registre-diari-b1';
            
            const span = document.createElement('span');
            span.innerHTML = data[i].dia;

            const span2 = document.createElement('span');
            span2.innerHTML = data[i].hores.toFixed(2) + ' h';
            horesTotals += data[i].hores;

            div2.appendChild(span);
            div2.appendChild(span2);
            div.appendChild(div2);

            const div3 = document.createElement('div');
            div3.className = 'alert-container'
            
            const span3 = document.createElement('span');
            span3.className = 'registre-diari-hores';
            if (!data[i].validat) {
                const img = document.createElement('img')
                img.src = '/svg/alerta.svg'
                img.className = 'icon-small'
                div3.appendChild(img);

                const motiu = MOTIUS[data[i].motiu-1];
                span3.innerHTML = motiu;
            } else {
                for (var j = 0; j < data[i].horari.length; j++) {
                    span3.innerHTML += `${data[i].horari[j][0]} - ${data[i].horari[j][1]}`;
                    if (j < data[i].horari.length - 1) {
                        span3.innerHTML += ', '; //Per posar les putissimes comes de merda
                    }
                }
            }
                     
            div3.appendChild(span3);
            div.appendChild(div3);
            registres.appendChild(div);
        }
        $('#hores-totals-del-mes')[0].innerHTML = `${horesTotals.toFixed(2)}h`;
        $('#mes-any')[0].innerHTML = `${MESOS[parseInt(data[0].dia.slice(5, 7))-1].toUpperCase()} ${data[0].dia.slice(0, 4)}`;
        
    }).catch(err => {
        console.error(err.response.data.message);
    })
}
