function carregarValidarHorarisAnteriors() {
    const where = $('#registres')[0]
    where.innerHTML = ''

    axios.get('/dies-pendents').then((res) => {
        if (res.data.length == 0) where.innerHTML = '<span>No tens cap horari pendent per validar</span>'
        for (var i = 0; i < res.data.length; i++) {
            const div = document.createElement('div')
            div.className = 'validar-horari-passat'

            const [any, mes, dia] = res.data[i].dia.split('-')
            div.onclick = () => {
                carregarPagina('/pages/validar_horari.html', 1, `${dia}-${mes}-${any}`)
            }

            const img = document.createElement('img')
            img.src = '/svg/alerta.svg'

            const span = document.createElement('span')
            span.innerHTML = `${dia}-${mes}-${any}`
            div.appendChild(img)
            div.appendChild(span)
            where.appendChild(div)
        }
    }).catch((err) => {
        console.error(err)
    })
}