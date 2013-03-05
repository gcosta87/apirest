// funcionesHTTP.js
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


// Modulo con funciones relativas a peticiones HTTP: GET/Post, manejar Cookies...

superagent=require('superagent');
funcionesDeServicios=require('./funcionesDeServicios.js')

//	FUNCIONES PRIVADAS
//

// @nombre:			httpGET
// @descripción:	inicializa a superagent para realizar un GET. Esta funcion permite centralizar/compartir la configuracion del SuperAgent
// @estado:			Borrador
// @parámetro	req
// @parámetro	res
// @parámetro	url: string
// @retorno	superagent: inicializado
function httpGET(req,res,url){
	return superagent
				.get(url)
				.set('User-Agent','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:19.0) Gecko/20100101 Firefox/19.0')
				.on('error', function(){
					funcionesDeServicios.enviarError(req,res,'Se ha producido un Error interno (500) al consultar',500);
				})
				.buffer();	//pequeña trampa para que bufferee la respuesta de datos y este disponible en respuesta.txt
}

// @nombre:			httpPOST
// @descripción:	inicializa a SuperAgent para realizar un POST x-www-form-urlencoded. Esta funcion permite centralizar/compartir la configuracion del SuperAgent
// @estado:			Borrador
// @parámetro	req
// @parámetro	res
// @parámetro	url: string
// @parámetro	datos: string (u objeto), para enviar
// @retorno	superagent: inicializado
function httpPOST(req,res,url,datos){
	return superagent
				.post(url)
				.type('form')
				.on('error', function(){
					funcionesDeServicios.enviarError(req,res,'Se ha producido un Error interno (500) al consultar',500);
				})
				.buffer()	//pequeña trampa para que bufferee la respuesta de datos y este disponible en respuesta.txt
				.set('User-Agent','Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:19.0) Gecko/20100101 Firefox/19.0')
				.send(datos);
}


//	FUNCIONES PÚBLICAS
//

// @nombre:			extraerCookiesDeRespuesta
// @descripción:	Extrae las Cookies presentes en una respuesta (de superagent) y las almacena en un Arreglo. Elimina "path" de cada una.
// @estado:			Estable
// @parámetro	respuesta: Objeto response (de superagent), donde se encuentran las cookies a "setear" en el cliente
// @parámetro	cookies: "diccionario", donde se insertan las cookies
function extraerCookiesDeRespuesta(respuesta,cookies){
	cookiesRecibidas=respuesta.header['set-cookie'];
	
	for(i=0;i<cookiesRecibidas.length;i++){
		//me quedo con la cookie sin el "path". Ejemplo: ASPNetSession=XXXXXXXX
		cookie= cookiesRecibidas[i].split(';')[0];
		cookies[cookie.split('=')[0]]=cookie.split('=')[1]
	}				
}


// @nombre:			cookiesATexto
// @descripción:	convierte el diccionario (key-value) al string correspondiente para enviar
// @estado:			Estable
// @parámetro	cookies: "diccionario", que posee las cookies
// @retorno	string: la representacion de las mismas
function cookiesATexto(cookies){
	resultado='';
	
	for(nombre in cookies){
		resultado+=nombre+'='+cookies[nombre]+'; ';
	}
	//Elimino la ultima ;
	resultado=resultado.replace(/; $/,'');
	
	return resultado;
}



// @nombre:			peticionGET
// @descripción:	realiza un simple GET a la url pasada por parametro. cuando la informacion este lista (sin errores) se llama al callback
// @estado:			Estable
// @parámetro	res:
// @parámetro	req:
// @parámetro	url: URL a la cual se va a realizar el GET
// @parámetro	callback(string HTML): funcion que procesara la respuesta HTML
exports.peticionGET=function(req,res,url,callback){
	httpGET(req,res,url)
		.end(function(respuesta){
			if(!respuesta.error){
				process.nextTick(function(){
					//Se envia el HTML obtenido
					callback(respuesta.text);
				});
			}
			else{
				funcionesDeServicios.enviarError(req,res,'Error: el servicio consultado ha informado un error',200);
			}
		});	
}

