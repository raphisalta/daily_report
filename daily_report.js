jQuery(function($){
    function debounce(interval, func) {
        var timer = null;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(func, interval);
        };
    };

    function onLoad(e) {
        load();
        validate();
        calculateTotalCost();
        generateReport();
    };
    function onChange(e) {
        arrangeCostRows();
        validate();
        calculateTotalCost();
        generateReport();
        save();
    };
    function onClickReport(e) {
        $(e.target).select();
    };
    function onMenuClick(e) {
        var id = $(e.target).data('menu-id');
        $.each($('.menu-items'), function(idx, items) {
            var $items = $(items);
            if ($items.data('menu-id') === id) {
                if ($items.is(':visible')) {
                    $items.hide();
                } else {
                    $items.show();
                    $(items).offset({left:$(e.target).offset().left});
                }
            } else {
                $items.hide();
            }
        });
    };
    function onMenuAction(e) {
        switch($(e.target).data('action-id')) {
        case 'take-over':
            takeOver();
            break;
        case 'data-export':
            dataExport();
            break;
        }
        $('.menu-items').hide();
    };

    function  generateReport() {
        var fragment = '';
        var d = new Date();
        fragment = fragment + '【日報】' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + 
                '(' + ['日','月','火','水','木','金','土'][d.getDay()] + ')\n\n';

        var $sections = $('.section');
        $.each($sections, function(idx, section) {
            var $section = $(section);
            var title = $section.find('.section-title').val();
            fragment = fragment + '■' + title + '\n';

            var $value = $(section).find('.section-value');
            if ($section.hasClass('essay')) {
                fragment = fragment + $value.val();
                fragment = fragment + '\n';
            } else if ($section.hasClass('range')) {
                fragment = fragment + $value.find('.from').val() + ' - ' + $value.find('.to').val();
                fragment = fragment + '\n';
            } else if ($section.hasClass('cost-input')) {
                $.each($value.find('.production-cost'), function(idx, row){
                    var $row = $(row);
                    var cost = $row.find('.costs').val();
                    var content = $row.find('.task-content').val();
                    if (cost === '' && content === '') {
                        return;
                    }
                    fragment = fragment + '[' + cost + '] ' + content + '\n';
                });
            } else {
                error.log($section);
                throw 'can not handle the section.';
            }

            fragment = fragment + '\n\n';
        });

        var $viewArea = $('.view-area');
        var $report = $('.report');
        var scrollTop = $viewArea.scrollTop();
        $report.val(fragment);
        adjustHeight($report);
        $viewArea.scrollTop(scrollTop);
    };

    function adjustHeight($report) {
        $report.height(0);
        $report.height($report[0].scrollHeight);
    };

    function validate() {
        var $sections = $('.section');
        var assert = function(isValid, $target) {
            if (isValid) {
                $target.removeClass('invalid');
            } else {
                $target.addClass('invalid');
            }
        };
        $.each($sections, function(idx, section) {
            var $section = $(section);
            var title = $section.find('.section-title').val();

            var $val = $(section).find('.section-value');
            if ($section.hasClass('essay')) {
                assert($val.val().trim() !== '', $val);
            } else if ($section.hasClass('range')) {
                assert($val.find('.from').val() !== '', $val.find('.from'));
                assert($val.find('.to').val() !== '', $val.find('.to'));
            } else if ($section.hasClass('cost-input')) {
                $.each($val.find('.production-cost'), function(idx, row){
                    var $row = $(row);
                    var cost = {};
                    cost['cost'] = $row.find('.costs').val();
                    cost['task-content'] = $row.find('.task-content').val();
                    if (cost['cost'] === '' && cost['task-content'] === '') {
                        return;
                    }
                    
                    assert(cost['cost'] !== '', $row.find('.costs'));
                    assert(cost['task-content'] !== '', $row.find('.task-content'));
                });
            } else {
                error.log($section);
                throw 'can not handle the section.';
            }
        });
    };

    function save() {
        var data = {};
        var $sections = $('.section');
        $.each($sections, function(idx, section) {
            var $section = $(section);
            var title = $section.find('.section-title').val();
            var value;

            var $val = $(section).find('.section-value');
            if ($section.hasClass('essay')) {
                value = $val.val();
            } else if ($section.hasClass('range')) {
                var range = {};
                range['from'] = $val.find('.from').val();
                range['to'] = $val.find('.to').val();
                value = range;
            } else if ($section.hasClass('cost-input')) {
                value = [];
                $.each($val.find('.production-cost'), function(idx, row){
                    var $row = $(row);
                    var cost = {};
                    cost['cost'] = $row.find('.costs').val();
                    cost['task-content'] = $row.find('.task-content').val();
                    if (cost['cost'] === '' && cost['task-content'] === '') {
                        return;
                    }
                    value.push(cost);
                });
            } else {
                error.log($section);
                throw 'can not handle the section.';
            }

            data[title] = value;
        });

        localStorage.setItem('daily-report', JSON.stringify(data));
    };

    function load(data) {
        if (!data) {
            data = JSON.parse(localStorage.getItem('daily-report'));
        }
        if (!data) {
            return;
        }

        
        var $sections = $('.section');
        $.each($sections, function(idx, section) {
            var $section = $(section);
            var title = $section.find('.section-title').val();
            var value = data[title];

            if (!value) {
                return;
            }

            var $val = $section.find('.section-value');
            if ($section.hasClass('essay')) {
                $val.val(value);
            } else if ($section.hasClass('range')) {
                var range = value;
                $val.find('.from').val(range['from']);
                $val.find('.to').val(range['to']);
            } else if ($section.hasClass('cost-input')) {
                $.each(value, function(idx, cost){
                    var $row = $($('#' + $section.data('template-id')).html());
                    $row.find('.costs').val(cost['cost']);
                    $row.find('.task-content').val(cost['task-content']);
                    $val.append($row);
                });
            } else {
                error.log($section);
                throw 'can not handle the section.';
            }
        });
        arrangeCostRows();
    };

    function arrangeCostRows() {
        $.each($('.cost-input'), function(idx, section) {
            arrange($(section));
        });
    };

    function arrange($section) {
        $.each($section.find('.section-row'), function(idx, row){
            var $row = $(row);
            if ($row.find('.costs').val() === '' && $row.find('.task-content').val() === '') {
                $row.remove();
            } else {
                $row.removeClass('undraggable');
            }
        });
        $section.find('.section-value').append($('#' + $section.data('template-id')).html());
    };

    function calculateTotalCost() {
        var $totalCost = $('.total-cost');

        var total = 0;
        $.each($totalCost.parents('.section').find('.production-cost'), function(idx, row){
            var $row = $(row);
            var num = Number($row.find('.costs').val());
            total = total + num;
        });
        $totalCost.val(total.toFixed(1));
    };

    var $floating = $('.floating-div');
    var isDragging = false;
    function onDragStart(e) {
        var $row = $(e.target).parents('.section-row');
        $row.before($($('#reorder-provision-template').html()));
        $floating.append($row);
        isDragging = true;
        e.preventDefault();
        e.stopPropagation();
    };
    function onDragging(e) {
        if (!isDragging) {
            return;
        }
        var x = e.clientX + 8;
        var y = e.clientY - 12;
        $floating.offset({'top':y, 'left':x});

        $.each($('.cost-input .production-cost'), function(idx, row) {
            var $r = $(row);
            var bottom = $r.offset().top + ($r.height() / 2);
            var top = bottom - $r.height() - 4;
            if (top <= e.clientY && e.clientY <= bottom) {
                $r.before($('.cost-input').find('.reorder-provision'));
            }
        });
    };
    function onDragEnd(e) {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        $floating.find('.section-row').insertAfter('.reorder-provision');
        $('.cost-input').find('.reorder-provision').remove();
    };

    function takeOver() {
        var $todayCost;
        var $nextdayCost;
        $.each($('.section-value'), function(idx, valueElm) {
            var $value = $(valueElm);
            if ($value.hasClass('contents')) {
                $value.val('');
            } else if ($value.hasClass('days-cost')) {
                if ($value.data('days-cost-id') === 'today') {
                    $todayCost = $value;
                } else if ($value.data('days-cost-id') === 'nextday') {
                    $nextdayCost = $value;
                }
            }
        });
        $todayCost.children().remove();
        $todayCost.append($nextdayCost.children());

        validate();
        calculateTotalCost();
        arrangeCostRows();
    };

    function dataExport() {
        var data = localStorage.getItem('daily-report');
        var blob = new Blob([data], { "type" : "application/plain" });
        window.URL = window.URL || window.webkitURL;
        $("#export-link").attr("href", window.URL.createObjectURL(blob));
        $("#export-link").get(0).click();
    };

    var onChangeDebounce = debounce(100, onChange);
    $(window).on('load', onLoad);
    $('.cost-input').on('mousedown', '.draggable-icon', onDragStart);
    $('.form').on('mousemove', onDragging);
    $('.form').on('mouseup', onDragEnd);
    $('.menu-button').on('click', onMenuClick);
    $('.menu-action').on('click', onMenuAction);
    $('.form').on('change input', '.save-trigger', onChangeDebounce);
    $('.report').on('click', onClickReport);

});
