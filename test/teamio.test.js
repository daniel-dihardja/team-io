/**
 * Created by danieldihardja on 20/12/17.
 */
var chai = require('chai');
var expect = chai.expect;
var server = require('http').createServer();
var teamio = require('../lib/index')(server);
var ioClient = require('socket.io-client');

describe('teamio', function() {

  var url = 'http://localhost:3001';

  before(function(done) {
    server.listen(3001, done);
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
    client.emit('joinTeam', {teamId: 'abc', clientId: 'm1'});
    setTimeout(function() {
      var member = teamio.team('abc').client('m1');
      expect(member).to.be.an('object');
      expect(member.id).to.equal('m1');
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

    });
    client.emit('joinTeam', {teamId: 'abc', memberId: 'm1'});
    setTimeout(function() {
      // send team notification
      // teamio.data.teams['abc'].notify('', {})
      teamio.team('abc').emit('teamNotification', {time: '14:30'});
      done();
    }, 100);
  });
});