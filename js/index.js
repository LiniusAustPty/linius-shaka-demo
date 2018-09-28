(function (global) { // global == window
	var SUPPORTED_TYPES = ['linius/pvstub', 'application/dash+xml']
	// TODO: remove it
	var xml = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48S2V5T1NBdXRoZW50aWNhdGlvblhNTD48RGF0YT48R2VuZXJhdGlvblRpbWU+MjAxOC0wOS0yMCAwODo0Nzo1Ny4wNTM8L0dlbmVyYXRpb25UaW1lPjxFeHBpcmF0aW9uVGltZT4yMDE4LTEwLTIwIDA4OjQ3OjU3LjA1MzwvRXhwaXJhdGlvblRpbWU+PFVuaXF1ZUlkPjFmZWYzNjRiLWIyNGMtNDdhMi1iOWQ5LTU1YTFjZTBhMTUyNTwvVW5pcXVlSWQ+PFJTQVB1YktleUlkPjkzNzFjMTk4YmJkYWVmZDIyODdhOTgzM2E5ZjY1ZDg2PC9SU0FQdWJLZXlJZD48TGljZW5zZSB0eXBlPSJzaW1wbGUiLz48V2lkZXZpbmVQb2xpY3kgZmxfQ2FuUGxheT0idHJ1ZSIgZmxfQ2FuUGVyc2lzdD0iZmFsc2UiLz48RmFpclBsYXlQb2xpY3kgcGVyc2lzdGVudD0iZmFsc2UiLz48V2lkZXZpbmVDb250ZW50S2V5U3BlYyBUcmFja1R5cGU9IkhEIj48U2VjdXJpdHlMZXZlbD4xPC9TZWN1cml0eUxldmVsPjwvV2lkZXZpbmVDb250ZW50S2V5U3BlYz48L0RhdGE+PFNpZ25hdHVyZT5UQVFpYy9DQkpQUm5oSStsWjIxTitFVVF6S1d0R0Ewa2dRdXNVVWxNa1ExS2ZXdURNaldGWkRZMS9tT0N4M1ByNzUwV3RER3hmS1l3WG5lYmY2emRKelRkY0YweGg2aUROZTQyR1NsWHBTalZXTmZKT0dRWUlNOVZuV2k2Q2wxc0VlemdYcjFLY2tnaldxZ0Nla2h3K0c2SDBkRWVwUlN4SVVwK0JOMzlWMGh3SzJqS0trSVFsa0Q4RUhWZHRTSHk3WGJvU1krNTVNUDRxdjJkMnVTdG94c1FoSVZrb1RCQzI2eEI0dU5Rc1hRempsN0RDaHBKVy92eS9IeW5nbytCc3J6dDN6cC8yYnJ2eWlnbHl0YlYyNHJMWDZzTUFDdmcwZGxHd29lWDFxVVdRb3ovaUdPcVV6MTVLRGhoMEtkRGhlYzZ1Z1JFdWc1dnViYWNPQ3djT1E9PTwvU2lnbmF0dXJlPjwvS2V5T1NBdXRoZW50aWNhdGlvblhNTD4="

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

				player.shakaPlayer.configure({
					drm: {
						servers: {
							"com.widevine.alpha": "https://wv-keyos.licensekeyserver.com",
						},
					}
				});


				// * Here is an example how to add custom headers to request
				// * Helpful to add auth & x-api-key header to use linius engine
				// * @example
				player.shakaPlayer.getNetworkingEngine().registerRequestFilter(function (type, request) {
					// var XApiKeyHeaderKey = 'x-api-key'

					if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
						// This is the specific header name and value the server wants.
						// You need to add actual authentication XML here in base64 encoded format.
						request.headers.customdata = xml
					}
				})


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
				src: '/data/sample.pvstub', // source can be changed
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
