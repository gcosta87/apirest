// yahooFinanzasAPI.js
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


// Pequeño modulo que contiene informacion relativa a la API de Yahoo Finanzas CSV.

//	Representacion inicial de la API:
//	Fuente de los parametros: http://greenido.wordpress.com/2009/12/22/yahoo-finance-hidden-api/
//	Ejemplo: download.finance.yahoo.com/d/quotes.csv?s=YPFD.BA&f=snl1cc3c6m
module.exports={
	url:'http://download.finance.yahoo.com/d/quotes.csv',
	parametro:{
		simbolo:	's',
		formato:	'f'
	},
	formato:{
		nombre: 				'n',
		simbolo: 				's',
		ultimaCotizacion:		'l1',
		variacion:				'c6',
		variacionConPorcentaje:	'c',
		variacionEnPorcentaje:	'p2',
		maximoDelDia:			'h',
		minimoDelDia:			'g',
		rangoDelDia:			'm',
		fecha:					'd1',
		hora:					't1',
		valorCierreAnterior:	'p',
		valorDeApertura:		'o',
		volumen:				'v',
	},
	//genera una URL en base a un Simbolo (accion/empresa) y un arreglo de valores de formatos
	generarURL:function(simbolo, arregloFormato){
		if(!simbolo){
			throw "Error en YahooFinanzasAPI: No se ha definido un Simbolo"
		}
		if(!arregloFormato){
			throw "Error en YahooFinanzasAPI: No se ha definido un arreglo con formatos para solicitar"
		}
		var urlGenerada= this.url;
		urlGenerada+='?'+this.parametro.simbolo+'='+simbolo;
		
		urlGenerada+='&'+this.parametro.formato+'='+arregloFormato.join('');
		
		return urlGenerada
	}
}
