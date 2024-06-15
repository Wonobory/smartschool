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
}

if (window.location.pathname === '/admin') {
    carregarTreballadors()
} else if (window.location.pathname.includes('/admin/treballador')) {
    carregarTreballador(dades)
} else if (window.location.pathname.includes('/admin/trajectes')) {
    carregarTrajectes()
    carregarInfo(dades.nom, dades.cognom, dades.rol, dades.foto_perfil)

    $('#mostrar-pagats')[0].addEventListener('change', () => {
        carregarTrajectes()
    })
    contarKm()
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