/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceServer.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />

/// <reference path="./GuestBookNamespaceManager.ts" />
/// <reference path="./GuestBookClientNamespaceManager.ts" />



/**
 * Represents the PulseTotem GuestBook' Service.
 *
 * @class GuestBook
 * @extends SourceServer
 */
class GuestBook extends SourceServer {

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

		if (process.env.GUESTBOOK_UPLOAD_DIR == undefined) {
			GuestBook.upload_directory = "/tmp/uploads";
		} else {
			GuestBook.upload_directory = process.env.GUESTBOOK_UPLOAD_DIR;
		}

        this.addNamespace("GuestBook", GuestBookNamespaceManager);

		this.addNamespace("GuestBookClient", GuestBookClientNamespaceManager);
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