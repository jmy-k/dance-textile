let loadedFiles = new Set();
let heatmaps = [];
let blendedHeatmap = {};
let gridSize = 5;
let maxIntensity = 0;

function setup() {
    createCanvas(640, 480);
    setInterval(fetchManifest, 5000);
}

function draw() {
    background(0);

    // Draw light grid
    fill(5, 5, 5, 40);
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
        fill(193, 18, 31, map(intensity, 1, maxIntensity, 50, 255));
        noStroke();
        circle(x, y, gridSize);
    }
}

function fetchManifest() {
    loadJSON("manifest.json", (fileList) => {
        for (let filename of fileList) {
            if (!loadedFiles.has(filename)) {
                console.log("Loading new heatmap:", filename);
                loadedFiles.add(filename);
                loadJSON(filename, (data) => {
                    heatmaps.push(data);
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
    }
}
