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
    
    NProgress.start()
    e.target.classList.add("disabledReportButton")

    let values = await getValues()
    if(values == null) return
    let text = document.querySelector(".textbox").value.trim()

    values.text = text
    values.consernedId = user._id

    NProgress.set(0.5)

    try {
        let response = await submitReport(values)
        
        if(response == null) {
            throw new Error("Something went wrong")
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.querySelector(".wrapper").remove()
                document.querySelector(".reportSuccessful").style.display = "flex"
            })
        })

        NProgress.done()
        
        await deleteContentToReport()
        setTimeout(() => window.close(), 2000)

    } catch (err) {
        NProgress.done()
        e.target.classList.remove("disabledReportButton")
        document.querySelector(".errorMessage").innerText = "Could not report content. Try again later"
        console.log(err)
    }
}

main()
document.querySelector(".buttonToReport").addEventListener("click", e => reportContent(e))