/**
 * Created by daniel on 19.08.17.
 */

var chai = require('chai');
var expect = chai.expect;
var server = require('http').createServer();
var teamio = require('../lib/index')(server);

describe('simple connection', function() {

    var client;

    before(function(done) {
        server.listen(3001, function() {
            client = require('socket.io-client')('http://localhost:3001');
            done();
        });
    });

    it('should connect to the socketio server', function(done) {
        client.on('hi', function(data) {
            expect(data.message).to.equal('hi');
            done();
        });
        setTimeout(done, 1500);
    })
});

