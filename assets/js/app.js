let deferredPrompt
let wasPromptDeferred = false
let faqButtonWasPressed = false
let selectedMeowForShowingComments = null
let max = 140
window.addEventListener("beforeinstallprompt", async (e) => {
	await beforeinstallpromptHandler(e)
})

window.addEventListener("appinstalled", () => {
	console.log("App installed! 🎉")
	hideInstallationPromotion()
})

let user
let meowCount = 0
let launchDisplayType = getPWADisplayMode()
let installPWAButtonOnUserInfo = document.querySelector(".installPWAFromUser")
let elements = {
	newUser: document.querySelector(".newUserLoading"),
	postsLoading: document.querySelector(".postsLoading"),
	location: document.querySelector(".noLocationAccess"),
	wrapper: document.querySelector(".wrapper"),
	firstTimeVisit: document.querySelector(".firstTimeVisit"),
	whyLocationInfo: document.querySelector(".whyLocationInfo"),
	userInfo: document.querySelector(".userInfo"),
}
let statusElements = {
	currentFeedStatus: document.querySelector(".currentFeedStatus"),
	locationHolder: document.querySelector(".locationHolder")
}
let geoPermissionCount = 0

let faqItems = document.querySelectorAll(".accordion button")

function showInstallPromotion () {
	let html = generateInstallationPromotionDiv()
	document.querySelector(".meowsContainer").insertAdjacentHTML("afterbegin", html)
}

async function beforeinstallpromptHandler (e) {
	let userConcern = await shouldWeShowInstallPrompt()
	deferredPrompt = e
	if (userConcern) {
		wasPromptDeferred = true
		showInstallPromotion()
	} 
	return
}

function toggleAccordion() {
	let itemToggle = this.getAttribute("aria-expanded")

	for (i = 0; i < faqItems.length; i++) {
		faqItems[i].setAttribute("aria-expanded", "false")
	}

	if (itemToggle == "false") {
		this.setAttribute("aria-expanded", "true")
	}
}

faqItems.forEach(item => item.addEventListener('click', toggleAccordion));

document.querySelector(".whatIsThis button").addEventListener("click", async () => {
	await setLocalForage("firstTimeVisit", true)
	window.location.reload()
})
document.querySelector(".learnMore").addEventListener("click", () => {
	showFAQ()

})
document.querySelector(".commentInput").addEventListener("keydown", async (e) => {

	if (e.key == "ENTER" || e.keyCode == 13) {
		postingComments(max)
	}
	
	let letterCount = e.target.value.length
	let remaining = max - letterCount
	if(remaining < 0) {
		e.target.value = e.target.value.slice(0, max)
		return
	}	
})
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

function renderFirstVisit() {
	setDisplayNone(elements)
	elements.firstTimeVisit.style.display = "flex"
}

async function main() {

	try {
		
		NProgress.start()
	
		let firstTimeVisit = await getLocalForage("firstTimeVisit")
	
		if (firstTimeVisit == null) {
			renderFirstVisit()
			NProgress.done()
			return
		}
	
		let userFromStorage = await getLocalForage("user")
	
		if (userFromStorage == null || userFromStorage.status == false) {
			requestAnimationFrame(() => {
				elements.newUser.style.display = "flex"
			})
	
			user = await register()
	
			if (user == null || user.status == false) {
				NProgress.done()
				window.location.reload()
			} 
	
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
	
		let permissionForLocation = await checkLocationPermission()
		let {isUpdated, locationPermission} = await getBooleanForLocation(permissionForLocation)
	
		if (!locationPermission) {
			setDisplayNone(elements)
			elements.location.style.display = "flex"
			NProgress.done()
			return
		} else {
			setDisplayNone(elements)

			let text = getSavedTextData()
			document.querySelector(".meowInput").value = text
	
			let posts = await getPostsFromIndexedDB()
			meowCount = posts.length
			
			let html = meowCount != 0 ? generateMeows(posts) : generateNoMeows()
			document.querySelector(".meowsContainer").innerHTML = html
	
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					elements.wrapper.style.display = "flex"
					NProgress.done()
				})
			})

			let position = isUpdated ? await getUpdatedPosition()  : await getCurrentPosition()
	
			await setLocalForage("position", {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				accuracy: position.coords.accuracy,
				time: new Date().getTime()
			})
	
			let coords = {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			}
			
			updatePlaceInfo(coords, position.coords.accuracy)
			NProgress.set(0.7)
	
			let meows = await getPosts(coords)
			if (meows == null) {
				showStatus("You're Offline! 😢 Unable to refresh meows.")
				return
			}
			await setLocalForage("meows", meows)
			NProgress.done()
	
			// If there are no meows in the IDB, 
			// or if the first post from network is different from the first post from IDB
			if(meowCount == 0 || posts[0]._id == meows[0]._id) {
				let html = meows.length != 0 ? generateMeows(meows) : generateNoMeows()
				document.querySelector(".meowsContainer").innerHTML = html
			} else {
				if (meows.length == 0) {
					showStatus("No meows found here! 😶 Reload to update!")
					return
				} else {
					showStatus("New meows found! 🎉 Reload to update!")
				}
			}
		}
		
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if(launchDisplayType == "twa" || launchDisplayType == "standalone") {
					installPWAButtonOnUserInfo.style.display = "none"
				}

				if(wasPromptDeferred == true) {
					if(!doesElementWithClassNameExists("installationPromotionCard")) {
						showInstallPromotion()
					}
				}

				let commentingUserProfilePicture = document.querySelector(".commentingUserProfilePicture")
				commentingUserProfilePicture.src = user.profilePic
				commentingUserProfilePicture.alt = user.name

				if(isUpdated) {
					showStatus("Using your last known location for refreshing the feed 🎉 <br> Turn on GPS to get the meows for your current location 📍")
					setTimeout(() => {
						hideStatus()
					}, 5000)
				}
			})
		})

		
		NProgress.done()
		return user
	} catch (error) {
		console.trace("Something went wrong 😟" + error)
		showStatus("Something went wrong 😟")
	}

}

