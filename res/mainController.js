var app = angular.module("MIPS-app",[]);

var editor = ace.edit("editor");
//editor.setTheme("ace/theme/twilight");
editor.getSession().setMode("ace/mode/mips");
editor.setValue("addi $t1 $zero 0x14\naddi $t2 $zero 0x20\nsw $t2 0($t1)");
editor.gotoLine(0);

app.config(function($interpolateProvider) {
	    $interpolateProvider.startSymbol('[$');
	    $interpolateProvider.endSymbol('$]');
});

app.controller ("testController" , function($scope) {
	var demoCPU = initDemoCPU();
	$scope.codeArea = "";
	$scope.registers = demoCPU.register.registerMap;
	$scope.ram = demoCPU.ram;
	$scope.registersName = registersName;
	$scope.resultArea = "";
	$scope.isEditing = true;
	$scope.loadBtnText = "Assemble & Load to CPU";
	
	$scope.hexRegFmt = 'hex';
	$scope.memoryShift = 0x12;

	$scope.commandsCount = -1;
	$scope.dividedRegisters = prepareRegistersTable(2, $scope.registers, $scope.registersName);
	var memoryTableSize = {width: 8, height: 17}
	$scope.memoryShifts = prepareMemoryTable($scope.memoryShift,memoryTableSize.height, memoryTableSize.width);



	function prepareRegistersTable(columns, arr, names){
		var newArr = [];
		var newlength = arr.length/columns;
		
		for(var i=0; i<newlength; i++){ //fixme: if columns is odd
			var newnewArr = []
			for(var j=0; j<columns; j++){
				var index = i+newlength*j;
				var obj = {name:names[index], indx:index};
				newnewArr.push(obj);
			}
			newArr.push(newnewArr);
		}
		return newArr;
	}

	$scope.returnRegister = function(index, fmt){
		if(fmt=='hex'){
			return "0x" + $scope.registers[index].toString(16).toUpperCase();		
		}
		return $scope.registers[index];
	}

	function prepareMemoryTable(shift, rows, cols){
		if(typeof shift == 'string'){
			shift = parseInt(shift)
		}
		var arr = [];
		for(var i=0; i<rows; i++){
			var arr2 = [];
			for(var j=0; j<cols; j++){
				// var v = $scope.ram.ramMap[shift + i*cols + j];
				// if(typeof v == 'undefined'){
				// 	v = 0;					
				// }
				var num = shift + i*cols + j;
				arr2.push(num);
			}
			arr.push(arr2);
		}
		return arr;
	}

	$scope.returnMemoryValue = function (index, fmt){
		//fixme ???
		var m = $scope.ram.ramMap[index];
		if(typeof m == 'undefined'){
			m = 0;
		}
		if(fmt == 'hex'){
			m = m.toString(16).toUpperCase();
			m = HexToFillHex(m, 2);
		}
		return m;
	}

	$scope.changeMemoryShift = function(){
		$scope.memoryShifts = prepareMemoryTable($scope.memoryShift,memoryTableSize.height, memoryTableSize.width);
	}

	$scope.loadInfo = function (){
		if($scope.isEditing){
			$scope.isEditing = false;
			$scope.loadBtnText = "Return to code editor";
			editor.setReadOnly(true);
			$scope.resultArea = "";
			$scope.codeArea = editor.getValue();
			var operations_list = $scope.codeArea.split('\n');
			$scope.commandsCount = 0;

			for(var i=0; i<operations_list.length; i++){
				var value = operations_list[i].trim();
				if(value.length > 0){
					var indexOf = value.indexOf(":");
					if (indexOf != -1) {
						var label = value.substring(0, indexOf);
						demoCPU.commandParser.commandHolder.addLabel(label);
						var command = value.substring(indexOf + 1);
						if (command.length > 0) {
							value = command;
						} else {
							return;
						}
					}
					var binResult = demoCPU.command(value);
					$scope.commandsCount++;
					$scope.resultArea += BinToViewBin(binResult) + "\n";
				}
			}
		}else{ //fixme: memory leaks??? todo: command deleting
			$scope.isEditing = true;
			$scope.loadBtnText = "Assemble & Load to CPU";
			editor.setReadOnly(false);
			$scope.commandsCount = -1;
		}

	}
	$scope.runConvert = function () {
		for(var i=0; i<$scope.commandsCount; i++){
			demoCPU.nextCommand();
		}
		$scope.commandsCount = 0;
		console.log("состояние регистров под конец работы:");
		console.log(demoCPU.register.registerMap);
		console.log(demoCPU.ram.ramMap);
	}
	
	$scope.runStep = function () {
		if($scope.commandsCount>0){
			demoCPU.nextCommand();
			editor.session.clearBreakpoints();
			var rows = editor.session.getLength(); //fixme: indexes may be wrong if delete empty rows in ediotr
			editor.session.setBreakpoint(rows - $scope.commandsCount);
			$scope.commandsCount--;
		}
	}
	$scope.reset = function (){//todo
		demoCPU = {};
		demoCPU = initDemoCPU();
		editor.session.clearBreakpoints();
		$scope.registers = demoCPU.register.registerMap;
		$scope.ram = demoCPU.ram;
		$scope.isEditing = true; //crunch;
		$scope.commandsCount = -1;
		$scope.loadInfo();

		console.log('mips cpu reseted');
	}


var jsonTestText = '{\n"id": 0,\n'+
	'"title":"Some exercise",\n'+
	'"exercise":"store some value into a memory",\n'+
	'"tests":[{"id": 0, "title":"Test1","start": [{"t1":123},{"t2":155}],"end": [{"t1": 123},{"t2": 128}]},'+
	'{"id": 1, "title":"Test2","start": [{"t1":12},{"t2":13}],"end": [{"t1": 2},{"t2": 2}]}'+
	']}'

	$scope.exercise = JSON.parse(jsonTestText);

	$scope.testClick = function (id){
		$scope.reset();
		var test = $scope.exercise.tests[id];
		var k = Object.keys(test.start);
		angular.forEach(test.start, function (item, i, arr){
			var key = Object.keys(item)[0];
			var code = registerCode[key];
			var val = item[key];
			demoCPU.register.set(code, val);
		});

		$scope.runConvert();

		var testPassed = true;

		angular.forEach(test.end, function (item, i, arr){
			var key = Object.keys(item)[0];
			var code = registerCode[key];
			var val = item[key];
			var currentVal = demoCPU.register.get(code);
			if(currentVal != val){
				testPassed = false;
			}
		});

		test.passed = testPassed;//todo
	}
});