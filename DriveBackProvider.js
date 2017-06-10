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
let moment = require('moment-timezone');

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
					let start = DriveBackProvider.parseMoment(trip.first_pickup);
					let end = DriveBackProvider.parseMoment(trip.last_deliver);
					let vehicle = DriveBackProvider.parseVehicle(trip.vehicle);

					if(end.isBefore(moment())){
						continue;
					}

					for (var j = 0; j < trip.to_stations.length; j++) {
						let idstring = trip.id + '.' + trip.to_stations[j].id;

						if(ids.indexOf(idstring) == -1){
							ids.push(idstring);

							let url = 'https://driveback.se/resor/' + trip.id + '/boka/' + trip.to_stations[j].id;
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

	static parseMoment(time){
		// timestamps from API indicate GMT but is actually local, Swedish timezone
		let m = moment(time);
		m.tz('Europe/Stockholm');
		m.add(-m.utcOffset(), 'minutes');
		return m;
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