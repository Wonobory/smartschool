function carregarAfegirTrajecte() {
    const diaInput = $('#dia-trajecte')[0];
    diaInput.value = new Date().toISOString().split('T')[0];
    diaInput.max = diaInput.value;
}