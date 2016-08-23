var raspi = require('raspi-io');
var five = require('johnny-five');


function PiGPIOController(readyCb) {

   if (!(this instanceof PiGPIOController)) {
      return new PiGPIOController();
   }

   var board = new five.Board({
       io: new raspi()
   });

   var mailLED;
   var statusLED;
   var IRBeamSwitch;
   var mailInMailbox = "unknown";
   var mailLEDState = "unknown";
   var statusLEDState = {
     color: "unknown",
     blinkFrequency: 0
   };

   board.on('ready', function() {
     console.log("Board ready");

     mailLED = new five.Led(2);
     statusLED = new five.Led.RGB({
       pins: {
         red: 24,
         green: 23,
         blue: 26
       },
       isAnode: true
     });

     // IR beam switch
     IRBeamSwitch = new five.Button({
       pin: 7,
       isPullup: true
     });

     statusLED.color("#ff0000");
     if(IRBeamSwitch.isDown{
       mailLED.on();
       mailLEDState = "on";
       mailInMailbox = true;
     } else {
       mailLED.off();
       mailLEDState = "off";
       mailInMailbox = false;
     }
     readyCb();
   });

   this.isMailInMailbox = function() {
     return mailInMailbox;
   };

   this.getMailLEDState = function() {
     return mailLEDState
   };

   this.getStatusLEDState = function() {
     return statusLEDState
   };

   this.setStatusLEDColor = function(color) {
     statusLED.color(color);
     statusLEDState.color = color;
     statusLEDState.blinkFrequency = 0;
   };

   this.statusLEDBlink = function() {
     statusLED.off();
     statusLED.on();
   };

   this.runNewMailSensor = function() {
     buttonStatus = "unknown";

     console.log("runNewMailSensor");
     IRBeamSwitch.on("down", function(value) {
       console.log("on");
       mailLED.on();
       mailLEDState = "on";
       mailInMailbox = true;
     });

     IRBeamSwitch.on("up", function() {
       console.log("off");
       mailLED.off();
       mailLEDState = "off";
       mailInMailbox = false;
     });
   };
 }

module.exports.PiGPIOController = PiGPIOController;
