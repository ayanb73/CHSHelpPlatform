/*
Ayan Bhattacharjee
2017
*/

// node modules in use, installed by npm or included
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const GoogleAuth = require('google-auth-library');

// google account authenciation details
const auth = new GoogleAuth;
const client = new auth.OAuth2('608787834828-71306h3l0d8tfg0ooudb8enkm7dd1ta3.apps.googleusercontent.com', '', '');

// server port
const port = process.env.PORT || 3000

// the room object, basis for the entire server
function Room(name) {
  this.name = name;
  // room properties
  this.teachers = new Map(); // [socket id, google name]
  this.students = new Map();; // [socket id, google name]
  this.lines = new Map(); // stores all help-lines [eventID, lineObject]
  this.lineIndex = 0; // for equal student-distribution to teachers
  // room methods
  this.join = function(user,socketID) { // adds a user to the room properties
    if (user.occupation == "teacher") {
      this.teachers.set(socketID,user.name);
    } else if (user.occupation == "student") {
      this.students.set(socketID,user.name);
    }
  };
  this.leave = function(user,socketID) { // removes a user from the room properties
    if (user.occupation == "teacher") {
      this.teachers.delete(socketID);
    } else if (user.occupation == "student") {
      this.students.delete(socketID);
    }
  };
  this.live = function() { // returns whether or not the room is live (contains a teacher)
    if (this.teachers.size > 0) {
      return true;
    } else {
      return false;
    }
  };
  this.updateLineIndex = function() { // simple method to ensure proper student distribution to teacher
    if (this.lineIndex < this.teachers.size - 1) {
      this.lineIndex++;
    } else if (this.lineIndex == this.teachers.size - 1) {
      this.lineIndex = 0;
    }
  };
  this.helpLine = function(student,socketID) { // establishes a help line
    var uniqueEventID = crypto.randomBytes(10).toString('hex'); // unique descriptor id
    var lineObject = {
      stu: socketID,
      stuName: student.name,
      teach: Array.from(this.teachers.keys())[this.lineIndex],
      teachName: Array.from(this.teachers.values())[this.lineIndex],
      lineID: uniqueEventID,
      room: this.name
    };
    this.lines.set(uniqueEventID,lineObject);
    io.to(lineObject.stu).emit('new-line',lineObject); // sends out line object to student
    io.to(lineObject.teach).emit('new-line',lineObject); // sends out lien object to teacher
    this.updateLineIndex();
  };
}

// the room architecture
const AllConnected = new Room("Big"); // all users belong to this upon google verification
// rooms
const AlgebraOne = new Room("Alg1");
const Geometry = new Room("Geo");
// room directory
const identifiersArray = [['Alg1',AlgebraOne],['Geo',Geometry]];
const roomIdentifiers = new Map(identifiersArray);

// sending files (Express middleware)
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static('src'));

// event-driven websockets communication
io.on('connection', function(socket){
  // google verification
  socket.on('verify',function(id){
    client.verifyIdToken(
    id,
    '608787834828-71306h3l0d8tfg0ooudb8enkm7dd1ta3.apps.googleusercontent.com',
    function(e, login) {
      var payload = login.getPayload();
      var userid = payload['sub'];
      /*
      var domain = payload['hd'];
      if (domain === 'cheshire.k12.ct.us') {
        io.to(socket.id).emit('verify', true);
      }
      */
      if (payload.name.includes("(")) { // student on domain
        socket.emit('verify',true,'student');
        AllConnected.students.set(socket.id,payload.name);
      } else { // teacher
        socket.emit('verify',true,'teacher');
        AllConnected.teachers.set(socket.id,payload.name);
      }
    });
  });
  // event listener for join requests
  socket.on('joinRequest', (room,user) => {
    socket.join(room);
    roomIdentifiers.get(room).join(user,socket.id);
  });
  // event listener for leave requests
  socket.on('leaveRequest', (room,user) => {
    socket.leave(room);
    roomIdentifiers.get(room).leave(user,socket.id);
  });
  // update all clients on which rooms are active
  setInterval(function(){
    var liveRoomUpdate = [];
    for (var [key,value] of roomIdentifiers) {
      if (value.live()) {
        liveRoomUpdate.push(key);
      }
    }
    io.emit('live rooms update',liveRoomUpdate)
  }, 1000);
  // general message event listener
  socket.on('msg', (msg,room,sender) => {
    io.in(room).emit('msg',msg,room,sender);
  });
  // help-line request event listener
  socket.on('help req', (room,student) => {
    roomIdentifiers.get(room).helpLine(student,socket.id);
  });
  // line message event listener
  socket.on('line-message', (eventID,msg,room,sender) => {
    var whichRoom = roomIdentifiers.get(room);
    var transmit = whichRoom.lines.get(eventID);
    if (sender.occupation == 'student') {
      io.to(transmit.teach).emit('line-message',eventID,msg,room,sender);
    } else if (sender.occupation == 'teacher') {
      io.to(transmit.stu).emit('line-message',eventID,msg,room,sender);
    }
  });
  // disconnect event listener, which removes client from all records
  socket.on('disconnect', function() {
    for (var [key,value] of roomIdentifiers) {
      value.teachers.delete(socket.id);
      value.students.delete(socket.id);
    }
    AllConnected.teachers.delete(socket.id);
    AllConnected.students.delete(socket.id);
  });
});
// http sever up and running confirmation
http.listen(port, function(){
  console.log('listening on *:' + port);
});
