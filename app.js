require("dotenv").config();
const express = require("express");
const nocache = require("nocache");
const app = express();
const port = process.env.PORT;
const connectDB = require("./config/db");
const session = require('express-session')

//! connecting server
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ! session
app.use(session({
  secret: 'mine',
  resave: false,
  saveUninitialized: true
}));

app.use(nocache());

// ! session for ejs
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});



//! user routes
app.use("/", require("./routes/userRoutes"));

//! admin routes
app.use("/admin", require("./routes/adminRoutes"));


//!  server creation
app.listen(port, () => console.info(`listening on http://localhost:${port}`));
