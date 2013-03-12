// futboParaTodosAPI.js
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

//Modulo que reune las operaciones mas comunes para obtener datos desde el sitio futbolparatodos.com.ar


funcionesHTTP=require('./funcionesHTTP.js');

cheerio=require('cheerio');


//	CONSTANTES
//

URL_PRINCIPAL='http://www.futbolparatodos.com.ar';

//URL donde se encuentran las posiciones del: Inicial/Final de Primera, el Actual del Nacional B y los puntos de la Seleccion.
URL_POSICIONES=URL_PRINCIPAL+'/posiciones/';

//Clases de los Elementos HTML (tablas) para extrear la info
ELEMENTO_PRIMERA_DIVISION	= 'table.posiciones-1020'
ELEMENTO_PRIMERA_B_NACIONAL	= 'table.posiciones-131'
ELEMENTO_SELECCION			= 'table.posiciones-135'


//	FUNCIONES PRIVADAS
//


// @nombre:			obtenerTextoDeHijo
// @descripción:	Devuelve el texto de un Enesimo hijo. Este no posee ningun otro elemento, p.e: <td>TEXTO</td>. El padre se obtiene usando algún selector de cheerio.
// @estado:			Estable
// @parámetro	padre: objeto, elemento HTML obtenido por cheerio
// @parámetro	hijoN: numero, posicion/indice dentro del arreglo de children del objeto padre.
// @retorno	string, el texto deseado
function obtenerTextoDeHijo(padre,hijoN){
	return padre.children[hijoN].children[0].data;
}


// @nombre:			extraerEstadisticasDeEquipo
// @descripción:	Extrea del elemento HTML (tr) que contiene las estadisticas para un equipo, los campos (nombre, puntos, goles...)
// @estado:			Estable
// @parámetro	objetoHTML: objeto, creado en base al selector de cheerio. Es el "tr" contenedor de los campos de estadisticas para un solo equipo.
// @retorno	objeto: las estadisticas del equipo.
function extraerEstadisticasDeEquipo(objetoHTML){
	equipo={}

	//objetoHTML=tr. Existe un td para cada campo: Posicion, nombre,PJ,G,E,P,...
	//tr.td[0].texto
	equipo.posicion=parseInt(obtenerTextoDeHijo(objetoHTML,0));

	//tr.td[1].a.texto. Nombre del equipo
	equipo.equipo=	objetoHTML.children[1].children[0].children[1].data.trim()

	equipo.partidos={}
	equipo.partidos.jugados		= parseInt(obtenerTextoDeHijo(objetoHTML,2))
	equipo.partidos.ganados		= parseInt(obtenerTextoDeHijo(objetoHTML,3))
	equipo.partidos.empatados	= parseInt(obtenerTextoDeHijo(objetoHTML,4))
	equipo.partidos.perdidos	= parseInt(obtenerTextoDeHijo(objetoHTML,5))
	
	equipo.goles={}
	equipo.goles.aFavor		= parseInt(obtenerTextoDeHijo(objetoHTML,6))
	equipo.goles.enContra	= parseInt(obtenerTextoDeHijo(objetoHTML,7))
	
	equipo.puntos= parseInt(obtenerTextoDeHijo(objetoHTML,8))

	return equipo;
}

// @nombre:			obtenerTablaDePosiciones
// @descripción:	Retorna un arreglo con la tabla de posiciones elegida (ELEMENTO_XXXX) obtenidas de una peticion HTTP
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	claseTabla: string, clase de la tabla HTML. Es una de las constantes ELEMENTO_XXXXX
// @parámetro	callback(array tablaDePosiciones): se reciben los datos listo para ofrecer como respuesta.
function obtenerTablaDePosiciones(req,res,claseTabla,callback){
	funcionesHTTP.peticionGET(req,res,URL_POSICIONES,function(html){
		$=cheerio.load(html)

		tablaDePosiciones=[]

		$(claseTabla+' tbody').find('tr').each(function(indice,elemento){
			equipo= extraerEstadisticasDeEquipo(elemento);
			tablaDePosiciones.push(equipo);
		});		
		//le retorno la tabla
		process.nextTick(function(){
			callback(tablaDePosiciones);
		});
	});
}



//	FUNCIONES PUBLICAS
//

// @nombre:			obtenerPosicionesDePrimeraDivision
// @descripción:	Retorna via callback la tabla de posiciones para la Primera Division Nacional en el torneo actual
// @estado:			Estable
// @parámetro	req:
// @parámetro	res:
// @parámetro	callback(array tablaDePosiciones): brinda los resultados
exports.obtenerPosicionesDePrimeraDivision=function(req,res,callback){
	obtenerTablaDePosiciones(req,res,ELEMENTO_PRIMERA_DIVISION,callback);
}

// @nombre:			obtenerPosicionesDePrimeraBNacional
// @descripción:	Retorna via callback la tabla de posiciones para el Nacional B en el torneo actual
// @estado:			Estable
// @parámetro	req:
// @parámetro	res:
// @parámetro	callback(array tablaDePosiciones): brinda los resultados
exports.obtenerPosicionesDePrimeraBNacional=function(req,res,callback){
	obtenerTablaDePosiciones(req,res,ELEMENTO_PRIMERA_B_NACIONAL,callback);
}

// @nombre:			obtenerPosicionesDeLaSeleccion
// @descripción:	Retorna via callback la tabla de posiciones para la Seleccion Nacional en la Copa Actual
// @estado:			Estable
// @parámetro	req:
// @parámetro	res:
// @parámetro	callback(array tablaDePosiciones): brinda los resultados
exports.obtenerPosicionesDeLaSeleccion=function(req,res,callback){
	obtenerTablaDePosiciones(req,res,ELEMENTO_SELECCION,callback);
}
