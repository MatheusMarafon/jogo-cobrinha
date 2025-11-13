// ===== DETECÇÃO DE TOQUE =====
window.addEventListener('load', () => {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) {
        document.body.classList.add('is-touch-device');
    }
    // Carrega o recorde assim que a página abre
    loadInitialHighScore();
});

// ===== COLOQUE AQUI OS LINKS DAS IMAGENS =====
const HER_IMAGE_URL = 'ela.PNG';
const HIS_IMAGE_URL = 'eu.PNG';
// =============================================

// ===== CONSTANTES DO JOGO =====
const RANKING_KEY = 'snakeRankingV1'; // Chave para salvar no localStorage
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const size = Math.min(window.innerWidth - 40, 400);
canvas.width = size;
canvas.height = size;
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// ===== ELEMENTOS DA UI =====
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const playerNameInput = document.getElementById('playerNameInput');
const startGameBtn = document.getElementById('startGameBtn');
const loadingText = document.getElementById('loadingText');
const highScoreDisplay = document.getElementById('highScore');
const rankingList = document.getElementById('rankingList');
const scoreDisplay = document.getElementById('score');

// ===== VARIÁVEIS DE ESTADO DO JOGO =====
let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;
let gameSpeed = 150;
let isChangingDirection = false;
let currentPlayer = "Anônimo";

// ===== MENSAGENS DE FIM DE JOGO =====
const messages = [
    "Você é incrível! 💕", "Que reflexos! 😍", "Está indo muito bem! 🌟",
    "Continue assim! 💖", "Você é demais! ✨", "Impressionante! 🎉"
];

// ===== CARREGAMENTO DE IMAGENS =====
const herImage = new Image();
const hisImage = new Image();
let imagesLoaded = 0;
startGameBtn.disabled = true; // Desabilita o botão até as imagens carregarem

herImage.onload = hisImage.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        // Imagens carregadas! Habilita o botão e esconde o "Carregando"
        startGameBtn.disabled = false;
        loadingText.style.display = 'none';
    }
};
herImage.onerror = hisImage.onerror = () => {
    console.log('Erro ao carregar imagem, usando fallback');
    imagesLoaded++;
    if (imagesLoaded === 2) {
        startGameBtn.disabled = false;
        loadingText.style.display = 'none';
    }
};
herImage.src = HER_IMAGE_URL;
hisImage.src = HIS_IMAGE_URL;

// ===== LÓGICA DE INÍCIO E FIM DE JOGO =====

// Evento do botão "Jogar!" na tela inicial
startGameBtn.addEventListener('click', () => {
    currentPlayer = playerNameInput.value || "Anônimo";
    startScreen.style.display = 'none';
    startGame();
});

function startGame() {
    drawGame();
    gameLoop = setInterval(gameStep, gameSpeed);
}

function endGame() {
    clearInterval(gameLoop);
    
    // 1. Salva a pontuação no ranking
    updateRanking(currentPlayer, score);
    
    // 2. Atualiza o display de "Recorde" principal
    loadInitialHighScore();
    
    // 3. Mostra o ranking na tela de Game Over
    displayRanking();
    
    // 4. Preenche os dados da tela de Game Over
    document.getElementById('finalScore').textContent = score;
    document.getElementById('message').textContent = 
        messages[Math.floor(Math.random() * messages.length)];
    
    // 5. Mostra a tela de Game Over
    gameOverScreen.style.display = 'flex';
}

function restartGame() {
    // Reseta as variáveis do jogo
    snake = [{x: 10, y: 10}];
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 150;
    scoreDisplay.textContent = score;
    generateFood();
    
    // Esconde a tela de Game Over e reinicia o loop
    gameOverScreen.style.display = 'none';
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
    drawGame();
}

// ===== FUNÇÕES DO RANKING (localStorage) =====

// Pega o ranking salvo (ou um array vazio)
function getRanking() {
    const storedRanking = localStorage.getItem(RANKING_KEY);
    return storedRanking ? JSON.parse(storedRanking) : [];
}

