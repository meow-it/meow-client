let user
let userItem = {}
userItem.username = document.querySelector(".username")
userItem.profilePicture = document.querySelector(".profilePicture")

async function main () {
    let userFromStorage = await getLocalForage("user")

    if (userFromStorage == null ) {
        
        requestAnimationFrame(() => {
            document.querySelector(".newUserLoading").style.display = "flex"
        })

        user = await register()

        setTimeout(() => {
            document.querySelector(".newUserLoading").style.display = "none"
        }, 3000)

    } else {
        user = userFromStorage
    }

    userItem.username.textContent = user.name
    userItem.profilePicture.src = user.profilePic

    return user
}

main()