function testController($scope) {
	var demoCPU = initDemoCPU();
	$scope.codeArea = "";
	$scope.registers = demoCPU.register.registerMap;
	$scope.registersName = registersName;
	$scope.resultArea = "";
	$scope.isEditing = true;
	$scope.loadBtnText = "Assemble & Load to CPU";
	$scope.ram = demoCPU.ram;
	$scope.hexRegFmt = 'hex';

	$scope.commandsCount = -1;
	$scope.dividedRegisters = prepareRegistersTable(2, $scope.registers, $scope.registersName);

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
	}


}