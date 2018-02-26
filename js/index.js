(function (global) { // global == window
	var SUPPORTED_TYPES = ['linius/pvstub', 'application/dash+xml']

	function includes(array, substr) {
		return array.some(function (element) {
			return element.indexOf(substr) !== -1
		})
	}

	function loadManifest(manifestUrl) {
		var protobuf = global.protobuf

		return new Promise(function (resolve, reject) {
			protobuf.load(manifestUrl, function (error, schema) {
				if (error) {
					reject(error)
					return
				}

				resolve(schema)
			})
		})
	}

	function createShakaTech() {
		var DefaultTech = videojs.getTech('Html5')

		var ShakaTech = videojs.extend(DefaultTech, {
			constructor: function (options, ready) {
				var player = this
				var source = options.source

				delete options.source

				DefaultTech.call(player, options, ready)

				const videoElement = player.el()
				player.shakaPlayer = new shaka.Player(videoElement)

				/*
				// * Here is an example how to add custom headers to request
				// * Helpful to add auth & x-api-key header to use linius engine
				// * @example
				player.shakaPlayer.getNetworkingEngine().registerRequestFilter(function (type, request) {
					var XApiKeyHeaderKey = 'x-api-key'
	
					request.headers.authorization = 'Bearer ' + __AUTH_TOKEN__
					request.headers[XApiKeyHeaderKey] = __X_API_KEY__
					request.headers.Accept = 'application/octet-stream'
				})
				*/

				player.shakaPlayer.load(source.src).catch(player.onError)
				player.shakaPlayer.addEventListener('error', player.onError)

				player.one('dispose', function () {
					console.info('[Info]: Player destroyed successfully')
					player.shakaPlayer.destroy()
				})
			},

			onError: function (error) {
				var innerError = error.detail ? error.detail : error
				console.error(innerError)
			},
		})

		ShakaTech.isSupported = function () {
			return Boolean(global.MediaSource)
		}

		ShakaTech.canPlaySource = function (params) {
			var type = params.type
			return includes(SUPPORTED_TYPES, type) ? 'maybe' : undefined
		}

		return ShakaTech
	}

	function initPlayer() {
		var shaka = global.shaka
		var videojs = global.videojs

		var MANIFEST_URL = 'manifest/dash.proto'
		var SHAKA_TECH_NAME = 'SHAKA_TECH'

		shaka.polyfill.installAll()

		if (!shaka.Player.isBrowserSupported()) {
			console.error('Browser is not supported')
			return
		}

		var ShakaTech = createShakaTech()

		videojs.options.techOrder.unshift(SHAKA_TECH_NAME)
		videojs.registerTech(SHAKA_TECH_NAME, ShakaTech)

		global.VIDEOJS_NO_DYNAMIC_STYLE = true

		return loadManifest(MANIFEST_URL)
			.then(function (scheme) {
				global.VstubSchema = scheme
			})
	}

	function createVideoPlayer() {
		var playerProps = {
			playbackRates: [0.5, 1, 1.25, 2, 5],
			autoplay: true,
			controls: true,
			sources: [{
				src: 'data/test.pvstub',
				type: 'linius/pvstub',
			}]
		}

		var divWrapper = document.getElementById('wrapper')
		var videoNode = document.createElement('video')
		videoNode.classList.add('video-js')
		divWrapper.appendChild(videoNode)

		return videojs(videoNode, playerProps, function () { })
	}

	document.addEventListener('DOMContentLoaded', function () {
		initPlayer()
			.then(function () {
				createVideoPlayer()
			})
	})
})(window)
