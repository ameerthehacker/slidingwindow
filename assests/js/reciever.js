$(function () {

    var socket = io();
    var lastFrame = -1;
    var validFrame = false;
    var out_order=false;
    var RWS = 0;
    var NACK = { state: false, seq: 0 };

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
    var totalFrames = 0;

    var frame = new Frame("DATA", "Hi", 0);

    function getListItem(seq) {
        return frames.find(listSelector + seq);
    }

    function addFrame(frame, append = false) {
        var listTag = "<li id='" + totalFrames + "' seq='" + frame.seq + "'>" + frameSVG + " </li>";
        if (append == true) {
            frames.append(listTag);
        }
        else {
            frames.prepend(listTag);
        }
        var list = getListItem(totalFrames);
        list.find("#data").text(frame.data);
        list.find("#seq").text(frame.seq);
        list.find("#type").text(frame.type);
    }

    function moveFrame(seq) {
        var list = getListItem(seq);
        list.animate({ "margin-left": "+=70%" }, 5000, function () {
            if (!validFrame) {
                list.animate({ opacity: '0' }, 1000, function () {
                    $(this).remove();
                    if(out_order){
                        socket.emit('out_order_rcv');                        
                    }
                });
            }
        });
        totalFrames = totalFrames + 1;
    }
    $("#btnSet").on('click', function (evt) {
        if ($("#rws").val() != "") {
            RWS = $("#rws").val();
        }
        else {
            alert("Fields can't be empty");
        }
    });
    function rmFrames(seq) {
        var lists = frames.children("li");
        var listsArray = [];
        lists.each(function (index) {
            listsArray.push($(this));
        });
        listsArray.reverse();
        for (i = 0; i <listsArray.length; i++) {
            if (seq > listsArray[i].attr('seq')) {
                listsArray[i].animate({ opacity: 0 }, 500, function () {
                    $(this).remove();
                });
            }
            else if (seq == listsArray[i].attr('seq')) {
                listsArray[i].animate({ opacity: 0 }, 500, function () {
                    $(this).remove();
                });
                break;
            }
        }
    }
    function sendFrame(frame) {
        ackFrames.append("<li style='margin-left:75%'> " + frameSVG + "</li>");
        var list = ackFrames.find("li");
        list.find("#data").text(frame.data);
        list.find("#seq").text(frame.seq);
        list.find("#type").text(frame.type);
        list.animate({ 'margin-left': '0%' }, 2000, function () {
            list.animate({ opacity: '0' }, 500, function () {
                list.remove();
                socket.emit('sndack', frame);
                rmFrames(frame.seq);
            });
        });
    }
    $("#btnSend").on('click', function () {
        if ($("#frame-type").val() != "" && $("#frame-seq").val() != "") {
            var frame = new Frame($("#frame-type").val(), "", $("#frame-seq").val());
            if ($("#frame-type").val() == "NACK") {
                rmFrames(frame.seq);
                NACK.state = true;
                NACK.seq = frame.seq;
            }
            sendFrame(frame);
            $("#frame-type").val("");
            $("#frame-seq").val("");
        }
        else {
            alert("Fields can't be empty");
        }
    });

    socket.on('rcv', function (frame) {
        var newFrame = (parseInt(lastFrame) + 1) % RWS;
        console.log(frame.seq + ":" + newFrame);
        if (NACK.state == true) {
            if(frame.seq==NACK.seq){
                validFrame=true;
                if(NACK.seq==0){
                    NACK.state=false;
                }
                NACK.seq=NACK.seq-1;
            }
            else{
                validFrame=false;
                var out_order=true;
            }
            addFrame(frame,true);
        }
        else {
            if(frames.children("li").length-1==RWS){
                validFrame=false;
            }
            else{
                if (frame.seq == newFrame) {
                    validFrame = true;
                    lastFrame = frame.seq;
                }
                else {
                    validFrame = false;
                    out_order=true;
                }
            }
            addFrame(frame);
        }
        moveFrame(totalFrames);
    });
});
