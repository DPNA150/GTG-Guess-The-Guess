// arquivo_comentado.js — versão comentada com efeito de erro
// Este script gerencia o jogo de adivinhação de arquivo, incluindo:
// - Carregamento do JSON com os arquivo
// - Sistema de tentativas e dicas
// - Autocomplete para palpites
// - Novo efeito visual: todas as dicas ficam vermelhas por 0,6s quando o jogador erra um palpite.

// arquivo.js — atualizado: autocomplete robusto e debug
// Este arquivo JavaScript gerencia a lógica do jogo de adivinhação de arquivo.
// Ele inclui funcionalidades para carregar dados, gerenciar o jogo, dar dicas e usar autocomplete.

// Configurações
const SUGGESTION_LIMIT = 8; // Define o número máximo de sugestões exibidas no autocomplete.
const DEBOUNCE_MS = 120; // Define o tempo de espera em milissegundos para o autocomplete ser ativado após a digitação.

// Variáveis globais
let esporte = {}; // Objeto que armazenará o filme a ser adivinhado no jogo atual.
let arquivoList = []; // Array que armazenará a lista completa de arquivo carregada do arquivo JSON.
let allHintsRevealed = false; // Flag booleana que indica se todas as dicas já foram reveladas.
let tentativas = 9; // Variável que armazena o número de tentativas restantes para o jogador.

