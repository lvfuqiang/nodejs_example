var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var message = require('./lib/message.js')();
var message2 = require('./lib/message2.js')();
var bodyParser = require('body-parser');

//配置路由
var router = express.Router();

//配置访问静态文件
app.use(express.static('public'));
//配置解析json
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
});

io.on('connection', function(socket){
  
  //console.log('a user connected');

  //监听登录事件，将username与websocket连接加入到列表中
  socket.on('login', function(msg){
    console.log('user: ' + msg.username + ' login');
    message.onlineUsers[msg.username] = socket;
    message2.onlineUsers[msg.username] = socket;
    console.log('user online: ' + Object.keys(message.onlineUsers).length);
    io.sockets.emit('user login', 
      {'username': msg.username, 'data': 'user login'});//
    //向用户发送未发消息队列
    //message.sendMessagesWhenUserLogin(msg.username);
    message2.sendMessagesWhenUserLogin(msg.username);
  });

  //监听chat message事件
  socket.on('chat message', function(msg){
    console.log('message:' + msg);
    var users = msg.data.split(',');
    var content = 'random number: ' + Math.floor(Math.random()*1000);
    console.log('users: ' + users);
    //message.sendMessageToUsers(users, content);
    message2.sendMessageToUsers(users, content);
  });

  //监听断开连接事件，删除当前socket连接
  socket.on('disconnect', function(){
    for(var s in message.onlineUsers){
      if(message.onlineUsers[s] === socket){
        console.log('user:' + s + ' disconnect');
        io.sockets.emit('user disconnect', 
          {username: s, data: 'user disconnect'});
        delete message.onlineUsers[s];
        delete message2.onlineUsers[s];
      }
    }
    console.log('user online: ' + Object.keys(message.onlineUsers).length);
  });
  
  //监听回执receipt事件
  socket.on('receipt', function(msg){
    //收到回执，更新sendingMessages队列等
    //message.receiptMessage(msg.userID, msg.msgID);
    message2.receiptMessage(msg.userID, msg.msgID);
  });


});


//定时向每个连接发送一个随机数（证明非广播）
setInterval(function(){
  //console.log("5s tick");
  for(var s in message.onlineUsers){
    var num = Math.floor(Math.random()*1000);
    message.onlineUsers[s].emit('random number', {username: 'Server', data: num});
  }
}, 60000);

/**
 * REST接口，返回当前在线用户的id
 */
router.get('/onlineusers', function(req, res){
  res.json(message.getOnlineUsersID());
});

/**
 * REST接口，返回未发送消息列表
 */
router.get('/sendingMessages', function(req, res){
  res.json(message.sendingMessages);
});

/**
 * REST接口，返回已发送消息列表
 */
router.get('/sentMessages', function(req, res){
  res.json(message.sentMessages);
});

/**
 * REST接口，接收要发送的消息
 */
router.post('/message', function(req, res){
  var users = req.body.users;
  var content = req.body.content;
  if(message.sendMessageToUsers){
    //message.sendMessageToUsers(users, content);
    message2.sendMessageToUsers(users, content);
    res.sendStatus(200);
  } else {
    res.send({"error": "error info"});
  }
});



//所有接口使用api作为url的前缀
app.use('/api', router);

http.listen(3000, function(){
  console.log('listening on *: 3000');
});