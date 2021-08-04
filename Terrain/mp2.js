
/**
 * @file A simple WebGL example drawing central Illinois style terrain
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();

/** @global The Normal matrix */
var nMatrix = glMatrix.mat3.create();

/** @global A glMatrix vector to use for transformations */
var transformVec = glMatrix.vec3.create();    

// Initialize the vector....
glMatrix.vec3.set(transformVec,0.0,0.0,-2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;

/** @global determines if fog is on or off */
var ufog = true;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = glMatrix.vec3.fromValues(0.0,0.0,0.0);
/** @global Direction of the view in world coordinates */
var viewDir = glMatrix.vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = glMatrix.vec3.fromValues(100,-200.0,-100.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,3,3];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0,0,0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

/** @global maxZ for any vertex in the partition */
var maxZ = 1.0;
/** @global minZ for any vertex in the partition */
var minZ = -1.0;

/** @global control the degree of roll */
var roll = 0;
/** @global control the degree of yaw */
var yaw = 0;
/** @global control the degree of pitch */
var pitch = 0;
/** @global control the degree of speed */
var speed = 0.001;
/** @global quaternion to capture all rotations */
var q1 = glMatrix.quat.create();



//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
  glMatrix.mat3.transpose(nMatrix,nMatrix);
  glMatrix.mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader; 
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-phong-phong-vs");
  fragmentShader = loadShaderFromDOM("shader-phong-phong-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMaterialColor");  
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMaterialColor");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMaterialColor");

  shaderProgram.uniformFogLoc = gl.getUniformLocation(shaderProgram, "ufog");

  shaderProgram.maxZLoc = gl.getUniformLocation(shaderProgram, "maxZ");
  shaderProgram.minZLoc = gl.getUniformLocation(shaderProgram, "minZ");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);

  gl.uniform1f(shaderProgram.minZLoc, minZ);
  gl.uniform1f(shaderProgram.maxZLoc, maxZ);

  gl.uniform1i(shaderProgram.uniformFogLoc, ufog);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    myTerrain = new Terrain(200,-0.75,0.75,-0.75,0.75);
    myTerrain.loadBuffers();
    minZ = myTerrain.getMinZ();
    maxZ = myTerrain.getMaxZ();
}

/**
 * Reset buffers with data
 */
