const thingShadow = require('aws-iot-device-sdk').thingShadow;
const os = require('os');

function runThing(thingShadows, thingName, gpioController) {
    const operationTimeout = 10000; // ms
    var currentTimeout = null;

    console.log('runThing thingName: ' + thingName);

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
                    wlan: os.networkInterfaces()["wlan0"],
                    mailInMailbox: gpioController.isMailInMailbox(),
                    statusLED: gpioController.getStatusLEDState(),
                    mailLED: gpioController.getMailLEDState()
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
        gpioController.setStatusLEDColor("#00ff00");
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
        gpioController.setStatusLEDColor("#0000ff");
    }

    function handleTimeout(thingName, clientToken) {
        var expectedClientToken = tokenStack.pop();

        if (expectedClientToken === clientToken) {
            console.log('timeout on: ' + thingName);
        } else {
            console.log('(timeout) client token mismtach on: ' + thingName);
        }
        gpioController.setStatusLEDColor("#0000ff");

        genericOperation('update', getState());
    }

    // Register shadow callbacks
    thingShadows.on('connect', function() {
        console.log('connected to AWS IoT');
        gpioController.setStatusLEDColor("#0000ff");
        register();
    });

    thingShadows.on('close', function() {
        console.log('close');
        gpioController.setStatusLEDColor("#ff0000");
        thingShadows.unregister(thingName);
    });

    thingShadows.on('reconnect', function() {
        console.log('reconnect');
        gpioController.setStatusLEDColor("#0000ff");
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
        gpioController.setStatusLEDColor("#ff0000");
    });

    thingShadows.on('error', function(error) {
        console.log('error', error);
        gpioController.setStatusLEDColor("#ff0000");
    });

    thingShadows.on('message', function(topic, payload) {
        console.log('message', topic, payload.toString());
        gpioController.setStatusLEDColor("#00ff00");
    });

    thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
        handleStatus(thingName, stat, clientToken, stateObject);
        gpioController.setStatusLEDColor("#00ff00");
    });

    thingShadows.on('delta', function(thingName, stateObject) {
        handleDelta(thingName, stateObject);
        gpioController.setStatusLEDColor("#00ff00");
    });

    thingShadows.on('timeout', function(thingName, clientToken) {
        handleTimeout(thingName, clientToken);
        gpioController.setStatusLEDColor("#0000ff");
    });
}

exports.runThing = runThing;
