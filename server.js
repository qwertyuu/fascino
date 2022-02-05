const worldState = {
    pellets: [],
    clients: {},
    bullets: [],
};

window.SublimJs.onSublimReady(() => {
    const wsService = window.SublimJs.services.roomService.wsService;
    wsService.registerService('Joy', (data) => {
        if (data.action == "Position") {
            wsService.send(1, 'Joy', 'Position', data.content + '_' + data.user_id);
            let clientState = worldState.clients[data.user_id];
            if (!clientState) {
                clientState = {};
            }
            clientState.position = data.content;
            worldState.clients[data.user_id] = clientState;
        } else if (data.action == "Shoot") {
            const [x, y] = data.content.split('_');
            const magnitude = Math.sqrt(x * x + y * y);
            if (magnitude < 0.98 || magnitude > 1.02) {
                return;
            }
            const clientState = worldState.clients[data.user_id];
            if (!clientState) {
                return;
            }
            const [fromx, fromy] = clientState.position.split('_');
            const from = {
                x: parseFloat(fromx),
                y: parseFloat(fromy),
            };
            worldState.bullets.push({
                from,
                direction: {x: parseFloat(x), y: parseFloat(y)},
                position: from,
                shooter: data.user_id,
                updates: 0,
            });
        }
    });
    wsService.registerService('All', (data) => {
        if (data.action == "Leave" || data.action == "Join") {
            wsService.send(1, 'All', data.action, data.content);
        }
        if (data.action == "Leave") {
            delete worldState.clients[data.content];
        }
        if (data.action == "Join") {
            wsService.send(1, 'World', 'State', JSON.stringify(worldState));
            worldState.clients[data.content] = { position: '0_0' };
        }
    });
    window.SublimJs.services.roomService.makeAction('Open')('Fascino');

    setInterval(() => {
        const newPellet = { x: Math.random() * 1000, y: Math.random() * 1000 };
        worldState.pellets.push(newPellet);
        wsService.send(1, 'World', 'Pellet', newPellet.x + '_' + newPellet.y);
    }, 3000);

    setInterval(() => {
        const bulletsPositionsString = [];
        worldState.bullets.forEach((bullet, index, object) => {
            bullet.position.x += bullet.direction.x;
            bullet.position.y += bullet.direction.y;
            bullet.updates++;
            if (bullet.updates >= 50) {
                // remove bullet from list, pew pew
                object.splice(index, 1);
            } else {
                bulletsPositionsString.push(bullet.position.x + '_' + bullet.position.y);
            }
        });
        if (bulletsPositionsString.length) {
            wsService.send(1, 'Joy', 'Bullets', bulletsPositionsString.join('/'));
        }
    }, 5);
});
