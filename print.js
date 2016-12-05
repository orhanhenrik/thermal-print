var SP = require('serialport');
var port = new SP('/dev/usb/lp0', {autoOpen:false})
var qr = require('qr-image');

function getPort(cb) {
  if (port.isOpen) {
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
  printMatrixJob(qr.matrix("Hei Larsen")),
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
  width = matrix.length;
  height = matrix.length;

  m = 0x30;
  xL = width
  xH = 0;
  yL = height*8 % 256;
  yH = Math.floor(height*8 / 256);

  var pixels = [];
  for (var i=0; i<xL*(yL+yH*256); i++){
    y_index = Math.floor(i / xL / 8);
    x_index = (i - y_index*8*xL) % xL;
    pixels[i] = matrix[y_index][x_index] * 255;
  }

	var buffer = Buffer.concat([
		new Buffer([0x1d, 0x76, 0x30, 48, xL, xH, yL, yH]),
		new Buffer(pixels),
		new Buffer([0x1b, 0x64, 2])
	]);

	port.write(buffer, cb);
}
