// TODO remove later when real sensors are added
// TODO change to event EventEmitter

function runSensor(newMailCb) {
     var stdin = process.stdin;
     stdin.setRawMode( true );
     // resume stdin in the parent process (node app won't quit all by itself
     // unless an error or process.exit() happens)
     stdin.resume();
     stdin.setEncoding( 'utf8' );

     // on any data into stdin
     stdin.on( 'data', function( key ){
       // ctrl-c ( end of text )
       if ( key === '\u0003' ) {
         process.exit();
       }
       newMailCb();
     });
   }


module.exports.runSensor = runSensor;
