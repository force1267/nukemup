function simpleDraw(o, color = "black") {
    return ctx => {
        let { x, y, w, h } = o
        ctx.fillStyle = color
        ctx.fillRect(x, y, w, h)
    }
}

let player = {
    x: 300,
    y: 225,
    w: 10,
    h: 18,
    tick() {
        // let dx = 0
        // if(isKeyDown("d")) {
        //     dx += normal(300)
        // }
        // // if(isKeyDown("a")) {
        // if(isKeyDown("a")) {
        //     dx -= normal(300)
        // }
        // move(this, dx, 0)
        moveTo(this, mouseX, mouseY)
        // if(didKeyWentDown("mouse0")) {
        if(isKeyDown("mouse0")) {
            shoot(this.x + this.w / 2, this.y - 5)
        }
    }
}
player.draw = simpleDraw(player, "purple")

let shootDelay = 100
let lastShoot = Date.now()
function shoot(x, y) {
    if(shootDelay > Date.now() - lastShoot) {
        return
    }
    lastShoot = Date.now()

    let times = Math.random() * 15
    for(let i = 0; i < times; i ++) {
        let dir = Math.random() - 0.5
        let speedY = normal(-500 * Math.random() -200)
        let speedX = normal(250 * dir)
        let w = 5, h = 5
        let bullet = { x, y, w, h, type: "bullet" }
        bullet.tick = () => {
            if(x < -w || x > W || y < -h || y > H) {
                del(bullet)
            }
            move(bullet, speedX, speedY)
        }
        bullet.draw = simpleDraw(bullet, "red"),
        addColider(bullet)
        add(bullet)
    }
}

function rain() {
    let dir = Math.random() - 0.5
    let w = 15, h = 15
    let x = Math.random() * (W - 100) + 50
    let y = -w + 1
    let astr = {
        x, y, w, h, type: "astroid"
    }
    let speedY = normal(Math.random() * 200 + 300)
    let speedX = normal(250 * dir)
    astr.tick = () => {
        if(x < -w || x > W || y < -h || y > H) {
            del(astr)
        }
        move(astr, speedX, speedY)
    }
    astr.draw = simpleDraw(astr, "black"),
    addColider(astr)
    add(astr)
}

let start = Date.now()
let baseWait = 1000
function letItRain() {
    let time = Date.now() - start
    newBaseWait =  ((0.15 * 60 * 1000) - time) / 300
    if(newBaseWait > 10) {
        baseWait = newBaseWait
    }
    setTimeout(rain, Math.random() * 100)
    setTimeout(rain, Math.random() * 300)
    setTimeout(rain, Math.random() * 500)
    setTimeout(rain, Math.random() * 800)
    setTimeout(rain, Math.random() * 1000)
    setTimeout(letItRain, baseWait + Math.random() * baseWait * 0.3)
}

function boom(x, y) {
    let times = Math.random() * 15 + 15
    for(let i = 0; i < times; i ++) {
        let w = Math.random() > 0.5 ? 1 : 2;
        let h = Math.random() > 0.5 ? 1 : 2;
        let particle = { x, y, w, h }
        let dx = normal((Math.random() - 0.5) * 800)
        let dy = normal((Math.random() - 0.5) * 800)
        let live = 400 + Math.random() * 300
        let birth = Date.now()
        particle.tick = () => {
            move(particle, dx *= 0.9, dy *= 0.9)
            if(Date.now() - birth > live) {
                del(particle)
            }
        }
        let colorChance = Math.random()
        let color = colorChance > 0.5 ? "black" : colorChance > 0.1 ? "red" : "green"
        particle.draw = simpleDraw(particle, color)
        add(particle)
    }
}

let colChecker = {
    tick() {
        let cols = colides("bullet", "astroid")
        for(let col of cols) {
            let bullet = col.obj
            del(bullet)
            let astroids = col.colidesWith
            for(let astr of astroids) {
                del(astr)
                // boom(astr.x, astr.y)
            }
        }
    }
}

// let mouse = {
    //     draw(ctx) {
//         ctx.fillStyle = "red"
//         ctx.fillRect(mouseX - 3, mouseY - 3, 6, 6)
//     }
// }
// add(mouse)

function game() {
    add(player)
    addColider(player)
    add(colChecker)
    letItRain()
}
