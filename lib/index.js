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
            _this.data.clients[addr] = new Client(_this, socket, {count: count});
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

TeamIO.prototype.notityTeam = function(params) {
    params = params || {};
    this.data.teams[params.id].notify(params.data, params.opt);
    return this;
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
    _this.memberId = null;
    _this.disconnectTime = null;
    _this.isConnected = true;

    socket.on(teamio.events.createTeam, function(params) {
        _this.teamio.data.teams[params.id] = new Team();
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
