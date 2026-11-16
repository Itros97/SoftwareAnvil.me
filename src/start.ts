import { getConfiguration, loadConfiguration } from "./lib/configuration.js"
import { Display } from "./lib/display.js"
import { loadIcons } from "./lib/icons.js"
import { setNotFoundRoute, setRoute, showRoute } from "./lib/router.js"
import ContentService from "./services/contentservice.js"
import { Theme } from "./services/theme.js"
import BlogView from "./views/blog.js"
import { Footer } from "./views/components/footer.js"
import { Navbar } from "./views/components/navbar.js"
import HomeView from "./views/home.js"
import NotFoundView from "./views/notfound.js"
import PostView from "./views/post.js"
import ProjectsView from "./views/projects.js"

/** The persistent page shell: navbar, the container where views render, footer. */
interface Layout {
	navbar: HTMLElement
	main: HTMLElement
}

let layout: Layout | undefined

window.addEventListener("hashchange", renderCurrentRoute)
window.onresize = () => Display.checkType()

window.onload = async function () {
	await loadConfiguration("gtdf.config.json")
	Theme.init()
	Display.checkType()

	const iconsPath = getConfiguration("path")["icons"]
	await Promise.all([
		loadIcons("material", `${iconsPath}/materialicons.json`),
		loadIcons("social", `${iconsPath}/socialicons.json`),
	])

	registerRoutes()
	layout = mountLayout(getConfiguration("base")["app_name"])
	renderCurrentRoute()
}

/** Register every view with its route. */
function registerRoutes(): void {
	setRoute("", HomeView.show)
	setRoute("projects", ProjectsView.show)
	setRoute("blog", BlogView.show)
	setRoute("blog/$", PostView.show)
	setNotFoundRoute(NotFoundView.show)
}

/** Build the page shell once; the footer socials fill in when the profile loads. */
function mountLayout(siteName: string): Layout {
	const navbar = Navbar.create(siteName)
	const main = document.createElement("main")
	main.classList.add("content")
	const footer = Footer.create(siteName)
	document.body.replaceChildren(navbar, main, footer)

	// Without a profile the footer keeps just the copyright line; views show their own error
	ContentService.getProfile()
		.then(profile => Footer.setSocials(footer, profile.socials))
		.catch(error => console.error(error))

	return { navbar, main }
}

/** Show the view for the current URL hash, e.g. "#/blog/my-post" -> "blog/my-post". */
function renderCurrentRoute(): void {
	if (!layout) return

	const path = window.location.hash.replace(/^#\/?/, "").replace(/\/$/, "").toLowerCase()
	Navbar.highlight(layout.navbar, path)
	showRoute(path, layout.main)
	window.scrollTo(0, 0)
}