// ------------ Funções principais ------------
// Carrega o JSON de arquivo e inicializa tudo
async function loadesporteData() {
    // Função assíncrona para carregar os dados dos arquivo de um arquivo JSON.
    console.log('[arquivo.js] Carregando arquivo.json...'); // Exibe uma mensagem no console indicando o início do carregamento.
    try {
        const response = await fetch('arquivo.json'); // Faz uma requisição assíncrona para buscar o arquivo 'arquivo.json'.
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`); // Lança um erro se a resposta da requisição não for bem-sucedida.

        arquivoList = await response.json(); // Converte a resposta da requisição para um objeto JSON e armazena em arquivoList.
        console.log(`[arquivo.js] arquivo.json carregado — total de itens: ${arquivoList.length}`); // Exibe uma mensagem no console com o número total de itens carregados.

        // opcional: extrair apenas objetos que tenham nome
        arquivoList = arquivoList.filter(f => f && typeof f.nome === 'string'); // Filtra a lista para incluir apenas objetos com uma propriedade 'nome' que seja uma string.
        console.log(`[arquivo.js] títulos válidos: ${arquivoList.length}`); // Exibe a contagem de arquivo com títulos válidos.

    } catch (err) {
        console.error('[arquivo.js] Erro ao carregar arquivo.json:', err); // Captura e exibe qualquer erro ocorrido durante o carregamento do JSON.
        arquivoList = []; // Em caso de erro, a lista de arquivo é esvaziada.
    } finally {
        initSuggestions(); // Chama a função para inicializar o sistema de sugestões, independentemente do resultado do carregamento.
        if (arquivoList.length > 0) esporte = selectRandomesporte(arquivoList); // Se a lista de arquivo não estiver vazia, seleciona um filme aleatório para o jogo.
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    // Função para configurar a funcionalidade de autocomplete no campo de entrada do palpite.
    const input = document.getElementById('guessInput'); // Obtém a referência para o elemento de input onde o usuário digita o palpite.
    const suggestionsList = document.getElementById('suggestions'); // Obtém a referência para o elemento de lista onde as sugestões serão exibidas.
    if (!input || !suggestionsList) {
        console.warn('[arquivo.js] initSuggestions: elementos DOM não encontrados'); // Emite um aviso se os elementos DOM necessários não forem encontrados.
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

            const titulos = arquivoList
                .map(f => f.nome && f.nome.trim()) // Mapeia a lista de arquivo para uma nova lista contendo apenas os títulos, removendo espaços em branco.
                .filter(Boolean); // Remove quaisquer valores falsos (null, undefined, etc.).

            const filtrados = Array.from(new Set(titulos)) // Cria um array de títulos únicos.
                .filter(nome => nome.toLowerCase().includes(termo)) // Filtra os títulos que incluem o termo de busca.
                .slice(0, SUGGESTION_LIMIT); // Limita o número de sugestões ao valor definido em SUGGESTION_LIMIT.

            if (filtrados.length === 0) return; // Se não houver arquivo correspondentes, sai da função.

            filtrados.forEach(nome => {
                // Itera sobre cada título filtrado para criar os elementos da lista de sugestões.
                const li = document.createElement('li'); // Cria um novo elemento de lista (<li>).
                li.textContent = nome; // Define o texto do elemento de lista para o título do filme.
                li.classList.add('suggestion-item'); // Adiciona uma classe CSS para estilização.
                li.setAttribute('role', 'option'); // Adiciona um atributo ARIA para acessibilidade.
                li.setAttribute('tabindex', '0'); // Torna o item focável para navegação via teclado.

                li.addEventListener('mousedown', (ev) => {
                    // Adiciona um evento 'mousedown' para preencher o input com o título do filme.
                    ev.preventDefault(); // Previne o comportamento padrão do mouse (como perder o foco).
                    input.value = nome; // Define o valor do input como o título clicado.
                    suggestionsList.innerHTML = ''; // Limpa a lista de sugestões.
                    suggestionsList.style.display = 'none'; // Esconde a lista de sugestões.
                    input.focus(); // Retorna o foco para o campo de entrada.
                });

                li.addEventListener('keydown', (ev) => {
                    // Adiciona um evento 'keydown' para permitir a seleção com as teclas Enter ou Espaço.
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault(); // Previne o comportamento padrão.
                        input.value = nome; // Preenche o input.
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
function selectRandomesporte(arquivo) {
    // Função para selecionar um filme aleatório da lista.
    const randomIndex = Math.floor(Math.random() * arquivo.length); // Gera um índice aleatório.
    return arquivo[randomIndex]; // Retorna o filme no índice aleatório.
}

// ------------ Funções do jogo ------------
function checkGuess(guessedesporte) {
    // Função principal para verificar se o palpite do jogador está correto.

    if (guessedesporte.nome === esporte.nome) {
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
        const hintsContainer = document.getElementById('hints'); // Obtém o contêiner de dicas.
        if (hintsContainer) { // Verifica se o contêiner existe.
            hintsContainer.classList.add('hints-error'); // Adiciona a classe que pinta todas as dicas de vermelho.
            setTimeout(() => { // Define um timer para reverter o efeito.
                hintsContainer.classList.remove('hints-error'); // Remove a classe de erro após o tempo definido.
            }, 300); // Duração total do efeito (0,3 segundos).
        }
        // >>> FIM DO EFEITO DE ERRO <<<
        const guessednome = guessedesporte && guessedesporte.nome; // Obtém o título do filme adivinhado, se ele existir.
        if (guessednome) {
            // Verifica se o palpite tem alguma dica em comum com o filme correto.
            if (esporte.ambientePraticado === guessedesporte.ambientePraticado) updateHint('hint1', `- Ambiente Práticado: ${esporte.ambientePraticado}`); // Revela a dica de Ambiente Práticado se for a mesma.
            if (esporte.year === guessedesporte.year) updateHint('hint2', `- Ano de Cração: ${esporte.year}`); // Revela a dica de ano se for o mesmo.
            if (esporte.maiorJogador === guessedesporte.maiorJogador) updateHint('hint3', `- Maior Jogador: ${esporte.maiorJogador}`); // Revela a dica de ator se for o mesmo.
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9'; // Atualiza o texto que mostra as tentativas restantes.

    if (tentativas == 6) {
        revealHint(); // Se o número de tentativas for 6, revela uma dica.
    } else if (tentativas == 3) {
        revealHint(); // Se o número de tentativas for 3, revela uma dica.
    } else if (tentativas == 1) {
        revealHint(); // Se o número de tentativas for 1, revela uma dica.
    }
}

function revealAllHints() {
    // Função para revelar todas as dicas do filme.
    updateHint('hint1', `- Ambiente Práticado: ${esporte.ambientePraticado}`); // Revela a dica de Ambiente Práticado.
    updateHint('hint2', `- Ano de Criação: ${esporte.year}`); // Revela a dica de ano.
    updateHint('hint3', `- Maior Jogador: ${esporte.maiorJogador}`); // Revela a dica de Maior Jogador.
    updateHint('hint4', `- Objetivo: ${esporte.objetivo}`); // Revela a dica de Objetivo.
    allHintsRevealed = true; // Define a flag para indicar que todas as dicas foram reveladas.
    tentativas = 0; // Define as tentativas para zero.
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9'; // Atualiza o texto das tentativas.
}

function startNewGame() {
    // Função para iniciar um novo jogo.
    // Resetar variáveis globais
    esporte = selectRandomesporte(arquivoList); // Seleciona um novo filme aleatório.
    allHintsRevealed = false; // Reseta a flag de dicas reveladas.
    tentativas = 9; // Reseta o número de tentativas.


    const guessInput = document.getElementById('guessInput'); // Obtém o elemento de input.
    if (guessInput) {
        guessInput.disabled = false; // Habilita o campo de entrada.
        guessInput.value = ''; // Limpa o valor do input.
        guessInput.placeholder = 'Digite seu palpite...'; // Reseta o placeholder.
        guessInput.style.backgroundColor = ''; // Reseta a cor de fundo.
    }

    // Resetar dicas
    updateHint('hint1', '- Ambiente Práticado: ???'); // Reseta a dica de Ambiente Práticado.
    updateHint('hint2', '- Ano de lançamento: ???'); // Reseta a dica de ano.
    updateHint('hint3', '- Maior Jogador: ???'); // Reseta a dica de ator.
    updateHint('hint4', '- Objetivo: ???'); // Reseta a dica de Objetivo.

    // Reexibir botões
    document.getElementById('giveUpButton').style.display = 'inline-block'; // Mostra o botão de desistir.
    document.getElementById('enviarButton').style.display = 'inline-block'; // Mostra o botão de enviar.

    // Atualizar tentativas
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9'; // Atualiza o texto das tentativas.
}

function giveUp() {
    // Função para o jogador desistir do jogo.
    alert(`Você desistiu! A resposta era: ${esporte.nome}`); // Mostra um alerta com a resposta correta.
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
        { id: 'hint1', text: `- Ambiente Práticado: ${esporte.ambientePraticado}` },
        { id: 'hint2', text: `- Ano de lançamento: ${esporte.year}` },
        { id: 'hint3', text: `- Maior Jogador: ${esporte.maiorJogador}` }
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
        // Se todas as dicas principais já foram reveladas, revela a Objetivo.
        updateHint('hint4', `- Objetivo: ${esporte.objetivo}`); // Revela a dica de Objetivo.
        allHintsRevealed = true; // Define a flag de dicas reveladas.
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9'; // Atualiza o texto das tentativas.
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
                const guessedesporte = arquivoList.find(m => m.nome === guess); // Procura o filme correspondente na lista de arquivo.

                if (guessedesporte) {
                    // Se o filme for encontrado...
                    checkGuess(guessedesporte); // Chama a função para verificar o palpite.
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
            const guessedesporte = arquivoList.find(m => m.nome === guess); // Procura o filme na lista.

            if (guessedesporte) {
                // Se o filme for encontrado...
                checkGuess(guessedesporte); // Chama a função para verificar o palpite.
            } else {
                // Se o filme não for encontrado...
                alert("Objeto não encontrado no nosso banco de dados. Tente novamente!")
            }
            guessInput.value = ''; // Limpa o campo de entrada após o palpite.
        });
    }
    // >>>>>>> FIM DA ADIÇÃO <<<<<<

    loadesporteData(); // Inicia o processo de carregamento dos dados dos arquivo quando o script é executado.
});
