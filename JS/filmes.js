// games_comentado.js — versão completa e comentada
// Este arquivo controla o jogo de adivinhação de games, incluindo:
// - Carregamento do JSON de dados
// - Sistema de tentativas e dicas
// - Função de autocomplete
// - Botões de reinício e desistência
// - Novo efeito de erro: todas as dicas ficam vermelhas por 0,6s quando o usuário erra o palpite.

// games.js — atualizado: autocomplete robusto e debug
// Este arquivo JavaScript gerencia a lógica do jogo de adivinhação de games.
// Ele inclui funcionalidades para carregar dados, gerenciar o jogo, dar dicas e usar autocomplete.

// Configurações
const SUGGESTION_LIMIT = 8; // Define o número máximo de sugestões exibidas no autocomplete.
const DEBOUNCE_MS = 120; // Define o tempo de espera em milissegundos para o autocomplete ser ativado após a digitação.

// Variáveis globais
let game = {}; // Objeto que armazenará o jogo a ser adivinhado no jogo atual.
let gamesList = []; // Array que armazenará a lista completa de games carregada do arquivo JSON.
let allHintsRevealed = false; // Flag booleana que indica se todas as dicas já foram reveladas.
let tentativas = 12; // Variável que armazena o número de tentativas restantes para o jogador.

