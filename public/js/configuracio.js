function carregaConfiguracio() {
    axios.get('/rebre-notificacions').then((res) => {
        $('#enviar-notificacions')[0].checked = res.data.notificacions;
    }).catch((err) => {
        console.log(err);
    })
    
    $('#boto-upload')[0].onclick = () => {
        $('#foto-perfil-upload')[0].click();
        console.log('click')
    }

    
    $('#foto-perfil-upload')[0].onchange = () => {
        const formData = new FormData();
        formData.append('file', $('#foto-perfil-upload')[0].files[0]);
        axios.post('/update-pfp', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((res) => {
            $('.pfp')[0].src = `/uploads/${res.data.filename}`;
        }).catch((err) => {
            console.log(err);
        })
            
    }

    $('#enviar-notificacions')[0].onclick = () => {
        axios.post('/cambiar-notificacions', {
            notificacions: $('#enviar-notificacions')[0].checked
        }).then((res) => {
            console.log(res);
        }).catch((err) => {
            console.log(err);
        })
    }
}

function cambiarEmail() {
    const email = $('#new-email')[0]
    const emailRepeat = $('#new-email-repeat')[0]

    if (!email.value.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
        email.setCustomValidity('Email no vàlid');
        email.reportValidity();
        return
    }

    if (email.value != emailRepeat.value) {
        emailRepeat.setCustomValidity('Els emails no coincideixen');
        emailRepeat.reportValidity();
        return;
    }

    axios.post('/canviar-email', {email: email.value}).then((res) => {
        console.log(res);
        carregarPaginaPerfil('/pages/configuracio_perfil.html')
    }).catch((err) => {
        alert(err.response.data.error)
        console.log(err);
    })
}

function canviarContrasenya() {
    const contrasenya = $('#new-password')[0]
    const contrasenyaRepeat = $('#new-password-repeat')[0]

    const oldPassword = $('#old-password')[0]

    if (contrasenya.value.length < 8) {
        contrasenya.setCustomValidity('La contrasenya ha de tenir almenys 8 caràcters');
        contrasenya.reportValidity();
        return
    }

    if (contrasenya.value != contrasenyaRepeat.value) {
        contrasenyaRepeat.setCustomValidity('Les contrasenyes no coincideixen');
        contrasenyaRepeat.reportValidity();
        return;
    }

    axios.post('/canviar-contrasenya', {newPass: contrasenya.value, oldPass: oldPassword.value}).then((res) => {
        console.log(res);
        carregarPaginaPerfil('/pages/configuracio_perfil.html')
    }).catch((err) => {
        alert(err.response.data.message)
        console.log(err);
    })
}

