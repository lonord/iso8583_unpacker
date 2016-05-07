// $(".bt-press").click(function(event){
//     var cover = [0,0,0,0.1];
//     var el = event.toElement;
//     var color = $(el).css("background");
//     if(!color||color.indexOf('rgb')!=0){
//         return;
//     }
//     var new_color = color.concat();
//     var ss = [];
//     var ii = 0;
//     for(var i = 0; i < new_color.length; i++){
//         if((new_color[i]=='('||new_color[i]==')'||new_color[i]==',')&&ii<i){
//             ss.push(new_color.substring(ii,i));
//             ss.push(new_color.substring(i,i+1));
//             ii=i+1;
//         }
//         if(i==new_color.length-1&&ii<i){
//             ss.push(new_color.substring(ii,i+1));
//         }
//     }
//     var r = parseInt(ss[2]);
//     var g = parseInt(ss[4]);
//     var b = parseInt(ss[6]);
//     var aa = 1-cover[3];
//     r=Math.floor(r*aa+cover[0]*cover[3]);
//     g=Math.floor(g*aa+cover[1]*cover[3]);
//     b=Math.floor(b*aa+cover[2]*cover[3]);
//     ss[2]=r+'';
//     ss[4]=g+'';
//     ss[6]=b+'';
//     var nc='';
//     for(var i=0;i<ss.length;i++){
//         nc+=ss[i];
//     }
//     $(el).css("background",nc);
//     setTimeout(function(){
//         $(el).css("background",color);
//     },300);
// });


var origin_color;
$(".bt-press").mousedown(function(event){
    if(event.which!=1){
        return;
    }
    var cover = [0,0,0,0.1];
    var el = event.toElement;
    var color = $(el).css("background");
    origin_color = color;
    if(!color||color.indexOf('rgb')!=0){
        return;
    }
    var new_color = color.concat();
    var ss = [];
    var ii = 0;
    for(var i = 0; i < new_color.length; i++){
        if((new_color[i]=='('||new_color[i]==')'||new_color[i]==',')&&ii<i){
            ss.push(new_color.substring(ii,i));
            ss.push(new_color.substring(i,i+1));
            ii=i+1;
        }
        if(i==new_color.length-1&&ii<i){
            ss.push(new_color.substring(ii,i+1));
        }
    }
    var r = parseInt(ss[2]);
    var g = parseInt(ss[4]);
    var b = parseInt(ss[6]);
    var aa = 1-cover[3];
    r=Math.floor(r*aa+cover[0]*cover[3]);
    g=Math.floor(g*aa+cover[1]*cover[3]);
    b=Math.floor(b*aa+cover[2]*cover[3]);
    ss[2]=r+'';
    ss[4]=g+'';
    ss[6]=b+'';
    var nc='';
    for(var i=0;i<ss.length;i++){
        nc+=ss[i];
    }
    $(el).css("background",nc);
});

$(".bt-press").mouseup(function(event){
    if(event.which!=1){
        return;
    }
    var el = event.toElement;
    $(el).css("background",origin_color);
});
