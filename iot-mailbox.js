/*
 * Main file of AWS IoT powered mailbox implementation. IoT Mailbox is a real
 * physical mailbox with internet connection and sensors that register when new
 * mail is inserted. This program implements IoT Thing using AWS IoT Node.js
 * SDK. It is intended for Raspberry Pi running Raspbian OS.
 */

//node.js deps

//npm deps

//app deps
const thingShadow = require('aws-iot-device-sdk').thingShadow;
const cmdLineProcess = require('./lib/cmdline');
const thing = require('./thing');
const sensor = require('./sensor');

const shadowUpdateTmo = 60 * 1000 // Update every minute
const rebootTmo = 60 * shadowUpdateTmo; // Reboot timer if no AWS connection
const serialNumber = 12345;

//begin module
function run(args) {
    //
    // Instantiate the thing shadow class.
    //
    const thingShadows = thingShadow({
        keyPath: args.privateKey,
        certPath: args.clientCert,
        caPath: args.caCert,
        clientId: args.clientId,
        region: args.region,
        baseReconnectTimeMs: args.baseReconnectTimeMs,
        keepalive: args.keepAlive,
        protocol: args.Protocol,
        port: args.Port,
        host: args.Host,
        debug: args.Debug
    });

    // testMode 2 is using sensor
    if (args.testMode === 2) {
        gpioController = new sensor.PiGPIOController(function(){
          // connect to AWS
          thing.runThing(thingShadows, args.thingName, gpioController)
          console.log("Run thingName: " + args.thingName + " testMode: " + args.testMode);
          gpioController.runNewMailSensor();
        });
    } else {
        setTimeout(sendNotification, 5000);
    }
} // end run

module.exports = cmdLineProcess;

if (require.main === module) {
    cmdLineProcess('connect to the AWS IoT service send notification on new mail',
        process.argv.slice(2), run);
}
