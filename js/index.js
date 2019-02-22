(function (global) { // global == window
	// TODO: use prod service address, stage env api address
	const SHAKA_TECH_NAME = 'SHAKA_TECH'
	const MANIFEST_URL = 'manifest/dash.proto'
	const SUPPORTED_TYPES = ['linius/pvstub', 'application/dash+xml']
	const LICENSE_SERVER_URL = 'https://wv-keyos.licensekeyserver.com'
	const AUTH_XML_URL = 'https://api.stage.linius.com/v2/drm/authXml'

	const { loadManifest, includes, getAuthXml } = global.demoUtils;

	// Creates shaka.tech and init drm sources and license headers
	function createShakaTech(authXml) {
		const DefaultTech = videojs.getTech('Html5')

		const ShakaTech = videojs.extend(DefaultTech, {
			// Video js throw exception if shorthand syntax is used
			constructor: function (options, ready) {
				const player = this
				const source = options.source

				delete options.source

				DefaultTech.call(player, options, ready)

				const videoElement = player.el()
				player.shakaPlayer = new shaka.Player(videoElement)

				player.shakaPlayer.configure({
					drm: {
						servers: {
							'com.widevine.alpha': LICENSE_SERVER_URL,
						},
					}
				});

				// * Here is an example how to add custom headers to request
				// * Helpful to add auth & x-api-key header to use linius engine
				// * @example
				player.shakaPlayer.getNetworkingEngine().registerRequestFilter((type, request) => {
					if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
						// This is the specific header name and value the server wants.
						// You need to add actual authentication XML here in base64 encoded format.
						request.headers.customdata = authXml
					}
				})

				player.shakaPlayer.load(source.src).catch(player.onError)
				player.shakaPlayer.addEventListener('error', player.onError)

				player.one('dispose', () => {
					console.info('[Info]: Player destroyed successfully')
					player.shakaPlayer.destroy()
				})
			},

			onError(error) {
				const innerError = error.detail ? error.detail : error
				console.error(innerError)
			},
		})


		ShakaTech.isSupported = () => Boolean(global.MediaSource)
		ShakaTech.canPlaySource = (params) => {
			const type = params.type
			return includes(SUPPORTED_TYPES, type) ? 'maybe' : undefined
		}

		return ShakaTech
	}


	// Inits player and player's playback engine
	function initPlayer(authXml) {
		const shaka = global.shaka
		const videojs = global.videojs

		shaka.polyfill.installAll()

		if (!shaka.Player.isBrowserSupported()) {
			console.error('Browser is not supported')
			return
		}

		const ShakaTech = createShakaTech(authXml)

		videojs.options.techOrder.unshift(SHAKA_TECH_NAME)
		videojs.registerTech(SHAKA_TECH_NAME, ShakaTech)

		global.VIDEOJS_NO_DYNAMIC_STYLE = true

		return loadManifest(MANIFEST_URL)
			.then((scheme) => {
				global.VstubSchema = scheme
			})
	}

	// Creates video player after all prepartion around
	// shaka tech is done
	function createVideoPlayer() {
		const playerProps = {
			playbackRates: [0.5, 1, 1.25, 2, 5],
			autoplay: true,
			controls: true,
			sources: [{
				src: './data/568cenc.pvstub', // Encrypted content is set by default
				type: 'linius/pvstub',
			}]
		}

		// #region debug purpose only
		const videoSrcWrapper = document.getElementById('src-name')
		videoSrcWrapper.innerHTML = `Video Source: ${playerProps.sources[0].src}`
		// #endregion


		const divWrapper = document.getElementById('wrapper')
		const videoNode = document.createElement('video')
		videoNode.classList.add('video-js')

		// Add Videojs eventTracking plugin
		videoNode.setAttribute("data-setup", '{"plugins": {"eventTracking": true}}');
		divWrapper.appendChild(videoNode)
		const player = videojs(videoNode, playerProps, () => { })

		// DEBUGGING Event Tackers/Listeners. Disable if not required
		player.on('tracking:firstplay', (e, data) => console.log(data));
		player.on('tracking:pause', (e, data) => console.log(data));
		player.on('tracking:seek', (e, data) => console.log(data));
		player.on('tracking:buffered', (e, data) => console.log(data));

		// Extra stuff for tracking overall percentile of completion, This event triggers each quarter of a video.
		player.on('tracking:first-quarter', (e, data) => console.log(data))
		player.on('tracking:second-quarter', (e, data) => console.log(data))
		player.on('tracking:third-quarter', (e, data) => console.log(data))
		player.on('tracking:fourth-quarter', (e, data) => console.log(data))

		// Send Events to amplitude
		// Attributes pauseCount, seekCount, bufferCount, totalDuration, watchedDuration, bufferDuration, initialLoadTime
		// only triggered when Player has changed sources, has ended, or has been destroyed
		player.eventTracking({
			performance: function(data) {
		        console.log('tracking:performance', data);
		        amplitude.logEvent("video-stream-web", data);
		        setTimeout(console.log("done"), 1000);
		        }
		      });

		return player
	}
	document.addEventListener('DOMContentLoaded', () => {
		getAuthXml(AUTH_XML_URL)
			.then(authXml => initPlayer(authXml))
			.then(() => createVideoPlayer())

	})
})(window)
