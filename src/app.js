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
      vm.name = prx;
    }
    if (occupation == "teacher") {
      vm.student.is = false;
      vm.teacher.is = true;
      vm.status = "teacher"
    } else if (occupation == "student") {
      vm.student.is = true;
      vm.teacher.is = false;
      vm.status = "student"
    }
  });
}

// rooms: 'Alg1', 'Geo'
socket.on('room update',(rm) => {
  switch(rm.key) {
    case 'Alg1':
      vm.teacher.Alg1.room = rm;
      break;
    case 'Geo':
      vm.teacher.Geo.room = rm;
      break;
  }
});
socket.on('names update', (names) => {
  vm.teacher.directory = names;
});
socket.on('live rooms update', (update) => {
  vm.student.liveRooms = update;
})

// message updating outside of vue instance
socket.on('msg',(msg,senderName,room) => {
  var displayName;
  if (senderName == vm.name) {
    displayName = "Me";
  } else {displayName = senderName;}
  switch(room) {
    case 'Alg1':
      $('#TeacherAlg1ChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+displayName+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
    case 'Geo':
      $('#TeacherGeoChatBox').append("<div class='genMsg'>"+"From: <span class='senderName'>"+displayName+"</span> To: <span class='roomName'>"+room+"</span><br>"+msg+"</div>");
  }
});

// vue.js app
var vm = new Vue({
  el: '#app',
  data: {
    name: "",
    status: "",
    signedIn: false,
    connections: {Alg1: false, Geo: false},
    teacher: {
      is: false,
      Alg1: {
        currentInput: "",
        conversations: [],
        room: {}
      },
      Geo: {
        currentInput: "",
        conversations: [],
        room: {}
      },
      directory: []
    },
    student: {
      is: false,
      liveRooms: {Alg1: false, Geo: false}
    }
  },
  methods: {
    joinRoom: function(ocup,room) {
      socket.emit('joinRequest',ocup,room);
      socket.on('joinReqResponse',(req,res) => {
        if (req) {
          this.room = res;
          if (res == 'Alg1') {
            this.connections.Alg1 = true;
          }
          if (res == 'Geo') {
            this.connections.Geo = true;
          }
        }
      });
    },
    leaveRoom: function(ocup,room) {
      socket.emit('leaveRequest',room,ocup);
      socket.on('leaveReqResponse', (bool,room) => {
        if (bool) {
          this.room = "";
          if (room == 'Alg1') {
            this.connections.Alg1 = false;
          }
          if (room == 'Geo') {
            this.connections.Geo = false;
          }
        }
      });
    },
    message: function(msg,room,sender) {
      socket.emit('msg',msg,room,socket.id);
    },
    helpMe: function(msg,room,sender) {
      socket.emit('help me',msg,room,socket.id);
    }
  }
});
