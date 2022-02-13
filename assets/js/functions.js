let serverURLAPIEndpoint = `https://meow-ruby.vercel.app/api/`

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

function commentsPlaceholderDiv(noMeows = false) {

	let className = "loadingComments"
	let webmSrc = noMeows ? "./assets/image/nodata.webm" : "./assets/image/loading.webm"
	let mp4Src = noMeows ? "./assets/image/nodata.mp4" : "./assets/image/loading.mp4"
	let title = noMeows ? "No Comments Yet" : "Loading Comments"
	let text = noMeows ? "No Comments Yet. Try sending a new one 🤩" : "Loading Comments.."
	let size = noMeows ? "150" : "80"

	return `<div class="${className}">
				<video 
					height="${size}" width="${size}" 
					autoplay="autoplay" loop="loop" 
					muted="muted" aria-label="Loading Comments" 
					title="${title}"
					<source src="${webmSrc}" type="video/webm">
					<source src="${mp4Src}" type="video/mp4">
				>
				</video>	
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
			<span class="commentText ${toxic}">${escapeHtml(element.text)}</span>
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
            <span class="meowContent ${toxic}">${escapeHtml(
			element.text
		)}</span>
            <div class="meowBottom">
                <div class="likeButtonContainer">
                    <img data-status="${likeStatus}" data-id="${
			element._id
		}" class="likeButton" src="${isLiked}" alt="Like Button" height="30" width="30">
                    <span class="likeCount">${element.likes}</span>
                </div>
				<div class="commentButtonContainer">
					<img data-id="${element._id}" class="commentButton" src="./assets/image/comment.webp" alt="Comment Button" height="30" width="30">
					<span class="commentCount">${element.comments.length}</span>
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
        <span class="meowContent ${toxic}">${escapeHtml(element.text)}</span>
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
	}).catch(() => {
		showStatus("Something went wrong. Please try again later.")
		setTimeout(() => {
			hideStatus()
		}, 2000)
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
		<video 
			height="200" width="200" 
			title="No Meows Nearby"
			autoplay loop muted aria-label="No Meows Nearby" 
			<source src = "./assets/image/nodata.webm" type = "video/webm">
			<source src = "./assets/image/nodata.mp4" type = "video/mp4"> 
			>
		</video>
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
		"/": "&#x2F;",
		"`": "&#x60;",
		"=": "&#x3D;",
	}
	return String(string).replace(/[&<>"'`=\/]/g, function (s) {
		return entityMap[s]
	})
}

function timeDifference(current, previous) {
	var msPerMinute = 60 * 1000
	var msPerHour = msPerMinute * 60
	var msPerDay = msPerHour * 24
	var msPerMonth = msPerDay * 30
	var msPerYear = msPerDay * 365

	var elapsed = current - previous

	if (elapsed < msPerMinute) {
		if (elapsed / 1000 < 30) return "Just now"
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
		alert("Couldn't share the content 🙁")
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
	await caches.keys().then((keyList) => {
		Promise.all(keyList.map((key) => {
			caches.delete(key)
		}))
	})
	alert("Request sent to clear browser cache! 🙌")
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