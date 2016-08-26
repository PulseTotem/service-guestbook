/**
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/session/SessionSourceNamespaceManager.ts" />

/// <reference path="./sources/Manager.ts" />
/// <reference path="./core/GuestbookUtils.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/Cmd.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/CmdList.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/priorities/InfoPriority.ts" />

var lwip : any = require('lwip');
var moment : any = require('moment');
var mime = require('mime-sniffer');

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
		args.push(this.getParams().BackgroundURL);
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

		var imgWidth = 1920;
		var imgHeight = 1080;

		var cmsAlbumId : string = self.getParams().CMSAlbumId;
		var backgroundURL = self.getParams().BackgroundURL;
		var logoLeftURL = self.getParams().LogoLeftURL;
		var logoRightURL = self.getParams().LogoRightURL;

		var localBackground = "/tmp/gb_bg_"+uuid.v1()+".png";

		var failDownloadBackground = function (error) {
			Logger.error("Error when retrieving the background picture. Error: "+JSON.stringify(error));
		};

		var successDownloadBackground = function () {

			lwip.open(localBackground, function (backgroundErr, backgroundImg) {
				if (backgroundErr) {
					Logger.error("Error when retrieving background file with lwip" + JSON.stringify(backgroundErr));
				} else {
					backgroundImg.resize(imgWidth, imgHeight, "linear", function (resizeBackgroundError, imgWithBackground) {
						if (resizeBackgroundError) {
							Logger.error("Error when resizing background with lwip" + JSON.stringify(resizeBackgroundError));
						} else {
							var base64DrawContent = drawContent.replace(/^data:image\/png;base64,/, "");
							var drawContentImg = new Buffer(base64DrawContent, 'base64');
							lwip.open(drawContentImg, 'png', function (drawContentErr, drawContentLwipImg) {
								if (drawContentErr) {
									Logger.error("Error when opening drawContent file with lwip" + JSON.stringify(drawContentErr));
								} else {
									imgWithBackground.paste((1920 - drawContentLwipImg.width()) / 2, (1080 - drawContentLwipImg.height()) / 2, drawContentLwipImg, function (addDrawContentErr, imgWithDrawContent) {
										if (addDrawContentErr) {
											Logger.error("Error when pasting drawContent with lwip" + JSON.stringify(addDrawContentErr));
										} else {
											var failCreateWatermark = function (error) {
												Logger.error("Error when retrieving the watermark picture. Error: "+JSON.stringify(error));
											};

											var successCreateWatermark = function(localWatermark) {
												lwip.open(localWatermark, function (watermarkErr, watermarkImg) {
													if (watermarkErr) {
														Logger.error("Error when opening watermarkErr with lwip" + JSON.stringify(watermarkErr));
													} else {
														imgWithDrawContent.paste(0, 0, watermarkImg, function (finishErr, finishImg) {
															if (finishErr) {
																Logger.error("Error when pasting watermark with lwip" + JSON.stringify(finishErr));
															} else {
																var nowMoment = moment().format("YYYY-MM-DD-HH-mm-ss");
																var imgName = + nowMoment + ".png";
																var newFileUrl = GuestBook.upload_directory + "/"+imgName;
																finishImg.writeFile(newFileUrl, function (errWriteW) {
																	if (errWriteW) {
																		Logger.error("Error when writing file with lwip" + JSON.stringify(errWriteW));
																	} else {
																		Logger.info("Success writing file ! => " + newFileUrl);

																		var successPostCMS = function () {
																			Logger.info("Success to post to CMS");
																		};

																		var failPostToCMS = function (err) {
																			Logger.error("Error while posting pics to CMS");
																			Logger.debug(err);
																		};

																		GuestbookUtils.postPictureToCMS(newFileUrl, imgName, "Guestbook at "+nowMoment.toString(), cmsAlbumId, successPostCMS, failPostToCMS);
																	}
																});
															}
														});
													}
												});
											};

											var watermarkWidth = imgWidth;
											var watermarkHeight = 0.1 * imgHeight;
											self.createWatermark(watermarkWidth, watermarkHeight, logoLeftURL, logoRightURL, successCreateWatermark, failCreateWatermark);
										}
									});
								}
							});
						}
					});
				}
			});
		};

		self.downloadFile(backgroundURL, localBackground, successDownloadBackground, failDownloadBackground);


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

	private createWatermark(width : number, height : number, logoLeftUrl : string, logoRightUrl : string, successCallback: Function, failCallback: Function) {
		var self = this;
		var uniqueWatermarkId = uuid.v1();
		var localLogoLeft = "/tmp/"+uniqueWatermarkId+"_left";
		var localLogoRight = "/tmp/"+uniqueWatermarkId+"_right";
		var pathWatermark = "/tmp/"+uniqueWatermarkId+".png";
		var leftExtension;
		var rightExtension;

		var borderPixel = 4;

		var counterDownload = 0;
		var downloadLimit = 2;
		if (!logoRightUrl) {
			downloadLimit = 1;
		}

		var successResizingLogos = function (realWidth, realHeight) {
			var successCreateImage = function (errCreateImage, image) {
				if (errCreateImage) {
					failCallback("Error when creating watermark image: "+JSON.stringify(errCreateImage));
				} else {
					lwip.open(localLogoLeft, leftExtension, function (errOpenLogoLeft, newLogoLeft) {
						if (errOpenLogoLeft) {
							failCallback("Error when opening new logo left to paste it : "+JSON.stringify(errOpenLogoLeft));
						} else {
							if (logoRightUrl) {
								lwip.open(localLogoRight, rightExtension, function (errOpenLogoRight, newLogoRight) {
									if (errOpenLogoRight) {
										failCallback("Error when opening new logo right to paste it : "+JSON.stringify(errOpenLogoRight));
									} else {
										var logoLeftLeft : number = 10; //10px from border left;
										var logoLeftTop : number = Math.round((image.height() - newLogoLeft.height())/2);

										var logoRightLeft : number = image.width() - newLogoRight.width() - 10;
										var logoRightTop : number = Math.round((image.height() - newLogoRight.height()) /2);

										Logger.debug("Position of left logo: left: "+logoLeftLeft+" | top: "+logoLeftTop);
										Logger.debug("Position of right logo: left: "+logoRightLeft+" | top: "+logoRightTop);
										image.batch()
											.paste(logoLeftLeft, logoLeftTop, newLogoLeft)
											.paste(logoRightLeft, logoRightTop, newLogoRight)
											.writeFile(pathWatermark, function (errPasteWrite) {
												if (errPasteWrite) {
													failCallback("Error when pasting logos or writing final file: "+JSON.stringify(errPasteWrite));
												} else {
													fs.unlinkSync(localLogoLeft);
													fs.unlinkSync(localLogoRight);
													successCallback(pathWatermark);
												}
											});
									}
								});
							} else {
								var logoLeftLeft : number = borderPixel; //10px from border left;
								var logoLeftTop : number = borderPixel;
								image.batch()
									.paste(logoLeftLeft, logoLeftTop, newLogoLeft)
									.writeFile(pathWatermark, function (errPasteWrite) {
										if (errPasteWrite) {
											failCallback("Error when pasting logos or writing final file: "+JSON.stringify(errPasteWrite));
										} else {
											fs.unlinkSync(localLogoLeft);
											successCallback(pathWatermark);
										}
									});
							}

						}
					});
				}
			};
			Logger.debug("Create image with following dimension: W: "+realWidth+" | H: "+realHeight);
			lwip.create(realWidth, realHeight, {r: 255, g: 255, b: 255, a: 70}, successCreateImage);
		};

		var successDownloadLogo = function() {
			counterDownload++;
			if (counterDownload == downloadLimit) {
				mime.lookup(localLogoLeft, function(errSniffMimeLogoLeft, infoLogoLeft: any) {
					if (errSniffMimeLogoLeft) {
						failCallback("Error when detecting mimetype of logo left: "+JSON.stringify(errSniffMimeLogoLeft));
					} else {
						leftExtension = infoLogoLeft.extension;
						lwip.open(localLogoLeft, leftExtension, function (errOpenLogoLeft, logoLeft) {
							if (errOpenLogoLeft) {
								failCallback("Error when opening left logo: "+JSON.stringify(errOpenLogoLeft));
							} else {
								if (logoRightUrl) {
									mime.lookup(localLogoRight, function (errSniffMimeLogoRight, infoLogoRight:any) {
										if (errSniffMimeLogoRight) {
											failCallback("Error when detecting mimetype of logo right: " + JSON.stringify(errSniffMimeLogoRight));
										} else {
											rightExtension = infoLogoRight.extension;
											lwip.open(localLogoRight, rightExtension, function (errOpenLogoRight, logoRight) {
												if (errOpenLogoRight) {
													failCallback("Error when opening right logo: " + JSON.stringify(errOpenLogoRight));
												} else {
													var newLogoLeftHeight:number = height;
													var newLogoLeftWidth:number = Math.round((newLogoLeftHeight * logoLeft.width()) / logoLeft.height());

													Logger.debug("Compute new dimension for logo left: H:" + newLogoLeftHeight + " | W:" + newLogoLeftWidth);

													var newLogoRightHeight:number = height;
													var newLogoRightWidth:number = Math.round((newLogoRightHeight * logoRight.width()) / logoRight.height());

													Logger.debug("Compute new dimension for logo right: H:" + newLogoRightHeight + " | W:" + newLogoRightWidth);

													if ((newLogoLeftWidth + newLogoRightWidth) > (width - 50)) {
														var maxSize = (width - 50) / 2;

														Logger.debug("Sum of logo width is higher than image width + 50px. Max width: " + maxSize);

														if (newLogoLeftWidth > maxSize) {
															newLogoLeftWidth = maxSize;
															newLogoLeftHeight = Math.round((newLogoLeftWidth * logoLeft.height()) / logoLeft.width());

															Logger.debug("Compute new logo left dimension: H:" + newLogoLeftHeight + "| W:" + newLogoLeftWidth);
														}


														if (newLogoRightWidth > maxSize) {
															newLogoRightWidth = maxSize;
															newLogoRightHeight = Math.round((newLogoRightWidth * logoRight.height()) / logoRight.width());
															Logger.debug("Compute new logo right dimension: H:" + newLogoRightHeight + "| W:" + newLogoRightWidth);
														}
													}

													// Try interpolation to solve http://jira.the6thscreen.fr/browse/SERVICES-151
													logoLeft.batch().resize(newLogoLeftWidth, newLogoLeftHeight, "linear")
														.writeFile(localLogoLeft, leftExtension, function (errWriteLogoLeft) {
															if (errWriteLogoLeft) {
																failCallback("Error when resizing logo left: " + JSON.stringify(errWriteLogoLeft));
															} else {
																logoRight.batch().resize(newLogoRightWidth, newLogoRightHeight, "linear")
																	.writeFile(localLogoRight, rightExtension, function (errWriteLogoRight) {
																		if (errWriteLogoRight) {
																			failCallback("Error when resizing logo right: " + JSON.stringify(errWriteLogoRight));
																		} else {
																			successResizingLogos(width, height);
																		}
																	});
															}
														});
												}
											});
										}
									});
								} else {
									var newLogoLeftHeight:number = height - (borderPixel * 2);
									var newLogoLeftWidth:number = Math.round((newLogoLeftHeight * logoLeft.width()) / logoLeft.height());

									var maxSize = width / 4;
									if (newLogoLeftWidth > maxSize) {
										newLogoLeftWidth = maxSize;
										newLogoLeftHeight = Math.round((newLogoLeftWidth * logoLeft.height()) / logoLeft.width());

										Logger.debug("Compute new logo left dimension: H:" + newLogoLeftHeight + "| W:" + newLogoLeftWidth);
									}

									var realWidth = newLogoLeftWidth + (borderPixel * 2);
									var realHeight = newLogoLeftHeight + (borderPixel * 2);
									logoLeft.batch().resize(newLogoLeftWidth, newLogoLeftHeight, "linear")
										.writeFile(localLogoLeft, leftExtension, function (errWriteLogoLeft) {
											if (errWriteLogoLeft) {
												failCallback("Error when resizing logo left: " + JSON.stringify(errWriteLogoLeft));
											} else {
												successResizingLogos(realWidth, realHeight);
											}
										});
								}
							}
						});
					}
				});
			}
		};
		Logger.debug("Download logo files...");
		self.downloadFile(logoLeftUrl, localLogoLeft, successDownloadLogo, failCallback);

		if (logoRightUrl) {
			self.downloadFile(logoRightUrl, localLogoRight, successDownloadLogo, failCallback);
		}
	}

	private downloadFile(url, localpath, callbackSuccess, callbackError) {
		request.head(url, function(err, res, body){
			if (err) {
				callbackError(err);
			} else {
				request(url).pipe(fs.createWriteStream(localpath)).on('close', callbackSuccess);
			}
		});
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