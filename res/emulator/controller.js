function testController($scope) {
    var demoCPU = initDemoCPU();
    $scope.registers = demoCPU.register.registerMap;
    $scope.registersName = registersName;
    $scope.resultArea = "";
    $scope.runConvert = function () {
        $scope.resultArea = "";
        angular.forEach($scope.codeArea.split('\n'), function (value, key) {
            value = value.trim();
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
            $scope.resultArea += BinToViewBin(binResult) + "\n";
            demoCPU.nextCommand();
        });
    }
}