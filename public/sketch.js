// sketch.js - Fullscreen solution
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

// This function runs once when the sketch starts
function setup() {
  // Don't create canvas yet - we'll create it in startVideo()
  // This prevents issues with canvas dimensions before video starts
}

// Display a random prompt when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  prompt.innerHTML = randomPrompt;
});

// Main drawing loop
function draw() {
  if (video && showVideo) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
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

// Start video capture and show canvas
function startVideo() {
  // Hide instructions
  instructionsPage.style.display = 'none';

  // Show canvas container
  canvasContainer.style.display = 'block';

  // Calculate the dimensions needed for a full-screen rotated canvas
  // For a 90° rotation, we swap width and height
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Create canvas with dimensions that will fill the screen when rotated
  // We'll create the canvas inside startVideo to ensure we have the correct dimensions
  const canvas = createCanvas(screenHeight, screenWidth);
  canvas.parent(canvasContainer);

  // Create the video capture with the same dimensions
  video = createCapture(VIDEO);
  video.size(screenHeight, screenWidth);
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
      // Mirror x coordinate
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
  background(217, 217, 217); // Background color

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
      console.log('Saved heatmap as:', data.filename);
    })
    .catch(err => {
      console.error('Error saving:', err);
    });
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowHeight, windowWidth);
  if (video) {
    video.size(windowHeight, windowWidth);
  }
}