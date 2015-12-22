angular.module('app', ['ngFileUpload', 'ngCookies'])
    .value('colors', [
        'red',
        'orange',
        'yellow',
        'olive',
        'green',
        'teal',
        'blue',
        'violet',
        'purple',
        'pink',
        'brown',
        'grey',
        'black'
    ])
    .value('presets', [])
    .service('LabelColor', function(colors) {
        var length = colors.length - 1;
        return {
            select: function(index) {
                var larger = false;
                while (index > length) {
                    larger = !larger;
                    index -= length;
                }
                if (larger) {
                    index = length - index;
                }
                return colors[index];
            },
        };
    })
    .service('Utils', function() {
        return {
            initFields: function(mail) {
                mail.cc = mail.cc.split(',');
                mail.messages = ['', '', ''];
                mail.titles = ['', '', ''];
                return mail;
            }
        };
    })
    .service('ModalInstance', function() {
        function ModalInstance() {
            var obj = {
                el: null,
                open: function() {
                    if (this.el === null) {
                        return;
                    }
                    setTimeout(function() {
                        this.el.modal({
                            blurring: true
                        }).modal('show');
                    }.bind(this), 5);
                },
                inject: function(el) {
                    this.el = el;
                },
                close: function() {
                    if (this.el === null) {
                        return;
                    }
                    setTimeout(function() {
                        this.el.modal('hide');
                    }.bind(this), 150);
                },
            };
            return obj;
        }
        return ModalInstance;
    })
    .factory('InfoModalInstance', function(ModalInstance) {
        return ModalInstance();
    })
    .factory('AddModalInstance', function(ModalInstance) {
        return ModalInstance();
    })
    .factory('EditModalInstance', function(ModalInstance) {
        return ModalInstance();
    })
    .factory('Column', function($http, $q) {
        var _data = ['', '', '', '', '', ''];
        var deferred = $q.defer();
        $http.get('api/v1/column/').success(function(data) {
            _data = data;
            deferred.resolve(_data);
        });
        return {
            getItem: function(index) {
                return deferred.promise;
            },
            setItem: function(index, text) {
                var old = _data[index];
                if (old === text) {
                    return false;
                }
                _data[index] = text;
                return true;
            },
            post: function(index, text, fn) {
                var should_post = this.setItem(index, text);
                if (should_post) {
                    $http.post('api/v1/column/', _data).success(fn || function() {});
                }
                fn('same value! damn');
            },
        };
    })
    .factory('Email', function($q, Utils, $http) {
        var mails = [];
        return {
            add: function(newMail) {
                mails.push(Utils.initFields(newMail));
                this.save();
            },
            list: function() {
                var deferred = $q.defer();
                $http.get('api/v1/save-mail/').success(function(data) {
                    mails = data.map(function(item) {
                        item.end = new Date(item.end);
                        return item;
                    });
                    deferred.resolve(mails);
                });
                return deferred.promise;
            },
            save: function() {
                return $http.post('api/v1/save-mail/', mails);
            },
            send: function(mail) {
                return $http.post('api/v1/send-mail/', mail);
            },
            delete: function(index) {
                mails.splice(index, 1);
                this.save();
            },
        };
    })
    .run(function($http, $cookies) {
        angular.element('body').css({
            'opacity': 1,
            'background': '#E6E6E6',
        });
        $http.defaults.headers.post['X-CSRFToken'] = $cookies['csrftoken'];
    })
    .directive('doubleClickEdit', function(Column) {
        return {
            restrict: 'A',
            scope: {
                level: '=',
            },
            template: '<div class="ui double-click-input input"><input type="text" value="{{text}}" class=""/></div><span class="double-click-text" ng-bind="text"></span>',
            link: function(scope, element, attrs) {
                scope.level = parseInt(scope.level);
                Column.getItem(scope.level).then(function(data) {
                    scope.text = data[scope.level];
                });
                var $text = element.find('.double-click-text'),
                    $inputBox = element.find('.double-click-input'),
                    $input = element.find('.double-click-input input');
                var noPadding = {
                    padding: '0'
                };
                var oriPadding = {
                    padding: element.css('padding')
                };
                var showInput = function() {
                    $inputBox.show();
                    $text.hide();
                    element.css(noPadding);
                };
                var showText = function() {
                    $inputBox.hide();
                    $text.show();
                    element.css(oriPadding);
                };
                var updateText = function() {
                    scope.text = $(this).val();
                    Column.post(scope.level, scope.text, function(data) {
                        console.log(data);
                    });
                };
                var doubleClick = function(){
                    showInput();
                    $input.focus();
                    $input.on('blur', function() {
                        scope.$apply(updateText.bind(this));
                        $input.off('blur');
                        showText();
                    });
                    $input.on('keydown', function(event) {
                        if (event.keyCode === 13) {
                            // scope.$apply(updateText.bind(this));
                            showText();
                            $input.off('keydown');
                        } else if (event.keyCode === 27) {
                            $(this).val(scope.text);
                            showText();
                            $input.off('keydown');
                        }
                    });
                };
                element.dblclick(doubleClick);
            }
        };
    })
    .directive('addModal', function(AddModalInstance, Email) {
        return {
            templateUrl: 'static/modal-add.html',
            restrict: 'E',
            controller: function ModalController() {
                this.form = {
                    to: '',
                    cc: '',
                    end: '',
                };
                this.submit = function() {
                    Email.add(angular.extend({}, this.form));
                    angular.element('.add.modal').modal('hide');
                }.bind(this);
            },
            controllerAs: 'mc',
            replace: true,
            link: function(scope, element, attrs) {
                AddModalInstance.inject(element);
            }
        };
    })
    .directive('infoModal', function(InfoModalInstance) {
        return {
            templateUrl: 'static/modal-info.html',
            restrict: 'E',
            replace: true,
            controller: function SendMailController($scope, Email) {
                this.send = function() {
                    $('.edit-with-upload-files').append($('[type="file"]'));
                    $('.edit-with-upload-files').find('[type="file"]').attr('name', 'files');
                    var files = $('[type="file"]')[0].files;
                    for (var i in files) {
                        var file = files[i];
                        if (file.size < 10258587 && file.type === "application/pdf") {
                            // files[count++] = files[i];
                        } else {
                            delete files[i];
                        }
                    }
                    $.ajax({
                        url: "api/v1/send-mail/",
                        type: "POST",
                        data: new FormData($('.edit-with-upload-files')[0]),
                        processData: false,
                        contentType: false,
                        success: function(res) {
                            console.log('ok')
                        },
                        error: function(res) {

                        }
                    });
                    // Email.send($scope.selectedData);
                };
            },
            controllerAs: 'ic',
            link: function(scope, element, attrs) {
                InfoModalInstance.inject(element);
                scope.$on('item to be sent to client', function(event, selectedData) {
                    scope.selectedData = selectedData;
                });
            }
        };
    })
    .directive('editModal', function(EditModalInstance, $timeout) {
        return {
            templateUrl: 'static/modal-edit.html',
            restrict: 'E',
            replace: true,
            link: function(scope, element, attrs) {
                EditModalInstance.inject(element);

                scope.$on('newBinding', function(event, data) {
                    scope.form = {
                        to: data.formData.to,
                        cc: data.formData.cc.join(', '),
                        end: data.formData.end,
                        message: data.formData.messages[data.messagePosition],
                        title: data.formData.titles[data.messagePosition],
                    };
                    scope.originalForm = data.formData;
                    scope.messagePosition = data.messagePosition !== undefined ? data.messagePosition : null;
                    scope.willSendOn = data.willSendOn || null;
                    scope.field = data.field;
                    $timeout(function() {
                        element.find('.' + scope.field).focus();
                    }, 800);
                });
            },
            controllerAs: 'edimodal',
            controller: function($scope, Upload, Email) {
                this.sending = 'mail';
                this.saving = 'save';
                // $scope.$watch('files', function() {


                //     if ($scope.files && $scope.files.length) {

                //     }

                // });
                this.send = function() {
                    this.sending = 'send notched circle loading';
                    this.save('but dont close modal');
                    $('.edit-with-upload-files').append($('[type="file"]'));
                    $('.edit-with-upload-files').find('[type="file"]').attr('name', 'files');
                    $('.edit-with-upload-files').append($('[name="csrfmiddlewaretoken"]'));

                    var files = $('[type="file"]')[0].files;
                    for (var i in files) {
                        var file = files[i];
                        if (file.size < 10258587 && file.type === "application/pdf") {
                            // files[count++] = files[i];
                        } else {
                            delete files[i];
                        }
                    }
                    var self = this;
                    $.ajax({
                        url: "api/v1/send-mail/",
                        type: "POST",
                        data: new FormData($('.edit-with-upload-files')[0]),
                        processData: false,
                        contentType: false,
                        success: function(res) {
                            self.sending = 'checkmark'; // not working 
                            angular.element('.send.notched.circle.loading').attr('class', 'checkmark icon')
                            EditModalInstance.close();   
                        },
                        error: function(res) {

                        }
                    });
                };
                this.save = function(close) {
                    $scope.originalForm.to = $scope.form.to;
                    $scope.originalForm.cc = $scope.form.cc.split(',');
                    $scope.originalForm.end = $scope.form.end;

                    if ($scope.field === 'message') {
                        $scope.originalForm.messages[$scope.messagePosition] = $scope.form.message;
                        $scope.originalForm.titles[$scope.messagePosition] = $scope.form.title;
                    }
                    this.saving = 'notched circle loading';
                    return Email.save().then(function() {
                        if (typeof close === 'undefined') {
                            EditModalInstance.close();
                        }
                        this.saving = 'checkmark';
                    }.bind(this));
                };
            },
        };
    })
    .directive('sendMailSwitch', function($timeout) {

        return {
            templateUrl: 'static/switch.html',
            restrict: 'E',
            scope: {
                level: '@',
                sent: '=',
                end: '='
            },
            link: function(scope, element, attrs, controller) {
                function digify(year, month) {
                    month = month < 10 ? '0' + month : month + '';
                    year = year + '';
                    return parseInt(year + month);
                }
                function update() {
                    var dist = parseInt(scope.level),
                        sendOn = new Date(scope.end),
                        currentMonth = new Date().getMonth(),
                        currentYear = new Date().getYear(),
                        currentYearMonth = digify(currentYear, currentMonth);

                    sendOn.setMonth(sendOn.getMonth() - dist);
                    scope.sendOn = sendOn;

                    if (digify(sendOn.getYear(), sendOn.getMonth()) < currentYearMonth) {
                        if (scope.sent) {
                            scope.editClass = 'blue';
                            scope.sendClass = 'blue';
                            scope.tagLabel = 'blue';
                        } else{
                            scope.editClass = 'grey';
                            scope.sendClass = 'grey';
                            scope.tagLabel = 'grey';
                        }
                    } else if (digify(sendOn.getYear(), sendOn.getMonth()) === currentYearMonth) {
                        if (scope.sent) {
                            scope.editClass = 'blue';
                            scope.sendClass = 'blue';
                            scope.tagLabel = 'blue';
                        } else{
                            scope.editClass = 'green';
                            scope.sendClass = 'green';
                            scope.tagLabel = 'green';
                        }
                    } else {
                        scope.editClass = 'red';
                        scope.sendClass = 'red';
                        scope.tagLabel = 'red';

                    }
                }
                scope.$watch('end', function(old, newer) {
                    update();
                    
                    $timeout(function() {
                        element.find('.grey.button').popup({
                            title   : 'Oh no!!',
                            content : 'One month notice already expired! Please send it manually if needed ;)'
                        });
                        element.find('.green.button').popup({
                            title   : 'All Green!!',
                            content : 'This mail will be sent in this month.'
                        });
                        element.find('.red.button').popup({
                            title   : 'Not right time!!',
                            content : 'This mail will be sent in upcoming months.'
                        });
                        element.find('.blue.button').popup({
                            title   : 'Yes!',
                            content : 'This mail has been successfully sent!'
                        });
                        element.find('.level-3.label').popup({
                            title   : 'INFO: 3 Months notice',
                            content : 'This mail suppose to be sent 3 months before the expiry month.'
                        });
                        element.find('.level-2.label').popup({
                            title   : 'INFO: 2 Months notice',
                            content : 'This mail suppose to be sent 2 months before the expiry month.'
                        });
                        element.find('.level-1.label').popup({
                            title   : 'INFO: 1 Month notice',
                            content : 'This mail suppose to be sent 1 month before the expiry month.'
                        });    
                    }, 200);
                });
            },
            controllerAs: 'sms',
            controller: function($scope, InfoModalInstance, EditModalInstance) {
                this.openSendModal = function() {
                    function refactorDataFormat() {
                        var item = angular.extend({}, $scope.$parent.item);
                        var messagePosition = 3 - parseInt($scope.level);
                        item.monthsleft = parseInt($scope.level);
                        item.messages = item.messages[messagePosition];
                        item.titles = item.titles[messagePosition];
                        return item;
                    }
                    $scope.$emit('item to be sent to client', refactorDataFormat());
                    InfoModalInstance.open();
                };
                this.openEditModal = function() {
                    $scope.$emit('newBinding', {
                        formData: $scope.$parent.item,
                        messagePosition: 3 - parseInt($scope.level),
                        willSendOn: $scope.sendOn,
                        field: 'message'
                    });
                    EditModalInstance.open();
                };
            },
        };
    })
    .controller('ListController', function($scope, Email, EditModalInstance) {
        this.loading = true;
        Email.list().then(function(data) {
            this.loading = false;
            this.list = data;
        }.bind(this));


        this.openEditModal = function(item, attr) {
            $scope.$emit('newBinding', {
                formData: item,
                field: attr,
            });
            EditModalInstance.open();
        };
    })
    .controller('AddItemController', function(AddModalInstance, $window) {
        this.add = function() {
            AddModalInstance.open();
        };
        this.logout = function() {
            $window.location = '/@dmin/logout/';
        };
    })
    .controller('KevinItemController', function($scope, LabelColor, Email) {
        this.color = LabelColor.select($scope.$index);
        this.delete = function(index) {
            Email.delete(index);
        };
    });
