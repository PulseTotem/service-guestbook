/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/session/SessionSourceNamespaceManager.ts" />

/// <reference path="./sources/Manager.ts" />

/**
 * Represents the PulseTotem GuestBook's SessionSourceNamespaceManager for each call from PulseTotem's Client.
 *
 * @class GuestBookNamespaceManager
 * @extends SessionSourceNamespaceManager
 */
class GuestBookNamespaceManager extends SessionSourceNamespaceManager {

    /**
     * Constructor.
     *
     * @constructor
     * @param {any} socket - The socket.
     */
    constructor(socket : any) {
        super(socket);
	    this.addListenerToSocket('Manager', function(params : any, self : GuestBookNamespaceManager) { (new Manager(params, self)) });
    }
}