let loop
let canvasContainer = document.getElementById('canvas-wrapper');

let loadedFiles = new Set();
let heatmaps = [];
let blendedHeatmap = {};
let gridSize = 5;
let maxIntensity = 0;

function setup() {
    const canvas = createCanvas(1280, 960);
    setInterval(fetchManifest, 5000);
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
    // stroke(196, 164, 132);
    // strokeWeight(10);
    // noFill();
    // circle(width/2, height/2, 800);
    clip(mask);

    console.log("mask");


}

function fetchManifest() {
    loadJSON("manifest.json", (fileList) => {
        // Sort and take last 5 (assuming filenames are time-sortable)
        fileList.sort();
        const recentFiles = fileList.slice(-4);

        for (let filename of recentFiles) {
            if (!loadedFiles.has(filename)) {
                console.log("Loading new heatmap:", filename);
                loadedFiles.add(filename);
                loadJSON(filename, (data) => {
                    heatmaps.push(data);
                    if (heatmaps.length > 4) heatmaps.shift(); // keep only 5
                    blendHeatmaps();
                });
            }
        }
    }, () => {
        console.log("manifest.json not found");
    });
}


function blendHeatmaps() {
    blendedHeatmap = {};
    maxIntensity = 0;

    for (let heatmap of heatmaps) {
        for (let key in heatmap) {
            blendedHeatmap[key] = (blendedHeatmap[key] || 0) + heatmap[key];
            maxIntensity = max(maxIntensity, blendedHeatmap[key]);
        }

        // for (let key in blendedHeatmap) {
        //     // Apply a non-linear emphasis: makes overlap pop more
        //     blendedHeatmap[key] = pow(blendedHeatmap[key], 1.3);
        //     maxIntensity = max(maxIntensity, blendedHeatmap[key]);
        // }
    }

    // Optional: emphasize overlapping areas

}

function mask() {
    circle(width / 2, height / 2, 800);
}

function preload() {
    loop = loadImage("src/loop.png", img => {
        img.resize(1020, 1020);
    });
}