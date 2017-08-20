/**
 * Created by daniel on 20.08.17.
 */
var chai = require('chai');
var expect = chai.expect;

describe('create team', function() {
    it('should create one new team', function(done) {
        var server = require('http').createServer();
        var teamio = require('../lib/index')(server);
        server.listen(3000);
        teamio.createTeam({teamId: 'xyz'});
        console.log(teamio.data.teams);
        expect(teamio.data.teams['xyz']).to.not.equal(null);
        setTimeout(done, 100);
    })
});