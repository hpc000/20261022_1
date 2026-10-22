// 建立適合兒童的動物英文拖曳測驗資料。
const animals = [
  { name: "貓咪", emoji: "🐱", color: "#e7a82f", kind: "cat" },
  { name: "狗狗", emoji: "🐶", color: "#c58b4b", kind: "dog" },
  { name: "獅子", emoji: "🦁", color: "#c58b4b", kind: "lion" },
  { name: "猴子", emoji: "🐵", color: "#9b765c", kind: "monkey" },
  { name: "大象", emoji: "🐘", color: "#91aaa0", kind: "elephant" },
  { name: "企鵝", emoji: "🐧", color: "#557b91", kind: "penguin" }
];
const answers = ["CAT", "DOG", "LION", "MONKEY", "ELEPHANT", "PENGUIN"]; // 記錄六個要配對的英文動物單字。
let layout = {}; // 保存響應式版面計算結果。
let assignments = Array(6).fill(null); // 保存每隻動物收到的答案索引。
let draggedAnswer = null; // 保存目前正在拖曳的答案索引。
let dragOrigin = null; // 保存拖曳來源，方便取消放置時復原。
let resultVisible = false; // 控制成績結果視窗。
let confetti = []; // 保存高分時的彩帶粒子。
let hoverButton = false; // 記錄滑鼠是否停在交卷按鈕上。
let scrollOffset = 0; // 保存畫布內容目前的垂直捲動距離。
let scrollStartY = null; // 保存開始捲動時的指標位置。
let scrollStartOffset = 0; // 保存開始捲動時的內容位置。

// 初始化全螢幕畫布與繪圖樣式。
function setup() {
  createCanvas(windowWidth, windowHeight); // 讓畫布一開始填滿瀏覽器視窗。
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2)); // 控制高解析螢幕的繪圖負擔。
  textFont("sans-serif"); // 設定繁體中文字型的通用後備字型。
  textAlign(LEFT, CENTER); // 設定文字預設對齊方式。
  noStroke(); // 移除圖形預設外框。
  calculateLayout(); // 依目前畫布尺寸計算介面位置。
}

// 依照視窗大小安排題目卡、答案卡與操作區。
function calculateLayout() {
  const compact = width < 760; // 小螢幕切換為兩欄配置。
  const margin = compact ? 18 : Math.max(34, width * 0.055); // 設定不同螢幕的左右留白。
  const gap = compact ? 10 : 16; // 設定卡片間距。
  const columns = compact ? 2 : 3; // 設定題目卡欄數。
  const rows = 6 / columns; // 計算題目卡列數。
  const cardWidth = (width - margin * 2 - gap * (columns - 1)) / columns; // 計算單張題目卡寬度。
  const headerHeight = compact ? 98 : 112; // 設定標題區高度。
  const footerHeight = compact ? 76 : 88; // 設定交卷區高度。
  const answerRows = compact ? 3 : 2; // 設定答案選項列數。
  const answerGap = compact ? 8 : 12; // 設定答案卡間距。
  const answerHeight = compact ? 58 : 62; // 設定答案卡高度。
  const answerAreaHeight = answerRows * answerHeight + (answerRows - 1) * answerGap; // 計算答案區需要的高度。
  const top = headerHeight; // 設定題目卡區域起點。
  const bottomPadding = compact ? 14 : 20; // 設定畫布底部留白。
  const cardGapY = compact ? 9 : 13; // 設定題目卡垂直間距。
  const availableCardHeight = height - top - footerHeight - answerAreaHeight - bottomPadding - cardGapY * (rows - 1) - 18; // 計算題目卡可用高度。
  const cardHeight = Math.max(compact ? 82 : 124, Math.min(compact ? 138 : 174, availableCardHeight / rows)); // 限制題目卡高度以避免畫面擠壓。
  const gridHeight = rows * cardHeight + (rows - 1) * cardGapY; // 計算題目卡網格高度。
  const answerTop = top + gridHeight + (compact ? 12 : 18); // 設定答案區起點。
  const answerWidth = (width - margin * 2 - answerGap * (columns - 1)) / columns; // 計算單張答案卡寬度。
  const buttonWidth = compact ? Math.min(width - margin * 2, 250) : 236; // 設定交卷按鈕寬度。
  const buttonHeight = compact ? 48 : 52; // 設定交卷按鈕高度。
  const buttonX = (width - buttonWidth) / 2; // 計算交卷按鈕水平位置。
  const buttonY = answerTop + answerAreaHeight + (compact ? 10 : 14); // 將交卷按鈕接在答案區下方。
  const contentHeight = buttonY + buttonHeight + 16; // 計算整個可捲動內容的總高度。
  const maxScroll = Math.max(0, contentHeight - height); // 計算內容需要捲動的最大距離。

  layout = { compact, margin, gap, columns, rows, cardWidth, cardHeight, top, cardGapY, answerTop, answerGap, answerHeight, answerWidth, answerRows, buttonX, buttonY, buttonWidth, buttonHeight, headerHeight, contentHeight, maxScroll }; // 保存版面資料供繪圖與拖曳共用。
  scrollOffset = constrain(scrollOffset, 0, maxScroll); // 依新版面限制目前捲動位置。
}

