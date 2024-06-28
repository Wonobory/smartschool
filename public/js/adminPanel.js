const MOTIUS = ["Festiu", "Canvi de torn", "Personal", "Absentisme", "Baixa mèdica", "Permís retribuït", "Vacances"];
var horariDies = [];
var rols;

function carregarTreballadors() {
    axios.get('/treballadors', {params: {query: $('#search-bar')[0].value}}).then(res => {
        const table = $('.treballadors-table')[0]

        console.log(res.data)

        while (table.rows.length > 1) {
            table.deleteRow(1);
        }

        res.data.forEach(treballador => {
            table.innerHTML += `
                <tr onclick='window.location.href = "/admin/treballador/${treballador.id}"'>
                    <td>${treballador.id}</td>
                    <td>${treballador.nom}</td>
                    <td>${treballador.cognom}</td>
                    <td>${treballador.rol}</td>
                    <td>${treballador.horesSetmanals}h</td>
                    <td>${treballador.balançHores.toFixed(2)}h</td>
                    <td class="estat">${treballador.estat ? 'Inactiu' : 'Actiu'}</td>
                </tr>
            `
        })
                
    })
}

/*
    estara en el document ehhe
    const dades = {
            nom: result[0].nom,
            cognom: result[0].cognom,
            role: result[0].role == -1 ? 'Inactiu' : (result[0].genere ? rol.nom_f : rol.nom_m),
            horesContracte: result[0].hores_contracte,
            trajectes: totalKm,
            balançHores: await calcularBalançHores(req.params.id),
            horesValidades: horesValidades,
            absencies: absencies.length,
            absenciesHores: absenciesH,
            foto_perfil: result[0].foto_perfil,
        }
*/

function carregarTreballador(dades) {
    
    carregarInfo(dades.nom, dades.cognom, dades.role, dades.foto_perfil)

    const horesContracte = $('#hores-contracte')[0]
    const trajectes = $('#trajectes')[0]
    const balançHores = $('#balanç-hores')[0]
    const horesValidades = $('#hores-validades')[0]
    const absencies = $('#absencies')[0]

    horesContracte.innerText = dades.horesContracte + 'h'
    trajectes.innerText = dades.trajectes.toFixed(2) + 'km'
    balançHores.innerText = dades.balançHores.toFixed(2) + 'h'
    horesValidades.innerText = dades.horesValidades.toFixed(2) + 'h'
    absencies.innerText = `${dades.absencies} | ${dades.absenciesHores.toFixed(2)}h`

    const infoTrajectes = $('#info-trajectes')[0]
    infoTrajectes.href = `/admin/trajectes/${dades.id}`

    const infoBalanç = $('#info-balanç')[0]
    infoBalanç.href = `/admin/hores/${dades.id}`

}


if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
    carregarTreballadors()
} else if (window.location.pathname.includes('/admin/treballador') && !window.location.pathname.includes('/afegir')) {
    carregarTreballador(dades)
    drawHorari(dades.horari)
} else if (window.location.pathname.includes('/admin/trajectes')) {
    carregarTrajectes()
    carregarInfo(dades.nom, dades.cognom, dades.rol, dades.foto_perfil)

    $('#mostrar-pagats')[0].addEventListener('change', () => {
        carregarTrajectes()
    })
    contarKm()
} else if (window.location.pathname.includes('/admin/hores')) {
    carregarHores()
    carregarInfo(dades.nom, dades.cognom, dades.rol, dades.foto_perfil)
    carregarHoresMes()
    gestionarDeFins()
} else if (window.location.pathname.includes('/admin/treballadors/afegir')) {
    carregarAfegirNouTreballador()
}

function gestionarDeFins() {
    const inputs = $('.defins')
    inputs.each(i => {
        inputs[i].onchange = () => {
            if (inputs[i].id == 'data-inici' && new Date($('#data-final')[0].value) < new Date(inputs[i].value)) {
                $('#data-final')[0].value = inputs[i].value
            } else if (inputs[i].id == 'data-final' && new Date($('#data-inici')[0].value) > new Date(inputs[i].value)) {
                $('#data-inici')[0].value = inputs[i].value
            }

            carregarHoresMes()
        }
    })
}

function carregarInfo(nom, cognom, rol, fotoPerfil) {
    $('#nom')[0].innerText = nom
    $('#cognom')[0].innerText = cognom
    $('#rol')[0].innerText = rol
    $('#foto-perfil').attr('src', `/uploads/${fotoPerfil}`)
}

