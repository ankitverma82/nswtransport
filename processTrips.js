const fs = require("fs");
const csv = require("csv-parser");
function processTrips(db) {
	return new Promise(function (resolve, reject) {
		db.run("DROP TABLE if exists trips")
			.run("CREATE TABLE if not exists trips(route_id text,service_id text,trip_id text,trip_headsign text,trip_short_name text,direction_id text,block_id text,shape_id text,wheelchair_accessible text)");
		fs.createReadStream("output\\trips.txt")
			.pipe(csv())
			.on("data", (data) => {
				db.run(`INSERT INTO trips(route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible) 
                        VALUES ('${data["route_id"]}','${data["service_id"]}','${data["trip_id"]}','${data["trip_headsign"]}','${data["trip_short_name"]}','${data["direction_id"]}','${data["block_id"]}','${data["shape_id"]}','${data["wheelchair_accessible"]}')`, [], function () {
				});
			})
			.on("end", () => {
				resolve();
				console.log("trips import finished");
			});
	});
}
exports.processTrips = processTrips;
