//region Memory
function initRamHolder() {
    var ramHolder = {};
    ramHolder.ramMap = [];

    ramHolder.getDex = function (startIndex) {
        return this.ramMap[startIndex];
    };
    ramHolder.setDex = function (startIndex, value) {
        this.ramMap[startIndex] = value;
    };
    ramHolder.setHex = function (startIndex, value) {
        this.ramMap[HexToDex(startIndex)] = value;
    };
    ramHolder.getHex = function (startIndex) {
        return this.ramMap[HexToDex(startIndex)];
    };
    ramHolder.isClear = function () {
        return this.ramMap.length == 0;
    };
    ramHolder.getMemorySize = function () {
        // body...
        return 0;
    }
    return ramHolder;
}

function initRegisterHolder() {
    var registerHolder = {};
    var registerMap = [];
    for (var i = 0; i < 32; i++) {
        registerMap[i] = 0;
    }
    registerHolder.registerMap = registerMap;
    registerHolder.get = function (index) {
        if (index > -1 && index < 32) {
            return this.registerMap[index];
        }
    };
    registerHolder.set = function (index, value) {
        if (index > 0 && index < 32) {
            this.registerMap[index] = value;
        }
    };
    return registerHolder;
}

function initCommandRamHolder() {
    var commandRamHolder = {};
    commandRamHolder.PC = 0;
    commandRamHolder.commandCodeList = [];
    commandRamHolder.labels = [];
    commandRamHolder.addCommandCodes = function (code) {
        this.commandCodeList.push(code);
    };
    commandRamHolder.getCurrent = function () {
        var result = this.commandCodeList[this.PC];
        this.PC++;
        return result;
    };
    commandRamHolder.setPC = function (newPC) {
        this.PC = newPC;
    };
    commandRamHolder.getPC = function () {
        return this.PC;
    };
    commandRamHolder.addLabel = function (label) {
        this.labels[label] = this.PC + 1;
    };
    commandRamHolder.getLabel = function (label) {
        return this.label[label];
    };
    commandRamHolder.getCurrentPC = function () {
        return this.PC - 1;
    };
    return commandRamHolder;
}

//endregion

//region Розбір команд
/*
 Важливі спостереження:
 - Якщо команда починається з 1, то вона працює з пам’ятю. Інакше, все це добро потрібно надсилати в ALU
 - Всі арифметичні операції між трьома регістрами починаються з 000000
 */
cStart = {
    //Арифметичні операції з трьома регістрами
    'add': "000000",
    'addu': "000000",
    'and': "000000",
    'div': "000000",
    'divu': "000000",
    'jr': "000000",
    'mult': "000000",
    'multu': "000000",
    'or': "000000",
    'sllv': "000000",
    'slt': "000000",
    'sltu': "000000",
    'srlv': "000000",
    'sub': "000000",
    'subu': "000000",
    'xor': "000000",
    //Кінець
    //Розширені арифметичні
    'sra': "00000000000",
    'sll': "00000000000",
    'srl': "00000000000",
    'mfhi': "0000000000000000",
    'mflo': "0000000000000000",
    //Кінець
    'addi': "001000",
    'addiu': '001001',
    'andi': "001100",
    'beq': "000100",
    //Порівняння з нулем та стрибок
    'bgez': "000001",
    'bgezal': "000001",
    'bltz': "000001",
    'bltzal': "000001",
    //Кінець
    'bgtz': "000111",
    'blez': "000110",
    'bne': "000101",
    'j': "000010",
    'jal': "000011",
    'lb': "100000",
    'lui': "001111",
    'lw': "100011",
    'ori': "001101",
    'sb': "101000",
    'slti': "001010",
    'sltiu': "001011",
    'sw': "101011",
    'xori': "001110"
};

cEnd = {
    'add': "00000100000",
    'addu': "00000100001",
    'and': "00000100100",
    'div': "0000000000011010",
    'divu': "0000000000011011",
    'jr': "000000000000000001000",
    'mfhi': "00000010000",
    'mflo': "00000010010",
    'mult': "0000000000011000",
    'multu': "0000000000011001",
    'sll': "000000",
    'sllv': "00000000100",
    'slt': "00000101010",
    'sltu': "00000101011",
    'sra': "000011",
    'srl': "000010",
    'srlv': "00000000110",
    'sub': "00000100010",
    'subu': "00000100011",
    'xor': "00000100110"
};

