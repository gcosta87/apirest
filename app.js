// app.js
//
// Copyright 2013 Gonzalo Gabriel Costa <gonzalogcostaARROBAyahooPUNTOcomPUNTOar>

// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
// MA 02110-1301, USA.

/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),	
	servicios = require('./routes/servicios.js'),	
	http = require('http'),
	path = require('path'),
	expressLayoutEjs=require('express-ejs-layouts');

var app = express();

app.configure(function(){	
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.set('layout','layout.ejs')	//Default layout para todas las views: Bootstrap
	app.use(expressLayoutEjs);			//Activo el Layout EJS

	//app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
	
	//Constantes para las views
	app.locals={
		titulo: 		'APIRest',
		slogan: 		'Servicio Web de colección de implementaciones de APIs Rest',
		estado:			'pre-Alpha'
	}
	
});

app.configure('development', function(){
	app.use(express.errorHandler());
});
//URL Basicas/pseudo-estaticas
app.get('/', routes.inicio);
app.get('/acerca-de',routes.acercaDe);
app.get('/contacto',routes.contacto);
app.get('/ayuda',routes.ayuda);
app.get('/apis',routes.apis);

//Servicios implementados
// /api/*
app.all('/api/smn',routes.ERROR_API_NO_IMPLEMENTADA);
app.all('/api/personal',routes.ERROR_API_NO_IMPLEMENTADA);
app.all('/api/divisas/:divisa',servicios.divisas);
app.all('/api/acciones/:empresa',routes.ERROR_API_NO_IMPLEMENTADA);
app.all('/api/peliculas',routes.ERROR_API_NO_IMPLEMENTADA);



//Si apunta a la "base" de las APIs, redirijo al usuario a la Galeria.../apis
app.all('/api/?',function(req,res){
	res.redirect('/apis')
});




//

//Error 404
app.all('*',routes.error404)

http.createServer(app).listen(80, function(){
	console.log("\n\n\tAPIRest ya está corriendo...:)\n ");
});
