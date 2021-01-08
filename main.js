let W = c.width, H = c.height

let paused = true // is game paused
let tps = 60 // tick per second
function normal(x) { return x / realTPS; }

// adds a put(v) method to array so its empty spaces can be used
function putifyArray(a) {
    a.emptyIndex = []
    a.put = (v) => {
        let i = a.emptyIndex[0] instanceof Number ? a.emptyIndex.shift() : a.length
        a[i] = v
        return i;
    }
}

// search 2d space like this: colideMap.search(colider(item)).filter(o => o.isMyObject && o !== item)
let colideMap = new RBush() // RTree
let coliderCellSize = 100
function colider({ x, y, w, h }) {
    return {
        // minX: Math.floor(x / coliderCellSize),
        // minY: Math.floor(y / coliderCellSize),
        // maxX: Math.ceil((x + w) / coliderCellSize),
        // maxY: Math.ceil((y + h) / coliderCellSize)
        minX: x,
        minY: y,
        maxX: (x + w),
        maxY: (y + h)
    };
}
function search(item, filter) {
    if(!item) return;
    // let raw = colideMap.search(colider(item))
    let raw = colideMap.search(colider(item))
    if(!raw) return;
    if(filter) {
        return raw.filter(o => filter(o) && o !== item)
    } else {
        return raw.filter(o => o !== item)
    }
}
// call after each position change
function updateColider(item) {
    if(!item) return;
    let c = item._colider
    let nc = colider(item)
    if(
        c.minX !== nc.minX ||
        c.minY !== nc.minY ||
        c.maxX !== nc.maxX ||
        c.maxY !== nc.maxY
    ) {
        item._colider = nc
        colideMap.remove(item)
        colideMap.insert(item)
    }
}
// add a colider to colideMap
function addColider(item) {
    if(!item) return;
    if(!item._colider) {
        item._colider = colider(item)
    }
    colideMap.insert(item)
}
// remove a colider from colideMap
function delColider(item) {
    if(item._colider) {
        colideMap.remove(item)
        delete item._colider
    }
}

// a: string, b: string => [{a: object, b: object}, ...]
// a: object, b: string => [b: object, ...]
// a: object, b: object => true|false
function colides(a, b) {
    if(typeof a === "string" && typeof b === "string") {
        // TODO returns (a,b) (b,a) duplicates. bug or feature ?
        return world.flat().filter(o => o && o._colider && o.type === a).map(o => ({
            obj: o,
            colidesWith: search(o, c => c.type === b)
        })).filter(c => c.colidesWith.length)
    } else if(typeof a === "object" && typeof b === "string") {
        return search(a, c => c.type === b)
    } else {
        return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    }
}

let worldW = W
let worldH = H
const PEarly = 0, PDefault = 1, PLate = 2, PCleanup = 3
let world = [[], [], [], []] // priority queue [early, default, late, cleanup]
for(let queue of world) {
    putifyArray(queue)
}
// add object to world
function add(o, priority = 1) {
    o.id = world[priority].put(o)
    o.priority = priority
}
// get an object by its id
function get(id, priority = 1) {
    return world[priority][id]
}
// delete an object by refrence
function del(o) {
    if(o) {
        if(o._colider) {
            delColider(o)
        }
        let id = o.id
        let priority = o.priority
        if(typeof id === 'number' && typeof priority === 'number') {
            world[o.priority][o.id] = null
            delete o.id
            delete o.priority
        }
    }
}
// run a function once on this or next tick
function once(f, priority = 1) {
    add({
        tick() {
            f()
            del(this)
        }
    }, priority)
}

function move(o, dx, dy) {
    o.px = o.x
    o.py = o.y
    o.x += dx
    o.y += dy
    if(o._colider) {
        updateColider(o)
    }
}
function moveTo(o, x, y) {
    o.px = o.x
    o.py = o.y
    o.x = x
    o.y = y
    if(o._colider) {
        updateColider(o)
    }
}

let lastTick = Date.now() - 1000/tps
let realTPS = tps
let lastTPSDrop = 0
function tick() {
    realTPS = Math.floor(1000/(Date.now() - lastTick))
    lastTick = Date.now()
    if(realTPS < 0.75 * tps) {
        lastTPSDrop = realTPS
    }
    
    for(let queue of world) {
        for(let o of queue) {
            if(o) {
                if(o.tick instanceof Function) {
                    o.tick()
                }
            }
        }
    }

    if(!paused) {
        setTimeout(tick, 1000/tps)
    }
}

