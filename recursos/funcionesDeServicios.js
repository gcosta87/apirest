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


// TO-DO:	Soporte para enviar Colleción de Objetos
// nombre:		formatoTXT
// descripcion:	Convierte un Objeto en formato TXT de Unix
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

// TO-DO:	Soporte para enviar Colleción de Objetos
function formatoDebug(objeto){
	var resultado="{<ul style='list-style-type:none;margin:0px;'>";

	for (atributo in objeto){				
		if(typeof objeto[atributo] === "object"){			
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">(object)</span> ' +formatoDebug(objeto[atributo]);
		}
		else{
			resultado+='<li><strong>'+atributo+'</strong> = <span style="color:#045FB4;">('+typeof objeto[atributo]+')</span> <tt>'+objeto[atributo]+'</tt></li>'
		}
	}
	return resultado+"</ul>}";
}

// nombre:		formatoCSVLlamadaRecursiva
// descripcion:	procesa un objeto que forma parte de un tributo de otro objeto. Se separo de formatoCSV para evitar condicionales de mas.
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
// descripcion:	Convierte un Objeto...
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
			res.send(formato(objeto,''))
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
