// ambitoFinancieroAPI.js
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
 * Modulo que encapsula la fuente Ambito Financiero.
 */

cheerio=require('cheerio')
funcionesDeServicios=require('./funcionesDeServicios.js')
//	CONSTANTES
//

URL_DIVISAS="http://www.ambito.com/economia/mercados/monedas/"

exports.fuente={ nombre: 'Ambito.com', url: 'http://www.ambito.com'	}


//Divisas Soportadas. Se proveen de los datos requeridos para su procesamiento
tipoDeDivisas={
	euro:  			{nombre:'Euro', url:URL_DIVISAS+'euro/'},
	real:  			{nombre:'Real', url:URL_DIVISAS+'info/?ric=BRL=X'},	
	dolar:  			{nombre:'Dolar Oficial', url:URL_DIVISAS+'dolar/info/?ric=ARSSCBCRA'},
	dolarBlue:  		{nombre:'Dolar Blue (Informal)',url:URL_DIVISAS+'dolar/info/?ric=ARSB='},
	dolarMayorista:	{nombre:'Dolar Mayorista (Bancos)',url:URL_DIVISAS+'dolar/info/?ric=ARSIB='}
}

exports.tipoDeDivisas=tipoDeDivisas
//	FUNCIONES PRIVADAS
//


//	FUNCIONES PÚBLICAS
//

// @nombre:			obtenerCotizacionDeDivisa
// @descripción:	Devuelve en el callback la cotizacion de la divisa
// @estado:			Borrador
// @parámetro	req:
// @parámetro	res:
// @parámetro	divisa: objeto perteneciente a la estructura tipoDeDivisas.
// @parámetro	callback(objeto divisa): retorna la representacion de la divisa: valores de compra/venta, variacion en porcentaje y fecha de los datos.
exports.obtenerCotizacionDeDivisa=function(req,res,divisa,callback){
	
	funcionesHTTP.peticionGET(req,res,divisa.url,function(respuesta){
		$=cheerio.load(respuesta)
		
		//Obtengo los valores
		// TO-DO:	Optimizar las consultas. Averguar de setar "root"
		respuestaVariacion=$('div#variacion big','.valores').text()
		respuestaCompra=$('div#compra big','.valores').text()
		respuestaVenta=$('div#venta big','.valores').text()
		respuestaCierreAnterior=$('div#cierreAnterior big','.valores').text()
		ultimaActualizacion=$('div.uact','#topMercadosHistorico').find('b');

		dia=ultimaActualizacion.eq(0).text().trim();
		hora=ultimaActualizacion.eq(1).text().trim();

		// Construyo el objeto de respuesta
		objetoDivisa={
			nombre:			divisa.nombre,
			venta:			funcionesDeServicios.convertirEnFloat(respuestaVenta),
			compra:			funcionesDeServicios.convertirEnFloat(respuestaCompra),
			variacion:		funcionesDeServicios.convertirEnFloat(respuestaVariacion),
			cierreAnterior:	funcionesDeServicios.convertirEnFloat(respuestaCierreAnterior),
			ultimaActualizacion:	{dia: dia}			
		};
		//Si esta disponible la Hora...
		if(hora){
			objetoDivisa.ultimaActualizacion.hora=hora
		}
		
		process.nextTick(function(){
			callback(objetoDivisa);
		});
	});
}
