function carregarPerfil() {
    axios.get('/perfil').then(res => {
        const ALTA = $('#data-alta')[0];
        const BALANÇ = $('#balanç-hores-extres')[0];
        const HORES = $('#hores-setmanals')[0];
        const pfp = $('.pfp')[0];

        pfp.src = `/uploads/${res.data.fotoPerfil}`;

        ALTA.innerText = res.data.dataAlta;
        BALANÇ.innerText = res.data.balançHores.toFixed(2) + 'h';
        HORES.innerText = res.data.horesSetmanals.toFixed(2) + 'h';
    }).catch(err => {
        console.error(err);
    });
}

/*

balançHores
: 
2

dataAlta
: 
"06/06/2024"

horesSetmanals
: 
3

*/