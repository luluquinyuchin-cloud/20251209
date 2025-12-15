let defaultSheet, rightSheet, jumpSheet, punchSheet;
let defaultFrames = [], rightFrames = [], jumpFrames = [], punchFrames = [];
// 新增第二個角色的變數
let newCharSheet;
let newCharFrames = [];

// 建立物件來分別管理兩種動畫的屬性
const defaultAnim = {
  totalFrames: 11,
  sheetWidth: 314,
  sheetHeight: 24,
  frameWidth: 314 / 11
};

const rightAnim = {
  totalFrames: 7,
  sheetWidth: 142,
  sheetHeight: 16,
  frameWidth: 142 / 7
};

const jumpAnim = {
  totalFrames: 4,
  sheetWidth: 19 * 4, // 19 (單幀寬) * 4 (幀數)
  sheetHeight: 24,
  frameWidth: 19
};

const punchAnim = {
  totalFrames: 7,
  sheetWidth: 331,
  sheetHeight: 32,
  frameWidth: 331 / 7
};

// 新增第二個角色的動畫屬性
const newCharAnim = {
  totalFrames: 4,
  sheetWidth: 111,
  sheetHeight: 21,
  frameWidth: 111 / 4
};


let currentFrame = 0;
let animationSpeed = 0.2; // 動畫播放速度，數值越小越慢

// 新增一個縮放因子來調整角色大小，您可以修改這個數值
const scaleFactor = 3;
let lastAnimType = 'default'; // 用於追蹤上一個動畫類型

// 角色位置變數
let characterX;
let characterY;
const moveSpeed = 3; // 角色移動速度
let facingDirection = 1; // 1 代表向右 (預設), -1 代表向左。移到 draw 外以保持狀態。

// 新增第二個角色的位置與動畫幀數變數
let newCharX;
let newCharY;
let newCharCurrentFrame = 0;

// 用於邊界碰撞，取所有動畫中最大的寬度，防止角色在切換動畫時被切邊
let maxFrameWidth;
let maxFrameHeight;

// 跳躍相關的物理變數
let velocityY = 0;
const gravity = 0.6;
const jumpPower = -15; // 負數代表向上
let isJumping = false;

// 攻擊狀態變數
let isPunching = false;

// p5.js 會在 setup() 之前執行 preload()，確保圖片資源都載入完成
function preload() {
  // 載入預設的圖片 (spriteSheet)
  defaultSheet = loadImage('1/123/1223.png');
  // 載入按下右鍵時要顯示的圖片 (walk.png)
  rightSheet = loadImage('1/walk/walk.png');
  // 載入跳躍動畫圖片
  jumpSheet = loadImage('1/jump/j.png');
  // 載入攻擊動畫圖片
  punchSheet = loadImage('1/pounch/p.png');
  // 載入第二個角色的圖片
  newCharSheet = loadImage('2/1/100.png');
}

function setup() {
  // 建立一個填滿整個瀏覽器視窗的畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化角色位置在畫布中央
  characterX = width / 2;
  characterY = height / 2; // 垂直方向保持在中央

  // 初始化第二個角色的位置在畫布偏左
  newCharX = width / 4;
  newCharY = height / 2;

  // 計算出所有動畫幀中最寬的尺寸
  maxFrameWidth = Math.max(defaultAnim.frameWidth, rightAnim.frameWidth, jumpAnim.frameWidth);
  
  // 計算出所有動畫幀中最高的尺寸
  maxFrameHeight = Math.max(defaultAnim.sheetHeight, rightAnim.sheetHeight, jumpAnim.sheetHeight, punchAnim.sheetHeight);

  // 從 defaultSheet 中擷取預設動畫的每一幀
  for (let i = 0; i < defaultAnim.totalFrames; i++) {
    let frame = defaultSheet.get(i * defaultAnim.frameWidth, 0, defaultAnim.frameWidth, defaultAnim.sheetHeight);
    defaultFrames.push(frame);
  }

  // 從 rightSheet 中擷取向右走動畫的每一幀
  for (let i = 0; i < rightAnim.totalFrames; i++) {
    let frame = rightSheet.get(i * rightAnim.frameWidth, 0, rightAnim.frameWidth, rightAnim.sheetHeight);
    rightFrames.push(frame);
  }

  // 從 jumpSheet 中擷取跳躍動畫的每一幀
  for (let i = 0; i < jumpAnim.totalFrames; i++) {
    let frame = jumpSheet.get(i * jumpAnim.frameWidth, 0, jumpAnim.frameWidth, jumpAnim.sheetHeight);
    jumpFrames.push(frame);
  }

  // 從 punchSheet 中擷取攻擊動畫的每一幀
  for (let i = 0; i < punchAnim.totalFrames; i++) {
    let frame = punchSheet.get(i * punchAnim.frameWidth, 0, punchAnim.frameWidth, punchAnim.sheetHeight);
    punchFrames.push(frame);
  }

  // 從 newCharSheet 中擷取第二個角色動畫的每一幀
  for (let i = 0; i < newCharAnim.totalFrames; i++) {
    let frame = newCharSheet.get(i * newCharAnim.frameWidth, 0, newCharAnim.frameWidth, newCharAnim.sheetHeight);
    newCharFrames.push(frame);
  }
}

