const express = require("express");
const uuid = require("uuid");
const pino = require("pino");

const app = express();
const logger = pino({});

const expressWs = require("express-ws")(app);

const open_connections = {};



// Example middleware
app.use((req, res, next) => {
  const request_id = req?.query?.id || uuid.v4();
  logger.info("Middleware Called. Adding a Request Tracing Id - %s", request_id);
  req.request_id = request_id;
  return next();
});



// Handle New Websocket Connections
expressWs.getWss().on("connection", (ws, req) => {
  const connection_id = req.query.id;
  open_connections[connection_id] = ws;
  logger.info("Connection Successful for ClientId[%s]", connection_id);
  logger.info("Open Connection List: %j", Object.keys(open_connections));
});

// Handle Incoming WebSocket Messages
app.ws("/", (ws) => {
  ws.on("message", (msg) => {
    const payload = JSON.parse(msg);

    const connection_id = payload.id;
    const data = payload.data;

    logger.info("Client[%s] Sent -> Message[%s], Data[%s]", connection_id, msg, data);

    if (connection_id) {
      const connected_socket = open_connections[connection_id];
      if (connected_socket) {
        const response = JSON.stringify({ status: "active", data: "Received - " + data });
        logger.info("Replying to Known Client[%s] - %j", connection_id, response);
        connected_socket.send(response);
      } else {
        const response = JSON.stringify({ status: "terminated" });
        logger.warn("Replying with Terminate Response to Unknown Client[%s] - %j", connection_id, response);
        ws.send(response);
      }
    } else {
      const response = JSON.stringify({ status: "terminated" });
      logger.warn("Replying with Terminate Response to Client without Id - %j", response);
      ws.send(response);
    }
  });
});



// Simple Rest Endpoint (no Websocket based interaction)
app.get("/rest-endpoint", (req, res) => {
  logger.info("Rest Endpoint - QueryParams[%j]", req.query);
  res.json({ message: "Response from REST endpoint" }).send();
});



// Rest Endpoint to Send a Message through existing Websocket
app.get("/async-chat-messages", (req, res) => {

  const connection_id = req.query.id;
  const data = req.query.data;

  logger.info("Async Message for Client[%s] -> QueryParams[%s], Data[%s]", connection_id, req.query, data);

  const ws = open_connections[connection_id];
  if (ws) {
    const response = JSON.stringify({ status: "active", data: "Async - " + data });
    logger.info("Sending Async Message to Client[%s] - %j", connection_id, response);
    ws.send(response);
    res.json({ success: true }).send();
  } else {
    logger.warn("Cannot sending Async Message to Client[%s] - No connection found with Id[%s]", connection_id, connection_id);
    res.status(404).json({ status: false, message: "No connection found for connection_id: " + connection_id }).send();
  }
});

// Rest Endpoint to Terminate existing Websocket
app.get("/async-chat-termination", (req, res) => {
  const connection_id = req.query.id;
  const reason = req.query.reason;

  logger.info("Async Termination for Client[%s] -> QueryParams[%s], Reason[%s]", connection_id, req.query, reason);

  const ws = open_connections[connection_id];

  if (ws) {

    const response = JSON.stringify({ status: "terminated", data: "Terminate Reason - " + reason });
    logger.info("Sending Async Terminate to Client[%s] - %j", connection_id, response);

    ws.send(response);
    ws.close();

    delete open_connections[connection_id];

    res.json({ success: true }).send();
  } else {

    logger.warn("Cannot sending Async Terminate to Client[%s] - No connection found with Id[%s]", connection_id, connection_id);
    res.status(404).json({ status: false, message: "No connection found for connection_id: " + connection_id }).send();
  }
});

// Start the Server
app.listen(3000, () => logger.info("Server started on http://localhost:3000"));
