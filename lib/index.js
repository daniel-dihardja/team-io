module.exports = init;

var io = require('socket.io');

function init (srv, opts) {
    return new TeamIO(srv, opts);
}

function Notification(msg) {
    this.time = Date.now();
    this.message = msg;
}

function TeamIO (srv, opts) {
    var count = 0;
    var teamio = this;
    teamio.opts = opts || {};
    teamio.events = {
        createTeam: 'createTeam',
        joinTeam: 'joinTeam',
        notifyTeam: 'notifyTeam',
        disconnect: 'disconnect'
    };

    teamio.data = {
        clients: {},
        teams: {}
    };

    teamio.socketio = io (srv, opts);
    teamio.socketio.on('connection', function(socket) {
        count ++;
        var addr = socket.handshake.address;
        if(! teamio.data.clients[addr]) {
            teamio.data.clients[addr] = new Client(teamio, socket, {count: count});
        } else {
            var client = teamio.data.clients[addr];
            client.socket = socket;
        }
    });
    return teamio;
}

TeamIO.prototype.createTeam = function(params) {
    this.data.teams[params.teamId] = new Team();
};

TeamIO.prototype.notityTeam = function(params) {
    this.data.teams[params.teamId].notify(params.data, params.opt);
};

TeamIO.prototype.deleteTeam = function(params) {
    delete this.data.teams[params.teamId];
};

//------------------------------------//
// Client instance
//------------------------------------//

function Client(teamio, socket, opt) {

    var _this = this;
    _this.teamio = teamio;
    _this.socket = socket;
    _this.team = null;
    _this.memberId = null;
    _this.disconnectTime = null;
    _this.isConnected = true;

    socket.on(teamio.events.createTeam, function(params) {
        _this.teamio.data.teams[params.teamId] = new Team();
    });

    socket.on(teamio.events.joinTeam,  function(params) {
        _this.team = _this.teamio.data.teams[params.teamId];
        _this.team.join(_this, params.memberId);
        _this.memberId = params.memberId;
        _this.socket.join(params.teamId);
    });

    socket.on(teamio.events.notifyTeam, function(params) {
        _this.teamio.data.teams[params.teamId].notify(params);
    });

    socket.on(teamio.events.disconnect, function() {
        _this.team.notify({message: 'disconnected ' + _this.id}, {broadcast: true});
        _this.isConnected = false;
        _this.disconnectTime = Date.now();
    });

    // confirm the initial connection

    socket.emit(teamio.events.hi, {message: 'hi', count: opt.count});
}

//------------------------------------//
// Team instance
//------------------------------------//

function Team() {
    this.members = {};
    this.notifications = [];
}

Team.prototype.join = function(client, memberId) {
    this.members[memberId] = client;
    return this;
};

Team.prototype.notify = function(notification, opt) {
    this.notifications.push({notification: notification, opt: opt || {}});
    /*
    this.members.forEach(function(con) {
        notifyWithRetry(con.socket, data);
    });
    */
    return this;
};

function notifyWithRetry(socket, params, opt) {
    var i = setInterval(function () {
        socket.emit(params.event, params.payload, function () {
            clearInterval(i);
        })
    }, 3000);

    socket.emit(params.event, params.payload, function() {
        clearInterval(i);
    });
}