function doesElementWithClassNameExists(classname) {

	let element = document.querySelector(`.${classname}`)
	if (element == null) return false
	return true
}

async function updatePlaceInfo(coords, accuracy, individual = false) {
	let placeInfo = await getPlaceInfo(coords)
	if (placeInfo == null) return
	let localityString = getLocationString(placeInfo)

	let element = individual ? ".meowLocationText" : ".locationText"

	let locationTextSpan = document.querySelector(element)
	locationTextSpan.textContent = localityString
	individual ? "" : locationTextSpan.dataset.accuracy = accuracy
	individual ? "" : await setLocalForage("placeInfo", localityString)
}

function hideStatus() {
	statusElements.currentFeedStatus.style.top = "-3.125rem"
	statusElements.locationHolder.style.marginTop = "0px"
}

function showStatus(message) {
	statusElements.currentFeedStatus.innerHTML = message
	statusElements.currentFeedStatus.style.top = "4.1875rem"
	let feedHeight = getComputedStyle(statusElements.currentFeedStatus).height
	statusElements.locationHolder.style.marginTop = feedHeight
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

	updatePlaceInfo(coords, 0.1, true)

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
	} else if (e.target.classList.contains("commentButton")) {
		handleCommentsButtonClick(e)
	} else if (e.target.classList.contains("closeComments")) {
		handleCloseCommentsButtonClick()
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
	} else if (e.target.classList.contains("cancelGoBack")) {
		faqButtonWasPressed ? closeLocationFAQ(true) : closeLocationFAQ()
	} else if (e.target.classList.contains("closeUserInfo")){
		closeUserInfo()
	} else if (e.target.classList.contains("profilePicture")) {
		showUserInfo()
	} else if (e.target.classList.contains("deleteCache")) {
		deleteCache()
	} else if (e.target.classList.contains("logoutButton")) {
		logoutUser()
	} else if (e.target.classList.contains("goBackToHomeButton")) {
		closeMeowWhileOffline()
	} else if (e.target.classList.contains("installButton")) {
		installApp()
	} else if (e.target.classList.contains("notNowButton")) {
		userSaidNOToInstall()
	} else if (e.target.classList.contains("installPWAButtonFromUserInfo")) {
		installApp()
	} else if (e.target.classList.contains("showFaqSpan")) {
		showFAQ()
		faqButtonWasPressed = true
	} else if (e.target.classList.contains("postCommentButton")) {
		postingComments(max)
	}
})

document
	.querySelector(".meowInput")
	.addEventListener("input", countCharactersInTextField)

async function handleCommentsButtonClick(e) {
	selectedMeowForShowingComments = e.target.dataset.id
	setDisplayNone(elements)
	document.querySelector(".commentsModalContainer").style.display = "flex"
	let cachedMeows = await getLocalForage("meows")
	let meow = cachedMeows.find((element) => element._id == selectedMeowForShowingComments)
	let htmlForCachedMeow = generateMeows([meow])
	document.querySelector(".commentMeowContainer").innerHTML = htmlForCachedMeow

	let commentsContainer = document.querySelector(".commentsContainer")
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			commentsContainer.innerHTML = commentsPlaceholderDiv()
		})
	})
	
	let comments = await getComments(selectedMeowForShowingComments)
	if (comments == null) return
	let html = comments.length == 0 ? commentsPlaceholderDiv(true) : generateComments(comments)
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			commentsContainer.innerHTML = html
		})
	})
}

