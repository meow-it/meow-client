let serverURLAPIEndpoint = `http://localhost:3003/api/`

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
	try {
		let response = await fetch(serverURLAPIEndpoint + "meow/all", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ latitude, longitude }),
		})
		let responseJSON = await response.json()
		return responseJSON
	} catch (err) {
		console.log("Something Happened: 😓", err)
		return null
	}
}

function generateMeows(elements) {
	let html = ""
	elements.forEach((element) => {
		let time = timeDifference(new Date(), new Date(element.createdAt))
		let hide = element.toxic
			? `<img data-id="${element._id}" data-state="hidden" class="hideMessage" src="./assets/image/hide.png" alt="Unhide Message" height="30" width="30">`
			: ""
		let toxic = element.toxic ? `toxic` : ""
		let isLiked = !element.likedBy.includes(user._id)
			? `./assets/image/unliked.png`
			: "./assets/image/paw.png"
		let likeStatus = !element.likedBy.includes(user._id)
			? `unliked`
			: "liked"
		let reviewIcon = element.isReviewed
			? `./assets/image/reviewed.png`
			: `./assets/image/kitty.png`
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
                <img data-id="${
					element._id
				}" class="shareMeowButton" src="./assets/image/share.png" alt="Share Meow" height="30" width="30">
            </div>
        </div>`
	})

	return html
}

function generateMeow(element) {
	let time = timeDifference(new Date(), new Date(element.createdAt))
	let hide = element.toxic
		? `<img data-id="${element._id}" data-state="hidden" class="hideMessage" src="./assets/image/hide.png" alt="Unhide Message" height="30" width="30">`
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
			}" class="shareMeowButton" src="./assets/image/share.png" alt="Share Meow" height="30" width="30">
        </div>
    </div>`

	let promotion = `<div class="promotionHolder">
                        <span class="promotion">See more on Meow it</span>
                    </div>`

	return html + promotion
}

async function handleLike(e) {
	let id = e.target.dataset.id
	let status = e.target.dataset.status
	let like = status == "unliked" ? 1 : -1

	if (like == 1) {
		e.target.src = "./assets/image/paw.png"
		e.target.dataset.status = "liked"
	} else {
		e.target.src = "./assets/image/unliked.png"
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
	})
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
	let state = e.target.dataset.state
	let spanElement =
		e.target.parentElement.parentElement.parentElement.querySelector(
			".meowContent"
		)

	if (state == "hidden") {
		e.target.src = "./assets/image/eye.png"
		e.target.dataset.state = "visible"
		spanElement.style.fontFamily = "Inter"
	} else {
		e.target.src = "./assets/image/hide.png"
		e.target.dataset.state = "hidden"
		spanElement.style.fontFamily = "Galactico"
	}
}

async function handleReview(e) {
	let id = e.target.dataset.id

	e.target.src = "./assets/image/reviewed.png"

	e.target.classList.remove("reportButton")
	e.target.classList.add("reviewed")

	await fetch(serverURLAPIEndpoint + `meow/review`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			userid: user._id,
			meowid: id,
		}),
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
	let PlaceAPIEndpoint =
		"https://api.bigdatacloud.net/data/reverse-geocode-client"
	let response = await fetch(
		`${PlaceAPIEndpoint}?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
	)
	let responseJSON = await response.json()
	return responseJSON
}

function generateNoMeows() {
	let html = ""
	html += `<div class="noMeows">
        <img class="noDataGif" src="./assets/image/nodata.gif" alt="No Meows" height="200" width="200">
        <span class="noMeowsText">No meows nearby 🙁</span>
        <span class="askUserToCreate">Create a new meow by clicking on the plus icon 😽</span>
    </div>`
	return html
}

async function newMeow(text, coords) {
	let response = await fetch(serverURLAPIEndpoint + `meow/new`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			userid: user._id,
			text: text,
			latitude: coords.latitude,
			longitude: coords.longitude,
		}),
	})
	let responseJSON = await response.json()
	return responseJSON
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
