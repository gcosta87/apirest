// yahooFinanzasAPI.js
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
 * Pequeño módulo que contiene informacion relativa a la API de Yahoo Finanzas CSV.
 * Esta es su representacion inicial de la API.
 *
 * Fuente de los parametros: http://greenido.wordpress.com/2009/12/22/yahoo-finance-hidden-api/
 *
 * Ejemplo: download.finance.yahoo.com/d/quotes.csv?s=YPFD.BA&f=snl1cc3c6m
 *
 */ 

funcionesHTTP=require('./funcionesHTTP.js')

//	CONSTANTES
//

URL_API='http://download.finance.yahoo.com/d/quotes.csv';

//objeto para enviar en las respues al cliente
exports.fuente={
	nombre:		'Yahoo! Finanzas Argentina',
	url:		'http://ar.finanzas.yahoo.com/'	
},

//Acciones soportadas: Todas del Merval
tipoDeAcciones={
	'alua.ba':		{simbolo: 'ALUA.BA', nombre: 'Aluar Aluminio Argentino S.A.I.C'},
	'apbr.ba':		{simbolo: 'APBR.BA', nombre: 'Petroleo Brasileiro SA Petrobras'},
	'bma.ba':		{simbolo: 'BMA.BA', nombre: 'Macro Bank, Inc.'},
	'come.ba':		{simbolo: 'COME.BA', nombre: 'Sociedad Comercial del Plata SA'},
	'edn.ba':		{simbolo: 'EDN.BA', nombre: 'EMP.DIST.Y COM.NORTE'},
	'erar.ba':		{simbolo: 'ERAR.BA', nombre: 'Siderar S.A.I.C.'},
	'fran.ba':		{simbolo: 'FRAN.BA', nombre: 'Bbva Banco Frances,S.A.'},
	'ggal.ba':		{simbolo: 'GGAL.BA', nombre: 'Grupo Financiero Galicia SA'},
	'pamp.ba':		{simbolo: 'PAMP.BA', nombre: 'Pampa Energia SA'},
	'pesa.ba':		{simbolo: 'PESA.BA', nombre: 'Petrobras Argentina SA'},
	'teco2.ba':	{simbolo: 'TECO2.BA', nombre: 'Telecom Argentina SA'},
	'ts.ba':		{simbolo: 'TS.BA', nombre: 'Tenaris SA'},
	'ypfd.ba':		{simbolo: 'YPFD.BA', nombre: 'YPF Sociedad Anonima'}	
}
exports.tipoDeAcciones=tipoDeAcciones;

//Representan los nombres de los parametros 
parametro={
	simbolo:	's',
	formato:	'f'
}

//Valores que se le pueden solicitar a la API
//Faltan mas
formato={
	nombre: 				{nombre: 'nombre',						valor: 'n',		procesar: procesarNoProcesar},
	simbolo: 				{nombre: 'simbolo',					valor: 's',		procesar: procesarSimbolo},
	ultimaCotizacion:		{nombre: 'ultimaCotizacion',			valor: 'l1',	procesar: parseFloat},
	variacion:				{nombre: 'variacion',					valor: 'c6',	procesar: parseFloat},
	variacionConPorcentaje:	{nombre: 'variacionConPorcentaje',	valor: 'c',		procesar: parseFloat},
	variacionEnPorcentaje:	{nombre: 'variacionEnPorcentaje',	valor: 'p2',	procesar: parseFloat},
	maximoDelDia:			{nombre: 'maximoDelDia',				valor: 'h',		procesar: parseFloat},
	minimoDelDia:			{nombre: 'minimoDelDia',				valor: 'g',		procesar: parseFloat},
	rangoDelDia:			{nombre: 'rangoDelDia',				valor: 'm',		procesar: procesarNoProcesar},
	fecha:					{nombre: 'fecha',						valor: 'd1',	procesar: procesarFecha},
	hora:					{nombre: 'hora',						valor: 't1',	procesar: procesarHora},
	valorCierreAnterior:	{nombre: 'valorCierreAnterior',		valor: 'p',		procesar: parseFloat},
	valorDeApertura:		{nombre: 'valorDeApertura',			valor: 'o',		procesar: parseFloat},
	volumen:				{nombre: 'volumen',					valor: 'v',		procesar: parseInt}
}
exports.formato=formato;

//Es un arreglo para generar una consulta por defecto.
exports.consultaDefault=[
	formato.simbolo,
	formato.nombre,
	formato.ultimaCotizacion,
	formato.variacion,
	formato.variacionEnPorcentaje,
	formato.valorDeApertura,
	formato.valorCierreAnterior,
	formato.fecha,
	formato.hora
];


