let video; // 웹캠 비디오 캡처 객체
let handPose; // ml5.js 손 추적 모델
let hands = []; // 감지된 손 데이터 저장 배열
let painting; // 그림을 그릴 그래픽 객체
let px = 0, py = 0; // 이전 프레임의 손가락 좌표
let h = 8; // 선 두께
let colors = []; // 색상 배열
let selectedColor; // 현재 선택된 색상
let buttons = []; // 버튼 객체 배열

let iconVisible = ""; // 아이콘 표시 문자열
let iconTimer = 0; // 아이콘 사라질 시간 저장 변수
let eraserSize = 50; // 지우개 크기
let eraseMode = false; // 지우개 모드 활성화 여부


// 손 모양 모델을 ml5.js에서 가져오기
function preload() {
  handPose = ml5.handPose({ flipped: true });
}

// 손 모양 데이터를 받아오는 함수
function gotHands(results) {
  hands = results;  // 감지된 손 정보 업데이트
}

function setup() {
  createCanvas(640, 480); // 캔버스 생성
  colorMode(RGB);

  // 그림 그리기용 그래픽 객체 생성
  painting = createGraphics(640, 480);
  painting.colorMode(RGB);
  painting.clear(); // 초기 화면을 깨끗하게 설정

  // 색상 배열 정의 (엄지 제외한 4개의 손가락에 적용할 색상)
  colors = [
    color(255, 192, 203), // 연분홍색
    color(255, 250, 205), // 연노란색
    color(224, 255, 255), // 연하늘색
    color(147, 112, 219) // 보라색 
  ];
  selectedColor = colors[0]; // 기본 색상은 첫 번째 색으로 설정

  // 비디오 캡처 설정 (웹캠)
  video = createCapture(VIDEO, { flipped: true }); // flipped: true - 좌우반전 
  video.hide(); // 비디오 화면 숨기기

  // 손 모양 추적 시작
  handPose.detectStart(video, gotHands);

  // 아이콘 버튼 추가 및 클릭 이벤트 설정
  let btnGood = createButton("Good! 👍");
  btnGood.position(50, 40);
  btnGood.style("width", "100px");
  btnGood.style("height", "50px");
  btnGood.style("font-size", "18px");
  btnGood.mousePressed(() => icon("👍"));

  let btnClap = createButton("Clap 👏");
  btnClap.position(50, 120);
  btnClap.style("width", "100px");
  btnClap.style("height", "50px");
  btnClap.style("font-size", "18px");
  btnClap.mousePressed(() => icon("👏"));

  let btnwelcome = createButton("Welcome 🙌");
  btnwelcome.position(50, 200);
  btnwelcome.style("width", "100px");
  btnwelcome.style("height", "50px");
  btnwelcome.style("font-size", "18px");
  btnwelcome.mousePressed(() => icon("🙌"));

  let btnOK = createButton("OK! 👌");
  btnOK.position(50, 280);
  btnOK.style("width", "100px");
  btnOK.style("height", "50px");
  btnOK.style("font-size", "18px");
  btnOK.mousePressed(() => icon("👌"));

  // 버튼 객체를 배열에 추가
  buttons.push(new Button(50, 40, 100, 50, "Good! 👍", () => icon("👍")));
  buttons.push(new Button(50, 120, 100, 50, "Clap 👏", () => icon("👏")));
  buttons.push(new Button(50, 200, 100, 50, "Welcome 🙌", () => icon("🙌")));
  buttons.push(new Button(50, 280, 100, 50, "OK! 👌", () => icon("👌")));
}

