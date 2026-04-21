import express from "express"
import path from "path"
import fs from "fs"

const app = express()

const CLIENT_PATH = path.join(process.cwd(), "dist/client")

console.log("CLIENT EXISTS:", fs.existsSync(path.join(CLIENT_PATH, "index.html")))

app.use(express.static(CLIENT_PATH))

app.get("*", (_, res) => {
  res.sendFile(path.join(CLIENT_PATH, "index.html"))
})

export default app
