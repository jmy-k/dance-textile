const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("public"));


app.post("/save-heatmap", (req, res) => {
    const heatmap = req.body;
    const timestamp = Date.now();
    const filename = `heatmap_${timestamp}.json`;
    const filepath = `public/${filename}`;

    // Save the heatmap
    fs.writeFileSync(filepath, JSON.stringify(heatmap, null, 2));

    // Update manifest
    const manifestPath = "public/manifest.json";
    let manifest = [];

    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath));
    }

    manifest.push(filename);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    res.json({ success: true, filename });
});

app.listen(PORT, () => {
    console.log(`server at http://localhost:${PORT}`);
});