cMiddle = {
    'bgez': "00001",
    'bgezal': "10001",
    'bgtz': "00000",
    'blez': "00000",
    'bltz': "00000",
    'bltzal': "10000"
};

function convertTSImm(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[2]), 5) + DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillBin(parseInt(splitedCode[3]), 16);
}

function convertDST(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[2]), 5) + DexToFillBin(getRegisterCode(splitedCode[3]), 5) + DexToFillBin(getRegisterCode(splitedCode[1]), 5);
}

function convertSOff(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5) + cMiddle[splitedCode[0]] + DexToFillBin(splitedCode[2], 16);
}

function convertST(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5) + DexToFillBin(getRegisterCode(splitedCode[2]), 5);
}

function convertSTOff(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5) + DexToFillBin(getRegisterCode(splitedCode[2]), 5) + DexToFillBin(getRegisterCode(splitedCode[3]), 16);
}

function convertTarget(splitedCode) {
    return DexToFillBin(splitedCode[1], 26);
}

function convertTOffS(splitedCode) {
    var offS = splitedCode[2];
    var offSArr = offS.split("("); 
    offSArr[1] = offSArr[1].substring(0, offSArr[1].length - 1);
    return DexToFillBin(getRegisterCode(offSArr[1]), 5) + DexToFillBin(getRegisterCode(splitedCode[1]), 5) + DexToFillBin(offSArr[0], 16);
}

function convertSorD(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5);
}
function convertTImm(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5) + DexToFillBin(splitedCode[2], 16);
}

function convertDTH(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[2]), 5) + DexToFillBin(getRegisterCode(splitedCode[1]), 5) + DexToFillBin(splitedCode[3], 5);
}

var commandRegExp = new RegExp("(,| )");

/*commandTSImmGroup = ['addi','addiu','andi','ori','slti','sltiu','xori'];
 commandDSTGroup = ['add','addu','and','or','sllv','slt','sltu','srlv','sub','subu','xor'];
 commandSOffGroup = ['bgez','bgezal','bgtz','blez','bltz','bltzal'];
 commandSTGroup = ['div','divu','mult','multu'];
 commandSTOffGroup = ['beq','bne'];
 commandTargetGroup=['j','jal'];
 commandTOffSGroup = ['lw','sw','lb','sb'];
 commandSorDGroup = ['mfhi','mflo','jr'];
 commandTImmGroup = ['lui'];
 commandDTHGroup = ['sll','sra','srl'];*/

