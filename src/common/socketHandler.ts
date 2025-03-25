import { Socket } from "socket.io";
import { Logger } from "edumeet-common";
import { IOServerConnection } from "./IOServerConnection";
import * as jwt from "jsonwebtoken";
import { getConfig } from "../Config";


const logger = new Logger("socketHandler");
const config = getConfig();
const signingKeys = config.jwtSignKey;

export const socketHandler = (socket: Socket) => {
  const { roomId, peerId, tenantId, displayName, token } =
    socket.handshake.query;

  logger.debug(
    "socket connection [socketId: %s, roomId: %s, peerId: %s, tenantId: %s]",
    socket.id,
    roomId,
    peerId,
    tenantId,
    token
  );
  

  if (!roomId || !peerId || !token) {
    logger.warn("socket invalid roomId or peerId or token");

    return socket.disconnect(true);
  }

  const socketConnection = new IOServerConnection(socket);

  try {
    serverManager.handleConnection(
      socketConnection,
      peerId as string,
      roomId as string,
      tenantId as number | undefined,
      token as string,
      displayName as string
    );
  } catch (error: any) {
    logger.warn("handleConnection() error prints [error: %o]", error.message);
    socket.emit("error", { message: error.message });
    socketConnection.close();
  }
};
