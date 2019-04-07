const fs = require("fs")
const axios = require("axios")
const _ = require("lodash")
var sqlite3 = require("sqlite3");
var protobuf = require("protobufjs");

function downloadRealtimeData () {
	axios.request({
		responseType: "arraybuffer",
		url: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/sydneytrains",
		method: "HEAD",
		headers: {
			"Content-Type": "application/x-google-protobuf",
			"Accept":"application/x-google-protobuf",
			"Authorization":"apikey BeKGI5oNuKWcKCFeCGkF3fWK9YXsbXBlY8qu"
		},
	}).then((result) => {
		var lastModified= _.get(result,"headers.date");
		var lastModifiedTime=Date.parse(lastModified);
		fs.readFile("lastRTupdated.txt", function(err, buf) {
			var download=false;
			if(buf==null)
			{
				download=true;
			}
			else
			{
				var lastUpdatedTime=Date.parse(buf);
				console.log(lastUpdatedTime);
				if(!lastUpdatedTime || lastUpdatedTime<lastModifiedTime)
				{
					download=true;
				}
				else
				{
					console.log("No update required");
				}
			}

			if(download)
			{
				axios.request({
					responseType: "arraybuffer",
					url: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/sydneytrains",
					method: "GET",
					headers: {
						"Content-Type": "application/x-google-protobuf",
						"Accept":"application/x-google-protobuf",
						"Authorization":"apikey BeKGI5oNuKWcKCFeCGkF3fWK9YXsbXBlY8qu"
					},
				}).then((result) => {

					const outputFilename = "realtime.protobuf";
					fs.writeFile(outputFilename, result.data, function(err, data) {
						if (err) {console.log(err);}
						else{
							console.log("Successfully created realtime.protobuf file");
							console.log(new Date(Date.now()).toLocaleString());

							console.log("starting db import.....");
							let db = new sqlite3.Database("./db/nsw.db",sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
								if (err) {
									console.error(err);
									return;
								}
								console.log("Connected to the nsw database.");
							});

							db.serialize(() => {
								db.run("begin transaction");
								db.run("DROP TABLE if exists realtime_trips")
									.run("CREATE TABLE if not exists realtime_trips(trip_id text,stop_sequence number, stop_id text, arrival_delay number, scheduleRelationship text)");
								fs.readFile(outputFilename, function read(err, data) {
									if (err) {
										throw err;
									}

									processFile(db,data,function(){
										fs.writeFile("lastRTupdated.txt", lastModified, function(err, data) {
											if (err) {console.log(err);}
											else{
												db.run("commit");
												console.log("Successfully updated timestamp File.");
												console.log(new Date(Date.now()).toLocaleString());
												fs.unlink(outputFilename,(err) => {
													if (err) {throw err;}
													console.log(`${outputFilename} was deleted`);
												});
											}
										});
									});
								});


							})
						}
					});
					return outputFilename;
				});
			}

		});

	});
}
var requestLoop = setInterval(function(){
	downloadRealtimeData();
},15000);


function processFile(db,data,callback) {



	protobuf.load("nsw.proto", function(err, root) {
		if (err)
		{throw err;}


		var AwesomeMessage = root.lookupType("transit_realtime.FeedMessage");

		var message = AwesomeMessage.decode(data);
		var object = AwesomeMessage.toObject(message, {
			longs: String,
			enums: String,
			bytes: String,
		});

		let header = object["header"];
		let trips = object["entity"];
		console.log(_.get(trips[66],"tripUpdate.stopTimeUpdate"));

		for (const key_trip in trips) {
			var trip = trips[key_trip];
			var tripUpdate=  trip["tripUpdate"];
			var stops=tripUpdate["stopTimeUpdate"];
			var tripId =tripUpdate["trip"]["tripId"];
			for (const key_stops in stops) {

				var stopId=_.get(stops[key_stops],"stopId");
				var tripId =tripUpdate["trip"]["tripId"];
				var scheduleRelationship =tripUpdate["trip"]["scheduleRelationship"];

				db.run(`INSERT INTO realtime_trips(trip_id,stop_sequence,stop_id,arrival_delay,scheduleRelationship)
                       VALUES('${tripId}',${key_stops},'${stopId}','${_.get(stops[key_stops],"arrival.delay")}','${scheduleRelationship}')`) //${new Date(_.get(stops[key_stops],"arrival.time")*1000)}
			}
		}

		callback();
	});

}