/*
cypherpost.io
Developed @ Stackmate India
*/
// ------------------ '(◣ ◢)' ---------------------
import express from "express";
import helmet from "helmet";
import cors from 'cors';

import { router as announcement } from "./services/announcements/router";
import { router as identity } from "./services/identity/router";
import { router as post} from "./services/posts/router";
import { setupNotificationSocket } from "./services/notifications/router";

import { logger } from "./lib/logger/winston";
import { respond } from "./lib/http/handler";
import * as http from 'http';
const base_path = `/home/node/cypherpost/app/src/services/client/public`;

enum ServicePathRoot {
  Identity = "/api/v2/identity",
  Announcement = "/api/v2/announcement",
  Post = "/api/v2/post",
  Notifications = "/api/v3/notifications",
}

const allowedOrigins = [
  'http://localhost:' + process.env.MOLTRES_PORT,
  'http://localhost:' + process.env.TEST_PORT,
  'http://localhost',
  'https://cypherpost.io'
];
// ------------------ '(◣ ◢)' ---------------------
export async function start(port: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const app = express();
      app.set("etag", false);
      app.disable("x-powered-by");
      app.use(helmet());
      app.use(express.json());
      app.use(express.urlencoded());
      app.use(express.static(base_path));
     
      app.use((err, req, res, next) => {
        // res.setHeader('Access-Control-Allow-Origin', '*');
        if (err) {
          logger.warn({err});
          respond(400,{error:'Invalid Request data format. Try another format like form, or url-encoded.'},res,req)
        } else {
          next()
        }
      });
      const server = http.createServer(app);
      setupNotificationSocket(ServicePathRoot.Notifications,server);
      app.use(ServicePathRoot.Identity, identity);
      app.use(ServicePathRoot.Announcement, announcement);
      app.use(ServicePathRoot.Post, post);

      handleGracefulShutdown(server.listen(port, async () => {
        logger.verbose("Server listening...")
        resolve(app)
      }));

    } catch (e) {
      logger.error({EXPRESS_ERROR:e})
      reject(e);
    }
  });
};
// ------------------ '(◣ ◢)' ---------------------
function handleGracefulShutdown(server: http.Server){
  process.on("SIGINT", () => {
    logger.info({
      SIGINT: "Got SIGINT. Gracefully shutting down Http server"
    });
    server.close(() => {
      logger.info("Http server closed.");
    });
  });

  // quit properly on docker stop
  process.on("SIGTERM", () => {
    logger.info({
      SIGTERM: "Got SIGTERM. Gracefully shutting down Http server."
    });

    server.close(() => {
      logger.info("Http server closed.");
    });
  });

  const sockets = {};

  let nextSocketId = 0;

  server.on("connection", socket => {
    const socketId = nextSocketId++;
    sockets[socketId] = socket;

    socket.once("close", function () {
      delete sockets[socketId];
    });
  });
}
// ------------------ '(◣ ◢)' ---------------------
