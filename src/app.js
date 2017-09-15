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
  socket.on('verify', function(bool, occupation, rooms){ // server responds
    vm.signedIn = true;
    if (bool) {
      var prx = profile.getName();
      vm.my.name = prx;
    }
    if (occupation == "teacher") { // what happens if server determines teacher
      vm.student.is = false;
      vm.teacher.is = true;
      vm.my.occupation = "teacher";
      vm.rooms = rooms;
    } else if (occupation == "student") { // what happens if server determines student
      vm.student.is = true;
      vm.teacher.is = false;
      vm.my.occupation = "student";
      vm.rooms = rooms;
    }
  });
}

// vue.js app, which dynamically controls most parrts of the application
var vm = new Vue({
  el: '#app',
  data: {
    my: {
      name: "",
      occupation: ""
    },
    rooms: [],
    signedIn: false,
    student: {
      is: false
    },
    teacher: {
      is: false
    }
  },
  methods: {
    newRoom: function(name) {
      socket.emit('new room',{name: name});
      this.rooms.push({name: name});
    },
    announce: function(message) {
      socket.emit('announcement',message,this.my.name);
      $('#app').prepend('<div class="alert alert-info alert-dismissable fade in"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>' + this.my.name + ': </strong>' + message + '</div>');
    }
  },
  mounted: function() {
    socket.on('new room',(room) => {
      this.rooms.push(room);
    });
    socket.on('announcement',(msg,sender) => {
      $('#app').prepend('<div class="alert alert-info alert-dismissable fade in"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>' + sender + ': </strong>' + msg + '</div>');
    });
  }
});
