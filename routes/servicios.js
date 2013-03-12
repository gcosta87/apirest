// servicios.js
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

cheerio=require('cheerio')
xml2js=require('xml2js')
util=require('util');


funcionesDeServicios=require('../recursos/funcionesDeServicios.js')
funcionesHTTP=require('../recursos/funcionesHTTP.js')

yahooFinanzas=require('../recursos/yahooFinanzasAPI.js')
futbolParaTodos=require('../recursos/futbolParaTodosAPI.js')

//	CONSTANTES
//
tipoDeDivisas={
	dolar:  			{elementoHTML:'.columna1',nombre:'Dolar Oficial'},
	dolarBlue:  		{elementoHTML:'.columna2',nombre:'Dolar Blue (Informal)'},
	dolarMayorista:	{elementoHTML:'.columna3',nombre:'Dolar Mayorista (Bancos)'}
}

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


//	FUNCIONES PRIVADAS
//


//	FUNCIONES PUBLICAS
//

// @nombre:			divisas
// @descripción:	Devuelve el valor de los diversas divisas: Dolar Ofical,Dolar Blue/Informal, Dolar Mayorista, Euro, Real,etc.... Fuente Ambito Financiero. Falta
// @estado:			Borrador: Solo soporta los distintos Dolares, faltan las restantes divisas.
exports.divisas=function(req,res){
	divisa=tipoDeDivisas[req.params.divisa];
	
	if(divisa){
		funcionesHTTP.peticionGET(req,res,'http://ambito.com/economia/mercados/monedas/dolar/',function(respuesta){			
			$=cheerio.load(respuesta)
			
			//Obtengo los valores
			// TO-DO:	Optimizar las consultas. Averguar de setar "root"
			dolarVariacion=$('.variacion',divisa.elementoHTML).text()
			dolarCompra=$('.ultimo big',divisa.elementoHTML).text()
			dolarVenta=$('.cierreAnterior big',divisa.elementoHTML).text()
			ultimaActualizacion=$('.dolarFecha big',divisa.elementoHTML).text()
		
			camposUltimaActualizacion=ultimaActualizacion.split('-');
			dia=camposUltimaActualizacion[0].trim();
			hora=camposUltimaActualizacion[1].trim();
			
		
			// Construyo el objeto de respuesta
			objetoDivisa={
				nombre:			divisa.nombre,
				venta:			funcionesDeServicios.convertirEnFloat(dolarVenta),
				compra:			funcionesDeServicios.convertirEnFloat(dolarCompra),
				variacion:		funcionesDeServicios.convertirEnFloat(dolarVariacion),
				ultimaActualizacion:	{dia: dia,hora: hora},						
				fuente:{
						nombre:		'Ambito.com',
						url:		'http://www.ambito.com'								
					}
			};
			
			// Envio la respuesta al usuario segun el formato que el haya elegido		
			funcionesDeServicios.selectorDeFormato(req,res,objetoDivisa)
		});
		
	}
	else{
		funcionesDeServicios.enviarError(req,res,'No existe la divisa solicitada: '+req.params.divisa,404)
	}
}

// @nombre:			divisasRaiz
// @descripción:	Retorna la coleccion de divisas (actualmente) disponibles para consultar
// @estado:			Borrador
exports.divisasRaiz=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion: "Consulte las principales divisas",
		documentacion: "/api/divisas/",
		divisas:{
			dolar:			{nombre:tipoDeDivisas.dolar.nombre, url:'/api/divisas/dolar'},
			dolarBlue:		{nombre:tipoDeDivisas.dolarBlue.nombre, url:'/api/divisas/dolarBlue'},
			dolarMayorista:	{nombre:tipoDeDivisas.dolarMayorista.nombre, url:'/api/divisas/dolarMayorista'}
		}
	}

	//Genero la respuesta segun la cabercera HTTP Acept del cliente: Texto plano, HTML...
	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
}


