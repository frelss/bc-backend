const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./configure.env" });

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => {
    console.log("You have successfully connected to MongoDB.");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`The server is running on the following port: ${PORT}`);
    });
  })
  .catch((err) => console.error("Connection error!", err));
