// funcionesDeServicios.js
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


//	Modulo que contiene funciones comunes para todos los servicios


util=require('util');
superagent=require('superagent');

//	CONSTANTES/GLOBALES
//

//arreglo asociativo, donde estan los parametros esperados y la funcion correspondiente de conversion
//"Default" es alias/sinonimo de JSON
formatosDeRespuesta={
	'json':	{funcion: formatoJSON, tipoMIME: 'application/json'},
	'xml':		{funcion: formatoXML, tipoMIME: 'application/xml'},
	'debug':	{funcion: formatoDebug, tipoMIME: 'text/html'},
	'txt':		{funcion: formatoTXT, tipoMIME: 'text/plain'},
	'csv':		{funcion: formatoCSV, tipoMIME: 'text/csv'},
	'default':	{funcion: formatoJSON, tipoMIME: 'application/json'}
}



//	Implementacion base de las funciones de formato
function formatoJSON(objeto){
	return JSON.stringify(objeto)
}


// TO-DO:	Soporte para enviar Colleción de Objetos
// nombre:		formatoTXT
// descripción:	Convierte un Objeto en formato TXT de Unix
// estado:		Borrador
// @param	objeto: el O que se va a procesar
// @param	padre: string que se utiliza para el procesamiento de "subatrubutos" (p.e direccion.calle). Inicialemnte debe ser ''.
// @return	string: devuelve la conversion.
function formatoTXT(objeto,padre){
	var resultado="";
	if(padre){padre+='.'}

	for (atributo in objeto){
		if(typeof objeto[atributo] === "object"){
			resultado+=formatoTXT(objeto[atributo],padre+atributo)
		}
		else{
			resultado+=padre+atributo+':'+objeto[atributo]+'\n'
		}
	}
	
	return resultado;
}

// nombre:		formatoXMLLlamadaRecursiva
// descripción:	procesa un atributo compuesto de un Objeto. Genera un "hijo/children" del XML final, usado en formatoXML
// estado:		Estable
// @param	objeto: "atributo compuesto"
// @param	tabulacion: string inicializado
// @return	string: la conversion del atributo
function formatoXMLLlamadaRecursiva(objeto,tabulacion){
	var resultado="";
	for (atributo in objeto){				
		if(typeof objeto[atributo] === "object"){			
			resultado+='\n\t'+tabulacion+'<'+atributo+' tipo="object">'+formatoXML(objeto[atributo],tabulacion+'\t')+'\n\t'+tabulacion+'</'+atributo+'>';
		}
		else{
			resultado+='\n\t'+tabulacion+'<'+atributo+' tipo="'+typeof objeto[atributo]+'">'+objeto[atributo]+'</'+atributo+'>'
		}
	}
	
	return resultado;
}


// TO-DO:	* Soporte para enviar Colleción de Objetos
//			* El root del XML deberia ser el tipo enviado: Divisa, Cotizacion, Cuenta...
//			* Solucuinar el problema del "atrib"
// nombre:		formatoXML
// descripción:	Otra funcion de conversion. 
// estado:		Borrador
// @param	objeto: dato a convertir
// @param	tabulacion: string para tabular el XML
// @return	string: la conversion del objeto a XML
function formatoXML(objeto,tabulacion){	
	resultado='<?xml version="1.0" encoding="UTF-8" ?>\n<respuesta>';

	for (atributo in objeto){	
		if(typeof objeto[atributo] === "object"){
			//pequeña "trampa"
			atrib=atributo;			
			resultado+='\n\t'+tabulacion+'<'+atributo+' tipo="object">'+formatoXMLLlamadaRecursiva(objeto[atributo],tabulacion+'\t')+'\n\t'+tabulacion+'</'+atrib+'>';
		}
		else{
			resultado+='\n\t'+tabulacion+'<'+atributo+' tipo="'+typeof objeto[atributo]+'">'+objeto[atributo]+'</'+atributo+'>'
		}
	}
	return resultado+'\n</respuesta>';
}

// TO-DO:	Soporte para enviar Colleción de Objetos
// nombre:		formatoDebug
// descripción:	Convierte al objeto en un "HTML amigable" para el usuario
// estado:		Estable
// @param		objeto: dato a procesar
// @return		retorna un simple HTML
function formatoDebug(objeto){
	var resultado='<html><head><meta charset="utf-8"></head><body>{<ul style="list-style-type:none;margin:0px;">';

	for (atributo in objeto){				
		if(typeof objeto[atributo] === "object"){			
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">(object)</span> ' +formatoDebug(objeto[atributo]);
		}
		else{
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">('+typeof objeto[atributo]+')</span> <tt>'+objeto[atributo]+'</tt></li>'
		}
	}
	return resultado+"</ul>}</body></html>";
}

// nombre:		formatoCSVLlamadaRecursiva
// descripción:	procesa un objeto que forma parte de un tributo de otro objeto. Se separo de formatoCSV para evitar condicionales de mas.
// estado:		Estable
// @param	objeto: objeto a procesar (atributo de otro)
// @param	padre: cadena inicializada con el nombre del campo
// @param	columnas: estructura inicializada donde se insertan los datos procesados
function formatoCSVLlamadaRecursiva(objeto,padre,columnas){
	padre+='.'
	
	for(atributo in objeto){
		if(typeof objeto[atributo] === "object"){
			formatoCSVLlamadaRecursiva(objeto[atributo],padre+atributo,columnas);
		}
		else{
			columnas.push({campo: padre+atributo, valor: objeto[atributo]});		
		}
	}
}

