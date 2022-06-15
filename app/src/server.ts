/*
cypherpost.io
Developed @ Stackmate India
*/
// ------------------ '(◣ ◢)' ---------------------
import express from "express";
import helmet from "helmet";
import { router as announcement } from "./services/announcement/router";
import { router as identity } from "./services/identity/router";
import { router as post} from "./services/posts/router";
import { logger } from "./lib/logger/winston";
import { respond } from "./lib/http/handler";
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}
const base_path = `/home/node/cypherpost/app/src/services/client/public`;

// ------------------ '(◣ ◢)' ---------------------
export async function start(port: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const app = express();
      const server = http.createServer(app);
      const wss = new WebSocketServer({ server , path: "/notifications"});
      wss.on('connection', (ws, req) => {
        ws.send('Connected to Cypherpost Notification Stream.');
        const extWs = ws as ExtWebSocket;
        extWs.isAlive = true;
        ws.on('pong',function(){
          extWs.isAlive = true;
        });
        // perform auth using req data
        console.log(req.headers);
        // connection is up, let's add a simple simple event
        ws.on('message', function message(data, isBinary) {
          // add post keys by giver or create announcement by maker
          wss.clients.forEach(function each(client) {
            // only if receiver of keys or announcement, forward message
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(data, { binary: isBinary });
            }
          });
        });
        // send immediatly a feedback to the incoming connection
        ws.on('close', function close() {
          console.log("Closing connection...");
          clearInterval(interval);
        });
      });

      const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
          const extWs = ws as ExtWebSocket;
          if (extWs.isAlive === false) {
            console.log("Terminating connection...");
            return ws.terminate();
          }
          extWs.isAlive = false;
          ws.ping();
        });
      }, 30000);

 

      app.set("etag", false);
      app.disable("x-powered-by");
      app.use(helmet());
      app.use(express.json());
      app.use(express.urlencoded());
      app.use(express.static(base_path));
      app.use((err, req, res, next) => {
        if (err) {
          logger.warn({err});
          respond(400,{error:'Invalid Request data format. Try another format like form, or url-encoded.'},res,req)
        } else {
          next()
        }
      });
      // ROUTES >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
      app.use("/api/v2/identity", identity);
      app.use("/api/v2/announcement", announcement);
      app.use("/api/v2/post", post);
      // ROUTES <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


      const expressApp = server.listen(port, async () => {
        logger.verbose("Server listening...")
        resolve(app)
      });


      // Gracefully terminate server on SIGINT AND SIGTERM
      process.on("SIGINT", () => {
        logger.info({
          SIGINT: "Got SIGINT. Gracefully shutting down Http server"
        });
        expressApp.close(() => {
          logger.info("Http server closed.");
        });
      });

      // quit properly on docker stop
      process.on("SIGTERM", () => {
        logger.info({
          SIGTERM: "Got SIGTERM. Gracefully shutting down Http server."
        });

        expressApp.close(() => {
          logger.info("Http server closed.");
        });
      });

      const sockets = {};

      let nextSocketId = 0;

      expressApp.on("connection", socket => {
        const socketId = nextSocketId++;
        sockets[socketId] = socket;

        socket.once("close", function () {
          delete sockets[socketId];
        });
      });

    } catch (e) {
      logger.error({EXPRESS_ERROR:e})
      reject(e);
    }
  });
};

// ------------------ '(◣ ◢)' ---------------------

