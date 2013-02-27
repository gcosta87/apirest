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

//	Implementacion base de las funciones de formato
exports.formatoJSON=function (objeto){
	return JSON.stringify(objeto)
}

// Formato Unix. Se espera un Objeto simple (sin atributos compuestos)
exports.formatoTXT=function (objeto){
	var resultado="";

	for (atributo in objeto){
		resultado+=atributo+':'+objeto[atributo]+'\n'
	}
	return resultado;
}

// 
// name: desconocido
// @param
// @return

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
exports.formatoDebug=formatoDebug;

// TO-DO: faltaría examinar el escape de las comillas dobles (o no)
exports.formatoCSV=function (objeto){
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


// TO-DO: función "switch" que invoque a la función correspondiente según el parámetro de formato de resp. Default=JSON

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
