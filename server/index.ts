const { createServer } = require("http");
const app = require("./app");

const server = createServer(app);

const port = Number(process.env.PORT || 3000);
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
