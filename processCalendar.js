const fs = require("fs");
const csv = require("csv-parser");
function processCalendar(db) {
	return new Promise(function (resolve, reject) {
		db.run("DROP TABLE if exists calendar")
			.run("CREATE TABLE if not exists calendar(service_id text,monday text,tuesday text,wednesday text,thursday text,friday text,saturday text,sunday text,start_date text,end_date text)");

		fs.createReadStream("output\\calendar.txt")
			.pipe(csv())
			.on("data", (data) => {
				db.run(`INSERT INTO calendar(service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date) 
                        VALUES ('${data["service_id"]}','${data["monday"]}','${data["tuesday"]}','${data["wednesday"]}','${data["thursday"]}','${data["friday"]}','${data["saturday"]}','${data["sunday"]}','${data["start_date"]}','${data["end_date"]}')`, [], function () {
				});
			})
			.on("end", () => {
				resolve();
				console.log("calendar import finished");
			});
	});
}
exports.processCalendar = processCalendar;
