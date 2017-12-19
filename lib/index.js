/**
 * Created by daniel on 18.08.17.
 */

module.exports = init;

function init(srv, opts) {
    return new TeamIO(srv, opts);
}

function TeamIO(srv, opts) {
    var count = 0;
    var teamio = this;
    teamio.opts = opts || {};
    teamio.events = {
        hi: 'hi',
        createTeam: 'createTeam',
        joinTeam: 'joinTeam',
        renotify: 'renotify',
        notifyTeam: 'notifyTeam',
        disconnect: 'disconnect'
    };

    teamio.data = {
        clients: {},
        teams: {}
    };

    teamio.socketio = require('socket.io') (srv, opts);
    teamio.socketio.on('connection', function(socket) {
        count ++;
        teamio.data.clients[socket.id] = new Client(teamio, socket, {count: count});
    });
    return teamio;
}

TeamIO.prototype.createTeam = function(params) {
    this.data.teams[params.teamId] = new Team();
};

TeamIO.prototype.notityTeam = function(params) {
    this.data.teams[params.teamId].notify(params.data, params.opt);
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
    socket.on(teamio.events.renotify, function(params) {
        var team = _this.teamio.data.teams[params.teamId];
        con.socket.emit('renotification', team.notifications[params.index]);
    });

    socket.on(teamio.events.disconnect, function() {
        _this.team.notify({message: 'disconnected ' + con.id}, {broadcast: true});
        delete _this.team.data.members[con.memberId];
        delete _this.teamio.data.connections[con.id];
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
Team.prototype.join = function(connection, memberId) {
    this.members[memberId] = connection;
    return this;
};

Team.prototype.notify = function(data, opt) {
    this.notifications.push({data: data, opt: opt});
    this.members.forEach(function(con) {
        notifyWithRetry(con.socket, data);
    });
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
