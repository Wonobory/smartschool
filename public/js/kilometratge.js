async function carregarTrajectes() {
    const trajectesContainer = $('.trajectes')
    
    axios.get('/trajectes').then(res => {
        /*
        [
            { dia: '2024-06-12', trajectes: [ [Object], [Object] ] },
            { dia: '2024-06-11', trajectes: [ [Object] ] }
        ]
        */

        
        res.data.sort((a, b) => {
            return parseInt(b.dia.slice(8, 10)) - parseInt(a.dia.slice(8, 10));
        });

        const trajectes = res.data
        const trajectesAddAll = $('.trajectes')[0]
        trajectesAddAll.innerHTML = ''

        let totalKm = 0

        var mostrarTrajectesPagats = $('#mostrar-trajectes-pagats')[0].checked
        let totalTotalTrajectes = 0
        
        for (var i = 0; i < trajectes.length; i++) {
            const trajecteContainer = document.createElement('div')

            const [any, mes, dia] = trajectes[i].dia.split('-')
            const trajecteDia = document.createElement('h5')
            trajecteDia.className = 'trajecte-dia'
            trajecteDia.textContent = `${dia}/${mes}/${any}`
            trajecteContainer.appendChild(trajecteDia)

            let totalTrajectes = 0
            for (var j = 0; j < trajectes[i].trajectes.length; j++) {
                if (!mostrarTrajectesPagats && trajectes[i].trajectes[j].pagat) {
                    continue
                }
                totalTrajectes++
                totalTotalTrajectes++

                const trajecte = trajectes[i].trajectes[j]
                
                const trajecteContainer2 = document.createElement('div')
                trajecteContainer2.className = 'trajecte'
                

                const trajecteOrigen = document.createElement('span')
                trajecteOrigen.className = 'lloc'
                trajecteOrigen.innerText = trajecte.origen
                
                
                const trajecteContainer3 = document.createElement('div')
                const km = document.createElement('span')
                km.innerText = trajecte.km + ' km'
                
                const arrow = document.createElement('img')
                arrow.src = '/svg/arrow2.svg'
                
                
                const trajecteDesti = document.createElement('span')
                trajecteDesti.className = 'lloc'
                trajecteDesti.innerText = trajecte.desti
                

                if (!trajecte.pagat) {
                    totalKm += trajecte.km
                } else {
                    trajecteContainer2.classList.add('pagat')
                }

                trajecteContainer.appendChild(trajecteContainer2)
                trajecteContainer2.appendChild(trajecteOrigen)
                trajecteContainer3.appendChild(km)
                trajecteContainer3.appendChild(arrow)
                trajecteContainer2.appendChild(trajecteContainer3)
                trajecteContainer2.appendChild(trajecteDesti)
            }
            const trajectesDia = document.createElement('div')
            trajectesDia.className = 'trajectes-dia'

            if (totalTrajectes == 0) {
                continue
            }

            trajectesDia.appendChild(trajecteContainer)
            
            trajectesAddAll.appendChild(trajectesDia)
        }
        console.log(totalTotalTrajectes)
        if (totalTotalTrajectes == 0) {
            console.log('no trajectes')
            const noTrajectes = document.createElement('span')
            noTrajectes.className = 'no-trajectes'
            noTrajectes.innerText = 'No tens cap trajecte'
            trajectesAddAll.appendChild(noTrajectes)
        
        }
        const km = $('#total-km')[0]
        km.innerHTML = totalKm.toFixed(2) + ' km'
            
}).catch(err => {
    console.error(err)
})
}

