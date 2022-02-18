importScripts("/assets/js/localforage.js")
importScripts("/assets/js/functions.js")

const CACHE = "content-v20" // name of the current cache
const AVATARS = "avatars"
const DEFAULT_AVATAR = "./assets/image/kitty.webp"
const OFFLINE = "/offline.html"
let meowsUpdateBackgroundSyncTagName = 'meowsUpdateBackgroundSync'
let commentsUpdateBackgroundSyncTagName = 'commentsUpdateBackgroundSync'
let periodicMeowSyncTagName = 'periodicMeowSync'

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
	"/assets/image/sadcat.webp",
	
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
	"/assets/js/impure.js",
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
				return cacheNames.filter((cacheName) => CACHE !== cacheName || AVATARS !== cacheName)
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

	if (event.request.url.includes("avatars.dicebear.com")) {
		event.respondWith(
			caches.open(AVATARS).then((cache) => {
				return cache.match(event.request).then((response) => {
					if (response) return response
					return fetch(event.request).then((response) => {
						cache.put(event.request, response.clone())
						return response
					}).catch(() => {
						return caches.match(DEFAULT_AVATAR)
					})
				})
			})
		)
		return
	}

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

async function periodicallySyncMeows() {
	let position = await getLocalForage("position")
	if(position == null) return true
	
	let meows = await getPosts(position)
	if(meows == null) return true

	await setLocalForage("meows", meows)
	await setLocalForage("lastSynced", new Date().getTime())
	console.log("PERIODIC SYNCING MEOWS")
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

async function requestPeriodicBGSync(tagName, hours) {
	try {
		await self.registration.periodicSync.register(tagName, {
			minInterval: hours * 60 * 60 * 1000,
		})
		await setLocalForage("periodicBGSync", true)
	} catch (err) {
		console.log(`Unable to REGISTER periodic sync`, err)
		setTimeout(() => requestPeriodicBGSync(tagName, hours), 10000)
		await setLocalForage("periodicBGSync", false)
	}
}

requestBackgroundSync(meowsUpdateBackgroundSyncTagName)
requestBackgroundSync(commentsUpdateBackgroundSyncTagName)
requestPeriodicBGSync(periodicMeowSyncTagName, 1)

self.addEventListener('sync', event => {
    if (event.tag === meowsUpdateBackgroundSyncTagName) {
		console.log("SYNCING MEOWS")
        event.waitUntil(syncScheduledMeows())
    } else if (event.tag === commentsUpdateBackgroundSyncTagName) {
		console.log("SYNCING COMMENTS")
		event.waitUntil(syncScheduledComments())
	}
})

self.addEventListener("periodicsync", (event) => {
	if (event.tag == periodicMeowSyncTagName) {
		event.waitUntil(periodicallySyncMeows())
	}
})