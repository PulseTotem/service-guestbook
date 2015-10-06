/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/NamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/Session.ts" />

/// <reference path="./sources/Manager.ts" />

/**
 * Represents the PulseTotem GuestBook's NamespaceManager to manage connections from mobile clients.
 *
 * @class GuestBookClientNamespaceManager
 * @extends NamespaceManager
 */
class GuestBookClientNamespaceManager extends NamespaceManager {

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket : any) {
		super(socket);
		this.addListenerToSocket('TakeControl', function(callSocketId : any, self : GuestBookClientNamespaceManager) { self.takeControl(callSocketId); });
	}

	/**
	 * Search for callSocket and init a Session to take control on screen.
	 *
	 * @method takeControl
	 * @param {Object} callSocketId - A JSON object with callSocket's Id.
	 */
	takeControl(callSocketId : any) {
		var self = this;

		var callNamespaceManager = self.server().retrieveNamespaceManagerFromSocketId(callSocketId.callSocketId);

		if(callNamespaceManager == null) {
			self.socket.emit("ControlSession", self.formatResponse(false, "NamespaceManager corresponding to callSocketid '" + callSocketId.callSocketId + "' doesn't exist."));
		} else {

			var newSession : Session = callNamespaceManager.newSession(self);

			self.socket.emit("ControlSession", self.formatResponse(true, newSession));
		}
	}
}