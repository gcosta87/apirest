// index.js
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

/*
 * Controlador de las paginas "estaticas" y errores basicos (404)
 */

exports.inicio = function(req, res){
  res.locals.seccion='Inicio' 
  res.render('inicio');
};

exports.error404=function(req,res){
	res.locals.seccion='Error 404'
	res.render('error404',{url: req.url})
}

exports.acercaDe=function(req,res){
	res.locals.seccion='Acerca de'
	res.render('acerca-de');
}

exports.ayuda=function(req,res){
	res.locals.seccion='Ayuda'
	res.render('ayuda')
}

exports.contacto=function(req,res){
	res.locals.seccion='Contacto'
	res.render('contacto')
}

exports.apis=function(req,res){
	res.locals.seccion='Galeria de APIs'
	res.render('apis')
}

exports.ERROR_API_NO_IMPLEMENTADA=function(req,res){
	res.locals.seccion='Error 500'
	res.status(500)
	res.render('error500',{mensaje: 'API no implementada'})
}
