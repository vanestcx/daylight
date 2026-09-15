const canvas = document.getElementById("stars")
const ctx = canvas.getContext("2d")
const sunset = document.getElementById("sunset")
const transition = document.getElementById("transition")
const truthButton = document.getElementById("truthButton")
const lyviaShadow = document.getElementById("lyviaShadow")
const revealPrompt = document.querySelector(".reveal-prompt")
const artFrame = document.getElementById("artFrame")

let width = 0
let height = 0
let dpr = Math.min(window.devicePixelRatio || 1, 2)
let stars = []
let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0
let time = 0
let scrollProgress = 0
let truthMode = false
let switching = false
let shadowArmed = false

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

if (lyviaShadow) {
    lyviaShadow.addEventListener("error", () => {
        lyviaShadow.style.display = "none"
    })
}

function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    createStars()
}

function createStars() {
    const density = Math.max(
        90,
        Math.min(220, Math.floor((width * height) / 7600))
    )

    stars = Array.from({ length: density }, () => {
        const depth = Math.random()

        return {
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.25 + depth * 1.45,
            alpha: 0.12 + Math.random() * 0.62,
            depth: 0.18 + depth * 0.95,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.003 + 0.001,
            drift: (Math.random() - 0.5) * 0.015
        }
    })
}

function drawStars() {
    ctx.clearRect(0, 0, width, height)

    mouseX += (targetMouseX - mouseX) * 0.075
    mouseY += (targetMouseY - mouseY) * 0.075

    time += 1

    const daylightVisibility = 0.25 + scrollProgress * 0.75
    const visibility = truthMode ? 1 : daylightVisibility

    for (const star of stars) {
        if (!reducedMotion) {
            star.x += star.drift * star.depth
        }

        if (star.x > width + 10) {
            star.x = -10
        }

        if (star.x < -10) {
            star.x = width + 10
        }

        const driftX = reducedMotion
            ? 0
            : mouseX * star.depth * 72

        const driftY = reducedMotion
            ? 0
            : mouseY * star.depth * 48

        const twinkle = reducedMotion
            ? 1
            : 0.76 + Math.sin(time * star.speed + star.phase) * 0.24

        let x = star.x + driftX
        let y = star.y + driftY

        if (x < -15) x += width + 30
        if (x > width + 15) x -= width + 30
        if (y < -15) y += height + 30
        if (y > height + 15) y -= height + 30

        const alpha = star.alpha * twinkle * visibility

        const warm = truthMode
            ? 0
            : Math.max(0, 1 - scrollProgress * 1.35)

        const r = truthMode
            ? 205
            : Math.round(198 + warm * 28)

        const g = truthMode
            ? 205
            : Math.round(216 + warm * 7)

        const b = truthMode
            ? 217
            : Math.round(232 - warm * 22)

        if (star.depth > 0.78) {
            ctx.beginPath()
            ctx.arc(
                x,
                y,
                star.size * 3.6,
                0,
                Math.PI * 2
            )

            ctx.fillStyle =
                `rgba(${r}, ${g}, ${b}, ${alpha * 0.035})`

            ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(
            x,
            y,
            star.size,
            0,
            Math.PI * 2
        )

        ctx.fillStyle =
            `rgba(${r}, ${g}, ${b}, ${alpha})`

        ctx.fill()
    }

    requestAnimationFrame(drawStars)
}

function updatePointer(event) {
    if (reducedMotion) return

    targetMouseX =
        event.clientX / window.innerWidth - 0.5

    targetMouseY =
        event.clientY / window.innerHeight - 0.5
}

function resetPointer() {
    targetMouseX = 0
    targetMouseY = 0
}

function updateScrollAtmosphere() {
    const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight -
        window.innerHeight
    )

    scrollProgress = Math.min(
        1,
        Math.max(
            0,
            window.scrollY / maxScroll
        )
    )

    if (truthMode) {
        sunset.style.opacity = "0"
        return
    }

    const fade =
        Math.max(
            0,
            1 - scrollProgress * 1.45
        )

    const softened =
        Math.pow(fade, 0.82)

    sunset.style.opacity =
        String(softened)
}

const observer =
    new IntersectionObserver(
        entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible")
                    observer.unobserve(entry.target)
                }
            }
        },
        {
            threshold: 0.1,
            rootMargin: "0px 0px -7% 0px"
        }
    )

document
    .querySelectorAll(".reveal")
    .forEach(element => {
        observer.observe(element)
    })

const artTruthObserver =
    new IntersectionObserver(
        entries => {
            for (const entry of entries) {
                if (
                    entry.isIntersecting &&
                    truthMode &&
                    shadowArmed &&
                    !artFrame.classList.contains("shadow-reveal")
                ) {
                    artFrame.classList.add("shadow-reveal")
                }
            }
        },
        {
            threshold: 0.14,
            rootMargin: "0px 0px 8% 0px"
        }
    )

artTruthObserver.observe(artFrame)

async function switchReality() {
    if (switching) return

    switching = true
    shadowArmed = false

    document.body.classList.add("locked")
    transition.classList.add("active")

    await wait(
        reducedMotion
            ? 20
            : 700
    )

    truthMode = !truthMode

    artFrame.classList.remove("shadow-reveal")

    if (truthMode) {
        document.body.classList.add("truth-revealed")
        truthButton.querySelector("span").textContent =
            "BACK TO DAYLIGHT"
        revealPrompt.textContent =
            "Some things look different once you know."
    } else {
        document.body.classList.remove("truth-revealed")
        truthButton.querySelector("span").textContent =
            "REVEAL THE TRUTH"
        revealPrompt.textContent =
            "There are things daylight makes easier to believe."
    }

    window.scrollTo(0, 0)

    updateScrollAtmosphere()

    await wait(
        reducedMotion
            ? 20
            : 320
    )

    transition.classList.remove("active")
    document.body.classList.remove("locked")

    await wait(
        reducedMotion
            ? 20
            : 350
    )

    shadowArmed = truthMode
    switching = false
}

function wait(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    )
}

window.addEventListener(
    "resize",
    resizeCanvas
)

window.addEventListener(
    "mousemove",
    updatePointer
)

window.addEventListener(
    "mouseleave",
    resetPointer
)

window.addEventListener(
    "scroll",
    updateScrollAtmosphere,
    {
        passive: true
    }
)

truthButton.addEventListener(
    "click",
    switchReality
)

resizeCanvas()
updateScrollAtmosphere()
drawStars()