function draw() {
  image(video, 0, 0); // 웹캠 영상 표시

  // 손이 감지되었을 때 (손가락 위치 표시)
  if (hands.length > 0) {
    let hand = hands[0]; // 첫 번째 손 데이터
    let indexFinger = hand.index_finger_tip;  // 검지 끝 위치

    fill(255, 0, 0); // 검지 손가락은 빨간색으로 표시
    noStroke();
    ellipse(indexFinger.x, indexFinger.y, 20, 20); // 검지 손가락 위치에 원 그리기
  }

  // 손이 오른손과 왼손일 때 각각 처리
  let rightHand, leftHand;

  for (let hand of hands) {
    if (hand.handedness === "Right") {
      let index = hand.index_finger_tip;
      let thumb = hand.thumb_tip;
      rightHand = { index, thumb }; // 오른손의 검지와 엄지 위치 저장
    }
    if (hand.handedness === "Left") {
      let thumb = hand.thumb_tip;
      let index = hand.index_finger_tip;
      let middle = hand.middle_finger_tip;
      let ring = hand.ring_finger_tip;
      let pinky = hand.pinky_finger_tip;
      let fingers = [index, middle, ring, pinky];

      // 왼손에서 손가락 간의 거리를 계산하여, 가까운 손가락을 선택하고 색상 변경
      for (let i = 0; i < fingers.length; i++) {
        let finger = fingers[i];
        let d = dist(finger.x, finger.y, thumb.x, thumb.y);

        if (d < 30) { // 손가락이 엄지와 가까워지면 색상을 변경
          fill(colors[i]);
          noStroke();
          circle(finger.x, finger.y, 36);
          selectedColor = colors[i]; // 선택된 색상을 업데이트
        }
      }
    }
  }

  // 오른손의 검지와 엄지로 그림 그리기
  if (rightHand) {
    let { index, thumb } = rightHand;
    let x = (index.x + thumb.x) * 0.5;
    let y = (index.y + thumb.y) * 0.5;

    let d = dist(index.x, index.y, thumb.x, thumb.y);
    if (d < 20) { // 검지와 엄지가 가까워지면 그림 그리기
      painting.stroke(selectedColor); // 선택된 색상으로 선 그리기
      painting.strokeWeight(16);
      painting.line(px, py, x, y); // 이전 좌표에서 현재 좌표까지 선 그리기
    }

    px = x;
    py = y;
  }

  // 버튼과 손가락 충돌 확인
  if (hands.length > 0) {
    let hand = hands[0];
    let fingers = [
      hand.thumb_tip,
      hand.index_finger_tip,
      hand.middle_finger_tip,
      hand.ring_finger_tip,
      hand.pinky_finger_tip
    ];
    
    
     // 손가락이 펼쳐진 개수를 세기 (손바닥 인식 대체)
    let extendedFingers = fingers.filter(f => f.y < (hand.middle_finger_mcp.y - 50)).length;
    
    eraseMode = extendedFingers === 4;
    eraseAllMode = extendedFingers === 0;
    // console.log(extendedFingers);
    eraser(hand, eraseMode);
    
    image(painting, 0, 0); // 그림을 비디오 위에 표시

    let indexFinger = hand.index_finger_tip;

    // 버튼에 손가락이 올려졌을 때 버튼 클릭 처리
    for (let btn of buttons) {
      if (btn.isHovered(indexFinger.x, indexFinger.y)) {
        btn.onClick();
      }
    }
  }

  // 아이콘 표시 (3초 동안 유지)
  if (iconVisible && millis() < iconTimer) {
    textSize(64);
    textAlign(CENTER, CENTER);
    text(iconVisible, width / 2, height / 2); // 화면 중앙에 아이콘 표시
  } else {
    iconVisible = ""; // 3초가 지나면 아이콘 숨기기
  }
}

// 
function eraser(hand, eraseMode) {
  if(eraseMode){
    painting.erase();
    painting.noStroke();
    painting.ellipse(hand.index_finger_tip.x, hand.index_finger_tip.y, eraserSize, eraserSize); // 지우기
    painting.noErase();
  }
  else if(eraseAllMode){
    painting.clear();
  }
}
    

// 스페이스바를 누르면 그림을 지우는 기능
function keyPressed() {
  if (key === ' ') {
    painting.clear(); // 그림 영역 초기화
  }
}

// 아이콘 표시 함수 (3초 동안 유지)
function icon(icon) {
  iconVisible = icon;
  iconTimer = millis() + 2000; // 현재 시간 + 2초
}

// 버튼 클래스
class Button {
  constructor(x, y, w, h, label, onClick) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.onClick = onClick;
  }

  // 버튼을 화면에 그리는 함수
  display() {
    fill(this.isHovered(mouseX, mouseY) ? 'lightgray' : 'white'); // 손가락이 버튼 위에 있으면 색 변경
    stroke(0);
    rect(this.x, this.y, this.w, this.h, 10); // 버튼을 사각형으로 그리기
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(this.label, this.x + this.w / 2, this.y + this.h / 2); // 버튼 텍스트 표시
  }

  // 버튼 위에 마우스나 손가락이 올려졌는지 확인하는 함수
  isHovered(px, py) {
    return (px > this.x) && (px < this.x + this.w) && (py > this.y) && (py < this.y + this.h);
  }
}