function carregarTrajectes() {
    /*
    X id: result[0].id,
    X nom: result[0].nom,
    X cognom: result[0].cognom,
    X rol: result[0].role == -1 ? 'Inactiu' : (result[0].genere ? rol.nom_f : rol.nom_m),
    totalKm: totalKm,
    trajectes: trajectes,
    X foto_perfil: result[0].foto_perfil
    */
    
    let dades2 = Object.create(dades)
    console.log(dades.trajectes)

    if (!$('#mostrar-pagats')[0].checked) {
        console.log('no pagats')
        dades2.trajectes = dades2.trajectes.filter(trajecte => !trajecte.pagat)
        //el que fa es
    }

    console.log(dades2.trajectes)

    

    const table = $('#trajectes-table')[0]

    while (table.rows.length > 1) {
        $('#trajectes-table')[0].deleteRow(1);
    }

    dades2.trajectes.forEach(trajecte => {
        const table = $('#trajectes-table')[0]

        const dia = adjustTimezone(trajecte.dia).toISOString().split('T')[0].split('-').reverse().join('/')
        table.innerHTML += `
            <tr onclick='seleccionarTrajecte("${trajecte.id}")'>
                <td><input type="checkbox" class="trajecte" onchange="contarKm()" data-trajecte-id="${trajecte.id}"></td>
                <td>${dia}</td>
                <td>${trajecte.origen}</td>
                <td>${trajecte.desti}</td>
                <td class='km' data-trajecte-id='${trajecte.id}'>${trajecte.km.toFixed(2)}km</td>
                <td>${trajecte.pagat ? "<span class='pagat'>Pagat</span>" : "<span class='no-pagat'>No pagat</span>"}</td>
            </tr>
        `
    })

    for (var i = 0; i < dades2.trajectes.length; i++) {
        const id = dades2.trajectes[i].id
        $(`input[data-trajecte-id="${id}"]`)[0].addEventListener('click', (e) => {
            e.stopPropagation()
        })
    }
}

function pagarTrajectes() {
    let trajectesId = []
    const checkboxes = $('.trajecte')
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            trajectesId.push(parseInt(checkboxes[i].getAttribute('data-trajecte-id')))
        }
    }

    axios.post('/admin/pagar-trajecte', {
        id: trajectesId
    }).then(res => {
        console.log(res.data)
        window.location.reload()
    }).catch(err => {
        console.error(err)
    })
    console.log(trajectesId)
}

function contarKm() {
    let km = 0
    const checkboxes = $('.trajecte')
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            km += parseFloat($(`.km[data-trajecte-id="${parseInt(checkboxes[i].getAttribute('data-trajecte-id'))}"]`)[0].innerText.split('km')[0])
        }
    }

    $('#km-trajectes')[0].innerText = km.toFixed(2) + 'km'
}

function eliminarTrajectes() {
    let trajectesId = []
    const checkboxes = $('.trajecte')
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            trajectesId.push(parseInt(checkboxes[i].getAttribute('data-trajecte-id')))
        }
    }

    axios.post('/admin/eliminar-trajecte', {
        id: trajectesId
    }).then(res => {
        console.log(res.data)
        window.location.reload()
    }).catch(err => {
        console.error(err)
    })
    console.log(trajectesId)
}

function seleccionarTrajecte(id) {
    const checkbox = $(`input[data-trajecte-id="${id}"]`)[0]
    checkbox.checked = !checkbox.checked
    contarKm()
}


function adjustTimezone(dateString) {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - userTimezoneOffset);
    return localDate;
}

function seleccionarTots() {
    const checkboxes = $('.trajecte')
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = true
    }
}

