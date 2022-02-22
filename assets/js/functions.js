let serverURLAPIEndpoint = `https://meow-it.herokuapp.com/api/`
pingServer()
// pinging the server to wake up the dyno
async function pingServer() {
	await fetch(serverURLAPIEndpoint + "meow")
}

async function getLocalForage(key) {
	try {
		let value = await localforage.getItem(key)
		return value
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return null
	}
}

async function setLocalForage(key, value) {
	try {
		await localforage.setItem(key, value)
	} catch (err) {
		console.log("Something Happened: 😓", err)
	}
}

async function register() {
	try {
		let response = await fetch(serverURLAPIEndpoint + `register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		})
		let responseJSON = await response.json()
		setLocalForage("user", responseJSON)
		return responseJSON
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return null
	}
}

async function checkLocationPermission() {
    let test = false
    if(window.chrome == null) {
        try {
            test = await getCurrentPosition()
            return test != false ? true : false
        } catch (err) {
            console.log(err)
            return false
        }
    }
	if (!navigator.permissions) return false
	let permission = await navigator.permissions.query({ name: "geolocation" })
	if (permission.state == "granted") return true
	return false
}

function setDisplayNone(elements) {
	for (let key in elements) {
		elements[key].style.display = "none"
	}
}

async function getPosts({ latitude, longitude }) {

	let response = null

	try {
		response = await fetch(serverURLAPIEndpoint + "meow/all", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ latitude, longitude }),
		})
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return null
	}

	if (response == null) return null

	let responseJSON = await response.json()
	return responseJSON
}

async function getComments(meowId) {
	let response = null
	try {
		response = await fetch(serverURLAPIEndpoint + `comment/${meowId}`)
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return null
	}

	if (response == null) return null

	let responseJSON = await response.json()
	return responseJSON
}

async function handleReviewComment (e) {
	let id = e.target.dataset.id

	e.target.src = "./assets/image/reviewed.webp"

	e.target.classList.remove("reportComment")
	e.target.classList.add("reviewed")

	await fetch(serverURLAPIEndpoint + `comment/review`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			userId: user._id,
			commentId: id,
		}),
	})
}

function commentsPlaceholderDiv(noComments = false) {

	let className = "loadingComments"
	let src = noComments ? "./assets/image/nodata.gif" : "./assets/image/loading.gif"
	let title = noComments ? "No Comments Yet" : "Loading Comments"
	let text = noComments ? "No Comments Yet. Try sending a new one 🤩" : "Loading Comments.."
	let size = noComments ? "150" : "80"

	return `<div class="${className}">
				<img class="roundedGif10px" src="${src}" alt="Loading Comments" height="${size}" width="${size}" title="${title}">	
				<span>${text}</span>
			</div>`
}

function generateComments(elements) {
	let html = ""
	elements.forEach((element) => {

		let imageUrl = element.profilePic
		let name = element.name
		let time = timeDifference(new Date(), new Date(element.createdAt))
		let hide = element.toxic
			? `<img data-id="${element._id}" data-state="hidden" class="hideMessage" src="./assets/image/hide.webp" alt="Unhide Message" height="30" width="30">`
			: ""
		let toxic = element.toxic ? `toxic` : ""

		let reviewIconSrc = element.isReviewed
			? `./assets/image/reviewed.webp`
			: `./assets/image/kitty.webp`
		let reviewClass = element.isReviewed ? `reviewed` : `reportButton reportComment`

		html += `<div class="comment">
			<div class="commentTop">
				<div class="commentedUser">
					<img src="${imageUrl}" alt="${name}" class="commentedUserProfilePicture" width="25" height="25">
					<span class="commentedUserName">${name}</span>
				</div>
				<div class="commentOptions">
					<span class="timeCommented">${time}</span>
					${hide}
					<img data-id="${element._id}" class="${reviewClass}" src="${reviewIconSrc}" alt="Report Comment" height="25" width="25">
				</div>
			</div>
			<span class="commentText ${toxic}">${replaceURLs(escapeHtml(element.text))}</span>
		</div>`
	})

	return html
}

function generateMeows(elements) {
	let html = ""
	elements.forEach((element) => {
		let time = timeDifference(new Date(), new Date(element.createdAt))
		let hide = element.toxic
			? `<img data-id="${element._id}" data-state="hidden" class="hideMessage" src="./assets/image/hide.webp" alt="Unhide Message" height="30" width="30">`
			: ""
		let toxic = element.toxic ? `toxic` : ""
		let isLiked = !element.likedBy.includes(user._id)
			? `./assets/image/unliked.webp`
			: "./assets/image/paw.webp"
		let likeStatus = !element.likedBy.includes(user._id)
			? `unliked`
			: "liked"
		let reviewIcon = element.isReviewed
			? `./assets/image/reviewed.webp`
			: `./assets/image/kitty.webp`
		let reviewClass = element.isReviewed ? `reviewed` : `reportButton`

		html += `<div class="meow" data-id="${element._id}">
            <div class="meowTop">
                <div class="meowUserStuff">
                    <img class="meowUserProfilePicture" src="${
						element.profilePic
					}" alt="${element.name}" height="30" width="30">
                    <span class="meowUsername">${element.name}</span>
                </div>
                <div class="meowOptionsStuff">
                    ${hide}
                    <span class="timeMeowed">${time}</span>
                    <img data-id="${
						element._id
					}" class="${reviewClass}" src="${reviewIcon}" alt="Report Message" height="30" width="30">
                </div>
            </div>
            <span class="meowContent ${toxic}">${replaceURLs(escapeHtml(element.text))}</span>
            <div class="meowBottom">
                <div class="likeButtonContainer">
                    <img data-status="${likeStatus}" data-id="${
			element._id
		}" class="likeButton" src="${isLiked}" alt="Like Button" height="30" width="30">
                    <span data-status="${likeStatus}" class="likeCount">${element.likes}</span>
                </div>
				<div class="commentButtonContainer">
					<img data-id="${element._id}" class="commentButton" src="./assets/image/comment.webp" alt="Comment Button" height="30" width="30">
					<span data-id="${element._id}" class="commentCount">${element.comments.length}</span>
				</div>
                <img data-id="${
					element._id
				}" class="shareMeowButton" src="./assets/image/share.webp" alt="Share Meow" height="30" width="30">
            </div>
        </div>`
	})

	return html
}

function generateMeow(element) {
	let time = timeDifference(new Date(), new Date(element.createdAt))
	let hide = element.toxic
		? `<img data-id="${element._id}" data-state="hidden" class="hideMessage" src="./assets/image/hide.webp" alt="Unhide Message" height="30" width="30">`
		: ""
	let toxic = element.toxic ? `toxic` : ""
	let like = `&nbsp;${element.likes} ${element.likes > 1 ? "likes" : "like"}`

	let html = `<div class="meow" data-id="${element._id}">
        <div class="meowTop">
            <div class="meowUserStuff">
                <img class="meowUserProfilePicture" src="${
					element.profilePic
				}" alt="${element.name}" height="30" width="30">
                <span class="meowUsername">${element.name}</span>
            </div>
            <div class="meowOptionsStuff">
                ${hide}
                <span class="timeMeowed">${time}</span>
            </div>
        </div>
        <span class="meowContent ${toxic}">${replaceURLs(escapeHtml(element.text))}</span>
        <div class="meowBottom">
            <div class="likeButtonContainer">
                <span class="likeCount">${like}</span>
            </div>
            <img data-id="${
				element._id
			}" class="shareMeowButton" src="./assets/image/share.webp" alt="Share Meow" height="30" width="30">
        </div>
    </div>`

	let promotion = `<div class="promotionHolder">
                        <span class="promotion">See more on Meow it</span>
                    </div>`

	return html + promotion
}

function generateInstallationPromotionDiv() {
	return `<div class="installationPromotionCard">
		<span class="installPromotionHeading">
			Install to get the most out of Meow It!
		</span>
		<span class="noFearHeading">
			Installing uses almost no storage and provides a quick way to return to this app including the ability to send meows even offline!
		</span>
		<div class="installationPromotionButtonsContainer">
			<span class="notNowButton">Not now</span>
			<span class="installButton">Install</span>
		</div>
	</div>`
}

function getPWADisplayMode() {
	const isStandalone = window.matchMedia("(display-mode: standalone)").matches
	if (document.referrer.startsWith("android-app://")) {
		return "twa"
	} else if (navigator.standalone || isStandalone) {
		return "standalone"
	}
	return "browser"
}

async function shouldWeShowInstallPrompt() {
	let disUserSayNOForInstallation = await getLocalForage("disUserSayNOForInstallation")
	if(disUserSayNOForInstallation == null 
		|| disUserSayNOForInstallation == undefined 
		|| disUserSayNOForInstallation == false
	) {
		return true
	}
	return false
}

async function handleLike(e) {
	let id = e.target.dataset.id
	let status = e.target.dataset.status
	let like = status == "unliked" ? 1 : -1

	if (like == 1) {
		e.target.src = "./assets/image/paw.webp"
		e.target.dataset.status = "liked"
	} else {
		e.target.src = "./assets/image/unliked.webp"
		e.target.dataset.status = "unliked"
	}
	e.target.parentElement.querySelector(".likeCount").innerText =
		parseInt(e.target.parentElement.querySelector(".likeCount").innerText) +
		like

	try {
		await fetch(serverURLAPIEndpoint + `meow/like`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				userid: user._id,
				meowid: id,
				like: like,
			}),
		})
	} catch (err) {

		// reverting the UI
		if (like == 1) {
			e.target.src = "./assets/image/unliked.webp"
			e.target.dataset.status = "unliked"
		} else {
			e.target.src = "./assets/image/paw.webp"
			e.target.dataset.status = "liked"
		}
		e.target.parentElement.querySelector(".likeCount").innerText =
			parseInt(e.target.parentElement.querySelector(".likeCount").innerText) -
			like

		showStatus("Couldn't perform the action 😿. Please try again later 😌")
		setTimeout(hideStatus, 2000)
		console.log("Something Happened ☹" + err)
		return
	}

	// if the like was successfuly, we make that reflect with the IDB
	let meows = await getLocalForage("meows")
	meows.forEach((element) => {
		if (element._id == id) {
			// updates the like count
			element.likes = parseInt(element.likes) + like
			// update the user status of the like
			like == 1 ? element.likedBy.push(user._id) : element.likedBy.splice(element.likedBy.indexOf(user._id), 1)
			return
		}
	})
	await setLocalForage("meows", meows)

	// it should reflect it in the DOM too if multiple instances are visible or inside the same page
	// find all spans with data-id as meowid and has class likeCount
	let spans = document.querySelectorAll(`[data-id="${id}"] .likeCount`)
	let imgs = document.querySelectorAll(`[data-id="${id}"] .likeButton`)
	spans.forEach((span) => span.innerText = e.target.parentElement.querySelector(".likeCount").innerText)
	imgs.forEach((img) => {
		img.src = e.target.src
		img.dataset.status = e.target.dataset.status
	})

}

async function createNewComment ({text, userId, meowId}) {
	let data = { text, userId, meowId }
	let response = null

	try {
		response = await fetch(serverURLAPIEndpoint + `comment/new`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data)
		})
	} catch (err) {
		console.log("Something went wrong! 😦" + err)
	}

	if(response != null) {
		let responseJSON = await response.json()
		return responseJSON
	}

	return null
}

function handleLocationIconClick(e) {
	let parent = e.target.parentElement
	let locationText = parent.querySelector(".locationText")
	let accuracy = locationText.dataset.accuracy
	alert(`Accuracy: ${accuracy}m`)
}

function getLocationString(placeInfo) {

    let firstComma = placeInfo.locality != "" ? ", " : ""
    let secondComma = placeInfo.city != "" ? ", " : ""

    return `${placeInfo.locality}${firstComma}${placeInfo.city}${secondComma}${placeInfo.principalSubdivision}`

}

async function getSingleMeow(id) {
	try {
		let response = await fetch(serverURLAPIEndpoint + `meow/${id}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.status !== 200) throw new Error("Something Happened: 😓")
		let responseJSON = await response.json()
		return responseJSON
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return null
	}
}

