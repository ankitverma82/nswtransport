const fs = require("fs");
const csv = require("csv-parser");
function processStopTimes(db) {
	return new Promise(function (resolve, reject) {
		db.run("DROP TABLE if exists stopTimes")
			.run("CREATE TABLE if not exists stopTimes(trip_id text,arrival_time text,departure_time text,stop_id text,stop_sequence text,stop_headsign text,pickup_type text,drop_off_type text,shape_dist_traveled text)");
		fs.createReadStream("output\\stop_times.txt")
			.pipe(csv())
			.on("data", (data) => {
				db.run(`INSERT INTO stopTimes(trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled)
                        VALUES ('${data["trip_id"]}','${data["arrival_time"]}','${data["departure_time"]}','${data["stop_id"]}','${data["stop_sequence"]}','${data["stop_headsign"]}','${data["pickup_type"]}','${data["drop_off_type"]}','${data["shape_dist_traveled"]}')`, [], function (error) {

				});
				//process.stdout.write(".");
			})
			.on("end", () => {
				resolve();
				console.log("Process stop times finished");
			});

	});
}
exports.processStopTimes = processStopTimes;
