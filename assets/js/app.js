let user
let meowCount = 0
let elements = {
    newUser : document.querySelector(".newUserLoading"),
    postsLoading : document.querySelector(".postsLoading"),
    location : document.querySelector(".noLocationAccess"),
    wrapper: document.querySelector(".wrapper")
}

document.querySelector(".givePermissionButton").addEventListener("click" , () => {
    navigator.geolocation.getCurrentPosition(() => {
        window.location.reload()
    })
})
let userItem = {}
userItem.username = document.querySelector(".username")
userItem.profilePicture = document.querySelector(".profilePicture")

async function main () {
    let userFromStorage = await getLocalForage("user")

    if (userFromStorage == null ) {
        
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

    userItem.username.textContent = user.name
    userItem.profilePicture.src = user.profilePic

    let locationPermission = await checkLocationPermission()

    if(!locationPermission) {
        setDisplayNone(elements)
        elements.location.style.display = "flex"
        return
    } else {

        
        setDisplayNone(elements)
        elements.postsLoading.style.display = "flex"
        
        let position = await getCurrentPosition();

        let coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        let placeInfo = await getPlaceInfo(coords)

        let locationTextSpan = document.querySelector(".locationText")
        
        let localityString = `${placeInfo.locality}, ${placeInfo.city}, ${placeInfo.principalSubdivision}`
        locationTextSpan.textContent = localityString
        locationTextSpan.dataset.accuracy = position.coords.accuracy
        

        let meows = await getPosts(position.coords)
        meowCount = meows.length

        let html = meowCount != 0 ? generateMeows(meows) : generateNoMeows()
        document.querySelector(".meowsContainer").innerHTML = html


        setTimeout(() => {
            elements.postsLoading.style.display = "none"
            elements.wrapper.style.display = "flex"
        }, 1000)

    }

    return user
}

main()

document.addEventListener("click" , e => {
    if(e.target.classList.contains("likeButton")) {
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
    }
})

document.querySelector(".meowInput").addEventListener("input" , countCharactersInTextField)


function handleCreateButtonClick() {
    let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
    newMeowModalContainer.style.display = "block"
}

function handleCloseNewMeowModal() {
    let newMeowModalContainer = document.querySelector(".newMeowModalContainer")
    newMeowModalContainer.style.display = "none"
}

async function createMeow() {
    
    let textField = document.querySelector(".meowInput")
    let text = textField.value

    let { coords } = await getCurrentPosition()

    let meow = await newMeow(text, coords)

    let html = generateMeows([meow])
    let existingStuff = document.querySelector(".meowsContainer").innerHTML

    if(meowCount == 0) {
        document.querySelector(".meowsContainer").innerHTML = html
    } else {
        document.querySelector(".meowsContainer").innerHTML = html + existingStuff
    }

    handleCloseNewMeowModal()
}