let user = null
async function getValues() {
    let data = await getLocalForage("contentToReport")
    if(data == null) return null
    return data
}

async function deleteContentToReport () {
    await setLocalForage("contentToReport", null)
    return true
}

async function main() {
    let values = await getValues()
    user = await getLocalForage("user")
    if(user == null) return
    if(values == null) return

    let content = null

    if(values.type == "meow") {
        try {
            content = await getSingleMeow(values.id)
        } catch (err) {
            console.log(err)
            return
        }
    } else if(values.type == "comment") {
        try {
            content = await getSingleComment(values.id)
        } catch (err) {
            console.log(err)
            return
        }
    }

    if(content == null) return

    let html = values.type == "meow" ? generateMeows([content]) : generateComments([content])
    document.querySelector(".contentContainer").innerHTML = html

}

async function reportContent (e) {
    
    let values = await getValues()
    if(values == null) return
    let text = document.querySelector(".textbox").value.trim()

    values.text = text
    values.consernedId = user._id

    try {
        let response = await submitReport(values)
        if(response == null) {
            alert("Something went wrong. Please try again.")
            return
        }
        alert("Report submitted. Thank you!")
        window.close()
    } catch (err) {
        console.log(err)
    }
}

main()
document.querySelector(".buttonToReport").addEventListener("click", e => reportContent(e))