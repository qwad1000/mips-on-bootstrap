var app = angular.module("MIPS-app",[]);


app.controller ("testController" , function($scope) {
	var demoCPU = initDemoCPU();
	$scope.codeArea = "";
	$scope.registers = demoCPU.register.registerMap;
	$scope.registersName = registersName;
	$scope.resultArea = "";
	$scope.isEditing = true;
	$scope.loadBtnText = "Assemble & Load to CPU";
	$scope.ram = demoCPU.ram;
	$scope.hexRegFmt = 'hex';
	$scope.memoryShift = 0x12;

	demoCPU.ram.setDex(0x14, 12);

	$scope.commandsCount = -1;
	$scope.dividedRegisters = prepareRegistersTable(2, $scope.registers, $scope.registersName);
	$scope.memoryShifts = prepareMemoryTable(0x10,17	,8);

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
		}
		return m;
	}

	$scope.changeMemoryShift = function(){
		$scope.memoryShifts = prepareMemoryTable($scope.memoryShift,8,8);
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
		demoCPU.ram.setDex(123, 234);
		var r = $scope.returnMemoryBlock(115, 12,12);
		console.log('asdf');
	}

});