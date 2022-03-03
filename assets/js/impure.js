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

function renderFirstVisit() {
	setDisplayNone(elements)
	elements.firstTimeVisit.style.display = "flex"
}

function setDisplayMode(mode) {
    
    let changes = returnCSSVariablesToChange()
    
    if (mode == "dark") {
        changes.forEach(element => {
            document.documentElement.style.setProperty(`--${element.variable}`, element.dark)
        })
    } else {
        changes.forEach(element => {
            document.documentElement.style.setProperty(`--${element.variable}`, element.white)
        })
    }

    document.querySelector("meta[name=theme-color]").setAttribute("content", mode == "dark" ? "#000000" : "#ffffff")
    
}

function setAndChangeMode(mode) {
    localStorage.setItem("darkMode", mode)
    let themeInput = document.querySelector(".themeInput")
    mode == "dark" ? themeInput.setAttribute("checked", "checked") : themeInput.removeAttribute("checked")
    setDisplayMode(mode)
}

function changeTheme(e) {
    e.target.hasAttribute("checked") ? setAndChangeMode("light") : setAndChangeMode("dark")
}

async function main(data) {

	try {

        NProgress.start()

        // display mode preferences and rendering
        let darkMode = localStorage.getItem("darkMode")
        if (darkMode == null) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setAndChangeMode("dark")
            } else {
                setAndChangeMode("light")
            }
        } else {
            if(darkMode == "dark") {
                setAndChangeMode("dark")
            } else if(darkMode == "light") setAndChangeMode("light")
        }
		
	
		let firstTimeVisit = await getLocalForage("firstTimeVisit")
	
		if (firstTimeVisit == null) {
			renderFirstVisit()
			NProgress.done()
			return
		}
	
		let userFromStorage = await getLocalForage("user")
	
		let isBanned = await getLocalForage("banned")
		if(isBanned == true) {
			setDisplayNone(elements)
			elements.bannedUser.style.display = "flex"
			NProgress.done()

			await localforage.removeItem("user")
			await localforage.removeItem("banned")

			return
		}
		
		if (userFromStorage == null || userFromStorage.status == false) {
			requestAnimationFrame(() => {
				elements.newUser.style.display = "flex"
			})
			
			
			user = await register()

			if(user.status !== undefined && user.status == "banned") {
				await setLocalForage("banned", true)
				NProgress.done()
				window.location.reload()
			}
	
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

		requestAnimationFrame(() => {
			let commentingUserProfilePicture = document.querySelector(".commentingUserProfilePicture")
			commentingUserProfilePicture.src = user.profilePic
			commentingUserProfilePicture.alt = user.name
		})
	
		if (!locationPermission) {
			setDisplayNone(elements)
			elements.location.style.display = "flex"
			NProgress.done()
			return
		} else {
			setDisplayNone(elements)

			let text = getSavedTextData()
			
			if(data != null) {
				let value = ""
				if(data.text != null) value = data.text
				else if(data.title != null) value = data.title
				else if(data.url != null) value = data.url
				text = value

				window.history.pushState({}, document.title, window.location.pathname)
				requestAnimationFrame(() => {
					handleCreateButtonClick()
				})
			}

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
				time: isUpdated ? position.time : new Date().getTime() 
			})
	
			let coords = {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			}
			
			updatePlaceInfo(coords, position.coords.accuracy, false, isUpdated)
			NProgress.set(0.7)
	
			let meows = await getPosts(coords)
			if (meows == null) {
                
                let syncedTime = await getLocalForage("lastSynced")
				syncedTime =
					syncedTime != null
						? `<br> Displaying refreshed content: ${timeDifference(new Date().getTime(),syncedTime)} ago.`
						: ""
				
                showStatus(`You're Offline! 😢 ${syncedTime}`)
				NProgress.done()
				return
			} else if(meows.length == 0) {
				meowCount = 0
			}
			await setLocalForage("meows", meows)
            await setLocalForage("lastSynced", new Date().getTime())
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
			meowCount = meows.length
		}
		
		requestAnimationFrame(() => {
			requestAnimationFrame(async () => {
				if(launchDisplayType == "twa" || launchDisplayType == "standalone") {
					installPWAButtonOnUserInfo.style.display = "none"
				}

				if(wasPromptDeferred == true) {
					if(!doesElementWithClassNameExists("installationPromotionCard")) {
						showInstallPromotion()
					}
				}

				if(isUpdated) {

					let position = await getLocalForage("position")
					let string = timeDifference(new Date().getTime(), position.time)

					showStatus(`Using your last known location for refreshing the feed 🎉 
								<br> Last updated: ${string} ago 📆
								<br> Turn on GPS to get the meows for your current location 📍
							`)
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

async function updatePlaceInfo(coords, accuracy, individual = false, isUpdated = false) {

	let element = individual ? ".meowLocationText" : ".locationText"

	if(isUpdated) {
		let lastKnowPositionString = await getLocalForage("placeInfo")
		let locationTextSpan = document.querySelector(element)
		individual ? "" : locationTextSpan.dataset.accuracy = accuracy
		locationTextSpan.textContent = lastKnowPositionString
		return
	}

	let placeInfo = await getPlaceInfo(coords)
	if (placeInfo == null) return
	let localityString = getLocationString(placeInfo)


	let locationTextSpan = document.querySelector(element)
	locationTextSpan.textContent = localityString
	individual ? "" : locationTextSpan.dataset.accuracy = accuracy
	individual ? "" : await setLocalForage("placeInfo", localityString)
}

function hideStatus() {
	statusElements.currentFeedStatus.style.top = "-50rem"
	statusElements.locationHolder.style.marginTop = "0px"
}

function showStatus(message) {
	hideStatus()
	let isWrapperVisible = getComputedStyle(elements.wrapper).display == "flex" 
	if(!isWrapperVisible) return
	requestAnimationFrame(() => { 
		requestAnimationFrame(() => { 
			statusElements.currentFeedStatus.innerHTML = message
			statusElements.currentFeedStatus.style.top = "4.1875rem"
			let feedHeight = getComputedStyle(statusElements.currentFeedStatus).height
			statusElements.locationHolder.style.marginTop = feedHeight
	 	}) 
	})
	
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

function buyMeACoffee() {
	let url = "https://www.buymeacoffee.com/tharunoptimus"
	window.open(url, "_blank")
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

async function logoutUser (dbCheck = true) {
	if(dbCheck) { if(await deleteUser() != true) return }
	await localforage.clear()
	window.location.href = "./"
}

function hideInstallationPromotion (needToRemoveFromOptions = false) {
	try {
		let installationPromotionCard = document.querySelector(".installationPromotionCard")
		installationPromotionCard.style.display = "none"
	} catch (err) {
		console.log(`Couldn't find any div with class .installationPromotionCard 😢: ${err}`)
	}

    if(needToRemoveFromOptions) {
        // delete the button from user option
        try {
            document.querySelector(".installPWAFromUser").remove()
        } catch (err) {
            console.log(`Couldn't find any button with class .installPWAFromUser 😢: ${err}`)
        }
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
			if(meow.status !== undefined && meow.status === false) await logoutUser(false)
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
	let replaceWithNewComment = doesChildExists(commentsContainer, ".loadingComments")
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
		commentsContainer.innerHTML = replaceWithNewComment ? html : html + commentsContainer.innerHTML
		addedToBG = true
		inputTextBox.value = ""
		postingCommentSpinner.style.display = "none"
		incrementCommentCount(meowId)

	}

	let comment = await createNewComment({text, userId, meowId})
	NProgress.set(0.7)
	if(comment != null) {

		if(comment.status !== undefined && comment.status === false) await logoutUser(false)

		let html = generateComments([comment])
		
		addedToBG ? commentsContainer.removeChild(commentsContainer.firstChild) : null

		commentsContainer.innerHTML = replaceWithNewComment ? html : html + commentsContainer.innerHTML
		
		if(BG_IS_AVAILABLE && addedToBG) {
			let commentsFromIDB = await getLocalForage("commentQueue")
			if(commentsFromIDB != null) {
				commentsFromIDB.pop()
				await setLocalForage("commentQueue", commentsFromIDB)
			}
		} else {
			inputTextBox.value = ""
		}

		if(!addedToBG) incrementCommentCount(meowId)

	}
	NProgress.done()
	
	postingCommentSpinner.style.display = "none"

}

async function incrementCommentCount(meowId) {
	let spans = document.querySelectorAll(`[data-id="${meowId}"] .commentCount`)
	let commentCount = parseInt(spans[0].innerHTML)
	commentCount++
	spans.forEach(span => span.innerHTML = commentCount)
	
	let meows = await getLocalForage("meows")
	meows.forEach((element) => {
		if (element._id == meowId) {
			let random = Math.floor(Math.random() * (10 - 1 + 1)) + 1
			element.comments.push(random)
			return
		}
	})
	await setLocalForage("meows", meows)
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

function returnCSSVariablesToChange() {
    return [
		{
			variable: "bodyBackground",
			white: "#FFFFFF",
			dark: "#000000"
		},
		{
			variable: "boxShadowColor",
			white: "#44444444",
			dark: "#b0b0b01f"
		},
		{
			variable: "backgroundWhite",
			white: "#FFFFFF",
			dark: "#000000"
		},
		{
			variable: "textColor",
			white: "#000000",
			dark: "#d9d9d9"
		},
		{
			variable: "darkPurpleForTime",
			white: "#6f08ff",
			dark: "#b17aff"
		},
		{
			variable: "thumbBackgroundColor",
			white: "#5f636857",
			dark: "#ffffff80"
		},
        {
            variable: "postShadowColor",
            white: "#00000000",
            dark: "#333333"
        }
		
	]
}

async function showProximityOfMeow(e) {
	
	let status = e.target.dataset.status
	let element = e.target.parentElement.querySelector(".meowUsername")
	if(status == "username") {
		// It is showing the username, so show distance
		let id = e.target.dataset.id
		if(id == null) return
	
		let distance = await findNearbyData(id)
		if(distance == null) return
		distance = distance.toFixed(2)

		e.target.dataset.status = "distance"
		e.target.title = "Click to show User Name"

		element.textContent = distance > 0.01 ? `${distance} km away` : "Nearby"
	} else if(status == "distance") {
		// It is showing the distance, so show username
		let id = e.target.dataset.id
		if(id == null) return

		let meow = await getMeowFromIDB(id)
		if(meow == null) return

		e.target.dataset.status = "username"
		e.target.title = "Click to show distance"
		element.textContent = meow.name
	}
	
}

async function reportContent (e) {
	let data = {
		id : e.target.dataset.id,
		type : e.target.dataset.type
	}
	await setLocalForage("contentToReport", data)
	let url = `${window.location.origin}/report`
	window.open(url, "_blank")
}

function showLegal() {
	window.open("https://meowit-legal.netlify.app/", "_blank")
}