let sumTPS = 0
let countSumTPS = 0
let avgTPS = tps
let showTPS = true
function render() {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, W, H)
    if(showTPS) {
        if(countSumTPS === 30) {
            avgTPS = Math.floor(sumTPS / countSumTPS)
            sumTPS = 0
            countSumTPS = 0
        }
        sumTPS += realTPS
        countSumTPS += 1
    
        ctx.fillStyle = "black"
        ctx.fillText("tps  : " + avgTPS, 10, 15)
        ctx.fillText("drop : " + lastTPSDrop, 10, 25)
    }

    let zsorted = world.flat()
        .filter(o => o && o.draw instanceof Function)
        .sort((a, b) => (a.zindex || 0) - (b.zindex || 0))

    for(let o of zsorted) {
        if(true) { // TODO x,y in camera
            o.draw(ctx)
        }
    }

    requestAnimationFrame(render)
}

function setPause(to) {
    paused = to
    if(!paused) {
        lastTick = Date.now() - 1000/tps
        realTPS = tps
        lastTPSDrop = 0.75 * tps
        tick()
    }
}

function main() {
    paused = false
    tick()
    render()
    game()
}

let keysDown = new Set()
let keysWentDown = new Set()
let keysWentUp = new Set()
window.addEventListener("keydown", e => {
    if(!paused && !keysDown.has(e.key)) {
        keysWentDown.add(e.key)
        once(() => keysWentDown.delete(e.key), PCleanup)
    }
    keysDown.add(e.key)
})
window.addEventListener("keyup", e => {
    keysDown.delete(e.key)
    if(!paused) {
        keysWentUp.add(e.key)
        once(() => keysWentUp.delete(e.key), PCleanup)
    }
})
window.addEventListener("mousedown", e => {
    if(!paused && !keysDown.has(`mouse${e.button}`)) {
        keysWentDown.add(`mouse${e.button}`)
        once(() => keysWentDown.delete(`mouse${e.button}`), PCleanup)
    }
    keysDown.add(`mouse${e.button}`)
})
window.addEventListener("mouseup",  e => {
    keysDown.delete(`mouse${e.button}`)
    if(!paused) {
        keysWentUp.add(`mouse${e.button}`)
        once(() => keysWentUp.delete(`mouse${e.button}`), PCleanup)
    }
})

let mouseX = 0
let mouseY = 0
window.addEventListener("mousemove", e => {
    let bcr = c.getBoundingClientRect()
    mouseX = (e.clientX - bcr.left) / (bcr.width) * W
    mouseY = (e.clientY - bcr.top) / (bcr.height) * H
})
function isKeyDown(key) {
    return keysDown.has(key)
}
function didKeyWentDown(key) {
    return keysWentDown.has(key)
}
function isKeyUp(key) {
    return !isKeyDown(key)
}
function didKeyWentUp(key) {
    return keysWentUp.has(key)
}

// function game() {
//     function mk(x, y, zindex, color = "black", type = "rect", coll = false) {
//         let o = {
//             x, y, w: 50, h: 50, zindex, type, color,
//             tick() {
//                 move(this, normal(10), normal(3))
//             },
//             draw(ctx) {
//                 ctx.fillStyle = color
//                 ctx.fillRect(this.x, this.y, this.w, this.h)
//             }
//         }
//         if(coll) {
//             addColider(o)
//         }
//         return o
//     }

//     add(wwa = mk(50, 10, 0, "black", "rect", true))
//     add(wwb = mk(70, 30, 9, "red", "rect", true))
//     add(wwc = mk(90, 50, 10, "green", "obj", true))
//     add(wwd = mk(110, 70, 11, "purple", "rect", true))
//     for(let c of colides("rect", "rect")) {
//         let o = c.obj
//         let cw = c.colidesWith
//         let msg = o.color + " colides with [ "
//         for(let cwo of cw) {
//             msg += cwo.color + " "
//         }
//         msg += "]"
//         console.log(msg)
//     }
// }

