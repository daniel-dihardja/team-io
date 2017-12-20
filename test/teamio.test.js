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

  /**
   * create a team
   */
  it('should create a team', function(done) {
    teamio.createTeam({id: 'abc'});
    teamio.createTeam({id: 'xyz'});
    expect(teamio.data.teams['abc']).to.be.an('object');
    expect(teamio.data.teams['xyz']).to.be.an('object');
    done();
  });

  /**
   * delete a team
   */
  it('should delete a team', function(done) {
    teamio.createTeam({id: 'abc'});
    teamio.createTeam({id: 'xyz'});
    expect(teamio.data.teams['abc']).to.be.an('object');
    expect(teamio.data.teams['xyz']).to.be.an('object');
    teamio.deleteTeam({id: 'abc'});
    expect(teamio.data.teams['abc']).to.be.a('undefined');
    done();
  });

  /**
   * delete all teams
   */
  it('delete all teams', function(done) {
    teamio.createTeam({id: 'abc'});
    teamio.createTeam({id: 'xyz'});
    expect(teamio.data.teams['abc']).to.be.an('object');
    expect(teamio.data.teams['xyz']).to.be.an('object');
    teamio.deleteTeam();
    expect(teamio.data.teams['abc']).to.be.a('undefined');
    expect(teamio.data.teams['xyz']).to.be.a('undefined');
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
      var member1 = teamio.data.teams['abc'].members['m1'];
      expect(member1).to.be.an('object');
      expect(member1.memberId).to.equal('m1');
      done();
    }, 100);
  });
});