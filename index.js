require("dotenv").config();
const express = require("express");
const { exec } = require("child_process");
const bot = require("../location-saver/utils/bot");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

// Serve HTML page
app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "./public/videodownloader.html");
  res.sendFile(htmlPath);
});

app.use(express.static(path.join(__dirname, "public")));

// Handle video/audio download
app.post("/download", (req, res) => {
  const videoUrl = req.body.url;
  const audioonly =
    req.body.audioonly === true || req.body.audioonly === "true";

  if (!videoUrl) return res.status(400).json({ message: "URL is required" });

  // Ensure downloads folder exists
  const downloadsFolder = path.join(__dirname, "downloads");
  if (!fs.existsSync(downloadsFolder))
    fs.mkdirSync(downloadsFolder, { recursive: true });

  const ext = audioonly ? "mp3" : "mp4";
  const fileName = `video_${Date.now()}.${ext}`;
  const filePath = path.join(downloadsFolder, fileName);

  // Build yt-dlp command
  const formatOption = audioonly ? "-x --audio-format mp3" : "-f mp4";
  const ytDlpCommand = `yt-dlp ${formatOption} -o "${filePath}" "${videoUrl}"`;

  // Execute yt-dlp
  exec(ytDlpCommand, async (err, stdout, stderr) => {
    if (err) {
      console.error("yt-dlp error:", err, stderr);
      return res
        .status(500)
        .json({ message: "Download failed", error: err.message });
    }

    try {
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({ message: "File was not downloaded." });
      }

      const stats = fs.statSync(filePath);
      let responseMessage;

      if (stats.size > 50 * 1024 * 1024) {
        responseMessage = `File too large: ${(stats.size / 1024 / 1024).toFixed(
          2
        )} MB`;
        await bot.telegram.sendMessage(process.env.GROUP_ID, responseMessage);
      } else {
        if (audioonly) {
          await bot.telegram.sendAudio(process.env.GROUP_ID, {
            source: filePath,
          });
        } else {
          await bot.telegram.sendVideo(process.env.GROUP_ID, {
            source: filePath,
          });
        }
        responseMessage = `Download complete! Check the Telegram group for your file: https://t.me/loukyaecho`;
      }

      res.status(200).json({ message: responseMessage });
    } catch (err) {
      console.error("Telegram upload error:", err);
      res
        .status(500)
        .json({ message: "Telegram upload failed", error: err.message });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