function handleEye(e) {
	let spanElement = null
	let state = e.target.dataset.state
	spanElement = e.target.parentElement.parentElement.parentElement.querySelector(".commentText")
	
	try {
		// checking if the user is selecting the eye in the comments
		spanElement.style
	} catch (err) {
		// no? then we are selecting the eye in the meows
		spanElement = e.target.parentElement.parentElement.parentElement.querySelector(
			".meowContent"
		)
	}

	if (state == "hidden") {
		e.target.src = "./assets/image/eye.webp"
		e.target.dataset.state = "visible"
		spanElement.style.fontFamily = "SFPro"
	} else {
		e.target.src = "./assets/image/hide.webp"
		e.target.dataset.state = "hidden"
		spanElement.style.fontFamily = "Galactico"
	}
}

async function handleReview(e) {
	let id = e.target.dataset.id

	e.target.src = "./assets/image/reviewed.webp"

	e.target.classList.remove("reportButton")
	e.target.classList.add("reviewed")

	let isComment = e.target.classList.contains("reportComment")
	let endpointType = isComment ? "comment/review" : "meow/review"

	let data = isComment ? {
		userId: user._id,
		commentId: id,
	} : {
		userid: user._id,
		meowid: id,
	}

	await fetch(serverURLAPIEndpoint + endpointType, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data)
	})
}

