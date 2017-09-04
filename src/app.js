/*
Ayan Bhattacharjee
2017
*/

// iniatilizing socket.io-client
var socket = io();
// google sign in call back
function onSignIn(googleUser) {
  // client-side name
  var profile = googleUser.getBasicProfile();

  // backend domain verification
  var id_token = googleUser.getAuthResponse().id_token;
  socket.emit('verify', id_token); // sends id_token to server
  socket.on('verify', function(bool, occupation){ // server responds
    vm.signedIn = true;
    if (bool) {
      var prx = profile.getName();
      vm.my.name = prx;
    }
    if (occupation == "teacher") { // what happens if server determines teacher
      vm.student.is = false;
      vm.teacher.is = true;
      vm.my.occupation = "teacher";
    } else if (occupation == "student") { // what happens if server determines student
      vm.student.is = true;
      vm.teacher.is = false;
      vm.my.occupation = "student"
    }
  });
}

// live rooms update at 1000ms intervals from the server
socket.on('live rooms update', (array) => {
  if (array.includes('Alg1')) {
    vm.liveRooms.Alg1 = true;
  } else {vm.liveRooms.Alg1 = false;}
  if (array.includes('Geo')) {
    vm.liveRooms.Geo = true;
  } else {vm.liveRooms.Geo = false;}
});
// general messages, which are only sent by teachers, viewable by all
socket.on('msg',(msg,room,sender) => {
  switch(room) {
    case 'Alg1':
      $('#TeacherAlg1ChatBox').append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+room+"</span><br>"+msg+"</div>");
      $('#StudentAlg1ChatBox').append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+room+"</span><br>"+msg+"</div>");
      break;
    case 'Geo':
      $('#TeacherGeoChatBox').append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+room+"</span><br>"+msg+"</div>");
      $('#StudentGeoChatBox').append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+room+"</span><br>"+msg+"</div>");
      break;
  }
});
// establishes a new help-line of communcation between one teacher and one student in a room
socket.on('new-line',(newLine) => {
  if (vm.my.occupation == "teacher") {
    switch(newLine.room) {
      case 'Alg1':
        vm.teacher.Alg1.currentLines.push(newLine);
      case 'Geo':
        vm.teacher.Geo.currentLines.push(newLine);
    }
  } else if (vm.my.occupation == "student") {
    switch(newLine.room) {
      case 'Alg1':
        vm.student.Alg1.currentLine = newLine;
        vm.student.Alg1.hasLine = true;
      case 'Geo':
        vm.student.Geo.currentLine = newLine;
        vm.student.Geo.hasLine = true;
    }
  }
});
// a message on an established help-line
socket.on('line-message', (eventID,msg,room,sender) => {
  if (sender.occupation == 'teacher') {
    // student html, style difference
    $('#'+eventID).append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+vm.my.name+"</span><br>"+msg+"</div>");
  } else if (sender.occupation == 'student') {
    // teacher html, style difference
    $('#'+eventID).append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+vm.my.name+"</span><br>"+msg+"</div>");
  }
});

// vue.js app, which dynamically controls most parrts of the application
var vm = new Vue({
  el: '#app',
  data: {
    my: {
      name: "",
      occupation: ""
    },
    signedIn: false,
    connections: {Alg1: false, Geo: false},
    liveRooms: {Alg1: false, Geo: false},
    teacher: {
      is: false,
      Alg1: {
        currentInput: "", // general message
        currentReply: "", // line message
        currentLines: [],
        currentStudent: {}
      },
      Geo: {
        currentInput: "", // general message
        currentReply: "", // line message
        currentLines: [],
        currentStudent: {}
      }
    },
    student: {
      is: false,
      Alg1: {
        currentInput: "",
        currentLine: {},
        hasLine: false
      },
      Geo: {
        currentInput: "",
        currentLine: {},
        hasLine: false
      }
    }
  },
  methods: {
    joinRoom: function(room) {
      socket.emit('joinRequest',room,this.my); // joins a room on the server
      switch(room) { // adjusts boolean on client
        case 'Alg1':
          this.connections.Alg1 = true;
          break;
        case 'Geo':
          this.connections.Geo = true;
          break;
      }
    },
    leaveRoom: function(room) {
      socket.emit('leaveRequest',room,this.my); // leaves a room on the server
      switch(room) { // adjusts boolean on client
        case 'Alg1':
          this.connections.Alg1 = false;
          break;
        case 'Geo':
          this.connections.Geo = false;
          break;
      }
    },
    message: function(msg,room) {
      socket.emit('msg',msg,room,this.my); // method for general room message
    },
    helpMe: function(room) {
      socket.emit('help req',room,this.my); // help-line request, teacher only
    },
    lineMessage: function(eventID,msg,room) {
      socket.emit('line-message',eventID,msg,room,this.my); // line message on help, adjusts client html
      $('#'+eventID).append("<div>"+"From: <span>"+this.my.name+"</span><br>"+msg+"</div>");
    }
  }
});
