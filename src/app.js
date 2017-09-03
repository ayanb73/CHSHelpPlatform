// next up, student side development

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
      vm.my.occupation = "teacher"
    } else if (occupation == "student") {
      vm.student.is = true;
      vm.teacher.is = false;
      vm.my.occupation = "student"
    }
  });
}

// live rooms update
socket.on('live rooms update', (array) => {
  vm.liveRooms = array;
})

// message updating outside of vue instance
socket.on('msg',(msg,room,sender) => {
  var displayName;
  if (sender.name == vm.name) {
    displayName = "Me";
  } else {displayName = sender.name;}
  switch(room) {
    case 'Alg1':
      $('#TeacherAlg1ChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+displayName+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
      break;
    case 'Geo':
      $('#TeacherGeoChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+displayName+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
      break;
  }
});

// build the student-teacher private message service, may need to include some new function,
// or something clever on the server-side

// vue.js app
var vm = new Vue({
  el: '#app',
  data: {
    my: {
      id: socket.id,
      name: "",
      occupation: ""
    },
    signedIn: false,
    connections: {Alg1: false, Geo: false},
    liveRooms: [],
    teacher: {
      is: false,
      Alg1: {
        currentInput: "",
        currentStudent: {}
      },
      Geo: {
        currentInput: "",
        currentStudent: {}
      }
    },
    student: {
      is: false,
      Alg1: {
        currentInput: "",
        currentTeacher: {}
      },
      Geo: {
        currentInput: "",
        currentTeacher: {}
      }
    }
  },
  methods: {
    joinRoom: function(ocup,room) {
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
    leaveRoom: function(ocup,room) {
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
    helpMe: function(msg,room) {

    }
  }
});
