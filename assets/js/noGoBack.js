history.pushState(null, document.title, location.href)
history.back()
history.forward()
window.onpopstate = function () {
	history.go(1)
}