// ------------ Funções principais ------------
// Carrega o JSON de games e inicializa tudo
async function loadgameData() {
    // Função assíncrona para carregar os dados dos games de um arquivo JSON.
    console.log('[games.js] Carregando games.json...'); // Exibe uma mensagem no console indicando o início do carregamento.
    try {
        const response = await fetch('/BancoDEDados/games.json'); // Faz uma requisição assíncrona para buscar o arquivo 'games.json'.
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`); // Lança um erro se a resposta da requisição não for bem-sucedida.

        gamesList = await response.json(); // Converte a resposta da requisição para um objeto JSON e armazena em gamesList.
        console.log(`[games.js] games.json carregado — total de itens: ${gamesList.length}`); // Exibe uma mensagem no console com o número total de itens carregados.

        // opcional: extrair apenas objetos que tenham title
        gamesList = gamesList.filter(f => f && typeof f.title === 'string'); // Filtra a lista para incluir apenas objetos com uma propriedade 'title' que seja uma string.
        console.log(`[games.js] títulos válidos: ${gamesList.length}`); // Exibe a contagem de games com títulos válidos.

    } catch (err) {
        console.error('[games.js] Erro ao carregar games.json:', err); // Captura e exibe qualquer erro ocorrido durante o carregamento do JSON.
        gamesList = []; // Em caso de erro, a lista de games é esvaziada.
    } finally {
        initSuggestions(); // Chama a função para inicializar o sistema de sugestões, independentemente do resultado do carregamento.
        if (gamesList.length > 0) game = selectRandomgame(gamesList); // Se a lista de games não estiver vazia, seleciona um jogo aleatório para o jogo.
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    // Função para configurar a funcionalidade de autocomplete no campo de entrada do palpite.
    const input = document.getElementById('guessInput'); // Obtém a referência para o elemento de input onde o usuário digita o palpite.
    const suggestionsList = document.getElementById('suggestions'); // Obtém a referência para o elemento de lista onde as sugestões serão exibidas.
    if (!input || !suggestionsList) {
        console.warn('[games.js] initSuggestions: elementos DOM não encontrados'); // Emite um aviso se os elementos DOM necessários não forem encontrados.
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

            const titulos = gamesList
                .map(f => f.title && f.title.trim()) // Mapeia a lista de games para uma nova lista contendo apenas os títulos, removendo espaços em branco.
                .filter(Boolean); // Remove quaisquer valores falsos (null, undefined, etc.).

            const filtrados = Array.from(new Set(titulos)) // Cria um array de títulos únicos.
                .filter(title => title.toLowerCase().includes(termo)) // Filtra os títulos que incluem o termo de busca.
                .slice(0, SUGGESTION_LIMIT); // Limita o número de sugestões ao valor definido em SUGGESTION_LIMIT.

            if (filtrados.length === 0) return; // Se não houver games correspondentes, sai da função.

            filtrados.forEach(title => {
                // Itera sobre cada título filtrado para criar os elementos da lista de sugestões.
                const li = document.createElement('li'); // Cria um novo elemento de lista (<li>).
                li.textContent = title; // Define o texto do elemento de lista para o título do jogo.
                li.classList.add('suggestion-item'); // Adiciona uma classe CSS para estilização.
                li.setAttribute('role', 'option'); // Adiciona um atributo ARIA para acessibilidade.
                li.setAttribute('tabindex', '0'); // Torna o item focável para navegação via teclado.

                li.addEventListener('mousedown', (ev) => {
                    // Adiciona um evento 'mousedown' para preencher o input com o título do jogo.
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

// Seleciona um jogo aleatório
function selectRandomgame(games) {
    // Função para selecionar um jogo aleatório da lista.
    const randomIndex = Math.floor(Math.random() * games.length); // Gera um índice aleatório.
    return games[randomIndex]; // Retorna o jogo no índice aleatório.
}

// ------------ Funções do jogo ------------
function checkGuess(guessedgame) {
    // Função principal para verificar se o palpite do jogador está correto.

    if (guessedgame.title === game.title) {
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

        // >>> EFEITO DE ERRO NAS DICAS <<<
        const hintsContainer = document.getElementById('hints'); // Obtém o contêiner principal que contém todas as dicas.
        if (hintsContainer) { // Verifica se o elemento realmente existe antes de aplicar o efeito.
            hintsContainer.classList.add('hints-error'); // Adiciona a classe CSS responsável por deixar todas as dicas vermelhas.
            setTimeout(() => { // Define um temporizador para remover o efeito após um tempo.
                hintsContainer.classList.remove('hints-error'); // Remove a classe para restaurar as cores originais das dicas.
            }, 300); // Tempo do efeito (0,3 segundos).
        }
        // >>> FIM DO EFEITO DE ERRO <<<
        const guessedTitle = guessedgame && guessedgame.title; // Obtém o título do jogo adivinhado, se ele existir.
        if (guessedTitle) {
            // Verifica se o palpite tem alguma dica em comum com o jogo correto.
            if (game.genero === guessedgame.genero) updateHint('hint1', `- Gênero: ${game.genero}`); // Revela a dica de gênero se for a mesma.
            if (game.estudio === guessedgame.estudio) updateHint('hint2', `- Estúdio: ${game.estudio}`); // Revela a dica de Estúdio se for o mesmo.
            if (game.year === guessedgame.year) updateHint('hint3', `- Ano de lançamento: ${game.year}`); // Revela a dica de ano se for o mesmo.
            if (game.protagonista === guessedgame.protagonista) updateHint('hint4', `- Protagonista: ${game.protagonista}`); // Revela a dica de protagonista se for o mesmo.
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
    // Função para revelar todas as dicas do jogo.
    updateHint('hint1', `- Gênero: ${game.genero}`); // Revela a dica de gênero.
    updateHint('hint2', `- Estúdio: ${game.estudio}`); // Revela a dica de Estúdio.
    updateHint('hint3', `- Ano de lançamento: ${game.year}`); // Revela a dica de ano.
    updateHint('hint4', `- Protagonista: ${game.protagonista}`); // Revela a dica de Protagonista.
    updateHint('hint5', `- Sinopse: ${game.synopse}`); // Revela a dica de sinopse.
    allHintsRevealed = true; // Define a flag para indicar que todas as dicas foram reveladas.
    tentativas = 0; // Define as tentativas para zero.
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza o texto das tentativas.
}

function startNewGame() {
    // Função para iniciar um novo jogo.
    // Resetar variáveis globais
    game = selectRandomgame(gamesList); // Seleciona um novo jogo aleatório.
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
    updateHint('hint2', '- Estúdio: ???'); // Reseta a dica de Estúdio.
    updateHint('hint3', '- Ano de lançamento: ???'); // Reseta a dica de ano.
    updateHint('hint4', '- Protagonista: ???'); // Reseta a dica de protagonista.
    updateHint('hint5', '- Sinopse: ???'); // Reseta a dica de sinopse.

    // Reexibir botões
    document.getElementById('giveUpButton').style.display = 'inline-block'; // Mostra o botão de desistir.
    document.getElementById('enviarButton').style.display = 'inline-block'; // Mostra o botão de enviar.

    // Atualizar tentativas
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza o texto das tentativas.
}

function giveUp() {
    // Função para o jogador desistir do jogo.
    alert(`Você desistiu! A resposta era: ${game.title}`); // Mostra um alerta com a resposta correta.
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
        { id: 'hint1', text: `- Gênero: ${game.genero}` },
        { id: 'hint2', text: `- Estúdio: ${game.estudio}` },
        { id: 'hint3', text: `- Ano de lançamento: ${game.year}` },
        { id: 'hint4', text: `- Protagonista: ${game.protagonista}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        // Filtra as dicas que ainda não foram reveladas.
        const hintElement = document.getElementById(hint.id); // Obtém o elemento da dica.
        return hintElement && hintElement.textContent.includes('???'); // Verifica se o texto da dica ainda contém '???'.
    });

    if (unrevealedHints.length > 0) {
        // Se houver dicas não reveladas, revela uma aleprotagonistaiamente.
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)]; // Seleciona uma dica aleatória.
        updateHint(randomHint.id, randomHint.text); // Chama a função para atualizar a dica na interface.
    } else {
        // Se todas as dicas principais já foram reveladas, revela a sinopse.
        updateHint('hint5', `- Sinopse: ${game.synopse}`); // Revela a dica de sinopse.
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
                const guessedgame = gamesList.find(m => m.title === guess); // Procura o jogo correspondente na lista de games.

                if (guessedgame) {
                    // Se o jogo for encontrado...
                    checkGuess(guessedgame); // Chama a função para verificar o palpite.
                } else {
                    // Se o jogo não for encontrado...
                    alert('jogo não encontrado. Tente novamente!'); // Exibe uma mensagem de erro.
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
            const guessedgame = gamesList.find(m => m.title === guess); // Procura o jogo na lista.

            if (guessedgame) {
                // Se o jogo for encontrado...
                checkGuess(guessedgame); // Chama a função para verificar o palpite.
            } else {
                // Se o jogo não for encontrado...
                alert('jogo não encontrado. Tente novamente!'); // Exibe uma mensagem de erro.
            }
            guessInput.value = ''; // Limpa o campo de entrada após o palpite.
        });
    }
    // >>>>>>> FIM DA ADIÇÃO <<<<<<

    loadgameData(); // Inicia o processo de carregamento dos dados dos games quando o script é executado.
});
