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
//URL donde se encuentan los datos de un equipo en particular: se "completa" con el nombre a continuacion
URL_EQUIPO=URL_PRINCIPAL+'/clubes/';

//Clases de los Elementos HTML (tablas) para extrear la info
ELEMENTO_PRIMERA_DIVISION	= 'table.posiciones-1020'
ELEMENTO_PRIMERA_B_NACIONAL	= 'table.posiciones-131'
ELEMENTO_SELECCION			= 'table.posiciones-135'

//Objeto fuente usado en las respuestas
exports.fuente={
	nombre:	'Futbol para Todos',
	url:	'http://www.futbolparatodos.com.ar'
}


// Estructura pública que contiene los equipos que pueden consultarse segun FPT
equipos={
	'lanus': {identificador: 'lanus', nombre: 'Lanús',nombreLargo: 'Club Atlético Lanús'}, 
	'river': {identificador: 'river', nombre: 'River Plate',nombreLargo: 'Club Atlético River Plate'}, 
	'godoy-cruz': {identificador: 'godoy-cruz', nombre: 'Godoy Cruz',nombreLargo: 'Club Deportivo Godoy Cruz Antonio Tomba'}, 
	'quilmes': {identificador: 'quilmes', nombre: 'Quilmes',nombreLargo: 'Quilmes Atlético Club'}, 
	'tigre': {identificador: 'tigre', nombre: 'Tigre',nombreLargo: 'Club Atlético Tigre'}, 
	'newells-old-boys': {identificador: 'newells-old-boys', nombre: 'Newells',nombreLargo: 'Newell´s Old Boys'}, 
	'arsenal': {identificador: 'arsenal', nombre: 'Arsenal',nombreLargo: 'Arsenal Fútbol Club'}, 
	'racing': {identificador: 'racing', nombre: 'Racing',nombreLargo: 'Racing Club'}, 
	'belgrano': {identificador: 'belgrano', nombre: 'Belgrano',nombreLargo: 'Club Atlético Belgrano de Cordoba'}, 
	'rafaela': {identificador: 'rafaela', nombre: 'Rafaela',nombreLargo: 'Atlético de Rafaela'}, 
	'velez': {identificador: 'velez', nombre: 'Vélez',nombreLargo: 'Club Atlético Vélez Sársfield'}, 
	'san-lorenzo': {identificador: 'san-lorenzo', nombre: 'San Lorenzo',nombreLargo: 'Club Atlético San Lorenzo de Almagro'}, 
	'independiente': {identificador: 'independiente', nombre: 'Independiente',nombreLargo: 'Club Atlético Independiente'}, 
	'all-boys': {identificador: 'all-boys', nombre: 'All Boys',nombreLargo: 'Club Atlético All Boys'}, 
	'union': {identificador: 'union', nombre: '',nombreLargo: 'Club Atlético Unión de Santa Fe'}, 
	'boca': {identificador: 'boca', nombre: 'Boca Juniors',nombreLargo: 'Club Atlético Boca Juniors'}, 
	'san-martin-sj': {identificador: 'san-martin-sj', nombre: 'San Martín de San Juan',nombreLargo: 'Club Atlético San Martín de San Juan'}, 
	'estudiantes-lp': {identificador: 'estudiantes-lp', nombre: 'Estudiantes',nombreLargo: 'Club Estudiantes de La Plata'}, 
	'colon': {identificador: 'colon', nombre: 'Colón',nombreLargo: 'Club Atlético Colón'}, 
	'argentinos': {identificador: 'argentinos', nombre: 'Argentinos Juniors',nombreLargo: 'Asociación Atlética Argentinos Juniors'}
}
exports.equipos=equipos;


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
// @descripción:	Extrea del elemento HTML (tr en la tabla de posiciones) que contiene las estadisticas para un equipo, los campos (nombre, puntos, goles...)
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

// @nombre:			convertirAbreviaturasDeRacha
// @descripción:	Reemplaza las Abreviaturas G,P,E por Ganó, Perdió y Empató respectivamente.
// @estado:			Estable
// @parámetro	cadena: string, a convertir
// @retorno	string: la cadena convertida.
function convertirAbreviaturasDeRacha(cadena){
	//remplazo las correspondientes abreviaturas por la palabra
	cadena=cadena.replace(/G/g,'Ganó, ');
	cadena=cadena.replace(/E/g,'Empató, ');
	cadena=cadena.replace(/P/g,'Perdió, ');
	
	//elimino la coma y espacio del final
	return cadena.replace(/, $/,'');
}

//	FUNCIONES PUBLICAS
//


// @nombre:			obtenerDatosDeEquipo
// @descripción:	Consulta a FPT para obtener los datos basicos: puntos, goles, url de sitio web. Puede llegar a agregase plantel.
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	equipo: objeto, obtenido segun la estructura equipos.
// @parámetro	callback(objeto equipo): retorna un objeto representado al equipo deseado
exports.obtenerDatosDeEquipo=function(req,res,equipo,callback){
	funcionesHTTP.peticionGET(req,res,URL_EQUIPO+equipo.identificador,function(html){
		$=cheerio.load(html);
		
		//estructura para almacentar los elementos a procesar
		elementos=[]
		$('div#estadisticasdelclub').find('p').each(function(indice,elemento){
			elementos.push(elemento);			
		});
		
		respuesta={}
		respuesta.equipo			= equipo.nombre;
		
		respuesta.ultimos5Resultados= convertirAbreviaturasDeRacha(elementos[0].children[2].children[0].data);
		respuesta.puntos			= parseInt(elementos[1].children[1].data)
		
		respuesta.goles={}
		respuesta.goles.aFavor		= parseInt(elementos[2].children[1].data)
		respuesta.goles.enContra	= parseInt(elementos[3].children[1].data)
		
		respuesta.promedio			= parseFloat(elementos[4].children[1].data)
		respuesta.partidosJugados	= parseInt(elementos[5].children[1].data)
		
		process.nextTick(function(){
			callback(respuesta);
		});
	});
}


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
