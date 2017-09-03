// libraries and such
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const GoogleAuth = require('google-auth-library');

// google account authenciation
const auth = new GoogleAuth;
const client = new auth.OAuth2('608787834828-71306h3l0d8tfg0ooudb8enkm7dd1ta3.apps.googleusercontent.com', '', '');

// server port
const port = process.env.PORT || 3000

var connected = {
  teachers: [],
  students: []
}
var names = []
var Alg1 = {
  key: 'Alg1',
  teachers: [],
  students: []
}
var Geo = {
  key: 'Geo',
  teachers: [],
  students: []
}

// user object standard - {id: socketID, name: googleName, occupation: teacher/student}
function Room() {
  // room properties
  // [socket id, google name]
  this.teachers = new Map();
  this.students = new Map();;

  // room methods
  this.join = function(user) {
    if (user.occupation == "teacher") {
      this.teachers.set(user.id,user.name);
    } else if (user.occupation == "student") {
      this.students.set(user.id,user.name);
    }
  };
  this.leave = function(user) {
    if (user.occupation == "teacher") {
      this.teachers.delete(user.id);
    } else if (user.occupation == "student") {
      this.students.delete(user.id);
    }
  };
  this.live = function() {
    if (this.teachers.size > 0) {
      return true;
    } else {
      return false;
    }
  };
  this.helpLine = function() {
    // student help line code goes here
  };
}

// the room architecture
const AllConnected = new Room();
// rooms
const AlgebraOne = new Room();
const Geometry = new Room();
// room directory
const identifiersArray = [['Alg1',AlgebraOne],['Geo',Geometry]];
const roomIdentifiers = new Map(identifiersArray);

// sending files
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static('src'))

// event-driven websockets communication
io.on('connection', function(socket){

  socket.on('verify',function(id){
    client.verifyIdToken(
    id,
    '608787834828-71306h3l0d8tfg0ooudb8enkm7dd1ta3.apps.googleusercontent.com',
    function(e, login) {
      var payload = login.getPayload();
      var userid = payload['sub'];
      // var domain = payload['hd'];
      /* if (domain === 'cheshire.k12.ct.us') {
        io.to(socket.id).emit('verify', true);
      } */
      if (payload.name.includes("(")) {
        io.to(socket.id).emit('verify',true,'student');
        AllConnected.students.set(socket.id,payload.name);
      } else {
        io.to(socket.id).emit('verify',true,'teacher');
        AllConnected.teachers.set(socket.id,payload.name);
      }
    });
  });

  socket.on('joinRequest', (room,user) => {
    socket.join(room);
    roomIdentifiers.get(room).join(user);
  });

  socket.on('leaveRequest', (room,user) => {
    socket.leave(room);
    roomIdentifiers.get(room).leave(user);
  });

  setInterval(function(){
    // update all clients on which rooms are active
    var liveRoomUpdate = [];
    for (var [key,value] of roomIdentifiers) {
      if (value.live()) {
        liveRoomUpdate.push(key);
      }
    }
    io.emit('live rooms update',liveRoomUpdate)
  }, 1000);

  socket.on('msg', (msg,room,sender) => {
    io.in(room).emit('msg',msg,room,sender);
  });


  socket.on('disconnect', function() {
    for (var [key,value] of roomIdentifiers) {
      value.teachers.delete(socket.id);
      value.students.delete(socket.id);
    }
    AllConnected.teachers.delete(socket.id);
    AllConnected.students.delete(socket.id);
  });

});

// http sever up and running
http.listen(port, function(){
  console.log('listening on *:' + port);
});
