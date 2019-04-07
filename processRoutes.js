const fs = require("fs");
const csv = require("csv-parser");
function processRoutes(db) {
	return new Promise(function (resolve, reject) {

		db.run("DROP TABLE if exists routes")
			.run("CREATE TABLE if not exists routes(route_id text,agency_id text,route_short_name text,route_long_name text,route_desc text,route_type text,route_url text,route_color text,route_text_color text)");
		fs.createReadStream("output\\routes.txt")
			.pipe(csv())
			.on("data", (data) => {
				db.run(`INSERT INTO routes(route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color) 
                        VALUES ('${data["route_id"]}','${data["agency_id"]}','${data["route_short_name"]}','${data["route_long_name"]}','${data["route_desc"]}','${data["route_type"]}','${data["route_url"]}','${data["route_color"]}','${data["route_text_color"]}')`, [], function () {
				});
			})
			.on("end", () => {
				resolve();
				console.log("routes import finished");
			});
	});
}
exports.processRoutes = processRoutes;
