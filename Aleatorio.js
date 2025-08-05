// Variáveis globais
let movie = {}; // Objeto para armazenar o filme atual
let moviesList = []; // Lista de todos os filmes carregados
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 12; // mostra as tentativas restantes

// Função assíncrona para carregar os dados do filme a partir de um arquivo JSON
async function loadMovieData() {
    try {
        const response = await fetch("filmes.json"); // Faz uma requisição para carregar o arquivo JSON
        if (!response.ok) {
            throw new Error('Erro ao carregar os dados do filme'); // Lança um erro se a resposta não for bem-sucedida
        }
        moviesList = await response.json(); // Converte a resposta em um objeto JSON
        movie = selectRandomMovie(moviesList); // Seleciona um filme aleatório
    } catch (error) {
        console.error(error); // Exibe o erro no console
        alert('Não foi possível carregar os dados do filme. Tente novamente mais tarde.'); // Mostra um alerta ao usuário
    }
}

// Seleciona um filme aleatório da lista de filmes
function selectRandomMovie(movies) {
    const randomIndex = Math.floor(Math.random() * movies.length); // Gera um índice aleatório
    return movies[randomIndex]; // Retorna o filme correspondente ao índice
}

document.getElementById("voltar").addEventListener("click", function() {
    window.history.back();
});


// Verifica o palpite do usuário ao pressionar "Enter"
document.getElementById("guessInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const guess = document.getElementById("guessInput").value.trim(); // Captura o palpite do usuário
        const feedback = document.getElementById("feedback");

        const guessedMovie = moviesList.find(m => m.title === guess); // Busca o filme correspondente ao palpite

        if (guessedMovie) {
            checkGuess(guessedMovie); // Verifica o palpite
        } else {
            feedback.textContent = "Filme não encontrado. Tente novamente!"; // Mensagem de erro para palpites inválidos
            feedback.className = "feedback incorrect";
            document.getElementById("giveUpButton").style.display = "inline-block";
        }

        document.getElementById("guessInput").value = ""; // Limpa o campo de entrada
    }
});

// Verifica se o palpite está correto ou incorreto
function checkGuess(guessedMovie) {
    const feedback = document.getElementById("feedback");

    if (guessedMovie.title === movie.title) {
        feedback.textContent = `Parabéns! Você acertou: ${movie.title}`; // Mensagem de acerto
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
        feedback.textContent = `Você Perdeu! O filme era: ${movie.title}`; // Exibe o título do filme
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
        if (movie.genre === guessedMovie.genre) {
            updateHint("hint1", `- Gênero: ${movie.genre}`);
        }
        if (movie.director === guessedMovie.director) {
            updateHint("hint2", `- Diretor: ${movie.director}`);
        }
        if (movie.year === guessedMovie.year) {
            updateHint("hint3", `- Ano de lançamento: ${movie.year}`);
        }
        if (movie.leadActor === guessedMovie.leadActor) {
            updateHint("hint4", `- Ator principal: ${movie.leadActor}`);
        }
    }
    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/12"; // Exibe a quantidade de tentativas restantes
}

// Revela todas as dicas relacionadas ao filme
function revealAllHints() {
    updateHint("hint1", `- Gênero: ${movie.genre}`);
    updateHint("hint2", `- Diretor: ${movie.director}`);
    updateHint("hint3", `- Ano de lançamento: ${movie.year}`);
    updateHint("hint4", `- Ator principal: ${movie.leadActor}`);
    updateHint("hint5", `- Sinopse: ${movie.synopsis}`);
    allHintsRevealed = true; // Marca que todas as dicas foram reveladas
    tentativas = 0;
    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/12"; // Exibe a quantidade de tentativas restantes
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
    feedback.textContent = `Você desistiu! O filme era: ${movie.title}`; // Exibe o título do filme
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
        { id: "hint1", text: `- Gênero: ${movie.genre}` },
        { id: "hint2", text: `- Diretor: ${movie.director}` },
        { id: "hint3", text: `- Ano de lançamento: ${movie.year}` },
        { id: "hint4", text: `- Ator principal: ${movie.leadActor}` }
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
        updateHint("hint5", `- Sinopse: ${movie.synopsis}`); // Revela a sinopse se todas as outras dicas já foram mostradas
        allHintsRevealed = true; // Marca que todas as dicas foram reveladas
        tentativas = 1;
    }

    document.getElementById("tentativas").innerHTML = "tentativas restantes: " + tentativas + "/12"; // Exibe a quantidade de tentativas restantes
}

// Atualiza o texto de uma dica na interface
function updateHint(id, text) {
    const hint = document.getElementById(id);
    hint.textContent = text; // Define o texto da dica
    hint.classList.add("revealed"); // Adiciona a classe de revelação
}

// Carrega os dados do filme ao carregar o script
loadMovieData();
