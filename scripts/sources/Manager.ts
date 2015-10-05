/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />

/// <reference path="../GuestBookNamespaceManager.ts" />

class Manager extends SourceItf {

	constructor(params : any, guestBookNamespaceManager : GuestBookNamespaceManager) {
		super(params, guestBookNamespaceManager);
		this.run();
	}

	public run() {
		var self = this;

		Logger.debug(this.getSourceNamespaceManager().socket.id);

	}
}