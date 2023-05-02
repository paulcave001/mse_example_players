var dashPlayerUrl = "../dashjs/devAppDashJs.html";
var hlsPlayerUrl = "../hls/devAppHlsJs.html";
var shakaPlayerUrl = "../shaka/devAppShakaPlayer.html";
var rxPlayer = '../rxPlayer/devAppRxPlayer.html'
var shaka_2_5_0_lg_PlayerUrl = "../shaka/devAppShakaPlayer_2-5-0_lg.html";
var shaka_2_5_11_PlayerUrl = "../shaka/devAppShakaPlayer_2-5-11.html";
var shaka_2_5_12_PlayerUrl = "../shaka/devAppShakaPlayer_2-5-12.html";
var shaka_3_0_1_PlayerUrl = "../shaka/devAppShakaPlayer_3-0-1.html";
var shaka_3_0_5_PlayerUrl = "../shaka/devAppShakaPlayer_3-0-5.html";
var shaka_3_0_5vm_PlayerUrl = "../shaka/devAppShakaPlayer_3-0-5vm.html";
var libLookup = {
	rx: rxPlayer,
	dash: dashPlayerUrl,
	hls: hlsPlayerUrl,
	shaka: shakaPlayerUrl,
	shaka_2_5_0_lg: shaka_2_5_0_lg_PlayerUrl,
	shaka_2_5_11: shaka_2_5_11_PlayerUrl,
	shaka_3_0_1: shaka_3_0_1_PlayerUrl,
	shaka_3_0_5: shaka_3_0_5_PlayerUrl,
	shaka_3_0_5vm: shaka_3_0_5vm_PlayerUrl,
}

/**
 * Call dash or shaka adding URL params to configure the player
 * Example players take params:
 *	  srcUrl
 *	  drm
 *	  licenseServerUrl
 *	  libDebug - dash player only
 */
function loadPlayer(config) {
	var playerUrl = libLookup[config.lib];
	playerUrl += "?srcUrl=" + encodeURIComponent(config.srcUrl);
	playerUrl += "&drm=" + encodeURIComponent(config.drm);
	playerUrl += "&licenseServerUrl=" + encodeURIComponent(config.licenseServerUrl);
	playerUrl += config.otherParams;

	console.log("playerUrl: " + playerUrl);

	window.location.replace(playerUrl);
}

/**
 * @public
 *
 * Takes a string and splits it into the 2 strings that are seperated by the first occurence of a given seperator character
 * @param	{String} str The string to be split
 * @param	{String} sep The seperator character
 * @return {Array} An array of the 2 parts. If the seperator does not exist returns an array of one value that is the whole original string.
 */
function splitOnFirst(str, sep) {
	var posStartSep = str.indexOf(sep);
	if (posStartSep !== -1) {
		return [str.slice(0, posStartSep), str.slice(posStartSep + sep.length)];
	} else {
		return [str];
	}
}

/**
 * @public
 *
 * Extracts config from the querystring
 * @return {Object} An object containing name value pairs extraced from the querystring
 */
function parseConfig(){
	var config = {otherParams:""};
	location.search.substring(1).split('&').forEach(function(nvp) {
		var nameAndValue = splitOnFirst(nvp, '=');
		var name = nameAndValue[0];
		var value = decodeURIComponent(nameAndValue[1]);
		if (value === "false") value = false;
		if (value === "true") value = true;
		if (name) {
			config[name] = value;
			switch (name) {
				case "lib":
				case "assetId":
				case "srcUrl":
				case "drm":
				case "licenseServerUrl":
					// do nothing
					break;
				default:
					config.otherParams += "&" + nvp;
			}
		}
	});
	return config;
}

var allowedCodecs;

function logToScreen() {
	if (typeof logPanel !== 'undefined') logPanel.innerHTML = logPanel.innerHTML + Array.prototype.join.call(arguments) + "<br>"
}

function isCodecAllowed(mimeCodec) {

	try {

		//if there is no whitelist, allow everything
		if (!allowedCodecs) return true;

		//mimeCodec string can look like 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"'
		var parts = mimeCodec.split(";");

		var type = parts[0].trim(); //'video/mp4'
		var allowedMimeType = allowedCodecs[type];

		if (allowedMimeType) {

			//if we aren't provided a codec list but the mime type is accepted, allow it.
			if (parts.length < 2) {
				return true
			};

			var codecs = parts[1] //' codecs="avc1.42E01E,mp4a.40.2"'
				.substr(parts[1].indexOf('=') + 1) //'"avc1.42E01E,mp4a.40.2"'
				.replace(/"/g, "") //'avc1.42E01E,mp4a.40.2'
				.split(","); //['avc1.42E01E','mp4a.40.2']

			for (var i = 0; i < codecs.length; i++) {
				if (allowedMimeType.includes(codecs[0].trim().toLowerCase())) {
					return true;
				}
			}
		}
	} catch (e) {
		console.error(e);
		return true; //if our code errored, just let the browser decide.
	}

	return false;
}

document.addEventListener("keydown", function (e) {
	if (e.keyCode === 27) { //back key
		history.back(); //go back to the app launcher
	} else if (e.keyCode >= 48 && e.keyCode <= 57) {
		var percent = (e.keyCode - 48) / 10;

		var video = document.getElementsByTagName('video')[0];

		video.currentTime = video.duration * percent;
	}
});

document.addEventListener("DOMContentLoaded", function () {

	if (config.allowedCodecs) {
		allowedCodecs = {};
		config.allowedCodecs.split(":").forEach(function (tac) {
			var typeAndCodec = tac.split(";");
			allowedCodecs[typeAndCodec[0].trim()] = typeAndCodec[1].trim().toLowerCase().split(",");
		})
	}

	var video = document.querySelector("video");

	if (video) {
		// print out canPlayType & isTypeSupported info
		var originalCanPlayType = video.canPlayType;
		video.canPlayType = function (mimeCodec) {
			console.log("**** video Can Play Type: arguments", arguments);

			if (isCodecAllowed(mimeCodec)) {
				var result = originalCanPlayType.apply(video, arguments);
				console.log("**** video Can Play Type: result", result);
				return result;
			} else {
				console.log("**** Restricted Codec Detected: codec", mimeCodec);
				return '';
			}
		}
		var originalIsTypeSupported = MediaSource.isTypeSupported;
		MediaSource.isTypeSupported = function (mimeCodec) {
			console.log("#### Media Source is Type Supported: arguments", arguments);

			if (isCodecAllowed(mimeCodec)) {
				var result = originalIsTypeSupported.apply(MediaSource, arguments);
				console.log("#### Media Source is Type Supported: result", result);
				return result;
			} else {
				console.log("#### Restricted Codec Detected: codec", mimeCodec);
				return false;
			}
		}

	}
});
