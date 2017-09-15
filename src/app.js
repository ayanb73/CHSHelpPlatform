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
      socket.on('new room',(room) => {
        this.rooms.push(room);
      });
    }
  }
});