// 每一影格更新動物插圖、卡片狀態與粒子動畫。
function draw() {
  drawBackground(); // 繪製暖白色背景與裝飾圓點。
  drawHeader(); // 繪製測驗標題與進度。
  drawingContext.save(); // 暫存畫布狀態以設定可捲動區域。
  drawingContext.beginPath(); // 開始建立內容裁切路徑。
  drawingContext.rect(0, layout.headerHeight, width, height - layout.headerHeight); // 限定內容只能繪製在標題下方。
  drawingContext.clip(); // 裁切超出畫布可視範圍的內容。
  push(); // 暫存 p5 座標狀態。
  translate(0, -scrollOffset); // 依目前捲動距離上下移動畫布內容。
  drawAnimalCards(); // 繪製六張固定動物題目卡。
  drawAnswerCards(); // 繪製尚未配對的英文答案卡。
  drawSubmitButton(); // 繪製交卷按鈕。
  pop(); // 還原 p5 座標狀態。
  drawingContext.restore(); // 還原畫布裁切狀態。
  drawScrollIndicator(); // 顯示目前的捲動位置。
  if (draggedAnswer !== null) drawDraggedAnswer(); // 跟隨指標繪製正在拖曳的答案卡。
  if (resultVisible) drawResult(); // 顯示交卷後的成績畫面。
  drawConfetti(); // 將高分彩帶繪製在成績視窗上方。
}

// 繪製畫布背景與細緻的紙感圓點。
function drawBackground() {
  background("#f7f6f0"); // 使用柔和的淺色背景。
  fill("#e9eee4"); // 設定淡綠色裝飾。
  circle(width - 28, 28, 150); // 右上角加入淡色圓形裝飾。
  fill("#f1e7d6"); // 設定淡金色裝飾。
  circle(18, height - 18, 118); // 左下角加入淡色圓形裝飾。
  stroke("#e9e8df"); // 設定背景點陣顏色。
  strokeWeight(1); // 設定背景點陣線寬。
  for (let x = 16; x < width; x += 24) { // 逐欄繪製細小背景點。
    for (let y = 16; y < height; y += 24) { // 逐列繪製細小背景點。
      point(x, y); // 在網格交點繪製背景點。
    }
  }
  noStroke(); // 還原圖形外框設定。
}

// 繪製標題、說明與完成題數。
function drawHeader() {
  const left = layout.margin; // 取得標題左側位置。
  fill("#466b56"); // 設定小標籤的深綠色。
  textSize(layout.compact ? 10 : 11); // 設定小標籤字級。
  textStyle(BOLD); // 將小標籤設為粗體。
  text("ANIMAL WORDS  /  英文配對", left, 20); // 顯示測驗分類。
  fill("#24382d"); // 設定主標題顏色。
  textSize(layout.compact ? 25 : 34); // 依螢幕尺寸設定主標題字級。
  textStyle(BOLD); // 將主標題設為粗體。
  text("動物英文小挑戰", left, layout.compact ? 51 : 58); // 顯示主標題。
  fill("#758078"); // 設定副標題顏色。
  textSize(layout.compact ? 11 : 13); // 依螢幕尺寸設定副標題字級。
  textStyle(NORMAL); // 將副標題設為一般字重。
  text("把正確的英文單字，拖曳到對應的動物圖卡。", left, layout.compact ? 78 : 91); // 說明英文單字配對方式。
  const count = assignments.filter((value) => value !== null).length; // 計算已完成配對的數量。
  textAlign(RIGHT, CENTER); // 將進度文字靠右對齊。
  fill("#617164"); // 設定進度文字顏色。
  textSize(layout.compact ? 11 : 13); // 設定進度文字大小。
  text(`${count} / 6 已配對`, width - layout.margin, layout.compact ? 51 : 58); // 顯示配對進度。
  textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
  textStyle(NORMAL); // 還原預設文字字重。
}

