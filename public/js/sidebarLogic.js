$('#toggle-menu').click(toggleSidebar);

function toggleSidebar() {
    $('.sidebar').toggleClass('collapsed');
    // .sidebar li
    for (var i = 0; i < $('.sidebar li').length; i++) {
        $('.sidebar li')[i].classList.toggle('collapsed-text')
    }
}
