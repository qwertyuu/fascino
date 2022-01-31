const worldState = {
    pellets: [],
    clients: {},
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
});
