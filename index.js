const express = require("express");
const cookieParser = require("cookie-parser");
const hsts = require("hsts");
const logger = require("./utils/logger");
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    logger.error({ err }, "SyntaxError in request");
    return res.status(400).send({ status: 400, message: "Invalid Request" });
  }
  next();
});

const dotenv = require("dotenv");
dotenv.config();

app.use(
  hsts({
    maxAge: 31536000,
  })
);

app.use(function (req, res, next) {
  res.setHeader("Cache-Control", "no-cache, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "-1");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", `frame-ancestors 'none'; object-src 'none'; require-trusted-types-for 'script'; script-src 'none';`);
  next();
});

const superRoute = require("./routes/super.routes");
app.use("/api/super", superRoute);

app.get("/api/health", (req, res) => {
  logger.info("Health check endpoint called");
  res.status(200).send("<h1>OK</h1>");
});

const cors = require("cors");

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (WHITE_LIST_URL.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true, credentials: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));

const path = require("path");
app.use("/public", express.static(path.join(__dirname, "/public")));

const tenantRoute = require("./routes/tenant.routes");
app.use("/api/tenants", tenantRoute);

const userRoute = require("./routes/user.routes");
app.use("/api/users", userRoute);

const clientRoute = require("./routes/client.routes");
app.use("/api/clients", clientRoute);

const offerRoute = require("./routes/offer.routes");
app.use("/api/offers", offerRoute);

const publicRoute = require("./routes/public.routes");
app.use("/api/public", publicRoute);

const cardsRoute = require("./routes/cards.routes");
app.use("/api/cards", cardsRoute);

const multilingualRoute = require("./routes/multilingual.routes");
app.use("/api/multilingual", multilingualRoute);

const gamificationRoute = require("./routes/gamification.routes");
app.use("/api/gamification", gamificationRoute);

const rewardRoute = require("./routes/rewards.routes");
app.use("/api/rewards", rewardRoute);

const commonRoute = require("./routes/common.routes");
app.use("/api/common", commonRoute);

const redisRoute = require("./routes/cache.routes");
app.use("/api/redis", redisRoute);

const analyticsRoute = require("./routes/analytics.routes");
app.use("/api/analytics", analyticsRoute);

app.get("*", function (req, res) {
  logger.warn({ path: req.path }, "404 Not Found");
  res.status(404).send(`<h1>Whitelabel Error Page</h1>
    <p>This application has no explicit mapping for /error, so you are seeing this as a fallback.</p>
    <p>${new Date()}</p>
    <p>There was an unexpected error (type=Not Found, status=404).</p>
    <p>No message available</p>
  `);
});

const { connect } = require("./config/database");
const { connectRead } = require("./config/readdatabase");
const { GetDBInfo, GetOfferWallInfo } = require("./Global");
const { redisClusterConnection } = require("./utils/cache");

app.listen(process.env.APP_PORT || 5000, async () => {
  try {
    const dbInfo = await GetDBInfo();

    connect({
      host: dbInfo.DB_Host,
      user: dbInfo.DB_User,
      password: dbInfo.DB_Password,
      database: dbInfo.DB_Database,
      port: dbInfo.DB_Port,
    });
    connectRead({
      host: dbInfo.DB_HostRead,
      user: dbInfo.DB_User,
      password: dbInfo.DB_Password,
      database: dbInfo.DB_Database,
      port: dbInfo.DB_Port,
    });

    await GetOfferWallInfo();
    await redisClusterConnection();

    logger.info(`Server started on port ${process.env.APP_PORT || 5000}`);
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
});