const fs = require("fs");
const csv = require("csv-parser");
function processStops(db) {
	return new Promise(function (resolve, reject) {
		db.run("DROP TABLE if exists stops")
			.run("CREATE TABLE if not exists stops(stop_id text,stop_code text,stop_name text,stop_desc text,stop_lat text,stop_lon text,zone_id text,stop_url text,location_type text,parent_station text,stop_timezone text,wheelchair_boarding text)");
		fs.createReadStream("output\\stops.txt")
			.pipe(csv())
			.on("data", (data) => {
				db.run(`INSERT INTO stops(stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,stop_timezone,wheelchair_boarding) 
                        VALUES ('${data["stop_id"]}','${data["stop_code"]}','${data["stop_name"]}','${data["stop_desc"]}','${data["stop_lat"]}','${data["stop_lon"]}','${data["zone_id"]}','${data["stop_url"]}','${data["location_type"]}','${data["parent_station"]}','${data["stop_timezone"]}','${data["wheelchair_boarding"]}')`, [], function () {
				});
			})
			.on("end", () => {
				resolve();
				console.log("Process stops finished");
			});
	});
}
exports.processStops = processStops;
