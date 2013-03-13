// personalArgentinaAPI.js
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
 * Módulo que representa/reune las funciones básicas para utilizar el sitio web de Personal Argentina
 */

cheerio=require('cheerio');

funcionesHTTP=require('./funcionesHTTP.js');
funcionesDeServicios=require('./funcionesDeServicios.js');


//	CONSTANTES
//

URL_DE_LOGIN	= "https://autogestion.personal.com.ar/individuos/";

//URL donde figura el Saldo del cliente
URL_DE_SALDO	= "https://autogestion.personal.com.ar/Individuos/inicio_tarjeta.aspx";

//Objeto para ser adjuntado en las respuestas al cliente
exports.fuente={nombre:'Autogestión de Personal Argentina', url:'http://autogestion.personal.com.ar/'}

//	FUNCIONES PRIVADAS
//


//	FUNCIONES PÚBLICAS
//

// TO-DO:	verificar que realmente se haya pasado el login segun respuesta en el HTML.

// @nombre:			iniciarSesion
// @descripción:	Emula iniciar la correspondiente sesión, en Autogestion de Personal, para el cliente indicado. No detecta si realmente fue superado el login, ya que la "respuesta" se encuentra en el HTML devuelto.
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	cuentaDeCliente: objeto, creado previamente usando la funcion crearCliente().
// @parámetro	callback(string html, array cookies):
function iniciarSesion(req,res,cuentaDeCliente,callback){
	funcionesHTTP.preLogin(req,res,URL_DE_LOGIN,function(formulario,cookies){
		$=cheerio.load(formulario);
		//Obtengo los inputs hidden
		inputsHidden=$('input[type=hidden]', '#aspnetForm')
		
		//Envio los campos en txt a la funcion xq en modo objeto no funcionan bien con superagent!
		camposTXT='__EVENTTARGET=ctl00%24BannerLogueo%24LogueoPropio%24BtnAceptar';
				
		for(i=0;i<inputsHidden.length;i++){
			//Este campo debe ser ignorado, porque se "carga" via JavaScript con un valor por defecto
			if(inputsHidden[i].attribs.name != '__EVENTTARGET'){
				camposTXT+='&'+encodeURIComponent(inputsHidden[i].attribs.name)+'='+encodeURIComponent(inputsHidden[i].attribs.value)
			}
		}
		
		//Campo hidden no dectectado por cheerio...
		eventValidation=$('input[name=__EVENTVALIDATION]')
		camposTXT+='&__EVENTVALIDATION='+encodeURIComponent(eventValidation[0].attribs.value);
		//Agrego los restantes campos
		camposTXT+='&ctl00%24BannerLogueo%24LogueoPropio%24TxtArea='+encodeURIComponent(cuentaDeCliente.codigoDeArea)+'&ctl00%24BannerLogueo%24LogueoPropio%24TxtLinea='+encodeURIComponent(cuentaDeCliente.celular)+'&ctl00%24BannerLogueo%24LogueoPropio%24TxtPin='+encodeURIComponent(cuentaDeCliente.password)+'&IDToken3='
		
		//Los datos se deben enviar de acuerdo al x-www-form-urlencoded...tanto el value como el key debe ser encodedados, pero no asi el & ni =, que los delimitan.
		funcionesHTTP.postLogin(req,res,URL_DE_LOGIN,camposTXT,cookies,function(html,cookies){
			//Le envio la respuesta
			callback(html,cookies);
		});
	});

}
exports.iniciarSesion=iniciarSesion;


// @nombre:			obtenerSaldo
// @descripción:	Logra obtener el Saldo para la cuenta del cliente indicado.
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	cuentaDeCliente: objeto, creado previamente usando la funcion crearCliente()
// @parámetro	callback(objeto cuentaDePersonal): retorna un objeto con los datos Saldo y fecha de vencimiento. Adicionalmente conteine la info del Cliente (codigoDeArea y celular)
exports.obtenerSaldo=function(req,res,cuentaDeCliente,callback){
	//Completo el login...
	iniciarSesion(req,res,cuentaDeCliente,function(html,cookies){
		//Tras completar el login
		//Realizo una peticion a la pagina que posee el saldo del cliente...
		funcionesHTTP.peticionGETconCookies(req,res,URL_DE_SALDO,cookies,function(respuesta){
			if(respuesta){
				//Objeto respuesta
				cuentaDePersonal={
					cliente:{
						codigoDeArea: cuentaDeCliente.codigoDeArea,
						celular: cuentaDeCliente.celular
					} 
				}
		
				$=cheerio.load(respuesta);
				
				cuentaDePersonal.saldo=funcionesDeServicios.convertirEnFloat($('#ctl00_ContenedorAutogestion_lblSaldo').text())
				cuentaDePersonal.fechaDeVencimiento=$('#ctl00_ContenedorAutogestion_lblVencimiento').text()
				
				//Si no obtengo el saldo reporto el error...
				if(cuentaDePersonal.saldo){
					
					process.nextTick(function(){
						//Envio la respuesta via callback...
						callback(cuentaDePersonal);
					});
				}
				else{
					funcionesDeServicios.enviarError(req,res,'No se ha podido obtener el saldo del cliente '+cuentaDeCliente.codigoDeArea+cuentaDeCliente.celular,500)
				}
			}
			else{
				funcionesDeServicios.enviarError(req,res,'No se ha podido procesar la solicitud del cliente '+cuentaDeCliente.codigoDeArea+cuentaDeCliente.celular,500)
			}
		});		
	});
}


// @nombre:			crearCliente
// @descripción:	Crea un objeto que representa la informacion basica de un cliente. Es utilizado para llamar a las otras funciones.
// @estado:			Estable
// @parámetro	codigoDeArea: numero
// @parámetro	celular: numero
// @parámetro	password: string
// @retorno	objeto: representando al Cliente de Personal.
exports.crearCliente=function(codigoDeArea,celular,password){
	cliente={}

	cliente.codigoDeArea=parseInt(codigoDeArea);
	cliente.celular=parseInt(celular);
	cliente.password=password;
	
	return cliente;
}
