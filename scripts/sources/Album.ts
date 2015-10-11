/*
 * @author Christian Brel <christian@pulsetotem.fr, ch.brel@gmail.com>
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />
/// <reference path="../../t6s-core/core-backend/t6s-core/core/scripts/infotype/Picture.ts" />
/// <reference path="../../t6s-core/core-backend/t6s-core/core/scripts/infotype/PictureAlbum.ts" />

var lodash = require('lodash');
var uuid : any = require('node-uuid');
var fs : any = require('fs');

class Album extends SourceItf {
	/**
	 * The list of pictures
	 *
	 * @property _pictures
	 * @type {Array<Picture>}
	 * @private
	 */
	private _pictures : Array<Picture>;

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

	public run() {
		var self = this;

		self.retrievePicsFromLocal(function() {
			var limit = parseInt(self.getParams().Limit);
			var list : PictureAlbum = new PictureAlbum(uuid.v1());

			if (self._pictures.length > 0) {
				lodash.shuffle(self._pictures);
				var picsForAlbum = new Array<Picture>();
				if(self._pictures.length > limit) {
					picsForAlbum = lodash.take(self._pictures, limit);
				} else {
					picsForAlbum = self._pictures
				}
				picsForAlbum.forEach( function (pic: Picture) {
					pic.setDurationToDisplay(parseInt(self.getParams().InfoDuration));
					list.addPicture(pic);
				});
				list.setDurationToDisplay(list.getPictures().length*parseInt(self.getParams().InfoDuration));
				self.getSourceNamespaceManager().sendNewInfoToClient(list);
			}
		});
	}

	public retrievePicsFromLocal(successCB : Function) {
		var self = this;
		self._pictures = new Array<Picture>();
		var localDir = GuestBook.upload_directory + "/testfdsophia/";

		fs.readdir(localDir, function (err, files) {
			if (err) {
				Logger.error("Error when reading the directory. "+err);
			} else {
				Logger.debug("Start scanning directory : "+localDir);
				files.forEach(function (file) {
					var indexLastSlash = file.lastIndexOf('/');
					var filename = file.substring(indexLastSlash+1);
					var picturename = filename.substring(0, filename.length - 4);

					var pic : Picture = new Picture(picturename);
					pic.setTitle("GuestBook #testFDSophia");

					var picUrlOriginal : PictureURL = new PictureURL(filename);
					var picUrl = GuestBook.host + "/uploads/testfdsophia/" + filename;
					picUrlOriginal.setURL(picUrl);
					pic.setOriginal(picUrlOriginal);

					self._pictures.push(pic);
				});
				successCB();
			}
		});
	}
}