let updatePositionAction = () => { };
let position;
let myId;
let direction;

const playerPositions = new Map();
let halfWidth;
let halfHeight;
let img;
let tilingAnchor;
const pellets = [];
let bullets = [];
function preload() {
    img = loadImage('Continuo_tile.png');
    window.SublimJs.onSublimReady(() => {
        window.SublimJs.services.roomService.wsService.registerService('Client', (data) => {
            if (data.action == "Identify") {
                myId = data.content;
            }
        });
        window.SublimJs.services.roomService.wsService.registerService('World', (data) => {
            if (data.action == "Pellet") {
                const [x, y] = data.content.split('_');
                console.log("got pellet " + data.content);
                pellets.push(createVector(x, y));
            }
            if (data.action == "State") {
                const worldState = JSON.parse(data.content);
                worldState.pellets.forEach(({ x, y }) => {
                    console.log("got pellet from world state");
                    pellets.push(createVector(x, y));
                });
                for (const [clientId, clientData] of Object.entries(worldState.clients)) {
                    if (clientId == myId) {
                        continue;
                    }
                    console.log("got player from world state");
                    const [x, y] = clientData.position.split('_');
                    playerPositions.set(clientId, createVector(x, y));
                }
            }
        });
        window.SublimJs.services.roomService.wsService.registerService('All', (data) => {
            if (data.action == "Leave") {
                playerPositions.delete(data.content);
            }
            if (data.action == "Join" && data.content != myId) {
                playerPositions.set(data.content, createVector(0, 0));
            }
        });
        window.SublimJs.joinRoom('Fascino');
        updatePositionAction = window.SublimJs.services.joyService.makeAction('Position');
        const shootAction = window.SublimJs.services.joyService.makeAction('Shoot');
        setInterval(() => {
            shootAction('1_0');
        }, 1000);
        window.SublimJs.services.joyService.registerCustomAction('Position', (data) => {
            const [x, y, clientId] = data.split('_');
            if (clientId != myId) {
                if (!playerPositions.has(clientId)) {
                    playerPositions.set(clientId, createVector(0, 0));
                }
                const pos = playerPositions.get(clientId);
                pos.x = x;
                pos.y = y;
            }
        });
        window.SublimJs.services.joyService.registerCustomAction('Bullets', (data) => {
            const bulletPositions = data.split('/');
            bullets = bulletPositions.map((bulletPosition) => {
                const [x, y] = bulletPosition.split('_');
                return createVector(x, y);
            });
        });
    });
}

function setup() {
    createCanvas(800, 600);
    halfWidth = width / 2;
    halfHeight = height / 2;
    direction = createVector(0, 0);
    position = createVector(0, 0);
    tilingAnchor = createVector(0, 0);
    setInterval(() => {
        if (direction.x != 0 || direction.y != 0) {
            updatePositionAction(position.x + '_' + position.y);
        }
    }, 100);
}


function draw() {
    background(220);
    if (direction.x != 0 || direction.y != 0) {
        position.x = position.x + direction.x * (deltaTime / 5);
        position.y = position.y + direction.y * (deltaTime / 5);
    }
    const tilingAnchorTranslated = p5.Vector.sub(tilingAnchor, position);
    const tilingOrigin = tilingAnchorTranslated.copy();
    if (position.x + width < tilingAnchor.x) {
        tilingOrigin.x = tilingAnchor.x - (ceil((tilingAnchor.x - (position.x + width)) / img.width) * img.width) - position.x;
    } else if (position.x > tilingAnchor.x) {
        tilingOrigin.x = (ceil((position.x - tilingAnchor.x) / img.width) * img.width) - position.x;
    }
    if (position.y + height < tilingAnchor.y) {
        tilingOrigin.y = tilingAnchor.y - (ceil((tilingAnchor.y - (position.y + height)) / img.height) * img.height) - position.y;
    } else if (position.y > tilingAnchor.y) {
        tilingOrigin.y = (ceil((position.y - tilingAnchor.y) / img.height) * img.height) - position.y;
    }
    const topLeftTilingPoint = createVector(
        tilingOrigin.x - ceil(tilingOrigin.x / img.width) * img.width,
        tilingOrigin.y - ceil(tilingOrigin.y / img.height) * img.height,
    );
    const currentTilingPoint = topLeftTilingPoint.copy();

    while (currentTilingPoint.y < height) {
        while (currentTilingPoint.x < width) {
            image(img, currentTilingPoint.x, currentTilingPoint.y);
            currentTilingPoint.x += img.width;
        }
        currentTilingPoint.x = topLeftTilingPoint.x;
        currentTilingPoint.y += img.height;
    }
    translate(width / 2, height / 2);

    const minXRender = position.x - halfWidth - 50;
    const maxXRender = position.x + halfWidth + 50;
    const minYRender = position.y - halfHeight - 50;
    const maxYRender = position.y + halfHeight + 50;
    pellets.forEach((pellet) => {
        push();
        fill('pink');
        stroke('pink');
        ellipse(pellet.x - position.x, pellet.y - position.y, 20, 20);
        pop();
    });
    bullets.forEach((bullet) => {
        push();
        fill('blue');
        stroke('pink');
        ellipse(bullet.x - position.x, bullet.y - position.y, 20, 20);
        pop();
    });

    playerPositions.forEach((vector) => {
        if (vector.x >= minXRender && vector.x <= maxXRender && vector.y >= minYRender && vector.y <= maxYRender) {
            ellipse(vector.x - position.x, vector.y - position.y, 50, 50);
        } else {
            drawArrow(createVector(0, 0), p5.Vector.sub(vector, position).setMag(75), 'blue');
        }
    });
    // me!
    ellipse(0, 0, 50, 50);
}

// draw an arrow for a vector at a given base position
function drawArrow(base, vec, myColor) {
    push();
    stroke(myColor);
    strokeWeight(3);
    fill(myColor);
    translate(base.x, base.y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    let arrowSize = 7;
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
}

function keyPressed() {
    if (key == "w") {
        direction.y = -1;
    }
    if (key == "a") {
        direction.x = -1;
    }
    if (key == "s") {
        direction.y = 1;
    }
    if (key == "d") {
        direction.x = 1;
    }
    direction.setMag(1);
}
function keyReleased() {
    if (key == "w") {
        direction.y = 0;
    }
    if (key == "a") {
        direction.x = 0;
    }
    if (key == "s") {
        direction.y = 0;
    }
    if (key == "d") {
        direction.x = 0;
    }
    direction.setMag(1);
}