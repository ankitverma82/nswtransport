const request = require("request");
const csv = require('csv-parser')
const fs = require('fs')
const loki = require('lokijs')
const results = [];


var db = new loki('stops.db', {
    autoload: true,
    autoloadCallback : databaseInitialize,
    autosave: true, 
    autosaveInterval: 4000
});

// implement the autoloadback referenced in loki constructor
function databaseInitialize() {
  var stops = db.getCollection("stops");
  if (stops === null) {
    var stops = db.addCollection('stops');
    fs.createReadStream('sydneytrains_GTFS_20190323140100//stop_times.txt')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
     stops.insert(results);
     runProgramLogic();
    });
  }
  else{
    runProgramLogic();
  }

  // kick off any program logic or start listening to external events

}

// example method with any bootstrap logic to run after database initialized
function runProgramLogic() {
  var entryCount = db.getCollection("stops").count();
  var stops = db.getCollection("stops");
  console.log("number of entries in database : " + entryCount);
  var stop1=stops.chain().find({'stop_id' : {'$contains':'2135'}}).branch();
  var stop2=stops.chain().find({'stop_id' : {'$contains':'2121'}}).branch();

  var mapfun = function(left, right) {
    return {
      trip_id: left.trip_id,
      stop1_arrival_time: left.arrival_time,
      stop2_arrival_time: right.arrival_time,
      stop1_sequence: left.stop_sequence,
      stop2_sequence: right.stop_sequence,
    };
  };
  //console.log(stop2);

  var commonRoutes = stop1.eqJoin(stop2, "trip_id", "trip_id", mapfun).data();
  var filteredRoutes = stop1.find({'$and':[{stop1_sequence: { $ne: undefined }},{stop1_sequence: {$ne:undefined}}] }).data();

 console.log(filteredRoutes);
}