// 繪製固定的六張動物插圖卡與答案放置區。
function drawAnimalCards() {
  for (let index = 0; index < animals.length; index += 1) { // 依序繪製每個動物題目。
    const position = cardPosition(index); // 計算目前動物卡的位置。
    const animal = animals[index]; // 取得目前動物資料。
    const assigned = assignments[index]; // 取得目前動物的配對答案。
    const isTarget = draggedAnswer !== null && pointInside(position.x, position.y, layout.cardWidth, layout.cardHeight); // 判斷拖曳答案是否位於此卡片。
    fill(assigned !== null ? "#eef4e8" : "#ffffff"); // 已配對的卡片改用淡綠底色。
    stroke(isTarget ? "#4c8a61" : assigned !== null ? "#9bb99b" : "#e4e6dd"); // 依拖曳與配對狀態設定外框。
    strokeWeight(isTarget ? 2 : 1); // 拖曳命中時加粗外框。
    rect(position.x, position.y, layout.cardWidth, layout.cardHeight, 13); // 繪製圓角題目卡。
    noStroke(); // 移除後續圖形的外框。
    fill(animal.color); // 設定動物標籤底色。
    circle(position.x + 18, position.y + 18, 7); // 繪製動物卡的色彩識別點。
    fill("#516057"); // 設定動物名稱顏色。
    textSize(layout.compact ? 11 : 12); // 設定動物名稱字級。
    textStyle(BOLD); // 將動物名稱設為粗體。
    text(`第 ${index + 1} 題　${animal.name}`, position.x + 30, position.y + 18); // 顯示題目編號與中文動物名稱。
    drawAnimal(animal, position.x + layout.cardWidth / 2, position.y + layout.cardHeight * 0.48, index); // 繪製會微微動起來的彩色動物圖示。
    const slotY = position.y + layout.cardHeight - (layout.compact ? 30 : 34); // 計算答案放置區的垂直位置。
    if (assigned === null) { // 尚未配對時繪製提示槽。
      fill(isTarget ? "#e9f4e9" : "#f7f8f4"); // 依拖曳命中狀態設定提示槽底色。
      stroke(isTarget ? "#6b9c70" : "#d7ddd4"); // 設定提示槽外框顏色。
      strokeWeight(1); // 設定提示槽外框粗細。
      drawingContext.setLineDash([4, 4]); // 將提示槽外框改成虛線。
      rect(position.x + 9, slotY - 13, layout.cardWidth - 18, 26, 7); // 繪製答案放置提示槽。
      drawingContext.setLineDash([]); // 還原一般實線樣式。
      noStroke(); // 移除提示文字外框。
      fill("#9ba49a"); // 設定提示文字顏色。
      textAlign(CENTER, CENTER); // 將提示文字置中。
      textSize(layout.compact ? 9 : 10); // 設定提示文字大小。
      text("拖曳答案到這裡", position.x + layout.cardWidth / 2, slotY); // 顯示拖曳提示。
      textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
    } else { // 已配對時顯示答案摘要。
      fill("#e5f0e3"); // 設定已配對答案的底色。
      noStroke(); // 移除答案摘要外框。
      rect(position.x + 8, slotY - 13, layout.cardWidth - 16, 26, 7); // 繪製已配對答案摘要底板。
      fill("#41684e"); // 設定答案摘要文字顏色。
      textAlign(CENTER, CENTER); // 將答案摘要置中。
      textSize(layout.compact ? 11 : 12); // 設定已配對英文單字字級。
      text(answers[assigned], position.x + 13, slotY, layout.cardWidth - 26, 22); // 顯示已配對的英文單字。
      textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
    }
    noStroke(); // 還原無外框設定。
    textStyle(NORMAL); // 還原一般字重。
  }
}

// 繪製六種以動態插圖呈現的動物造型。
function drawAnimal(animal, centerX, centerY, index) {
  const bob = sin(frameCount * 0.045 + index * 1.7) * (layout.compact ? 2 : 3); // 計算每隻動物不同步的呼吸位移。
  push(); // 暫存目前繪圖狀態。
  translate(centerX, centerY + bob); // 移動座標原點並加入輕柔浮動。
  const scaleValue = layout.compact ? Math.min(layout.cardWidth / 115, layout.cardHeight / 116) : Math.min(layout.cardWidth / 135, layout.cardHeight / 128); // 依卡片大小縮放動物圖示。
  scale(scaleValue); // 套用動物圖示縮放比例。
  textFont("Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif"); // 使用系統提供的彩色表情符號字型。
  textAlign(CENTER, CENTER); // 將動物圖示置中。
  textSize(70); // 設定清楚易認的動物圖示大小。
  text(animal.emoji, 0, 0); // 繪製對應的彩色動物圖示。
  pop(); // 還原繪圖狀態。
}

// 繪製簡單、容易辨認的貓咪插圖。
function drawCat(colorValue) {
  fill(colorValue); // 填入貓咪主色。
  ellipse(0, 17, 50, 34); // 繪製貓咪身體。
  circle(0, -8, 42); // 繪製貓咪頭部。
  triangle(-20, -18, -17, -42, -3, -24); // 繪製貓咪左耳。
  triangle(20, -18, 17, -42, 3, -24); // 繪製貓咪右耳。
  noFill(); // 讓貓咪尾巴以線條呈現。
  stroke(colorValue); // 設定貓咪尾巴顏色。
  strokeWeight(6); // 設定貓咪尾巴粗細。
  arc(28, 13, 25, 29, -PI * 0.6, PI * 0.5); // 繪製貓咪翹起的尾巴。
  noStroke(); // 移除後續圖形外框。
  fill("#364138"); // 設定貓咪五官顏色。
  circle(-8, -9, 3); // 繪製貓咪左眼。
  circle(8, -9, 3); // 繪製貓咪右眼。
  triangle(-3, -1, 3, -1, 0, 3); // 繪製貓咪鼻子。
  fill("#f6e5cb"); // 設定貓咪嘴邊顏色。
  ellipse(-5, 4, 10, 7); // 繪製左側嘴邊。
  ellipse(5, 4, 10, 7); // 繪製右側嘴邊。
}

// 繪製簡單、容易辨認的狗狗插圖。
function drawDog(colorValue) {
  fill(colorValue); // 填入狗狗主色。
  ellipse(0, 16, 52, 35); // 繪製狗狗身體。
  circle(0, -8, 42); // 繪製狗狗頭部。
  ellipse(-20, -9, 15, 28); // 繪製狗狗左耳。
  ellipse(20, -9, 15, 28); // 繪製狗狗右耳。
  fill("#f3dfc6"); // 設定狗狗嘴部顏色。
  ellipse(0, 2, 22, 16); // 繪製狗狗嘴部。
  fill("#364138"); // 設定狗狗五官顏色。
  circle(-8, -10, 3); // 繪製狗狗左眼。
  circle(8, -10, 3); // 繪製狗狗右眼。
  ellipse(0, -1, 7, 5); // 繪製狗狗鼻子。
  fill("#d77d70"); // 設定狗狗舌頭顏色。
  ellipse(0, 9, 7, 9); // 繪製狗狗吐出的舌頭。
}

