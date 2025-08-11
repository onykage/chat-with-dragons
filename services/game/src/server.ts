import express, { type Request, type Response } from "express";
import { WebSocketServer, type WebSocket } from "ws";

const app = express();
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

const server = app.listen(8080, () => console.log("Gateway on :8080")); // :8081 in game service
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  ws.send(JSON.stringify({ type: "welcome", at: Date.now() })); // "hello" in game service
});
