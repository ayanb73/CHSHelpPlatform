// socket.io
var socket = io();
// google sign in
function onSignIn(googleUser) {
  // client-side name
  var profile = googleUser.getBasicProfile();

  // backend domain verification
  var id_token = googleUser.getAuthResponse().id_token;
  socket.emit('verify', id_token);
  socket.on('verify', function(bool, occupation){
    vm.signedIn = true;
    if (bool) {
      var prx = profile.getName();
      vm.my.name = prx;
    }
    if (occupation == "teacher") {
      vm.student.is = false;
      vm.teacher.is = true;
      vm.my.occupation = "teacher";
    } else if (occupation == "student") {
      vm.student.is = true;
      vm.teacher.is = false;
      vm.my.occupation = "student"
    }
  });
}

// new socket event with specific eventID


// live rooms update
socket.on('live rooms update', (array) => {
  if (array.includes('Alg1')) {
    vm.liveRooms.Alg1 = true;
  } else {vm.liveRooms.Alg1 = false;}
  if (array.includes('Geo')) {
    vm.liveRooms.Geo = true;
  } else {vm.liveRooms.Geo = false;}
});

// message updating outside of vue instance
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

socket.on('line-message', (eventID,msg,room,sender) => {
  if (sender.occupation == 'teacher') {
    // student stuff
    $('#'+eventID).append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+vm.my.name+"</span><br>"+msg+"</div>");
  } else if (sender.occupation == 'student') {
    // teacher stuff
    $('#'+eventID).append("<div>"+"From: <span>"+sender.name+"</span> To: <span>"+vm.my.name+"</span><br>"+msg+"</div>");
  }
});

// vue.js app
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
        currentInput: "",
        currentReply: "",
        currentLines: [],
        currentStudent: {}
      },
      Geo: {
        currentInput: "",
        currentReply: "",
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
      socket.emit('joinRequest',room,this.my);
      switch(room) {
        case 'Alg1':
          this.connections.Alg1 = true;
          break;
        case 'Geo':
          this.connections.Geo = true;
          break;
      }
    },
    leaveRoom: function(room) {
      socket.emit('leaveRequest',room,this.my);
      switch(room) {
        case 'Alg1':
          this.connections.Alg1 = false;
          break;
        case 'Geo':
          this.connections.Geo = false;
          break;
      }
    },
    message: function(msg,room) {
      socket.emit('msg',msg,room,this.my);
    },
    helpMe: function(room) {
      socket.emit('help req',room,this.my);
    },
    lineMessage: function(eventID,msg,room) {
      socket.emit('line-message',eventID,msg,room,this.my);
      $('#'+eventID).append("<div>"+"From: <span>"+this.my.name+"</span> To: <span>"+room+"</span><br>"+msg+"</div>");
    }
  }
});
