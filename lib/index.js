module.exports = init;

var io = require('socket.io');

function init (srv, opts) {
    return new TeamIO(srv, opts);
}

function Notification(payload) {
    this.time = Date.now();
    this.body = payload;
}

function TeamIO (srv, opts) {
    var count = 0;
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
        count ++;
        var addr = socket.handshake.address;
        if(! _this.data.clients[addr]) {
            _this.data.clients[addr] = new Client(_this, socket);
        } else {
            //var client = teamio.data.clients[addr];
            //client.socket = socket;
        }
    });
    return _this;
}

TeamIO.prototype.createTeam = function(params) {
    params = params || {};
    this.data.teams[params.id] = new Team();
    return this;
};

TeamIO.prototype.team = function(id) {
    return this.data.teams[id];
};

TeamIO.prototype.deleteTeam = function(params) {
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
    _this.teamio = teamio;
    _this.socket = socket;
    _this.team = null;
    _this.id = null;
    _this.disconnectTime = null;
    _this.isConnected = true;

    socket.on(teamio.events.createTeam, function(params) {
        _this.teamio.data.teams[params.id] = new Team();
    });

    socket.on(teamio.events.joinTeam,  function(params) {
        _this.team = _this.teamio.data.teams[params.teamId];
        _this.team.join(_this, params.clientId);
        _this.id = params.clientId;
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

    socket.emit(teamio.events.hi, {message: 'hi'});
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
    }, 3000);

    _this.socket.emit(event, payload, function() {
        clearInterval(i);
    });

    return _this;
};

//------------------------------------//
// Team instance
//------------------------------------//

function Team() {
    this.clients = {};
    this.notifications = [];
}

Team.prototype.join = function(client, clientId) {
    this.clients[clientId] = client;
    return this;
};

Team.prototype.client = function(id) {
    return this.clients[id];
};

Team.prototype.emit = function(event, payload) {
    var _this = this;
    _this.notifications.push({
        event: event ,
        notification: new Notification(payload)
    });

    Object.keys(_this.clients).forEach(function(id) {
        _this.clients[id].emit(event, payload);
    });

    return this;
};

