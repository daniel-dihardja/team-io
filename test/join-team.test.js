/**
 * Created by daniel on 20.08.17.
 */
var chai = require('chai');
var expect = chai.expect;

describe('join team', function() {
    it('should join the team', function(done) {
        var server = require('http').createServer();
        var teamio = require('../lib/index')(server);
        server.listen(3000);
        teamio.createTeam({teamId: 'xyz'});

        var client = require('socket.io-client');
        var socket = client('http://localhost:3000');

        socket.emit('joinTeam', {teamId: 'xyz', memberId: '1'});

        setTimeout(function() {
            console.log(teamio.data.teams['xyz'].members);
            expect(teamio.data.teams['xyz'].members['1'].memberId).to.equal('1');
        }, 100);

        setTimeout(done, 200);
    })
});