// server.js       
const WebSocket = require("ws");
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let waitingClient = null;

wss.on("connection", ws => {
  if (waitingClient) {
    const partner = waitingClient;
    waitingClient = null;

    ws.partner = partner;
    partner.partner = ws;

    ws.send(JSON.stringify({ type: "match", role: "caller" }));
    partner.send(JSON.stringify({ type: "match", role: "callee" }));
  } else {
    waitingClient = ws;
    ws.send(JSON.stringify({ type: "waiting" }));
  }

  ws.on("message", msg => {
    if (ws.partner) {
      // Convert Buffer → string before forwarding
      const text = msg.toString();
      ws.partner.send(text);
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
