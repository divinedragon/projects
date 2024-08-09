# Multi-Agent Central Server

## Websocket Endpoints

### Opening a Websocket Connection

A new Websocket connection can be obtained by calling `ws://localhost:3000/?id=<<UUID>>`.

### Sending Messages on the Websocket

On the previously opened Websocket connection, send messages whenever there is new input from Client side.





## Rest Endpoint (GET /rest-endpoint)

This endpoint is to demonstrate that regular REST endpoints can also be configured along with Websocket endpoints.

```bash
-> curl -s http://localhost:3000/rest-endpoint | jq
{
  "message": "Response from REST endpoint"
}
```





## Webhook Endpoints

### Send Async Message (GET /async-chat-messages)

Endpoint to allow agents send messages on the Websocket asynchronously. For simplicily, this endpoint is configured as `GET`

#### Connection Id is Valid
```bash
-> curl -s 'http://localhost:3000/async-chat-messages?id=<<UUID>>&data=<<MESSAGE>>' | jq
{
  "success": true
}
```

#### Connection Id is Invalid
```bash
-> curl -s 'http://localhost:3000/async-chat-messages?id=<<UUID>>&data=<<MESSAGE>>' | jq
{
  "status": false,
  "message": "No connection found for connection_id: <<UUID>>"
}
```



### Terminate Connection Asynchronously (GET /async-chat-termination)

Endpoint to allow agents send messages on the Websocket asynchronously. For simplicily, this endpoint is configured as `GET`

#### Connection Id is Valid
```bash
-> curl -s 'http://localhost:3000/async-chat-termination?id=<<UUID>>&reason=<<REASON>>' | jq
{
  "success": true
}
```

#### Connection Id is Invalid
```bash
-> curl -s 'http://localhost:3000/async-chat-termination?id=<<UUID>>&reason=<<REASON>>' | jq
{
  "status": false,
  "message": "No connection found for connection_id: <<UUID>>"
}
```



## Starting the Server

```bash
-> node index.js | npx pino-pretty
```
