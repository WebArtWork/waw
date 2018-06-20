angular.module("wdrag_services", []).service('wdrag', [function() {
}]).service('ngDraggable', [function() {
    var scope = this;
    scope.inputEvent = function(event) {
        if(!event) return;
        if (angular.isDefined(event.touches)) {
            return event.touches[0];
        }
        //Checking both is not redundent. If only check if touches isDefined, angularjs isDefnied will return error and stop the remaining scripty if event.originalEvent is not defined.
        else if (angular.isDefined(event.originalEvent) && angular.isDefined(event.originalEvent.touches)) {
            return event.originalEvent.touches[0];
        }
        return event;
    };
    scope.touchTimeout = 100;
}]);