async function handleShareButton(e) {
	let id = e.target.dataset.id
	let text = "Check out this Meow on Meow it! 😺"
	let shareObject = {
		title: "Check out this Meow!",
		text: text,
		url: `${window.location.origin}/?meow=${id}`,
	}

	await shareStuff(shareObject)
}

async function getPlaceInfo(coords) {
	try {
		let PlaceAPIEndpoint = "https://api.bigdatacloud.net/data/reverse-geocode-client"
		let response = await fetch(
			`${PlaceAPIEndpoint}?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
		)
		let responseJSON = await response.json()
		return responseJSON
	} catch (error) {
		console.log("Something Happened: 😓", error)
		return null
	}
}

function generateNoMeows() {
	let html = ""
	html += `<div class="noMeows">
		<img src="./assets/image/nodata.gif" class="roundedGif10px" alt="No Meows Nearby" title="No Meows Nearby" height="200" width="200" >
        <span class="noMeowsText">No meows nearby 🙁</span>
        <span class="askUserToCreate">Create a new meow by clicking on the plus icon 😽</span>
    </div>`
	return html
}

async function newMeow(text, coords, userid) {
	try {
		let response = await fetch(serverURLAPIEndpoint + `meow/new`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				userid: userid,
				text: text,
				latitude: coords.latitude,
				longitude: coords.longitude,
			}),
		})
		let responseJSON = await response.json()
		return responseJSON
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return {}
	}
}

function escapeHtml(string) {
	let entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
		"`": "&#x60;",
		"=": "&#x3D;",
	}
	return String(string).replace(/[&<>"'`=]/g, function (s) {
		return entityMap[s]
	})
}

function replaceURLs(message) {
	if (!message) return

	let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g
	return message.replace(urlRegex, function (url) {
		let hyperlink = url
		if (!hyperlink.match("^https?://")) {
			hyperlink = "http://" + hyperlink
		}
		return `<a class='postLink' href="${hyperlink}" target="_blank" rel="noopener noreferrer">${url}</a>`
	})
}

function timeDifference(current, previous) {
	let msPerMinute = 60 * 1000
	let msPerHour = msPerMinute * 60
	let msPerDay = msPerHour * 24
	let msPerMonth = msPerDay * 30
	let msPerYear = msPerDay * 365

	let elapsed = current - previous

	if (elapsed < msPerMinute) {
		if (elapsed / 1000 < 5) return "Just now"
		return Math.round(elapsed / 1000) + "s"
	} else if (elapsed < msPerHour) {
		return Math.round(elapsed / msPerMinute) + "m"
	} else if (elapsed < msPerDay) {
		return Math.round(elapsed / msPerHour) + "h"
	} else if (elapsed < msPerMonth) {
		return Math.round(elapsed / msPerDay) + "d"
	} else if (elapsed < msPerYear) {
		return Math.round(elapsed / msPerMonth) + "month"
	} else {
		return Math.round(elapsed / msPerYear) + "y"
	}
}

function getCurrentPosition() {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			(position) => resolve(position),
			(error) => reject(error)
		)
	})
}

