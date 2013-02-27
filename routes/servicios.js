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

//	FUNCIONES PRIVADAS
//


//	FUNCIONES PUBLICAS
//

//Implementación del Servicios de Divisas: Dolar, Dolar Blue...
//Estado borrador
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
