/// <reference path="typings/index.d.ts" />

var http=require('http');
var express=require('express');
var app=express(http);


app.use('/assests',express.static(__dirname + '/assests'));

app.get('/',function(req,res){
    res.sendFile(__dirname + '/index.html');
});

app.listen(5555,function(){
    console.log('Listening on port 5555');
});

console.log('Server Started');