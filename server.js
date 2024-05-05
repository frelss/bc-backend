const app = require("./app");
const mongoose = require("mongoose");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config({ path: "./configure.env" });

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

const server = http.createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Started on port: ${port}`);
});

mongoose
  .connect(DB)
  .then(() => {
    console.log("You have successfully connected to MongoDB.");
  })
  .catch((err) => console.error("Connection error!", err));
