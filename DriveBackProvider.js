/*
 *	Created by Adam Sandström
 *	(c) 2017
 *
 *	adsa95@gmail.com
 *	www.adsa.se
 */

"use strict"

let TripFinder = require('trip-finder');
let request = require('request');
let moment = require('moment');

class DriveBackProvider{
	static fetch(){
		return new Promise(function(resolve, reject){
			request("http://www.driveback.se/resor.json", function(err, res, body){
				if(err) reject(err);

				body = JSON.parse(body);
				let trips = [];
				let ids = [];

				for (var i = 0; i < body.length; i++) {
					let trip = body[i];
					let from = DriveBackProvider.parseLocation(trip.from_station);
					let start = moment(trip.first_pickup);
					let end = moment(trip.last_deliver);
					let vehicle = DriveBackProvider.parseVehicle(trip.vehicle);

					for (var j = 0; j < trip.to_stations.length; j++) {
						let idstring = trip.id + '.' + trip.to_stations[j].id;

						if(ids.indexOf(idstring) == -1){
							ids.push(idstring);

							let url = 'https://driveback.se/resor' + trip.id + '/boka/' + trip.to_stations[j].id;
							let to = DriveBackProvider.parseLocation(trip.to_stations[j]);
							trips.push(new TripFinder.classes.Trip('DriveBack', from, to, vehicle, start, end, url));
						}
					}
				}

				if(!trips) reject(new Error('Parse error!'));

			    resolve(trips);
			});
		});
	}

	static parseVehicle(json){
		return new TripFinder.classes.Vehicle(json.car_model, json.car_size, !json.gearbox);
	}

	static parseLocation(json){
		let name = json.area + ' (' + json.location.city + ')';
		let address = json.address1 + ', ' + json.zip + ' ' + json.area;

		return new TripFinder.classes.Location(name, address, json.location.latitude, json.location.longitude);
	}

	static getProviderName(){
		return "DriveBack";
	}
}

module.exports = DriveBackProvider;