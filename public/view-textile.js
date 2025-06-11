const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file');

if (!filename) {
  document.getElementById('loadingMessage').style.display = 'none';
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = 'no textile file specified';
  errorElement.style.display = 'block';
}

// Heatmap data and display properties
let heatmap = null;
const gridSize = 5; // Fixed dot size - no user adjustment
let bgColor = [217, 217, 217]; // Default background color
let dotBaseColor = [0, 66, 111]; // Default dot color
let canvas = null;
let originalDataWidth = 0;
let originalDataHeight = 0;
let scaleRatio = 1;

// Setup UI controls
const bgColorPicker = document.getElementById('bgColor');
const dotColorPicker = document.getElementById('dotColor');

bgColorPicker.addEventListener('input', function() {
  const hex = this.value;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  bgColor = [r, g, b];
  if (p5Instance) p5Instance.redraw();
});

dotColorPicker.addEventListener('input', function() {
  const hex = this.value;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  dotBaseColor = [r, g, b];
  if (p5Instance) p5Instance.redraw();
});

document.getElementById('backButton').addEventListener('click', () => {
  window.location.href = './gallery.html'; // Assuming the gallery is at the root
});

document.getElementById('saveButton').addEventListener('click', () => {
  if (p5Instance) {
    p5Instance.saveCanvas(`textile-${filename.replace('.json', '')}`, 'png');
  }
});

// Handle window resize
window.addEventListener('resize', function() {
  if (p5Instance && heatmap) {
    resizeCanvasToFitWindow();
  }
});

// Global p5 instance for accessing from UI controls
let p5Instance = null;

// Main p5.js sketch
new p5(function(p) {
  p5Instance = p; // Store reference to p5 instance
  
  // Canvas size variables
  let canvasWidth = Math.min(800, window.innerWidth - 40); // Initial width, constrained to window
  let canvasHeight = 600;
  
  p.setup = function() {
    // Create initial canvas
    canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvasContainer');
    p.noLoop(); // Only draw when needed
    
    if (filename) {
      // Fetch heatmap data
      fetchHeatmapData();
    }
  };
  
  p.draw = function() {
    if (heatmap) {
      drawHeatmap();
    }
  };
  
  async function fetchHeatmapData() {
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`failed to load textile data: ${response.statusText}`);
      }
      
      heatmap = await response.json();
      document.getElementById('loadingMessage').style.display = 'none';
      
      // Calculate the bounds of the data
      calculateDataBounds();
      
      // Resize canvas to fit the window
      resizeCanvasToFitWindow();
      
      // Add canvas title with filename
      document.title = `textile: ${filename}`;
    } catch (error) {
      console.error('error loading textile:', error);
      document.getElementById('loadingMessage').style.display = 'none';
      const errorElement = document.getElementById('errorMessage');
      errorElement.textContent = error.message;
      errorElement.style.display = 'block';
    }
  }
  
  // Calculate the original data dimensions
  function calculateDataBounds() {
    let maxX = 0;
    let maxY = 0;
    let minX = Infinity;
    let minY = Infinity;
    
    for (let key in heatmap) {
      let [x, y] = key.split(",").map(Number);
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    }
    
    // Add some padding
    const padding = 20;
    originalDataWidth = maxX - minX + (2 * padding);
    originalDataHeight = maxY - minY + (2 * padding);
  }
  
  // Resize canvas to fit window while maintaining aspect ratio
  function resizeCanvasToFitWindow() {
    const containerWidth = Math.min(window.innerWidth - 40, 1200); // Maximum width is window width - padding
    
    // Calculate the scale based on container width
    scaleRatio = containerWidth / originalDataWidth;
    
    // Calculate new dimensions
    canvasWidth = containerWidth;
    canvasHeight = originalDataHeight * scaleRatio;
    
    // Make sure the canvas isn't too small
    canvasHeight = Math.max(canvasHeight, 300);
    
    // Resize the canvas
    p.resizeCanvas(canvasWidth, canvasHeight);
    
    // Redraw with the new dimensions
    p.redraw();
  }
  
  function drawHeatmap() {
    // Set background
    p.background(bgColor);
    
    // Find maximum intensity
    let maxIntensity = 0;
    Object.values(heatmap).forEach(val => {
      if (val > maxIntensity) maxIntensity = val;
    });
    
    // Draw each point with scaling
    for (let key in heatmap) {
      let [x, y] = key.split(",").map(Number);
      let intensity = heatmap[key];
      
      // Scale coordinates to fit canvas
      const scaledX = x * scaleRatio;
      const scaledY = y * scaleRatio;
      
      // Scale dot size based on canvas scale
      const scaledDotSize = gridSize * scaleRatio;
      
      // Map intensity to alpha (opacity)
      const alpha = p.map(intensity, 1, maxIntensity, 50, 255);
      
      // Set fill color with mapped alpha
      p.fill(dotBaseColor[0], dotBaseColor[1], dotBaseColor[2], alpha);
      p.noStroke();
      
      // Draw scaled circle
      p.circle(scaledX, scaledY, scaledDotSize);
    }
  }
});