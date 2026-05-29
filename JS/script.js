const btComeçar = document.getElementById("btComeçar");
const menssagemInicio = document.getElementById("menssagemInicio");
const partePrincipal = document.getElementById("partePrincipal");

btComeçar.addEventListener('click', começar);

function começar() {

    menssagemInicio.style.display = 'none';
    partePrincipal.style.display = 'block';
}