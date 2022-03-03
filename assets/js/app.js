let ptr = PullToRefresh.init({
	mainElement: "body",
	onRefresh() {
		window.location.reload()
	},
})
let deferredPrompt
let wasPromptDeferred = false
let faqButtonWasPressed = false
let selectedMeowForShowingComments = null
let max = 140
let user
let meowCount = 0
let launchDisplayType = getPWADisplayMode()
let installPWAButtonOnUserInfo = document.querySelector(".installPWAFromUser")
let elements = {
	newUser: document.querySelector(".newUserLoading"),
	bannedUser: document.querySelector(".bannedUser"),
	location: document.querySelector(".noLocationAccess"),
	wrapper: document.querySelector(".wrapper"),
	firstTimeVisit: document.querySelector(".firstTimeVisit"),
	whyLocationInfo: document.querySelector(".whyLocationInfo"),
	userInfo: document.querySelector(".userInfo"),
}
let statusElements = {
	currentFeedStatus: document.querySelector(".currentFeedStatus"),
	locationHolder: document.querySelector(".locationHolder"),
}
let geoPermissionCount = 0
let faqItems = document.querySelectorAll(".accordion button")
faqItems.forEach((item) => item.addEventListener("click", toggleAccordion))
let userItem = {}
userItem.username = document.querySelector(".username")
userItem.profilePicture = document.querySelector(".profilePicture")

let params = new URLSearchParams(window.location.search)
if (!params.has("meow")) {
	if (params.has("coffee")) {
		window.location.href = "https://buymeacoffee.com/tharunoptimus"
	}
	let data = null
	if (params.has("text") || params.has("url") || params.has("title")) {
		data = {
			title: params.get("title"),
			text: params.get("text"),
			url: params.get("url"),
		}
	}
	main(data)
} else {
	showMeow()
}

window.addEventListener("beforeinstallprompt", async (e) => {
	await beforeinstallpromptHandler(e)
})
window.addEventListener("appinstalled", () => {
	console.log("App installed! 🎉")
	hideInstallationPromotion(true)
})
window
	.matchMedia("(prefers-color-scheme: dark)")
	.addEventListener("change", (e) => {
		let newColorScheme = e.matches ? "dark" : "light"
		setAndChangeMode(newColorScheme)
	})

document
	.querySelector(".whatIsThis button")
	.addEventListener("click", async () => {
		await setLocalForage("firstTimeVisit", true)
		window.location.reload()
	})
document.querySelector(".learnMore").addEventListener("click", () => {
	showFAQ()
})
document
	.querySelector(".commentInput")
	.addEventListener("keydown", async (e) => {
		if (e.key == "ENTER" || e.keyCode == 13) {
			postingComments(max)
		}

		let letterCount = e.target.value.length
		let remaining = max - letterCount
		if (remaining < 0) {
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
	} else if (e.target.classList.contains("closeUserInfo")) {
		closeUserInfo()
	} else if (e.target.classList.contains("profilePicture")) {
		showUserInfo()
	} else if (e.target.classList.contains("deleteCache")) {
		deleteCache(e)
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
	} else if (e.target.classList.contains("buyMeACoffee")) {
		buyMeACoffee()
	} else if (e.target.classList.contains("themeInput")) {
		changeTheme(e)
	} else if(e.target.classList.contains("meowUserProfilePicture")) {
		showProximityOfMeow(e)
	} else if(e.target.classList.contains("reportThis")) {
		reportContent(e)
	} else if (e.target.classList.contains("legal")) {
		showLegal()
	}
})
document
	.querySelector(".meowInput")
	.addEventListener("input", countCharactersInTextField)
