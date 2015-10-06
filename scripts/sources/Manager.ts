/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />

/// <reference path="../GuestBookNamespaceManager.ts" />

var uuid : any = require('node-uuid');

class Manager extends SourceItf {

	/**
	 * Constructor.
	 *
	 * @param {Object} params - Source's params.
	 * @param {GuestBookNamespaceManager} guestBookNamespaceManager - NamespaceManager attached to Source.
	 */
	constructor(params : any, guestBookNamespaceManager : GuestBookNamespaceManager) {
		super(params, guestBookNamespaceManager);

		if (this.checkParams(["InfoDuration", "Limit"])) {
			this.run();
		}
	}

	/**
	 * Method to run action attached to Source.
	 *
	 * @method run
	 */
	public run() {
		var self = this;

		var cmd : Cmd = new Cmd(uuid.v1());
		cmd.setDurationToDisplay(parseInt(this.getParams().InfoDuration));
		cmd.setCmd("Wait");
		var args : Array<string> = new Array<string>();
		args.push(this.getSourceNamespaceManager().socket.id);
		cmd.setArgs(args);

		var list : CmdList = new CmdList(uuid.v1());
		list.addCmd(cmd);

		Logger.debug(list);

		this.getSourceNamespaceManager().sendNewInfoToClient(list);
	}
}