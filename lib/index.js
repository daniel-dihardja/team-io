module.exports = init;

var io = require('socket.io');

function init (srv, opts) {
    return new TeamIO(srv, opts);
}

function Notification(event, payload) {
    if(! event) throw "event can't be blank";
    if(! payload) throw "payload can't be blank";

    this.time = Date.now();
    this.event = event;
    this.payload = payload;
}

function TeamIO (srv, opts) {
    var _this = this;
    _this.opts = opts || {};
    _this.events = {
        createTeam: 'createTeam',
        joinTeam: 'joinTeam',
        notifyTeam: 'notifyTeam',
        disconnect: 'disconnect'
    };

    _this.data = {
        clients: {},
        teams: {}
    };

    _this.socketio = io (srv, opts);
    _this.socketio.on('connection', function(socket) {
        var addr = socket.handshake.address;
        if(! _this.data.clients[addr]) {
            _this.data.clients[addr] = new Client(_this, socket);
        } else {
            var client = _this.data.clients[addr];
            client.socket = socket;
            var n = client.getMissedNotification();
            if(n) {
                client.emit(n.event, n.payload);
            }
        }
    });
    return _this;
}

TeamIO.prototype.createTeam = function(params) {
    params = params || {};
    if(! params.id) throw "id can't be blank";
    this.data.teams[params.id] = new Team();
    return this.data.teams[params.id];
};

TeamIO.prototype.team = function(id) {
    if(! id) throw "id can't be blank";
    return this.data.teams[id];
};

TeamIO.prototype.deleteTeam = function(params) {
    if(! params.id) throw "id can't be blank";
    params = params || {};
    delete this.data.teams[params.id];
    return this;
};

TeamIO.prototype.reset = function() {
    this.data = {
        clients: {},
        teams: {}
    };
    return this;
};

//------------------------------------//
// Client instance
//------------------------------------//

function Client(teamio, socket, opt) {

    var _this = this;
    _this.opt = opt || {};
    _this.teamio = teamio;
    _this.socket = socket;
    _this.team = null;
    _this.memberId = null;
    _this.disconnectTime = null;

    socket.on(teamio.events.createTeam, function(params) {
        _this.teamio.data.teams[params.id] = new Team();
    });

    socket.on(teamio.events.joinTeam,  function(params) {
        _this.team = _this.teamio.data.teams[params.teamId];
        _this.team.addMember(_this, params.memberId);
        _this.memberId = params.memberId;
    });

    socket.on(teamio.events.notifyTeam, function(params) {
        _this.teamio.data.teams[params.teamId].notify(params);
    });

    socket.on(teamio.events.disconnect, function() {
        // _this.team.emit('lostMember', {});
        _this.disconnectTime = Date.now();
    });
}

Client.prototype.emit = function(event, payload, opt) {
    var _this = this;

    opt = opt || {};

    if(! opt.force) {
        _this.socket.emit(event, payload);
        return _this;
    }

    var i = setInterval(function () {
        _this.socket.emit(event, payload, function () {
            clearInterval(i);
        })
    }, opt.interval || 3000);

    _this.socket.emit(event, payload, function() {
        clearInterval(i);
    });

    return _this;
};

Client.prototype.getMissedNotification = function() {
    if(! this.disconnectTime) return null;

    var n = this.team.notifications[0];
    if(n.time > this.disconnectTime) return n;
    return null;
};

//------------------------------------//
// Team instance
//------------------------------------//

function Team() {
    this.clients = {};
    this.notifications = [];
}

Team.prototype.addMember = function(client, clientId) {
    this.clients[clientId] = client;
    return this;
};

Team.prototype.client = function(id) {
    return this.clients[id];
};

Team.prototype.emit = function(event, payload) {
    var _this = this;
    _this.notifications.unshift(new Notification(event, payload));
    Object.keys(_this.clients).forEach(function(id) {
        _this.clients[id].emit(event, payload);
    });
    return this;
};
