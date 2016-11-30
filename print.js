var SP = require('serialport');

var port = new SP('/dev/usb/lp0', {autoOpen:false})

var qr = require('qr-image');
var matrix = qr.matrix('Hei Larsen. Hvordan går det, kjære?');

port.open(function(err){
	if(err) return console.error(err);
//	console.log('open!');
	port.write(new Buffer([0x1b, 0x40, 0x1b, 0x64, 1]), function(){
//		console.log('initialized');
		// printText(port);	
		port.drain(function(){
			printBitmap(port);
		});
	});
});

function printText(port) {
	var buffer = new Buffer("hello world\n");
	buffer = Buffer.concat([buffer, new Buffer([0x0a])])
	console.log('writing data');
	port.write(buffer, function(err){
		console.log('wrote data', err);
		port.close();
	});
}

function printBitmap(port) {
	// 			  GS    v     0,    m xL xH yL yH d1..dk
//	console.log(matrix);


	width = matrix.length;
	height = matrix.length; // +10 -> padding at bottom

	m = 0x30;
	xL = width
	xH = 0;
	yL = height*8 % 256;
	yH = Math.floor(height*8 / 256);
	
	var pixels = [];
	for (var i=0; i<xL*(yL+yH*256); i++){
		y_index = Math.floor(i / xL / 8);
		x_index = (i - y_index*8*xL) % xL;

		if (y_index < matrix.length) {
			pixels[i] = matrix[y_index][x_index] * 255;
		} else {
			// padding pixels
			pixels[i] = 255;
		}
	}
//	console.log(xL, xH, yL, yH);
//	console.log(pixels.length);
	// port.close();return;

	var buffer = Buffer.concat([
		new Buffer([0x1d, 0x76, 0x30, 48, xL, xH, yL, yH]), 
		new Buffer(pixels),
		new Buffer([0x1b, 0x64, 2])
	]);
	// var buffer = new Buffer([0x1b, 0x64, 10])
	
//	console.log('printing buffer', buffer.length);
	console.log(buffer.toString());
	port.write(buffer, function(err) {
		console.log('done 1');
		port.drain(function(){
			console.log('wrote data', err);
			setTimeout(function(){port.close();}, 300);
		});
	});
}
