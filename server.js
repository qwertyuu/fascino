window.SublimJs.onSublimReady(() => {
    window.SublimJs.services.roomService.wsService.registerService('Joy', (data) => {
        console.log(data);
        if (data.action == "Position") {
            window.SublimJs.services.roomService.wsService.send(1, 'Joy', 'Position', data.content + '_' + data.user_id);
        }
    })
    window.SublimJs.services.roomService.wsService.registerService('All', (data) => {
        console.log(data);
        if (data.action == "Leave") {
            window.SublimJs.services.roomService.wsService.send(1, 'All', 'Leave', data.content);
        }
        if (data.action == "Join") {
            window.SublimJs.services.roomService.wsService.send(1, 'All', 'Join', data.content);
        }
    })
    window.SublimJs.services.roomService.makeAction('Open')('marde');
    
    setInterval(() => {
        window.SublimJs.services.roomService.wsService.send(1, 'World', 'Pellet', Math.random() * 1000 + '_' + Math.random() * 1000);
    }, 3000);
});
