const csv = require('csv-parser')
const fs = require('fs')
const loki = require('lokijs')
const results = [];


var db = new loki('stops.db');


 
    var stops = db.addCollection('stops');
    fs.createReadStream('stop_times.txt')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
     stops.insert(results);
     runProgramLogic();
    });


  // kick off any program logic or start listening to external events



// example method with any bootstrap logic to run after database initialized
function runProgramLogic() {
  var entryCount = db.getCollection("stops").count();
  var stops = db.getCollection("stops");
  console.log("number of entries in database : " + entryCount);
  var stop1=stops.chain().find({'stop_id' : {'$contains':'2135'}}).where(function(obj){
    return obj.stop_id.startsWith('2135');
  });
  var stop2=stops.chain().find({'stop_id' : {'$contains':'2121'}}).where(function(obj){
    return obj.stop_id.startsWith('2121');
  });

  var mapfun = function(left, right) {
    return {
      trip_id: left.trip_id,
      stop2_arrival_time: left.arrival_time,
      stop1_arrival_time: right.arrival_time,
      stop2_sequence: left.stop_sequence,
      stop1_sequence: right.stop_sequence,
    };
  };
  //console.log(stop1.simplesort('trip_id').data());
  //console.log(stop2.data());

  var commonRoutes = stop2.eqJoin(stop1, "trip_id", "trip_id", mapfun);
  var filteredRoutes = commonRoutes.where(function(obj){
    return obj.stop1_sequence<obj.stop2_sequence;
  }).data();

 console.log(filteredRoutes);
}
