/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/session/SessionSourceNamespaceManager.ts" />

/// <reference path="./sources/Manager.ts" />

/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/Cmd.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/CmdList.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/priorities/InfoPriority.ts" />

var lwip : any = require('lwip');
var moment : any = require('moment');

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

	/**
	 * Lock the control of the Screen for the Session in param.
	 *
	 * @method lockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	lockControl(session : Session) {
		var self = this;

		var cmd : Cmd = new Cmd(session.id());
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setDurationToDisplay(3600);
		cmd.setCmd("StartSession");
		var args : Array<string> = new Array<string>();
		args.push(self.socket.id);
		args.push(JSON.stringify(session));
		cmd.setArgs(args);

		var list : CmdList = new CmdList(session.id());
		list.addCmd(cmd);

		self.sendNewInfoToClient(list);
	}

	/**
	 * Send new draw content to the Screen.
	 *
	 * @method newDrawContent
	 * @param {any} drawContent - DrawContent in a base64 encoded version.
	 */
	newDrawContent(drawContent : any) {
		var self = this;

		var activeSession : Session = self.getSessionManager().getActiveSession();

		if(activeSession != null) {
			var cmd:Cmd = new Cmd(activeSession.id());
			cmd.setPriority(InfoPriority.HIGH);
			cmd.setDurationToDisplay(3600);
			cmd.setCmd("NewDrawContent");
			var args:Array<string> = new Array<string>();
			args.push(self.socket.id);
			args.push(JSON.stringify(activeSession));
			args.push(drawContent);
			cmd.setArgs(args);

			var list:CmdList = new CmdList(activeSession.id());
			list.addCmd(cmd);

			self.sendNewInfoToClient(list);
		}
	}

	/**
	 * Save draw content and finish Session.
	 *
	 * @method saveContent
	 * @param {any} drawContent - DrawContent in a base64 encoded version.
	 */
	saveContent(drawContent : any) {
		var self = this;

		var blankImgCreated = function(blanckErr, blankImage) {
			if(blanckErr) {
				Logger.error("Error when creating file with lwip" + JSON.stringify(blanckErr));
			} else {
				var localBackground = GuestBook.upload_directory + "/testfdsophia/utils/background.jpg";
				var localWatermark = GuestBook.upload_directory + "/testfdsophia/utils/watermark.png";

				var failDownloadBackground = function (error) {
					Logger.error("Error when retrieving the background picture. Error: "+JSON.stringify(error));
				};

				var successDownloadBackground = function () {

					lwip.open(localBackground, function (backgroundErr, backgroundImg) {
						if (backgroundErr) {
							Logger.error("Error when retrieving background file with lwip" + JSON.stringify(backgroundErr));
						} else {
							blankImage.paste(0, 0, backgroundImg, function (addBackgroundErr, imgWithBackground) {
								if (addBackgroundErr) {
									Logger.error("Error when paste background with lwip" + JSON.stringify(addBackgroundErr));
								} else {
									Logger.debug(drawContent);
									var base64DrawContent = drawContent.replace(/^data:image\/png;base64,/, "");
									Logger.debug(base64DrawContent);
									var drawContentImg = new Buffer(base64DrawContent, 'base64');
									lwip.open(drawContentImg, 'png', function (drawContentErr, drawContentLwipImg) {
										if (drawContentErr) {
											Logger.error("Error when opening drawContent file with lwip" + JSON.stringify(drawContentErr));
										} else {
											imgWithBackground.paste((1920 - drawContentLwipImg.width()) / 2, (1080 - drawContentLwipImg.height()) / 2, drawContentLwipImg, function (addDrawContentErr, imgWithDrawContent) {
												if (addDrawContentErr) {
													Logger.error("Error when pasting drawContent with lwip" + JSON.stringify(addDrawContentErr));
												} else {
													var failDownloadWatermark = function (error) {
														Logger.error("Error when retrieving the watermark picture. Error: "+JSON.stringify(error));
													};

													var successDownloadWatermark = function() {
														lwip.open(localWatermark, function (watermarkErr, watermarkImg) {
															if (watermarkErr) {
																Logger.error("Error when opening watermarkErr with lwip" + JSON.stringify(watermarkErr));
															} else {
																imgWithDrawContent.paste(0, 0, watermarkImg, function (finishErr, finishImg) {
																	if (finishErr) {
																		Logger.error("Error when pasting watermark with lwip" + JSON.stringify(finishErr));
																	} else {
																		var newFileUrl = GuestBook.upload_directory + "/testfdsophia/" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".png";
																		finishImg.writeFile(newFileUrl, function (errWriteW) {
																			if (errWriteW) {
																				Logger.error("Error when writing file with lwip" + JSON.stringify(errWriteW));
																			} else {
																				Logger.info("Success writing file ! => " + newFileUrl);
																			}
																		});
																	}
																});
															}
														});
													};

													GuestBook.downloadFile("http://cdn.the6thscreen.fr/guestbook/watermark.png", localWatermark, successDownloadWatermark, failDownloadWatermark);
												}
											});
										}
									});
								}
							});
						}
					});
				};

				GuestBook.downloadFile("http://cdn.the6thscreen.fr/guestbook/background.jpg", localBackground, successDownloadBackground, failDownloadBackground);
			}
		};

		lwip.create(1920, 1080, {r:0, g:0, b:0, a:0}, blankImgCreated);

		/*var activeSession : Session = self.getSessionManager().getActiveSession();

		if(activeSession != null) {
			var cmd:Cmd = new Cmd(activeSession.id());
			cmd.setPriority(InfoPriority.HIGH);
			cmd.setDurationToDisplay(3600);
			cmd.setCmd("NewDrawContent");
			var args:Array<string> = new Array<string>();
			args.push(self.socket.id);
			args.push(JSON.stringify(activeSession));
			args.push(drawContent);
			cmd.setArgs(args);

			var list:CmdList = new CmdList(activeSession.id());
			list.addCmd(cmd);

			self.sendNewInfoToClient(list);
		}*/
	}

	/**
	 * Unlock the control of the Screen for the Session in param.
	 *
	 * @method unlockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	unlockControl(session : Session) {
		var self = this;

		var cmd : Cmd = new Cmd(session.id());
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setDurationToDisplay(3);
		cmd.setCmd("FinishSession");
		var args : Array<string> = new Array<string>();
		args.push(self.socket.id);
		args.push(JSON.stringify(session));
		cmd.setArgs(args);

		var list : CmdList = new CmdList(session.id());
		list.addCmd(cmd);

		self.sendNewInfoToClient(list);
	}

	/**
	 * Method called when socket is disconnected.
	 *
	 * @method onClientDisconnection
	 */
	onClientDisconnection() {
		super.onClientDisconnection();
		var self = this;
		
		self.getSessionManager().finishActiveSession();
	}
}