// 繪製長頸鹿的簡化插圖。
function drawGiraffe(colorValue) {
  fill(colorValue); // 填入長頸鹿主色。
  ellipse(0, 20, 48, 31); // 繪製長頸鹿身體。
  rect(9, -24, 13, 47, 7); // 繪製長頸鹿長脖子。
  ellipse(17, -29, 26, 23); // 繪製長頸鹿頭部。
  rect(11, -47, 4, 14, 2); // 繪製左側角突。
  rect(21, -47, 4, 14, 2); // 繪製右側角突。
  fill("#a66e26"); // 設定斑點顏色。
  circle(-13, 13, 8); // 繪製身體斑點。
  circle(0, 23, 7); // 繪製身體斑點。
  circle(14, 15, 7); // 繪製身體斑點。
  circle(13, -4, 5); // 繪製脖子斑點。
  fill("#26352d"); // 設定眼睛顏色。
  circle(24, -31, 3); // 繪製眼睛。
  fill("#2e3150"); // 用深色呈現長頸鹿的舌頭。
  arc(32, -21, 12, 15, 0, PI); // 繪製伸出的深色舌頭。
}

// 繪製大象的簡化插圖。
function drawElephant(colorValue) {
  fill(colorValue); // 填入大象主色。
  ellipse(0, 14, 52, 41); // 繪製大象身體。
  ellipse(-19, -5, 28, 35); // 繪製大象左耳。
  ellipse(19, -5, 28, 35); // 繪製大象右耳。
  ellipse(2, -7, 33, 34); // 繪製大象頭部。
  rect(3, 1, 10, 32, 5); // 繪製大象鼻子。
  fill("#cad9d1"); // 設定大象耳朵內側顏色。
  ellipse(-19, -5, 14, 21); // 繪製左耳內側。
  ellipse(19, -5, 14, 21); // 繪製右耳內側。
  fill("#34433a"); // 設定眼睛顏色。
  circle(12, -10, 3); // 繪製大象眼睛。
  stroke("#839b90"); // 設定耳朵動作線顏色。
  strokeWeight(2); // 設定耳朵動作線粗細。
  line(-34, -10, -42, -15); // 繪製左側搧風動作線。
  line(34, -10, 42, -15); // 繪製右側搧風動作線。
  noStroke(); // 還原無外框設定。
}

// 繪製企鵝的簡化插圖。
function drawPenguin(colorValue) {
  fill(colorValue); // 填入企鵝主色。
  ellipse(0, 9, 44, 58); // 繪製企鵝身體。
  fill("#f7f6ec"); // 設定企鵝腹部顏色。
  ellipse(0, 15, 27, 39); // 繪製企鵝腹部。
  fill("#f0b64c"); // 設定企鵝喙與腳的顏色。
  triangle(5, -9, 22, -5, 5, -1); // 繪製企鵝喙。
  ellipse(-11, 37, 17, 7); // 繪製左腳。
  ellipse(11, 37, 17, 7); // 繪製右腳。
  fill("#26352d"); // 設定企鵝眼睛顏色。
  circle(0, -13, 4); // 繪製企鵝眼睛。
  fill("#cbbf9b"); // 設定小石頭顏色。
  ellipse(30, 27, 12, 8); // 繪製企鵝腳邊的小石頭。
}

// 繪製紅鶴的簡化插圖。
function drawFlamingo(colorValue) {
  noFill(); // 讓紅鶴的長脖子使用線條繪製。
  stroke(colorValue); // 設定紅鶴線條顏色。
  strokeWeight(8); // 設定紅鶴長脖子的線寬。
  arc(-3, -4, 29, 47, PI * 0.78, PI * 1.92); // 繪製紅鶴彎曲的長脖子。
  line(-2, 19, -4, 43); // 繪製紅鶴左腿。
  line(9, 19, 14, 43); // 繪製紅鶴右腿。
  noStroke(); // 移除後續圖形外框。
  fill(colorValue); // 填入紅鶴主色。
  ellipse(8, 11, 39, 25); // 繪製紅鶴身體。
  ellipse(10, -21, 17, 14); // 繪製紅鶴頭部。
  fill("#f3c451"); // 設定紅鶴喙的黃色部分。
  triangle(16, -22, 31, -18, 17, -15); // 繪製紅鶴喙。
  fill("#33433b"); // 設定紅鶴眼睛顏色。
  circle(13, -23, 3); // 繪製紅鶴眼睛。
}

