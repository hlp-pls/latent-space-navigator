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
var pnts = []; // points for LINE
var vec_pnts = []; // points for VECTOR
var is_exploring = false;
var is_explore_init = false;
var prev_pnt = 0;
var px = 0, py = 0;
var MODE = "";
var nav_range = 1000;
// FUNCTIONS -----------------------------------------------

//load model
async function loadModel() {
    MODEL = await tf.loadLayersModel('./model/celeb-A/my-model.json');
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
    const img = await MODEL.predict(latent_sample);
    //console.log(img);
    // 4 //
    const img_data = new ImageData(img.shape[2], img.shape[1]);
    await img.data().then(function(data){
        //console.log(data);
        //const img_data = new ImageData(img.shape[1], img.shape[0]);
        data.forEach(function(d, idx){
            //console.log(d, idx);
            img_data.data[idx * 4 + 0] = d * 255;
            img_data.data[idx * 4 + 1] = d * 255;
            img_data.data[idx * 4 + 2] = d * 255;
            img_data.data[idx * 4 + 3] = 255;
        });
    });

    const tmp_canvas = document.createElement("canvas");
    const tmp_ctx = tmp_canvas.getContext('2d');
    tmp_canvas.width = 178;
    tmp_canvas.height = 218;
    tmp_canvas.style.display = "none";
    document.body.appendChild(tmp_canvas);
    
    // 178 * 218 image
    tmp_ctx.putImageData(img_data, 0, 0);

    const scaleWH = img.shape[2] / img.shape[1];
    ctxL.drawImage(tmp_ctx.canvas, 0, 0, 178, 218, 
        canvasL.width * 0.5 - canvasL.height * scaleWH * 0.5, 0, canvasL.height * scaleWH, canvasL.height);
    //ctxL.scale(1.0 / scaleH, 1.0 / scaleW);
    document.body.removeChild(tmp_canvas);
}

