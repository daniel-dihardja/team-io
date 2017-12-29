/**
 * Created by danieldihardja on 20/12/17.
 */
var chai = require('chai');
var expect = chai.expect;
var server = require('http').createServer();
var teamio = require('../lib/index')(server);
var ioClient = require('socket.io-client');

describe('teamio', function() {

  var port = "3002";
  var url = 'http://localhost:' + port;

  before(function(done) {
    teamio.reset();
    server.listen(port, done);
  });

  afterEach(function() {
    teamio.reset();
  });

  /**
   * create a team
   */
  it('should create a team', function(done) {
    teamio.createTeam({id: 'abc'});
    teamio.createTeam({id: 'xyz'});
    expect(teamio.team('abc')).to.be.an('object');
    expect(teamio.team('xyz')).to.be.an('object');
    done();
  });

  /**
   * delete a team
   */
  it('should delete a team', function(done) {
    teamio.createTeam({id: 'abc'});
    teamio.createTeam({id: 'xyz'});
    expect(teamio.team('abc')).to.be.an('object');
    expect(teamio.team('xyz')).to.be.an('object');
    teamio.deleteTeam({id: 'abc'});
    expect(teamio.team('abc')).to.be.a('undefined');
    expect(teamio.team('xyz')).to.be.an('object');
    done();
  });

  /**
   * join a team
   */
  it('should join a team', function(done) {
    teamio.createTeam({id: 'abc'});
    var client = ioClient(url);
    client.emit('joinTeam', {teamId: 'abc', memberId: 'm1'});
    setTimeout(function() {
      var client = teamio.team('abc').client('m1');
      expect(client).to.be.an('object');
      expect(client.memberId).to.equal('m1');
      done();
    }, 100);
  });

  /**
   * reset
   */
  it('should reset clients & teams', function(done) {
    teamio.data = {
      clients: {
        '192.168.33.57': {},
        '192.168.38.58': {}
      },
      teams:  {
        't1': {},
        't2': {}
      }
    };

    teamio.reset();
    expect(Object.keys(teamio.data.clients).length).to.equal(0);
    expect(Object.keys(teamio.data.teams).length).to.equal(0);

    done();
  });

  /**
   * team notification
   */
  it('should receive team notification', function(done) {
    teamio.createTeam({id: 'abc'});
    var client = ioClient(url);

    client.on('teamNotification', function(data) {
      expect(data.time).to.equal('14:30');
      done();
    });

    client.emit('joinTeam', {teamId: 'abc', memberId: 'm1'});

    setTimeout(function() {
      // emit team notification
      teamio.team('abc').emit('teamNotification', {time: '14:30'});
    }, 100);
  });

  /**
   * receive missed message
   */
  it('should receive missed notification', function(done) {
    teamio.createTeam({id: 'abc'});

    // client is connecting
    var client = ioClient(url);
    client.emit('joinTeam', {teamId: 'abc', memberId: 'm1'});

    // handle notification after reconnect
    client.on('teamNotification', function(data) {
      expect(data.time).to.equal('14:37');
      done();
    });

    // client loose connection here
    setTimeout(function() {
      client.close();
    }, 100);

    // server is emiting a team notification
    setTimeout(function() {
      teamio.team('abc').emit('teamNotification', {time: '14:37'});
    }, 200);

    // client reopen connection
    setTimeout(function() {
      client.open();
    }, 300);
  });
});
