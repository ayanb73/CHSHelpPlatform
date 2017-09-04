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
      $('#TeacherAlg1ChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+sender.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
      $('#StudentAlg1ChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+sender.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
      break;
    case 'Geo':
      $('#TeacherGeoChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+sender.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
      $('#StudentGeoChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+sender.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
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
  socket.on(newLine.lineID,(msg,room,student) => {
    if (vm.my.occupation == "student") {
      switch(room) {
        case 'Alg1':
          $('#'+newLine.lineID).append("<div class='helpMsg'>"+"From: <span class='senderName'>"+student.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
          break;
        case 'Geo':
          $('#'+newLine.lineID).append("<div class='helpMsg'>"+"From: <span class='senderName'>"+student.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
          break;
      }
    } else if (vm.my.occupation == "teacher") {
      switch(room) {
        case 'Alg1':
          $('#'+newLine.lineID).append("<div class='helpMsg'>"+"From: <span class='senderName'>"+student.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
          break;
        case 'Geo':
          $('#'+newLine.lineID).append("<div class='helpMsg'>"+"From: <span class='senderName'>"+student.name+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
          break;
      }
    }
  });
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
        currentLines: []
      },
      Geo: {
        currentInput: "",
        currentReply: "",
        currentLines: []
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
    lineMessage: function(eventID,ques) {
      socket.emit(eventID,ques,this.my);
    }
  }
});