// @nombre:			acciones
// @descripción:	Devuelve la cotización de las acciones de la empresa solicitada. Fuente Yahoo Finanzas.
// @estado:			Borrador
exports.acciones=function(req,res){
	accion=tipoDeAcciones[req.params.simbolo];
	if(accion){
		
		//Genero la consulta a la API de Yahoo!
		formato=[];
	
		//por defecto			
		formato.push(yahooFinanzas.formato.simbolo)
		formato.push(yahooFinanzas.formato.nombre)
		formato.push(yahooFinanzas.formato.ultimaCotizacion)
		formato.push(yahooFinanzas.formato.variacion)
		formato.push(yahooFinanzas.formato.variacionEnPorcentaje)
		formato.push(yahooFinanzas.formato.valorDeApertura)
		formato.push(yahooFinanzas.formato.valorCierreAnterior)
		formato.push(yahooFinanzas.formato.fecha)
		formato.push(yahooFinanzas.formato.hora)
		
		funcionesHTTP.peticionGET(req,res,yahooFinanzas.generarURL(accion.simbolo,formato),function(respuesta){
			//Genero la respuesta
			respuesta=respuesta.replace(/["%]/g,'')
			campos=respuesta.split(',');
			
			//cambio el formato de la fecha: mm/dd/aaaa -> dd/mm/aaaa
			regexFecha=/([0-9]{1,2})[/]([0-9]{1,2})[/]([0-9]{2,4})/
			camposFecha= regexFecha.exec(campos[7]);

			accion={
				simbolo:				campos[0].replace('.BA',''),
				nombre:					campos[1],
				descripcion:			accion.nombre,
				ultimaCotizacion:		funcionesDeServicios.convertirEnFloat(campos[2]),
				variacion:				funcionesDeServicios.convertirEnFloat(campos[3]),
				variacionEnPorcentaje:	funcionesDeServicios.convertirEnFloat(campos[4]),
				valorDeApertura:		funcionesDeServicios.convertirEnFloat(campos[5]),
				valorCierreAnterior:	funcionesDeServicios.convertirEnFloat(campos[6]),
				fecha:					camposFecha[2]+'/'+camposFecha[1]+'/'+camposFecha[3],	//Original: campos[5],
				hora:					campos[8].trim(),
				fuente:{
					nombre:		'Yahoo! Finanzas Argentina',
					url:		'http://ar.finanzas.yahoo.com/'
				}
			}
			
			//Envio la respuesta al usr
			funcionesDeServicios.selectorDeFormato(req,res,accion);
		});		
	}
	else{
		funcionesDeServicios.enviarError(req,res,'No existe la Acción solicitada: '+req.params.simbolo,404)
	}
}

// @nombre:			accionesRaiz
// @descripción:	Retorna la coleccion de acciones del merval que (actualmente) están disponibles.
// @estado:			Borrador
exports.accionesRaiz=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion: "Consulte las acciones del Merval",
		documentacion: "/api/acciones/",
		acciones:{
			'alua.ba':	{simbolo: 'ALUA', nombre: 'Aluar Aluminio Argentino S.A.I.C', url: '/api/acciones/alua.ba'},
			'apbr.ba':	{simbolo: 'APBR', nombre: 'Petroleo Brasileiro SA Petrobras', url: '/api/acciones/apbr.ba'},
			'bma.ba':	{simbolo: 'BMA', nombre: 'Macro Bank, Inc.', url: '/api/acciones/bma.ba'},
			'come.ba':	{simbolo: 'COME', nombre: 'Sociedad Comercial del Plata SA', url: '/api/acciones/come.ba'},
			'edn.ba':	{simbolo: 'EDN', nombre: 'EMP.DIST.Y COM.NORTE', url: '/api/acciones/edn.ba'},
			'erar.ba':	{simbolo: 'ERAR', nombre: 'Siderar S.A.I.C.', url: '/api/acciones/erar.ba'},
			'fran.ba':	{simbolo: 'FRAN', nombre: 'Bbva Banco Frances,S.A.', url: '/api/acciones/fran.ba'},
			'ggal.ba':	{simbolo: 'GGAL', nombre: 'Grupo Financiero Galicia SA', url: '/api/acciones/ggal.ba'},
			'pamp.ba':	{simbolo: 'PAMP', nombre: 'Pampa Energia SA', url: '/api/acciones/pamp.ba'},
			'pesa.ba':	{simbolo: 'PESA', nombre: 'Petrobras Argentina SA', url: '/api/acciones/pesa.ba'},
			'teco2.ba':{simbolo: 'TECO2', nombre: 'Telecom Argentina SA', url: '/api/acciones/teco2.ba'},
			'ts.ba':	{simbolo: 'TS', nombre: 'Tenaris SA', url: '/api/acciones/ts.ba'},
			'ypfd.ba':	{simbolo: 'YPFD', nombre: 'YPF Sociedad Anonima', url: '/api/acciones/ypfd.ba'}
		}
	}


	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
}