// 繪製獅子的簡化插圖。
function drawLion(colorValue) {
  fill("#cf994e"); // 設定獅子鬃毛顏色。
  circle(0, 1, 61); // 繪製獅子鬃毛。
  fill(colorValue); // 填入獅子臉部主色。
  ellipse(0, 2, 39, 37); // 繪製獅子臉部。
  fill("#f4d9ac"); // 設定獅子口鼻顏色。
  ellipse(0, 11, 23, 15); // 繪製獅子口鼻。
  fill("#364138"); // 設定獅子五官顏色。
  circle(-8, -3, 3); // 繪製左眼。
  circle(8, -3, 3); // 繪製右眼。
  triangle(-3, 8, 3, 8, 0, 12); // 繪製獅子鼻子。
  noFill(); // 讓嘴巴以線條呈現。
  stroke("#75533b"); // 設定獅子嘴巴線條顏色。
  strokeWeight(1.5); // 設定獅子嘴巴線條粗細。
  arc(0, 12, 11, 8, 0, PI); // 繪製獅子微笑嘴型。
  noStroke(); // 還原無外框設定。
}

// 繪製猴子的簡化插圖。
function drawMonkey(colorValue) {
  noFill(); // 讓猴子尾巴使用線條繪製。
  stroke(colorValue); // 設定猴子尾巴顏色。
  strokeWeight(6); // 設定猴子尾巴粗細。
  arc(29, 17, 30, 32, -PI * 0.4, PI * 1.15); // 繪製捲曲的猴子尾巴。
  noStroke(); // 移除後續圖形外框。
  fill(colorValue); // 填入猴子主色。
  ellipse(0, 12, 45, 48); // 繪製猴子身體。
  circle(0, -14, 40); // 繪製猴子頭部。
  fill("#d4ad8c"); // 設定猴子臉部顏色。
  ellipse(0, -10, 27, 24); // 繪製猴子臉部。
  circle(-19, -15, 12); // 繪製猴子左耳。
  circle(19, -15, 12); // 繪製猴子右耳。
  fill("#344138"); // 設定猴子眼睛顏色。
  circle(-6, -13, 3); // 繪製左眼。
  circle(6, -13, 3); // 繪製右眼。
  fill("#b7a88a"); // 設定手中小石頭顏色。
  ellipse(-27, 16, 12, 8); // 繪製猴子手中的小石頭。
}

// 計算指定索引的題目卡左上角位置。
function cardPosition(index) {
  const column = index % layout.columns; // 計算題目卡所在欄位。
  const row = Math.floor(index / layout.columns); // 計算題目卡所在列。
  return { x: layout.margin + column * (layout.cardWidth + layout.gap), y: layout.top + row * (layout.cardHeight + layout.cardGapY) }; // 回傳題目卡位置。
}

// 繪製尚未放入題目卡的文字答案選項。
function drawAnswerCards() {
  const available = answers.map((_, index) => index).filter((index) => !assignments.includes(index) && draggedAnswer !== index); // 找出尚未配對的答案索引。
  const rows = Math.ceil(available.length / layout.columns); // 計算剩餘答案所需列數。
  for (let visibleIndex = 0; visibleIndex < available.length; visibleIndex += 1) { // 依序繪製尚未配對的答案。
    const answerIndex = available[visibleIndex]; // 取得目前答案索引。
    const position = answerPosition(visibleIndex, rows); // 計算答案卡位置。
    const hovered = pointInside(position.x, position.y, layout.answerWidth, layout.answerHeight); // 判斷指標是否停在答案卡上。
    fill(hovered ? "#fffdf6" : "#fffefa"); // 設定答案卡底色。
    stroke(hovered ? "#b6a77d" : "#e7e4d8"); // 設定答案卡外框。
    strokeWeight(hovered ? 1.5 : 1); // 滑鼠移入時略微加粗外框。
    rect(position.x, position.y, layout.answerWidth, layout.answerHeight, 9); // 繪製答案卡。
    noStroke(); // 移除文字外框。
    fill("#bf8c3e"); // 設定答案序號顏色。
    textSize(layout.compact ? 9 : 10); // 設定答案序號字級。
    textStyle(BOLD); // 將答案序號設為粗體。
    text(String(answerIndex + 1).padStart(2, "0"), position.x + 12, position.y + 17); // 顯示答案序號。
    fill("#37453c"); // 設定答案文字顏色。
    textStyle(NORMAL); // 設定答案文字一般字重。
    const baseWordSize = layout.compact ? 16 : 19; // 設定兒童易讀的英文單字基準字級。
    textSize(baseWordSize); // 套用英文單字基準字級。
    const wordWidth = textWidth(answers[answerIndex]); // 量測英文單字目前的實際寬度。
    const availableWidth = layout.answerWidth - 28; // 計算卡片內可供英文單字使用的寬度。
    textSize(baseWordSize * Math.min(1, availableWidth / wordWidth)); // 依實際寬度縮小字級以避免英文單字超出卡片。
    textAlign(CENTER, CENTER); // 將英文單字置中顯示。
    text(answers[answerIndex], position.x + layout.answerWidth / 2, position.y + layout.answerHeight / 2 + 5); // 單行顯示可拖曳的英文單字。
    textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
  }
}

// 在畫布右側顯示目前的垂直捲動位置。
function drawScrollIndicator() {
  if (layout.maxScroll <= 0) return; // 內容完全可見時不顯示捲動提示。
  const trackTop = layout.headerHeight + 6; // 設定捲動軌道起點。
  const trackHeight = height - trackTop - 8; // 計算捲動軌道高度。
  const thumbHeight = Math.max(28, trackHeight * height / layout.contentHeight); // 依可視比例計算捲動滑塊高度。
  const thumbY = trackTop + (trackHeight - thumbHeight) * scrollOffset / layout.maxScroll; // 計算捲動滑塊目前位置。
  noStroke(); // 移除捲動指示器外框。
  fill("#dfe4da"); // 設定捲動軌道顏色。
  rect(width - 5, trackTop, 3, trackHeight, 2); // 繪製捲動軌道。
  fill("#839583"); // 設定捲動滑塊顏色。
  rect(width - 5, thumbY, 3, thumbHeight, 2); // 繪製捲動滑塊。
}

