# Team-IO

Team-io is a layer on top of socket.io that manage notifications within a team. If a client gets disconnected and missed a notification, Team-IO will resend the missed notification right after the client gets reconnected.
### Installation
```javascript
npm install team-io --save
```

### Example
##### Server:
```javascript

var server = require('http').createServer();
var teamio = require('team-io')(server);

server.listen('3000', function() {
  // create a team
  teamio.createTeam({id: 'abc'});
  
  // notify a team
  teamio.team('abc').emit('greets', {message: 'hallo'});
});

```

##### Client (node.js): 
```javascript

var ioClient = require('socket.io-client');

var client = ioClient('http://localhost:3000');

// client joins a team
client.emit('joinTeam', {teamId: 'abc', memberId: 'm1'});

// from now on, the last missed notification while a client is disconnected, will be resended after reconnection

```