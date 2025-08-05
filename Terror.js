// Variáveis globais
let movie = {}; // Objeto para armazenar o filme atual
let moviesList = []; // Lista de todos os filmes carregados
let tentativas = 12; // Mostra as tentativas restantes
let desiredGenre = "Terror"; // Gênero desejado, defina aqui
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas

// Função assíncrona para carregar os dados do filme a partir de um arquivo JSON
async function loadMovieData() {
    try {
        const response = await fetch("filmes.json"); // Faz uma requisição para carregar o arquivo JSON
        if (!response.ok) {
            throw new Error('Erro ao carregar os dados do filme'); // Lança um erro se a resposta não for bem-sucedida
        }
        moviesList = await response.json(); // Converte a resposta em um objeto JSON
        
        // Filtra a lista de filmes pelo gênero desejado
        const filteredMovies = filterMoviesByGenre(moviesList, desiredGenre);
        
        if (filteredMovies.length === 0) {
            throw new Error('Nenhum filme encontrado para o gênero especificado.');
        }

        movie = selectRandomMovie(filteredMovies); // Seleciona um filme aleatório
    } catch (error) {
        console.error(error); // Exibe o erro no console
        alert('Não foi possível carregar os dados do filme. Tente novamente mais tarde.'); // Mostra um alerta ao usuário
    }
}

// Filtra os filmes com base no gênero desejado
function filterMoviesByGenre(movies, genre) {
    return movies.filter(movie => movie.genre && movie.genre.toLowerCase() === genre.toLowerCase());
}

// Seleciona um filme aleatório da lista de filmes
function selectRandomMovie(movies) {
    const randomIndex = Math.floor(Math.random() * movies.length); // Gera um índice aleatório
    return movies[randomIndex]; // Retorna o filme correspondente ao índice
}

document.getElementById("voltar").addEventListener("click", function() {
    window.history.back();
});

// Configura o evento de clique para o botão "Novo Jogo"
document.getElementById("newGameButton").addEventListener("click", startNewGame);

// Inicia um novo jogo, redefinindo variáveis e atualizando o estado da interface
function startNewGame() {
    location.reload();
}

// Configura evento para exibir sugestões de filmes enquanto o usuário digita
document.getElementById("guessInput").addEventListener("input", () => {
    const input = document.getElementById("guessInput").value.trim().toLowerCase(); // Captura e formata a entrada do usuário
    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = ""; // Limpa as sugestões anteriores

    if (input.length > 0) {
        // Filtra os filmes com base na entrada do usuário e gênero de terror
        const filteredMovies = moviesList
            .filter(movie =>
                movie.genre.toLowerCase() === "comédia" && // Filtra por gênero
                movie.title.toLowerCase().includes(input) // Filtra por título
            )
            .slice(0, 5); // Limita a 5 sugestões

        if (filteredMovies.length > 0) {
            suggestionsList.style.display = "block"; // Exibe a lista de sugestões
            filteredMovies.forEach(movie => {
                const listItem = document.createElement("li");
                listItem.textContent = movie.title; // Adiciona o título do filme na lista
                listItem.addEventListener("click", () => {
                    document.getElementById("guessInput").value = movie.title; // Preenche o campo de entrada com o título selecionado
                    suggestionsList.style.display = "none"; // Oculta as sugestões
                });
                suggestionsList.appendChild(listItem); // Adiciona o item à lista
            });
        } else {
            suggestionsList.style.display = "none"; // Oculta a lista se não houver sugestões
        }
    } else {
        suggestionsList.style.display = "none"; // Oculta a lista se o campo de entrada estiver vazio
    }
});

// Fecha a lista de sugestões ao clicar fora dela
document.addEventListener("click", (event) => {
    const suggestionsList = document.getElementById("suggestions");
    if (!suggestionsList.contains(event.target) && event.target.id !== "guessInput") {
        suggestionsList.style.display = "none"; // Oculta as sugestões
    }
});

// Configura o botão "Desistir"
document.getElementById("giveUpButton").addEventListener("click", giveUp);

// Função chamada quando o usuário desiste
function giveUp() {
    const feedback = document.getElementById("feedback");
    feedback.textContent = `Você desistiu! O filme era: ${movie.title}`; // Exibe o título do filme
    feedback.className = "feedback incorrect";

    // Revela todas as dicas
    document.querySelectorAll(".hint").forEach((hint, index) => {
        const hintKey = hint.id.replace("hint", "");
        updateHint("hint3", `- Ano de lançamento: ${movie.year}`);
        updateHint("hint2", `- Diretor: ${movie.director}`);
        updateHint("hint4", `- Ator principal: ${movie.leadActor}`);
        updateHint("hint5", `- Sinopse: ${movie.synopsis}`);
        allHintsRevealed = true; // Marca que todas as dicas foram reveladas
    });

    // Oculta os botões "Desistir" e de dicas
    document.getElementById("hintButton").style.display = "none";
    document.getElementById("giveUpButton").style.display = "none";

    // Função para desabilitar o input
    const guessInput = document.getElementById("guessInput");
    guessInput.disabled = true;
    guessInput.placeholder = "O jogo terminou!";
    guessInput.style.backgroundColor = "#f0f0f0"; // Opcional: muda a cor de fundo para indicar desabilitado
}