function initCommandParser() {
    var commandParser = {};
    commandParser.commandHolder = initCommandRamHolder();
    commandParser.createCommand = function (code) {
        if (code.indexOf(':')>-1) {
            var labelWithCode = code.split(':');
            code = labelWithCode[1];
            var label = labelWithCode[0];
            this.commandHolder.addLabel(label);
            if (code.length < 2) {
                return
            }
        }
        var splitedCode = code.split(commandRegExp);
        splitedCode = splitedCode.filter(function (element) {
            var b = true;
            if (element.length < 2) {
                if (numberSet.indexOf(parseInt(element)) == -1) {
                    b = false;
                }
            }
            return b;
        });
        return splitedCode;
    };
    commandParser.parse = function (splitedCode) {
        var code = splitedCode[0];
        switch (code) {
            //TImm Group
            case 'addi':
            case 'addiu':
            case 'andi':
            case 'ori':
            case 'slti':
            case 'sltiu':
            case 'xori':
                return cStart[code] + convertTSImm(splitedCode);
                break;
            //DST Group
            case 'add':
            case 'addu':
            case 'and':
            case 'or':
            case 'sllv':
            case 'slt':
            case 'sltu':
            case 'srlv':
            case 'sub':
            case 'subu':
            case 'xor':
                return cStart[code] + convertDST(splitedCode) + cEnd[code];
                break;
            //SOff Group
            case 'bgez':
            case 'bgezal':
            case 'bgtz':
            case 'blez':
            case 'bltz':
            case 'bltzal':
                //TODO:відловлювання label
                return cStart[code] + convertSOff(splitedCode);
                break;
            //ST Group
            case 'div':
            case 'divu':
            case 'mult':
            case 'multu':
                return cStart[code] + convertST(splitedCode) + cEnd[code];
                break;
            //STOff Group
            case 'beq':
            case 'bne':
                return cStart[code] + convertSTOff(splitedCode);
                break;
            //Target Group
            case 'j':
            case 'jal':
                //TODO:відловлювання label
                return cStart[code] + convertTarget(splitedCode);
                break;
            //TOffS Group
            case 'lw':
            case 'sw':
            case 'lb':
            case 'sb':
                return cStart[code] + convertTOffS(splitedCode);
                break;
            //SorD Group
            case 'mfhi':
            case 'mflo':
            case 'jr':
                return cStart[code] + convertSorD(splitedCode) + cEnd[code];
                break;
            //TImm Group
            case 'lui':
                return cStart[code] + convertTImm(splitedCode);
                break;
            //DTH Group
            case 'sll':
            case 'sra':
            case 'srl':
                return cStart[code] + convertDTH(splitedCode) + cEnd[code];
                break;

        }
    };
    return commandParser;
}

numberSet = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/**
 * @param {String} code
 * @return {Number}
 */
function getRegisterCode(code) {
    var exsCode = code.substring(1);
    if (numberSet.indexOf(parseInt(exsCode[0])) == -1) {
        return registerCode[exsCode];
    }
    return parseInt(exsCode);
}
//endregion

//region CPU
function initDemoCPU() {
    var demoCPU = {};
    demoCPU.ram = initRamHolder();
    demoCPU.commandParser = initCommandParser();
    demoCPU.register = initRegisterHolder();
    demoCPU.alu = initALU(demoCPU.register, demoCPU.ram, demoCPU.commandParser.commandHolder);
    demoCPU.nextCommand = function () {
        this.alu.calculate(this.commandParser.commandHolder.getCurrent());
    };
    demoCPU.command = function (command) {
        var splitedCode = this.commandParser.createCommand(command);
        var bCode = this.commandParser.parse(splitedCode);
        this.commandParser.commandHolder.addCommandCodes(bCode);
        return bCode;
    };
    return demoCPU;
}
//endregion

//region ALU
/*
 ALU Notes:
 - З цікавого: усі операції діляться за бітами:
 Якщо команда починається з 000000, оцінка за останніми шістьма бітами хвоста, методом if-else:
 1. Перший біт не нульовий - це звичайна арифметична операція з трьома регістрами
 2. Другий біт не нульовий - це операція, що використовує аккомулятор
 3. Третій біт не нульовий - це команда стрибка
 4. Четвертий біт не нульовий - це зсув для трьох регістрів
 5. П’ятий біт не нульовий - це зсув вправо для дивних параметрів
 6. Всі нулі - це зсув вліво для дивних параметрів

 */
function initALU(registerHolder, ramHolder, commandRamHolder) {
    var alu = {};
    var zeroStartArray = initZeroStartArray();
    var hardArray = initHardArray();
    var accArray = initAccArray();
    alu.hi = 0;
    alu.lo = 0;
    alu.calculate = function (b) {
        console.log(b);
        if (b.startsWith("000000")) {
            var end = b.substring(b.length - 6, b.length);
            console.log(end);
            if (!end.startsWith("0")) {
                zeroStartArray[end](b, registerHolder);
            } else {
                if (end[1] != '0') {
                    console.log(end);
                    accArray[end](b, registerHolder, alu);
                } else {

                }
            }
        } else {
            hardArray[b.substring(0, 6)](b, registerHolder, ramHolder, commandRamHolder);
        }
    };
    return alu;
}

