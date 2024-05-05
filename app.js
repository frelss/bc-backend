const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const userRouter = require("./Routes/userRoutes");
const projectRouter = require("./Routes/projectRoutes");
//security http heades
const helmet = require("helmet");
//for rate limiting
const rateLimit = require("express-rate-limit");
//for security (login things)
const sanitize = require("express-mongo-sanitize");
//clean
const xss = require("xss-clean");

dotenv.config({ path: "./configure.env" });

const app = express();
app.set("trust proxy", true);

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionSuccessStatus: 200,
};

//majd vissza rakni
let limiter = rateLimit({
  max: 10000000000,
  windowMs: 60 * 60 * 1000,
  message:
    "We have recieved too many request from this IP. Please try again after one hour.",
});

app.use(helmet());
app.use("/api", limiter);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
//10kb of data max
app.use(express.json({ limit: "10kb" }));

//look for nosql, filter out things like $
app.use(sanitize());

//xx clean (return midleware clean any user input html code or js)
app.use(xss());

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);

app.get("/", (req, res) => {
  res.send("prManagement BACKEND!");
});

module.exports = app;
