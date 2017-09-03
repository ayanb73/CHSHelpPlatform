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

// rooms: Alg1.key, Geo.key
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
        io.emit('verify', true);
      } */
      if (payload.name.includes("(")) {
        io.to(socket.id).emit('verify',true,'student');
        connected.students.push(socket.id);
        names.push({name: payload.name, socketID: socket.id, stat: "student"});
      } else {
        io.to(socket.id).emit('verify',true,'teacher');
        connected.teachers.push(socket.id);
        names.push({name: payload.name, socketID: socket.id, stat: "teacher"});
      }
    });
  });

  socket.on('joinRequest', function(ocup,room){
    switch(ocup) {
      case 'student':
        socket.join(room);
        if (room == Alg1.key) {
          Alg1.students.push(socket.id);
          io.to(socket.id).emit('joinReqResponse',true,Alg1.key);
        } else if (room == Geo.key) {
          Geo.students.push(socket.id);
          io.to(socket.id).emit('joinReqResponse',true,Geo.key);
        }
        break;
      case 'teacher':
        socket.join(room);
        if (room == Alg1.key) {
          Alg1.teachers.push(socket.id);
          io.to(socket.id).emit('joinReqResponse',true,Alg1.key);
        } else if (room == Geo.key) {
          Geo.teachers.push(socket.id);
          io.to(socket.id).emit('joinReqResponse',true,Geo.key);
        }
        break;
    }
  });

  socket.on('leaveRequest', function(room,ocup){
    switch(ocup) {
      case 'student':
        socket.leave(room);
        if (room == Alg1.key) {
          for (i = 0; i < Alg1.students.length; i++) {
            if (Alg1.students[i] == socket.id) {
              Alg1.students.splice(i, 1);
              break;
            } else {
              continue;
            }
          }
          io.to(socket.id).emit('leaveReqResponse',true,room);
        } else if (room == "Geo") {
          for (i = 0; i < Geo.students.length; i++) {
            if (Geo.students[i] == socket.id) {
              Geo.students.splice(i, 1);
            } else {
              continue;
            }
          }
          io.to(socket.id).emit('leaveReqResponse',true,room);
        }
      case 'teacher':
        socket.leave(room);
        if (room == Alg1.key) {
          for (i = 0; i < Alg1.teachers.length; i++) {
            if (Alg1.teachers[i] == socket.id) {
              Alg1.teachers.splice(i, 1);
              break;
            } else {
              continue;
            }
          }
          io.to(socket.id).emit('leaveReqResponse',true,room);
        } else if (room == "Geo") {
          for (i = 0; i < Geo.teachers.length; i++) {
            if (Geo.teachers[i] == socket.id) {
              Geo.teachers.splice(i, 1);
            } else {
              continue;
            }
          }
          io.to(socket.id).emit('leaveReqResponse',true,room);
        }
    }
  });

  setInterval(function(){
    // teacher updates
    for (a = 0; a < Alg1.teachers.length; a++) {
      io.in(Alg1.key).to(Alg1.teachers[a]).emit('room update', Alg1);
    }
    for (b = 0; b < Geo.teachers.length; b++) {
      io.in(Geo.key).to(Geo.teachers[b]).emit('room update', Geo);
    }
    for (c = 0; c < connected.teachers.length; c++) {
      io.to(connected.teachers[c]).emit('names update', names);
    }
    // student updates
    var liveRoomsUpdate = {};
    if (Alg1.teachers.length > 0) {liveRoomsUpdate.Alg1 = true;} else {liveRoomsUpdate.Alg1 = false;}
    if (Geo.teachers.length > 0) {liveRoomsUpdate.Geo = true;} else {liveRoomsUpdate.Geo = false;}
    for (d = 0; d < connected.students.length; d++) {
      io.to(connected.students[d]).emit('live rooms update',liveRoomsUpdate);
    }
  }, 1000);

  socket.on('msg', function(msg,room,sender) {
    var senderName;
    for (i = 0; i < names.length; i++) {
      if (names[i].socketID == sender) {
        senderName = names[i].name;
        break;
      } else {continue;}
    }
    io.in(room).emit('msg',msg,senderName,room);
  });


  socket.on('disconnect', function() {
    if (connected.teachers.includes(socket.id)) {
      connected.teachers.splice(connected.teachers.indexOf(socket.id),1);
      if (Alg1.teachers.includes(socket.id)) {
        Alg1.teachers.splice(Alg1.teachers.indexOf(socket.id),1);
      } else if (Geo.teachers.includes(socket.id)) {
        Geo.teachers.splice(Geo.teachers.indexOf(socket.id),1);
      }
    } else if (connected.students.includes(socket.id)) {
      connected.students.splice(connected.students.indexOf(socket.id),1);
      if (Alg1.students.includes(socket.id)) {
        Alg1.students.splice(Alg1.students.indexOf(socket.id),1);
      } else if (Geo.teachers.includes(socket.id)) {
        Geo.students.splice(Geo.students.indexOf(socket.id),1);
      }
    }
    for (x = 0; x < names.length; x++) {
      if (names[x].socketID === socket.id) {
        names.splice(x,1);
      } else {continue;}
    }
  });

});

// http sever up and running
http.listen(port, function(){
  console.log('listening on *:' + port);
});
