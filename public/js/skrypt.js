$(function () {

    // notification's button close event
    $('#notification .close-btn').click(function (event) {
        this.parentElement.style.backgroundColor = '';
        this.parentElement.style.display = 'none';
        $('#notification .inner-box').html('');
    });

    // notification notice alert
    var showAlert = function (msg, type) {
        if (type == 'error') {
            $('#notification')[0].style.backgroundColor = '#f2dede';
            $('#notification')[0].style.display = 'block';
            $('#notification .inner-box').html(msg);
        } else {
            $('#notification')[0].style.display = 'block';
            $('#notification .inner-box').html(msg);
        }
    }

    // play form submission
    $('#playForm').submit(function (event) {
        event.preventDefault();
        var $this = $(this);

        // prepare data
        var formData = $this.serializeArray();
        for(var input in formData) {
            formData[formData[input].name] = formData[input].value;
        }

        $.ajax({
            type: 'GET',
            url: '/play/',
            data: formData,
            dataType: 'json',
            success: function (data) {
                showAlert(data.msg);

                createGame(data);
            },
            error: function (xhr) {
                var data = JSON.parse(xhr.responseText);

                if (typeof data.msg === 'undefined') {
                    data.msg = 'Utracono połączenie z serwerem! Odśwież stronę.';
                }

                showAlert(data.msg, 'error');
            }
        });
    });

    // mark form submission
    var markFormSubmit = function (event) {
        event.preventDefault();
        var $this = $(this);

        // prepare data
        var formData = $this.serializeArray();

        $.ajax({
            type: 'GET',
            url: '/mark/',
            data: formData,
            dataType: 'json',
            success: function (data) {
                showAlert(data.msg);

                submitAttempt(data);
            },
            error: function (xhr) {
                var data = JSON.parse(xhr.responseText);

                if (typeof data.msg === 'undefined') {
                    data.msg = 'Utracono połączenie z serwerem! Odśwież stronę.';
                }

                showAlert(data.msg, 'error');
            }
        });
    };

    // prepare game interface
    var createGame = function (responseData) {
        var
            puzzleSize = responseData.puzzleSize,
            colorCount = responseData.colorCount,
            currentMove = responseData.currentMove,
            movesLeft = responseData.movesLeft;

        // prepare div#interface HTML
        var moves, tableHead = '';
        var movesLeft = movesLeft != -1 ? movesLeft : 'nieskończoność';

        // TODO: <div> initial settings </div>
        moves = '<div id="moves-box">Liczba pozostałych prób: <b>' + movesLeft + '</b></div>';

        tableHead += '<th>Próba</th>'
        for (var i = 0; i < puzzleSize; i++) {
            tableHead += '<th></th>';
        }
        tableHead +=
            '<th>Ocena próby</th>' +
            '<th></th>';

        var tableBody = inputRow(puzzleSize, colorCount, currentMove);

        var table =
            '<form id="markForm">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                    tableHead +
                    '</tr>' +
                '</thead>' +
                '<tbody id="marks-in-the-box">' +
                    tableBody +
                '</tbody>' +
            '</table>' +
            '</form>';

        // wrap div#interface inner HTML
        $('#interface').html(moves + table);

        $('#markForm').submit(markFormSubmit);
    };

    // returns row with input fields
    var inputRow = function (size, colors, attemptNumber) {
        var rowData = '';
        var colors = colors - 1;

        rowData += '<td class="attempt-number">' + attemptNumber + '</td>';
        for (var i = 0; i < size; i++) {
            rowData +=
                '<td class="attempt-cell">' +
                    '<input name="' + i + '" type="number" min="0" max="' + colors + '" required>' +
                '</td>';
        }

        // marks: black dots: ●●● | white dots: ○○○
        rowData +=
            '<td class="attempt-mark to-grade"></td>' +
            '<td><button id="submitAttempt" type="submit">Oceń</button></td>';

        return '<tr>' + rowData + '</tr>';
    };

    // submit attempt -> generates row with data from last input row, checks status & updates moves left
    var submitAttempt = function (responseData) {
        var
            status = responseData.status,
            movesLeft = responseData.movesLeft;

        // update moves left
        if (movesLeft != -1) {
            $('#moves-box').html('<div id="moves-box">Liczba pozostałych prób: <b>' + movesLeft + '</b></div>');
        }

        // transform input into span
        $('#marks-in-the-box input').each(function () {
            $(this).replaceWith('<span>' + $(this)[0].value + '</span>');
        });

        $('#marks-in-the-box #submitAttempt').remove();

        // prepare marks
        var marks = '';

        for (var i = 0; i < responseData.blackDots; i++) {
            marks += '●';
        }
        marks += ' ';
        for (var i = 0; i < responseData.whiteDots; i++) {
            marks += '○';
        }

        // set marks
        $('#marks-in-the-box .attempt-mark.to-grade')
            .html(marks)
            .removeClass('to-grade');

        // check status and do as it follows
        if (status == 'trying') {
            // set new inputs
            $('#marks-in-the-box').prepend(inputRow(responseData.puzzleSize, responseData.colorCount, responseData.currentMove));
        } else if (status == 'lose') {
            var solution = JSON.stringify(responseData.initialSet, null, ' ');

            $('#moves-box').after('<div id="solution">Prawidłowe rozwiązanie: <b>' + solution + '</b></div>');
        }
    };
});
