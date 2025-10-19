console.log("Starting server...");

import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import sqlite3pkg from "sqlite3";
import gm from "./backend/gameManager.js";
import localServerConfig from "./localServerConfig.json" with { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import UAParser from "ua-parser-js";
import AuthHandler from "./backend/authHandler.js";
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cookieParser());
app.use(express.json())

function authMiddleware(req, res, next) {
  let accessToken = req.cookies.access_token;
  let refreshToken = req.cookies.refresh_token;

  if (!accessToken && !refreshToken) return res.redirect('/admin/login');

  try {
    let verify = jwt.verify(accessToken, localServerConfig.JWT_SECRET);
    req.user = verify;
    return next();
  } catch (err) {
    if (!refreshToken) return res.redirect('/admin/login');
    try {
      let verifyRefresh = jwt.verify(refreshToken, localServerConfig.JWT_REFRESH_SECRET);
      let newAccessToken = jwt.sign(
        { username: verifyRefresh.username },
        localServerConfig.JWT_SECRET,
        { expiresIn: localServerConfig.JWT_AGE.toString() }
      );

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: localServerConfig.SECURE_ENV,
        sameSite: 'strict',
        maxAge: localServerConfig.JWT_AGE
      });

      req.user = verifyRefresh;
      return next();
    } catch (refreshErr) {
      return res.redirect('/admin/login');
    }
  }
}
app.post('/admin/login', async (req, res) => {
  let { username, password } = req.body;

  let jwtToken = await authHandler.handleLogin(username, password);
  if (!jwtToken) {
    return res.redirect('/admin')
  }

  let accessToken = jwt.sign({ username }, localServerConfig.JWT_SECRET, { expiresIn: localServerConfig.JWT_AGE.toString() });
  let refreshToken = jwt.sign({ username }, localServerConfig.JWT_REFRESH_SECRET, { expiresIn: '30d' })

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: localServerConfig.SECURE_ENV,
    sameSite: 'strict',
    maxAge: localServerConfig.JWT_AGE
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: localServerConfig.SECURE_ENV,
    sameSite: 'strict',
    maxAge: localServerConfig.JWT_AGE * 17280
  })

  return res.json({ type: 'jwt', 'token': accessToken });
});
app.post('/admin/refresh', async (req, res) => {
  let refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.redirect('/admin')
  }

  try {
    let verify = jwt.verify(refreshToken, localServerConfig.JWT_REFRESH_SECRET);
    let newAccessToken = jwt.sign(
      { username: verify.username },
      localServerConfig.JWT_SECRET,
      { expiresIn: localServerConfig.JWT_AGE.toString() }
    );

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: localServerConfig.SECURE_ENV,
      sameSite: 'strict',
      maxAge: localServerConfig.JWT_AGE
    });
    return res.json({ type: 'jwt', token: newAccessToken });
  } catch (err) {
    console.log(err)
    return res.redirect('/admin')
  }
});

const sqlite3 = sqlite3pkg.verbose();
const db = new sqlite3.Database("./leaderboard.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the leaderboard database.");
  }
});

let total_rejected = 0;
const gameManager = new gm(db);
const authHandler = new AuthHandler(gameManager);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/favicon.ico", express.static("favicon.ico"));

app.get("/", (req, res) => {
  let parser = new UAParser();
  let ua = req.headers["user-agent"];
  let browser = parser.setUA(ua).getBrowser();
  let name = browser.name;
  let version = parseInt(browser.version);

  if (
    (name === "Safari" && version < 15) ||
    name === "IE" ||
    (name === "Edge" && version < 18) ||
    (name === "Firefox" && version < 65) ||
    (name === "Chrome" && version < 32) ||
    (name === "Opera" && version < 19)
  ) {
    total_rejected++;
    console.log(`Browser not supported: ${name} ${version} (${total_rejected})`);
    res.sendFile(path.join(__dirname, "public/sorry.html"));
    return;
  }

  res.sendFile(path.join(__dirname, "index.html"));
  // res.redirect('https://maintenance.hermitguessr.xyz')
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/leaderboard.html"));
});

app.get("/leaderboard_data", (req, res) => {
  let response = gameManager.getLeaderboard();
  res.send(response);
});

app.get('/admin', async (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/admin.html"));

});
app.get('/admin/maps', authMiddleware, async (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/administrative.html"));
})


app.get("/admin/dashboard", authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/dash.html"));
});


const server = http.createServer(app);
const wss = new WebSocketServer({ server });

server.listen(localServerConfig.port, "0.0.0.0", () => {
  console.log(`Server running on port ${localServerConfig.port}`);
});

wss.on("connection", (ws) => {
  gameManager.proc(ws);
});
Promise.all([
  fs.unlink('SHUTDOWN').catch(() => { }),
  fs.unlink('RESTART').catch(() => { })
]).then(() => {
  let flag = setInterval(() => {
    fs.access('SHUTDOWN').then(() => {
      gameManager.signalShutdown()
    }).catch(()=>{});
    fs.access('RESTART').then(() => {
      gameManager.signalDelayShutdown()
      clearInterval(flag);
    }).catch(()=>{});
  }, 1000)
});