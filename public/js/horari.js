const horari = JSON.parse(`[{"dia":1,"horari":[["10:30","13:30"]]},{"dia":2,"horari":[["10:30","13:30"]]},{"dia":3,"horari":[["10:30","13:30"]]},{"dia":4,"horari":[["10:30","13:30"]]},{"dia":5,"horari":[["10:30","13:30"]]},{"dia":6,"horari":[["10:30","13:30"]]}]`)

/*
<div class="horari-content">
    <img src="/svg/close.svg" alt="close" class="close-button">
    <span>12:30</span>
    <span> - </span>
    <span>14:30</span>
</div>
*/

function drawHorari(horari) {
    for (var i = 0; i < $('.dia').length; i++) {
        //delete all elements except the first
        $('.dia').eq(i).children().slice(1).remove();
    }

    horari.forEach(dia => {
        console.log(dia.dia)
        const $horari = $(`div[data-id=${dia.dia}]`)
        dia.horari.forEach(h => {
            const $horariContent = $('<div>').addClass('horari-content')
            const $closeButton = $('<img>').attr('src', '/svg/close.svg').attr('alt', 'close').addClass('close-button')
            const $start = $('<span>').text(h[0])
            const $separator = $('<span>').text(' - ')
            const $end = $('<span>').text(h[1])

            $horariContent.append($closeButton)
            $horariContent.append($start)
            $horariContent.append($separator)
            $horariContent.append($end)

            $horari.append($horariContent)
        })
    })
}