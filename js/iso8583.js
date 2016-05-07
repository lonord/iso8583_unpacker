// TYPE
var ASC = 1;
var BCD = 2;
var R_BCD = 3;
var BIN = 4;
var UTF8 = 5;
// LEN
var LLVAR = -1;
var LLLVAR = -2;
//var FIX = n


var iso8583 = function(){
    
    this.loadPackage=function(data){
        if(typeof(data)=='string'){
            var buf = stringToBuffer(data);
            if(buf){
                this.data = buf;
            }
        }
        else if(data instanceof Uint8Array){
            this.data = data;
        }
        else{
            throw new Error('loadData data只能为string或UInt8Array');
        }
    };
    
    // format [ {field:3,type:ASC,len:8},{field:4,type:BCD,len:8} ]
    this.setFormatTable=function(format){
        if(format&&typeof(format)=='string'){
            var json = JSON.parse(format);
            if(json&&(json instanceof Array)){
                for(var i=0; i < json.length; i++ ){
                    var item = json[i];
                    field[item.field] = {type:item.type,len:item.len};
                }
            }
        }
        else if(format&&typeof(format)=='object'){
            for(var i=0; i < format.length; i++ ){
                var item = format[i];
                field[item.field] = {type:item.type,len:item.len};
            }
        }
    };
    
    this.unpack=function(){
        var result = {};
        try{
            var iso = this.data;
            var len = iso[0]*256 + iso[1];
            result.TPDU = bufferToString(iso,2,7);
            result.header = bufferToString(iso,7,13);
            result.msg = bufferToString(iso,13,15);
            result.field = [];
            var index = 23;
            for(var i = 0; i < 8; i++ ){
                var bitmask = 0x80;
                for (var j = 0; j < 8; j++, bitmask >>= 1 ){
                    if (i == 0 && bitmask == 0x80){
                        continue;
                    }
                    if ((iso[i+15] & bitmask)==0){
                        continue;
                    }
                    var n = (i<<3) + j + 1;
                    var dataLen = 0;
                    var offset = index;
                    var fm = field[n];
                    if(fm.len == LLVAR){
                        dataLen = parseInt(bufferToString(iso, offset, offset + 1));
                        offset += 1;
                    }
                    else if(fm.len == LLLVAR){
                        dataLen = parseInt(bufferToString(iso, offset, offset + 2));
                        offset += 2;
                    }
                    else{
                        dataLen = fm.len;
                    }
                    if(fm.type == ASC){
                        var f = {};
                        f.n = n;
                        f.len = dataLen;
                        f.content = stringFromBuffer(iso, offset, offset + dataLen);
                        result.field.push(f);
                        offset += dataLen;
                    }
                    else if(fm.type == BCD){
                        var f = {};
                        f.n = n;
                        f.len = dataLen;
                        f.content = bufferToString(iso, offset, offset + toIntp(dataLen/2));
                        if(f.content.length == f.len + 1){
                            f.content = f.content.substring(0, f.content.length - 1);
                        }
                        result.field.push(f);
                        offset += toIntp(dataLen/2);
                    }
                    else if(fm.type == R_BCD){
                        var f = {};
                        f.n = n;
                        f.len = dataLen;
                        f.content = bufferToString(iso, offset, offset + toIntp(dataLen/2));
                        if(f.content.length == f.len + 1){
                            f.content = f.content.substring(1, f.content.length);
                        }
                        result.field.push(f);
                        offset += toIntp(dataLen/2);
                    }
                    else if(fm.type == BIN){
                        var f = {};
                        f.n = n;
                        f.len = dataLen;
                        f.content = bufferToString(iso, offset, offset + dataLen);
                        result.field.push(f);
                        offset += dataLen;
                    }
                    else if(fm.type == UTF8){
                        var f = {};
                        f.n = n;
                        f.len = dataLen;
                        f.content = utf8StringFromBuffer(iso, offset, offset + dataLen);
                        result.field.push(f);
                        offset += dataLen;
                    }
                    else{
                        throw new Error('域信息错误:' + n + '域 type:' + fm.type + ' len:' + fm.len);
                    }
                    if(offset > len + 2){
                        throw new Error('8583解包错误:' + n + '域长度错误');
                    }
                    index = offset;
                }
            }
            return result;
        }
        catch(e){
            result.err = e;
            return result;
        }
    };
    
    var field = deepCopy(ISO8583_FIELD);
    if(arguments.length>0){
        var arg1 = arguments[0];
        this.loadPackage(arg1);
    }
    if(arguments.length>1){
        var arg2 = arguments[1];
        this.setFormatTable(arg2);
    }
    
};

var stringFromBuffer=function(){
    if(arguments.length==0||!(arguments[0] instanceof Uint8Array)){
        return null;
    }
    var buf = arguments[0];
    var start = 0, end = buf.length;
    if(arguments.length >= 3){
        end = arguments[2];
    }
    if(arguments.length >= 2){
        start = arguments[1];
    }
    var str = '';
    for(var i = start; i < end; i++ ){
        var item = buf[i];
        str += String.fromCharCode(item);
    }
    return str;
}