function carregarHoresMes() {
    axios.get('/admin/api/hores/' + dades.id, { params: {
        from: $('#data-inici')[0].value,
        to: $('#data-final')[0].value
    }}).then(res => {
        const table = $('#hores-table')[0]
        let calendari = []

        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    
        res.data.hores_validades.forEach(hores => {
            let toAdd = {
                data: hores.dia,
                hores_validades: contarHores(JSON.parse(hores.horari)),
                hores_esperades: contarHores(JSON.parse(hores.horari_esperat)),
                canvi_en_balanç: contarHores(JSON.parse(hores.horari)) - contarHores(JSON.parse(hores.horari_esperat)),
                type: 0,
                id: hores.id,
                horari_esperat: hores.horari_esperat,
                horari_validat: hores.horari
            }

            calendari.push(toAdd)
        })

        res.data.absencies.forEach(absencia => {
            let toAdd = {
                data: absencia.dia,
                hores_validades: 0,
                hores_esperades: contarHores(JSON.parse(absencia.horari_esperat)),
                canvi_en_balanç: absencia.computen ? 0 : -contarHores(JSON.parse(absencia.horari_esperat)),
                type: 1,
                id: absencia.id,
                motiu: MOTIUS[absencia.motiu-1],
                horari_esperat: absencia.horari_esperat,
                horari_validat: "[]"
            }

            calendari.push(toAdd)
        })

        res.data.dies_pendents.forEach(dia => {
            let toAdd = {
                data: dia.dia,
                hores_validades: 0,
                hores_esperades: contarHores(JSON.parse(dia.horari_esperat)),
                canvi_en_balanç: -contarHores(JSON.parse(dia.horari_esperat)),
                type: 2,
                id: dia.id,
                horari_esperat: dia.horari_esperat,
                horari_validat: "[]",
            }

            calendari.push(toAdd)
        })

        res.data.regularitzacions.forEach(regularitzacio => {
            let toAdd = {
                data: regularitzacio.dia,
                hores_validades: 'Regularització: ' + (regularitzacio.hores).toFixed(2),
                hores_esperades: 0,
                canvi_en_balanç: -regularitzacio.hores,
                type: 3,
                id: regularitzacio.id
            }
    
            calendari.push(toAdd)
        })

        calendari.sort((a, b) => {
            return new Date(b.data) - new Date(a.data)
        })

        // {data, hores_validades, hores_esperades, canvi_en_balanç, type, id}
        // type = 0 -> hores validades
        // type = 1 -> absencies
        // type = 2 -> dies pendents
        // type = 3 -> regularitzacions

        let x = 0
        calendari.forEach(dia => {
            const data = adjustTimezone(dia.data).toISOString().split('T')[0].split('-').reverse().join('/')
            switch (dia.type) {
                case 0:
                    table.innerHTML += `
                        <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                            <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                            <td>${data}</td>
                            <td>${dia.hores_validades.toFixed(2)}h</td>
                            <td>${dia.hores_esperades.toFixed(2)}h</td>
                            <td>${horariArrayToText(dia.horari_esperat)}</td>
                            <td>${horariArrayToText(dia.horari_validat)}</td>
                            <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
                        </tr>
                    `
                    break;
                case 1:
                    table.innerHTML += `
                        <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                            <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                            <td>${data}</td>
                            <td><img src="/svg/alerta.svg" title="Motiu de l'absència: ${dia.motiu}">${dia.hores_validades.toFixed(2)}h</td>
                            <td>${dia.hores_esperades.toFixed(2)}h</td>
                            <td>${horariArrayToText(dia.horari_esperat)}</td>
                            <td>${horariArrayToText(dia.horari_validat)}</td> 
                            <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
                        </tr>
                    `
                    break;
                case 2:
                    table.innerHTML += `
                        <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                            <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                            <td>${data}</td>
                            <td>${dia.hores_validades.toFixed(2)}h</td>
                            <td>${dia.hores_esperades.toFixed(2)}h</td>
                            <td>${horariArrayToText(dia.horari_esperat)}</td>
                            <td>${horariArrayToText(dia.horari_validat)}</td>
                            <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
                            <td></td>
                        </tr>
                    `
                    break
                case 3:
                    table.innerHTML += `
                        <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                            <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                            <td>${data}</td>
                            <td>${dia.hores_validades}h</td>
                            <td>${dia.hores_esperades.toFixed(2)}h</td>
                            <td> - </td>
                            <td> - </td>
                            <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
                        </tr>
                    `
                    break
            }
            x++
        })
    }).catch(err => {
        console.error(err)
    })
}

function horariArrayToText(horari) {
    /*
    FORMAT: [["10:30","13:30"]]
    TO: 10:30 - 13:30
    */
    horari = JSON.parse(horari)
    let text = ''
    if (horari.length == 0) return ' - '
    for (var i = 0; i < horari.length; i++) {
        text += horari[i][0] + ' - ' + horari[i][1]
        if (i != horari.length - 1) text += ', '
    }
    return text
}

