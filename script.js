const rulesButton = document.getElementById("rules-btn");
const closeButton = document.getElementById("close-btn");
const rules = document.getElementById("rules");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const color = getComputedStyle(document.documentElement).getPropertyValue("--button-color");
const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-color");

let score = 0;
let level = 1;
let brickRowCount = 9; // Starting number of brick rows
let brickColumnCount = 5; // Starting number of brick columns

const heightRatio = 0.75;
const maxCanvasWidth = 800;

canvas.width = Math.min(window.innerWidth - 20, maxCanvasWidth);
canvas.height = canvas.width * heightRatio;

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 10,
  speed: 6,
  dx: 4,
  dy: -4,
};

let balls = [Object.assign({}, ball)];

const paddle = {
  x: canvas.width / 2 - 40,
  y: canvas.height - 20,
  w: 80,
  h: 10,
  speed: 10,
  dx: 0,
};

const brickInfo = {
  w: 70,
  h: 20,
  padding: 10,
  offsetX: 45,
  offsetY: 60,
  visible: true,
  hitCount: 0, // Track how many times the brick is hit
  type: "normal", // Normal, heart, car, etc.
};

const bricks = [];
function resetBricks() {
  bricks.length = 0; // Reset bricks array before creating a new layout

  // Increase the number of rows and columns based on the level
  brickRowCount = Math.min(12, 9 + level); // Maximum of 12 rows
  brickColumnCount = Math.min(8, 5 + Math.floor(level / 2)); // Increase columns slowly with level

  // Create new brick layout
  for (let i = 0; i < brickRowCount; i++) {
    bricks[i] = [];
    for (let j = 0; j < brickColumnCount; j++) {
      const isSpecial = Math.random() < 0.1; // 10% chance for special brick
      const x = i * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX;
      const y = j * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY;

      // Randomly assign a special brick type (heart, car, airplane, etc.)
      const types = ["normal", "airplane", "car"];
      const brickType = types[Math.floor(Math.random() * types.length)];

      bricks[i][j] = { x, y, ...brickInfo, isSpecial, type: brickType };
    }
  }
}

function drawBricks() {
  bricks.forEach((column) => {
    column.forEach((brick) => {
      if (!brick.visible) return;

      // Draw based on the brick type
      ctx.fillStyle = brick.isSpecial ? "gold" : color;
      if (brick.type === "normal") {
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      } else {
        drawSpecialBrick(brick);
      }
    });
  });
}

function drawSpecialBrick(brick) {
  ctx.save();
  switch (brick.type) {
    case "heart":
      ctx.beginPath();
      ctx.moveTo(brick.x + brick.w / 2, brick.y);
      ctx.arc(brick.x + brick.w / 2 - 10, brick.y + 10, 10, Math.PI, 0, true);
      ctx.arc(brick.x + brick.w / 2 + 10, brick.y + 10, 10, Math.PI, 0, true);
      ctx.closePath();
      ctx.fillStyle = "red";
      ctx.fill();
      break;
    case "car":
      ctx.beginPath();
      ctx.rect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = "blue";
      ctx.fill();
      ctx.closePath();
      break;
    case "airplane":
      ctx.beginPath();
      ctx.moveTo(brick.x + brick.w / 2, brick.y);
      ctx.lineTo(brick.x + brick.w, brick.y + brick.h);
      ctx.lineTo(brick.x, brick.y + brick.h);
      ctx.closePath();
      ctx.fillStyle = "gray";
      ctx.fill();
      break;
  }
  ctx.restore();
}

function drawBall(singleBall) {
  ctx.beginPath();
  ctx.arc(singleBall.x, singleBall.y, singleBall.size, 0, Math.PI * 2);
  ctx.fillStyle = secondaryColor;
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

function drawScore() {
  ctx.font = '20px "Balsamiq Sans"';
  ctx.fillText(`Score: ${score} | Level: ${level}`, canvas.width - 200, 30);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  balls.forEach(drawBall);
  drawPaddle();
  drawScore();
  drawBricks();
}

function movePaddle() {
  paddle.x += paddle.dx;
  if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
  if (paddle.x < 0) paddle.x = 0;
}

function moveBall(singleBall) {
  singleBall.x += singleBall.dx;
  singleBall.y += singleBall.dy;

  if (singleBall.x + singleBall.size > canvas.width || singleBall.x - singleBall.size < 0) {
    singleBall.dx *= -1;
  }
  if (singleBall.y - singleBall.size < 0) {
    singleBall.dy *= -1;
  }

  if (
    singleBall.x - singleBall.size > paddle.x &&
    singleBall.x + singleBall.size < paddle.x + paddle.w &&
    singleBall.y + singleBall.size > paddle.y
  ) {
    singleBall.dy = -singleBall.speed;
  }

  bricks.forEach((column) => {
    column.forEach((brick) => {
      if (brick.visible) {
        if (
          singleBall.x - singleBall.size > brick.x &&
          singleBall.x + singleBall.size < brick.x + brick.w &&
          singleBall.y + singleBall.size > brick.y &&
          singleBall.y - singleBall.size < brick.y + brick.h
        ) {
          singleBall.dy *= -1;
          brick.hitCount++;
          
          if (brick.hitCount >= 3) {
            brick.visible = false;
          }
          
          increaseScore();

          if (brick.isSpecial) {
            // Add 2 more balls as a "gift"
            balls.push(
              { ...ball, x: brick.x + brick.w / 2, y: brick.y, dx: 3, dy: -3 },
              { ...ball, x: brick.x + brick.w / 2, y: brick.y, dx: -3, dy: -3 }
            );
          }
        }
      }
    });
  });

  if (singleBall.y + singleBall.size > canvas.height) {
    balls.splice(balls.indexOf(singleBall), 1);
    if (balls.length === 0) {
      resetGame();
    }
  }
}

function increaseScore() {
  score++;
  const allBricksCleared = bricks.every((column) =>
    column.every((brick) => !brick.visible)
  );

  if (allBricksCleared) {
    level++;
    balls.forEach((b) => (b.speed += 1));
    balls = [Object.assign({}, ball)]; // Reset balls
    resetBricks(); // Update brick layout for next level

    // Additional level-up styling
    canvas.style.backgroundColor = `hsl(${level * 10}, 70%, 50%)`; // Example of dynamic background
  }
}


function resetGame() {
  score = 0;
  level = 1;
  balls = [Object.assign({}, ball)];
  resetBricks();
}

function update() {
  movePaddle();
  balls.forEach(moveBall);
  draw();
  requestAnimationFrame(update);
}

function keyDown(e) {
  if (e.key === "Right" || e.key === "ArrowRight") paddle.dx = paddle.speed;
  else if (e.key === "Left" || e.key === "ArrowLeft") paddle.dx = -paddle.speed;
}

function keyUp(e) {
  if (
    e.key === "Right" ||
    e.key === "ArrowRight" ||
    e.key === "Left" ||
    e.key === "ArrowLeft"
  ) {
    paddle.dx = 0;
  }
}

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
rulesButton.addEventListener("click", () => rules.classList.add("show"));
closeButton.addEventListener("click", () => rules.classList.remove("show"));

resetBricks();
update();