function resetBuffers() {
  myTerrain.loadBuffers();
  minZ = myTerrain.getMinZ();
  maxZ = myTerrain.getMaxZ();
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    //console.log("function draw()")
    if (document.getElementById("fog").checked) {
      ufog = true;
    } else {
      ufog = false;
    }

    // console.log(ufog);

    var transformVec = glMatrix.vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update the speed
    if (currentlyPressedKeys["+"] == true) {
      speed += 0.0001;
    }
    if (currentlyPressedKeys["-"] == true) {
      speed -= 0.0001;
    }

    var q2 = glMatrix.quat.create();
    // var vec = glMatrix.vec3.create();
    // glMatrix.quat.getAxisAngle(vec,q1);

    // Roll (Z axis)
    if (currentlyPressedKeys["ArrowLeft"]) {
      // console.log("CCW");
      if (roll > 0) {
        q1 = glMatrix.quat.create();
        roll = 0;
      }
      roll -= 0.001;
      glMatrix.quat.fromEuler(q2,0,0,-0.001);
      glMatrix.quat.multiply(q1,q2,q1);
      glMatrix.vec3.transformQuat(viewDir, viewDir, q1);
      glMatrix.vec3.transformQuat(up, up, q1);
    } else if (currentlyPressedKeys["ArrowRight"]) {
      // console.log("CW");
      if (roll < 0) {
        q1 = glMatrix.quat.create();
        roll = 0;
      }
      roll += 0.001;
      glMatrix.quat.fromEuler(q2,0,0,0.001);
      glMatrix.quat.multiply(q1,q2,q1);
      glMatrix.vec3.transformQuat(viewDir, viewDir, q1);
      glMatrix.vec3.transformQuat(up, up, q1);
    }

    // Yaw (Y axis)
    if (currentlyPressedKeys["d"]) {
      // console.log("right");
      if (yaw > 0) {
        q1 = glMatrix.quat.create();
        yaw = 0;
      }
      yaw -= 0.001;
      glMatrix.quat.fromEuler(q2,0,-0.001,0);
      glMatrix.quat.multiply(q1,q2,q1);
      glMatrix.vec3.transformQuat(viewDir, viewDir, q1);
      glMatrix.vec3.transformQuat(up, up, q1);
    } else if (currentlyPressedKeys["a"]) {
      // console.log("left");
      if (yaw < 0) {
        q1 = glMatrix.quat.create();
        yaw = 0;
      }
      yaw += 0.001;
      glMatrix.quat.fromEuler(q2,0,0.001,0);
      glMatrix.quat.multiply(q1,q2,q1);
      glMatrix.vec3.transformQuat(viewDir, viewDir, q1);
      glMatrix.vec3.transformQuat(up, up, q1);
    }

    // Pitch (X axis)
    if (currentlyPressedKeys["ArrowUp"]){
      if (pitch > 0) {
        q1 = glMatrix.quat.create();
        pitch = 0;
      }
      pitch -= 0.001;
      glMatrix.quat.fromEuler(q2,-0.001,0,0);
      glMatrix.quat.multiply(q1,q2,q1);
      glMatrix.vec3.transformQuat(viewDir, viewDir, q1);
      glMatrix.vec3.transformQuat(up, up, q1);
    } else if (currentlyPressedKeys["ArrowDown"]){
      if (pitch < 0) {
        q1 = glMatrix.quat.create();
        pitch = 0;
      }
      pitch += 0.001;
      glMatrix.quat.fromEuler(q2,0.001,0,0);
      glMatrix.quat.multiply(q1,q2,q1);
      glMatrix.vec3.transformQuat(viewDir, viewDir, q1);
      glMatrix.vec3.transformQuat(up, up, q1);
    }

    // add speed to eypt
    var newDir = glMatrix.vec3.create();
    glMatrix.vec3.scale(newDir, viewDir, speed);
    glMatrix.vec3.add(eyePt, eyePt, newDir);

    // We'll use perspective 
    glMatrix.mat4.perspective(pMatrix,degToRad(60), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 400);

    // We want to look down -z, so create a lookat point in that direction    
    glMatrix.vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,eyePt,viewPt,up);    

    // Reflect the changes in html
    document.getElementById("speed").value = speed;
    document.getElementById("roll").value = roll;
    document.getElementById("pitch").value = pitch;
    document.getElementById("yaw").value = yaw;
 
    //Draw Terrain
    glMatrix.vec3.set(transformVec,0.0,-0.5,-2.1);
    glMatrix.mat4.translate(mvMatrix, mvMatrix,transformVec);
    glMatrix.mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
    
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    { 
      setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular); 
      myTerrain.drawTriangles();
    }
    
    if(document.getElementById("wirepoly").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeBlack,kSpecular);
      myTerrain.drawEdges();
    }

    if(document.getElementById("wireframe").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
      myTerrain.drawEdges();
    }
    
    requestAnimationFrame(draw); 
  
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  requestAnimationFrame(draw); 
}

var currentlyPressedKeys = {};

/** 
 * handles user input when key is pressed down
 * @param event contains the information of the event that occurred.
 */
function handleKeyDown(event) {
  // console.log("Key down ", event.key, " code ", event.code);
  if (event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "ArrowUp" || event.key == "ArrowDown" || event.key == "a" || event.kry == "d") {
    event.preventDefault();
  }
  currentlyPressedKeys[event.key] = true;
}

/** 
 * handles user input when key is pressed down
 * @param event contains the information of the event that occurred.
 */
function handleKeyUp(event) {
  //console.log("Key up ", event.key, " code ", event.code);
  currentlyPressedKeys[event.key] = false;
}