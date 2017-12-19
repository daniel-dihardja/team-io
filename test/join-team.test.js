/**
 * Created by daniel on 20.08.17.
 */
var chai = require('chai');
var expect = chai.expect;
var server = require('http').createServer();
var teamio = require('../lib/index')(server);

describe('join team', function() {

    var client;

    before(function(done) {
        server.listen(3001, function() {
            client = require('socket.io-client')('http://localhost:3001');
            done();
        });
    });

    it('should have a team member of 1', function(done) {
        teamio.createTeam({teamId: 'xyz'});
        client.emit('joinTeam', {teamId: 'xyz', memberId: '1'});
        setTimeout(function() {
            expect(teamio.data.teams['xyz'].members['1'].memberId).to.equal('1');
            done();
        }, 100);
        setTimeout(done, 1500);
    })
});