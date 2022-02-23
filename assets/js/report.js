function getValues() {
    let params = new URLSearchParams(window.location.search)
    if(!params.has("type")) return

    let type = params.get("type")

    if(type != "meow" && type != "comment" ) return null

    let id = params.get("id")
    if(id == null || id == undefined || id == "") return null

    return { type, id }
}
