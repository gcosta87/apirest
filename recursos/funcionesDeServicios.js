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
	'json':	formatoJSON,
	'debug':	formatoDebug,
	'txt':		formatoTXT,
	'csv':		formatoCSV,
	'default':	formatoJSON
}


//	Implementacion base de las funciones de formato
function formatoJSON(objeto){
	return JSON.stringify(objeto)
}

// Formato Unix. Se espera un Objeto simple (sin atributos compuestos)
// TO-DO:	Soporte para enviar Colleción de Objetos
function formatoTXT(objeto){
	var resultado="";

	for (atributo in objeto){
		resultado+=atributo+':'+objeto[atributo]+'\n'
	}
	return resultado;
}

// TO-DO:	Soporte para enviar Colleción de Objetos
function formatoDebug(objeto){
	var resultado="{<ul style='list-style-type:none;margin:0px;'>";

	for (atributo in objeto){		
		console.log(atributo+"="+typeof objeto[atributo]+" Obj:"+typeof objeto)
		if(typeof objeto[atributo] === "object"){
			console.log(atributo+" es un Obj @formatoDebug")
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">(object)</span> ' +formatoDebug(objeto[atributo]);
		}
		else{
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">('+typeof objeto[atributo]+')</span> <tt>'+objeto[atributo]+'</tt></li>'
		}
	}
	return resultado+"</ul>}";
}


// TO-DO:	* Faltaría examinar el escape de las comillas dobles (o no)
//			* Agregarle soporte para "campos compuestos"
//			* Soporte para enviar Colleción de Objetos

function formatoCSV(objeto){
	var cabecera="";
	var resultado="";

	for (atributo in objeto){
		cabecera+='"'+atributo+'",'
		if(typeof objeto[atributo] === 'string' || objeto[atributo] instanceof String){
			resultado+='"'+objeto[atributo]+'",'
		}
		else{
			resultado+=objeto[atributo]+','			
		}
	}
	
	//elimino la ultima coma...
	cabecera=cabecera.replace(/,$/,'');
	resultado=resultado.replace(/,$/,'');
	
	return cabecera+'\n'+resultado;
}

//	FUNCIONES PÚBLICAS
//

// name: selectorDeFormato
// @param res:	parametro para enviar la respuesta directa al usuario
// @param req: parametro para saber que formato se solicito (req.query.format)
// @param objeto: objeto que se desea enviar

exports.selectorDeFormato= function (req,res,objeto){
	if(req.query.formato){
		formato=formatosDeRespuesta[req.query.formato.toLowerCase()];
		if(formato){
			res.send(formato(objeto))
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


// TO-DO:	Funciones relativas al envio de datos. Abstraccion de superagent para hacer POST/GET, etc...
//			asi se logra estandarizar el envio de "errores genericos" (internos, de conexion, de la fuente consultada)

// name: peticionGET
// description: realiza un simple GET a la url pasada por parametro. cuando la informacion este lista (sin errores) se llama al callback
// @param	res:
// @param	req:
// @param	url: URL a la cual se va a realizar el GET
// @param	callback: funcion que procesara la respuesta HTML
exports.peticionGET=function(res,req,url,callback){
superagent
	.get(url)
	.on('error', function(){
		// console.log('Se ha producido un Error interno al consultar')
		res.send('500','Se ha producido un Error interno al consultar');
	})
	.end(function(respuesta){
		if(!respuesta.error){
			process.nextTick(function(){
				//Se envia el HTML obtenido
				callback(respuesta.text);
			});
		}
		else{
			// console.log('Se ha producido un error en el servicio consultado (404 o 500)');
			res.send('Error: el servicio consultado ha informado un error');
		}
	});	
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

exports.formatoJSON=formatoJSON;
exports.formatoDebug=formatoDebug;
exports.formatoTXT=formatoTXT;
exports.formatoCSV=formatoCSV;
