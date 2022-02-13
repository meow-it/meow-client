importScripts("/assets/js/localforage.js")
importScripts("/assets/js/functions.js")

const CACHE = "content-v15" // name of the current cache
const OFFLINE = "/offline.html"
let meowsUpdateBackgroundSyncTagName = 'meowsUpdateBackgroundSync'
let commentsUpdateBackgroundSyncTagName = 'commentsUpdateBackgroundSync'

const AUTO_CACHE = [
	OFFLINE,
	"/",
	"/assets/image/add.webp",
	"/assets/image/cancel.webp",
	"/assets/image/cat-face.webp",
	"/assets/image/eye.webp",
	"/assets/image/hide.webp",
	"/assets/image/kitty.webp",
	"/assets/image/location.webp",
	"/assets/image/paw.webp",
	"/assets/image/reviewed.webp",
	"/assets/image/share.webp",
	"/assets/image/unliked.webp",
	
	"/assets/image/loading.gif",
	"/assets/image/spinner.gif",
	"/assets/image/error.gif",
	"/assets/image/nodata.gif",

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

	"./site.webmanifest"
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

async function syncScheduledMeows () {
	let scheduledMeows = await getLocalForage("meowQueue")
	let newQueue = []
	if (scheduledMeows == null) return
	if(scheduledMeows.length > 0){
		scheduledMeows.forEach(async (meow) => {
			let sentMeow = await newMeow(meow.text, meow.coords, meow.userid)
			if(sentMeow._id == undefined) {
				newQueue.push(meow)
				return
			}
			let meows = await getLocalForage("meows")
			meows.unshift(sentMeow)
			await setLocalForage("meows", meows)
		})
	}
	await setLocalForage("meowQueue", newQueue)
	return true
}

async function syncScheduledComments() {
	let scheduledComments = await getLocalForage("commentQueue")
	let newQueue = []
	if (scheduledComments == null) return
	
	if(scheduledComments.length > 0){
		scheduledComments.forEach(async (element) => {
			let sentComment = await createNewComment(element)
			if(sentComment._id == undefined) {
				newQueue.push(element)
				return
			}
		})
	}
	await setLocalForage("commentQueue", newQueue)
	return true
}

async function requestBackgroundSync(backgroundSyncTagName) {
    try {
		await self.registration.sync.register(backgroundSyncTagName)
		await setLocalForage("backgroundSync", true)
	} catch (error) {
		console.log("Unable to REGISTER background sync", error)
		setTimeout(() => requestBackgroundSync(backgroundSyncTagName), 10000)
		await setLocalForage("backgroundSync", false)
	}
}

requestBackgroundSync(meowsUpdateBackgroundSyncTagName)
requestBackgroundSync(commentsUpdateBackgroundSyncTagName)

self.addEventListener('sync', event => {
    if (event.tag === meowsUpdateBackgroundSyncTagName) {
		console.log("SYNCING MEOWS")
        event.waitUntil(syncScheduledMeows());
    } else if (event.tag === commentsUpdateBackgroundSyncTagName) {
		console.log("SYNCING COMMENTS")
		event.waitUntil(syncScheduledComments());
	}
})