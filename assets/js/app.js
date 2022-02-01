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
    }

    return user
}

main()

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