function keyPressed() {
  // 當按下空白鍵，且角色在地面上，且沒有在攻擊時
  if (keyCode === 32 && !isJumping && !isPunching) {
    isPunching = true; // 進入攻擊狀態
    currentFrame = 0; // 從第一幀開始播放
  }
  // 為了防止瀏覽器預設行為 (例如按下空白鍵時捲動頁面)
  if (keyCode === 32) {
    return false;
  }
}

function draw() {
  // 將畫布背景顏色設定為 #669bbc
  background('#669bbc');

  let anim, frames, currentAnimType;

  // 處理跳躍邏輯
  // 1. 套用重力
  velocityY += gravity;
  characterY += velocityY;

  // 2. 簡易的地面碰撞偵測
  if (characterY >= height / 2) {
    characterY = height / 2; // 將角色放回地面
    velocityY = 0;
    isJumping = false;
  }

  // 3. 檢查跳躍鍵
  if (keyIsDown(UP_ARROW) && !isJumping) {
    velocityY = jumpPower;
    isJumping = true;
  }

  // 根據角色狀態決定動畫和移動
  if (isPunching) {
    anim = punchAnim;
    frames = punchFrames;
    currentAnimType = 'punch';

    // 播放一次的動畫邏輯
    currentFrame += animationSpeed;
    if (currentFrame >= punchAnim.totalFrames) {
      // 動畫播放完畢
      isPunching = false; // 結束攻擊狀態
      currentFrame = 0;
    }

  } else if (isJumping) {
    anim = jumpAnim;
    frames = jumpFrames;
    currentAnimType = 'jump';
    // 在空中時，左右移動速度可以減慢一些（可選）
    if (keyIsDown(RIGHT_ARROW)) {
      characterX += moveSpeed * 0.8;
      facingDirection = 1; // 在空中時也要更新方向
    }
    if (keyIsDown(LEFT_ARROW)) {
      characterX -= moveSpeed * 0.8;
      facingDirection = -1; // 在空中時也要更新方向
    }
  } else {
    // 只有在地面上且沒有攻擊時，才能左右走或待機
    if (keyIsDown(RIGHT_ARROW)) {
      anim = rightAnim;
      frames = rightFrames;
      currentAnimType = 'right';
      characterX += moveSpeed;
      facingDirection = 1;
    } else if (keyIsDown(LEFT_ARROW)) {
      anim = rightAnim;
      frames = rightFrames;
      currentAnimType = 'left';
      characterX -= moveSpeed;
      facingDirection = -1;
    } else {
      anim = defaultAnim;
      frames = defaultFrames;
      currentAnimType = 'default';
    }
  }

  // 如果動畫類型發生了變化，就重置 currentFrame
  if (currentAnimType !== lastAnimType) {
    // 這確保了切換動畫時，新的動畫會從第一幀開始播放
    currentFrame = 0;
  }
  lastAnimType = currentAnimType;

  // 只有在不是攻擊動畫時，才使用循環播放的邏輯
  if (!isPunching) {
    currentFrame = (currentFrame + animationSpeed) % anim.totalFrames;
  }

  // 計算放大後的寬度和高度
  const displayWidth = anim.frameWidth * scaleFactor;
  const displayHeight = anim.sheetHeight * scaleFactor;

  // 確保角色不會超出畫布邊界，使用最大寬度來計算，避免切圖
  const maxDisplayWidth = Math.max(maxFrameWidth, punchAnim.frameWidth) * scaleFactor; // 再次確認最大寬度
  characterX = constrain(characterX, maxDisplayWidth / 2, width - maxDisplayWidth / 2);

  // 同樣使用最大高度來確保角色不會跳出畫面頂部
  const maxDisplayHeight = maxFrameHeight * scaleFactor;
  characterY = constrain(characterY, maxDisplayHeight / 2, height); // 限制Y軸在畫面內

  // 繪製角色
  push(); // 儲存當前繪圖狀態，以便進行局部變換
  translate(characterX, characterY); // 將原點移動到角色中心

  if (facingDirection === -1) {
    scale(-1, 1); // 水平翻轉圖片
  }
  // 繪製當前幀的圖片，因為原點已移動到角色中心，所以繪製位置為 (-displayWidth/2, -displayHeight/2)
  image(frames[floor(currentFrame)], -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
  pop(); // 恢復之前的繪圖狀態

  // --- 繪製第二個角色 ---
  // 更新第二個角色的動畫幀
  newCharCurrentFrame = (newCharCurrentFrame + animationSpeed) % newCharAnim.totalFrames;

  // 計算第二個角色放大後的寬度和高度
  const newCharDisplayWidth = newCharAnim.frameWidth * scaleFactor;
  const newCharDisplayHeight = newCharAnim.sheetHeight * scaleFactor;

  // 繪製第二個角色
  image(newCharFrames[floor(newCharCurrentFrame)], newCharX - newCharDisplayWidth / 2, newCharY - newCharDisplayHeight / 2, newCharDisplayWidth, newCharDisplayHeight);
}