// Verifica o palpite do usuário ao pressionar "Enter"
document.getElementById("guessInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const guess = document.getElementById("guessInput").value.trim(); // Captura o palpite do usuário
        const feedback = document.getElementById("feedback");

        if (allHintsRevealed) {
            checkFinalGuess(guess); // Verifica o palpite final
            return;
        }

        const guessedMovie = moviesList.find(m => m.title.toLowerCase() === guess.toLowerCase()); // Busca o filme correspondente ao palpite

        if (guessedMovie) {
            checkGuess(guessedMovie); // Verifica o palpite
        } else {
            feedback.textContent = "Filme não encontrado. Tente novamente!"; // Mensagem de erro para palpites inválidos
            feedback.className = "feedback incorrect";
        }
        document.getElementById("guessInput").value = ""; // Limpa o campo de entrada
    }
});

// Verifica se o palpite está correto ou incorreto
function checkGuess(guessedMovie) {
    const feedback = document.getElementById("feedback");
    const userYear = guessedMovie.year;

    // Exibe os botões "Novo Jogo" e "Desistir"
    document.getElementById("giveUpButton").style.display = "inline-block";

    if (guessedMovie.title.toLowerCase() === movie.title.toLowerCase()) {
        feedback.textContent = `Parabéns! Você acertou: ${movie.title}`; // Mensagem de acerto
        feedback.className = "feedback correct";
        revealAllHints(); // Revela todas as dicas
        document.getElementById("hintButton").style.display = "none";
        document.getElementById("giveUpButton").style.display = "none";
        // Função para desabilitar o input
        const guessInput = document.getElementById("guessInput");
        guessInput.disabled = true;
        guessInput.placeholder = "O jogo terminou!";
        guessInput.style.backgroundColor = "#f0f0f0"; // Opcional: muda a cor de fundo para indicar desabilitado
    } else {
        feedback.textContent = "Palpite incorreto. Tente novamente!"; // Mensagem de erro
        feedback.className = "feedback incorrect";
        handleIncorrectGuess(); // Incrementa o contador de erros
        if (movie.director === guessedMovie.director) {
            updateHint("hint2", `- Diretor: ${movie.director}`);
        }
        if (movie.year === userYear) {
            updateHint("hint3", `- Ano de lançamento: ${movie.year}`);
        }
        if (movie.leadActor === guessedMovie.leadActor) {
            updateHint("hint4", `- Ator principal: ${movie.leadActor}`);
        }
    }
}

// Verifica o palpite final quando todas as dicas já foram reveladas
function checkFinalGuess(guess) {
    const feedback = document.getElementById("feedback");
    if (guess.toLowerCase() === movie.title.toLowerCase()) {
        feedback.textContent = `Parabéns! Você acertou: ${movie.title}`; // Mensagem de acerto final
        feedback.className = "feedback correct";
        // Função para desabilitar o input
        const guessInput = document.getElementById("guessInput");
        document.getElementById("hintButton").style.display = "none";
        document.getElementById("giveUpButton").style.display = "none";
        guessInput.disabled = true;
        guessInput.placeholder = "O jogo terminou!";
        guessInput.style.backgroundColor = "#f0f0f0"; // Opcional: muda a cor de fundo para indicar desabilitado
    } else {
        feedback.textContent = `Você perdeu! O filme era: ${movie.title}`; // Mensagem de erro final
        feedback.className = "feedback incorrect";
        // Função para desabilitar o input
        const guessInput = document.getElementById("guessInput");
        guessInput.disabled = true;
        guessInput.placeholder = "O jogo terminou!";
        guessInput.style.backgroundColor = "#f0f0f0"; // Opcional: muda a cor de fundo para indicar desabilitado
    }
    document.getElementById("giveUpButton").style.display = "none";
    document.getElementById("guessInput").value = ""; // Limpa o campo de entrada
    suggestionsList.innerHTML = ""; // Limpa as sugestões anteriores

}

// Configura o botão para revelar uma dica
document.getElementById("hintButton").addEventListener("click", () => {
    revealHint(); // Revela uma dica aleatória
    document.getElementById("hintButton").style.display = "none"; // Oculta o botão após uso
    incorrectGuesses = 0; // Reseta o contador de erros
});

// Incrementa o contador de erros e exibe o botão de dicas se necessário
function handleIncorrectGuess() {
    incorrectGuesses++;
    if (incorrectGuesses >= 2) {
        document.getElementById("hintButton").style.display = "inline-block"; // Mostra o botão de dica
    }
}

// Atualiza o texto de uma dica na interface
function updateHint(id, text) {
    const hint = document.getElementById(id);
    hint.textContent = text; // Define o texto da dica
    hint.classList.add("revealed"); // Adiciona a classe de revelação
}

// Revela todas as dicas relacionadas ao filme
function revealAllHints() {
    updateHint("hint2", `- Diretor: ${movie.director}`);
    updateHint("hint3", `- Ano de lançamento: ${movie.year}`);
    updateHint("hint4", `- Ator principal: ${movie.leadActor}`);
    updateHint("hint5", `- Sinopse: ${movie.synopsis}`);
    allHintsRevealed = true; // Marca que todas as dicas foram reveladas
}

// Revela uma dica aleatória que ainda não foi mostrada
function revealHint() {
    const hints = [
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
    } else {
        updateHint("hint5", `- Sinopse: ${movie.synopsis}`); // Revela a sinopse se todas as outras dicas já foram mostradas
        allHintsRevealed = true; // Marca que todas as dicas foram reveladas
    }
}

// Carrega os dados do filme ao carregar o script
loadMovieData();