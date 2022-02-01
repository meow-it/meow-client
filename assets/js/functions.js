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
}