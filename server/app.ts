const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const CLIENT_PATH = path.join(process.cwd(), "dist/client");

console.log("CLIENT EXISTS:", fs.existsSync(path.join(CLIENT_PATH, "index.html")));

app.use(express.static(CLIENT_PATH));

app.get("*", (req, res) => {
  const indexPath = path.join(CLIENT_PATH, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build not found. Please run 'npm run build' first.");
  }
});

module.exports = app;