// @nombre:			gmail
// @descripción:	Informa para una cuenta determinada si posee mails sin leer. Asu vez presenta una previsualizacion de cada uno.
// @estado:			Borrador
exports.gmail=function(req,res){
	if(req.params.usuarioPassword){
		usuario=req.params.usuarioPassword.split(':')[0];
		password=req.params.usuarioPassword.split(':')[1];
		
		funcionesHTTP.peticionGET(req,res,'https://'+req.params.usuarioPassword+'@mail.google.com/mail/feed/atom',function(respuesta){

			xml2js.parseString(respuesta,function(err,resultado){
				cuentaGmail={
					usuario:	(usuario.indexOf("@")==-1)?usuario+'@gmail.com':usuario,
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
				cuentaGmail.fuente={nombre:	'Gmail',	url: 'http://www.gmail.com/'}

				funcionesDeServicios.selectorDeFormato(req,res,cuentaGmail);
			});

		});
	}
	else{
		funcionesDeServicios.enviarError(req,res,'Error al enviar la cuenta '+req.params.usuarioPassword,404)
	}
}


// @nombre:			gmailRaiz
// @descripción:	Indica como usar la API
// @estado:			Borrador
exports.gmailRaiz=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion:	'Informa para una cuenta de Gmail determinada si posee mails no leidos. Se informa la cantidad y un breve resumen de los mismos.',
		documentacion:	'/api/gmail/',
		uso:{
				modoDeUso:	'/api/gmail/nombre_de_usuario:contraseña/',
				ejemplo:	'/api/gmail/juanperez:123456789/'
		}
	}
	
	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
}


// TO-DO:	* Mejorar/Limpiar el código
//			* Crear la API Personal, para abstraer al controlador
// @nombre:			personal
// @descripción:	representa el saldo y fecha de vencimiento de un Cliente. Proximamente soportará
// @estado:			Inestable
exports.personal=function(req,res){
	if(req.params.usuarioPassword){
		parametros=req.params.usuarioPassword.split(':');
		codigoDeArea=parametros[0];
		celular=parametros[1];
		password=parametros[2];

		urlDeLogin="https://autogestion.personal.com.ar/individuos/"
		
		funcionesHTTP.preLogin(req,res,urlDeLogin,function(formulario,cookies){
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
			camposTXT+='&ctl00%24BannerLogueo%24LogueoPropio%24TxtArea='+encodeURIComponent(codigoDeArea)+'&ctl00%24BannerLogueo%24LogueoPropio%24TxtLinea='+encodeURIComponent(celular)+'&ctl00%24BannerLogueo%24LogueoPropio%24TxtPin='+encodeURIComponent(password)+'&IDToken3='
			
			//Los datos se deben enviar de acuerdo al x-www-form-urlencoded...tanto el value como el key debe ser encodedados, pero no asi el & ni =, que los delimitan.
			funcionesHTTP.postLogin(req,res,urlDeLogin,camposTXT,cookies,function(html,cookies){
				
				funcionesHTTP.peticionGETconCookies(req,res,'https://autogestion.personal.com.ar/Individuos/inicio_tarjeta.aspx',cookies,function(respuesta){
					if(respuesta){
						//Objeto respuesta
						cuentaDePersonal={
							cliente:{
								codigoDeArea: parseInt(codigoDeArea),
								celular: parseInt(celular)
							} 
						}
				
						$=cheerio.load(respuesta);
						
						cuentaDePersonal.saldo=funcionesDeServicios.convertirEnFloat($('#ctl00_ContenedorAutogestion_lblSaldo').text())
						cuentaDePersonal.fechaDeVencimiento=$('#ctl00_ContenedorAutogestion_lblVencimiento').text()
						cuentaDePersonal.fuente={nombre:'Autogestión de Personal Argentina', url:'http://autogestion.personal.com.ar/'}
						
						
						funcionesDeServicios.selectorDeFormato(req,res,cuentaDePersonal);
					}
					else{
						funcionesDeServicios.enviarError(req,res,'No se ha podido procesar la solicitud del cliente '+codigoDeArea+celular,500)
					}
				});
				
			});
		});
	}
	else{
		funcionesDeServicios.enviarError(req,res,'Error al enviar la cuenta '+req.params.usuarioPassword,404)
	}
}

