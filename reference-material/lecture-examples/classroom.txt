// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_DiffuseLight;\n' +   // Diffuse light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform vec3 u_AmbientLight;\n' +   // Color of an ambient light
  'varying vec4 v_Color;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isLighting)\n' +
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_DiffuseLight * a_Color.rgb * nDotL;\n' +
        // Calculate the color due to ambient reflection
  '     vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
  '     v_Color = vec4(diffuse + ambient, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' +
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

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
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
  gl.clearColor(0, 0.7, 0.93, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_DiffuseLight');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_AmbientLight || !u_LightDirection ||
      !u_isLighting || !u_DiffuseLight) {
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_DiffuseLight, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([6, 2, -3]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
  projMatrix.setPerspective(60, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix);
  };
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

var CAMERA_TRANSL_STEP = 0.02; // The increments of rotation angle (degrees)
var SHIFT_STEP = 0.5
var LOOK_ANGLE_STEP = 0.05
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var cameraY = 10;
var cameraX = 9;
var cameraZ = -15;
var lookY = -cameraY;
var lookX = -cameraX;
var lookZ = -cameraZ;

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix) {
  switch (ev.keyCode) {
    case 87: // w  key -> move camera towards target
      cameraX = cameraX + CAMERA_TRANSL_STEP*(lookX-cameraX);
      cameraY = cameraY + CAMERA_TRANSL_STEP*(lookY-cameraY);
      cameraZ = cameraZ + CAMERA_TRANSL_STEP*(lookZ-cameraZ);
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 83: // s key -> move camera away from target
      cameraX = cameraX - CAMERA_TRANSL_STEP*(lookX-cameraX);
      cameraY = cameraY - CAMERA_TRANSL_STEP*(lookY-cameraY);
      cameraZ = cameraZ - CAMERA_TRANSL_STEP*(lookZ-cameraZ);
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 68: // d key -> strafe right
      var numerator = cameraX - lookX
      var denominator = Math.sqrt(Math.pow((lookX-cameraX), 2) + Math.pow((lookZ-cameraZ), 2))
      var theta = Math.acos(numerator/denominator)
      var shiftZ = SHIFT_STEP*Math.cos(theta)
      var shiftX = SHIFT_STEP*Math.sin(theta)
      lookX = lookX - shiftX
      cameraX = cameraX - shiftX
      lookZ = lookZ - shiftZ
      cameraZ = cameraZ - shiftZ
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 65: // a key -> strafe left
      var numerator = cameraX - lookX
      var denominator = Math.sqrt(Math.pow((lookX-cameraX), 2) + Math.pow((lookZ-cameraZ), 2))
      var theta = Math.acos(numerator/denominator)
      var shiftZ = SHIFT_STEP*Math.cos(theta)
      var shiftX = SHIFT_STEP*Math.sin(theta)
      lookX = lookX + shiftX
      cameraX = cameraX + shiftX
      lookZ = lookZ + shiftZ
      cameraZ = cameraZ + shiftZ
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 81: // q key -> strafe up
      var numerator = cameraY - lookY
      var denominator = Math.sqrt(Math.pow((lookY-cameraY), 2) + Math.pow((lookZ-cameraZ), 2))
      var theta = Math.acos(numerator/denominator)
      var shiftZ = SHIFT_STEP*Math.cos(theta)
      var shiftY = SHIFT_STEP*Math.sin(theta)
      lookY = lookY + shiftY
      cameraY = cameraY + shiftY
      lookZ = lookZ - shiftZ
      cameraZ = cameraZ - shiftZ
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 69: // e -> strafe down
      var numerator = cameraY - lookY
      var denominator = Math.sqrt(Math.pow((lookY-cameraY), 2) + Math.pow((lookZ-cameraZ), 2))
      var theta = Math.acos(numerator/denominator)
      var shiftZ = SHIFT_STEP*Math.cos(theta)
      var shiftY = SHIFT_STEP*Math.sin(theta)
      lookY = lookY - shiftY
      cameraY = cameraY - shiftY
      lookZ = lookZ + shiftZ
      cameraZ = cameraZ + shiftZ
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 38: // up key -> pitch up
      lookY = lookZ * Math.sin(LOOK_ANGLE_STEP%(2*Math.PI)) + lookY*Math.cos(LOOK_ANGLE_STEP%(2*Math.PI))
      lookZ = lookZ * Math.cos(LOOK_ANGLE_STEP%(2*Math.PI)) - lookY*Math.sin(LOOK_ANGLE_STEP%(2*Math.PI))
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 40: // down key -> pitch down
      lookY = lookZ * Math.sin(-LOOK_ANGLE_STEP%(2*Math.PI)) + lookY*Math.cos(-LOOK_ANGLE_STEP%(2*Math.PI))
      lookZ = lookZ * Math.cos(-LOOK_ANGLE_STEP%(2*Math.PI)) - lookY*Math.sin(-LOOK_ANGLE_STEP%(2*Math.PI))
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 37: // left key -> yaw left
      lookX = lookZ * Math.sin(LOOK_ANGLE_STEP%(2*Math.PI)) + lookX*Math.cos(LOOK_ANGLE_STEP%(2*Math.PI))
      lookZ = lookZ * Math.cos(LOOK_ANGLE_STEP%(2*Math.PI)) - lookX*Math.sin(LOOK_ANGLE_STEP%(2*Math.PI))
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 39: // right key -> yaw right
      lookX = lookZ * Math.sin(-LOOK_ANGLE_STEP%(2*Math.PI)) + lookX*Math.cos(-LOOK_ANGLE_STEP%(2*Math.PI))
      lookZ = lookZ * Math.cos(-LOOK_ANGLE_STEP%(2*Math.PI)) - lookX*Math.sin(-LOOK_ANGLE_STEP%(2*Math.PI))
      viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookX, lookY, lookZ, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 70: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + SHIFT_STEP) % 360;
      break;
    // case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
    //   g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
    //   break;
    // case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
    //   g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
    //   break;
    // case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
    //   g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
    //   break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function initVertexBuffers(gl, r, g, b) {
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

  var colors = new Float32Array([    // Colors
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v5-v6-v1 up
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v1-v6-v7-v2 left
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v7-v4-v3-v2 down
    r, g, b,   r, g, b,   r, g, b,  r, g, b,　    // v4-v7-v6-v5 back
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
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

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

function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b)
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0,
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0,
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, true); // Will apply lighting


  //columns and rows of desks and chairs
  var Columns = 4
  var Rows = 4
  //drawing several desks
  for (i = 0; i < Columns; i++) {
    for (k = 0; k < Rows; k++) {
      // Rotate, and then translate
      modelMatrix.setTranslate(i*5-7.5, 0.3, k*7-10.5+1);  // Translation
      drawDesk(gl, u_ModelMatrix, u_NormalMatrix, n)
      }
    }
  //drawing several chairs
  for (i = 0; i < Columns; i++) {
    for (k = 0; k < Rows; k++) {
      // Rotate, and then translate
      modelMatrix.setTranslate(i*5-7.5, 0, k*7-10.5);  // Translation
      //modelMatrix.translate(0, 0, something) move chairs in and out
      drawChair(gl, u_ModelMatrix, u_NormalMatrix)
    }
  }
  //drawing teacher's desk
  modelMatrix.setTranslate(5, 0.3, 20)
  drawCattedra(gl, u_ModelMatrix, u_NormalMatrix)

  //drawing teacher's chair
  modelMatrix.setTranslate(5, 0, 22);
  modelMatrix.rotate(180, 0, 1, 0);
  drawChair(gl, u_ModelMatrix, u_NormalMatrix);

  //drawing whiteboard
  modelMatrix.setTranslate(-3, 4, 26)
  drawWhiteboard(gl, u_ModelMatrix, u_NormalMatrix, n)

  //drawing front wall
  modelMatrix.setTranslate(0, 4.5, 26.5)
  drawSimpleWall(gl, u_ModelMatrix, u_NormalMatrix, n)

  //drawing back wall
  modelMatrix.setTranslate(0, 4.5, -16)
  drawSimpleWall(gl, u_ModelMatrix, u_NormalMatrix, n)

}
function drawSimpleWall(gl, u_ModelMatrix, u_NormalMatrix, n){
  var n = initVertexBuffers(gl, 0.89, 0.87, 0.71); // off white
  // Model the wall
  pushMatrix(modelMatrix);
    modelMatrix.scale(30, 12, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}
function drawWhiteboard(gl, u_ModelMatrix, u_NormalMatrix, n){
  var n = initVertexBuffers(gl, 0.90, 0.90, 0.90); // off white
  // Model the whiteboard
  pushMatrix(modelMatrix);
    modelMatrix.scale(12, 5, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = initVertexBuffers(gl, 0.80, 0.51, 0.38); // light brown
  //model top border
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 2.55, 0)
    modelMatrix.scale(12.2, 0.1, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model bottom border
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, -2.55, 0)
    modelMatrix.scale(12.2, 0.1, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model left border
  pushMatrix(modelMatrix);
    modelMatrix.translate(-6, 0, 0)
    modelMatrix.scale(0.1, 5, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model right border
  pushMatrix(modelMatrix);
    modelMatrix.translate(6, 0, 0)
    modelMatrix.scale(0.1, 5, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}
function drawCattedra(gl, u_ModelMatrix, u_NormalMatrix, n){
  var n = initVertexBuffers(gl, 0.80, 0.51, 0.38); // light brown
  // Model the top
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0.5, 0)
    modelMatrix.scale(6.0, 0.1, 3); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model back
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, -0.2, -0.95)
    modelMatrix.scale(6, 1.4, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = initVertexBuffers(gl, 0.36, 0.25, 0.20); //set color to dark brown
  // Model tray bottom
  pushMatrix(modelMatrix);
    modelMatrix.translate(2, -0.025, 0)
    modelMatrix.scale(1.55, 0.05, 1.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  // Model drawrer right side
  pushMatrix(modelMatrix);
    modelMatrix.translate(2.8, 0.2, 0)
    modelMatrix.scale(0.05, 0.5, 1.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  // Model drawer left side
  pushMatrix(modelMatrix);
    modelMatrix.translate(1.2, 0.2, 0)
    modelMatrix.scale(0.05, 0.5, 1.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = initVertexBuffers(gl, 0.2, 0.2, 0.2); //set color to dark gray
  //model right front leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(2.9, -0.6, 1.4)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model left front leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.9, -0.6, 1.4)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model right back leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(2.9, -0.6, -0.85)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model left back leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.9, -0.6, -0.85)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}
function drawChair(gl, u_ModelMatrix, u_NormalMatrix, n){
  var n = initVertexBuffers(gl, 0.38, 0.20, 0.07);

  // Model the chair seat
  pushMatrix(modelMatrix);
    modelMatrix.scale(1.8, 0.1, 1.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the chair back
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 1.5, -0.55);  // Translation
    modelMatrix.scale(1.8, 1, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = initVertexBuffers(gl, 0.2, 0.2, 0.2); //changing colour to dark gray
  //right back support
  pushMatrix(modelMatrix);
    modelMatrix.translate(0.50, 0.8, -0.65);  // Translation
    modelMatrix.scale(0.1, 1.6, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //left back support
  pushMatrix(modelMatrix);
    modelMatrix.translate(-0.50, 0.8, -0.65);  // Translation
    modelMatrix.scale(0.1, 1.6, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //front right leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(0.70, -0.7, 0.65);  // Translation
    modelMatrix.scale(0.1, 1.4, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //front left leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(-0.70, -0.7, 0.65);  // Translation
    modelMatrix.scale(0.1, 1.4, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //back right leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(0.70, -0.7, -0.65);  // Translation
    modelMatrix.scale(0.1, 1.4, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //back left leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(-0.70, -0.7, -0.65);  // Translation
    modelMatrix.scale(0.1, 1.4, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}
function drawDesk(gl, u_ModelMatrix, u_NormalMatrix, n){
  var n = initVertexBuffers(gl, 0.80, 0.51, 0.38); // light brown
  // Model the desk top
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0.5, 0)
    modelMatrix.scale(3.0, 0.1, 2); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = initVertexBuffers(gl, 0.36, 0.25, 0.20); //set color to dark brown
  // Model tray bottom
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0.1, 0.1)
    modelMatrix.scale(2.5, 0.1, 1.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  // Model tray back
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0.3, 0.95)
    modelMatrix.scale(2.5, 0.3, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  // Model tray right side
  pushMatrix(modelMatrix);
    modelMatrix.translate(1.2, 0.3, 0.1)
    modelMatrix.scale(0.1, 0.3, 1.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  // Model tray right side
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.2, 0.3, 0.1)
    modelMatrix.scale(0.1, 0.3, 1.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = initVertexBuffers(gl, 0.2, 0.2, 0.2); //set color to dark gray
  //model right front leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(1.4, -0.6, 0.9)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model left front leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.4, -0.6, 0.9)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model right back leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(1.4, -0.6, -0.9)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //model left back leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.4, -0.6, -0.9)
    modelMatrix.scale(0.1, 2.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}
function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

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