// 計算指定答案卡的左上角位置。
function answerPosition(visibleIndex, rows) {
  const column = visibleIndex % layout.columns; // 計算答案卡所在欄位。
  const row = Math.floor(visibleIndex / layout.columns); // 計算答案卡所在列。
  const visibleRows = Math.max(rows, 1); // 至少保留一列的答案卡高度。
  return { x: layout.margin + column * (layout.answerWidth + layout.answerGap), y: layout.answerTop + row * (layout.answerHeight + layout.answerGap) + (layout.answerRows - visibleRows) * (layout.answerHeight + layout.answerGap) / 2 }; // 回傳答案卡位置並讓剩餘選項垂直置中。
}

// 繪製交卷按鈕與尚未完成時的提示狀態。
function drawSubmitButton() {
  const ready = assignments.every((value) => value !== null); // 檢查六題是否都已完成配對。
  hoverButton = ready && pointInside(layout.buttonX, layout.buttonY, layout.buttonWidth, layout.buttonHeight); // 記錄按鈕是否可互動且正被指向。
  fill(ready ? (hoverButton ? "#345b43" : "#466b56") : "#c8cdc6"); // 依完成狀態設定按鈕顏色。
  noStroke(); // 移除按鈕外框。
  rect(layout.buttonX, layout.buttonY, layout.buttonWidth, layout.buttonHeight, 10); // 繪製圓角交卷按鈕。
  fill(ready ? "#ffffff" : "#f5f6f3"); // 設定按鈕文字顏色。
  textAlign(CENTER, CENTER); // 將按鈕文字置中。
  textStyle(BOLD); // 將按鈕文字設為粗體。
  textSize(layout.compact ? 13 : 14); // 設定按鈕文字字級。
  text(ready ? "交卷看成績　→" : "完成六題配對後即可交卷", width / 2, layout.buttonY + layout.buttonHeight / 2); // 顯示按鈕文字或完成提示。
  textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
  textStyle(NORMAL); // 還原一般字重。
}

// 繪製拖曳中的答案卡預覽。
function drawDraggedAnswer() {
  const previewWidth = Math.min(layout.answerWidth, width - 28); // 限制拖曳預覽卡寬度。
  const previewX = constrain(mouseX - previewWidth / 2, 10, width - previewWidth - 10); // 避免拖曳預覽卡超出畫布左右邊界。
  const previewY = constrain(mouseY - layout.answerHeight / 2, 8, height - layout.answerHeight - 8); // 避免拖曳預覽卡超出畫布上下邊界。
  fill("#fffefa"); // 設定預覽卡底色。
  stroke("#4c8a61"); // 設定預覽卡外框顏色。
  strokeWeight(2); // 加粗預覽卡外框。
  rect(previewX, previewY, previewWidth, layout.answerHeight, 9); // 繪製拖曳預覽卡。
  noStroke(); // 移除答案文字外框。
  fill("#37453c"); // 設定答案文字顏色。
  const baseWordSize = layout.compact ? 16 : 19; // 設定拖曳中英文單字的基準字級。
  textSize(baseWordSize); // 套用拖曳中英文單字的基準字級。
  const wordWidth = textWidth(answers[draggedAnswer]); // 量測拖曳中英文單字的實際寬度。
  const availableWidth = previewWidth - 28; // 計算拖曳卡片內可供文字使用的寬度。
  textSize(baseWordSize * Math.min(1, availableWidth / wordWidth)); // 依實際寬度縮小拖曳文字以避免超出預覽卡片。
  textAlign(CENTER, CENTER); // 將拖曳中的英文單字置中。
  text(answers[draggedAnswer], previewX + previewWidth / 2, previewY + layout.answerHeight / 2); // 單行顯示目前拖曳的英文單字。
  textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
}