async function shareStuff(object) {
	try {
		if (navigator.share) {
			await navigator.share(object)
		}
	} catch (err) {
		console.log(err)
	}
}

function countCharactersInTextField(e) {
	let parent = e.target.parentElement
	let maxLength = parent.querySelector(".meowInputCharactersRemainingText")
		.dataset.limit
	let remainingNumber = parent.querySelector(
		".meowInputCharactersRemainingNumber"
	)

	
	let colorOne = "#0070f3"
	let colorTwo = "#f35d00"
	let colorThree = "#ea2027"

	let textField = e.target
	let letterCount = textField.value.length
	let remaining = maxLength - letterCount

	if (remaining < 0) {
		e.target.value = e.target.value.slice(0, maxLength)
		return
	}
	
	let text = textField.value
	window.localStorage.setItem("text", text)
	
	remainingNumber.innerText = remaining

	let percent = remaining / maxLength

	if (percent > 0.75) {
		remainingNumber.style.color = colorOne
	} else if (percent > 0.4) {
		remainingNumber.style.color = colorTwo
	} else {
		remainingNumber.style.color = colorThree
	}
}

async function deleteCache() {
	try {
		if ("serviceWorker" in navigator) {
			let registrations = await navigator.serviceWorker.getRegistrations()
			registrations.forEach((registration) => registration.unregister())
		}
	} catch (err) {
		console.log(`Something Happened: 😓`, err)
	}
	await caches.keys().then((keyList) => {
		Promise.all(keyList.map((key) => {
			caches.delete(key)
		}))
	})
	alert("Deleted the browser cache! 🙌")
}

