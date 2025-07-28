let prompts = ["embody your favorite color", "move like a secret you've never told", "recall a night you didn't want to end", "you are holding time in your hands - try to keep it from slipping away", "show how memory sits in your body, whether heavy, light, or shifting", "think of a moment you've never forgotten and let it shape your movement", "choose a memory in your hands and let them act it out"];

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

let instructionsPage = document.getElementById('instructions');
let canvasContainer = document.getElementById('canvas-wrapper');
let prompt = document.getElementById('prompt');

document.addEventListener('keyup', event => {
  if (event.code === 'Space') {
    startVideo();
  }
});

let options = {
  maskType: "parts",
};

function setup() {
}

// display random prompt when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  prompt.innerHTML = randomPrompt;
});

function draw() {
  if (video && showVideo) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0);
    pop();
  }

  if (video && segmentation && recording) {
    drawSegmentOverlay();
  }

  if (startTime && millis() - startTime > timer && recording) {
    recording = false;
    showVideo = false;
    console.log("Timer ended");
  }

  if (!recording && !hasSaved && video) {
    video.remove();
    drawCircles();
    drawHeatmap();
    saveHeatmapToServer();
    hasSaved = true;
  }
}

// video and show canvas
function startVideo() {
  instructionsPage.style.display = 'none';
  canvasContainer.style.display = 'block';

  // dimensions needed for fullscreen rotated canvas
  // 90 rotation,  swap width and height
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const canvas = createCanvas(screenWidth, screenHeight);
  canvas.parent(canvasContainer);

  video = createCapture(VIDEO);
  video.size(screenWidth, screenHeight);
  video.hide();

  // When video is ready, start body segmentation
  video.elt.onloadeddata = () => {
    console.log("Video is ready!");

    bodySegmentation = ml5.bodySegmentation("BodyPix", options, () => {
      console.log("BodySegmentation model loaded");
      bodySegmentation.detectStart(video.elt, gotResults);
      startTime = millis();
    });
  };
}

function drawSegmentOverlay() {
  let parts = bodySegmentation.getPartsId();
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      let mirroredX = width - x - 1;
      let segment = segmentation.data[y * width + mirroredX];

      if (segment == parts.RIGHT_FACE || segment == parts.RIGHT_UPPER_ARM_FRONT ||
        segment == parts.RIGHT_UPPER_ARM_BACK || segment == parts.LEFT_HAND ||
        segment == parts.RIGHT_HAND || segment == parts.LEFT_UPPER_LEG_FRONT ||
        segment == parts.LEFT_UPPER_LEG_BACK || segment == parts.LEFT_UPPER_ARM_FRONT ||
        segment == parts.LEFT_UPPER_ARM_BACK || segment == parts.LEFT_FOOT ||
        segment == parts.RIGHT_FOOT) {
        fill(0, 66, 111);
        noStroke();
        circle(x, y, gridSize);

        let key = `${x},${y}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
      }
    }
  }
}

function drawHeatmap() {
  background(217, 217, 217);

  let maxIntensity = 0;
  Object.values(heatmap).forEach(val => {
    if (val > maxIntensity) maxIntensity = val;
  });

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
  for (let i = 0; i < width; i += gridSize) {
    for (let j = 0; j < height; j += gridSize) {
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
      console.log('saved textile as:', data.filename);

      // link to navbar for the newly created heatmap
      if (data.success && data.filename) {
        addHeatmapLinkToNavbar(data.filename);
      }
    })
    .catch(err => {
      console.error('Error saving:', err);
    });
}

function addHeatmapLinkToNavbar(filename) {
  const navbar = document.getElementById('navbar');

  // remove existing "your textile" link
  const existingLink = navbar.querySelector('.your-textile-link');
  if (existingLink) {
    existingLink.remove();
  }

  const link = document.createElement('a');
  link.href = `./view-textile.html?file=${filename}`;
  link.textContent = 'your textile';
  link.target = '_blank';
  link.className = 'your-textile-link';

  // add the link to the navbar
  navbar.insertBefore(link, navbar.firstChild);
}

// window resizing
function windowResized() {
  resizeCanvas(windowHeight, windowWidth);
  if (video) {
    video.size(windowHeight, windowWidth);
  }
}