//	FUNCIONES PRIVADAS
//
	
// @nombre:			valoresDeFormatoATexto
// @descripción:	Convierte a string los valores de los elementos de un arreglo formado por items de la estrucutra formato. Es necesario para consultar la API
// @estado:			Estable
// @parámetro	formato: arreglo, items pertenecientes a la estructura formato.
// @retorno	string: Los valores convertidos a texto como lo requiere la API consultada.
function valoresDeFormatoATexto(formato){
	resultado='';
	for(i=0;i<formato.length;i++){
		resultado+=formato[i].valor;
	}
	return resultado;
}
	
// Funciones de tratamiento de valores
//

//convierto la fecha de mm/dd/aaaa -> dd/mm/aaaa
function procesarFecha(cadena){
	fecha=cadena.split('/');
	return fecha[1]+'/'+fecha[0]+'/'+fecha[2];
}

// TO-DO: verificar si Huso Horario se calcula con +1
function procesarHora(cadena){
	cadena= cadena.trim();

	//Si posee el pm le sumo 12hs + 1 para calcular el Huso Horario para Argentina: 
	if(cadena.indexOf('pm')>0){
		hora=cadena.split(':')
		cadena=(parseInt(hora[0])+12 + 1)+':'+hora[1]
	}
	return cadena.replace(/(am|pm)/g,'')
}
//Elimina el '.BA' del simbolo
function procesarSimbolo(cadena){
	return cadena.replace('.BA','');
}

// TO-DO: Buscar una solucion mejor...
//falsa funcion para no procesar los valores que no lo requieran. 
function procesarNoProcesar(cadena){
	return cadena;
}


// @nombre:			generarURL
// @descripción:	Genera una URL en base a un Simbolo (nombre de accion/empresa) y un arreglo de valores de formatos
// @estado:			Estable
// @parámetro	accion: objeto, correspondiente a la estructura tipoDeAcciones.
// @parámetro	arregloFormato: arreglo, contiene los parametros que se le solicitaran a la API. Cada item forma parte de la estructura formato, o es del arreglo predefinido (consultaDefault).
// @retorno	string: La URL correspondiente
function generarURL(accion, arregloFormato){
	if(!accion){
		throw "Error en YahooFinanzasAPI: No se ha definido una Accion"
	}
	if(!arregloFormato){
		throw "Error en YahooFinanzasAPI: No se ha definido un arreglo con formatos para solicitar"
	}
	return URL_API+'?'+parametro.simbolo+'='+ accion.simbolo +'&'+ parametro.formato +'='+valoresDeFormatoATexto(arregloFormato);
}


// @nombre:			procesarRespuestaSegunFormato
// @descripción:	En base a un formato , arreglo de elementos de la estructura formato, se genera un objeto "accion" procesado segun la respuesta de la API.
// @estado:			Borrador
// @parámetro	respuesta: stirng, respuesta proveniente de la API. En formato CSV
// @parámetro	formato: arreglo, formato utilizado para hacer la consulta original.
// @retorno	objeto: La Accion propiamente dicha, ya procesada y lista para enviar al cliente
function procesarRespuestaSegunFormato(respuesta,formato){
		//Genero la respuesta
		respuesta=respuesta.replace(/["%]/g,'')
		campos=respuesta.split(',');

		//Objeto respuesta
		accion={}

		//Recorro el arreglo de formato, y contruyo la Accion como resultado.
		//Cada campo es procesado segun el Formato solicitado (fecha, valoracion, cotizacion)
		//y es adjuntado a la Accion con el nombre correspondiente
		for(i=0;i<formato.length;i++){
			accion[formato[i].nombre]=formato[i].procesar(campos[i]);
		}
		
		return accion;
}


//	FUNCIONES PUBLICAS
//


// @nombre:			obtenerCotizacion
// @descripción:	Realiza la consulta a la API de YAhoo y obtiene la cotizacion de la accion solicitada
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	accion: objeto, correspondiente a la estructura tipoDeAcciones
// @parámetro	formato: arreglo, compuesto por los elementos de la estrucutra formato.
// @parámetro	callback(objeto accion): retorna la accion ya lista para enviar.
exports.obtenerCotizacion=function(req,res,accion,formato,callback){
	//Realizo la consulta..
	funcionesHTTP.peticionGET(req,res,generarURL(accion,formato),function(respuesta){
		accion=procesarRespuestaSegunFormato(respuesta,formato)
						
		//Envio la respuesta al usr
		process.nextTick(function(){
			callback(accion)
		});
	});
	
}