// @nombre:			personalRaiz
// @descripción:	Muestra como usar la API
// @estado:			Borrador
exports.personalRaiz=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion:	'Informa para una cuenta de Autogestión de Personal Argentina, el saldo y fecha de vencimiento. Proximamente se publicará las últimas recargas hechas.',
		documentacion:	'/api/personal/',
		uso:{
				modoDeUso:	'/api/personal/Codigo_De_Area:Celular:Contraseña/',
				ejemplo:	'/api/personal/221:0123456:123abc/'
		}
	}
	
	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
}


// @nombre:			futbolPrimeraDivision
// @descripción:	lista la tabla de posiciones de la primera division para el torneo actual
// @estado:			Borrador
exports.futbolPrimeraDivision=function(req,res){
	futbolParaTodos.obtenerPosicionesDePrimeraDivision(req,res,function(tablaDePosiciones){
		if(tablaDePosiciones){
			respuesta={}
			
			respuesta.nombre='Primera División'
			respuesta.tablaDePosiciones=tablaDePosiciones;
			respuesta.fuente=futbolParaTodos.fuente;			
			
			funcionesDeServicios.selectorDeFormato(req,res,respuesta)
		}
		else{
			funcionesDeServicios.enviarError(req,res, 'No se ha podido obtener la tabla de posiciones.','500')
		}
	});
}

// @nombre:			futbolPrimeraBNacional
// @descripción:	lista la tabla de posiciones de el Nacional B para el torneo actual
// @estado:			Borrador
exports.futbolPrimeraBNacional=function(req,res){
	futbolParaTodos.obtenerPosicionesDePrimeraBNacional(req,res,function(tablaDePosiciones){
		if(tablaDePosiciones){
			respuesta={}

			respuesta.nombre='Primera B Nacional'
			respuesta.tablaDePosiciones=tablaDePosiciones;
			respuesta.fuente=futbolParaTodos.fuente;			
			
			funcionesDeServicios.selectorDeFormato(req,res,respuesta)
		}
		else{
			funcionesDeServicios.enviarError(req,res, 'No se ha podido obtener la tabla de posiciones.','500')
		}
	});
}

// @nombre:			futbolSeleccion
// @descripción:	lista la tabla de posiciones donde figura la Seleccion Nacional para la Copa/Torneo actual
// @estado:			Borrador
exports.futbolSeleccionNacional=function(req,res){
	futbolParaTodos.obtenerPosicionesDeLaSeleccion(req,res,function(tablaDePosiciones){
		if(tablaDePosiciones){
			respuesta={}
			respuesta.nombre='Selección Nacional'
			respuesta.tablaDePosiciones=tablaDePosiciones;
			respuesta.fuente=futbolParaTodos.fuente;			
			
			funcionesDeServicios.selectorDeFormato(req,res,respuesta)
		}
		else{
			funcionesDeServicios.enviarError(req,res, 'No se ha podido obtener la tabla de posiciones.','500')
		}
	});	
}

// @nombre:			futbolRaiz
// @descripción:	Muestra como usar la API
// @estado:			Borrador
exports.futbolRaiz=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion:	'API que contiene información relativa al futbol argentino: Primera Division, Nacional B y la Seccion',
		documentacion:	'/api/futbol/',
		uso:{
				primeraDivision: {
						descripcion: 	'Consulte la tabla de posiciones de la Primera Division',
						url:			'/api/futbol/primeraDivision'
				},
				primeraBNacional: {
						descripcion: 	'Consulte la tabla de posiciones de la Primera B Nacional',
						url:			'/api/futbol/primeraBNacional'
				},
				seleccionArgentina: {
						descripcion: 	'Consulte la tabla de posiciones del torneo/copa donde participa la Seleccion Argentina',
						url:			'/api/futbol/seleccionNacional'
				}
		}
	}
	
	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
}