function handleCloseCommentsButtonClick() {
	document.querySelector(".commentsModalContainer").style.display = "none"
	elements.wrapper.style.display = "flex"
	document.querySelector(".commentMeowContainer").innerHTML = ""
	document.querySelector(".commentsContainer").innerHTML = ""
}

function handleCreateButtonClick() {
	setDisplayNone(elements)
	let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
	newMeowModalContainer.style.display = "block"
}

function handleCloseNewMeowModal() {
	if(doesElementWithClassNameExists("newMeowStatusMessage")) document.querySelector(".newMeowStatusMessage").style.display = "none"
	let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
	newMeowModalContainer.style.display = "none"
	elements.wrapper.style.display = "flex"
}

function handlePromotionClick() {
	window.location.href = window.location.origin
}

function closeLocationFAQ (userInfo = false) {
	setDisplayNone(elements)
	userInfo ? elements.userInfo.style.display = "flex" : elements.location.style.display = "flex"
}

function showUserInfo () {
	setDisplayNone(elements)
	document.querySelector(".infoUsername").textContent = user.name
	document.querySelector(".infoUserProfilePicture").src = user.profilePic
	document.querySelector(".infoUserProfilePicture").alt = user.name
	elements.userInfo.style.display = "flex"
}

function showFAQ() {
	setDisplayNone(elements)
	elements.whyLocationInfo.style.display = "flex"
}

function closeUserInfo () {
	setDisplayNone(elements)
	elements.wrapper.style.display = "flex"
}

async function logoutUser () {
	await localforage.clear()
	window.location.href = "./"
}

function hideInstallationPromotion () {
	try {
		let installationPromotionCard = document.querySelector(".installationPromotionCard")
		installationPromotionCard.style.display = "none"
	} catch (err) {
		console.log(`Couldn't find any div with class .installationPromotionCard 😢: ${err}`)
	}
}

async function userSaidNOToInstall() {
	await setLocalForage("disUserSayNOForInstallation", true)
	hideInstallationPromotion()
}

async function installApp() {
	hideInstallationPromotion()
	deferredPrompt.prompt()
	let { outcome } = await deferredPrompt.userChoice
	console.log(`User response to the install prompt: ${outcome}`)
}

