module.exports = init;

var io = require('socket.io');

function init(srv, opts) {
  return new TeamIO(srv, opts);
}

function Notification(event, payload) {
  if (!event) throw "event can't be blank";
  if (!payload) throw "payload can't be blank";

  this.time = Date.now();
  this.event = event;
  this.payload = {};
  Object.assign(this.payload, payload);
}

function TeamIO(srv, opts) {
  var _this = this;
  _this.opts = {};
  Object.assign(_this.opts, opts);

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

  _this.socketio = io(srv, opts);
  _this.socketio.on('connection', function (socket) {
    var addr = socket.handshake.address;
    if (!_this.data.clients[addr]) {
      _this.data.clients[addr] = new Client(_this, socket);
    } else {
      var client = _this.data.clients[addr];
      client.socket = socket;
      var n = client.getMissedNotification();
      if (n) {
        client.emit(n.event, n.payload);
      }
      client.team.notifySubscribers();
    }
  });
  return _this;
}

TeamIO.prototype.createTeam = function (params) {
  var p = {};
  Object.assign(p, params);
  if (!p.id) throw "id can't be blank";
  this.data.teams[p.id] = new Team(p);
  return this.data.teams[p.id];
};

TeamIO.prototype.team = function (id) {
  if (!id) throw "id can't be blank";
  return this.data.teams[id];
};

TeamIO.prototype.deleteTeam = function (params) {
  var _params = {};
  Object.assign(_params, params);
  if (!_params.id) throw "id can't be blank";
  delete this.data.teams[_params.id];
  return this;
};

TeamIO.prototype.reset = function () {
  this.data = {
    clients: {},
    teams: {}
  };
  return this;
};

//------------------------------------//
// Client instance
//------------------------------------//

function Client(teamio, socket, opts) {
  if (!teamio) throw "teamio can't be blank";
  if (!socket) throw "socket can't be blank";

  var _this = this;
  _this.opts = {};
  Object.assign(_this.opts, opts);

  _this.teamio = teamio;
  _this.socket = socket;
  _this.team = null;
  _this.memberId = null;
  _this.disconnectTime = null;

  socket.on(teamio.events.joinTeam, function (params) {
    var _params = {};
    Object.assign(_params, params);
    if (!_params.teamId) throw "teamId can't be blank";
    if (!_params.memberId) throw "memberId can't be blank";

    _this.team = _this.teamio.data.teams[_params.teamId];
    _this.team.addMember(_this, _params);
    _this.memberId = _params.memberId;

  });

  socket.on(teamio.events.disconnect, function () {
    // _this.team.emit('lostMember', {});
    _this.disconnectTime = Date.now();
  });
}

Client.prototype.emit = function (event, payload, opts) {
  if (!event) throw "event can't be blank";
  if (!payload) throw "payload can't be blank";

  var _this = this;
  var _opts = {};
  Object.assign(_opts, opts);

  if (! _opts.force) {
    _this.socket.emit(event, payload);
    return _this;
  }

  var i = setInterval(function () {
    _this.socket.emit(event, payload, function () {
      clearInterval(i);
    })
  }, _opts.interval || 3000);

  _this.socket.emit(event, payload, function () {
    clearInterval(i);
  });

  return _this;
};

Client.prototype.getMissedNotification = function () {
  if (!this.disconnectTime) return null;
  var n = this.team.notifications[0];
  if (n.time > this.disconnectTime) return n;
  return null;
};

//------------------------------------//
// Team instance
//------------------------------------//

function Team(opts) {
  this.opts = {
    expectedMembers: 1
  };
  Object.assign(this.opts, opts);

  this.clients = {};
  this.notifications = [];
  this.subscribers = [];
}

Team.prototype.addMember = function (client, params) {
  if (!client) throw "client can't be blank";
  var _params = {};
  Object.assign(_params, params);
  if (!_params.memberId) throw "memberId can't be blank";
  this.clients[_params.memberId] = client;
  if(_params.subscriber) {
    this.subscribers.push(client);
  }
  return this;
};

Team.prototype.client = function (id) {
  if (!id) throw "id can't be blank";
  return this.clients[id];
};

Team.prototype.emit = function (event, payload) {
  if (!event) throw "event can't be blank";
  if (!payload) throw "payload can't be blank";

  var _this = this;
  _this.notifications.unshift(new Notification(event, payload));
  Object.keys(_this.clients).forEach(function (id) {
    _this.clients[id].emit(event, payload);
  });
  return this;
};

Team.prototype.notifySubscribers = function() {

};
