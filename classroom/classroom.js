  // Vertex shader program
  var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Normal;\n' +        // Normal

    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform mat4 u_vMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'uniform vec4 u_CubeColor;\n' + //This will be the color that we pass in.
    'uniform vec3 u_LightLocations[4];\n' +
    'uniform vec3 u_Light[4];\n' +
    'uniform vec3 u_AmbientLight;\n' +

    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    ' vec3 diffuse;\n'+
    ' gl_Position = u_ProjMatrix * u_vMatrix * u_ModelMatrix * a_Position;\n' +
    ' vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
    ' vec3 vertexPosition = normalize(vec3(u_NormalMatrix * u_ModelMatrix * a_Position));\n' +
          // Calculate the color due to diffuse reflection
    ' for (int i = 0; i <3; i++){\n' +
    '   vec3 lightDirection = normalize(u_LightLocations[i] - vec3(vertexPosition));\n' +
    '   float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '   diffuse += u_Light[i] * u_CubeColor.rgb * nDotL;\n' +
    ' }\n'+
    ' vec3 ambient = u_AmbientLight * u_CubeColor.rgb;\n' +
    ' v_Color = vec4(diffuse + ambient, u_CubeColor.a);\n' +
    '}\n';

  // Fragment shader program
  var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

  var modelMatrix = new Matrix4(); // The model matrix
  var viewMatrix = new Matrix4();  // The view matrix
  var projMatrix = new Matrix4();  // The projection matrix
  var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

  var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
  var xAngle = 0.0;    // The rotation x angle (degrees)
  var yAngle = 0.0;    // The rotation y angle (degrees)

  var lightsOn = [true, true, true]; //array of light status
  var lights = [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]; //array of light colour.

  var hours = 0; //rotation angle for clock hours hand
  var minutes = 0; //rotation angle for clock hours hand

  var whiteboard1shift = 0; //current translation of left whiteboard.
  var whiteboard2shift = 0; //current translation of middle whiteboard.
  var whiteboard3shift = 0; //current translation of right whiteboard.

  var u_ModelMatrix; //location of model matrix
  var u_vMatrix; //location of view matrix
  var u_NormalMatrix; //others are obviously named matricess..
  var u_ProjMatrix;
  var u_CubeColor; //colour of the cube we are drawing.
  var u_Light;
  var u_LightLocations;
  var u_AmbientLight;
  var gl; //program.
  var n ; //number of indices.

  var CAMERA_POSITION_STEP = 0.05; // The increments of rotation angle (degrees)
  var CAMERA_ANGLE_STEP = 0.05
  var STEP = 0.5
  var xAngle = 0.0;   // The rotation x angle (degrees)
  var yAngle = 0.0;   // The rotation y angle (degrees)
  var xTarget = 0;    // position we're looking at
  var yTarget = 0;
  var zTarget = 5;
  var cameraXPosition = 0.0; //position we're viewing from
  var cameraYPosition = 0.0;
  var cameraZPosition = -5;
  var blindsUp = false; //current status of the blinds (up or down)
  var blindsTranslate = 0;  //amount to translate blinds by
  var laptopAngle = 0; //angle of laptop lid and screen
  var doorAngle = 0; //angle of door.

  function main(){
    //if we have initialised the shaders and other necessary components
    if (init()){
        //call the draw function every 50ms
        setInterval(draw, 50);
    }
  }

  function init() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('classroom_canvas');
    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
    // Set clear color and enable hidden surface removal
    gl.clearColor(135/255, 206/255, 250/255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Get the storage locations of uniform attributes
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_vMatrix = gl.getUniformLocation(gl.program, 'u_vMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    u_CubeColor = gl.getUniformLocation(gl.program, 'u_CubeColor');
    u_Light = gl.getUniformLocation(gl.program, 'u_Light')
    u_LightLocations = gl.getUniformLocation(gl.program, 'u_LightLocations')
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight')
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (!u_ModelMatrix || !u_vMatrix || !u_NormalMatrix ||
        !u_ProjMatrix || !u_CubeColor) {
      console.log('Failed to Get the storage locations of u_ModelMatrix, u_vMatrix, and/or u_ProjMatrix');
      return;
    }
    gl.uniform3fv(u_Light, lights);
    //Back light.
    gl.uniform3fv(u_LightLocations, [0,0,-10,-5,0,10,5,0,10]);
    gl.uniform3f(u_AmbientLight, 0,0,0)
    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(0, 0, -5, 0, 0, 100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_vMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    return true;
  }

  function keydown(ev) {
    switch (ev.keyCode) {
      case 87: // w  key is clicked move forwards
        cameraXPosition += CAMERA_POSITION_STEP*(xTarget-cameraXPosition);
        cameraYPosition += CAMERA_POSITION_STEP*(yTarget-cameraYPosition);
        cameraZPosition += CAMERA_POSITION_STEP*(zTarget-cameraZPosition);
        break;
      case 83: //s key is clicked move backwards
        cameraXPosition -= CAMERA_POSITION_STEP*(xTarget-cameraXPosition);
        cameraYPosition -= CAMERA_POSITION_STEP*(yTarget-cameraYPosition);
        cameraZPosition -= CAMERA_POSITION_STEP*(zTarget-cameraZPosition);
        break;
      case 68: // d key is clicked move right
        var angle = Math.acos((cameraXPosition - xTarget)/(Math.sqrt(Math.pow((xTarget-cameraXPosition), 2) + Math.pow((zTarget-cameraZPosition), 2))));
        xTarget -= STEP*Math.sin(angle);
        cameraXPosition -= STEP*Math.sin(angle);
        zTarget -= STEP*Math.cos(angle);
        cameraZPosition -= STEP*Math.cos(angle);
        break;
      case 65: // a key is clicked move left
        var angle = Math.acos((cameraXPosition - xTarget)/(Math.sqrt(Math.pow((xTarget-cameraXPosition), 2) + Math.pow((zTarget-cameraZPosition), 2))));
        xTarget += STEP*Math.sin(angle);
        cameraXPosition += STEP*Math.sin(angle);
        zTarget += STEP*Math.cos(angle);
        cameraZPosition += STEP*Math.cos(angle);
        break;
      case 81: // q key is clicked move vertically upwards
        var angle = Math.acos((cameraYPosition - yTarget)/(Math.sqrt(Math.pow((yTarget-cameraYPosition), 2) + Math.pow((zTarget-cameraZPosition), 2))));
        yTarget += STEP*Math.sin(angle);
        cameraYPosition += STEP*Math.sin(angle);
        zTarget -= STEP*Math.cos(angle);
        cameraZPosition -= STEP*Math.cos(angle);
        break;
      case 69: // e is clicked move vertically downwards
        var angle = Math.acos((cameraYPosition - yTarget)/(Math.sqrt(Math.pow((yTarget-cameraYPosition), 2) + Math.pow((zTarget-cameraZPosition), 2))));
        yTarget -= STEP*Math.sin(angle);
        cameraYPosition -= STEP*Math.sin(angle);
        zTarget += STEP*Math.cos(angle);
        cameraZPosition += STEP*Math.cos(angle);
        break;
      case 38: // up arrow key is clicked key look upwards
        yTarget = zTarget * Math.sin(CAMERA_ANGLE_STEP%(2*Math.PI)) + yTarget*Math.cos(CAMERA_ANGLE_STEP%(2*Math.PI))
        zTarget = zTarget * Math.cos(CAMERA_ANGLE_STEP%(2*Math.PI)) - yTarget*Math.sin(CAMERA_ANGLE_STEP%(2*Math.PI))
        break;
      case 40: // down arrow key is clicked look downwards
        yTarget = zTarget * Math.sin(-CAMERA_ANGLE_STEP%(2*Math.PI)) + yTarget*Math.cos(-CAMERA_ANGLE_STEP%(2*Math.PI))
        zTarget = zTarget * Math.cos(-CAMERA_ANGLE_STEP%(2*Math.PI)) - yTarget*Math.sin(-CAMERA_ANGLE_STEP%(2*Math.PI))
        break;
      case 37: // left arrow key is clicked look left
        xTarget = zTarget * Math.sin(CAMERA_ANGLE_STEP%(2*Math.PI)) + xTarget*Math.cos(CAMERA_ANGLE_STEP%(2*Math.PI))
        zTarget = zTarget * Math.cos(CAMERA_ANGLE_STEP%(2*Math.PI)) - xTarget*Math.sin(CAMERA_ANGLE_STEP%(2*Math.PI))
        break;
      case 39: // right arrow key is clicked look right
        xTarget = zTarget * Math.sin(-CAMERA_ANGLE_STEP%(2*Math.PI)) + xTarget*Math.cos(-CAMERA_ANGLE_STEP%(2*Math.PI))
        zTarget = zTarget * Math.cos(-CAMERA_ANGLE_STEP%(2*Math.PI)) - xTarget*Math.sin(-CAMERA_ANGLE_STEP%(2*Math.PI))
        break;
      case 49: // 1 key is clicked if light1 is off turn it on, if it is on turn it off.
        lightsOn[0] = !lightsOn[0];
        for (var i = 0; i < lights.length; i++) {
          if (lightsOn[0] === true){
            lights[0] = 0.6
            lights[1] = 0.6
            lights[2] = 0.6
          }
          else{
            lights[0] = 0.1
            lights[1] = 0.1
            lights[2] = 0.1
          }
        }
        break;
      case 50: // 2 key is clicked if light2 is off turn it on, if it is on turn it off.
        lightsOn[1] = !lightsOn[1];
        for (var i = 0; i < lights.length; i++) {
          if (lightsOn[1] === true){
            lights[3] = 0.6
            lights[4] = 0.6
            lights[5] = 0.6
          }
          else{
            lights[3] = 0.1
            lights[4] = 0.1
            lights[5] = 0.1
          }
        }
        break;
      case 51: // 3 key is clicked if light3 is off turn it on, if it is on turn it off.
        lightsOn[2] = !lightsOn[2];
        for (var i = 0; i < lights.length; i++) {
          if (lightsOn[2] === true){
            lights[6] = 0.6
            lights[7] = 0.6
            lights[8] = 0.6
          }
          else{
            lights[6] = 0.1
            lights[7] = 0.1
            lights[8] = 0.1
          }
        }
        break;
        case 56: // 8 key is clicked move central whiteboard up.
          whiteboard1shift += 0.02;
          break;
        case 85: // u key is clicked move central whiteboard down.
          whiteboard1shift -= 0.02;
          break;
        case 55: // 7 key is clicked move left whiteboard up.
          whiteboard2shift += 0.02;
          break;
        case 89: // y key is clicked move left whiteboard down.
          whiteboard2shift -= 0.02;
          break;
        case 57: // 9 key is clicked move right whiteboard up.
          whiteboard3shift += 0.02;
          break;
        case 73: // o key is clicked move right whiteboard down.
          whiteboard3shift -= 0.02;
          break;
        case 66: // b key is clicked if blinds are down move them up if they're up move them down.
          blindsUp = !blindsUp;
          break;
        case 76: // l key is clicked close laptop lid a little.
          laptopAngle -= 3;
          if (laptopAngle<-90){
            laptopAngle = -90;
          }
          break;
        case 77: // m key is clicked open laptop lid a little.
          laptopAngle += 3;
          if (laptopAngle>30){
            laptopAngle = 30;
          }
          break;
        case 79: // O key is clicked open the door a little.
          doorAngle += 3;
          if (doorAngle>120){
            doorAngle = 120;
          }
          break;
        case 67:// C key is clicked close the door a little.
          doorAngle -= 3;
          if (doorAngle<0){
            doorAngle = 0;
          }
          break;

      default: return; // Skip drawing at no effective action
    }
    // Set the lights.
    gl.uniform3fv(u_Light, lights);
    //Set where to look at.
    viewMatrix.setLookAt(cameraXPosition, cameraYPosition, cameraZPosition, xTarget, yTarget, zTarget, 0, 1, 0);
    gl.uniformMatrix4fv(u_vMatrix, false, viewMatrix.elements);
  }

  function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Coordinates
       0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
       0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
       0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
      -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
      -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
       0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
    ]);

    var normals = new Float32Array([    // Normal
      0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
     -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
      0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
      0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
       0, 1, 2,   0, 2, 3,    // front
       4, 5, 6,   4, 6, 7,    // right
       8, 9,10,   8,10,11,    // up
      12,13,14,  12,14,15,    // left
      16,17,18,  16,18,19,    // down
      20,21,22,  20,22,23     // back
   ]);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Bind buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
  }

  function initArrayBuffer (gl, attribute, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
  }

  var g_matrixStack = []; // Array for storing a matrix
  function pushMatrix(m) { // Store the specified matrix to the array
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
  }

  function popMatrix() { // Retrieve the matrix from the array
    return g_matrixStack.pop();
  }

  function draw() {
    // If a  key is clicked pass the event of the key being clicked to the keydown function.
    document.onkeydown = function(ev){
      keydown(ev);
    };

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the vertex coordinates and color (for the x, y axes)

    // Calculate the view matrix and the projection matrix
    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Set the vertex coordinates and color (for the cube)
    n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    //Draw the walls floor and step from lecturer part to student tables.
    drawwallsfloorstep();
    //Draw tables.
    drawtables();
    //Draw stools and laptops, close/open laptops if necessary.
    drawstoolslaptops();
    //Draw lecturer podium.
    drawpodium();
    //Draw the whiteboards - account for any movements they do.
    drawwhiteboards();
    //Draw the clock - make sure it is constantly rotating.
    drawclock();
    //Draw the blinds - move them down if necessary.
    drawblinds();
    //Draw the projector.
    drawprojector();
    //Draw the door opening/closing it if necessary.
    //Draw the windows last and make them transparent.
    drawwindowsanddoor();


  }

  function drawprojector(){
    //Draws 3 cuboids to make up a projector.
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 1, -4.8);
      var colorVector = new Vector4([ 105/255,105/255,105/255, 1]);
      modelMatrix.scale(0.4, 0.02, 0.4);
      drawcube(colorVector);

    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 1.0225, -4.8);
      var colorVector = new Vector4([ 1, 1, 1, 1]);
      modelMatrix.scale(0.3, 0.06, 0.3);
      drawcube(colorVector);

    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 1.025, -4.79);
      var colorVector = new Vector4([ 0, 0, 0, 1]);
      modelMatrix.scale(0.3/5, 0.03, 0.3);
      drawcube(colorVector);

    modelMatrix = popMatrix();
  }

  function drawblinds(){
    // If the user clicked b to shut the blinds shut them.
    if (blindsUp){
      blindsTranslate -= 0.01;
    }
    else{
      // If the user clicked b to open the blinds, open them.
      blindsTranslate += 0.01;
    }
    //Make sure they aren't shut/opened too far.
    if (blindsTranslate<0){
      blindsTranslate = 0
    }
    else if (blindsTranslate >0.9){
      blindsTranslate = 0.9;
    }

    //Draw the blinds as cubes (4 of them.)

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.09, 1, 1.5);
      modelMatrix.translate(50*0.1/0.09, -0.25, 1.5); // ranges  from -0.25 to 0.65
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      modelMatrix.translate(0, blindsTranslate, 0);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    pushMatrix(modelMatrix);
      modelMatrix.scale(0.09, 1, 1.5);
      modelMatrix.translate(50*0.1/0.09, -0.25, -1.5);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      modelMatrix.translate(0, blindsTranslate, 0);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    pushMatrix(modelMatrix);
      modelMatrix.scale(0.09, 1, 1.5);
      modelMatrix.translate(-50*0.1/0.09, -0.25, 1.5);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      modelMatrix.translate(0, blindsTranslate, 0);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    pushMatrix(modelMatrix);
      modelMatrix.scale(0.09, 1, 1.5);
      modelMatrix.translate(-50*0.1/0.09, -0.25, -1.5);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      modelMatrix.translate(0, blindsTranslate, 0);
      drawcube(colorVector);
    modelMatrix = popMatrix();
  }

  function drawwallsfloorstep(){
    pushMatrix(modelMatrix);
      modelMatrix.scale(10, 0.05, 10);
      modelMatrix.translate(0, -40, 0);
      var colorVector = new Vector4([ 211/255, 211/255, 211/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(10, 0.2, 7.5);
      modelMatrix.translate(0, -9.4, -0.166);
      var colorVector = new Vector4([ 105/255,105/255,105/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Dark purple wall front of class
    pushMatrix(modelMatrix);
      modelMatrix.scale(10, 4, 0.1);
      modelMatrix.translate(0, -0.0065, 50);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    //Dark purple wall back of class
    pushMatrix(modelMatrix);
      modelMatrix.scale(10, 4, 0.1);
      modelMatrix.translate(0, -0.0065, -50);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Dark purple doorside of class
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.725, 10);
      modelMatrix.translate(-50, 0.645, 0);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.275, 3);
      modelMatrix.translate(-50, -0.3768, 0);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.275, 2);
      modelMatrix.translate(-50, -0.3768, -2);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.25, 1.5);
      modelMatrix.translate(-50, -1.1, -1.5);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.25, 1.5);
      modelMatrix.translate(-50, -1.1, 1.5);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 0.75, 2);
      modelMatrix.translate(-50, -0.145, 2);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.6, 0.25);
      modelMatrix.translate(-50, -0.75, 12.5);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.6, 0.75);
      modelMatrix.translate(-50, -0.75, 6.165);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    //Dark purple side of class
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.725, 10);
      modelMatrix.translate(50, 0.645, 0);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.275, 3);
      modelMatrix.translate(50, -0.3768, 0);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.275, 2);
      modelMatrix.translate(50, -0.3768, -2);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.25, 1.5);
      modelMatrix.translate(50, -1.1, -1.5);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1.25, 1.5);
      modelMatrix.translate(50, -1.1, 1.5);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.275, 2);
      modelMatrix.translate(50, -0.3768, 2);
      var colorVector = new Vector4([ 75/255, 0, 130/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Draw ceiling
    pushMatrix(modelMatrix);
      modelMatrix.scale(10, 0.05, 10);
      modelMatrix.translate(0, 40, 0);
      var colorVector = new Vector4([ 211/255, 211/255, 211/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Draw light
    pushMatrix(modelMatrix);
      modelMatrix.scale(3, 0.075, 0.1);
      modelMatrix.translate(0, 26, 49.5);
      var colorVector = new Vector4([255/255,255/255,240/255, 0.8]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Draw light
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 0.075, 3);
      modelMatrix.translate(-49.5, 26, 0);
      var colorVector = new Vector4([255/255,255/255,240/255, 0.8]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
    modelMatrix.scale(0.1, 0.075, 3);
    modelMatrix.translate(49.5, 26, 0);
      var colorVector = new Vector4([255/255,255/255,240/255, 0.8]);
      drawcube(colorVector);
    modelMatrix = popMatrix();
  }

  function drawwindowsanddoor(){
    //Makes door frame
    pushMatrix(modelMatrix);
      modelMatrix.translate(-50/10, -0.82*1.5, 3.75);
      modelMatrix.translate(0, 0, -1/2);
      modelMatrix.rotate(doorAngle, 0, 1, 0);
      modelMatrix.translate(0, 0, 1/2);
      var colorVector = new Vector4([ 1, 1, 1, 1]);
      modelMatrix.scale(0.1, 1.5, 1);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(50/1.5, 4.5, 1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(50/1.5, -0.25, 60);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(50/1.5, -0.25, 30);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(50/1.5, -15, 1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(-50/1.5, 4.5, 1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(-50/1.5, -0.25, 60);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(-50/1.5, -0.25, 30);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(-50/1.5, -15, 1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();




    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(50/1.5, 4.5, -1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(50/1.5, -0.25, -60);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(50/1.5, -0.25, -30);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(50/1.5, -15, -1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();




    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(-50/1.5, 4.5, -1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(-50/1.5, -0.25, -60);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1.05, 1/20);
      modelMatrix.translate(-50/1.5, -0.25, -30);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window bar.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 1/20, 1.5);
      modelMatrix.translate(-50/1.5, -15, -1.5);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();


    //Windows are drawn last and made transparent.

    //Make window (the one near the board)
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1, 1.5);
      modelMatrix.translate(50, -0.25, 1.5);
      var colorVector = new Vector4([ 0, 0, 0, 0.1]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make window (the one far from the board)
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1, 1.5);
      modelMatrix.translate(50, -0.25, -1.5);
      var colorVector = new Vector4([ 0, 0, 0, 0.1]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make doorside window (the one near the board)
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1, 1.5);
      modelMatrix.translate(-50, -0.25, 1.5);
      var colorVector = new Vector4([ 0, 0, 0, 0.1]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Make doorside window (the one far from the board)
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 1, 1.5);
      modelMatrix.translate(-50, -0.25, -1.5);
      var colorVector = new Vector4([ 0,0,0,0.25]);
      drawcube(colorVector);
    modelMatrix = popMatrix();
  }

  function drawclock(){
    //Clock is drawn in various parts, the clock hands are continuously rotated (as if time is passing).
    hours += 0.2;
    minutes += 0.75;
    //Makes clock background
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.025, 0.4, 0.4);
      modelMatrix.translate(198.25, 2, 0);
      var colorVector = new Vector4([ 0, 0, 0, 1]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Makes clock background
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.025, 0.3, 0.3);
      modelMatrix.translate(198.15, 2*(0.4/0.3), 0);
      var colorVector = new Vector4([ 1, 1, 1, 1]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    //Makes clock hours hand - hand is rotated.
    pushMatrix(modelMatrix);
      modelMatrix.translate(4.94, 0.75, 0);
      var colorVector = new Vector4([ 1, 0, 0, 1]);
      modelMatrix.translate(0, 0.05, 0);
      modelMatrix.rotate(hours, 1, 0, 0);
      modelMatrix.translate(0, -0.05, 0);
      modelMatrix.scale(0.01, 0.1, 0.01);

      drawcube(colorVector);

    modelMatrix = popMatrix();


    //Makes clock minutes hand - hand is rotated.
    pushMatrix(modelMatrix);
      modelMatrix.translate(4.94, 0.73, 0);
      var colorVector = new Vector4([ 0, 0, 1, 1]);
      modelMatrix.translate(0, 0.065, 0);
      modelMatrix.rotate(minutes, 1, 0, 0);
      modelMatrix.translate(0, -0.065, 0);
      modelMatrix.scale(0.01, 0.13, 0.01);

      drawcube(colorVector);

    modelMatrix = popMatrix();


  }

  function drawtables(){
    for (i = 0; i < 4; i++){
      pushMatrix(modelMatrix);
        modelMatrix.scale(7.5, 0.15, 1);
        modelMatrix.translate(0, 0, -3.8);
        modelMatrix.translate(0.085, -6, 1.9*i);
        var colorVector = new Vector4([139/250, 137/250, 137/250, 1.0]);
        drawcube(colorVector);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, 1, 0.8);
        modelMatrix.translate(0, 0, -4.7);
        modelMatrix.translate(-29, -1.4, 2.35*i);
        var colorVector = new Vector4([205/250, 201/250, 201/250, 1.0]);
        drawcube(colorVector);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, 1, 0.8);
        modelMatrix.translate(0, 0, -4.7);
        modelMatrix.translate(42, -1.4, 2.35*i);
        var colorVector = new Vector4([205/250, 201/250, 201/250, 1.0]);
        drawcube(colorVector);
      modelMatrix = popMatrix();
    }
  }

  function drawstoolslaptops(){
    //Iterates to draw all stools and laptops in the classroom
    for (i = 0; i < 4; i++){
      for (j = 0; j < 8; j++){
        //Draws each seat, with equal distance between each one.
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.6, 0.1, 0.5);
          modelMatrix.translate(-4, -11.5, -9.2);
          modelMatrix.translate(1.4*j, 0, 4*i);
          var colorVector = new Vector4([ 169/255,169/255,169/255, 1.0]);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each left back leg, with equal distance between each one.
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.07, 0.75, 0.07);
          modelMatrix.translate(-38, -2, -68);
          modelMatrix.translate(12*j, 0, 28.5*i);
          var colorVector = new Vector4([211/255, 211/255, 211/255, 1.0]);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each right front leg, with equal distance between each one.
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.07, 0.75, 0.07);
          modelMatrix.translate(-31, -2, -68);
          modelMatrix.translate(12*j, 0, 28.5*i);
          var colorVector = new Vector4([211/255, 211/255, 211/255, 1.0]);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each left front leg, with equal distance between each one.
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.07, 0.75, 0.07);
          modelMatrix.translate(-38, -2, -63);
          modelMatrix.translate(12*j, 0, 28.5*i);
          var colorVector = new Vector4([211/255, 211/255, 211/255, 1.0]);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each right back leg, with equal distance between each one.
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.07, 0.75, 0.07);
          modelMatrix.translate(-31, -2, -63);
          modelMatrix.translate(12*j, 0, 28.5*i);
          var colorVector = new Vector4([211/255, 211/255, 211/255, 1.0]);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each laptop lid, with equal distance between each one, allows for lid to shut.
        pushMatrix(modelMatrix);
          var colorVector = new Vector4([220/255, 220/255, 220/255, 1.0]);
          modelMatrix.translate(-6*4/10, -3.63/5, -770*0.005);
          modelMatrix.translate(2.12*j*4/10, 0, 380*i*0.005);
          modelMatrix.translate(0, -0.1, 0);
          modelMatrix.rotate(laptopAngle, 1,0,0)
          modelMatrix.translate(0, 0.1, 0);
          modelMatrix.scale(0.4, 0.2, 0.005);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each laptop screen, with equal distance between each one, allows for lid to shut.
        pushMatrix(modelMatrix);
        modelMatrix.translate(-6*4/10, -3.63/5, -771*0.005);
        modelMatrix.translate(2.12*j*4/10, 0, 380*i*0.005);
          var colorVector = new Vector4([0, 0, 0, 1.0]);
          modelMatrix.translate(0, -0.1, 0);
          modelMatrix.rotate(laptopAngle, 1,0,0)
          modelMatrix.translate(0, 0.1, 0);
          modelMatrix.scale(0.4, 0.2, 0.005);
          drawcube(colorVector);
        modelMatrix = popMatrix();

        //Draws each laptop keyboard, with equal distance between each one.
        pushMatrix(modelMatrix);
          modelMatrix.scale(0.4, 0.005, 0.2);
          modelMatrix.translate(-6, -165, -19.75);
          modelMatrix.translate(2.12*j, 0, 9.5*i);
          var colorVector = new Vector4([220/255, 220/255, 220/255, 1.0]);
          drawcube(colorVector);
        modelMatrix = popMatrix();
      }
    }
  }

  function drawpodium(){
    //Draws the seat
    pushMatrix(modelMatrix);
      modelMatrix.scale(2, 0.1, 1);
      modelMatrix.translate(0, -12, 3.5);
      var colorVector = new Vector4([ 139/250, 137/250, 137/250, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(1.8, 0.8, 0.9);
      modelMatrix.translate(0, -2, 3.9);
      var colorVector = new Vector4([126/255, 49/255, 123/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix); //Back of teachers computer screen
      modelMatrix.scale(0.7, 0.4, 0.005);
      modelMatrix.translate(-0.9, -2.275, 740);
      var colorVector = new Vector4([192/255,192/255,192/255, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix); //Front of teachers computer screen
      modelMatrix.scale(0.7, 0.4, 0.005);
      modelMatrix.translate(-0.9, -2.275, 741);
      var colorVector = new Vector4([0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.03, 0.1, 0.011);
      modelMatrix.translate(-21, -11, 336);
      var colorVector = new Vector4([0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 0.02, 0.011);
      modelMatrix.translate(-6.25, -57.1, 336);
      var colorVector = new Vector4([0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();
  }

  function drawwhiteboards(gl, u_ModelMatrix, u_NormalMatrix, u_CubeColor, n){
    // Draw central whiteboard and allow it to be shifted up and down.
    pushMatrix(modelMatrix);
      modelMatrix.scale(2, 1.5, 0.1);
      modelMatrix.translate(0, 0, 49.5);
      if (0<= whiteboard1shift && whiteboard1shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard1shift, 0);
      }
      else if (whiteboard1shift >28* 0.02){
        whiteboard1shift = 0.02*28;
        modelMatrix.translate(0, whiteboard1shift, 0);
      }
      else if (whiteboard1shift < 0) {
        whiteboard1shift =0;
      }
      var colorVector = new Vector4([ 1, 1, 1, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw central whiteboard bar and allow it to be shifted up and down.
    pushMatrix(modelMatrix);
      modelMatrix.scale(1.9, 0.05, 0.2);
      modelMatrix.translate(0, -15, 24.73);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      if (0<= whiteboard1shift && whiteboard1shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard1shift*1.5/0.05, 0);
      }
      else if (whiteboard1shift >28* 0.02){
        whiteboard1shift = 0.02*28;
        modelMatrix.translate(0, whiteboard1shift*1.5/0.05, 0);
      }
      else if (whiteboard1shift < 0) {
        whiteboard1shift =0;
      }
      drawcube(colorVector);

    // Draw whiteboard rubber and allow it to be shifted up and down.
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.15, 0.05, 0.2);
      modelMatrix.translate(4, -14, 24.73);
      if (0<= whiteboard1shift && whiteboard1shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard1shift*1.5/0.05, 0);
      }
      else if (whiteboard1shift >28* 0.02){
        whiteboard1shift = 0.02*28;
        modelMatrix.translate(0, whiteboard1shift*1.5/0.05, 0);
      }
      else if (whiteboard1shift < 0) {
        whiteboard1shift =0;
      }
      var colorVector = new Vector4([ 0,0,0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();




    // Draw left whiteboard and allow it to be shifted up and down.
    pushMatrix(modelMatrix);
      modelMatrix.scale(2, 1.5, 0.1);
      modelMatrix.translate(1, 0, 49.5);
      var colorVector = new Vector4([ 1, 1, 1, 1.0]);
      if (0<= whiteboard2shift && whiteboard2shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard2shift, 0);
      }
      else if (whiteboard2shift >28* 0.02){
        whiteboard2shift = 0.02*28;
        modelMatrix.translate(0, whiteboard2shift, 0);
      }
      else if (whiteboard2shift < 0) {
        whiteboard2shift =0;
      }
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw central whiteboard bar and allow it to be shifted up and down.
    pushMatrix(modelMatrix);
      modelMatrix.scale(1.9, 0.05, 0.2);
      modelMatrix.translate(1.05, -15, 24.73);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      if (0<= whiteboard2shift && whiteboard2shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard2shift*1.5/0.05, 0);
      }
      else if (whiteboard2shift >28* 0.02){
        whiteboard2shift = 0.02*28;
        modelMatrix.translate(0, whiteboard2shift*1.5/0.05, 0);
      }
      else if (whiteboard2shift < 0) {
        whiteboard2shift =0;
      }
      drawcube(colorVector);
    modelMatrix = popMatrix();



    // Draw right whiteboard and allow it to be shifted up and down.
    pushMatrix(modelMatrix);
      modelMatrix.scale(2, 1.5, 0.1);
      modelMatrix.translate(-1, 0, 49.5);
      var colorVector = new Vector4([ 1, 1, 1, 1.0]);
      if (0<= whiteboard3shift && whiteboard3shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard3shift, 0);
      }
      else if (whiteboard3shift >28* 0.02){
        whiteboard3shift = 0.02*28;
        modelMatrix.translate(0, whiteboard3shift, 0);
      }
      else if (whiteboard3shift < 0) {
        whiteboard3shift =0;
      }
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw right whiteboard and allow it to be shifted up and down.
    pushMatrix(modelMatrix);
      modelMatrix.scale(1.9, 0.05, 0.2);
      modelMatrix.translate(-1.05, -15, 24.73);
      var colorVector = new Vector4([ 192/255,192/255,192/255, 1.0]);
      if (0<= whiteboard3shift && whiteboard3shift <= 28* 0.02){
        modelMatrix.translate(0, whiteboard3shift*1.5/0.05, 0);
      }
      else if (whiteboard3shift >28* 0.02){
        whiteboard3shift = 0.02*28;
        modelMatrix.translate(0, whiteboard3shift*1.5/0.05, 0);
      }
      else if (whiteboard2shift < 0) {
        whiteboard3shift =0;
      }
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw left central whiteboard whiteboard support.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.75, 0.1);
      modelMatrix.translate(-10, 0.1, 49.25);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw right central whiteboard whiteboard support.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.75, 0.1);
      modelMatrix.translate(10, 0.1, 49.25);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw left whiteboard whiteboard support.
    pushMatrix(modelMatrix); //Left support
      modelMatrix.scale(0.1, 2.75, 0.1);
      modelMatrix.translate(-30, 0.1, 49.25);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

    // Draw right whiteboard whiteboard support.
    pushMatrix(modelMatrix);
      modelMatrix.scale(0.1, 2.75, 0.1);
      modelMatrix.translate(30, 0.1, 49.25);
      var colorVector = new Vector4([ 0, 0, 0, 1.0]);
      drawcube(colorVector);
    modelMatrix = popMatrix();

  }

  function drawcube(colorVector) {
    //This function is the only function that actually draws, the others draw via calling it.
    pushMatrix(modelMatrix);
      gl.uniform4fv(u_CubeColor, colorVector.elements);
      // Pass the model matrix to the uniform variable
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      // Calculate the normal transformation matrix and pass it to u_NormalMatrix
      g_normalMatrix.setInverseOf(modelMatrix);
      g_normalMatrix.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

      // Draw the cube
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    modelMatrix = popMatrix();
  }

main();
