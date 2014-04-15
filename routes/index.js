/*
 url.format
 http.request
 */

exports.index = function (req, res) {
    req.session.puzzle = req.session.puzzle || req.app.get('puzzle');
    res.render('index', {
        title: 'Mastermind game',
        maxSize: 10,
        maxColors: 10,
        maxMoves: 20,
        defaultSize: 5,
        defaultColors: 9,
        defaultMoves: 10
    });
};

exports.play = function (req, res) {
    var newGame = function () {
        var params = req.query;
        var puzzle = req.session.puzzle;

        if (typeof params['size'] !== 'undefined' &&
            typeof params['color'] !== 'undefined' &&
            typeof params['move'] !== 'undefined') {
            var data = [];

            // set params to session
            for (var value in params) {
                puzzle[value] = params[value];
            }

            // set random numbers
            for (var i = 0; i < puzzle.size; i++) {
                data.push(Math.floor(Math.random() * puzzle.color));
            }
            puzzle.data = data;

            console.log(puzzle);

            // set starting moves
            req.session.gameState = {
                currentMove: 1,
                movesLeft: params['move'] > 0 ? params['move'] : -1
            };

            return {
                success: true,
                msg: 'Rozpoczęto nową grę',
                puzzleSize: puzzle.size,
                colorCount: puzzle.color,
                currentMove: req.session.gameState.currentMove,
                movesLeft: req.session.gameState.movesLeft
            };
        } else {
            res.statusCode = 400;
            return {
                success: false,
                msg: 'Wystąpił błąd podczas próby rozpoczęcia nowej gry. Spróbuj ponownie!'
            }
        }
    };

    res.json(newGame());
};

exports.mark = function (req, res) {
    var markAnswer = function () {
        var
            puzzle = req.session.puzzle,
            gameState = req.session.gameState;

        var
            initial = puzzle.data,
            attempt = req.query;

        // reduce moves left
        if (gameState.movesLeft > 0) {
            gameState.currentMove += 1;
            gameState.movesLeft -= 1;
        }

        var
            blackDots = 0,
            whiteDots = 0,
            ratedAttempt = new Array(),
            ratedInitial = new Array();

        // compare attempt with initial set
        for (var i = 0; i < puzzle.size; i++) {
            if (attempt[i] == initial[i]) {
                ++blackDots;
                ratedAttempt[i] = true;
                ratedInitial[i] = true;
            }
        }

        for (var i = 0; i < puzzle.size; i++) {
            if (!ratedAttempt[i]) {
                for (var j = 0; j < puzzle.size; j++) {
                    if (!ratedInitial[j] && attempt[i] == initial[j]) {
                        ++whiteDots;
                        ratedAttempt[i] = true;
                        ratedInitial[j] = true;

                        break;
                    }
                }
            }
        }

        var status, msg;

        // rate the attempt & check moves left
        if (blackDots == puzzle.size) {
            status = 'win';
            msg = 'Brawo! Odgadłeś prawidłowe ułożenie.';

            return {
                success: true,
                status: status,
                msg: msg,
                currentMove: gameState.currentMove,
                movesLeft: gameState.movesLeft,
                blackDots: blackDots,
                whiteDots: whiteDots
            }
        } else if ((gameState.movesLeft == -1 || gameState.movesLeft > 0) && blackDots < puzzle.size) {
            status = 'trying';
            var
                blackDotRatio = blackDots/puzzle.size,
                whiteDotRatio = whiteDots/puzzle.size;

            // messages
            if (blackDotRatio == 0) {
                if (whiteDotRatio == 1) {
                    msg = 'Wystarczy pokombinować. :)';
                } else if (whiteDotRatio > 0.5) {
                    msg = 'Kombinuj, kombinuj...';
                } else if (whiteDotRatio > 0) {
                    msg = 'Jeszcze długa droga przed tobą...'
                } else if (whiteDotRatio == 0) {
                    msg = 'Całkiem źle!'
                }
            } else if (blackDotRatio > 0.5) {
                if (whiteDotRatio > 0.5) {
                    msg = 'Całkiem blisko!';
                } else if (whiteDotRatio > 0) {
                    msg = 'Dajesz radę!'
                } else if (whiteDotRatio == 0) {
                    msg = 'Nawet nieźle!'
                }
            } else if (blackDotRatio > 0) {
                if (whiteDotRatio > 0.5) {
                    msg = 'Jeszcze dzień wyjdę stąd...';
                } else if (whiteDotRatio > 0) {
                    msg = 'Nie-źle!'
                } else if (whiteDotRatio == 0) {
                    msg = 'Próbuj, próbuj.'
                }
            }

            return {
                success: true,
                status: status,
                msg: msg,
                puzzleSize: puzzle.size,
                colorCount: puzzle.color,
                currentMove: gameState.currentMove,
                movesLeft: gameState.movesLeft,
                blackDots: blackDots,
                whiteDots: whiteDots
            };
        } else if (gameState.movesLeft == 0) {
            status = 'lose';
            msg = 'Przegrałeś! Wyczerpałeś limit prób odgadywania.';

            return {
                success: true,
                status: status,
                msg: msg,
                currentMove: gameState.currentMove,
                movesLeft: gameState.movesLeft,
                blackDots: blackDots,
                whiteDots: whiteDots,
                initialSet: initial
            };
        }
    };

    res.json(markAnswer());
};