var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
});

io.on('connection', function(socket){
  
  //console.log('a user connected');

  //监听登录事件，将username与websocket连接加入到列表中
  socket.on('login', function(msg){
    console.log('user: ' + msg.username + ' login');
    var user = {};
    user.name = msg.username;
    user.socket = socket;
    users.push(user);
    console.log('user online: ' + users.length);
    io.sockets.emit('user login', 
      {'username': msg.username, 'data': 'user login'});//
  });

  //监听加入room事件
  socket.on('join', function(msg){
    console.log('user:' + msg.username + ' join room');
    socket.join(msg.username);
  });

  //监听chat message事件
  socket.on('chat message', function(msg){
    console.log('message:' + msg);
    io.sockets.emit('chat message', msg);
  });

  //监听断开连接事件，删除当前socket连接
  socket.on('disconnect', function(){
    for(var i=0; i<users.length; i++){
      if(users[i].socket === socket){
        console.log('user:' + users[i].name + ' disconnect');
        io.sockets.emit('user disconnect', 
          {username: users[i].name, data: 'user disconnect'});
        users.splice(i, 1);
      }
    }
    console.log('user online: ' + users.length);
  });


});


//每隔五秒向每个room发送一个随机数（证明非广播）
setInterval(function(){
  //console.log("5s tick");
  for(var i=0; i<users.length; i++){
    var room = users[i].name;
    var num = Math.floor(Math.random()*1000);
    console.log(room + ' ' + num);
    io.sockets.in(room).emit('random number', {username: 'Server', data: num});
  }
}, 60000);

http.listen(3000, function(){
  console.log('listening on *: 3000');
});