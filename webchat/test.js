var express=require('express');
var app=express();
var path=require('path');
var server=require('http').createServer(app);
var io=require('socket.io').listen(server);
var user=[];
app.use('/',express.static(__dirname+'/www/'));
app.get('/', function(req, res) {	
	res.sendFile(path.join(__dirname+"/www/index.html"));
//	res.send("/index.html");
})
server.listen(3000,function(){
	console.log('server has start');
})
io.on('connection',function(socket){
	socket.on('login',function(nickname){
		if(user.indexOf(nickname)>-1){
			socket.emit('nickExisted');//用户存在执行
		}else{
			user.push(nickname);
			socket.userIndex=user.length;//在线人数统计
			socket.nickname=nickname;
			socket.emit('loginSuccess');
			socket.emit('system',nickname,user.length,'login');//向所有连接到服务器的客户端发送当前登录用户的昵称
		}
	})
	socket.on('disconnect',function(){
		user.splice(socket.userIndex,1);//将断开连接用户删除
		socket.broadcast.emit('system',socket.nickname,user.length,'llogout');//通知自己以外所有人
	})
	socket.on('postMsg',function(msg){
		socket.broadcast.emit('newMsg',socket.nickname,msg);
	})
	socket.on('img',function(imgData){
		socket.broadcast.emit('newImg',socket.nickname,imgData);
	})
})
