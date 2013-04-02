// gmailNoLeidos.js
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
 * Pequeño módulo que encapsula la API Gmail Inbox Feed. La cual permite chequear si una cuenta de gmail posee mails no leidos. 
 */

xml2js=require('xml2js')

//	CONSTANTES
//
//URL de consulta de la API.
URL_DE_API=""

exports.fuente={nombre:	'Gmail',	url: 'http://www.gmail.com/'}

//	FUNCIONES PRIVADAS
//

// @nombre:			validarUsuario
// @descripción:	chequea que el usuario no sea nulo.
// @estado:			Borrador
// @parámetro	usuario: string, nombre del usuario
// @retorno	boolean: true=OK, false= No valido.
function validarUsuario(usuario){
	//si no contiene @
	if(usuario.indexOf("@")==-1){
		//Letras, Numeros, Punto y Guiones
		re = /^[a-zA-Z0-9Ññ_.-]{5,}$/
	}
	else{
		//usuario@subsubdom.subdom.dom.(com|gov|gob|org).(ar...)?
		re = /^[a-zA-Z0-9Ññ_.-]*@([a-zA-Z0-9]+[.])+(com|gob|gov|org)([.][a-zA-Z]{2})?}$/
	}
	return re.test(usuario);
}

// @nombre:			validarPassword
// @descripción:	chequea que el password no sea nulo y tenga un length >= 8.
// @estado:			Borrador
// @parámetro	password: string, nombre del usuario
// @retorno	boolean: true=OK, false= No valido.
function validarPassword(password){
	return ((password) && (password.length >= 8))
}


// @nombre:			generarURLDeConsulta
// @descripción:	Genera la URL para realizar la consulta a la API
// @estado:			Estable
// @parámetro	cuenta: objeto, creada usando la funcion cuentaDeGmail()
// @retorno	string: representando la URL.
function generarURLDeConsulta(cuenta){
	return 'https://'+cuenta.usuario+':'+cuenta.password+'@mail.google.com/mail/feed/atom'
}

//	FUNCIONES PÚBLICAS
//

// @nombre:			cuentaDeGmail
// @descripción:	Crea un objeto simple que contiene los datos de la cuenta para luego realizar la consulta. Util para encapsular/validar datos del usuario. Lanza errores
// @estado:			Borrador
// @parámetro	usuario: string, nombre de la cuenta.
// @parámetro	password: string, la contraseña correspondiente a la cuenta.
// @retorno	objeto: la cuenta del usuario
exports.cuentaDeGmail=function(usuario,password){
	if(!validarUsuario(usuario)){
		throw "Usuario no válido"
	}
		
	if(!validarPassword(password)){
		throw "Contraseña no válido"
	}
		
	objeto={}
	objeto.usuario=usuario;
	objeto.password=password;
	
	//Retorna el mail presentable
	objeto.mail=function(){
		return (this.usuario.indexOf("@")==-1)?this.usuario+'@gmail.com':this.usuario
	}
	
	return objeto;
}

// @nombre:			obtenerMailsNoLeidos
// @descripción:	devuelve en el callback la informacion de los mails no leidos
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res
// @parámetro	cuenta: objeto construido usando cuentaDeGmail()
// @parámetro	callback(objeto mails): retorna un objeto con una coleccion de mails no leidos. Puede estar vacia en caso de no poseer mails no leidos.
exports.obtenerMailsNoLeidos=function(req,res,cuenta,callback){

	funcionesHTTP.peticionGET(req,res,generarURLDeConsulta(cuenta),function(respuesta){

		xml2js.parseString(respuesta,function(err,resultado){
			cuentaGmail={
				usuario:	cuenta.mail(),
				cantidad:	parseInt(resultado.feed.fullcount[0])
			}

			if(cuentaGmail.cantidad > 0){
				//proceso los mails
				cuentaGmail.mails=[];
				
				mailsNoLeidos=resultado.feed.entry;
				for (i=0;i< mailsNoLeidos.length;i++){
					fecha=new Date(mailsNoLeidos[i].issued[0]);
					
					mail={}
					
					
					mail.asunto=mailsNoLeidos[i].title[0];
					mail.resumen=mailsNoLeidos[i].summary[0];
					
					mail.fecha={}
					mail.fecha.dia=fecha.getDate()+'/'+fecha.getMonth()+'/'+fecha.getFullYear();
					mail.fecha.hora=fecha.getHours()+':'+fecha.getMinutes();	//Hora Argentina (Server)
					
					mail.autor={}
					mail.autor.nombre=mailsNoLeidos[i].author[0].name[0];
					mail.autor.mail=mailsNoLeidos[i].author[0].email[0];
					
					mail.link=mailsNoLeidos[i].link[0].$.href;
					
					cuentaGmail.mails.push(mail);
				}
			}				
			
			process.nextTick(function(){
				callback(cuentaGmail);
			});
		});

	});
}