// Carrega o recorde principal (o maior de todos)
function loadInitialHighScore() {
    const ranking = getRanking();
    if (ranking.length > 0) {
        highScoreDisplay.textContent = ranking[0].score; // O primeiro é o maior
    } else {
        highScoreDisplay.textContent = 0;
    }
}

// Adiciona o novo placar, ordena e salva
function updateRanking(name, newScore) {
    if (newScore === 0) return; // Não salva placar 0
    
    const ranking = getRanking();
    ranking.push({ name: name, score: newScore });
    
    // Ordena do maior para o menor
    ranking.sort((a, b) => b.score - a.score);
    
    // Pega só os 10 melhores
    const top10 = ranking.slice(0, 10);
    
    // Salva de volta no localStorage
    localStorage.setItem(RANKING_KEY, JSON.stringify(top10));
}

// Mostra o ranking na tela de Game Over
function displayRanking() {
    const ranking = getRanking();
    rankingList.innerHTML = ""; // Limpa a lista antiga
    
    if (ranking.length === 0) {
        rankingList.innerHTML = "<li>Seja o primeiro a jogar!</li>";
        return;
    }
    
    ranking.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name}: ${item.score} pontos`;
        rankingList.appendChild(li);
    });
}

// ===== LÓGICA PRINCIPAL DO JOGO (UPDATE E DRAW) =====

function gameStep() {
    isChangingDirection = false;
    update();
    drawGame();
}

function update() {
    if (dx === 0 && dy === 0) return;
    
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // Colisão com paredes
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }
    
    // Colisão com o corpo
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }
    
    snake.unshift(head);
    
    // Comer a comida
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score;
        generateFood();
        
        if (score % 5 === 0 && gameSpeed > 80) {
            gameSpeed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }
    } else {
        snake.pop();
    }
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        generateFood();
    }
}

function drawGame() {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Desenhar comida
    if (hisImage.complete && hisImage.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(hisImage, food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        ctx.restore();
        ctx.strokeStyle = '#ff6b9d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        ctx.fillStyle = '#ff6b9d';
        ctx.font = `${gridSize}px Arial`;
        ctx.fillText('💕', food.x * gridSize, (food.y + 1) * gridSize - 2);
    }
    
    // Desenhar cobra
    snake.forEach((segment, index) => {
        if (index === 0 && herImage.complete && herImage.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(herImage, segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            ctx.restore();
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const gradient = ctx.createLinearGradient(
                segment.x * gridSize, segment.y * gridSize,
                segment.x * gridSize + gridSize, segment.y * gridSize + gridSize
            );
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ===== CONTROLES (TECLADO, TOQUE, SWIPE) =====

function changeDirection(newDx, newDy) {
    if (isChangingDirection) return;
    isChangingDirection = true;

    if (dx === -newDx && newDx !== 0) {
        isChangingDirection = false;
        return;
    }
    if (dy === -newDy && newDy !== 0) {
        isChangingDirection = false;
        return;
    }
    
    dx = newDx;
    dy = newDy;
}

document.getElementById('btnUp').addEventListener('click', () => changeDirection(0, -1));
document.getElementById('btnDown').addEventListener('click', () => changeDirection(0, 1));
document.getElementById('btnLeft').addEventListener('click', () => changeDirection(-1, 0));
document.getElementById('btnRight').addEventListener('click', () => changeDirection(1, 0));
document.getElementById('btnRestart').addEventListener('click', restartGame);

document.addEventListener('keydown', (e) => {
    // *** A CORREÇÃO ESTÁ AQUI ***
    // Se o usuário estiver digitando em um input, não acione os controles do jogo
    if (e.target.tagName === 'INPUT') {
        return;
    }
    // **************************

    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); changeDirection(0, -1); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); changeDirection(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); changeDirection(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); changeDirection(1, 0); break;
    }
});

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        changeDirection(diffX > 0 ? 1 : -1, 0);
    } else {
        changeDirection(0, diffY > 0 ? 1 : -1);
    }
});