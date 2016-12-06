var SP = require('serialport');
var port = new SP('/dev/usb/lp0', {autoOpen:false, baudRate: 57600})
var qr = require('qr-image');

function getPort(cb) {
  if (port.isOpen()) {
    cb(port);
  } else {
    port.open(function(err){
      if(err) return console.error(err);
      cb(port);
    });
  }
}
function closePort(cb) {
  port.drain(function(){
    setTimeout(function(){
      port.close(cb);
    }, 500);
  });
}

var printQueue = [
 // printMatrixJob(qr.matrix("Hei Larsen")),
  printMatrixJob(qr.matrix("Hei Orhan")),
  printMatrixJob(qr.matrix("Hei Sylliaas")),
];

var printing = false;

function processPrintQueue() {
  if(!printing) {
    if(!printQueue.length){
      setTimeout(processPrintQueue, 50);
      return;
    }
    printing = true;
    getPort(function(port) {
      job = printQueue.shift();
      job(port, function(){
        printing = false;
        processPrintQueue();
      })
    });
  }
}
processPrintQueue();

function printMatrixJob(matrix) {
  return function(port, cb) {
    printMatrix(port, matrix, cb);
  }
}

function printMatrix(port, matrix, cb) {
  width = matrix.length * 8 * 2 // * Math.floor(48/matrix.length) //384;
  height = matrix.length * 8 * 2 // * Math.floor(48/matrix.length) //384;

height -= 1; // ?!?!?!? If height is not decreased, it does not print the whole buffer

  m = 48;
  xL = Math.floor(width / 8) % 256;
  xH = Math.floor(Math.floor(width / 8) / 256);
  yL = height % 256;
  yH = Math.floor(height / 256);

  console.log(m, xL, xH, yL, yH);

  var pixels = [];

  console.log('generating bitmap');

  for(var y = 0; y < height; y++) {
    for(var x = 0; x < width; x+=8) {
      var byte = 0;
      for(var k=0; k < 8; k++) {
        y_index = Math.floor(y * matrix.length / height);
        x_index = Math.floor((x+k) * matrix.length / width);
        value = matrix[y_index][x_index];
        byte |= value << (7-k);
      }
      pixels.push(byte);
    }
  }
  console.log('generated');
  
  console.log((xL+xH*256)*(yL+yH*256), pixels.length);


  var buffer = Buffer.concat([
    // new Buffer([0x1b, 0x40]), // ESC @
    new Buffer([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]),
    new Buffer(pixels),
    new Buffer([0x1b, 0x64, 2])
  ]);

  writeAndDrain(port, buffer, function(){
    console.log('wrote data');
    w(0);
    setTimeout(cb, 0);
  });
}

function writeAndDrain(port, data, cb){
  port.write(data, function(){
    port.drain(cb);
  });
}

function w(i){return;
  console.log(i);
  writeAndDrain(port, i+"", function(){
    setTimeout(function(){w(i+1)}, 100);  
  })
}

port.on('close', function(){console.log('closed');});

port.on('data', function(d){console.log('data', d);});

port.on('error', function(e){console.log('err', e);});
