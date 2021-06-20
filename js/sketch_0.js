//check tensorflow loading --> DONE
console.log(tf);

/* 
key steps
1. load model --> DONE
2. generate latent space representation
3. decode latent space representation to image
4. draw image to canvas
5. repeat 2 ~ 4
*/

// VARIABLES -----------------------------------------------
var MODEL;
var canvas;
var ctx;
var count = 0;
// FUNCTIONS -----------------------------------------------

//load model
async function loadModel() {
    MODEL = await tf.loadLayersModel('./model/mnist-vae/model.json');
    console.log(MODEL);
    //console.log(MODEL.predict);
}

//draw image to canvas
async function draw(_x, _y) {
    // 2 //
    const latent_sample = tf.tensor([
        [_x, _y]
    ]);
    //console.log(latent_sample);
    // 3 //
    const img = await MODEL.predict(latent_sample).mul(tf.scalar(255.0)).reshape([28, 28]);
    //console.log(img);
    // 4 //
    const pixels = img.dataSync(); //tensor to pixel
    //console.log(pixels);
    //javascript image data object
    const img_data = new ImageData(img.shape[1], img.shape[0]);
    //console.log(img.shape.length);
    //assign value to image data according to image type
    if (img.shape.length === 2 || img.shape[2] === 1) {
        // Greyscale
        for (let i = 0; i < pixels.length; i += 1) {
            img_data.data[i * 4] = 255 - pixels[i];
            img_data.data[i * 4 + 1] = 255 - pixels[i];
            img_data.data[i * 4 + 2] = 255 - pixels[i];
            img_data.data[i * 4 + 3] = 255;
        }
    } else if (img.shape[2] === 3) {
        // RGB
        for (let i = 0; i < pixels.length / 3; i += 1) {
            img_data.data[i * 4] = 255 - pixels[i * 3];
            img_data.data[i * 4 + 1] = 255 - pixels[i * 3 + 1];
            img_data.data[i * 4 + 2] = 255 - pixels[i * 3 + 2];
            img_data.data[i * 4 + 3] = 255;
        }
    } else if (tensor.shape[2] === 4) {
        // RGBA
        img_data.data = pixels;
    }


    ctx.putImageData(img_data, 0, 0);
    // scale 28 * 28 image to fit canvas
    const scaleH = canvas.height / img.shape[0];
    const scaleW = canvas.width / img.shape[1];
    ctx.scale(scaleH, scaleW);
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.scale(1.0 / scaleH, 1.0 / scaleW);
}

//animation loop
//update contains the loop that repeats 2 ~ 4
function update() {
    requestAnimationFrame(update);
    count++;
    draw(Math.cos(count * 0.01), Math.sin(count * 0.01));
}

function onMouseMove(e){
	const x = -1 + 2 * e.clientX / window.innerWidth;
	const y = -1 + 2 * e.clientY / window.innerHeight;
	draw(x, y);
}

//initiation
async function init() {
    await loadModel();
    canvas = document.createElement('canvas');
    canvas.width = (window.innerWidth > window.innerHeight)? window.innerHeight : window.innerWidth;
    canvas.height = canvas.width;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log(canvas);

    window.addEventListener('mousemove', onMouseMove);
    //update();
}

// INIT ----------------------------------------------------

init();