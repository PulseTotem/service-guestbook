/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceServer.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />

/// <reference path="./GuestBookNamespaceManager.ts" />
/// <reference path="./GuestBookClientNamespaceManager.ts" />

var request : any = require('request');
var fs : any = require('fs');

/**
 * Represents the PulseTotem GuestBook' Service.
 *
 * @class GuestBook
 * @extends SourceServer
 */
class GuestBook extends SourceServer {

	static host : string;
	static upload_directory : string;

    /**
     * Constructor.
     *
     * @param {number} listeningPort - Server's listening port..
     * @param {Array<string>} arguments - Server's command line arguments.
     */
    constructor(listeningPort : number, arguments : Array<string>) {
        super(listeningPort, arguments);

        this.init();
    }

    /**
     * Method to init the GuestBook server.
     *
     * @method init
     */
    init() {
        var self = this;

		if (process.env.GUESTBOOK_HOST == undefined) {
			GuestBook.host = "http://localhost:6015";
		} else {
			GuestBook.host = process.env.GUESTBOOK_HOST;
		}

		if (process.env.GUESTBOOK_UPLOAD_DIR == undefined) {
			GuestBook.upload_directory = "/tmp/uploads";
		} else {
			GuestBook.upload_directory = process.env.GUESTBOOK_UPLOAD_DIR;
		}

        this.addNamespace("GuestBook", GuestBookNamespaceManager);

		this.addNamespace("GuestBookClient", GuestBookClientNamespaceManager);

		this.app.use("/uploads", express.static(GuestBook.upload_directory));
    }
}

/**
 * Server's GuestBook listening port.
 *
 * @property _GuestBookListeningPort
 * @type number
 * @private
 */
var _GuestBookListeningPort : number = process.env.PORT || 6015;

/**
 * Server's GuestBook command line arguments.
 *
 * @property _GuestBookArguments
 * @type Array<string>
 * @private
 */
var _GuestBookArguments : Array<string> = process.argv;

var serverInstance = new GuestBook(_GuestBookListeningPort, _GuestBookArguments);
serverInstance.run();