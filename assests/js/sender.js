$(function () {

    var socket=io();

    var RWS = 0;
    var FPS = 0;
    var SEQ = 0;
    var lastFrame=0;
    var lastACKSeq=-1;
    var totalAck=0;
    var buffer=[];
    var timeOut=0;
    var timeOutInterval=0;

    var frameSVG = "<svg height='30' width='150'>" +
        "<g stroke='black' stroke-width='1'>" +
        "<rect x='0' y='0' height='30' width='130' fill='yellow'></rect>" +
        "<line x1='50' y1='0' x2='50' y2='30'></line>" +
        "<line x1='100' y1='0' x2='100' y2='30'></line>" +
        "<text id='type' x='10' y='20' >ACK</text>" +
        "<text id='data' x='60' y='20' >DATA</text>" +
        "<text id='seq' x='110' y='20' >0</text>" +
        "<g>" +
        "</svg>";

    var totalFrames=0;
    var Frame = function (type, data, seq) {
        var frame = new Object();
        frame.type = type;
        frame.data = data;
        frame.seq = seq;

        return frame;
    }

    var frames = $("ul#frames");
    var ackFrames = $("ul#ackframes");    
    var listSelector = "li#";

    var frame = new Frame("DATA", "Hi", 0);

    function getListItem(seq) {
        return frames.find(listSelector + seq);
    }

    function addFrame(frame,append=false) {
        var listTag = "<li id='" + totalFrames + "' seq='"+ frame.seq + "'>" + frameSVG + " </li>";
        if(append==true){
             frames.append(listTag);
        }
        else{
             frames.prepend(listTag);
        }
        var list = getListItem(totalFrames);
        list.find("#data").text(frame.data);
        list.find("#seq").text(frame.seq);
        list.find("#type").text(frame.type);
        totalFrames=totalFrames+1;
    }

    function moveFrame(seq) {
        var list = getListItem(seq);
        list.animate({ "margin-left": "+=75%" }, 5000, function () {
            var frame=new Frame("DATA",list.find("#data").text(),list.attr('seq'));
            list.remove();
            socket.emit('snd',frame); //emit the frame
            buffer[buffer.length]=frame;
            if(lastFrame==2){
                timeOutInterval=setInterval(function(){
                    var time=$("#timer").text();
                    time=parseInt(time)+1;
                    $("#timer").text(time);
                },1000);
                timeOut=setTimeout(function(){
                    clearInterval(timeOutInterval);
                    $("#timer").text("0");
                    for(i=0;i<RWS;i++){
                        addFrame(buffer[i],true);
                    }
                    totalAck = parseInt(totalAck)+parseInt(RWS);
                    $("#btnSend").trigger('click');
                },6000);
            }
            lastFrame=lastFrame+1;
            console.log(buffer);
        });

    }
    function rcvFrame(frame){
        ackFrames.append("<li style='margin-left:75%'> " + frameSVG + "</li>");
        var list = ackFrames.find("li");
        list.find("#data").text(frame.data);
        list.find("#seq").text(frame.seq);
        list.find("#type").text(frame.type);
        list.animate({'margin-left':'0%'},2000,function(){
            list.animate({opacity:'0'},500,function(){
                list.remove();
                if(frame.type=="ACK"){
                    var noACKframes=parseInt(frame.seq)-parseInt(lastACKSeq);
                    totalAck=parseInt(totalAck)+parseInt(noACKframes);
                    for(i=0;i<noACKframes;i++){
                        buffer.shift();
                    }
                    console.log(buffer);
                    lastACKSeq=frame.seq;
                }
                else if(frame.type=="NACK"){
                    var noErrorFrames=parseInt(frame.seq)+1;
                    totalAck=parseInt(totalAck)+noErrorFrames;
                    for(i=0;i<noErrorFrames;i++){
                        addFrame(buffer[i],true);
                    }
                }
                $("#btnSend").trigger('click');
            });
        });
    }
     $("#btnSet").on('click', function (evt) {
        if ($("#rws").val() != "" && $("#fps").val() != "") {
            RWS = $("#rws").val();
            FPS = $("#fps").val();
        }
        else {
            alert("Fields can't be empty");
        }
    });
    $("#btnAdd").on('click', function (evt) {
        var frame = {};

        if ($("#frame-data").val() != "") {
            if ($("#frame-seq").val() == "") {
                frame = new Frame("DATA", $("#frame-data").val(), SEQ);
                SEQ=(SEQ+1)%RWS;
            }
            else {
                frame = new Frame("DATA", $("#frame-data").val(), $("#frame-seq").val());
            }
            $("#frame-seq").val("");
            $("#frame-data").val("");
            addFrame(frame);
        }
        else {
            alert("Data can't be empty");
        }
    });
    $("#btnSend").on('click',function(evt){
        var interval=FPS/1000;
        var timer=setInterval(function(){
            var rem=lastFrame-totalAck;
            console.log(rem+":"+RWS);
            if(rem==RWS){
                clearInterval(timer);
                return;
            }
            var listItem=frames.children("li").last();
            moveFrame(listItem.attr('id'));
        },interval);
    });
    socket.on('rcvack',function(frame){
        rcvFrame(frame);
    });
    socket.on('out_order_snt',function(){
        lastFrame=lastFrame-1;
    });
});
