const CACHE = "content-v7" // name of the current cache
const OFFLINE = "/offline.html"

const AUTO_CACHE = [
	OFFLINE,
	"/",
	"/assets/image/add.png",
	"/assets/image/cancel.png",
	"/assets/image/cat-face.png",
	"/assets/image/error.gif",
	"/assets/image/eye.png",
	"/assets/image/hide.png",
	"/assets/image/kitty.png",
	"/assets/image/loading.gif",
	"/assets/image/location.png",
	"/assets/image/nodata.gif",
	"/assets/image/paw.png",
	"/assets/image/reviewed.png",
	"/assets/image/share.png",
	"/assets/image/unliked.png",

	"/assets/css/main.css",
	"/assets/css/nprogress.css",
	"/assets/css/SFRegular.woff",
	"/assets/css/SFMedium.woff",
	"/assets/css/SFBold.woff",
	"/assets/css/Galactico-Basic.woff",
	
    "/assets/js/app.js",
    "/assets/js/functions.js",
	"/assets/js/nprogress.js",
	"/assets/js/localforage.js",

	"./manifest.json"
]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(AUTO_CACHE))
			.then(self.skipWaiting())
	)
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => CACHE !== cacheName)
			})
			.then((unusedCaches) => {
				console.log("DESTROYING CACHE", unusedCaches.join(","))
				return Promise.all(
					unusedCaches.map((unusedCache) => {
						return caches.delete(unusedCache)
					})
				)
			})
			.then(() => self.clients.claim())
	)
})

function isCached(url) {
	if (url.includes("assets")) return true
	if (url == self.location.origin + "/") return true
	if (url.includes("logo.png") || url.includes("favicon.ico") || url.includes("manifest.json")) return true
	return false
}

self.addEventListener("fetch", (event) => {
	if (
		!event.request.url.startsWith(self.location.origin) ||
		event.request.method !== "GET"
	) {
		return void event.respondWith(fetch(event.request).catch((err) => console.log(err)))
	}

	if(!isCached(event.request.url)){
		event.respondWith(
			
			fetch(event.request)
			.then((response) => {
				caches.open(CACHE).then((cache) => {
					cache.put(event.request, response)
				})
				return response.clone()
			})
			.catch((_err) => {
				return caches.match(event.request).then((cachedResponse) => {
					if (cachedResponse) {
						return cachedResponse
					}

					return caches.open(CACHE).then((cache) => {
						const offlineRequest = new Request(OFFLINE)
						return cache.match(offlineRequest)
					})
				})
			})
			
		)
	} else {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response
				}

				return fetch(event.request).then((response) => {
					caches.open(CACHE).then((cache) => {
						cache.put(event.request, response)
					})
					return response.clone()
				})
			})
		)
	}

})
