import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { notifyAuthMiddleware } from "./dto";
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

export async function setupNotificationSocket(path: string, server: http.Server){
  const wss = new WebSocketServer({ server , path });

  wss.on('connection', async (ws, req) => {
    const authStatus = await notifyAuthMiddleware(req,ws);
    if(!authStatus) {
      ws.send('401 Bad Auth');
      ws.terminate()
    }
    else
    ws.send('Securely connected to cypherpost notification stream.');

    const extWs = ws as ExtWebSocket;
    extWs.isAlive = true;
    ws.on('pong',function(){
      extWs.isAlive = true;
    });
    // connection is up, let's add a simple simple event
    ws.on('message', function message(data, isBinary) {
      // add post keys by giver or create announcement by maker
      // parse message
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
      // ws.terminate()
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
}