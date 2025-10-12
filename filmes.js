
// filmes.js — atualizado: autocomplete robusto e debug
// Este arquivo JavaScript gerencia a lógica do jogo de adivinhação de filmes.
// Ele inclui funcionalidades para carregar dados, gerenciar o jogo, dar dicas e usar autocomplete.

// Configurações
const SUGGESTION_LIMIT = 8; // Define o número máximo de sugestões exibidas no autocomplete.
const DEBOUNCE_MS = 120; // Define o tempo de espera em milissegundos para o autocomplete ser ativado após a digitação.

// Variáveis globais
let movie = {}; // Objeto que armazenará o filme a ser adivinhado no jogo atual.
let moviesList = []; // Array que armazenará a lista completa de filmes carregada do arquivo JSON.
let allHintsRevealed = false; // Flag booleana que indica se todas as dicas já foram reveladas.
let tentativas = 12; // Variável que armazena o número de tentativas restantes para o jogador.

// ------------ Funções principais ------------
// Carrega o JSON de filmes e inicializa tudo
async function loadMovieData() {
    // Função assíncrona para carregar os dados dos filmes de um arquivo JSON.
    console.log('[filmes.js] Carregando filmes.json...'); // Exibe uma mensagem no console indicando o início do carregamento.
    try {
        const response = await fetch('filmes.json'); // Faz uma requisição assíncrona para buscar o arquivo 'filmes.json'.
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`); // Lança um erro se a resposta da requisição não for bem-sucedida.

        moviesList = await response.json(); // Converte a resposta da requisição para um objeto JSON e armazena em moviesList.
        console.log(`[filmes.js] filmes.json carregado — total de itens: ${moviesList.length}`); // Exibe uma mensagem no console com o número total de itens carregados.

        // opcional: extrair apenas objetos que tenham title
        moviesList = moviesList.filter(f => f && typeof f.title === 'string'); // Filtra a lista para incluir apenas objetos com uma propriedade 'title' que seja uma string.
        console.log(`[filmes.js] títulos válidos: ${moviesList.length}`); // Exibe a contagem de filmes com títulos válidos.

    } catch (err) {
        console.error('[filmes.js] Erro ao carregar filmes.json:', err); // Captura e exibe qualquer erro ocorrido durante o carregamento do JSON.
        moviesList = []; // Em caso de erro, a lista de filmes é esvaziada.
    } finally {
        initSuggestions(); // Chama a função para inicializar o sistema de sugestões, independentemente do resultado do carregamento.
        if (moviesList.length > 0) movie = selectRandomMovie(moviesList); // Se a lista de filmes não estiver vazia, seleciona um filme aleatório para o jogo.
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    // Função para configurar a funcionalidade de autocomplete no campo de entrada do palpite.
    const input = document.getElementById('guessInput'); // Obtém a referência para o elemento de input onde o usuário digita o palpite.
    const suggestionsList = document.getElementById('suggestions'); // Obtém a referência para o elemento de lista onde as sugestões serão exibidas.
    if (!input || !suggestionsList) {
        console.warn('[filmes.js] initSuggestions: elementos DOM não encontrados'); // Emite um aviso se os elementos DOM necessários não forem encontrados.
        return; // Sai da função se os elementos não existirem.
    }

    let debounceTimer = null; // Variável para controlar o timer do 'debounce', que atrasa a execução da função de busca.

    input.addEventListener('input', () => {
        // Adiciona um listener de evento 'input' ao campo de entrada.
        clearTimeout(debounceTimer); // Cancela o timer anterior para evitar múltiplas execuções.
        debounceTimer = setTimeout(() => {
            // Inicia um novo timer para atrasar a execução da lógica de sugestão.
            const termo = input.value.trim().toLowerCase(); // Pega o valor do input, remove espaços e converte para minúsculas.
            suggestionsList.innerHTML = ''; // Limpa a lista de sugestões.
            suggestionsList.style.display = 'none'; // Esconde a lista de sugestões.

            if (termo.length === 0) return; // Se o termo de busca estiver vazio, sai da função.

            const titulos = moviesList
                .map(f => f.title && f.title.trim()) // Mapeia a lista de filmes para uma nova lista contendo apenas os títulos, removendo espaços em branco.
                .filter(Boolean); // Remove quaisquer valores falsos (null, undefined, etc.).

            const filtrados = Array.from(new Set(titulos)) // Cria um array de títulos únicos.
                .filter(title => title.toLowerCase().includes(termo)) // Filtra os títulos que incluem o termo de busca.
                .slice(0, SUGGESTION_LIMIT); // Limita o número de sugestões ao valor definido em SUGGESTION_LIMIT.

            if (filtrados.length === 0) return; // Se não houver filmes correspondentes, sai da função.

            filtrados.forEach(title => {
                // Itera sobre cada título filtrado para criar os elementos da lista de sugestões.
                const li = document.createElement('li'); // Cria um novo elemento de lista (<li>).
                li.textContent = title; // Define o texto do elemento de lista para o título do filme.
                li.classList.add('suggestion-item'); // Adiciona uma classe CSS para estilização.
                li.setAttribute('role', 'option'); // Adiciona um atributo ARIA para acessibilidade.
                li.setAttribute('tabindex', '0'); // Torna o item focável para navegação via teclado.

                li.addEventListener('mousedown', (ev) => {
                    // Adiciona um evento 'mousedown' para preencher o input com o título do filme.
                    ev.preventDefault(); // Previne o comportamento padrão do mouse (como perder o foco).
                    input.value = title; // Define o valor do input como o título clicado.
                    suggestionsList.innerHTML = ''; // Limpa a lista de sugestões.
                    suggestionsList.style.display = 'none'; // Esconde a lista de sugestões.
                    input.focus(); // Retorna o foco para o campo de entrada.
                });

                li.addEventListener('keydown', (ev) => {
                    // Adiciona um evento 'keydown' para permitir a seleção com as teclas Enter ou Espaço.
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault(); // Previne o comportamento padrão.
                        input.value = title; // Preenche o input.
                        suggestionsList.innerHTML = ''; // Limpa as sugestões.
                        suggestionsList.style.display = 'none'; // Esconde a lista.
                        input.focus(); // Retorna o foco.
                    }
                });

                suggestionsList.appendChild(li); // Adiciona o elemento de lista (<li>) à lista de sugestões (<ul>).
            });

            suggestionsList.style.display = 'block'; // Torna a lista de sugestões visível.
        }, DEBOUNCE_MS); // Define o tempo de atraso do debounce.
    });

    input.addEventListener('blur', () => {
        // Adiciona um evento 'blur' que é ativado quando o campo de entrada perde o foco.
        setTimeout(() => {
            suggestionsList.innerHTML = ''; // Limpa a lista de sugestões.
            suggestionsList.style.display = 'none'; // Esconde a lista.
        }, 150); // Define um pequeno atraso para permitir cliques nas sugestões antes que a lista seja escondida.
    });
}

// Seleciona um filme aleatório
function selectRandomMovie(movies) {
    // Função para selecionar um filme aleatório da lista.
    const randomIndex = Math.floor(Math.random() * movies.length); // Gera um índice aleatório.
    return movies[randomIndex]; // Retorna o filme no índice aleatório.
}

// ------------ Funções do jogo ------------
function checkGuess(guessedMovie) {
    // Função principal para verificar se o palpite do jogador está correto.

    if (guessedMovie.title === movie.title) {
        // Condição para palpite correto.
        revealAllHints(); // Revela todas as dicas.
        document.getElementById('giveUpButton').style.display = 'none'; // Esconde o botão de desistir.
        document.getElementById('enviarButton').style.display = 'none'; // Esconde o botão de enviar.
        tentativas = 0; // Define as tentativas restantes para zero.
        const guessInput = document.getElementById('guessInput'); // Obtém a referência para o input.
        guessInput.disabled = true; // Desabilita o campo de entrada.
        guessInput.placeholder = 'O jogo terminou!'; // Altera o placeholder do input.
        guessInput.style.backgroundColor = '#f0f0f0'; // Altera a cor de fundo do input.
    } else if (tentativas === 1) {
        // Condição para a última tentativa (derrota).
        revealAllHints(); // Revela todas as dicas.
        document.getElementById('enviarButton').style.display = 'none'; // Esconde o botão de enviar.
        document.getElementById('giveUpButton').style.display = 'none'; // Esconde o botão de desistir.
        const guessInput = document.getElementById('guessInput'); // Obtém a referência para o input.
        guessInput.disabled = true; // Desabilita o campo de entrada.
        guessInput.placeholder = 'O jogo terminou!'; // Altera o placeholder do input.
        guessInput.style.backgroundColor = '#f0f0f0'; // Altera a cor de fundo do input.
    } else {
        // Condição para palpite incorreto, mas ainda com tentativas.
        tentativas--; // Decrementa o número de tentativas restantes.
        const guessedTitle = guessedMovie && guessedMovie.title; // Obtém o título do filme adivinhado, se ele existir.
        if (guessedTitle) {
            // Verifica se o palpite tem alguma dica em comum com o filme correto.
            if (movie.genre === guessedMovie.genre) updateHint('hint1', `- Gênero: ${movie.genre}`); // Revela a dica de gênero se for a mesma.
            if (movie.director === guessedMovie.director) updateHint('hint2', `- Diretor: ${movie.director}`); // Revela a dica de diretor se for o mesmo.
            if (movie.year === guessedMovie.year) updateHint('hint3', `- Ano de lançamento: ${movie.year}`); // Revela a dica de ano se for o mesmo.
            if (movie.leadActor === guessedMovie.leadActor) updateHint('hint4', `- Ator principal: ${movie.leadActor}`); // Revela a dica de ator se for o mesmo.
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza o texto que mostra as tentativas restantes.

    if (tentativas == 9) {
        revealHint(); // Se o número de tentativas for 9, revela uma dica.
    } else if (tentativas == 6) {
        revealHint(); // Se o número de tentativas for 6, revela uma dica.
    } else if (tentativas == 3) {
        revealHint(); // Se o número de tentativas for 3, revela uma dica.
    } else if (tentativas == 1) {
        revealHint(); // Se o número de tentativas for 1, revela uma dica.
    }
}

function revealAllHints() {
    // Função para revelar todas as dicas do filme.
    updateHint('hint1', `- Gênero: ${movie.genre}`); // Revela a dica de gênero.
    updateHint('hint2', `- Diretor: ${movie.director}`); // Revela a dica de diretor.
    updateHint('hint3', `- Ano de lançamento: ${movie.year}`); // Revela a dica de ano.
    updateHint('hint4', `- Ator principal: ${movie.leadActor}`); // Revela a dica de ator principal.
    updateHint('hint5', `- Sinopse: ${movie.synopsis}`); // Revela a dica de sinopse.
    allHintsRevealed = true; // Define a flag para indicar que todas as dicas foram reveladas.
    tentativas = 0; // Define as tentativas para zero.
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza o texto das tentativas.
}

function startNewGame() {
    // Função para iniciar um novo jogo.
    // Resetar variáveis globais
    movie = selectRandomMovie(moviesList); // Seleciona um novo filme aleatório.
    allHintsRevealed = false; // Reseta a flag de dicas reveladas.
    tentativas = 12; // Reseta o número de tentativas.

    const guessInput = document.getElementById('guessInput'); // Obtém o elemento de input.
    if (guessInput) {
        guessInput.disabled = false; // Habilita o campo de entrada.
        guessInput.value = ''; // Limpa o valor do input.
        guessInput.placeholder = 'Digite seu palpite...'; // Reseta o placeholder.
        guessInput.style.backgroundColor = ''; // Reseta a cor de fundo.
    }

    // Resetar dicas
    updateHint('hint1', '- Gênero: ???'); // Reseta a dica de gênero.
    updateHint('hint2', '- Diretor: ???'); // Reseta a dica de diretor.
    updateHint('hint3', '- Ano de lançamento: ???'); // Reseta a dica de ano.
    updateHint('hint4', '- Ator principal: ???'); // Reseta a dica de ator.
    updateHint('hint5', '- Sinopse: ???'); // Reseta a dica de sinopse.

    // Reexibir botões
    document.getElementById('giveUpButton').style.display = 'inline-block'; // Mostra o botão de desistir.
    document.getElementById('enviarButton').style.display = 'inline-block'; // Mostra o botão de enviar.

    // Atualizar tentativas
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza o texto das tentativas.
}

function giveUp() {
    // Função para o jogador desistir do jogo.
    alert(`Você desistiu! A resposta era: ${movie.title}`); // Mostra um alerta com a resposta correta.
    revealAllHints(); // Revela todas as dicas.
    document.getElementById('enviarButton').style.display = 'none'; // Esconde o botão de enviar.
    document.getElementById('giveUpButton').style.display = 'none'; // Esconde o botão de desistir.
    const guessInput = document.getElementById('guessInput'); // Obtém o input.
    guessInput.disabled = true; // Desabilita o input.
    guessInput.placeholder = 'O jogo terminou!'; // Altera o placeholder.
    guessInput.style.backgroundColor = '#f0f0f0'; // Altera a cor de fundo.
}

function revealHint() {
    // Função para revelar uma dica aleatória.
    const hints = [
        // Array de objetos contendo as informações das dicas.
        { id: 'hint1', text: `- Gênero: ${movie.genre}` },
        { id: 'hint2', text: `- Diretor: ${movie.director}` },
        { id: 'hint3', text: `- Ano de lançamento: ${movie.year}` },
        { id: 'hint4', text: `- Ator principal: ${movie.leadActor}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        // Filtra as dicas que ainda não foram reveladas.
        const hintElement = document.getElementById(hint.id); // Obtém o elemento da dica.
        return hintElement && hintElement.textContent.includes('???'); // Verifica se o texto da dica ainda contém '???'.
    });

    if (unrevealedHints.length > 0) {
        // Se houver dicas não reveladas, revela uma aleatoriamente.
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)]; // Seleciona uma dica aleatória.
        updateHint(randomHint.id, randomHint.text); // Chama a função para atualizar a dica na interface.
    } else {
        // Se todas as dicas principais já foram reveladas, revela a sinopse.
        updateHint('hint5', `- Sinopse: ${movie.synopsis}`); // Revela a dica de sinopse.
        allHintsRevealed = true; // Define a flag de dicas reveladas.
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza o texto das tentativas.
}

