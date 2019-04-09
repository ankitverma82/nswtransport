const _ = require("lodash")
var sqlite3 = require("sqlite3");
var moment = require("moment");
function ShowRealTimeData () {

	let db = new sqlite3.Database("./db/nsw.db",sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log("Connected to the nsw database.");
	});
	var currentDate=new Date(Date.now());
	var dateString=`${currentDate.getFullYear()}${addZero(currentDate.getMonth()+1)}${addZero(currentDate.getDate())}`;
	var days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

	var weekday =days[currentDate.getDay()];
	var currentTime=`${addZero(currentDate.getHours())}:${addZero(currentDate.getMinutes()-1)}:00`;

	var script = `create table trip1 as 
    select stopTimes.trip_id,stopTimes.stop_id as stop1,arrival_time as stop1_arrival,stopTimes.stop_sequence as stop1_sequence from stopTimes join trips on stopTimes.trip_id=trips.trip_id
    
    join calendar on trips.service_id=calendar.service_id
     where 
     (stopTimes.stop_id like '2135%')
           and '${dateString}'
          between start_date and end_date
          and ${weekday}=1
          and stopTimes.arrival_time > '${currentTime}' --and '24:55:00'
    order by stopTimes.arrival_time;
    
    drop table if exists trip2;
    
    create table trip2 as 
    select stopTimes.trip_id,stopTimes.stop_id as stop2,arrival_time as stop2_arrival,stopTimes.stop_sequence as stop2_sequence from stopTimes
    where trip_id in
    (select trip_id from trip1 )
    and stopTimes.stop_id like '2121%';`;
	//console.log(script);
	db.serialize(() => {
		db.run("drop table if exists trip1").
			run(script);
		db.each(`select * from trip1 join trip2 on trip1.trip_id=trip2.trip_id  
        left join realtime_trips on realtime_trips.trip_id=trip1.trip_id and stop1=realtime_trips.stop_id
        where stop1_sequence<stop2_sequence
        order by stop1_arrival;`, (err, row) => {
			if (err){
				throw err;
			}
			var arrival1Parts = row.stop1_arrival.split(":");
			var arrival2Parts = row.stop2_arrival.split(":");
			var arrival1=new Date(Date.now());
			arrival1.setHours(arrival1Parts[0]);
			arrival1.setMinutes(arrival1Parts[1]);
			arrival1.setSeconds(arrival1Parts[2]);
			var arrival2=new Date(Date.now());
			arrival2.setHours(arrival2Parts[0]);
			arrival2.setMinutes(arrival2Parts[1]);
			arrival2.setSeconds(arrival2Parts[2]);
			var start=moment(arrival1,"DD/MM/YYYY HH:mm:ss");
			var end=moment(arrival2,"DD/MM/YYYY HH:mm:ss");
			var duration = moment.duration(end.diff(start));
			var minutes = duration.asMinutes();

			console.log(minutes);
			console.log(`${row.stop1} ${row.stop1_arrival} ${row.stop2} ${row.stop2_arrival}`);

		});
		console.log(currentTime);
		console.log(currentDate);
		console.log(dateString);
	});

}

//var requestLoop = setInterval(function(){
ShowRealTimeData();
//},5000);
function addZero(i) {
	if (i < 10) {
		i = "0" + i;
	}
	return i;
}
