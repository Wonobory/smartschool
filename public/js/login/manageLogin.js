function sendLogin(email, pass) {
    $.ajax({
        url: '/login',
        type: 'POST',
        data: {
            email: email,
            password: pass
        },
        success: function (data) {
            console.log(data);
            if (data.type == 'error') {
                errorMessage(document.getElementById('output'), data.message);
            } else if (data.type == 'done') {
                window.location.href = data.redirect;
            }
        }
    });
}

function errorMessage(append, message) {
    append.innerHTML = '';
    const div = document.createElement('div');
    div.innerText = message;
    div.className = 'alert alert-danger d-flex align-items-center';
    div.role = 'alert';
    append.appendChild(div);
}

$('#login').click(function () {
    const email = $('#email').val();
    const pass = $('#password').val();
    sendLogin(email, pass);
});