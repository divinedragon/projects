const express = require("express");

const app = express();

const expressWs = require("express-ws")(app);

const open_connections = {};

expressWs.getWss().on("connection", function (ws, req) {
  console.log("connection open", req.query.id);
  const connection_id = req.query.id;
  open_connections[connection_id] = ws;
  console.log(`Connection Successful for ClientId[${connection_id}]`);
  console.log("Open Connections: ", Object.keys(open_connections));
});

// Example middleware
app.use(function (req, res, next) {
  console.log("middleware");
  req.testing = "testing";
  return next();
});

app.get("/rest-endpoint", (req, res) => {
  console.log("Sample REST endpoint");
  res.json({
    message: "Response from REST endpoint",
  });
});

app.get("/aysnc-chat-message", (req, res) => {
  console.log("Async Chat Message -->  " + JSON.stringify(req.query));

  const connection_id = req.query.id;
  const data = req.query.data;

  console.log(`Connection Id[${connection_id}] -> Data[${data}]`);

  const ws = open_connections[connection_id];
  if (ws) {
    console.log("Sending message to client");
    ws.send(
      JSON.stringify({
        status: "active",
        data: "Push message - " + data,
      })
    );

    res.send("OK");
  } else {
    console.log("No connection found for connection_id: " + connection_id);
    res
      .status(404)
      .send("No connection found for connection_id: " + connection_id);
  }
});

app.get("/aysnc-chat-terminate", (req, res) => {
  const connection_id = req.query.id;
  const reason = req.query.reason;

  console.log(`Connection Id[${connection_id}] -> Reason[${reason}]`);

  const ws = open_connections[connection_id];
  if (ws) {
    console.log("Sending terminate message to client");
    ws.send(
      JSON.stringify({
        status: "terminated",
        data: "Terminate Reason - " + reason,
      })
    );

    ws.close();

    delete open_connections[connection_id];

    res.send("OK");
  } else {
    console.log("No connection found for connection_id: " + connection_id);
    res
      .status(404)
      .send("No connection found for connection_id: " + connection_id);
  }
});

app.ws("/", function (ws) {
  ws.on("message", function (msg) {
    const payload = JSON.parse(msg);

    console.log("Socket msg --> ", msg);
    console.log("Payload --> ", payload);

    const connection_id = payload.id;
    const data = payload.data;

    console.log(`Connection Id: ${connection_id} - Data: ${data}`);

    if (connection_id) {
      const connected_socket = open_connections[connection_id];
      if (connected_socket) {
        connected_socket.send(
          JSON.stringify({
            status: "active",
            data: "msg received - " + data,
          })
        );
      } else {
        console.log("msg received from unknown connection - " + connection_id);
        ws.send(
          JSON.stringify({
            status: "terminated",
          })
        );
      }
    } else {
      console.log("No Connection Id provided");
      ws.send(
        JSON.stringify({
          status: "terminated",
        })
      );
    }
  });
});

//The server starts and listens on port 3000.
app.listen(3000, () => console.log("Server started on http://localhost:3000"));