// 繪製成績視窗與高分提示。
function drawResult() {
  fill(28, 43, 34, 160); // 設定結果視窗的半透明遮罩。
  rect(0, 0, width, height); // 遮住背景介面並凸顯成績視窗。
  const panelWidth = Math.min(width - 36, 430); // 設定成績視窗寬度。
  const panelHeight = layout.compact ? 300 : 330; // 依螢幕大小設定成績視窗高度。
  const panelX = (width - panelWidth) / 2; // 計算成績視窗水平位置。
  const panelY = (height - panelHeight) / 2; // 計算成績視窗垂直位置。
  fill("#fffefa"); // 設定成績視窗底色。
  noStroke(); // 移除成績視窗外框。
  rect(panelX, panelY, panelWidth, panelHeight, 18); // 繪製圓角成績視窗。
  const score = assignments.reduce((total, answerIndex, animalIndex) => total + (answerIndex === animalIndex ? 1 : 0), 0); // 計算配對正確的題數。
  const percentage = Math.round((score / animals.length) * 100); // 計算整體百分比成績。
  fill("#657a68"); // 設定成績小標籤顏色。
  textAlign(CENTER, CENTER); // 將成績視窗文字置中。
  textStyle(BOLD); // 將成績小標籤設為粗體。
  textSize(11); // 設定成績小標籤字級。
  text("QUIZ COMPLETE  /  測驗完成", width / 2, panelY + 45); // 顯示測驗完成標籤。
  fill("#2e4636"); // 設定成績數字顏色。
  textSize(layout.compact ? 54 : 62); // 設定成績數字大小。
  text(`${percentage}%`, width / 2, panelY + 116); // 顯示百分比成績。
  fill("#6a756c"); // 設定成績說明顏色。
  textStyle(NORMAL); // 將成績說明設為一般字重。
  textSize(14); // 設定成績說明字級。
  text(`答對 ${score} / 6 題`, width / 2, panelY + 162); // 顯示答對題數。
  fill(percentage > 80 ? "#4f8057" : "#a7793d"); // 依是否達到高分設定鼓勵文字顏色。
  textSize(layout.compact ? 12 : 13); // 設定鼓勵文字字級。
  text(percentage > 80 ? "太棒了！動物知識小達人！" : "再觀察一次，記住這些有趣知識！", width / 2, panelY + 197); // 顯示不同成績的鼓勵訊息。
  fill("#466b56"); // 設定重新挑戰按鈕顏色。
  rect(width / 2 - 98, panelY + panelHeight - 62, 196, 42, 9); // 繪製重新挑戰按鈕。
  fill("#ffffff"); // 設定重新挑戰按鈕文字顏色。
  textStyle(BOLD); // 將按鈕文字設為粗體。
  textSize(13); // 設定按鈕文字字級。
  text("再玩一次", width / 2, panelY + panelHeight - 41); // 顯示重新挑戰文字。
  textAlign(LEFT, CENTER); // 還原預設文字對齊方式。
  textStyle(NORMAL); // 還原一般字重。
}

// 更新並繪製超過八十分時出現的彩帶。
function drawConfetti() {
  if (confetti.length === 0) return; // 沒有彩帶粒子時略過繪製。
  for (let index = confetti.length - 1; index >= 0; index -= 1) { // 從後往前更新粒子，方便移除已結束的彩帶。
    const piece = confetti[index]; // 取得目前彩帶粒子。
    piece.x += piece.speedX; // 更新彩帶水平位置。
    piece.y += piece.speedY; // 更新彩帶垂直位置。
    piece.speedY += 0.08; // 模擬重力讓彩帶往下落。
    piece.rotation += piece.spin; // 更新彩帶旋轉角度。
    piece.life -= 1; // 逐漸降低彩帶存活時間。
    push(); // 暫存彩帶繪圖狀態。
    translate(piece.x, piece.y); // 移動到目前彩帶位置。
    rotate(piece.rotation); // 旋轉彩帶。
    fill(piece.color); // 設定彩帶顏色。
    rect(-piece.width / 2, -piece.height / 2, piece.width, piece.height, 1); // 繪製彩帶小紙片。
    pop(); // 還原彩帶繪圖狀態。
    if (piece.life <= 0 || piece.y > height + 30) confetti.splice(index, 1); // 移除已落下或存活時間結束的粒子。
  }
}

// 滑鼠或觸控按下時，判斷是否開始拖曳答案或點擊按鈕。
function mousePressed() {
  if (resultVisible) { // 結果視窗顯示時只處理重新挑戰按鈕。
    const panelHeight = layout.compact ? 300 : 330; // 計算結果視窗高度。
    const panelY = (height - panelHeight) / 2; // 計算結果視窗垂直位置。
    if (mouseY >= panelY + panelHeight - 62 && mouseY <= panelY + panelHeight - 20) resetQuiz(); // 點擊重新挑戰按鈕時重置測驗。
    return false; // 阻止瀏覽器將觸控手勢解讀為捲動。
  }
  if (hoverButton) { // 按鈕可用且被點擊時交卷。
    submitQuiz(); // 計算成績並顯示結果。
    return false; // 阻止觸控事件繼續傳遞。
  }
  const available = answers.map((_, index) => index).filter((index) => !assignments.includes(index)); // 找出畫面上目前已放置的答案選項。
  const rows = Math.ceil(available.length / layout.columns); // 計算答案選項所在列數。
  for (let visibleIndex = 0; visibleIndex < available.length; visibleIndex += 1) { // 逐張檢查可拖曳答案。
    const answerIndex = available[visibleIndex]; // 取得目前答案索引。
    const position = answerPosition(visibleIndex, rows); // 取得目前答案卡位置。
    if (pointInside(position.x, position.y, layout.answerWidth, layout.answerHeight)) { // 指標落在答案卡上時啟動拖曳。
      draggedAnswer = answerIndex; // 記錄正在拖曳的答案索引。
      dragOrigin = { type: "tray", index: answerIndex }; // 記錄答案卡原本位於下方選項區。
      return false; // 阻止瀏覽器處理預設拖曳或捲動。
    }
  }
  for (let animalIndex = 0; animalIndex < assignments.length; animalIndex += 1) { // 檢查已配對答案是否要重新調整。
    const position = cardPosition(animalIndex); // 取得目前動物卡位置。
    const slotY = position.y + layout.cardHeight - (layout.compact ? 30 : 34); // 取得答案摘要區位置。
    if (assignments[animalIndex] !== null && mouseY + scrollOffset >= slotY - 14 && mouseY + scrollOffset <= slotY + 14 && mouseX >= position.x + 8 && mouseX <= position.x + layout.cardWidth - 8) { // 點到已配對文字時允許重新拖曳。
      draggedAnswer = assignments[animalIndex]; // 取出已配對答案作為拖曳項目。
      dragOrigin = { type: "card", index: animalIndex }; // 記錄答案原本配對的動物。
      assignments[animalIndex] = null; // 暫時清空原本的配對位置。
      return false; // 阻止瀏覽器處理預設拖曳或捲動。
    }
  }
  scrollStartY = mouseY; // 記錄空白處按下位置以開始捲動畫布。
  scrollStartOffset = scrollOffset; // 記錄開始捲動時的內容位置。
  return false; // 阻止觸控畫布時觸發頁面捲動。
}

