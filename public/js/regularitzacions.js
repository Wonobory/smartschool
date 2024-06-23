function carregarRegularitzacions() {
    axios.get('/regularitzacions').then(res => {
        console.log(res.data)
        

        let canvis = [];
        let balanç = 0;

        res.data.diesPendents.forEach(dia => {
            canvis.push({
                dia: dia,
                canviBalanç: -contarHores(dia.horari_esperat)
            })

            balanç -= contarHores(dia.horari_esperat);
        })

        res.data.horarisValidats.forEach(dia => {
            if ((contarHores(dia.horari) - contarHores(dia.horari_esperat)) != 0) {
                canvis.push({
                    dia: dia,
                    canviBalanç: contarHores(dia.horari) - contarHores(dia.horari_esperat)
                })
            }

            balanç += contarHores(dia.horari) - contarHores(dia.horari_esperat);
        })

        res.data.absencies.forEach(dia => {
            if (contarHores(dia.horari_esperat) > 0 && !dia.computen) {
                canvis.push({
                    dia: dia,
                    canviBalanç: -contarHores(dia.horari_esperat)
                })

                balanç -= contarHores(dia.horari_esperat);
            }
            
        })

        let totalReg = 0
        res.data.regularitzacions.forEach(dia => {
            totalReg += dia.hores
        })

        balanç -= totalReg;

        $('#registres')[0].innerHTML = '';

        console.log(totalReg)
        
        const div = document.createElement('div');
        div.className = 'registre-diari-menu-mensual-container';

        const div2 = document.createElement('div');
        div2.className = 'registre-diari-b1';
        
        const span = document.createElement('span');
        span.innerHTML = "Regularització:";

        const span2 = document.createElement('span');
        span2.innerHTML = (-totalReg).toFixed(2) + ' h';

        div2.appendChild(span);
        div2.appendChild(span2);
        div.appendChild(div2);
        
        const span3 = document.createElement('span');
        span3.className = 'registre-diari-hores';
                    
        $('#registres')[0].appendChild(div);


        let total = 0;
        
        canvis.forEach(dia => {
            const div = document.createElement('div');
            div.className = 'registre-diari-menu-mensual-container';
    
            const div2 = document.createElement('div');
            div2.className = 'registre-diari-b1';
            
            const span = document.createElement('span');
            span.innerHTML = new Date(dia.dia.dia).toISOString().slice(0, 10).split('-').reverse().join('/');
            span.style.textDecoration = 'none'
            span.style.fontWeight = '500'

            const span2 = document.createElement('span');
            span2.innerHTML = dia.canviBalanç.toFixed(2) + ' h';
            total += dia.canviBalanç;

            div2.appendChild(span);
            div2.appendChild(span2);
            div.appendChild(div2);
            
            const span3 = document.createElement('span');
            span3.className = 'registre-diari-hores';
                     
            $('#registres')[0].appendChild(div);
        })

        $('#balanç')[0].innerHTML = balanç.toFixed(2) + ' h';
    }).catch(err => {
        console.log(err)
    })
}

function contarHores(horari) {
    horari = JSON.parse(horari);
    let count = 0;
    for (var i = 0; i < horari.length; i++) {
        const time = horari[i][0].split(':');
        const time2 = horari[i][1].split(':');

        const h1 = parseInt(time[0]) + parseInt(time[1]) / 60;
        const h2 = parseInt(time2[0]) + parseInt(time2[1]) / 60;

        count += h2 - h1;
    }
    return count;
}
