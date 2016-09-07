/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/NamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/SessionNamespaceManagerItf.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/Session.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/SessionStatus.ts" />

/// <reference path="./sources/Manager.ts" />
/// <reference path="./GuestBookNamespaceManager.ts" />

/**
 * Represents the PulseTotem GuestBook's NamespaceManager to manage connections from mobile clients.
 *
 * @class GuestBookClientNamespaceManager
 * @extends NamespaceManager
 * @implements SessionNamespaceManagerItf
 */
class GuestBookClientNamespaceManager extends NamespaceManager implements SessionNamespaceManagerItf {

	/**
	 * Call NamespaceManager.
	 *
	 * @property _callNamespaceManager
	 * @type GuestBookNamespaceManager
	 */
	private _callNamespaceManager : GuestBookNamespaceManager;

	/**
	 * Guestbook Client 's ProfilId
	 *
	 * @property _profilId
	 * @type string
	 */
	private _profilId : string;

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket : any) {
		super(socket);

		this._callNamespaceManager = null;

		this.addListenerToSocket('TakeControl', function(callSocketId : any, self : GuestBookClientNamespaceManager) { self.takeControl(callSocketId); });
		this.addListenerToSocket('NewContent', function(drawContent : any, self : GuestBookClientNamespaceManager) { self.drawContent(drawContent); });
		this.addListenerToSocket('SaveContent', function(drawContent : any, self : GuestBookClientNamespaceManager) { self.saveContent(drawContent); });

		this.addListenerToSocket('SetProfilId', function(profilId : any, self : GuestBookClientNamespaceManager) { self.setProfilId(profilId); });
	}

	/**
	 * Search for callSocket and init a Session to take control on screen.
	 *
	 * @method takeControl
	 * @param {Object} callSocketId - A JSON object with callSocket's Id.
	 */
	takeControl(callSocketId : any) {
		var self = this;

		if(callSocketId.callSocketId != null) {

			var callNamespaceManager = self.server().retrieveNamespaceManagerFromSocketId(callSocketId.callSocketId);

			if (callNamespaceManager == null) {
				self.socket.emit("ControlSession", self.formatResponse(false, "NamespaceManager corresponding to callSocketid '" + callSocketId.callSocketId + "' doesn't exist."));
			} else {
				self._callNamespaceManager = callNamespaceManager;

				var newSession:Session = callNamespaceManager.newSession(self);

				self.socket.emit("ControlSession", self.formatResponse(true, newSession));

				var backgroundInfo = {"backgroundURL": this._callNamespaceManager.getParams().BackgroundURL};
				self.socket.emit("SetBackground", self.formatResponse(true, backgroundInfo));
			}
		} else {
			self.lockControl(null);

			self.broadcastToAllScreens("lockControl", null);
		}
	}

	/**
	 * Receive new content to display on the Client screen.
	 *
	 * @method drawContent
	 * @param {Object} drawContent - A JSON object with drawContent.
	 */
	drawContent(drawContent : any) {
		var self = this;

		var newDrawContent = drawContent.drawContent;

		if(self._callNamespaceManager != null) {
			self._callNamespaceManager.newDrawContent(newDrawContent);
		} else {
			self.broadcastToAllScreens("newDrawContent", newDrawContent);
		}
	}

	/**
	 * Save Content and finish session.
	 *
	 * @method saveContent
	 * @param {Object} drawContent - A JSON object with drawContent.
	 */
	saveContent(drawContent : any) {
		var self = this;

		var newDrawContent = drawContent.drawContent;

		if(self._callNamespaceManager != null) {
			self._callNamespaceManager.saveContent(newDrawContent);

			self._callNamespaceManager.getSessionManager().finishActiveSession();
		} else {
			self.broadcastToAllScreens("saveContent", newDrawContent, true);

			self.unlockControl(null);

			self.broadcastToAllScreens("unlockControl", null);
		}
	}

	/**
	 * Lock the control of the Screen for the Session in param.
	 *
	 * @method lockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	lockControl(session : Session) {
		var self = this;

		self.socket.emit("LockedControl", self.formatResponse(true, session));
	}

	/**
	 * Unlock the control of the Screen for the Session in param.
	 *
	 * @method unlockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	unlockControl(session : Session) {
		var self = this;

		self.socket.emit("UnlockedControl", self.formatResponse(true, session));
	}

	/**
	 * Method called to broadcast message to screen with specified profilId.
	 *
	 * @method broadcastToAllScreens
	 * @param {string} cmd - cmd description
	 * @param {any} content - cmd argument
	 * @param {boolean} blockToFirst - send message to first screen and stop
	 */
	broadcastToAllScreens(cmd : string, content : any, blockToFirst : boolean = false) {
		var self = this;

		var sendDone : boolean = false;

		for(var iNM in self.server().namespaceManagers) {
			if(! blockToFirst || ! sendDone) {
				var namespaceManager:any = self.server().namespaceManagers[iNM];
				if (typeof(namespaceManager["getParams"]) != "undefined") {
					var params:any = namespaceManager.getParams();

					if (params.SDI.profilId == parseInt(self._profilId)) {
						namespaceManager.onExternalMessage(cmd, content);
						sendDone = true;
					}
				}
			}
		}
	}

	/**
	 * Set the client profilId..
	 *
	 * @method setProfilId
	 * @param {Object} profilId - A JSON object with profil's Id.
	 */
	setProfilId(profilIdObj : any) {
		this._profilId = profilIdObj.profilId;
	}

	/**
	 * Method called when socket is disconnected.
	 *
	 * @method onClientDisconnection
	 */
	onClientDisconnection() {
		var self = this;

		this.onDisconnection();

		if(self._callNamespaceManager != null) {
			self._callNamespaceManager.getSessionManager().finishActiveSession();
		}
	}
}