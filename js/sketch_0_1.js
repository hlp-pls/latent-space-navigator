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
var canvasL, canvasR;
var ctxL, ctxR;
var count = 0;
var pnts = [];
var is_exploring = false;
var prev_pnt = 0;
var px = 0, py = 0;
// FUNCTIONS -----------------------------------------------

//load model
async function loadModel() {
    MODEL = await tf.loadLayersModel('./model/generator/model.json');
    console.log(MODEL);
    //console.log(MODEL.predict);
}

//draw image to canvas
async function drawL(_x, _y) {
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
            img_data.data[i * 4] = 255-pixels[i];
            img_data.data[i * 4 + 1] = 255-pixels[i];
            img_data.data[i * 4 + 2] = 255-pixels[i];
            img_data.data[i * 4 + 3] = 255;
        }
    } else if (img.shape[2] === 3) {
        // RGB
        for (let i = 0; i < pixels.length / 3; i += 1) {
            img_data.data[i * 4] = 255-pixels[i * 3];
            img_data.data[i * 4 + 1] = 255-pixels[i * 3 + 1];
            img_data.data[i * 4 + 2] = 255-pixels[i * 3 + 2];
            img_data.data[i * 4 + 3] = 255;
        }
    } else if (tensor.shape[2] === 4) {
        // RGBA
        img_data.data = pixels;
    }


    ctxL.putImageData(img_data, 0, 0);
    // scale 28 * 28 image to fit canvas
    const scaleH = canvasL.height / img.shape[0];
    const scaleW = canvasL.width / img.shape[1];
    ctxL.scale(scaleH, scaleW);
    ctxL.drawImage(ctxL.canvas, 0, 0);
    ctxL.scale(1.0 / scaleH, 1.0 / scaleW);
}

function drawR(){
    ctxR.fillStyle = 'rgb(255, 255, 255)';
    ctxR.fillRect(0, 0, canvasR.width, canvasR.height);
    
    for(let i=0; i<pnts.length; i++){
        let x = canvasR.width * (pnts[i]._x + 5) / 10;
        let y = canvasR.width * (pnts[i]._y + 5) / 10;
        if(i==0){
            ctxR.beginPath();
            ctxR.moveTo(x, y);
        }else{
            ctxR.lineTo(x, y);
        }
        let r = 4;
        ctxR.fillStyle = 'rgb(0, 0, 0)';
        ctxR.fillRect(x - 0.5 * r, y - 0.5 * r, r, r);

        if(i==pnts.length-1){
            ctxR.stroke();
        }
    }
}

function explore(){
    if(!is_exploring){
        is_exploring = true;
        canvasR.removeEventListener('mousemove', onMouseMove);
        if(pnts.length > 0){
            if(prev_pnt == 0){
                px = pnts[0]._x;
                py = pnts[0]._y;
            }
        }
        update();
    }else{
        is_exploring = false;
        canvasR.addEventListener('mousemove', onMouseMove);
    }
}

function clear(){
    pnts.length = 0;
    is_exploring = false;
    canvasR.addEventListener('mousemove', onMouseMove);
    ctxR.fillStyle = 'rgb(255, 255, 255)';
    ctxR.fillRect(0, 0, canvasR.width, canvasR.height);
}

//animation loop
//update contains the loop that repeats 2 ~ 4
function update() {
    if(is_exploring) requestAnimationFrame(update);
    //interpolate pnts from strt to end
    if(pnts.length > 1){

        let tx = pnts[prev_pnt + 1]._x;
        let ty = pnts[prev_pnt + 1]._y;

        px += (tx - px) * 0.05;
        py += (ty - py) * 0.05;

        if(Math.abs(
            Math.sqrt(
                (tx - px) * (tx - px) +
                (ty - py) * (ty - py)
            ) < 0.01
        )){
            if(prev_pnt < pnts.length - 2){
                prev_pnt++;
            }else{
                prev_pnt = 0;
                px = pnts[0]._x;
                py = pnts[0]._y;
            }
        }

        drawL(px, py);
        drawR();

        let x = canvasR.width * (px + 5) / 10;
        let y = canvasR.width * (py + 5) / 10;
        let r = 8;
        ctxR.fillStyle = 'rgb(0, 0, 255)';
        ctxR.fillRect(x - 0.5 * r, y - 0.5 * r, r, r);
    }
}

function onMouseMove(e){
    const el_box = canvasR.getBoundingClientRect();
	const x = -5 + 10 * (e.clientX - el_box.left) / canvasR.width;
	const y = -5 + 10 * (e.clientY - el_box.top) / canvasR.height;
    //console.log(x,y);
	drawL(x, y);
}

function onClick(e){
    const el_box = canvasR.getBoundingClientRect();
    const x = -5 + 10 * (e.clientX - el_box.left) / canvasR.width;
    const y = -5 + 10 * (e.clientY - el_box.top) / canvasR.height;
    pnts.push({
        _x : x,
        _y : y
    });
    console.log(pnts);
    drawR();
}

function onResize(){
    if(window.innerWidth > window.innerHeight){
        canvasL.classList.add("canvasL");
        canvasR.classList.add("canvasR");
    }else{
        canvasL.classList.add("canvasT");
        canvasR.classList.add("canvasB");
    }
}

//initiation
async function init() {
    await loadModel();
    let margin = 10;
    canvasL = document.createElement('canvas');
    canvasL.id = "image_viewer";
    canvasL.width = (window.innerWidth > window.innerHeight)? 
    Math.min(window.innerHeight * 0.6 - margin, window.innerWidth * 0.4 - margin) : 
    Math.min(window.innerWidth * 0.6 - margin, window.innerHeight * 0.4 - margin);
    canvasL.height = canvasL.width;
    document.getElementById('canvas_container').appendChild(canvasL);
    ctxL = canvasL.getContext('2d');
    ctxL.fillStyle = 'rgb(255, 255, 255)';
    ctxL.fillRect(0, 0, canvasL.width, canvasL.height);

    canvasR = document.createElement('canvas');
    canvasR.id = "image_viewer";
    canvasR.width = canvasL.width;
    canvasR.height = canvasL.width;
    document.getElementById('canvas_container').appendChild(canvasR);
    ctxR = canvasR.getContext('2d');
    ctxR.fillStyle = 'rgb(255, 255, 255)';
    ctxR.fillRect(0, 0, canvasR.width, canvasR.height);

    canvasL.classList.add('border');
    canvasR.classList.add('border');
    
    onResize();
    document.getElementById('explore').addEventListener('click', explore);
    document.getElementById('clear').addEventListener('click', clear);
    canvasR.addEventListener('mousemove', onMouseMove);
    canvasR.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    //update();
}

// INIT ----------------------------------------------------

init();