function carregarHores() {
    var date = new Date();
    $('#data-final')[0].value = new Date(date.getFullYear(), date.getMonth() + 1, 0+1).toISOString().split('T')[0] //ultim dia del mes
    $('#data-inici')[0].value = new Date(date.getFullYear(), date.getMonth(), 1+1).toISOString().split('T')[0]

    const table = $('#hores-table')[0]

    $('#balanç-hores')[0].innerText = dades.balançHores.toFixed(2) + 'h'
    $('#balanç-hores-modal')[0].innerText = dades.balançHores.toFixed(2) + 'h'


    /*
    id: result[0].id,
    nom: result[0].nom,
    cognom: result[0].cognom,
    rol: result[0].role == -1 ? 'Inactiu' : (result[0].genere ? rol[0].nom_f : rol[0].nom_m),
    absencies: absencies,
    hores_validades: hores_validades,
    dies_pendents: diesPendents,
    balançHores: await calcularBalançHores(req.params.id),
    */

    // {data, hores_validades, hores_esperades, canvi_en_balanç, type, id}
    // type = 0 -> hores validades
    // type = 1 -> absencies
    // type = 2 -> dies pendents
    // type = 3 -> regularitzacions

    let calendari = []

    
    dades.hores_validades.forEach(hores => {
        let toAdd = {
            data: hores.dia,
            hores_validades: contarHores(JSON.parse(hores.horari)),
            hores_esperades: contarHores(JSON.parse(hores.horari_esperat)),
            canvi_en_balanç: contarHores(JSON.parse(hores.horari)) - contarHores(JSON.parse(hores.horari_esperat)),
            type: 0,
            id: hores.id
        }

        calendari.push(toAdd)
    })

    dades.absencies.forEach(absencia => {
        let toAdd = {
            data: absencia.dia,
            hores_validades: 0,
            hores_esperades: contarHores(JSON.parse(absencia.horari_esperat)),
            canvi_en_balanç: absencia.computen ? 0 : -contarHores(JSON.parse(absencia.horari_esperat)),
            type: 1,
            id: absencia.id,
            motiu: MOTIUS[absencia.motiu-1]
        }

        calendari.push(toAdd)
    })

    dades.dies_pendents.forEach(dia => {
        let toAdd = {
            data: dia.dia,
            hores_validades: 0,
            hores_esperades: contarHores(JSON.parse(dia.horari_esperat)),
            canvi_en_balanç: -contarHores(JSON.parse(dia.horari_esperat)),
            type: 2,
            id: dia.id
        }

        calendari.push(toAdd)
    })

    dades.regularitzacions.forEach(regularitzacio => {
        let toAdd = {
            data: regularitzacio.dia,
            hores_validades: 'Regularització: ' + (regularitzacio.hores).toFixed(2),
            hores_esperades: 0,
            canvi_en_balanç: -regularitzacio.hores,
            type: 3,
            id: regularitzacio.id
        }

        calendari.push(toAdd)
    })

    calendari.sort((a, b) => {
        return new Date(b.data) - new Date(a.data)
    })

    let x = 0
    calendari.forEach(dia => {
        const data = adjustTimezone(dia.data).toISOString().split('T')[0].split('-').reverse().join('/')
        if (dia.type != 1 && dia.type != 3) {
            table.innerHTML += `
                <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                    <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                    <td>${data}</td>
                    <td>${dia.hores_validades.toFixed(2)}h</td>
                    <td>${dia.hores_esperades.toFixed(2)}h</td>
                    <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
                </tr>
            `
        } else if (dia.type == 1) {
            table.innerHTML += `
            <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                <td>${data}</td>
                <td><img src="/svg/alerta.svg" title="Motiu de l'absència: ${dia.motiu}">${dia.hores_validades.toFixed(2)}h</td>
                <td>${dia.hores_esperades.toFixed(2)}h</td>
                <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
            </tr>
        ` 
        } else if (dia.type == 3) {
            table.innerHTML += `
                <tr onclick='$(\`input[data-i="${x}"]\`)[0].checked = !$(\`input[data-i="${x}"]\`)[0].checked'>
                    <td><input type="checkbox" data-type="${dia.type}" data-id="${dia.id}" data-i="${x}" class="hores"></td>
                    <td>${data}</td>
                    <td>${dia.hores_validades}h</td>
                    <td>${dia.hores_esperades.toFixed(2)}h</td>
                    <td>${dia.canvi_en_balanç.toFixed(2)}h</td>
                </tr>
            `
        }
        x++
    })

    x = 0
    calendari.forEach(dia => {
        $(`input[data-i="${x}"]`)[0].addEventListener('click', (e) => {
            e.stopPropagation()
        })
        x++
    })
}

