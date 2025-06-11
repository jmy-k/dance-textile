let loop;
let canvasContainer = document.getElementById('canvas-wrapper');
let heatmaps = [];
let blendedHeatmap = {};
let gridSize = 5;
let maxIntensity = 0;
function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    // Get heatmaps immediately and then every 5 seconds
    fetchHeatmaps();
    setInterval(fetchHeatmaps, 5000);
    canvas.parent(canvasContainer);
    canvasContainer.style.display = 'flex';
}
function draw() {
  background(217, 217, 217);
  // Draw light grid
    fill(246, 246, 246, 40);
    noStroke();
    for (let i = 0; i < width; i += gridSize) {
        for (let j = 0; j < height; j += gridSize) {
            circle(i, j, gridSize);
        }
    }
    // Draw heatmap
    for (let key in blendedHeatmap) {
        let [x, y] = key.split(",").map(Number);
        let intensity = blendedHeatmap[key];
        fill(0, 66, 111, map(intensity, 1, maxIntensity, 50, 255));
        noStroke();
        circle(x, y, gridSize);
    }

    push();
    imageMode(CENTER);
    image(loop, width / 2, height / 2);
    pop();

    clip(mask);
    console.log("mask");
}
function fetchHeatmaps() {
    console.log("fetching textiles directly...");
    loadJSON("/heatmaps", 
        (data) => {
            console.log("received textiles:", data.length);
            heatmaps = data;
            blendHeatmaps();
        },
        (error) => {
            console.error("error loading textiles:", error);
        }
    );
}
function blendHeatmaps() {
    blendedHeatmap = {};
    maxIntensity = 0;
    for (let heatmap of heatmaps) {
        for (let key in heatmap) {
            blendedHeatmap[key] = (blendedHeatmap[key] || 0) + heatmap[key];
            maxIntensity = max(maxIntensity, blendedHeatmap[key]);
        }
    }

    console.log("blended textile has", Object.keys(blendedHeatmap).length, "points");
    console.log("max intensity:", maxIntensity);
}
function mask() {
    circle(width / 2, height / 2, 800);
}
function preload() {
    loop = loadImage("src/loop.png", img => {
        img.resize(1020, 1020);
    });
}