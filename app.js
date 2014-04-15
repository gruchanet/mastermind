var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var less = require('less-middleware');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('puzzle', {
        data: [], // układ liczb-kolorów do zganięcia
        size: 5,  // liczba wykorzystywanych „kolumn”
        color: 9,   // liczba dostępnych kolorów
        move: 0 // maksymalna liczba prób (0 – brak ograniczeń)
    });
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser('bardzo tajne aqq'));
    app.use(express.session());
    app.use(app.router);
    // „middleware” obsługujące LESS-a
    // samo kompiluje pliki less-owe do CSS
    // a do tego pliki wynikowe kompresuje
    // Opis parametrów:
    //
    // https://github.com/emberfeather/less.js-middleware
    app.use(less({
        src: path.join(__dirname, 'less'),
        dest: path.join(__dirname, 'public/css'),
        prefix: '/css',
        compress: true
    }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'bower_components/jquery/dist')));
});

app.configure('development', function () {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get(/^\/play\//, routes.play);
app.get(/^\/mark\//, routes.mark);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Serwer nasłuchuje na porcie ' + app.get('port'));
});
