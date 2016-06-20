var raspi = require('raspi-io');
var five = require('johnny-five');

function runSensor(newMailCb) {
    var board = new five.Board({
        io: new raspi()
    });

    board.on('ready', function() {

        var motion = new five.Motion('P1-7');

        motion.on('motionstart', function() {
            newMailCb();
        })
    });
}

module.exports.runSensor = runSensor;
