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

async function checkLocationPermission () {
    if(!navigator.permissions) return false
    let permission = await navigator.permissions.query({name: 'geolocation'})
    if(permission.state == 'granted') return true
    return false
}

function setDisplayNone(elements) {
    for (let key in elements) {
        elements[key].style.display = "none"
    }
}

async function getPosts({latitude, longitude}) {
    try {
        let response = await fetch(serverURLAPIEndpoint + "meow/all", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({latitude, longitude})
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
    elements.forEach(element => {

        let time = timeDifference(new Date(), new Date(element.createdAt))
        let hide = element.toxic ? `<img data-id="${element._id}" data-state="hidden" class="hideMessage" src="./assets/image/hide.png" alt="Unhide Message" height="30" width="30">` : ""
        let toxic = element.toxic ? `toxic` : ""
        let isLiked = !element.likedBy.includes(user._id) ? `./assets/image/unliked.png` : "./assets/image/paw.png"
        let likeStatus = !element.likedBy.includes(user._id) ? `unliked` : "liked"

        html+= `<div class="meow" data-id="${element._id}">
            <div class="meowTop">
                <div class="meowUserStuff">
                    <img class="meowUserProfilePicture" src="${element.profilePic}" alt="${element.name}" height="30" width="30">
                    <span class="meowUsername">${element.name}</span>
                </div>
                <span class="timeMeowed">${time}</span>
                ${hide}
                <img data-id="${element._id}" class="reportButton" src="./assets/image/kitty.png" alt="Report Message" height="30" width="30">
            </div>
            <span class="meowContent ${toxic}">${escapeHtml(element.text)}</span>
            <div class="meowBottom">
                <div class="likeButtonContainer">
                    <img data-status="${likeStatus}" data-id="${element._id}" class="likeButton" src="${isLiked}" alt="Like Button" height="30" width="30">
                    <span class="likeCount">${element.likes}</span>
                </div>
                <img data-id="${element._id}" class="shareMeowButton" src="./assets/image/share.png" alt="Share Meow" height="30" width="30">
            </div>
        </div>`
    })

    return html
}

async function getPlaceInfo(coords) {
    let PlaceAPIEndpoint = "https://api.bigdatacloud.net/data/reverse-geocode-client"
    let response = await fetch(`${PlaceAPIEndpoint}?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`)
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
	var msPerMinute = 60 * 1000;
	var msPerHour = msPerMinute * 60;
	var msPerDay = msPerHour * 24;
	var msPerMonth = msPerDay * 30;
	var msPerYear = msPerDay * 365;

	var elapsed = current - previous;

	if (elapsed < msPerMinute) {
		if (elapsed / 1000 < 30) return "Just now";
		return Math.round(elapsed / 1000) + "s";
	} else if (elapsed < msPerHour) {
		return Math.round(elapsed / msPerMinute) + "m";
	} else if (elapsed < msPerDay) {
		return Math.round(elapsed / msPerHour) + "h";
	} else if (elapsed < msPerMonth) {
		return Math.round(elapsed / msPerDay) + "d";
	} else if (elapsed < msPerYear) {
		return Math.round(elapsed / msPerMonth) + "month";
	} else {
		return Math.round(elapsed / msPerYear) + "y";
	}
}
}