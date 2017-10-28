var express=require('express');
var app=express();
var http=require('http').Server(app);
var clients=require('socket.io')(http);

clients.on('connection',function(client){
    console.log('Some one connected');
    client.on('snd',function(frame){
        clients.emit('rcv',frame);
    });
    client.on('sndack',function(frame){
        clients.emit('rcvack',frame);
    });
    client.on('out_order_rcv',function(){
        clients.emit('out_order_snt',{});
    });
});


app.use('/assests',express.static(__dirname + '/assests'));

app.get('/sender',function(req,res){
    res.sendFile(__dirname + '/sender.html');
});

app.get('/reciever',function(req,res){
    res.sendFile(__dirname + '/reciever.html');
});

http.listen(process.env.PORT||5555,function(){
    console.log('Listening on port 5555');
});

console.log('Server Started');
