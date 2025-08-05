// Variáveis globais
let movie = {}; // Objeto para armazenar o esporte atual
let sportsList = []; // Lista de todos os esportes carregados
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 9; // mostra as tentativas restantes

// Função assíncrona para carregar os dados do esporte a partir de um arquivo JSON
async function loadMovieData() {
    try {
        const response = await fetch("Esportes.json"); // Faz uma requisição para carregar o arquivo JSON
        if (!response.ok) {
            throw new Error('Erro ao carregar os dados do Esporte'); // Lança um erro se a resposta não for bem-sucedida
        }
        sportsList = await response.json(); // Converte a resposta em um objeto JSON
        movie = selectRandomMovie(sportsList); // Seleciona um esporte aleatório
    } catch (error) {
        console.error(error); // Exibe o erro no console
        alert('Não foi possível carregar os dados do Esporte. Tente novamente mais tarde.'); // Mostra um alerta ao usuário
    }
}

// Seleciona um esporte aleatório da lista de esportes
function selectRandomMovie(movies) {
    const randomIndex = Math.floor(Math.random() * movies.length); // Gera um índice aleatório
    return movies[randomIndex]; // Retorna o esporte correspondente ao índice
}

document.getElementById("voltar").addEventListener("click", function () {
    window.history.back();
});

// Verifica o palpite do usuário ao pressionar "Enter"
document.getElementById("guessInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const guess = document.getElementById("guessInput").value.trim(); // Captura o palpite do usuário
        const feedback = document.getElementById("feedback");

        const guessedMovie = sportsList.find(m => m.Nome === guess); // Busca o esporte correspondente ao palpite

        if (guessedMovie) {
            checkGuess(guessedMovie); // Verifica o palpite
        } else {
            feedback.textContent = "esporte não encontrado. Tente novamente!"; // Mensagem de erro para palpites inválidos
            feedback.className = "feedback incorrect";
            document.getElementById("giveUpButton").style.display = "inline-block";
        }

        document.getElementById("guessInput").value = ""; // Limpa o campo de entrada
    }
});

// Verifica se o palpite está correto ou incorreto
function checkGuess(guessedMovie) {
    const feedback = document.getElementById("feedback");

    if (guessedMovie.Nome === movie.Nome) {
        feedback.textContent = `Parabéns! Você acertou: ${movie.Nome}`; // Mensagem de acerto
        feedback.className = "feedback correct";
        revealAllHints(); // Revela todas as dicas
        document.getElementById("hintButton").style.display = "none";
        document.getElementById("giveUpButton").style.display = "none";
        tentativas = 0;
        // Desabilita o campo de entrada
        const guessInput = document.getElementById("guessInput");
        guessInput.disabled = true;
        guessInput.placeholder = "O jogo terminou!";
        guessInput.style.backgroundColor = "#f0f0f0";
    } else if (tentativas === 1) {
        const feedback = document.getElementById("feedback");
        feedback.textContent = `Você Perdeu! O esporte era: ${movie.Nome}`; // Exibe o título do esporte
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
    } else {
        feedback.textContent = "Palpite incorreto. Tente novamente!"; // Mensagem de erro
        feedback.className = "feedback incorrect";
        tentativas = tentativas - 1;
        if (movie.ambientePraticado === guessedMovie.ambientePraticado) {
            updateHint("hint1", `- Ambiente Praticado: ${movie.ambientePraticado}`);
        }
        if (movie.criador === guessedMovie.criador) {
            updateHint("hint2", `- Criador: ${movie.criador}`);
        }
        if (movie.year === guessedMovie.year) {
            updateHint("hint3", `- Ano de Criação: ${movie.year}`);
        }
        if (movie.maiorJogador === guessedMovie.maiorJogador) {
            updateHint("hint4", `- Maior Jogador: ${movie.maiorJogador}`);
        }
    }
    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/9"; // Exibe a quantidade de tentativas restantes
}

// Revela todas as dicas relacionadas ao esporte
function revealAllHints() {
    updateHint("hint1", `- Ambiente Praticado: ${movie.ambientePraticado}`);
    updateHint("hint2", `- Criador: ${movie.criador}`);
    updateHint("hint3", `- Ano de Criação: ${movie.year}`);
    updateHint("hint4", `- Maior Jogador: ${movie.maiorJogador}`);
    updateHint("hint5", `- Objetivo do Jogo: ${movie.objetivo}`);
    allHintsRevealed = true; // Marca que todas as dicas foram reveladas
    tentativas = 0;
    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/9"; // Exibe a quantidade de tentativas restantes
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
    feedback.textContent = `Você desistiu! O esporte era: ${movie.nome}`; // Exibe o título do esporte
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
        { id: "hint1", text: `- Ambiente Praticado: ${movie.ambientePraticado}` },
        { id: "hint2", text: `- Criador: ${movie.criador}` },
        { id: "hint3", text: `- Ano de Criação: ${movie.year}` },
        { id: "hint4", text: `- Maior Jogador: ${movie.maiorJogador}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);
        return hintElement.textContent.includes("???"); // Filtra as dicas que ainda não foram reveladas
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text); // Revela uma dica aleatória
        tentativas = tentativas - 2
    } else {
        updateHint("hint5", `- Objetivo do Jogo: ${movie.objetivo}`); // Revela a Objetivo do Jogo se todas as outras dicas já foram mostradas
        allHintsRevealed = true; // Marca que todas as dicas foram reveladas
        tentativas = 1;
    }

    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/9"; // Exibe a quantidade de tentativas restantes
}

// Atualiza o texto de uma dica na interface
function updateHint(id, text) {
    const hint = document.getElementById(id);
    hint.textContent = text; // Define o texto da dica
    hint.classList.add("revealed"); // Adiciona a classe de revelação
}

// Carrega os dados do esporte ao carregar o script
loadMovieData();
