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

superagent=require('superagent')
cheerio=require('cheerio')
funcionesDeServicios=require('../recursos/funcionesDeServicios.js')
util=require('util');

//	CONSTANTES
//
tipoDeDivisas={
	'dolar':  			{elementoHTML:'.columna1',nombre:'Dolar Oficial'},
	'dolarBlue':  		{elementoHTML:'.columna2',nombre:'Dolar Blue (Informal)'},
	'dolarMayorista':	{elementoHTML:'.columna3',nombre:'Dolar Mayorista (Bancos)'}
}

tipoDeAcciones={
	'alua.ba':	{simbolo: 'ALUA.BA', nombre: 'Aluar Aluminio Argentino S.A.I.C'},
	'apbr.ba':	{simbolo: 'APBR.BA', nombre: 'Petroleo Brasileiro SA Petrobras'},
	'bma.ba':	{simbolo: 'BMA.BA', nombre: 'Macro Bank, Inc.'},
	'come.ba':	{simbolo: 'COME.BA', nombre: 'Sociedad Comercial del Plata SA'},
	'edn.ba':	{simbolo: 'EDN.BA', nombre: 'EMP.DIST.Y COM.NORTE'},
	'erar.ba':	{simbolo: 'ERAR.BA', nombre: 'Siderar S.A.I.C.'},
	'fran.ba':	{simbolo: 'FRAN.BA', nombre: 'Bbva Banco Frances,S.A.'},
	'ggal.ba':	{simbolo: 'GGAL.BA', nombre: 'Grupo Financiero Galicia SA'},
	'pamp.ba':	{simbolo: 'PAMP.BA', nombre: 'Pampa Energia SA'},
	'pesa.ba':	{simbolo: 'PESA.BA', nombre: 'Petrobras Argentina SA'},
	'teco2.ba':	{simbolo: 'TECO2.BA', nombre: 'Telecom Argentina SA'},
	'ts.ba':	{simbolo: 'TS.BA', nombre: 'Tenaris SA'},
	'ypfd.ba':	{simbolo: 'YPFD.BA', nombre: 'YPF Sociedad Anonima'}	
}




//	FUNCIONES PRIVADAS
//


//	FUNCIONES PUBLICAS
//

// nombre:		divisas
// descripción:	Devuelve el valor de los diversas divisas: Dolar Ofical,Dolar Blue/Informal, Dolar Mayorista, Euro, Real,etc.... Fuente Ambito Financiero. Falta
// estado:		Borrador: Solo soporta los distintos Dolares, faltan las restantes divisas.
exports.divisas=function(req,res){
	divisa=tipoDeDivisas[req.params.divisa];
	
	if(divisa){
		funcionesDeServicios.peticionGET(req,res,'http://ambito.com/economia/mercados/monedas/dolar/',function(respuesta){			
			$=cheerio.load(respuesta)
			
			//Obtengo los valores
			// TO-DO:	Optimizar las consultas. Averguar de setar "root"
			dolarVariacion=$('.variacion',divisa.elementoHTML).text()
			dolarCompra=$('.ultimo big',divisa.elementoHTML).text()
			dolarVenta=$('.cierreAnterior big',divisa.elementoHTML).text()
			ultimaActualizacion=$('.dolarFecha big',divisa.elementoHTML).text()
		
			// Construyo el objeto de respuesta
			objetoDivisa={
				nombre:			divisa.nombre,
				venta:			funcionesDeServicios.convertirEnFloat(dolarVenta),
				compra:			funcionesDeServicios.convertirEnFloat(dolarCompra),
				variacion:		funcionesDeServicios.convertirEnFloat(dolarVariacion),
				actualizacion:	ultimaActualizacion,						
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
		res.send('404','No existe la divisa solicitada: '+req.params.divisa+'<br/><br/>Solo puede consultar:<ul><li><a href="/api/divisas/dolar">dolar</a><li><a href="/api/divisas/dolarBlue">dolarBlue</a><li><a href="/api/divisas/dolarMayorista">dolarMayorista</a></ul>')
	}
}

// nombre:		divisasColeccion
// descripción:	Retorna la coleccion de divisas (actualmente) disponibles para consultar
// estado:		Borrador
exports.divisasColeccion=function(req,res){
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


// nombre:		acciones
// descripción:	Devuelve la cotización de las acciones de la empresa solicitada. Fuente Yahoo Finanzas.
// estado:		Borrador
exports.acciones=function(req,res){
	
}

// nombre:		accionesColeccion
// descripción:	Retorna la coleccion de acciones del merval que (actualmente) están disponibles.
// estado:		Borrador
exports.accionesColeccion=function(req,res){
	//Objeto respuesta
	respuesta={
		descripcion: "Consulte las acciones del Merval",
		documentacion: "/api/acciones/",
		acciones:{
			'alua.ba':	{simbolo: 'ALUA.BA', nombre: 'Aluar Aluminio Argentino S.A.I.C', url: '/api/acciones/alua.ba'},
			'apbr.ba':	{simbolo: 'APBR.BA', nombre: 'Petroleo Brasileiro SA Petrobras', url: '/api/acciones/apbr.ba'},
			'bma.ba':	{simbolo: 'BMA.BA', nombre: 'Macro Bank, Inc.', url: '/api/acciones/bma.ba'},
			'come.ba':	{simbolo: 'COME.BA', nombre: 'Sociedad Comercial del Plata SA', url: '/api/acciones/come.ba'},
			'edn.ba':	{simbolo: 'EDN.BA', nombre: 'EMP.DIST.Y COM.NORTE', url: '/api/acciones/edn.ba'},
			'erar.ba':	{simbolo: 'ERAR.BA', nombre: 'Siderar S.A.I.C.', url: '/api/acciones/erar.ba'},
			'fran.ba':	{simbolo: 'FRAN.BA', nombre: 'Bbva Banco Frances,S.A.', url: '/api/acciones/fran.ba'},
			'ggal.ba':	{simbolo: 'GGAL.BA', nombre: 'Grupo Financiero Galicia SA', url: '/api/acciones/ggal.ba'},
			'pamp.ba':	{simbolo: 'PAMP.BA', nombre: 'Pampa Energia SA', url: '/api/acciones/pamp.ba'},
			'pesa.ba':	{simbolo: 'PESA.BA', nombre: 'Petrobras Argentina SA', url: '/api/acciones/pesa.ba'},
			'teco2.ba':	{simbolo: 'TECO2.BA', nombre: 'Telecom Argentina SA', url: '/api/acciones/teco2.ba'},
			'ts.ba':	{simbolo: 'TS.BA', nombre: 'Tenaris SA', url: '/api/acciones/ts.ba'},
			'ypfd.ba':	{simbolo: 'YPFD.BA', nombre: 'YPF Sociedad Anonima', url: '/api/acciones/ypfd.ba'}
		}
	}


	funcionesDeServicios.respuestaDinamica(req,res,respuesta);
}
