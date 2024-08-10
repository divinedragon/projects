const express = require("express");
const pino = require("pino");
const axios = require("axios");

const agent_name = process.env.AGENT_NAME;
const port = process.env.AGENT_PORT;

const app = express();
const logger = pino({ msgPrefix: `Agent[${agent_name}] | ` });

const router_url = "http://localhost:3000";

// Rest Endpoint to Send a Message to Router via Webhook
app.get("/agent-chat-messages", (req, res) => {

  const connection_id = req.query.id;
  const data = req.query.data;

  logger.info("Async Message for Client[%s] -> Data[%s]", connection_id, data);

  const endpoint = `${router_url}/async-chat-messages`;
  const params = {
    id: connection_id,
    data: `Agent[${agent_name}] says - ${data}`
  }

  axios.get(endpoint, { params })
    .then(response => {
        logger.info("Agent Message sent Successfully for Client[%s] -> Data[%s] - %j", connection_id, data, params);
        res.send(response.data);
    })
    .catch(error => {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data;
            logger.error("Error while Sending Message - Client[%s], Data[%s] - HTTP Status[%s] - %j", connection_id, data, status, message);
            res.status(status).send(message);
        } else {
            logger.error("No Response Available while Sending Message - Client[%s], Data[%s]", connection_id, data);
            res.status(500).json({ success: false, message: "Unknown error" }).send();
        }
    });
});

// Rest Endpoint to Terminate existing Websocket
app.get("/agent-chat-termination", (req, res) => {
  const connection_id = req.query.id;
  const reason = req.query.reason;

  logger.info("Async Termination for Client[%s] -> Reason[%s]", connection_id, reason);

  const endpoint = `${router_url}/async-chat-termination`;
  const params = {
    id: connection_id,
    reason: `Agent[${agent_name}] - Reason[${reason}]`
  }

  axios.get(endpoint, { params })
    .then(response => {
        logger.info("Agent Termination successful for Client[%s] -> Reason[%s] - %j", connection_id, reason, params);
        res.send(response.data);
    })
    .catch(error => {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data;
            logger.error("Error while Termination - Client[%s], Reason[%s] - HTTP Status[%s] - %j", connection_id, reason, status, message);
            res.status(status).send(message);
        } else {
            logger.error("No Response Available while Termination - Client[%s], Reason[%s]", connection_id, reason);
            res.status(500).json({ success: false, message: "Unknown error" }).send();
        }
    });
});

// Start the Server
app.listen(port, () => logger.info("Server started on http://localhost:" + port));
