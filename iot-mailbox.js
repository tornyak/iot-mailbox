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

const newMailTopic = 'mailboxpi/newmail';

//begin module
function run(args) {
   //
   // Instantiate the thing shadow class. For now shadows are not used.
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

   thing.runThing(thingShadows)
   sensor.runSensor(function() {
     var msg = JSON.stringify({
       thingName: thing.thingName,
       serialNumber: 12345,
       newMailAt: new Date().getTime()
     });
     console.log("New mail notificaton sent: " + msg);
     thingShadows.publish(newMailTopic, msg);
   });
} // end run

module.exports = cmdLineProcess;

if (require.main === module) {
   cmdLineProcess('connect to the AWS IoT service send notification on new mail',
      process.argv.slice(2), run);
}
