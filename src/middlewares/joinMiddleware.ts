import { Logger, Middleware } from 'edumeet-common';
import { Permission } from '../common/authorization';
import { thisSession } from '../common/checkSessionId';
import { PeerContext } from '../Peer';
import Room from '../Room';
import { createConsumers } from '../common/consuming';
import * as jwt from 'jsonwebtoken';

const logger = new Logger('JoinMiddleware');

export const createJoinMiddleware = ({ room }: { room: Room; }): Middleware<PeerContext> => {
	logger.debug('createJoinMiddleware() [room: %s]', room.sessionId);

	const middleware: Middleware<PeerContext> = async (
		context,
		next
	) => {
		const {
			peer,
			message,
			response
		} = context;

		if (!thisSession(room, message)) return next();

		switch (message.method) {
			case 'join': {
				const {
					displayName,
					picture,
					token
				} = message.data;

				peer.displayName = displayName;
				peer.picture = picture;
				peer.token = token;
				logger.debug('createJoinMiddleware() [room: %s, peer: %s, displayName: %s, picture: %s, token: %s]', room.sessionId, peer.id, displayName, picture, token);
				const lobbyPeers = peer.hasPermission(Permission.PROMOTE_PEER) ?
					room.lobbyPeers.items.map((p) => (p.peerInfo)) : [];

				response.peers = room.getPeers().map((p) => (p.peerInfo));
				response.chatHistory = room.chatHistory;
				response.fileHistory = room.fileHistory;
				response.countdownTimer = room.countdownTimer;
				response.breakoutRooms = room.getBreakoutRooms().map((b) => (b.breakoutRoomInfo));
				response.lobbyPeers = lobbyPeers;
				response.locked = room.locked;

				room.joinPeer(peer);
				context.handled = true;

				if (!peer.initialConsume && peer.consumingTransport) {
					peer.initialConsume = true;

					createConsumers(room, peer);
				}

				break;
			}

			default: {
				break;
			}
		}

		return next();
	};

	return middleware;
};
