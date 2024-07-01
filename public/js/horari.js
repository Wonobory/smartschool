function drawHorari(horari, edit = false) {
    for (var i = 0; i < $('.dia').length; i++) {
        //delete all elements except the first
        $('.dia').eq(i).children().slice(1).remove();
    }

    
    horari.forEach(dia => {
        console.log(dia.dia)
        const $horari = $(`div[data-id=${dia.dia}]`)
        let i = 0
        dia.horari.forEach(h => {
            const $horariContent = $('<div>').addClass('horari-content').attr('data-id', i)
            if (edit) {
                var $closeButton = $('<img>').attr('src', '/svg/close.svg').attr('alt', 'close').addClass('close-button').click(function () {
                    horariDies.map((dia) => {
                        if (dia.dia == $horari.attr('data-id')) {
                            dia.horari.splice($horariContent.attr('data-id'), 1)
                        }
                    })
                    drawHorari(horari, true)
                })
            }
            
            const $start = $('<span>').text(h[0])
            const $separator = $('<span>').text(' - ')
            const $end = $('<span>').text(h[1])

            $horariContent.append($closeButton)
            $horariContent.append($start)
            $horariContent.append($separator)
            $horariContent.append($end)

            $horari.append($horariContent)
            i++
        })
    })

    if (edit) horariDies = horari
}