function eliminarRegistresHores() {
    let horesId = []
    const checkboxes = $('.hores')
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            horesId.push({
                id: parseInt(checkboxes[i].getAttribute('data-id')),
                type: parseInt(checkboxes[i].getAttribute('data-type'))
            })
        }
    }

    axios.post('/admin/eliminar-registre', {
        id: horesId
    }).then(res => {
        console.log(res.data)
        window.location.reload()
    }).catch(err => {
        console.error(err)
    })
    console.log(horesId)

}

function regularitzarHores() {
    const hores = parseFloat($('#hores-regularitzar')[0].value)
    const treballador_id = dades.id

    axios.post('/admin/regularitzar-hores', { amount: hores, treballador_id }).then(res => {
        console.log(res.data)
        window.location.reload()
    }).catch(err => {
        console.error(err)
    })
}

function seleccionarTotsHores() {
    const checkboxes = $('.hores')
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = true
    }
}

function contarHores(horari) {
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

function afegirDiaAlHorari(dia, from, to) {
    /*
    [
        {"dia":1,
            "horari": [
                [
                    "10:30",
                    "13:30"
                ]
            ]
        },
        {"dia":2,
            "horari": [
                [
                    "10:30",
                    "13:30"
                ]
            ]
        }
    ]*/

    let trobat = false
    //check if dia is already in horariDies
    for (var i = 0; i < horariDies.length; i++) {
        if (horariDies[i].dia == dia) {
            horariDies[i].horari.push([from, to])
            trobat = true
            break
        }
    }

    if (!trobat) {
        horariDies.push({
            dia: dia,
            horari: [[from, to]]
        })
    }


    console.log(horariDies)
    drawHorari(horariDies, true)
}

function afegirInputsAlHorari() {
    const dia = $('#dia-setmana')[0]
    const from = $('#inici-time')[0]
    const to = $('#final-time')[0]

    const timeFrom = from.value.split(':');
    const timeTo = to.value.split(':');

    const h1 = parseInt(timeFrom[0]) + parseInt(timeFrom[1]) / 60;
    const h2 = parseInt(timeTo[0]) + parseInt(timeTo[1]) / 60;

    if (!dia.reportValidity() || !from.reportValidity() || !to.reportValidity()) {
        return
    }

    if (h2 < h1 || h2 === h1) {
        console.log(h2, h1)
        from.setCustomValidity('Hora de final inferior a la d\'inici')
        from.reportValidity()
        return
    }

    if (isNaN(h2) || isNaN(h1)) {
        from.setCustomValidity('Franja de temps buida')
        from.reportValidity()
        return
    }

    afegirDiaAlHorari(parseInt(dia.value), from.value, to.value)
}

function carregarAfegirNouTreballador() {
    //Carregar el select dels rols que hi han
    const rolsSelect = $('#rols')[0]
    axios.get('/admin/api/rols').then(res => {
        rolsSelect.innerHTML = ''
        rols = res.data
        res.data.forEach(rol => {
            rolsSelect.innerHTML += `
                <option value="${rol.id}">${rol.nom_m}</option> 
            `
        })
    }).catch(err => {
        console.error(err)
    })
}

function crearNouTreballador() {
    const nom = $('#nom-input')[0]
    const cognoms = $('#cognoms')[0]
    const genere = $('#genere')[0]
    const hores = $('#hores-contracte')[0]
    const rol = $('#rols')[0]
    const email = $('#email')[0]
    const password = $('#password')[0]

    const repeatPassword = $('#password-repeat')[0]
    const horari = horariDies

    if (!nom.reportValidity() || !cognoms.reportValidity() || !genere.reportValidity() || !hores.reportValidity() || !rol.reportValidity() || !email.reportValidity() || !password.reportValidity() || !repeatPassword.reportValidity()) {
        return
    }

    if (password.value != repeatPassword.value) {
        repeatPassword.setCustomValidity('Les contrasenyes no coincideixen')
        repeatPassword.reportValidity()
        return
    }
    
    axios.post('/admin/api/registrar-treballador', {
        nom: nom.value,
        cognom: cognoms.value,
        genere: genere.value,
        hores_mensuals: hores.value,
        rol: rol.value,
        email: email.value,
        password: password.value,
        horari: horari
    }).then(res => {
        console.log(res.data)
        window.location.href = '/admin'
    }).catch(err => {
        console.error(err)
    })
}