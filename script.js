const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20;

let snake = [{ x: 9 * box, y: 10 * box }];
let direction = null;
let score = 0;
let speed = 200;
let interval;
let gameStartTime;

const fruits = [
    { emoji: "🍎", name: "apple" },
    { emoji: "🍓", name: "strawberry" },
    { emoji: "🍇", name: "grape" },
    { emoji: "🍌", name: "banana", speedBoost: true }
];

let currentFruit = randomFruit();
let fruitPosition = randomPosition();

// Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyAnwJBNASDlrSLUe1WKC5z6kwXGeeOLitg",
    authDomain: "game-13f35.firebaseapp.com",
    databaseURL: "https://game-13f35-default-rtdb.firebaseio.com",
    projectId: "game-13f35",
    storageBucket: "game-13f35.firebasestorage.app",
    messagingSenderId: "974709168394",
    appId: "1:974709168394:web:9c35f0b583f755104c02f3",
    measurementId: "G-SKPHN1GVBR"
};

// 初始化 Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function randomPosition() {
    return {
        x: Math.floor(Math.random() * 19) * box,
        y: Math.floor(Math.random() * 19) * box
    };
}

function randomFruit() {
    return fruits[Math.floor(Math.random() * fruits.length)];
}

function drawSegment(x, y, isHead = false) {
    ctx.fillStyle = isHead ? "#006400" : "#228B22";
    ctx.beginPath();
    ctx.arc(x + box / 2, y + box / 2, box / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    if (isHead) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
        ctx.arc(x + 14, y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawFruit(fruit, pos) {
    ctx.font = "20px Arial";
    ctx.fillText(fruit.emoji, pos.x + 2, pos.y + 18);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFruit(currentFruit, fruitPosition);
    snake.forEach((segment, i) => drawSegment(segment.x, segment.y, i === 0));
}

function move() {
    const head = { ...snake[0] };
    if (!direction) return;
    if (direction === 'LEFT') head.x -= box;
    if (direction === 'UP') head.y -= box;
    if (direction === 'RIGHT') head.x += box;
    if (direction === 'DOWN') head.y += box;

    if (
        head.x < 0 || head.y < 0 ||
        head.x >= canvas.width || head.y >= canvas.height ||
        snake.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        clearInterval(interval);
        const gameEndTime = new Date().getTime();
        const playTimeSeconds = Math.round((gameEndTime - gameStartTime) / 1000);
        saveScore(score, playTimeSeconds);
        alert("遊戲結束！得分：" + score);
        return;
    }

    snake.unshift(head);

    if (head.x === fruitPosition.x && head.y === fruitPosition.y) {
        score++;
        if (currentFruit.speedBoost) {
            speed = Math.max(50, speed - 20);
            clearInterval(interval);
            interval = setInterval(gameLoop, speed);
        }
        currentFruit = randomFruit();
        fruitPosition = randomPosition();
    } else {
        snake.pop();
    }
}

function gameLoop() {
    move();
    drawGame();
}

document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" && direction !== 'RIGHT') direction = 'LEFT';
    if (e.key === "ArrowUp" && direction !== 'DOWN') direction = 'UP';
    if (e.key === "ArrowRight" && direction !== 'LEFT') direction = 'RIGHT';
    if (e.key === "ArrowDown" && direction !== 'UP') direction = 'DOWN';
});

document.getElementById('startBtn').addEventListener('click', () => {
    snake = [{ x: 9 * box, y: 10 * box }];
    direction = null;
    score = 0;
    speed = 200;
    currentFruit = randomFruit();
    fruitPosition = randomPosition();
    clearInterval(interval);
    interval = setInterval(gameLoop, speed);
    gameStartTime = new Date().getTime();
});

function saveScore(finalScore, playTimeSeconds) {
    const playerName = prompt("請輸入您的名稱：", "匿名玩家");
    if (playerName) {
        const now = new Date();
        const dateTime = now.toLocaleString();

        const scoresRef = firebase.database().ref('scores');
        const newScoreRef = scoresRef.push();
        newScoreRef.set({
            name: playerName,
            score: finalScore,
            playTime: playTimeSeconds,
            savedAt: dateTime
        });
    }
}

function loadScores() {
    const scoresRef = firebase.database().ref('scores');
    scoresRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
        const scoreboard = document.getElementById('scoreboard');
        scoreboard.innerHTML = ''; // 清空舊的排行榜

        snapshot.forEach(childSnapshot => {
            const data = childSnapshot.val();
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${data.name}</span>
                <span>${data.score} 分</span>
                <span>${data.playTime} 秒</span>
            `;
            scoreboard.appendChild(li);
        });
    });
}

// 頁面載入時讀取排行榜
window.onload = loadScores;