// 支援觸控螢幕在畫布內上下瀏覽題目與答案。
function touchMoved() {
  if (draggedAnswer === null && scrollStartY !== null) scrollOffset = constrain(scrollStartOffset + scrollStartY - mouseY, 0, layout.maxScroll); // 沒有拖曳答案時依觸控位移捲動畫布。
  return false; // 阻止瀏覽器將觸控手勢轉成整頁捲動。
}

// 支援滑鼠滾輪與觸控板瀏覽畫布內容。
function mouseWheel(event) {
  scrollOffset = constrain(scrollOffset + event.delta, 0, layout.maxScroll); // 依滾輪方向調整內容捲動位置。
  return false; // 阻止瀏覽器捲動整個頁面。
}

// 放開滑鼠或觸控時，將答案放入命中的動物卡。
function mouseReleased() {
  if (draggedAnswer === null) { // 沒有拖曳答案時結束捲動手勢。
    scrollStartY = null; // 清除捲動起點。
    return false; // 阻止瀏覽器執行預設滑鼠或觸控行為。
  }
  let targetIndex = -1; // 預設沒有命中的題目卡。
  for (let index = 0; index < animals.length; index += 1) { // 逐一檢查放開位置是否在動物卡內。
    const position = cardPosition(index); // 取得目前動物卡位置。
    if (pointInside(position.x, position.y, layout.cardWidth, layout.cardHeight)) targetIndex = index; // 記錄命中的動物卡。
  }
  if (targetIndex >= 0) { // 放在題目卡上時完成配對。
    const replacedAnswer = assignments[targetIndex]; // 暫存該題原本的答案。
    assignments[targetIndex] = draggedAnswer; // 將拖曳答案放入目標題目卡。
    if (replacedAnswer !== null && dragOrigin.type === "card") assignments[dragOrigin.index] = replacedAnswer; // 若交換兩張已配對卡，將被替換答案放回來源卡。
  } else if (dragOrigin.type === "card") { // 拖曳已配對答案到空白處時還原來源。
    assignments[dragOrigin.index] = draggedAnswer; // 將答案放回原本的動物卡。
  }
  draggedAnswer = null; // 清除目前拖曳答案。
  dragOrigin = null; // 清除拖曳來源資料。
  scrollStartY = null; // 清除捲動起點。
  return false; // 阻止瀏覽器執行預設滑鼠或觸控行為。
}

// 提交答案、計算成績並在高分時啟動彩帶動畫。
function submitQuiz() {
  resultVisible = true; // 開啟成績結果視窗。
  const score = assignments.reduce((total, answerIndex, animalIndex) => total + (answerIndex === animalIndex ? 1 : 0), 0); // 計算正確配對數量。
  const percentage = Math.round((score / animals.length) * 100); // 計算整體成績百分比。
  if (percentage > 80) launchConfetti(); // 成績高於百分之八十時播放彩帶。
}

// 在畫面上方放射生成彩色紙片。
function launchConfetti() {
  const palette = ["#e26f55", "#e9b84d", "#5d9870", "#6b91a0", "#dc8ea1"]; // 設定彩帶使用的多色組合。
  for (let index = 0; index < 150; index += 1) { // 建立一百五十個彩帶粒子。
    confetti.push({ x: random(width), y: random(-height, -10), speedX: random(-2.2, 2.2), speedY: random(1.2, 4.8), spin: random(-0.12, 0.12), rotation: random(TWO_PI), width: random(5, 10), height: random(8, 15), life: random(160, 280), color: random(palette) }); // 隨機設定彩帶的位置、速度、角度與顏色。
  }
}

// 清除配對並重新開始測驗。
function resetQuiz() {
  assignments = Array(6).fill(null); // 清除所有題目的配對答案。
  resultVisible = false; // 關閉成績結果視窗。
  confetti = []; // 清除上一輪彩帶粒子。
}

// 判斷目前滑鼠或觸控座標是否落在指定矩形內。
function pointInside(x, y, boxWidth, boxHeight) {
  return mouseX >= x && mouseX <= x + boxWidth && mouseY + scrollOffset >= y && mouseY + scrollOffset <= y + boxHeight; // 回傳指標換算捲動座標後是否位於矩形範圍。
}

// 視窗尺寸改變時重新設定全螢幕畫布與版面。
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // 將畫布調整為新的視窗尺寸。
  calculateLayout(); // 重新計算響應式版面。
}
