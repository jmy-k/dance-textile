// record body movements over 15s and display heatmap style of the circles at the end


// possible body parts
// {
//   LEFT_FACE: 0
//   RIGHT_FACE: 1
//   LEFT_UPPER_ARM_FRONT: 2
//   LEFT_UPPER_ARM_BACK: 3
//   RIGHT_UPPER_ARM_FRONT: 4
//   RIGHT_UPPER_ARM_BACK: 5
//   LEFT_LOWER_ARM_FRONT: 6
//   LEFT_LOWER_ARM_BACK: 7
//   RIGHT_LOWER_ARM_FRONT: 8
//   RIGHT_LOWER_ARM_BACK: 9
//   LEFT_HAND: 10
//   RIGHT_HAND: 11
//   TORSO_FRONT: 12
//   TORSO_BACK: 13
//   LEFT_UPPER_LEG_FRONT: 14
//   LEFT_UPPER_LEG_BACK: 15
//   RIGHT_UPPER_LEG_FRONT: 16
//   RIGHT_UPPER_LEG_BACK: 17
//   LEFT_LOWER_LEG_FRONT: 18
//   LEFT_LOWER_LEG_BACK: 19
//   RIGHT_LOWER_LEG_FRONT: 20
//   RIGHT_LOWER_LEG_BACK: 21
//   LEFT_FOOT: 22
//   RIGHT_FOOT: 23
// }

let prompts = ["embody your favorite color", "move like a secret you've never told", "recall a night you didn't want to end", "you are holding time in your hands - try to keep it from slipping away", "show how memory sits in your body, whether heavy, light, or shifting"]

let bodySegmentation;
let video;
let segmentation;

let heatmap = {};
let hasSaved = false;


let timer = 10 * 1000; // 10s
let startTime;
let recording = true;
let showVideo = true;

let gridSize = 5; // circle size

// let startButton = document.getElementById('startButton');
let instructionsPage = document.getElementById('instructions');
let canvasContainer = document.getElementById('canvas-wrapper');
let prompt = document.getElementById('prompt');

document.addEventListener('keyup', event => {
  if (event.code === 'Space') {
    startVideo();
  }
})

let options = {
  maskType: "parts",
};
let parts;


function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(canvasContainer);
}

document.addEventListener('DOMContentLoaded', () => {
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  prompt.innerHTML = randomPrompt;
});

function draw() {
  if (video && showVideo) {
    image(video, 0, 0);
  }

  if (video && segmentation && recording) {
    drawSegmentOverlay();
  }

  if (startTime && millis() - startTime > timer && recording) {
    recording = false;
    showVideo = false;
    console.log("5 seconds is over");
  }

  if (!recording && !hasSaved && video) {
    video.remove();
    drawCircles();
    drawHeatmap();
    saveHeatmapToServer();
    hasSaved = true;
  }
}

function startVideo() {
  instructionsPage.style.display = 'none';
  canvasContainer.style.display = 'flex';

  video = createCapture(VIDEO);
  video.size(1280, windowHeight);
  video.hide();
  video.parent('canvas-wrapper');

  video.elt.onloadeddata = () => {
    console.log("Video is ready!");

    bodySegmentation = ml5.bodySegmentation("BodyPix", options, () => {
      console.log("BodySegmentation model loaded");

      // only start detecting after both video and model are ready
      bodySegmentation.detectStart(video.elt, gotResults);
      startTime = millis();
    });
  };
}

function drawSegmentOverlay() {
  let parts = bodySegmentation.getPartsId();
  for (let x = 0; x < video.width; x += gridSize) {
    for (let y = 0; y < video.height; y += gridSize) {
      let segment = segmentation.data[y * video.width + x];
      if (segment == parts.RIGHT_FACE || segment == parts.RIGHT_UPPER_ARM_FRONT || segment == parts.RIGHT_UPPER_ARM_BACK || segment == parts.LEFT_HAND || segment == parts.RIGHT_HAND || segment == parts.LEFT_UPPER_LEG_FRONT || segment == parts.LEFT_UPPER_LEG_BACK || segment == parts.LEFT_UPPER_ARM_FRONT || segment == parts.LEFT_UPPER_ARM_BACK || segment == parts.LEFT_FOOT || segment == parts.RIGHT_FOOT) {

        // change circle color here!
        fill(0, 66, 111);
        noStroke();
        circle(x, y, gridSize);

        // store heatmap circles
        let key = `${x},${y}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
      }
    }
  }
}


function drawHeatmap() {
  background(217, 217, 217); // change background color here!

  let maxIntensity = max(Object.values(heatmap));

  for (let key in heatmap) {
    let [x, y] = key.split(",").map(Number);
    let intensity = heatmap[key];

    fill(0, 66, 111, map(intensity, 1, maxIntensity, 50, 255));
    noStroke();
    circle(x, y, gridSize);
  }
}


function drawCircles() {
  fill(246, 246, 246, 40);
  for (let i = 0; i < video.width; i += gridSize) {
    for (let j = 0; j < video.height; j += gridSize) {
      circle(i, j, gridSize);
    }
  }
}

function gotResults(result) {
  segmentation = result;
}

function saveHeatmapToServer() {
  fetch('/save-heatmap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(heatmap)
  })
    .then(res => res.json())
    .then(data => {
      console.log('Saved heatmap as:', data.filename);
    })
    .catch(err => {
      console.error('Error saving:', err);
    });
}