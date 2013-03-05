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

//	FUNCIONES PRIVADAS
//

// TO-DO:	Mejorar/Limpiar el Código
// @nombre:			formatoXMLLlamadaRecursiva
// @descripción:	procesa un atributo compuesto de un Objeto. Genera un "hijo/children" del XML final, usado en formatoXML
// @estado:			Estable
// @parámetro	objeto: "atributo compuesto"
// @parámetro	tabulacion: string inicializado
// @retorno	string: la conversion del atributo
function formatoXMLLlamadaRecursiva(objeto,tabulacion){
	var resultado="";
	
	//Desde esta funcion se los trata a los Arrays
	if(objeto instanceof Array){
		for (i=0; i<objeto.length;i++){
			resultado+='\n\t'+tabulacion+'<item tipo="object">'+formatoXMLLlamadaRecursiva(objeto[i],tabulacion+'\t')+'\n\t'+tabulacion+'</item>';
		}
	}
	else{
		for (atr in objeto){			
			if( objeto[atr] instanceof Array){			
				nombre=atr.toString();
				resultado+='\n\t'+tabulacion+'<'+atr+' tipo="array">'+formatoXMLLlamadaRecursiva(objeto[atr],tabulacion+'\t')+'\n\t'+tabulacion+'</'+nombre+'>';
			}
			else{
				if(objeto[atr] instanceof Object){
					atrib=atr
					resultado+='\n\t'+tabulacion+'<'+atr+' tipo="object">'+formatoXMLLlamadaRecursiva(objeto[atr],tabulacion+'\t')+'\n\t'+tabulacion+'</'+atrib+'>';
				}
				else{
					//Si hace falta le inserto el <![CDATA[]]>
					if(objeto[atr].toString().match(/[&|<|>]/ig)){
						resultado+='\n\t'+tabulacion+'<'+atr+' tipo="'+typeof objeto[atr]+'"><![CDATA['+objeto[atr]+']]></'+atr+'>'
					}
					else{
						resultado+='\n\t'+tabulacion+'<'+atr+' tipo="'+typeof objeto[atr]+'">'+objeto[atr]+'</'+atr+'>'
					}
				}
			}
		}
	}	
	return resultado;
}

// @nombre:			formatoCSVLlamadaRecursiva
// @descripción:	procesa un objeto que forma parte de un tributo de otro objeto. Se separo de formatoCSV para evitar condicionales de mas.
// @estado:			Estable
// @parámetro	objeto: objeto a procesar (atributo de otro)
// @parámetro	padre: cadena inicializada con el nombre del campo
// @parámetro	columnas: estructura inicializada donde se insertan los datos procesados
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


//	FUNCIONES PÚBLICAS DEL MÓDULO
//

//	Implementacion base de las funciones de formato
function formatoJSON(objeto){
	return JSON.stringify(objeto)
}


// TO-DO:	Soporte para enviar Colleción de Objetos
// @nombre:			formatoTXT
// @descripción:	Convierte un Objeto en formato TXT de Unix
// @estado:			Borrador
// @parámetro	objeto: el O que se va a procesar
// @parámetro	padre: string que se utiliza para el procesamiento de "subatrubutos" (p.e direccion.calle). Inicialemnte debe ser ''.
// @retorno	string: devuelve la conversion.
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



// TO-DO:	* Soporte para enviar Colleción de Objetos
//			* El root del XML deberia ser el tipo enviado: Divisa, Cotizacion, Cuenta...
//			* Solucuinar el problema del "atrib", y limpiar el código
// @nombre:			formatoXML
// @descripción:	Otra funcion de conversion. 
// @estado:			Borrador
// @parámetro	objeto: dato a convertir
// @parámetro	tabulacion: string para tabular el XML
// @retorno	string: la conversion del objeto a XML
function formatoXML(objeto,tabulacion){	
	resultado='<?xml version="1.0" encoding="UTF-8" ?>\n<respuesta>';

	resultado+=formatoXMLLlamadaRecursiva(objeto,'')

	return resultado+'\n</respuesta>';
}

// TO-DO:	Soporte para enviar Colleción de Objetos
// @nombre:			formatoDebug
// @descripción:	Convierte al objeto en un "HTML amigable" para el usuario
// @estado:			Estable
// @parámetro		objeto: dato a procesar
// @retorno		retorna un simple HTML
function formatoDebug(objeto){
	var resultado='<html><head><meta charset="utf-8"></head><body>{<ul style="list-style-type:none;margin:0px;">';

	for (atributo in objeto){				
		if(objeto[atributo] instanceof Array){	
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">(array)</span> ' +formatoDebug(objeto[atributo]);
		}
		else{
			if(typeof objeto[atributo] === "object"){			
				resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">(object)</span> ' +formatoDebug(objeto[atributo]);
			}
			else{
				resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">('+typeof objeto[atributo]+')</span> <tt>'+objeto[atributo]+'</tt></li>'
			}
		}
	}
	return resultado+"</ul>}</body></html>";
}


// TO-DO:	* Faltaría examinar el escape de las comillas dobles (o no)
//			* Soporte para enviar Colleción de Objetos
// @nombre:			formatoCSV
// @descripción:	Convierte un Objeto...
// @estado:			Borrador
// @parámetro	objeto: dato a convertir
// @parámetro	padre: utilizado para procesar los "subatributos". Es usado para saber si es la 1ra llamada a la funcion (para devolver datos)
// @parámetro	columnas: estructura (arreglo) auxiliar, para luego con
// @retorno	string: el objeto convertido
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


// @nombre:			selectorDeFormato
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


// @nombre:			respuestaDinamica
// @descripción:	Envia un Objeto segun el Header Acept del cliente. Usada para enviar las listas/colecciones de las "raices" de las APIs. Actualmente soporta HTML,TXT y JSON.
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	objeto:

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

// @nombre:			enviarError
// @descripción:	Envia un error al usuario usando la funcion de selector de formato
// @estado:			Borrador
// @parámetro	req
// @parámetro	res
// @parámetro	mensaje: string conteniendo el mensaje del error
// @parámetro	codigoHTTP: numero del codigo de status HTTP (404,200,500)
// @retorno	
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
