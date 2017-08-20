/**
 * Created by daniel on 19.08.17.
 */

var chai = require('chai');
var expect = chai.expect;

describe('simple connection', function() {
    it('should connect to the socketio server', function(done) {
        var server = require('http').createServer();
        var teamio = require('../lib/index')(server);
        teamio.socketio.emit('hi', {});
        server.listen(3000);
        var client = require('socket.io-client');
        var socket = client('http://localhost:3000');
        socket.on('hi', function(data) {
            console.log(data);
            expect(data.message).to.equal('hi');
        });
        setTimeout(done, 100);
    })
});