async function createMeow() {

	NProgress.start()
	let meowsContainer = document.querySelector(".meowsContainer")
	let textField = document.querySelector(".meowInput")
	let text = textField.value
	if(text.trim().length == 0) { NProgress.done(); return }
	let isBackgroundSyncAvailable = await findBGSYNCAndUpdate()
	let coords = {}

	try {
		let position = await getCurrentPosition()
		coords = position.coords
	} catch (error) {
		let position = await getUpdatedPosition()
		coords = position.coords
	}

	if(navigator.onLine) {

		let addedToBG = false

		if(isBackgroundSyncAvailable) {
			let data = {
				text,
				userid: user._id,
				coords: {
					latitude: coords.latitude,
					longitude: coords.longitude,
				}
			}
			await addToBGSyncMeowRegistry(data)	
			let temporaryMeow = {
				...data,
				likes: 0,
				toxic: false,
				_id: "temporaryMeow",
				comments: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				name: user.name,
				profilePic: user.profilePic,
				likedBy: [],
				isReviewed: false,
			}

			let temporaryHtml = generateMeows([temporaryMeow])
			meowsContainer.innerHTML = temporaryHtml + meowsContainer.innerHTML
			addedToBG = true
			textField.value = ""
			clearTextData()
			NProgress.done()
			handleCloseNewMeowModal()
		}

		let meow = await newMeow(text, coords, user._id)

		
		if(meow._id == undefined) {
			NProgress.done()
			return
		}
		
		if(isBackgroundSyncAvailable) {
			if(addedToBG) {
				let queue = await getLocalForage("meowQueue")
				queue.pop()
				await setLocalForage("meowQueue", queue)
				meowsContainer.removeChild(meowsContainer.firstChild)
			}
		}

		NProgress.set(0.7)
	
		await refreshDBWithCreatedMeow(meow)
	
		textField.value = ""
		clearTextData()
	
		let html = generateMeows([meow])
		let existingStuff = meowsContainer.innerHTML
	
		if (meowCount == 0) {
			meowsContainer.innerHTML = html
		} else {
			meowsContainer.innerHTML =
				html + existingStuff
		}
	
		NProgress.done()
		meowCount++
	
		handleCloseNewMeowModal()
	} else {
		let newMeowStatusMessage = document.querySelector(".newMeowStatusMessage")
		let textSpan = newMeowStatusMessage.querySelectorAll("span")[0]
		let buttonSpan = newMeowStatusMessage.querySelector(".goBackToHomeButton")

		if(window.chrome == undefined) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					newMeowStatusMessage.style.display = "flex"
					textSpan.innerHTML = "You're Offline! Try sending the meow when you're online. 😞 Bruh, Try using Chromium Browsers for a rich offline experience!"
					buttonSpan.style.color = "#f3624c"
				})
			})
		} else {

			if(isBackgroundSyncAvailable) {

				let data = {
					text,
					userid: user._id,
					coords: {
						latitude: coords.latitude,
						longitude: coords.longitude,
					}
				}
				await addToBGSyncMeowRegistry(data)	
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						newMeowStatusMessage.style.display = "flex"
						newMeowStatusMessage.style.backgroundColor = "#0070f3"
						textSpan.innerHTML = "You're Offline! But don't worry 🤠 Your meow is scheduled to be sent automatically 🤖 when your device gets connected to the internet 🌐"
						buttonSpan.style.color = "#0070f3"
					})
				})
				textField.value = ""
				clearTextData()
				meowCount++
			} else {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						newMeowStatusMessage.style.display = "flex"
						newMeowStatusMessage.style.backgroundColor = "#f3624c"
						textSpan.style.fontSize = "1.2rem"
						textSpan.innerHTML = "You're Offline! Background Sync is not allowed in your browser. Try allowing it in site settings to schedule this meow to be posted automatically in the background when your device gets connected to the internet or try sending this meow when you're online. 😞"
						buttonSpan.style.color = "#f3624c"
					})
				})
			}

		}
		NProgress.done()
	}

	await setLocalForage("disUserSayNOForInstallation", false)

}

async function postingComments(max) {
	NProgress.start()
	let commentsContainer = document.querySelector(".commentsContainer")
	let BG_IS_AVAILABLE = await findBGSYNCAndUpdate()
	let inputTextBox = document.querySelector(".commentInput")
	let text = inputTextBox.value
	if(text.trim().length == 0) { NProgress.done(); return }
	text = text.substring(0, max)
	let userId = user._id
	let meowId = selectedMeowForShowingComments
	let addedToBG = false
	let postingCommentSpinner = document.querySelector(".postingCommentSpinner")
	postingCommentSpinner.style.display = "block"

	// if backgroundsync is available
	if (BG_IS_AVAILABLE) {
		let data = { text, userId, meowId }
		await addToBGSyncCommentsRegistry(data)
		let temporaryComment = { ...data, 
			_id: "", 
			isReviewed: false, 
			toxic: false, 
			createdAt: new Date(), 
			name: user.name, 
			profilePic: user.profilePic 
		}
		let html = generateComments([temporaryComment])
		commentsContainer.innerHTML = html + commentsContainer.innerHTML
		addedToBG = true
		inputTextBox.value = ""
		postingCommentSpinner.style.display = "none"
	}

	let comment = await createNewComment({text, userId, meowId})
	NProgress.set(0.7)
	if(comment != null) {
		let html = generateComments([comment])
		
		addedToBG ? commentsContainer.removeChild(commentsContainer.firstChild) : null

		commentsContainer.innerHTML = html + commentsContainer.innerHTML
		inputTextBox.value = ""

		if(BG_IS_AVAILABLE) {
			let commentsFromIDB = await getLocalForage("commentQueue")
			if(commentsFromIDB != null) {
				commentsFromIDB.pop()
				await setLocalForage("commentQueue", commentsFromIDB)
			}
		}

	}
	NProgress.done()
	
	postingCommentSpinner.style.display = "none"

}

function closeMeowWhileOffline () {
	let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
	let newMeowStatusMessage = document.querySelector(".newMeowStatusMessage")

	newMeowModalContainer.style.display = "none"
	newMeowStatusMessage.style.display = "none"

	elements.wrapper.style.display = "flex"
}

async function refreshDBWithCreatedMeow(meow) {
	let meowsFromIDB = await getLocalForage("meows")
	meowsFromIDB.unshift(meow)
	await setLocalForage("meows", meowsFromIDB)
}