function updateHint(id, text) {
    // Função para atualizar o texto de um elemento de dica na interface.
    const hint = document.getElementById(id); // Obtém o elemento da dica pelo ID.
    if (!hint) return; // Se o elemento não for encontrado, sai da função.
    hint.textContent = text; // Atualiza o texto do elemento.
    hint.classList.toggle("revealed"); // Adiciona ou remove a classe "revealed" para o efeito de transição.

    setTimeout(function () {
        // Configura um timer para remover a classe "revealed" após um curto período.
        hint.classList.remove("revealed"); // Remove a classe.
    }, 200); // O tempo do timer é de 200 milissegundos.
}

// ------------ Inicialização ------------
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona um listener que executa o código quando o DOM estiver completamente carregado.
    const voltar = document.getElementById('voltar'); // Obtém o botão 'voltar'.
    if (voltar) voltar.addEventListener('click', () => window.history.back()); // Adiciona um listener de clique para voltar à página anterior.

    const newGameButton = document.getElementById('newGameButton'); // Obtém o botão de 'novo jogo'.
    if (newGameButton) newGameButton.addEventListener('click', startNewGame); // Adiciona um listener de clique para iniciar um novo jogo.

    const giveUpButton = document.getElementById('giveUpButton'); // Obtém o botão de 'desistir'.
    if (giveUpButton) giveUpButton.addEventListener('click', giveUp); // Adiciona um listener de clique para desistir do jogo.

    const guessInput = document.getElementById('guessInput'); // Obtém o campo de entrada do palpite.
    if (guessInput) {
        guessInput.addEventListener('keydown', (event) => {
            // Adiciona um listener para a tecla 'Enter'.
            if (event.key === 'Enter') {
                event.preventDefault(); // Previne o comportamento padrão (ex: submeter um formulário).
                const guess = guessInput.value.trim(); // Pega o valor do input, removendo espaços.
                const guessedMovie = moviesList.find(m => m.title === guess); // Procura o filme correspondente na lista de filmes.

                if (guessedMovie) {
                    // Se o filme for encontrado...
                    checkGuess(guessedMovie); // Chama a função para verificar o palpite.
                } else {
                    // Se o filme não for encontrado...
                    alert("Objeto não encontrado no nosso banco de dados. Tente novamente!")
                }
                guessInput.value = ''; // Limpa o campo de entrada após o palpite.
            }
        });
    }

    // >>>>>>> ADICIONADO: clique no botão Enviar <<<<<<
    const enviarButton = document.getElementById('enviarButton'); // Obtém o botão 'Enviar'.
    if (enviarButton && guessInput) {
        // Adiciona um listener de clique para o botão 'Enviar'.
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim(); // Pega o valor do input, removendo espaços.
            const guessedMovie = moviesList.find(m => m.title === guess); // Procura o filme na lista.

            if (guessedMovie) {
                // Se o filme for encontrado...
                checkGuess(guessedMovie); // Chama a função para verificar o palpite.
            } else {
                // Se o filme não for encontrado...
                alert("Objeto não encontrado no nosso banco de dados. Tente novamente!")
            }
            guessInput.value = ''; // Limpa o campo de entrada após o palpite.
        });
    }
    // >>>>>>> FIM DA ADIÇÃO <<<<<<

    loadMovieData(); // Inicia o processo de carregamento dos dados dos filmes quando o script é executado.

});
