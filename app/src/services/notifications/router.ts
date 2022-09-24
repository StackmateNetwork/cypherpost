import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { notifyAuthMiddleware, getPostIdRecipients } from "./dto";
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

export async function setupNotificationSocket(path: string, server: http.Server){
  const wss = new WebSocketServer({ server , path });

  wss.on('connection', async (ws, req) => {
    const authStatus = await notifyAuthMiddleware(req,ws);
    if(!authStatus) {
      ws.send('401 Bad Auth');
      ws.terminate();
      return 1;
    }
    else if(authStatus instanceof Error){
      ws.send(authStatus.message);
      ws.terminate();
      return 1;
    }
    ws['id'] = req.headers['x-client-pubkey'];

    const extWs = ws as ExtWebSocket;
    extWs.isAlive = true;
    console.log("Successfully connected to cypherpost server!")

    ws.on('pong',function(){
      extWs.isAlive = true;
    });
    // connection is up, let's add a simple simple event
    ws.on('message', async function message(data, isBinary) {
      const postId = data.toString();
      console.log({postId});

      if(!postId.startsWith('s5')) {
        ws.send("Invalid Post Id.");
        return 1;
      }
      const recipients = await getPostIdRecipients(postId);
      if(recipients instanceof Error) {
        ws.send(recipients.message);
        return 1;
      }
      recipients.push(ws['id']);

      console.log(recipients);
      wss.clients.forEach(function each(client) {
        if (
          client.readyState === WebSocket.OPEN && // has open connection
          recipients.includes(client['id']) // is included in recipients to this post_id
        ) {
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