function drawR(){
    ctxR.fillStyle = 'rgb(255, 255, 255)';
    ctxR.fillRect(0, 0, canvasR.width, canvasR.height);
    
    if(MODE == "LINE"){
        ctxR.strokeStyle = 'rgb(0, 0, 0)';
        for(let i=0; i<pnts.length; i++){
            let x = canvasR.width * (pnts[i]._x + nav_range * 0.5) / nav_range;
            let y = canvasR.width * (pnts[i]._y + nav_range * 0.5) / nav_range;
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
    }else if(MODE == "VECTOR"){

        for(let i=0; i<vec_pnts.length; i+=2){
            let x = canvasR.width * (vec_pnts[i]._x + nav_range * 0.5) / nav_range;
            let y = canvasR.width * (vec_pnts[i]._y + nav_range * 0.5) / nav_range;

            let r = 4;
            if(i%2 == 0 && i < vec_pnts.length - 2){
                ctxR.fillStyle = 'rgb(0, 0, 0)';
                ctxR.strokeStyle = 'rgb(0, 0, 0)';
            }else{
                ctxR.fillStyle = 'rgb(0, 0, 255)';
                ctxR.strokeStyle = 'rgb(0, 0, 255)';
            }
            ctxR.fillRect(x - 0.5 * r, y - 0.5 * r, r, r);
            if(i + 1 < vec_pnts.length){
                let x2 = canvasR.width * (vec_pnts[i + 1]._x + nav_range * 0.5) / nav_range;
                let y2 = canvasR.width * (vec_pnts[i + 1]._y + nav_range * 0.5) / nav_range;
                
                ctxR.beginPath();
                ctxR.moveTo(x, y);
                ctxR.lineTo(x2, y2);

                let dir = { x : x2 - x, y : y2 - y, z : 0 };
                dir = normalize(dir);
                let up = { x : 0, y : 0, z : 1 };
                let perp = cross(dir, up);
                let arr_size = 10;
                let arr_x = x2 - dir.x * arr_size;
                let arr_y = y2 - dir.y * arr_size;

                ctxR.lineTo(arr_x + perp.x * arr_size, arr_y + perp.y * arr_size);
                ctxR.lineTo(x2, y2);
                ctxR.lineTo(arr_x - perp.x * arr_size, arr_y - perp.y * arr_size);
                ctxR.stroke();

                /*ctxR.fillRect(x2 - 0.5 * r, y2 - 0.5 * r, r, r);*/
            }
        }
    }
}

function normalize(vec3){
    const vec_length = Math.sqrt(vec3.x * vec3.x + vec3.y * vec3.y + vec3.z * vec3.z);
    return {
        x : vec3.x / vec_length,
        y : vec3.y / vec_length,
        z : vec3.z / vec_length
    };
}

function cross(vec3_a, vec3_b){
    //cx = aybz − azby
    //cy = azbx − axbz
    //cz = axby − aybx
    return {
        x : vec3_a.y * vec3_b.z - vec3_a.z * vec3_b.y,
        y : vec3_a.z * vec3_b.x - vec3_a.x * vec3_b.z,
        z : vec3_a.x * vec3_b.y - vec3_a.y * vec3_b.x
    };
}

function explore() {
    if (!is_exploring) {
        if (pnts.length > 1) {
            is_exploring = true;
            canvasR.removeEventListener('mousemove', onMouseMove);
            if (!is_explore_init) {
                if (pnts.length > 0) {
                    if (prev_pnt == 0) {
                        px = pnts[0]._x;
                        py = pnts[0]._y;
                    }
                }
                is_explore_init = true;
            }
            update();
        } else {
            alert("choose more than 1 point in the navigator!");
        }
    } else {
        is_exploring = false;
        canvasR.addEventListener('mousemove', onMouseMove);
    }
}

function seeVector(){
    if(vec_pnts.length > 0){
        if(vec_pnts.length % 2 == 0){
            let vx = vec_pnts[vec_pnts.length - 1]._x - vec_pnts[vec_pnts.length - 2]._x;
            let vy = vec_pnts[vec_pnts.length - 1]._y - vec_pnts[vec_pnts.length - 2]._y;
            drawL(vx, vy);
        }else{
            alert("Select second point for vector!");
        }
    }else{
        alert("Select points for vector!");
    }
}

function clear(){
    if(MODE == "LINE"){
        pnts.length = 0;
        prev_pnt = 0;
        is_exploring = false;
        is_explore_init = false;
        canvasR.addEventListener('mousemove', onMouseMove);
        ctxR.fillStyle = 'rgb(255, 255, 255)';
        ctxR.fillRect(0, 0, canvasR.width, canvasR.height);
    }else if(MODE == "VECTOR"){
        vec_pnts.length = 0;
        drawR();
    }
}

//animation loop
//update contains the loop that repeats 2 ~ 4
function update() {
    if (MODE == "LINE") {
        if (is_exploring) requestAnimationFrame(update);
        //interpolate pnts from strt to end
        if (pnts.length > 1) {

            let tx = pnts[prev_pnt + 1]._x;
            let ty = pnts[prev_pnt + 1]._y;

            px += (tx - px) * 0.1;
            py += (ty - py) * 0.1;

            if (Math.abs(
                    Math.sqrt(
                        (tx - px) * (tx - px) +
                        (ty - py) * (ty - py)
                    ) < 1
                )) {
                if (prev_pnt < pnts.length - 2) {
                    prev_pnt++;
                } else {
                    prev_pnt = 0;
                    px = pnts[0]._x;
                    py = pnts[0]._y;
                }
            }

            drawL(px, py);
            drawR();

            let x = canvasR.width * (px + nav_range * 0.5) / nav_range;
            let y = canvasR.width * (py + nav_range * 0.5) / nav_range;
            let r = 8;
            ctxR.fillStyle = 'rgb(0, 0, 255)';
            ctxR.fillRect(x - 0.5 * r, y - 0.5 * r, r, r);
        }
    }
}

function onMouseMove(e){
    const el_box = canvasR.getBoundingClientRect();
	const x = - nav_range * 0.5 + nav_range * (e.clientX - el_box.left) / canvasR.width;
	const y = - nav_range * 0.5 + nav_range * (e.clientY - el_box.top) / canvasR.height;
    //console.log(x,y);
	drawL(x, y);
}

async function onClick(e){
    const el_box = canvasR.getBoundingClientRect();
    const x = - nav_range * 0.5 + nav_range * (e.clientX - el_box.left) / canvasR.width;
    const y = - nav_range * 0.5 + nav_range * (e.clientY - el_box.top) / canvasR.height;

    if(MODE == "LINE"){
        pnts.push({
            _x : x,
            _y : y
        });
        console.log(pnts);
        drawR();
    }else if(MODE == "VECTOR"){
        vec_pnts.push({
            _x : x,
            _y : y
        });
        console.log(vec_pnts);
        drawR();
        await drawL(x, y);
        const img_url = canvasL.toDataURL();
        
        if((vec_pnts.length - 1) % 2 == 0){
            document.getElementById('from_img').src = img_url;
            document.getElementById('to_img').src = "";
        }else{
            document.getElementById('to_img').src = img_url;
        }
    }else if(MODE == ""){
        alert("Select a mode for more options!");
    }
}

function changeMode(){
    MODE = this.value;
    alert("mode changed to : " + MODE);
    if(MODE == "LINE"){
        if(!is_exploring) canvasR.addEventListener('mousemove', onMouseMove);
        document.getElementById('explore').style.display = "inline-block";
        document.getElementById('clear').style.display = "inline-block";
        document.getElementById('see_vector').style.display ="none";
        document.getElementById('img_container').style.display = "none";
    }else if(MODE == "VECTOR"){
        if(!is_exploring) canvasR.removeEventListener('mousemove', onMouseMove);
        document.getElementById('explore').style.display = "none";
        document.getElementById('clear').style.display = "inline-block";
        document.getElementById('see_vector').style.display = "inline-block";
        document.getElementById('img_container').style.display = "block";
    }

    update();
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
    canvasR = document.createElement('canvas');
    canvasR.id = "image_viewer";
    canvasR.width = (window.innerWidth > window.innerHeight)? 
    Math.min(window.innerHeight * 0.6 - margin, window.innerWidth * 0.4 - margin) : 
    Math.min(window.innerWidth * 0.6 - margin, window.innerHeight * 0.4 - margin);
    canvasR.height = canvasR.width;
    document.getElementById('canvas_container').appendChild(canvasR);
    ctxR = canvasR.getContext('2d');
    ctxR.fillStyle = 'rgb(255, 255, 255)';
    ctxR.fillRect(0, 0, canvasR.width, canvasR.height);

    canvasL = document.createElement('canvas');
    canvasL.id = "image_viewer";
    canvasL.width = canvasR.width * 178 / 218;
    canvasL.height = canvasR.width;
    document.getElementById('canvas_container').appendChild(canvasL);
    ctxL = canvasL.getContext('2d');
    ctxL.fillStyle = 'rgb(255, 255, 255)';
    ctxL.fillRect(0, 0, canvasL.width, canvasL.height);

    canvasL.classList.add('border');
    canvasR.classList.add('border');
    
    onResize();
    document.getElementById('mode_select').addEventListener("change", changeMode);
    document.getElementById('explore').addEventListener('click', explore);
    document.getElementById('see_vector').addEventListener('click', seeVector);
    document.getElementById('clear').addEventListener('click', clear);
    canvasR.addEventListener('mousemove', onMouseMove);
    canvasR.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    //update();
}

// INIT ----------------------------------------------------

init();