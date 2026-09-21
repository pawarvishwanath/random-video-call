// server.js       
const WebSocket = require("ws");

// Render requires you to use process.env.PORT
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let waitingClient = null;

wss.on("connection", ws => {
  if (waitingClient) {
    const partner = waitingClient;
    waitingClient = null;

    ws.partner = partner;
    partner.partner = ws;

    ws.send(JSON.stringify({ type: "match" }));
    partner.send(JSON.stringify({ type: "match" }));
  } else {
    waitingClient = ws;
    ws.send(JSON.stringify({ type: "waiting" }));
  }

  ws.on("message", msg => {
    if (ws.partner) {
      // Relay exactly what was received (already JSON string)
      ws.partner.send(msg);
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

console.log(`WebSocket server running on port ${PORT}`);
