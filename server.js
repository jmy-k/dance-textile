// MongoDB implementation for server.js

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json({ limit: "50mb" })); // Increased limit for large heatmap data
app.use(express.static("public"));

// Direct MongoDB connection
const mongoURI =
    "mongodb+srv://jmy-k:y%25_E5H8i2gHgQGj@bodyastextile.ycdb6kv.mongodb.net/?retryWrites=true&w=majority&appName=bodyastextile";

mongoose
    .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("MongoDB connected successfully");
        // When connected, print how many heatmaps are in the collection
        Heatmap.countDocuments().then((count) => {
            console.log(`Found ${count} heatmaps in the database`);
        });
    })
    .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB Schema for Heatmap data
const heatmapSchema = new mongoose.Schema(
    {
        heatmapData: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores entire heatmap object
        timestamp: { type: Date, default: Date.now },
        filename: { type: String, required: true }, // Virtual filename for compatibility
    },
    { timestamps: true }
);

const Heatmap = mongoose.model("Heatmap", heatmapSchema);

// Simple test endpoint to check if server is running
app.get("/hello", (req, res) => {
    res.send("Hello, server is running!");
});

// *** IMPORTANT - SPECIFIC ROUTES FIRST ***

// Direct endpoint to get recent heatmaps
app.get("/heatmaps", async (req, res) => {
    try {
        console.log("Heatmaps endpoint called");
        // Get the 4 most recent heatmaps from MongoDB
        const recentHeatmaps = await Heatmap.find()
            .sort({ timestamp: -1 }) // Newest first
            .limit(4); // Only get 4

        console.log(`Found ${recentHeatmaps.length} recent heatmaps`);

        // Extract just the heatmap data
        const heatmapData = recentHeatmaps.map((doc) => doc.heatmapData);

        // Send the response
        res.json(heatmapData);
    } catch (error) {
        console.error("Error retrieving heatmaps:", error);
        res.status(500).json({ error: "Failed to retrieve heatmap data" });
    }
});

// Heatmap endpoint - receives the entire heatmap object
app.post("/save-heatmap", async (req, res) => {
    try {
        const heatmapData = req.body;
        const timestamp = Date.now();
        const filename = `heatmap_${timestamp}.json`;

        // Save heatmap data to MongoDB
        const newHeatmap = new Heatmap({
            heatmapData: heatmapData,
            timestamp: timestamp,
            filename: filename,
        });

        await newHeatmap.save();
        console.log(`Saved new heatmap: ${filename}`);

        res.json({ success: true, filename });
    } catch (error) {
        console.error("Error saving heatmap:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to save heatmap data" });
    }
});

// ONLY implement this if you need backward compatibility with existing code
app.get("/:filename", async (req, res) => {
    const filename = req.params.filename;
    console.log("File requested:", filename);

    // Only handle heatmap files
    if (!filename.startsWith("heatmap_") || !filename.endsWith(".json")) {
        console.log("Not a heatmap file, passing to next handler");
        return res.status(404).send("File not found");
    }

    try {
        const heatmap = await Heatmap.findOne({ filename: filename });

        if (!heatmap) {
            console.log("Heatmap not found:", filename);
            return res.status(404).json({});
        }

        console.log("Returning heatmap data for:", filename);
        res.json(heatmap.heatmapData);
    } catch (error) {
        console.error("Error retrieving heatmap:", error);
        res.status(500).json({ error: "Failed to retrieve heatmap data" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
