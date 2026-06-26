const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

let animation = {};
let animationsList = [];
let allHintsRevealed = false;
let tentativas = 12;

async function loadAnimationData() {
    console.log('[animacoes.js] Carregando animacoes.json...');

    try {
        const response = await fetch('/BD/animacoes.json'); // Faz a requisição do arquivo JSON

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} — ${response.statusText}`);
        }

        animationsList = await response.json();

        console.log(`[animacoes.js] animacoes.json carregado — total de itens: ${animationsList.length}`);

        animationsList = animationsList.filter(a => a && typeof a.title === 'string');

        console.log(`[animacoes.js] títulos válidos: ${animationsList.length}`);
    } catch (err) {
        console.error('[animacoes.js] Erro ao carregar animacoes.json:', err);
        animationsList = [];
    } finally {
        initSuggestions();

        if (animationsList.length > 0) {
            animation = selectRandomAnimation(animationsList);
        }
    }
}

function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');

    if (!input || !suggestionsList) {
        console.warn('[animacoes.js] initSuggestions: elementos DOM não encontrados');
        return;
    }

    let debounceTimer = null;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const termo = input.value.trim().toLowerCase();

            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';

            if (termo.length === 0) return;

            const titulos = animationsList
                .map(a => a.title && a.title.trim())
                .filter(Boolean);

            const filtrados = Array.from(new Set(titulos))
                .filter(title => title.toLowerCase().includes(termo))
                .slice(0, SUGGESTION_LIMIT);

            if (filtrados.length === 0) return;

            filtrados.forEach(title => {
                const li = document.createElement('li');

                li.textContent = title;
                li.classList.add('suggestion-item');
                li.setAttribute('role', 'option');
                li.setAttribute('tabindex', '0');

                li.addEventListener('mousedown', ev => {
                    ev.preventDefault();

                    input.value = title;
                    suggestionsList.innerHTML = '';
                    suggestionsList.style.display = 'none';

                    input.focus();
                });

                li.addEventListener('keydown', ev => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();

                        input.value = title;
                        suggestionsList.innerHTML = '';
                        suggestionsList.style.display = 'none';

                        input.focus();
                    }
                });

                suggestionsList.appendChild(li);
            });

            suggestionsList.style.display = 'block';
        }, DEBOUNCE_MS);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }, 150);
    });
}

function selectRandomAnimation(animations) {
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex];
}

function checkGuess(guessedAnimation) {
    if (guessedAnimation.title === animation.title) {
        revealAllHints();

        document.getElementById('giveUpButton').style.display = 'none';
        document.getElementById('enviarButton').style.display = 'none';

        tentativas = 0;

        const guessInput = document.getElementById('guessInput');

        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';

    } else if (tentativas === 1) {
        revealAllHints();

        document.getElementById('enviarButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';

        const guessInput = document.getElementById('guessInput');

        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';

    } else {
        tentativas--;

        const hintsContainer = document.getElementById('hints');

        if (hintsContainer) {
            hintsContainer.classList.add('hints-error');

            setTimeout(() => {
                hintsContainer.classList.remove('hints-error');
            }, 300);
        }

        const guessedTitle = guessedAnimation && guessedAnimation.title;

        if (guessedTitle) {
            if (animation.genre === guessedAnimation.genre) {
                updateHint('hint1', `- Gênero: ${animation.genre}`);
            }

            if (animation.director === guessedAnimation.director) {
                updateHint('hint2', `- Diretor: ${animation.director}`);
            }

            if (animation.MainCharacter === guessedAnimation.MainCharacter) {
                updateHint('hint3', `- Personagem principal: ${animation.MainCharacter}`);
            }
        }
    }

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: ' + tentativas + '/12';

    if (tentativas == 9) revealHint();
    else if (tentativas == 6) revealHint();
    else if (tentativas == 3) revealHint();
    else if (tentativas == 1) revealHint();
}

function revealAllHints() {
    updateHint('nomeFCerto', `- Animação: ${animation.title}`);
    updateHint('hint1', `- Gênero: ${animation.genre}`);
    updateHint('hint2', `- Diretor: ${animation.director}`);
    updateHint('hint3', `- Personagem principal: ${animation.MainCharacter}`);
    updateHint('hint4', `- Sinopse: ${animation.synopsis}`);

    allHintsRevealed = true;
    tentativas = 0;

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: ' + tentativas + '/12';
}

function startNewGame() {
    animation = selectRandomAnimation(animationsList);

    allHintsRevealed = false;
    tentativas = 12;

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('nomeFCerto', '- Animação: ???');
    updateHint('hint1', '- Gênero: ???');
    updateHint('hint2', '- Diretor: ???');
    updateHint('hint3', '- Personagem principal: ???');
    updateHint('hint4', '- Sinopse: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: ' + tentativas + '/12';
}

function giveUp() {
    revealAllHints();

    document.getElementById('enviarButton').style.display = 'none';
    document.getElementById('giveUpButton').style.display = 'none';

    const guessInput = document.getElementById('guessInput');

    guessInput.disabled = true;
    guessInput.placeholder = 'O jogo terminou!';
    guessInput.style.backgroundColor = '#f0f0f0';
}

function revealHint() {
    const hints = [
        { id: 'hint1', text: `- Gênero: ${animation.genre}` },
        { id: 'hint2', text: `- Diretor: ${animation.director}` },
        { id: 'hint3', text: `- Personagem principal: ${animation.MainCharacter}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);

        return hintElement && hintElement.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint =
            unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];

        updateHint(randomHint.id, randomHint.text);

    } else {
        updateHint('hint4', `- Sinopse: ${animation.synopsis}`);
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: ' + tentativas + '/12';
}

function updateHint(id, text) {
    const hint = document.getElementById(id);

    if (!hint) return;

    hint.textContent = text;
    hint.classList.toggle('revealed');

    setTimeout(() => {
        hint.classList.remove('revealed');
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    const voltar = document.getElementById('voltar');

    if (voltar) {
        voltar.addEventListener('click', () => window.history.back());
    }

    const newGameButton = document.getElementById('newGameButton');

    if (newGameButton) {
        newGameButton.addEventListener('click', startNewGame);
    }

    const giveUpButton = document.getElementById('giveUpButton');

    if (giveUpButton) {
        giveUpButton.addEventListener('click', giveUp);
    }

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();

                const guess = guessInput.value.trim();

                const guessedAnimation = animationsList.find(
                    a => a.title === guess
                );

                if (guessedAnimation) {
                    checkGuess(guessedAnimation);
                } else {
                    alert('Objeto não encontrado no nosso banco de dados. Tente novamente!');
                }

                guessInput.value = '';
            }
        });
    }

    const enviarButton = document.getElementById('enviarButton');

    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();

            const guessedAnimation = animationsList.find(
                a => a.title === guess
            );

            if (guessedAnimation) {
                checkGuess(guessedAnimation);
            } else {
                alert('Objeto não encontrado no nosso banco de dados. Tente novamente!');
            }

            guessInput.value = '';
        });
    }

    loadAnimationData();
});