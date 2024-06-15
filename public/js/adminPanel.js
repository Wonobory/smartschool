function carregarTreballadors() {
    axios.get('/treballadors').then(res => {
        const table = $('.treballadors-table')[0]

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
    
    const nom = $('#nom')[0]

    console.log(nom)
    const cognom = $('#cognom')[0]
    const rol = $('#rol')[0]
    const horesContracte = $('#hores-contracte')[0]
    const trajectes = $('#trajectes')[0]
    const balançHores = $('#balanç-hores')[0]
    const horesValidades = $('#hores-validades')[0]
    const absencies = $('#absencies')[0]

    $('#foto-perfil').attr('src', `/uploads/${dades.foto_perfil}`)

    nom.innerText = dades.nom
    cognom.innerText = dades.cognom
    rol.innerText = dades.role
    horesContracte.innerText = dades.horesContracte + 'h'
    trajectes.innerText = dades.trajectes.toFixed(2) + 'km'
    balançHores.innerText = dades.balançHores.toFixed(2) + 'h'
    horesValidades.innerText = dades.horesValidades.toFixed(2) + 'h'
    absencies.innerText = `${dades.absencies} | ${dades.absenciesHores.toFixed(2)}h`
}

if (window.location.pathname === '/admin') {
    carregarTreballadors()
} else if (window.location.pathname.includes('/admin/treballador')) {
    carregarTreballador(dades)
}
