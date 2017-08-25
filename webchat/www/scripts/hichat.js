window.onload=function(){
//实例并初始化hichat程序
	var hichat=new HiChat();
	hichat.init();
}

//定义hichat类
var HiChat=function(){
	this.socket=null;
}

//向原型添加业务方法
HiChat.prototype={
	init:function(){//此方法初始化程序
		var that=this;
		//建立到服务器的socket连接
		this.socket=io.connect();
		//监听socket的connect事件,此事件表达式已经建立连接
		this.socket.on('connect',function(){
			//连接到服务器后,显示昵称输入框
			document.getElementById('info').style.display='block';
			document.getElementById('nickWrapper').style.display='block';
			document.getElementById('nicknameInput').focus();
		})


		document.getElementById('loginBtn').addEventListener('click',function(){//昵称设置的确定按钮
			var nickName=document.getElementById('nicknameInput').value;
			if(nickName.trim().length!=0){
				that.socket.emit('login',nickName);
			}else{
				document.getElementById('nicknameInput').focus();
			}
		},false);
		this.socket.on('loginSuccess',function(){//登录成功
			document.title='hichat |'+document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display='none';//昵称输入块隐藏
			document.getElementById('messageInput').focus();//消息输入框获取焦点
		})
		
		
		this.socket.on('system',function(nickName,userCount,type){//系统消息通知
			var msg=nickName+(type=='login'?' joined':' left');//状态加入或是退出
			var p=document.createElement('p');
			p.textContent=msg;
			document.getElementById('historyMsg').appendChild(p);//用户状态消息推送
			that._displayNewMessage('system',msg,'red');
			document.getElementById('status').textContent=userCount+(userCount>1?' users':' user')+' online';//用户在线人数信息
		})
		
		
		document.getElementById('sendBtn').addEventListener('click',function(){
			var messageInput=document.getElementById('messageInput'),
				msg=messageInput.value;
			color=document.getElementById('colorStyle').value;
			messageInput.value='';
			messageInput.focus();
			if(msg.trim().length!=0){
				that.socket.emit('postMsg',msg,color);//消息推送到服务器
				that._displayNewMessage('me',msg,color);//消息显示到自己窗口中
			}
		},false)
		
		document.getElementById('sendImage').addEventListener('change',function(){//图片消息
			if(this.files.length!=0){
				var file=this.files[0],
					reader=new FileReader();
				if(!reader){
					that._displayNewMessage('system','! your browser doesn\'t support fileReader','red');
					that.value='';
					return;
				}
				reader.onload=function(e){
					this.value='';
					that.socket.emit('img',e.target.result);
					that._displayImage('me',e.target.result);
				}
				reader.readAsDataURL(file);
			}
		},false);
		
		this.socket.on('newMsg',function(user,msg,color){
			this._displayNewMessage(user,msg,color);
		})
		
		this.socket.on('newImg',function(user,img){
			this._displayImage(user,img);
		})
		
		
		//表情包
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click',function(e){
			var emojiwrapper=document.getElementById('emojiWrapper');
			emojiwrapper.style.display='block';
			e.stopPropagation();
		},false);
		document.body.addEventListener('click',function(e){
			var emojiwrapper=document.getElementById('emojiWrapper');
			if(e.target!=emojiwrapper){
				emojiwrapper.style.display='none';
			}
		})
		document.getElementById('emojiWrapper').addEventListener('click',function(e){
			var target=e.target;
			if(target.nodeName.toLowerCase()=='img'){
				var messageInput=document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value=messageInput.value+'[emoji:'+target.title+']';
			}
		},false);
		
		
		//按键操作
		document.getElementById('nicknameInput').addEventListener("keyup",function(e){
			if(e.keyCode==13){
				var nickName=document.getElementById('nicknameInput').value;
				if(nickName.trim().length!=0){
					that.socket.emit('login',nickName);
				}
			}
		},false);
		document.getElementById('messageInput').addEventListener('keyup',function(e){
			var messageInput=document.getElementById('messageInput'),
				msg=messageInput.value,
				color=document.getElementById('colorStyle').value;
			if(e.keyCode==13&&msg.trim().length!=0){
				messageInput.value='';
				that.socket.emit('postMsg',msg,color);
				that._displayNewMessage('me',msg,color);
			}e
		},false);
		document.getElementById('clearBtn').addEventListener('click',function(e){
			document.getElementById('historyMsg').innerHTML="";
			console.log(document.getElementById('historyMsg').innerHTML)
		},false);
		
	},
	_displayNewMessage:function(user,msg,color){//聊天消息推送
		var container=document.getElementById('historyMsg');
		var msgToDisplay=document.createElement('p');
		var date=new Date().toTimeString().substr(0,8);
		msg=this._showEmoji(msg);
		msgToDisplay.style.color=color||'#000';		
		msgToDisplay.innerHTML=user+' <span class="timespan">('+date+') : </span>'+msg;
		container.appendChild(msgToDisplay);
		container.scrollTop=container.scrollHeight;
	},
	_displayImage:function(user,imgData,color){//图片消息推送
		var container=document.getElementById('historyMsg');
		var msgToDisplay=document.createElement('p');
		var date=new Date().toTimeString().substr(0,8);
		msgToDisplay.style.color=color||'#000';
		msgToDisplay.innerHTML=user+' <span class="timespan">('+date+') : </span><br/>'+'<a href="'+imgData+'" target="_blank" style="display:block;"><img src="'+imgData+'"/></a>';
		container.appendChild(msgToDisplay);
		container.scrollTop=container.scrollHeight;
	},
	_initialEmoji:function(){//表情包初始化
		var emojiContainer=document.getElementById('emojiWrapper'),
			docFragment=document.createDocumentFragment();
		for(var i=69;i>0;i--){
			var emojiItem=document.createElement('img');
			emojiItem.src='../content/emoji/'+i+'.gif';
			emojiItem.title=i;
			docFragment.appendChild(emojiItem);
		}
		emojiContainer.appendChild(docFragment);
	},
	_showEmoji:function(msg){
		var match,
			result=msg,
			reg=/\[emoji:\d+\]/g,
			emojiIndex,
			totalEmojiNum=document.getElementById('emojiWrapper').children.length;
		while(match=reg.exec(msg)){
			emojiIndex=match[0].slice(7,-1);
			if(emojiIndex>totalEmojiNum){
				result=result.replace(match[0],'[X]');
			}else{
				result=result.replace(match[0],'<img class="emoji" src="../content/emoji/'+emojiIndex+'.gif"/>');
			}
			
		}
		return result;	
	}
}