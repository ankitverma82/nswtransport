const { processStops } = require("./processStops");

const { processCalendar } = require("./processCalendar");
const { processRoutes } = require("./processRoutes");
const { processStopTimes } = require("./processStopTimes");
const { processTrips } = require("./processTrips");

const fs = require("fs")
const path = require("path")
const unzip = require("unzip-stream")
const axios = require("axios")
const _ = require("lodash")
var sqlite3 = require("sqlite3");

function downloadSydneyTrains () {
	axios.request({
		responseType: "arraybuffer",
		url: "https://api.transport.nsw.gov.au/v1/gtfs/schedule/sydneytrains",
		method: "HEAD",
		headers: {
			"Content-Type": "application/json",
			"Accept":"application/json",
			"Authorization":"apikey BeKGI5oNuKWcKCFeCGkF3fWK9YXsbXBlY8qu"
		},
	}).then((result) => {
		var lastModified= _.get(result,"headers.last-modified");
		var lastModifiedTime=Date.parse(lastModified);

		fs.readFile("lastupdated.txt", function(err, buf) {
			var download=false;
			if(buf==null)
			{
				download=true;
			}
			else
			{
				var lastUpdatedTime=Date.parse(buf);
				console.log(lastUpdatedTime);
				if(!lastUpdatedTime || (lastUpdatedTime<lastModifiedTime && !fs.existsSync(lastModifiedTime+".zip")))
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
					url: "https://api.transport.nsw.gov.au/v1/gtfs/schedule/sydneytrains",
					method: "GET",
					headers: {
						"Content-Type": "application/octet-stream",
						"Accept":"application/octet-stream",
						"Authorization":"apikey BeKGI5oNuKWcKCFeCGkF3fWK9YXsbXBlY8qu"
					},
				}).then((result) => {

					const outputFilename =lastModifiedTime+".zip";
					fs.writeFile(outputFilename, result.data, function(err, data) {
						if (err) {console.log(err);}
						else{
							console.log("Successfully created timetable zip file");
							console.log(new Date(Date.now()).toLocaleString());

							fs.createReadStream(outputFilename).pipe(unzip.Extract({ path: "output" })).on("close", function (entry) {
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

									Promise.all([processStops(db),processRoutes(db),processCalendar(db),processTrips(db)]).then(responses=>{
										fs.writeFile("lastupdated.txt", lastModified, function(err, data) {
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
									}).catch(function(error){
										db.run("rollback");
										console.log(`error!!! ${error}`);
									});
								});

							});

						}
					});
					return outputFilename;
				});
			}

		});

	});
}
var requestLoop = setInterval(function(){
	downloadSydneyTrains();
},60000);

