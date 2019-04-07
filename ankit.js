var protobuf = require("protobufjs");
var sqlite3 = require("sqlite3");
var _ = require("lodash");
const fs = require("fs");
var content;
// First I want to read the file
fs.readFile("response.proto", function read(err, data) {
	if (err) {
		throw err;
	}
	content = data;

	processFile();          // Or put the next step in a function and invoke it
});

function processFile() {



	protobuf.load("nsw.proto", function(err, root) {
		if (err)
		{throw err;}
		let db = new sqlite3.Database("./db/nsw.db",sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log("Connected to the nsw database.");
		});

		db.serialize(() => {
			db.run("DROP TABLE if exists realtime_trips")
				.run("CREATE TABLE if not exists realtime_trips(trip_id text,stop_sequence number, stop_id text, arrival_time text, scheduleRelationship text)")

		  });
		var AwesomeMessage = root.lookupType("transit_realtime.FeedMessage");


		var message = AwesomeMessage.decode(content);
		var object = AwesomeMessage.toObject(message, {
			longs: String,
			enums: String,
			bytes: String,
		});

		let header = object["header"];
		let trips = object["entity"];
		console.log(trips[0]);
		for (const key_trip in trips) {
			var trip = trips[key_trip];
			var tripUpdate=  trip["tripUpdate"];
			var stops=tripUpdate["stopTimeUpdate"];
			var tripId =tripUpdate["trip"]["tripId"];

			for (const key_stops in stops) {

				var stopId=_.get(stops[key_stops],"stopId");
				var tripId =tripUpdate["trip"]["tripId"];
				var scheduleRelationship =tripUpdate["trip"]["scheduleRelationship"];

				db.serialize(() => {
					db.run(`INSERT INTO realtime_trips(trip_id,stop_sequence,stop_id,arrival_time,scheduleRelationship)
					   VALUES('${tripId}',${key_stops},'${stopId}','${JSON.stringify(stops[key_stops])})','${scheduleRelationship}')`) //${new Date(_.get(stops[key_stops],"arrival.time")*1000)}


				});

			}




		}

		  db.serialize(() => {
				 db	.each("select * from  realtime_trips where trip_id in (SELECT trip_id FROM realtime_trips where stop_id like '2135%' INTERSECT SELECT trip_id FROM realtime_trips where stop_id like '2121%')", (err, row) => {
				if (err){
				  throw err;
				}
				console.log(`${row.trip_id} ${row.stop_sequence} ${row.stop_id} ${row.arrival_time} ${row.scheduleRelationship}`);
			  });

		  });
		db.close((err) => {
			if (err) {
			  return console.error(err.message);
			}
		  });
	});

}