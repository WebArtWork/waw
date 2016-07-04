/*!
 * ngPicker v0.0.1
 * https://github.com/WebArtWork/ngPicker
 *
 * Copyright (c) 2016 undefined
 * License: MIT
 *
 * Generated at Monday, April 18th, 2016, 8:30:58 PM
 */
(function() {
var pic = angular.module('ngPicker', []);

var datePickerTemplate = [ // Template for the date picker, no CSS, pure HTML. The date-picker tag will be replaced by this
     '<div ng-switch on="opts.style">',
       '<div ng-switch-when="1"  class="picker-row">',
         '<div class="datePicker">',
            //'<label ng-click="selectDate()">',
            //   ' <input type="text" ng-model="currentDateObj.date" disabled>',
            //'</label>',
           '<div  class="dp-box" ng-show="selecting">',
               '<div ng-switch on="YearIAndMonthSwith">',
                        '<div class="navigation">',
                           
                            '<span class="dp-nav-item" ng-click="prev()"><i class="fa fa-angle-double-left" aria-hidden="true"></i></span>',
                            '<span class="dp-nav-item dp-navitemtext" ng-click="setYearIAndMonth(\'month\')" >{{displayDate[1]}}</span>',
                            '<span class="dp-nav-item" ng-click="next()"><i class="fa fa-angle-double-right" aria-hidden="true"></i></span>',
                            '<span class="dp-nav-item" ng-click="prevYear()"><i class="fa fa-angle-double-left" aria-hidden="true"></i></span>',
                            '<span class="dp-nav-item dp-navitemtext" ng-click="setYearIAndMonth(\'years\')" >{{displayDate[3]}}</span>',
                            '<span class="dp-nav-item" ng-click="nextYear()"><i class="fa fa-angle-double-right" aria-hidden="true"></i></span>',
                        '</div>',
                   '<div ng-switch-default>',
                        '<span  class="dp-select-dofw" ng-repeat="day in days" ng-bind="day"></span>',
                   '<div ng-repeat="week in weeks">',
                        '<span class="dp-select-dweek"  ng-repeat="d in week" ng-click="selectDay(d)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ d.day | date: &#39;d&#39;}}</span>',
                   '</div>',
                   '</div>',
                   '<div class="dp-y-box" ng-switch-when="years">',
                        '<span  class="dp-select-y"  ng-repeat="y in years" ng-click="setYear(y)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ y}}</span>',
                   '</div>',
                    '<div ng-switch-when="month">',
                        '<span class="dp-select-m"  ng-repeat="m in months" ng-click="setMonth(m)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ m}}</span>',
                   '</div>',
               '</div>',
            '</div>',
       '</div>',
        '<i ng-click="selectDate()" class="fa fa-calendar calendar-ico"></i>' ,
        '<span class="dp-inputbox">',
           '<input class="dp-input date-input" type="text" maxlength=2  placeholder="{{currentDateObj.day}}" ng-model="currentDateObj.day" ng-change="setDayAuto(currentDateObj.day)">',
           '<i ng-click="showDays()" class="fa fa-angle-down input-caret"></i>',
           '<div  class="dp-selectwrapper-d">' ,
                '<div class="dp-select-day" ng-repeat="d in dayInMonth track by $index" ng-model="currentDateObj.day" ng-click="setDay(d)" >{{ d }}</div>',
           '</div>',
        '</span>', 
        '<span class="dp-inputbox">',
          '<input class="dp-input mounth-input" type="text" maxlength=2 placeholder="{{currentDateObj.month}}" ng-model="currentDateObj.month" ng-change="setMonthAuto(currentDateObj.month)">',
           '<i ng-click="showMonth()" class="fa fa-angle-down input-caret"></i>',
           '<div ng-if="monthShow" class="dp-selectwrapper-m">',
                '<div class="dp-select-m"  ng-repeat="m in months" ng-click="setMonth(m)">{{ m}}</div>',
            '</div>',
        '</span>', 
         '<span class="dp-inputbox">',
           '<input class="dp-input year-input" type="text" maxlength=4 placeholder="{{currentDateObj.year}}" ng-model="currentDateObj.year" ng-change="setYearAuto(currentDateObj.year)">',
           '<i ng-click="showYear()" class="fa fa-angle-down input-caret"></i>',
           '<div ng-if="yearsShow" class="dp-selectwrapper-y">',
                '<div class="dp-select-y"  ng-repeat="y in years" ng-click="setYear(y)">{{ y}}</div>',
           '</div>',
        '</span>' ,
    '</div>'   ,   

     '<div ng-switch-when="2">',
     '<h1>style 2</h1>',
         '<div class="datePicker">',
            '<label ng-click="selectDate()">',
               ' <input type="text" ng-model="currentDateObj.date" disabled>',
            '</label>',
           '<div ng-show="selecting">',
               '<table ng-switch on="YearIAndMonthSwith">',
                   '<thead>',
                        '<tr>',     
                        '</tr>',
                        '<tr class="navigation">',
                           '<td ng-click="prevYear()">&lt;&lt;</td>',
                           '<td ng-click="prev()">&lt;</td>',
                           '<td class="currentDate" colspan="7" ng-click="setYearIAndMonth(\'month\')" >{{displayDate[1]}}</td>',
                           '<td class="currentDate" colspan="7" ng-click="setYearIAndMonth(\'years\')" >{{displayDate[3]}}</td>',
                           '<td ng-click="next()">&gt;</td>',
                           '<td ng-click="nextYear()">&gt;&gt;</td>',
                        '</tr>',
                    '</thead>',
                   '<tbody ng-switch-default>',
                        '<tr>',
                            '<td  ng-repeat="day in days" ng-bind="day"></td>',
                        '</tr>',
                   '<tr ng-repeat="week in weeks" class="week">',
                        '<td  ng-repeat="d in week" ng-click="selectDay(d)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ d.day | date: &#39;d&#39;}}</td>',
                   '</tr>',
                   '</tbody>',
                   '<tbody ng-switch-when="years">',
                   '<tr  class="week">',
                        '<td  ng-repeat="y in years" ng-click="setYear(y)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ y}}</td>',
                   '</tr>',
                   '</tbody>',
                    '<tbody ng-switch-when="month">',
                   '<tr  class="week">',
                        '<td  ng-repeat="m in months" ng-click="setMonth(m)" ng-class="{active: d.selected, otherMonth: d.notCurrentMonth}">{{ m}}</td>',
                   '</tr>',
                   '</tbody>',
               '</table>',
            '</div>',
       '</div>',
        '<div>',
           '<input type="text" maxlength=2  placeholder="{{currentDateObj.day}}" ng-model="currentDateObj.day" ng-change="setDayAuto(currentDateObj.day)">',
           '<button ng-click="showDays()">Down</button>',
           '<h3 ng-repeat="d in dayInMonth track by $index" ng-model="currentDateObj.day" ng-click="setDay(d)" >{{ d }}</h3>',
        '</div>', 
        '<div >',
          '<input type="text" maxlength=2 placeholder="{{currentDateObj.month}}" ng-model="currentDateObj.month" ng-change="setMonthAuto(currentDateObj.month)">',
           '<button ng-click="showMonth()">Down</button>',
           '<h3 ng-if="monthShow" ng-repeat="m in months" ng-click="setMonth(m)">{{ m}}</h3>',
        '</div>', 
         '<div>',
           '<input type="text" maxlength=4 placeholder="{{currentDateObj.year}}" ng-model="currentDateObj.year" ng-change="setYearAuto(currentDateObj.year)">',
           '<button ng-click="showYear()">Down</button>',
           '<h3 ng-if="yearsShow" ng-repeat="y in years" ng-click="setYear(y)">{{ y}}</h3>',
        '</div>' ,
    '</div>'   ,   
 '</div>'     
].join('\n');

pic.run([
    '$templateCache',
    function($templateCache) {
        $templateCache.put('datePicker.tmpl', datePickerTemplate); // This saves the html template we declared before in the $templateCache
    }
]);

pic.directive('wawDatepicker', ['$parse',
    function($parse) {
        return {
            restrict: "AE",
            templateUrl: "datePicker.tmpl",
            // templateUrl: "datePicker.html",
            transclude: true,

            controller: function($scope) {
                $scope.prev = function() {
                    $scope.dateValue = new Date($scope.dateValue).setMonth(new Date($scope.dateValue).getMonth() - 1);
                };
                $scope.prevYear = function() {
                    $scope.dateValue = new Date($scope.dateValue).setYear(new Date($scope.dateValue).getFullYear() - 1);
                };
                $scope.next = function() {
                    $scope.dateValue = new Date($scope.dateValue).setMonth(new Date($scope.dateValue).getMonth() + 1);
                };
                $scope.nextYear = function() {
                    $scope.dateValue = new Date($scope.dateValue).setYear(new Date($scope.dateValue).getFullYear() + 1);
                };
                $scope.today = function() {
                    $scope.dateValue = new Date();
                };
                $scope.selectDate = function() {
                    $scope.selecting = !$scope.selecting;

                };
                $scope.selectDay = function(day) {
                    $scope.dateValue = day.day;
                    $scope.selecting = !$scope.selecting;
                    $scope.opts.onChange(new Date($scope.dateValue))
                };
                $scope.days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                $scope.months = ['1', '2', '3', '4', '5', '6',
                    '7', '8', '9', '10', '11', '12'
                ];
                $scope.weeks = [];
                $scope.years = [];
                $scope.yearsAll = (function() {
                    if ($scope.years.length > 0) {
                        $scope.years = [];
                    } else {
                        for (var i = 1950; i < 2030; i++) {
                            $scope.years.push(i)
                        }
                    };
                })();
                $scope.YearIAndMonthSwith = "";

                // $scope.opts.date = $scope.dateValue;
            console.log($scope.opts);
            },
            scope: {
                opts: '=',
              
            },
            link: function(scope, element, attrs) {
                var modelAccessor = $parse(attrs.dateValue);
                if (!scope.dateValue) {
                    scope.dateValue = new Date()
                };
                var calculateCalendar = function(date) {
                    var date = new Date(date || new Date());
                    var date2 = new Date(date || new Date());
                    scope.currentDate = date.getDate() + '/' + Math.abs(date.getMonth() + 1) + '/' + date.getFullYear(); //Value that will be binded to the input
                    scope.currentDateObj = {
                        day: date.getDate(),
                        month: Math.abs(date.getMonth() + 1),
                        year: date.getFullYear(),
                        date: scope.currentDate
                    } //Value that will be binded to the input
                    var startMonth = date.getMonth(),
                        startYear = date.getYear();
                    date.setDate(1);
                    if (date.getDay() === 0) {
                        date.setDate(-6);
                    } else {
                        date.setDate(date.getDate() - date.getDay());
                    }
                    if (date.getDate() === 1) {
                        date.setDate(-6);
                    }
                    var weeks = [];
                    while (weeks.length < 6) { // creates weeks and each day
                        if (date.getYear() === startYear && date.getMonth() > startMonth) break;
                        var week = [];
                        for (var i = 0; i < 7; i++) {
                            week.push({
                                day: new Date(date),
                                selected: new Date(date).setHours(0) == new Date(scope.dateValue).setHours(0) ? true : false,
                                notCurrentMonth: new Date(date).getMonth() != new Date(scope.dateValue).getMonth() ? true : false
                            });
                            date.setDate(date.getDate() + 1);
                        }
                        weeks.push(week);
                    }
                    scope.weeks = weeks; // Week Array
                    scope.dayInMonth = [];
                    scope.showDays = function() {
                        scope.daysInMonth = [];
                        if (scope.dayInMonth.length > 0) {
                            scope.dayInMonth = [];
                        } else {
                            for (var i = 0; i < scope.weeks.length; i++) {
                                for (var y = 0; y < scope.weeks[i].length; y++) {
                                    if (!scope.weeks[i][y].notCurrentMonth) {
                                        scope.daysInMonth.push(scope.weeks[i][y])
                                        scope.dayInMonth.push(scope.daysInMonth.length)
                                    }
                                }
                            }
                        }
                    };
                    scope.showMonth = function() {

                        if (scope.monthShow == true) {
                            scope.monthShow = false;
                        } else {
                            scope.monthShow = true;
                        }
                    };
                    scope.showYear = function() {
                        if (scope.yearsShow == true) {
                            scope.yearsShow = false;
                        } else {
                            scope.yearsShow = true;
                        }
                    };
                    scope.setDayAuto = function(obj) {
                        scope.date = new Date(scope.dateValue)
                        if (obj > 0 && obj < 32) {
                            scope.date.setDate(obj)
                            scope.dateValue = scope.date
                        }
                        scope.opts.onChange(new Date(scope.dateValue))
                    }
                    scope.setMonthAuto = function(obj) {
                        scope.date = new Date(scope.dateValue)
                        if (obj > 0 && obj < 13) {
                            scope.date.setMonth(obj - 1)
                            scope.dateValue = scope.date
                            scope.opts.onChange(new Date(scope.dateValue))
                        }
                    }
                    scope.setYearAuto = function(obj) {
                        scope.date = new Date(scope.dateValue)
                        if (obj > 1900 && obj < 2300) {
                            scope.date.setFullYear(obj)
                            scope.dateValue = scope.date
                            scope.opts.onChange(new Date(scope.dateValue))
                        }
                    }
                    scope.setDay = function(day) {
                        scope.date = new Date(scope.dateValue)
                        scope.date.setDate(day)
                        scope.dateValue = scope.date
                        scope.opts.onChange(new Date(scope.dateValue))
                    }
                    scope.setMonth = function(month) {
                        scope.monthShow = false;
                        scope.YearIAndMonthSwith = "";
                        scope.date = new Date(scope.dateValue);
                        scope.date.setMonth(month - 1);
                        scope.dateValue = scope.date;
                        scope.opts.onChange(new Date(scope.dateValue))
                    }
                    scope.setYear = function(year) {
                        scope.yearsShow = false;
                        scope.YearIAndMonthSwith = ""
                        scope.date = new Date(scope.dateValue)
                        scope.date.setFullYear(year);
                        scope.dateValue = scope.date;
                        scope.opts.onChange(new Date(scope.dateValue))
                    }
                    scope.setYearIAndMonth = function(obj) {
                        if (scope.YearIAndMonthSwith == obj) {
                            scope.YearIAndMonthSwith = "";
                        } else {
                            scope.YearIAndMonthSwith = obj;
                        }
                        scope.opts.onChange(new Date(scope.dateValue))
                    }
                    scope.displayDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()).toDateString().split(' ');
                    scope.setOPTSDate=function(){
                         scope.opts.date = new Date(scope.dateValue);
                    }

                };
                scope.$watch('dateValue', function(val) {
                    calculateCalendar(scope.dateValue);
                });
            }
        };
    }
]);
}());