
//region Ініціалізація допоміжних функцій
if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function (str){
        return this.indexOf(str) == 0;
    };
}
//endregion

/**
 * @param {Number} d
 * @return {string}
 */
function DexToHex(d) {
    return d.toString(16);
}

/**
 *
 * @param {String} h
 * @returns {Number}
 */
function HexToDex(h) {
    return parseInt(h,16);
}

/**
 * @param {Number} d
 * @return {string}
 */
function DexToBin(d){
    return d.toString(2);
}

/**
 *
 * @param {String} b
 * @returns {Number}
 */
function BinToDex(b){
    return parseInt(b,2);
}

/**
 *
 * @param {Number} d
 * @param {Number} count
 * @return {String}
 */
function DexToFillBin(d,count){
    if(typeof d == "string"){
        d = parseInt(d,10);
    }
    var b = d.toString(2);
    
    var length = b.length;
    if (length>count){
        b = b.substring(0,count);
    }
    if (length<count){
        b = generateString(count-length,'0') + b;
    }
    return b;
}

/**
 *
 * @param {Number} length
 * @param {String} symbol
 * @return {String}
 */
function generateString(length,symbol){
    var result = "";
    for (var i=0;i<length;i++){
        result+=symbol;
    }
    return result;
}
/**
 *
 * @param {String} b
 * @return {String}
 */
function BinToViewBin(b){
    var lastIndex = b.length-1;
    var result = "";
    for (var i = 0;i< b.length;i++){
        if (i%4==0 && i!=lastIndex && i!=0){
            result+=" ";
        }
        result+= b[i];
    }
    return result;
}

/**
 * Взагалі, це чорна магія
 * @param {Number} x
 * @param {Number} y
 * @returns {number}
 */
function integerDivision(x,y){
    return x/y>>0;
}