var utf8StringFromBuffer=function(){
    var str = '';
    var start = 0;
    var end = 0;
    if(arguments.length==0&&!(arguments[0] instanceof Uint8Array)){
        return null;
    }
    var buf = arguments[0];
    end = buf.length;
    if(arguments.length>=3){
        end = arguments[2];
    }
    if(arguments.length>=2){
        start = arguments[1];
    }
    for(var i = start; i < end; i++ ){
        var item = buf[i];
        var h = toInt(item/16);
        var l = item%16;
        if(h>9){
            str += String.fromCharCode(h + 55);
        }
        else{
            str += String.fromCharCode(h + 48);
        }
        if(l>9){
            str += String.fromCharCode(l + 55);
        }
        else{
            str += String.fromCharCode(l + 48);
        }
    }
    str = str.replace(/([A-F0-9]{2})/gi,'%$1');
    return decodeURI(str);
}

var deepCopy= function(source) {
    var result={};
    for (var key in source) {
        result[key] = typeof source[key]==='object'? deepCopy(source[key]): source[key];
    }
    return result; 
}

var stringToBuffer=function(str){
    if(!str||typeof(str)!='string'||str.length<=0){
        return null;
    }
    if(str.length%2!=0){
        str=str+'0';
    }
    var buf = new Uint8Array(toInt(str.length/2));
    for(var i=0; i < str.length; i+=2 ){
        var h = str.charCodeAt(i);
        var l = str.charCodeAt(i+1);
        var v = 0;
        if(h>=65&&h<=70){
            v += h-55;
        }
        else if(h>=97&&h<=102){
            v += h-87;
        }
        else if(h>=48&&h<=57){
            v += h-48;
        }
        v = v * 16;
        if(l>=65&&l<=70){
            v += l-55;
        }
        else if(l>=97&&l<=102){
            v += l-87;
        }
        else if(l>=48&&l<=57){
            v += l-48;
        }
        buf[toInt(i/2)] = v;
    }
    return buf;
};

var bufferToString=function(){
    var str = '';
    var start = 0;
    var end = 0;
    if(arguments.length==0&&!(arguments[0] instanceof Uint8Array)){
        return null;
    }
    var buf = arguments[0];
    end = buf.length;
    if(arguments.length>=3){
        end = arguments[2];
    }
    if(arguments.length>=2){
        start = arguments[1];
    }
    for(var i = start; i < end; i++ ){
        var item = buf[i];
        var h = toInt(item/16);
        var l = item%16;
        if(h>9){
            str += String.fromCharCode(h + 55);
        }
        else{
            str += String.fromCharCode(h + 48);
        }
        if(l>9){
            str += String.fromCharCode(l + 55);
        }
        else{
            str += String.fromCharCode(l + 48);
        }
    }
    return str;
}

var toInt=function(n){
    return Math.floor(n);
}

var toIntp=function(n){
    return Math.ceil(n);
}

var ISO8583_FIELD = [
    {},
    {type:ASC,len:8},       // 1
    {type:BCD,len:LLVAR},   // 2
    {type:BCD,len:6},       // 3
    {type:BCD,len:12},      // 4
    {type:ASC,len:8},// 5
    {type:ASC,len:8},// 6
    {type:ASC,len:8},// 7
    {type:ASC,len:8},// 8
    {type:ASC,len:8},// 9
    {type:ASC,len:8},// 10
    {type:BCD,len:6},       // 11
    {type:BCD,len:6},       // 12
    {type:BCD,len:4},       // 13
    {type:BCD,len:4},       // 14
    {type:BCD,len:4},       // 15
    {type:ASC,len:8},// 16
    {type:ASC,len:8},// 17
    {type:ASC,len:8},// 18
    {type:ASC,len:8},// 19
    {type:ASC,len:8},// 20
    {type:ASC,len:8},// 21
    {type:BCD,len:3},       // 22
    {type:R_BCD,len:3},     // 23
    {type:ASC,len:8},// 24
    {type:BCD,len:2},       // 25
    {type:BCD,len:2},       // 26
    {type:ASC,len:8},// 27
    {type:ASC,len:8},// 28
    {type:ASC,len:8},// 29
    {type:ASC,len:8},// 30
    {type:ASC,len:8},// 31
    {type:BCD,len:LLVAR},   // 32
    {type:ASC,len:8},// 33
    {type:ASC,len:8},// 34
    {type:BCD,len:LLVAR},   // 35
    {type:BCD,len:LLLVAR},  // 36
    {type:ASC,len:12},      // 37
    {type:ASC,len:6},       // 38
    {type:ASC,len:2},       // 39
    {type:ASC,len:8},// 40
    {type:ASC,len:8},       // 41
    {type:ASC,len:15},      // 42
    {type:ASC,len:8},// 43
    {type:ASC,len:LLVAR},   // 44
    {type:ASC,len:8},// 45
    {type:ASC,len:8},// 46
    {type:ASC,len:8},// 47
    {type:BCD,len:LLLVAR},  // 48
    {type:ASC,len:3},       // 49
    {type:ASC,len:8},// 50
    {type:ASC,len:8},// 51
    {type:BIN,len:8},       // 52
    {type:BCD,len:16},      // 53
    {type:BCD,len:LLLVAR},  // 54
    {type:BIN,len:LLLVAR},  // 55
    {type:ASC,len:8},// 56
    {type:ASC,len:8},// 56
    {type:ASC,len:LLLVAR},  // 58
    {type:ASC,len:8},// 59
    {type:BCD,len:LLLVAR},  // 60
    {type:BCD,len:LLLVAR},  // 61
    {type:ASC,len:LLLVAR},  // 62
    {type:ASC,len:LLLVAR},  // 63
    {type:BIN,len:8}        // 64
];

iso8583.deepCopy = deepCopy;
iso8583.bufferToString = bufferToString;
iso8583.stringToBuffer = stringToBuffer;