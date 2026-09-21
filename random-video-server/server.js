// server.js
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

let waitingClient = null;

wss.on("connection", ws => {
  if (waitingClient) {
    // Pair with waiting client
    const partner = waitingClient;
    waitingClient = null;

    ws.partner = partner;
    partner.partner = ws;

    ws.send(JSON.stringify({ type: "match" }));
    partner.send(JSON.stringify({ type: "match" }));
  } else {
    // No one waiting, store this client
    waitingClient = ws;
    ws.send(JSON.stringify({ type: "waiting" }));
  }

  ws.on("message", msg => {
    if (ws.partner) {
      ws.partner.send(msg); // Relay SDP/ICE messages
    }
  });

  ws.on("close", () => {
    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: "disconnect" }));
      ws.partner.partner = null;
    }
    if (waitingClient === ws) {
      waitingClient = null;
    }
  });
});