// TO-DO:	* Faltaría examinar el escape de las comillas dobles (o no)
//			* Soporte para enviar Colleción de Objetos
// nombre:		formatoCSV
// descripción:	Convierte un Objeto...
// estado:		Borrador
// @param	objeto: dato a convertir
// @param	padre: utilizado para procesar los "subatributos". Es usado para saber si es la 1ra llamada a la funcion (para devolver datos)
// @param	columnas: estructura (arreglo) auxiliar, para luego con
// @return	string: el objeto convertido
function formatoCSV(objeto,padre,columnas){
	//Inicializo la estructura (Arreglo)
	columnas=[]	
	
	for(atributo in objeto){
		if(typeof objeto[atributo] === "object"){
			formatoCSVLlamadaRecursiva(objeto[atributo],padre+atributo,columnas);
		}
		else{
			columnas.push({campo: padre+atributo, valor: objeto[atributo]});		
		}
	}	

	//Proceso la estructura
	campos="";
	valores="";
	for(i=0;i< columnas.length;i++){
		campos+='"'+columnas[i].campo+'",';
		//Si es una cadena la rodeo con comillas dobles
		if(typeof columnas[i].valor === 'string' || columnas[i].valor instanceof String ){
			valores+='"'+columnas[i].valor+'",';
		}
		else{
			valores+=columnas[i].valor+',';
		}
	}
	
	//Elimino la ultima coma
	campos=campos.replace(/,$/,'');
	valores=valores.replace(/,$/,'');

	return campos+'\n'+valores
}


// nombre:		selectorDeFormato
// @param res:	parametro para enviar la respuesta directa al usuario
// @param req: parametro para saber que formato se solicito (req.query.format)
// @param objeto: objeto que se desea enviar
function selectorDeFormato(req,res,objeto){
	if(req.query.formato){
		formato=formatosDeRespuesta[req.query.formato.toLowerCase()];
		if(formato){
			res.type(formato.tipoMIME)
			res.send(formato.funcion(objeto,''))
		}
		else{
			res.send('404', 'Error: el formato especificado no existe')
		}			
	}
	else{
		// Formato Default
		res.send(formatoJSON(objeto))
	}	
}


// nombre:		respuestaDinamica
// descripción:	Envia un Objeto segun el Header Acept del cliente. Usada para enviar las listas/colecciones de las "raices" de las APIs. Actualmente soporta HTML,TXT y JSON.
// estado:		Borrador
// @param	req:
// @param	res:
// @param	objeto:

exports.respuestaDinamica=function(req,res,objeto){
	res.format({
		'text/plain': function(){
			res.send(formatoTXT(respuesta,''));
		},
		
		'text/html': function(){
			res.send(formatoDebug(respuesta));
		},
		
		'application/json': function(){
			res.send(formatoJSON(respuesta));
		}
	});
}



// TO-DO:	Funciones relativas al envio de datos. Abstraccion de superagent para hacer POST/GET, etc...
//			asi se logra estandarizar el envio de "errores genericos" (internos, de conexion, de la fuente consultada)

// nombre:		peticionGET
// descripción:	realiza un simple GET a la url pasada por parametro. cuando la informacion este lista (sin errores) se llama al callback
// @param	res:
// @param	req:
// @param	url: URL a la cual se va a realizar el GET
// @param	callback: funcion que procesara la respuesta HTML
exports.peticionGET=function(req,res,url,callback){
superagent
	.get(url)
	.on('error', function(){
		// console.log('Se ha producido un Error interno al consultar')
		//~ res.send('500','Se ha producido un Error interno al consultar');
		enviarError(req,res,'Se ha producido un Error interno (500) al consultar',500);
		
	})
	.buffer()	//pequeña trampa para que bufferee la respuesta de datos y este disponible en respuesta.txt
	.end(function(respuesta){
		if(!respuesta.error){
			process.nextTick(function(){
				//Se envia el HTML obtenido
				callback(respuesta.text);
			});
		}
		else{
			// console.log('Se ha producido un error en el servicio consultado (404 o 500)');
			//~ res.send('Error: el servicio consultado ha informado un error');
			enviarError(req,res,'Error: el servicio consultado ha informado un error',200);
		}
	});	
}

// nombre:		enviarError
// descripción:	Envia un error al usuario usando la funcion de selector de formato
// estado:		Borraodr
// @param	req
// @param	res
// @param	mensaje: string conteniendo el mensaje del error
// @param	codigoHTTP: numero del codigo de status HTTP (404,200,500)
// @return	
function enviarError(req,res,mensaje,codigoHTTP){
	objeto={error: 'El servicio consultado ha informado sobre un error'}
	if(!codigoHTTP){
		codigoHTTP=200;
	}
	res=res.status(codigoHTTP)
	selectorDeFormato(req,res,objeto);
}


//	Funciones relativas a las conversiones...

exports.convertirEnFloat=function(objeto){
	return parseFloat(objeto.replace(',','.'));
}

//devuelve una instancia de String, agregando el escape a las comillas dobles y smples para JS
exports.convertirEnString=function(objeto){
	resultado=objeto.replace('"','\"');
	resultado=objeto.replace("'","\'");
	
	return new String(resultado);
}

exports.enviarError=enviarError;
exports.selectorDeFormato=selectorDeFormato;

exports.formatoJSON=formatoJSON;
exports.formatoDebug=formatoDebug;
exports.formatoTXT=formatoTXT;
exports.formatoCSV=formatoCSV;
