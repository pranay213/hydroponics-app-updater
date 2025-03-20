const express = require("express");
require("dotenv").config();
require("./db/connection");
const appRouter = require("./Routes/appRouter");

const cors = require("cors");
const logger = require("./utils/logger");
const requestLogger = require("./utils/middleware");

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use(cors({ origin: "*" }));

// Serve static files from the "uploads" folder
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 8000;

app.get("/connection", (req, res) => {
  res.status(200).send("connected");
});

app.use('/updates', appRouter);

app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
