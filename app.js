let allowGeoRecall = true;
let countLocationAttempts = 0;

function getLocation() {   
    console.log('getLocation was called') 
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, 
        positionError);
    } else {
        hideLoadingDiv()
        console.log('Geolocation is not supported by this device')
    }
}

function positionError() {    
    console.log('Geolocation is not enabled. Please enable to use this feature')
        
     if(allowGeoRecall && countLocationAttempts < 5) {
         countLocationAttempts += 1;
         getLocation();
     }
 }

function showPosition(){
    console.log('posititon accepted')
    allowGeoRecall = false;
}

function checkGeoPermission() {
    if(!navigator.permissions) {
        console.log("doesn't have gps")
        return;
    }
    navigator.permissions.query({name: 'geolocation'}).then(function(result) {
        if(result.state == 'prompt') {
            console.log(result)
            navigator.permissions.request({name: 'geolocation'}).then(function(result) {
                if(result.state == 'granted') {
                    console.log('geolocation permission granted')
                    getLocation();
                } else {
                    console.log('geolocation permission denied')
                }
            })
        }
    });
}