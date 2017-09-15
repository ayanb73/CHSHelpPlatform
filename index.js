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

// rooms
var rooms = [];

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
    io.to(lineObject.teach).emit('new-line',lineObject); // sends out line object to teacher
    this.updateLineIndex();
  };
}

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
        socket.emit('verify',true,'student',rooms);
      } else { // teacher
        socket.emit('verify',true,'teacher',rooms);
      }
    });
  });
  socket.on('new room',(name) => {
    socket.broadcast.emit('new room',name);
    rooms.push(name);
  });
  socket.on('announcement',(msg,sender) => {
    console.log('it works');
    socket.broadcast.emit('announcement',msg,sender);
  })
});
// http sever up and running confirmation
http.listen(port, function(){
  console.log('listening on *:' + port);
});
