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
        notifyTeam: 'notifyTeam'
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
    this.id = socket.id;
    this.teamio = teamio;
    this.socket = socket;
    this.team = null;
    this.memberId = null;

    var con = this;

    socket.on(teamio.events.createTeam, function(params) { createTeam(con, params) });
    socket.on(teamio.events.joinTeam,  function(params) { joinTeam(con, params) });
    socket.on(teamio.events.notifyTeam, function(params) { notifyTeam(con, params) });
    socket.on(teamio.events.renotify, function(params) {renotify(con, params)});
    socket.on('disconnect', function() {disconnect(con)});

    socket.emit(teamio.events.hi, {message: 'hi', count: opt.count});
}

//------------------------------------//
// Client Functions
//------------------------------------//

function createTeam(con, params) {
    con.teamio.data.teams[params.teamId] = new Team();
}

function joinTeam(con, params) {
    var team = con.teamio.data.teams[params.teamId];
    team.join(con, params.memberId);
    con.memberId = params.memberId;
    con.socket.join(params.teamId);
}

function notifyTeam(con, params) {
    con.teamio.data.teams[params.teamId].notify(params);
}

function renotify(con, params) {
    var team = con.teamio.data.teams[params.teamId];
    con.socket.emit('renotification', team.notifications[params.index]);
}

function disconnect(con) {
    con.team.notify({message: 'disconnected ' + con.id}, {broadcast: true});
    delete con.team.data.members[con.memberId];
    delete con.teamio.data.connections[con.id];
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
