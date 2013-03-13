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
personalArgentina=require('../recursos/personalArgentinaAPI.js')

//	CONSTANTES
//
tipoDeDivisas={
	dolar:  			{elementoHTML:'.columna1',nombre:'Dolar Oficial'},
	dolarBlue:  		{elementoHTML:'.columna2',nombre:'Dolar Blue (Informal)'},
	dolarMayorista:	{elementoHTML:'.columna3',nombre:'Dolar Mayorista (Bancos)'}
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
	//Busco la accion solicitada
	accion=yahooFinanzas.tipoDeAcciones[req.params.simbolo];
	
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
				fuente:					yahooFinanzas.fuente
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
		
		cliente=personalArgentina.crearCliente(parametros[0],parametros[1],parametros[2])
		
		personalArgentina.obtenerSaldo(req,res,cliente,function(cuentaDePersonal){
			//adjunto la fuente
			cuentaDePersonal.fuente=personalArgentina.fuente;
			
			funcionesDeServicios.selectorDeFormato(req,res,cuentaDePersonal);
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
			funcionesDeServicios.enviarError(req,res, 'No se ha podido obtener la tabla de posiciones.',500)
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
			funcionesDeServicios.enviarError(req,res, 'No se ha podido obtener la tabla de posiciones.',500)
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
			funcionesDeServicios.enviarError(req,res, 'No se ha podido obtener la tabla de posiciones.',500)
		}
	});	
}


// @nombre:			futbolEquipo
// @descripción:	Muestra los datos del equipo solicitado
// @estado:			Borrador
exports.futbolEquipo=function(req,res){
	//busco al equipo solicitado en la estructura
	equipo=futbolParaTodos.equipos[req.params.equipo];
	
	if(equipo){
		futbolParaTodos.obtenerDatosDeEquipo(req,res,equipo,function(equipo){
			respuesta.fuente=futbolParaTodos.fuente;
			
			funcionesDeServicios.selectorDeFormato(req,res,respuesta);
		});
	}
	else{
		funcionesDeServicios.enviarError(req,res,'El equipo solicitado no existe: '+req.params.equipo,404)
	}
}



// @nombre:			futbolEquipoRaiz
// @descripción:	Muestra como obtener detalles de un Equipo/Club
// @estado:			Borrador
exports.futbolEquipoRaiz=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion:	'Se muestra infomación relativa al Club consultado.',
		documentacion:	'/api/futbol/equipo/',
		uso:{
			'lanus': {url: '/api/futbol/equipo/lanus', nombre: 'Club Atlético Lanús'}, 
			'river': {url: '/api/futbol/equipo/river', nombre: 'Club Atlético River Plate'}, 
			'godoy-cruz': {url: '/api/futbol/equipo/godoy-cruz', nombre: 'Club Deportivo Godoy Cruz Antonio Tomba'}, 
			'quilmes': {url: '/api/futbol/equipo/quilmes', nombre: 'Quilmes Atlético Club'}, 
			'tigre': {url: '/api/futbol/equipo/tigre', nombre: 'Club Atlético Tigre'}, 
			'newells-old-boys': {url: '/api/futbol/equipo/newells-old-boys', nombre: 'Newell´s Old Boys'}, 
			'arsenal': {url: '/api/futbol/equipo/arsenal', nombre: 'Arsenal Fútbol Club'}, 
			'racing': {url: '/api/futbol/equipo/racing', nombre: 'Racing Club'}, 
			'belgrano': {url: '/api/futbol/equipo/belgrano', nombre: 'Club Atlético Belgrano de Cordoba'}, 
			'rafaela': {url: '/api/futbol/equipo/rafaela', nombre: 'Atlético de Rafaela'}, 
			'velez': {url: '/api/futbol/equipo/velez', nombre: 'Club Atlético Vélez Sársfield'}, 
			'san-lorenzo': {url: '/api/futbol/equipo/san-lorenzo', nombre: 'Club Atlético San Lorenzo de Almagro'}, 
			'independiente': {url: '/api/futbol/equipo/independiente', nombre: 'Club Atlético Independiente'}, 
			'all-boys': {url: '/api/futbol/equipo/all-boys', nombre: 'Club Atlético All Boys'}, 
			'union': {url: '/api/futbol/equipo/union', nombre: 'Club Atlético Unión de Santa Fe'}, 
			'boca': {url: '/api/futbol/equipo/boca', nombre: 'Club Atlético Boca Juniors'}, 
			'san-martin-sj': {url: '/api/futbol/equipo/san-martin-sj', nombre: 'Club Atlético San Martín de San Juan'}, 
			'estudiantes-lp': {url: '/api/futbol/equipo/estudiantes-lp', nombre: 'Club Estudiantes de La Plata'}, 
			'colon': {url: '/api/futbol/equipo/colon', nombre: 'Club Atlético Colón'}, 
			'argentinos': {url: '/api/futbol/equipo/argentinos', nombre: 'Asociación Atlética Argentinos Juniors'}
		}
	}
	
	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
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