// @nombre:			peticionGETconCookies
// @descripción:	realiza un simple GET a la url pasada por parametro. cuando la informacion este lista (sin errores) se llama al callback
// @estado:			Estable
// @parámetro	res:
// @parámetro	req:
// @parámetro	url: URL a la cual se va a realizar el GET
// @parámetro	cookies: "diccionario", que conteine las cookies a enviar
// @parámetro	callback(string HTML): funcion que procesara la respuesta HTML
exports.peticionGETconCookies=function(req,res,url,cookies,callback){
	httpGET(req,res,url)
		.set('Cookie',cookiesATexto(cookies))
		.end(function(respuesta){
			if(!respuesta.error){
				//actualizo las cookies
				extraerCookiesDeRespuesta(respuesta,cookies)
				process.nextTick(function(){
					//Se envia el HTML obtenido
					callback(respuesta.text,cookies);
				});
			}
			else{
				funcionesDeServicios.enviarError(req,res,'Error: el servicio consultado ha informado un error',200);
			}
		});	
}

// @nombre:			peticionPOST
// @descripción:	realiza un simple POST a la url pasada por parametro. cuando la informacion esté lista (sin errores) se llama al callback
// @estado:			Borrador
// @parámetro	res:
// @parámetro	req:
// @parámetro	url: URL a la cual se va a realizar el GET
// @parámetro	dato: objeto con los datos que se requieren enviar
// @parámetro	callback(string HTML): funcion que procesara la respuesta
exports.peticionPOST=function(req,res,url,datos,callback){
	httpPOST(req,res,url,datos)
		.end(function(respuesta){
			if(!respuesta.error){
				process.nextTick(function(){
					//Se envia el HTML obtenido
					callback(respuesta.text);
				});
			}
			else{
				funcionesDeServicios.enviarError(req,res,'Error: el servicio consultado ha informado un error',200);
			}
		});	
}


// @nombre:			preLogin
// @descripción:	Funcion que facilita la tarea de simular un login
// @estado:			Inestable
// @parámetro	req: necesario para enviar datos al Usr en caso de error
// @parámetro	res: necesario para enviar datos al Usr en caso de error
// @parámetro	url: url para conectarse via Get
// @parámetro	callback(string HTMLForm, array cookies): Util para procesar y obterner los Hiddens, etc.. Se facilitan las cookies (sesion)
exports.preLogin=function(req,res,url,callback){
	httpGET(req,res,url)
		.end(function(respuesta){
			if(!respuesta.error){
				//Obtengo las cookies
				cookies={}
				extraerCookiesDeRespuesta(respuesta,cookies);

				//envio todo...					
				process.nextTick(function(){		
					callback(respuesta.text,cookies);
				});
			}
			else{
				funcionesDeServicios.enviarError(req,res,'Error: el servicio consultado ha informado un error',200);
			}
		});	
}

// @nombre:			postLogin
// @descripción:	Funcion que facilita la tarea de simular un login. Incluye soporte de Cookies
// @estado:			Inestable
// @parámetro	req: necesario para enviar datos al Usr en caso de error
// @parámetro	res: necesario para enviar datos al Usr en caso de error
// @parámetro	url: url para hacer enviar los datos via POST
// @parámetro	datos: objeto con los datos a enviar
// @parámetro	cookies: arreglo con las cookies necesarias
// @parámetro	callback(string HTML,array cookies)
exports.postLogin=function(req,res,url,datos,cookies,callback){
	httpPOST(req,res,url,datos)
		.set('Cookie',cookiesATexto(cookies))
		.redirects(0)
		.end(function(respuesta){
			if(!respuesta.error){
				//Actualizo las Cookies...
				extraerCookiesDeRespuesta(respuesta,cookies)
				
				process.nextTick(function(){
					//Se envia el HTML obtenido junto con las cookies actualizadas
					callback(respuesta.text,cookies);
				});
			}
			else{
				funcionesDeServicios.enviarError(req,res,'Error: el servicio consultado ha informado un error al realizar un Login',200);
			}
		});	
}


exports.extraerCookiesDeRespuesta=extraerCookiesDeRespuesta;
exports.cookiesATexto=cookiesATexto;

