const thingShadow = require('aws-iot-device-sdk').thingShadow;
const os = require('os');

const thingName = 'MailboxPi';  // same as created in AWS IoT Console

function runThing(thingShadows) {
    const operationTimeout = 10000; // ms
    var currentTimeout = null;

    //
    // Stack of client token values returned from thingShadows.update()
    // operation. For this app stach should never reach a depth of more
    // than a single element, but if we start using multiple thing
    // shadows simultaneously, we'll need some data structure to correlate
    // client tokens with their respective thing shadows.
    //
    var tokenStack = [];

    function genericOperation(operation, state) {
       var clientToken = thingShadows[operation](thingName, state);

       if (clientToken === null) {
          //
          // The thing shadow operation can't be performed because another one
          // is pending; if no other operation is pending, reschedule it after an
          // interval which is greater than the thing shadow operation timeout.
          //
          if (currentTimeout !== null) {
             console.log('operation in progress, scheduling retry...');
             currentTimeout = setTimeout(
                function() {
                   genericOperation(operation, state);
                },
                operationTimeout * 2);
          }
       } else {
          //
          // Save the client token so that we know when the operation completes.
          //
          tokenStack.push(clientToken);
       }
    }

    function getState() {
      return {
        state: {
            desired: {
              thingName: thingName,
              hostName: os.hostname(),
              avgLoad: os.loadavg(),
              uptime: os.uptime(),
              freemem: os.freemem(),
              netInterfaces: os.networkInterfaces()
            }
         }
      }

    }

    function register() {
       thingShadows.register(thingName, {
          ignoreDeltas: true,
          operationTimeout: operationTimeout
       });
       genericOperation('update', getState());
    }

    function handleStatus(thingName, stat, clientToken, stateObject) {
       var expectedClientToken = tokenStack.pop();

       if (expectedClientToken === clientToken) {
          console.log('got \'' + stat + '\' status on: ' + thingName);
       } else {
          console.log('(status) client token mismtach on: ' + thingName);
       }

        console.log('updated state to thing shadow');
        //
        // If no other operation is pending, restart it after 60 seconds.
        //
        if (currentTimeout === null) {
           currentTimeout = setTimeout(function() {
              currentTimeout = null;
              genericOperation('update', getState());
           }, 60000);
        }
    }

    function handleDelta(thingName, stateObject) {
          console.log('unexpected delta: ' + thingName);
    }

    function handleTimeout(thingName, clientToken) {
       var expectedClientToken = tokenStack.pop();

       if (expectedClientToken === clientToken) {
          console.log('timeout on: ' + thingName);
       } else {
          console.log('(timeout) client token mismtach on: ' + thingName);
       }

       genericOperation('update', getState());
    }

    // Register shadow callbacks
    thingShadows.on('connect', function() {
       console.log('connected to AWS IoT');
       register();
    });

    thingShadows.on('close', function() {
       console.log('close');
       thingShadows.unregister(thingName);
    });

    thingShadows.on('reconnect', function() {
       console.log('reconnect');
    });

    thingShadows.on('offline', function() {
       //
       // If any timeout is currently pending, cancel it.
       //
       if (currentTimeout !== null) {
          clearTimeout(currentTimeout);
          currentTimeout = null;
       }
       //
       // If any operation is currently underway, cancel it.
       //
       while (tokenStack.length) {
          tokenStack.pop();
       }
       console.log('offline');
    });

    thingShadows.on('error', function(error) {
       console.log('error', error);
    });

    thingShadows.on('message', function(topic, payload) {
       console.log('message', topic, payload.toString());
    });

    thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
       handleStatus(thingName, stat, clientToken, stateObject);
    });

    thingShadows.on('delta', function(thingName, stateObject) {
       handleDelta(thingName, stateObject);
    });

    thingShadows.on('timeout', function(thingName, clientToken) {
       handleTimeout(thingName, clientToken);
    });
}

exports.runThing = runThing;
exports.thingName = thingName
