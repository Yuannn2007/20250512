let capture;
let faceMesh;
let faces = [];
let handPose;
let hands = [];

let earringImages = []; // 儲存多款耳環圖片
let currentEarringIndex = 0; // 目前顯示的耳環索引
let maskImage; // 儲存面具圖片

function preload() {
  earringImages.push(loadImage('pic/acc1_ring.png'));
  earringImages.push(loadImage('pic/acc2_pearl.png'));
  earringImages.push(loadImage('pic/acc3_tassel.png'));
  earringImages.push(loadImage('pic/acc4_jade.png'));
  earringImages.push(loadImage('pic/acc5_phoenix.png'));
  maskImage = loadImage('mask/4379901.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 設定固定解析度以方便計算
  capture.hide(); // 隱藏預設產生的 HTML 影片元件，改在畫布上繪製

  // 初始化 faceMesh 並開始偵測
  faceMesh = ml5.faceMesh({ flipHorizontal: false });
  faceMesh.detectStart(capture, gotFaces);

  // 初始化 handPose 並開始偵測
  handPose = ml5.handPose({ flipHorizontal: false });
  handPose.detectStart(capture, gotHands);
}

function draw() {
  background('#e7c6ff');

  // 在畫布置中上方加上文字
  push();
  fill(0); // 設定文字顏色為黑色
  textSize(32);
  textAlign(CENTER, TOP);
  text("414730951黃元璽", width / 2, 20);
  text("作品為影像辨識_耳環臉譜", width / 2, 65);
  pop();

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;

  push();
  // 將座標中心移至畫布中央
  translate(width / 2, height / 2);
  // 水平翻轉座標系 (實現左右顛倒)
  scale(-1, 1);
  // 以中心點對齊繪製影像，位置設為寬高的一半負值
  image(capture, -vWidth / 2, -vHeight / 2, vWidth, vHeight);

  // 手勢辨識：根據手指數量切換耳環
  if (hands.length > 0) {
    let fingerCount = countFingers(hands[0]);
    // 如果手指數量在 1~5 之間，更新目前的耳環索引
    if (fingerCount >= 1 && fingerCount <= 5) {
      currentEarringIndex = fingerCount - 1;
    }
  }

  // 繪製耳垂裝飾（耳環）
  if (faces.length > 0) {
    let face = faces[0];
    // 繪製面具覆蓋全臉
    drawMask(face, vWidth, vHeight);

    // 150 為右耳垂，379 為左耳垂 (MediaPipe 特徵點索引)
    drawEarring(face.keypoints[150], vWidth, vHeight, earringImages[currentEarringIndex]);
    drawEarring(face.keypoints[379], vWidth, vHeight, earringImages[currentEarringIndex]);
  }
  pop();
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

// 計算伸出的手指數量
function countFingers(hand) {
  let count = 0;
  // 定義食指、中指、無名指、小指的尖端與第二關節索引
  const tips = [8, 12, 16, 20];
  const joints = [6, 10, 14, 18];

  // 檢查四根手指是否伸直 (尖端的 y 座標小於關節的 y 座標)
  for (let i = 0; i < tips.length; i++) {
    if (hand.keypoints[tips[i]].y < hand.keypoints[joints[i]].y) {
      count++;
    }
  }

  // 拇指邏輯：判斷尖端(4)與關節(2)的水平距離（簡易判斷）
  if (abs(hand.keypoints[4].x - hand.keypoints[17].x) > abs(hand.keypoints[2].x - hand.keypoints[17].x)) {
    count++;
  }

  return count;
}

function drawMask(face, vw, vh) {
  if (!maskImage) return;

  // 使用鼻樑位置 (索引 1) 作為面具中心點
  let pt = face.keypoints[1];
  let x = map(pt.x, 0, capture.width, -vw / 2, vw / 2);
  let y = map(pt.y, 0, capture.height, -vh / 2, vh / 2);

  // 根據臉部兩側 (索引 234 與 454) 的距離計算臉部寬度，用來縮放面具
  let pL = face.keypoints[234];
  let pR = face.keypoints[454];
  let faceWidth = dist(pL.x, pL.y, pR.x, pR.y);

  // 將面具寬度設定為臉部寬度的 1.5 倍以確保完整覆蓋
  let mWidth = map(faceWidth, 0, capture.width, 0, vw) * 1.5;
  let mHeight = mWidth * (maskImage.height / maskImage.width);

  push();
  translate(x, y);
  scale(-1, 1); // 再次水平翻轉，使面具圖片顯示為正常方向 (抵消外層的翻轉)
  imageMode(CENTER);
  image(maskImage, 0, 0, mWidth, mHeight);
  pop();
}

function drawEarring(pt, vw, vh, img) {
  if (!pt) return;
  if (!img) return; // 確保圖片存在

  // 將偵測到的攝影機座標轉換為畫布上的相對座標
  let x = map(pt.x, 0, capture.width, -vw / 2, vw / 2);
  let y = map(pt.y, 0, capture.height, -vh / 2, vh / 2);

  // 使用比率計算耳環大小：設定寬度為畫布區域寬度的 8%
  let earringWidth = vw * 0.08;
  // 根據圖片原始比例計算高度
  let earringHeight = earringWidth * (img.height / img.width);
  
  // 使用比率計算偏移量：往下位移畫布區域高度的 3%
  let yOffset = vh * 0.03;
  // 修正高度偏移，讓耳環掛在耳垂下方
  let yAdjustment = earringHeight / 2;

  push();
  // 移動到耳垂位置 (在已翻轉的座標系中)
  translate(x, y + yOffset + yAdjustment);
  scale(-1, 1); // 再次水平翻轉，使耳環圖片顯示為正常方向 (抵消外層的翻轉)
  imageMode(CENTER); // 將圖片繪製模式設為中心，方便定位
  image(img, 0, 0, earringWidth, earringHeight); // 在新原點繪製耳環圖片
  pop();
}