function initZeroStartArray() {
    var arr = [];
    //add
    arr["100000"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) + registerHolder.get(values[2]));
    };
    //addu
    arr["100001"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) + registerHolder.get(values[2]));
    };
    //and
    arr["100100"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) & registerHolder.get(values[2]));
    };
    //slt
    arr["101010"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) < registerHolder.get(values[2] ? 1 : 0));
    };
    //sltu
    arr["101011"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) < registerHolder.get(values[2] ? 1 : 0));
    };
    //sub
    arr["100010"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) - registerHolder.get(values[2]));
    };
    //subu
    arr["100011"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) - registerHolder.get(values[2]));
    };
    //xor
    arr["100110"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) ^ registerHolder.get(values[2]));
    };
    //or
    arr["100101"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) | registerHolder.get(values[2]));
    };
    return arr;
}

function initAccArray() {
    var arr = [];
    //div
    arr['011010'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        alu.hi = s % t;
        alu.lo = integerDivision(s, t);
    };
    //divu
    arr['011011'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        alu.hi = s % t;
        alu.lo = integerDivision(s, t);
    };
    //mfhi
    arr['010000'] = function (b, registerHolder, alu) {
        var d = getD(b);
        registerHolder.set(d, alu.hi);
    };
    //mflo
    arr['010010'] = function (b, registerHolder, alu) {
        var d = getD(b);
        registerHolder.set(d, alu.lo);
    };
    //mult
    arr['011000'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        var mult = DexToFillBin(s * t, 32);
        var mult1 = mult.substring(0, 16);
        var mult2 = mult.substring(16);
        alu.lo = BinToDex(mult2);
        alu.hi = BinToDex(mult1);
    };
    //multu
    arr['011010'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        var mult = DexToFillBin(s * t, 32);
        var mult1 = mult.substring(0, 16);
        var mult2 = mult.substring(16);
        alu.lo = BinToDex(mult2);
        alu.hi = BinToDex(mult1);
    };

    return arr;
}

function initHardArray() {
    var arr = [];
    //addi
    arr['001000'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) + values[2]);
    };
    //addiu
    arr['001001'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) + values[2]);
    };
    //andi
    arr['001100'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) & values[2]);
    };
    //ori
    arr['001101'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) | values[2]);
    };
    //slti
    arr['001010'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) < values[2] ? 1 : 0);
    };
    //sltiu
    arr['001011'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) < values[2] ? 1 : 0);
    };
    //xori
    arr['001110'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) ^ values[2]);
    };
    //sw
    arr['101011'] = function (b,registerHolder, ramHolder, commandRamHolder){
          var values = getTOffS(b);
          ramHolder.setDex(values[2]+registerHolder.get(values[1]),
            registerHolder.get(values[0]));
          /*ramHolder.setDex(registerHolder.get(values[0])+values[2], 
            registerHolder.get(values[1]));*/
    };
    //lw
    arr['100011'] = function (b,registerHolder, ramHolder, commandRamHolder) {
        var values = getTOffS(b);
        registerHolder.set(values[0],ramHolder.getDex(values[2]+registerHolder.get(values[1])));
    };
    return arr;
}

/**
 *
 * @param {String} b
 * @returns {*[]} D,S,T
 */
function getDST(b) {
    return [BinToDex(b.substring(16, 21)), BinToDex(b.substring(6, 11)), BinToDex(b.substring(11, 16))];
}

/**
 * @param {String} b
 * @returns {*[]} T,S,Offset
 */
function getTOffS(b){
    return [BinToDex(b.substring(11,16)),BinToDex(b.substring(6,11)),BinToDex(b.substring(16))];
}
/**
 *
 * @param {String} b
 * @returns {Number} D
 */
function getD(b) {
    return BinToDex(b.substring(16, 21));
}

/**
 *
 * @param {String} b
 * @returns {*[]} S,T
 */
function getST(b) {
    return [BinToDex(b.substring(6, 11)), BinToDex(b.substring(11, 16))];
}
/**
 *
 * @param {String} b
 * @returns {*[]} S,T,Imm
 */
function getSTImm(b) {
    return [BinToDex(b.substring(6, 11)), BinToDex(b.substring(11, 16)), BinToDex(b.substring(16))];
}

//endregion