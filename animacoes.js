// Variáveis globais
let animacoes = {}; // Objeto para armazenar o animação atual
let animacoesList = []; // Lista de todos os animações carregados
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 13; // mostra as tentativas restantes 
var guessInput = document.getElementById("guessInput");

// Função assíncrona para carregar os dados do animação a partir de um arquivo JSON
async function loadanimacoesData() {
    try {
        const response = await fetch("animacoes.json"); // Faz uma requisição para carregar o arquivo JSON
        if (!response.ok) {
            throw new Error('Erro ao carregar os dados do animaçõe'); // Lança um erro se a resposta não for bem-sucedida
        }
        animacoesList = await response.json(); // Converte a resposta em um objeto JSON
        animacoes = selectRandomanimacoes(animacoesList); // Seleciona um animação aleatório
    } catch (error) {
        console.error(error); // Exibe o erro no console
        alert('Não foi possível carregar os dados do animaçõe. Tente novamente mais tarde.'); // Mostra um alerta ao usuário
    }
}

// Seleciona um animação aleatório da lista de animações
function selectRandomanimacoes(animacoes) {
    const randomIndex = Math.floor(Math.random() * animacoes.length); // Gera um índice aleatório
    return animacoes[randomIndex]; // Retorna o animação correspondente ao índice
}

document.getElementById("voltar").addEventListener("click", function () {
    window.history.back();
});

//Função verifica o que está escrito
enviarButton.addEventListener("click",verificaDica)
function verificaDica (){
    const guess = document.getElementById("guessInput").value.trim(); // Captura o palpite do usuário
    if(guess === animacoes.title){
        alert('Parabains');
        revealAllHints();
        startNewGame();
      }else {
       tentativas = tentativas -1;
       alert('Tu erro Rapaiz');
       
      }
    }
    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/13"; // Exibe a quantidade de tentativas restantes

// Revela todas as dicas relacionadas ao animaçõe
function revealAllHints() {
    updateHint("hint1", `- Diretor: ${animacoes.director}`);
    updateHint("hint2", `- genero: ${animacoes.genre}`);
    updateHint("hint3", `- Protagonista: ${animacoes.MainCharacter}`);
    updateHint("hint4", `- Sinópse ${animacoes.synopsis}`);
    allHintsRevealed = true; // Marca que todas as dicas foram reveladas
    tentativas = 0;
    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/13"; // Exibe a quantidade de tentativas restantes
}

// Configura o evento de clique para o botão "Novo Jogo"
document.getElementById("newGameButton").addEventListener("click", startNewGame);

// Inicia um novo jogo, redefinindo variáveis e atualizando o estado da interface
function startNewGame() {
    location.reload();
}

// Configura o botão "Desistir"
document.getElementById("giveUpButton").addEventListener("click", giveUp);

// Função chamada quando o usuário desiste
function giveUp() {
    const feedback = document.getElementById("feedback");
    feedback.textContent = `Você desistiu! A animação era: ${animacoes.title}`; // Exibe o título do animaçõe
    feedback.className = "feedback incorrect";

    // Revela todas as dicas
    revealAllHints();

    // Oculta os botões "Desistir" e de dicas
    document.getElementById("hintButton").style.display = "none";
    document.getElementById("giveUpButton").style.display = "none";

    // Desabilita o campo de entrada
    const guessInput = document.getElementById("guessInput");
    guessInput.disabled = true;
    guessInput.placeholder = "O jogo terminou!";
    guessInput.style.backgroundColor = "#f0f0f0"; // Opcional: muda a cor de fundo para indicar desabilitado
}

// Configura evento de clique para o botão "Mostrar Dica"
document.getElementById("hintButton").addEventListener("click", () => {
    revealHint(); // Revela uma dica aleatória
    incorrectGuesses = 0; // Reseta o contador de erros
});

// Revela uma dica aleatória que ainda não foi mostrada
function revealHint() {
    const hints = [
        { id: "hint1", text: `- Diretor: ${animacoes.director}` },
        { id: "hint2", text: `- genero: ${animacoes.genre}` },
        { id: "hint3", text: `- Protagonista: ${animacoes.MainCharacter}` },
        { id: "hint4", text: `- Sinópse ${animacoes.synopsis}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);
        return hintElement.textContent.includes("???"); // Filtra as dicas que ainda não foram reveladas
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text); // Revela uma dica aleatória
        tentativas = tentativas - 3
    } else {
        updateHint("hint5", `- Objetivo do Jogo: ${animacoes.objetivo}`); // Revela a Objetivo do Jogo se todas as outras dicas já foram mostradas
        allHintsRevealed = true; // Marca que todas as dicas foram reveladas
        tentativas = 1;
    }

    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/13"; // Exibe a quantidade de tentativas restantes
}

// Atualiza o texto de uma dica na interface
function updateHint(id, text) {
    const hint = document.getElementById(id);
    hint.textContent = text; // Define o texto da dica
    hint.classList.add("revealed"); // Adiciona a classe de revelação
}




// Carrega os dados do animação ao carregar o script
loadanimacoesData();
