var raspi = require('raspi-io');
var five = require('johnny-five');

function runSensor(cb) {
  console.log("runSensor");
    var board = new five.Board({
        io: new raspi()
    });

    board.on('ready', function() {
      console.log("Sensor ready");
        var motion = new five.Motion('P1-7');

        motion.on('motionstart', function() {
          console.log("Sensor motionstart");
            cb();
        })
    });
}

module.exports.runSensor = runSensor;