async function getPostsFromIndexedDB() {
	let posts = await localforage.getItem("meows")
	if (posts) {
		return posts
	} else {
		return []
	}
}

async function addToBGSyncMeowRegistry({text, userid, coords}) {
	let currentQueue = await getLocalForage("meowQueue")
	if (currentQueue == null) currentQueue = []
	currentQueue.push({text, userid, coords})
	await setLocalForage("meowQueue", currentQueue)
}

async function addToBGSyncCommentsRegistry(data) {
	let currentQueue = await getLocalForage("commentQueue")
	if (currentQueue == null) currentQueue = []
	currentQueue.push(data)
	await setLocalForage("commentQueue", currentQueue)
}

function clearTextData() {
	localStorage.removeItem("text")
}

function getSavedTextData() {
	let text = localStorage.getItem("text")
	return text
}

async function getUpdatedPosition() {
	let updatedPosition = await getLocalForage("position")
	return {
		time: updatedPosition.time,
		coords: {
			latitude: updatedPosition.latitude,
			longitude: updatedPosition.longitude,
			accuracy: updatedPosition.accuracy
		}
	}
}

/***
 * @typedef {Object} BooleanForLocation
 * @property {boolean} isUpdated
 * @property {boolean} locationPermission
 */
/**
 * 
 * @param {Boolean} permission 
 * @returns {Promise<BooleanForLocation>} Returns an `Object<BooleanForLocation>` as a response to what to do for the location to update
 * @description Function returns a promise that resolves to an object with two properties:
 * - If the location was granted, it returns `{ false, true }`
 * - If the location was denied, it checks in the IDB for last known location. 
 * - It it exists it returns `{ true, true }`
 * - If there is no last known location, it returns `{ false, <argument permission> }`
 */
async function getBooleanForLocation(permission) {

	if(permission) return { isUpdated: false, locationPermission: permission }

	// Meow it decided that we don't need to constrain to 5 hours
	// we just display a big status of time since last update of last known location
	// change this variable to true if you want to enforce 5 hours
	let needToCheck = false
	let enforcedHours = 5 // hours until we need to check for a new location
	
	let lastKnownPosition = await getLocalForage("position")
	if(lastKnownPosition != null) {
		return needToCheck
			? hasGivenHoursPassed(enforcedHours, lastKnownPosition.time)
			: { isUpdated: true, locationPermission: true }
	}
	return {isUpdated: false, locationPermission: permission}
}

function hasGivenHoursPassed(hours, time) {
	let graceHours = hours // hours before we ask for location again
	let milliSecondsToSubtract = graceHours * 60 * 60 * 1000
	let lastKnownUpdatedTime = time
	if (lastKnownUpdatedTime > Date.now() - milliSecondsToSubtract) {
		return {isUpdated: true, locationPermission: true}
	} 
}

/**
 * 
 * @param {HTMLDivElement} element - The element to loopup
 * @param {string} className - The class name to look for
 * @returns {Boolean} `true` or `false`
 */
function doesTheClassExist(element, className) {
	return element.classList.contains(className)
}

/**
 * 
 * @param {HTMLDivElement} element - The Parent Element to loopup
 * @param {string} className - The class name of the child element to look for
 * @returns {Boolean} `true` or `false`
 */
function doesChildExists(element, className) {
	let child = element.querySelector(className)
	return child != null
}

async function findBGSYNCAndUpdate() {
	let permission = await getLocalForage("backgroundSync")
	if(permission != null) return permission

	permission = 'serviceWorker' in navigator && 'SyncManager' in window
	await setLocalForage("backgroundSync", permission)
	return permission
}

function getDistanceFromLocation(location1, location2) {
    var R = 6371; // earth's radius in km
    var dLat = toRad(location1.latitude - location2.latitude);
    var dLon = toRad(location1.longitude - location2.longitude);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(location1.latitude)) * Math.cos(toRad(location2.latitude)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}

function toRad(deg) {
    return deg * (Math.PI/180);
}

async function getMeowFromIDB(_id) {
	let meows = await getLocalForage("meows")
	if (meows == null) return null
	let meow = meows.find((meow) => meow._id == _id)
	return meow
}

async function findNearbyData(id) {
	let meow = await getMeowFromIDB(id)
	if (meow == null) return null

	let position = await getLocalForage("position")
	if(position == null) return null
	let meowPosition = {
		longitude: meow.location.coordinates[0],
		latitude: meow.location.coordinates[1]
	}
	let distance = await getDistanceFromLocation(position, meowPosition)
	return distance
}