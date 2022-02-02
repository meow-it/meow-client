let user
let meowCount = 0
let elements = {
	newUser: document.querySelector(".newUserLoading"),
	postsLoading: document.querySelector(".postsLoading"),
	location: document.querySelector(".noLocationAccess"),
	wrapper: document.querySelector(".wrapper"),
}
let permissionToAccessGeoLocationOnNonChrome = false
let geoPermissionCount = 0

document
	.querySelector(".givePermissionButton")
	.addEventListener("click", (e) => {
		navigator.geolocation.getCurrentPosition(
			() => {
                
				window.location.reload()
			},
			() => {
				if (geoPermissionCount > 0) {
					let text =
						e.target.parentElement.querySelector(".learnMore")
					text.textContent =
						"You have denied access to your location. You can change this in your browser settings. Click here to learn more ↗"
					text.classList.add("newAlert")
				}
				geoPermissionCount++
			}
		)
	})

let params = new URLSearchParams(window.location.search)
if (!params.has("meow")) {
	main()
} else {
	showMeow()
}

let userItem = {}
userItem.username = document.querySelector(".username")
userItem.profilePicture = document.querySelector(".profilePicture")

async function main() {
	NProgress.start()

	let userFromStorage = await getLocalForage("user")

	if (userFromStorage == null) {
		requestAnimationFrame(() => {
			elements.newUser.style.display = "flex"
		})

		user = await register()

		setTimeout(() => {
			elements.newUser.style.display = "none"
			elements.wrapper.style.display = "flex"
			return main()
		}, 3000)

		return user
	} else {
		user = userFromStorage
	}

	NProgress.set(0.5)

	userItem.username.textContent = user.name
	userItem.profilePicture.src = user.profilePic

	let locationPermission = await checkLocationPermission()

	if (!locationPermission) {
		setDisplayNone(elements)
		elements.location.style.display = "flex"
		NProgress.done()
		return
	} else {
		setDisplayNone(elements)
		elements.postsLoading.style.display = "flex"

		let position = await getCurrentPosition()

		let coords = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
		}

		NProgress.set(0.7)

		let placeInfo = await getPlaceInfo(coords)
		let localityString = getLocationString(placeInfo)

		let locationTextSpan = document.querySelector(".locationText")
		locationTextSpan.textContent = localityString
		locationTextSpan.dataset.accuracy = position.coords.accuracy

		let meows = await getPosts(position.coords)
		meowCount = meows.length

		NProgress.set(0.9)

		let html = meowCount != 0 ? generateMeows(meows) : generateNoMeows()
		document.querySelector(".meowsContainer").innerHTML = html

		setTimeout(() => {
			elements.postsLoading.style.display = "none"
			elements.wrapper.style.display = "flex"
			NProgress.done()
		}, 1000)
	}

	return user
}

async function showMeow() {
	document.querySelector(".meowFromId").style.display = "flex"
	let meowid = params.get("meow")
	let meow = await getSingleMeow(meowid)

	if (meow == null) window.location.href = window.location.origin

	let coords = {
		longitude: meow.location.coordinates[0],
		latitude: meow.location.coordinates[1],
	}

	let placeInfo = await getPlaceInfo(coords)
	let localityString = getLocationString(placeInfo)
	let locationTextSpan = document.querySelector(".meowLocationText")
	locationTextSpan.textContent = localityString

	let html = generateMeow(meow)
	document.querySelector(".meowContainer").innerHTML = html
}

document.addEventListener("click", (e) => {
	if (e.target.classList.contains("likeButton")) {
		handleLike(e)
	} else if (e.target.classList.contains("hideMessage")) {
		handleEye(e)
	} else if (e.target.classList.contains("createNewMeowButton")) {
		handleCreateButtonClick()
	} else if (e.target.classList.contains("cancelMeow")) {
		handleCloseNewMeowModal()
	} else if (e.target.classList.contains("reportButton")) {
		handleReview(e)
	} else if (e.target.classList.contains("createMeow")) {
		createMeow(e)
	} else if (e.target.classList.contains("shareMeowButton")) {
		handleShareButton(e)
	} else if (e.target.classList.contains("currentLocation")) {
		handleLocationIconClick(e)
	} else if (
		e.target.classList.contains("promotion") ||
		e.target.classList.contains("promotionHolder")
	) {
		handlePromotionClick()
	}
})

document
	.querySelector(".meowInput")
	.addEventListener("input", countCharactersInTextField)

function handleCreateButtonClick() {
	let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
	newMeowModalContainer.style.display = "block"
}

function handleCloseNewMeowModal() {
	let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
	newMeowModalContainer.style.display = "none"
}

function handlePromotionClick() {
	window.location.href = window.location.origin
}

async function createMeow() {
	NProgress.start()

	let textField = document.querySelector(".meowInput")
	let text = textField.value

	let { coords } = await getCurrentPosition()

	let meow = await newMeow(text, coords)

	NProgress.set(0.7)

    textField.value = ""

	let html = generateMeows([meow])
	let existingStuff = document.querySelector(".meowsContainer").innerHTML

	if (meowCount == 0) {
		document.querySelector(".meowsContainer").innerHTML = html
	} else {
		document.querySelector(".meowsContainer").innerHTML =
			html + existingStuff
	}

	NProgress.done()

	handleCloseNewMeowModal()
}
