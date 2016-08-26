/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="./ServiceConfig.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/RestClient.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/RestClientResponse.ts" />

var fs = require('fs');

class GuestbookUtils {
    private static base64_encode(file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    }

    public static postPictureToCMS(imagePath : string, imageName : string, description : string, cmsAlbumId : string, successCallback : Function, failCallback : Function) {
        var postPhotoUrl = ServiceConfig.getCMSHost() + "admin/images_collections/"+cmsAlbumId+"/images/";

        var b64datas = GuestbookUtils.base64_encode(imagePath);

        var imageDatas = {
            name: imageName,
            description: description,
            file: b64datas
        };

        var fail = function (error : RestClientResponse) {
            failCallback(error.data());
        };

        var successPostPicture = function (imageObjectResponse : RestClientResponse) {
            var imageObject = imageObjectResponse.data();
            fs.unlinkSync(imagePath);
            Logger.debug("Obtained picture info: "+imageObject);
            successCallback(imageObject.id);
        };

        Logger.debug("Post picture "+imagePath+" to "+postPhotoUrl);
        RestClient.post(postPhotoUrl, imageDatas, successPostPicture, fail, ServiceConfig.getCMSAuthKey());
    }

}
