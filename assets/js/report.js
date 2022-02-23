let user = null
function getValues() {
    let params = new URLSearchParams(window.location.search)
    if(!params.has("type")) return

    let type = params.get("type")

    if(type != "meow" && type != "comment" ) return null

    let id = params.get("id")
    if(id == null || id == undefined || id == "") return null

    return { type, id }
}

async function main() {
    let values = getValues()
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

async function reportContent () {
    let values = getValues()
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
document.querySelector(".reportButton").addEventListener("click", reportContent)