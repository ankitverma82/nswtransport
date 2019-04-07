const fs = require("fs");
const csv = require("csv-parser");
var sqlite3 = require("sqlite3");

let db = new sqlite3.Database("./db/nsw.db",sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
	if (err) {
		console.error(err);
		return;
	}
	console.log("Connected to the nsw database.");
});
function processStops(db) {
	return new Promise(function (resolve, reject) {
		var results=[];
		db.serialize(() => {
			db.run("DROP TABLE if exists stopTimes")
				.run("CREATE TABLE if not exists stopTimes(trip_id text,arrival_time text,departure_time text,stop_id text,stop_sequence text,stop_headsign text,pickup_type text,drop_off_type text,shape_dist_traveled text)");
			db.serialize(() => {
				db.run("begin transaction");
				fs.createReadStream("output\\stop_times.txt")
					.pipe(csv())
					.on("data", (data) => {
						//results.push(data);
						db.run(`INSERT INTO stopTimes(trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled)
                        VALUES ('${data["trip_id"]}','${data["arrival_time"]}','${data["departure_time"]}','${data["stop_id"]}','${data["stop_sequence"]}','${data["stop_headsign"]}','${data["pickup_type"]}','${data["drop_off_type"]}','${data["shape_dist_traveled"]}')`, [], function () {
							reject();
						});
						//process.stdout.write(".");
					})
					.on("end", () => {
						db.run("commit");
						resolve();
						console.log("Process stops finished");
					});
			});

		});
	});
}
processStops(db);
