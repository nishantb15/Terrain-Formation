/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;

        this.minZ = -1.0;
        this.maxZ = 1.0;

        this.faceList = [];
        this.vertexList = [];
        this.normalList = [];
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }

        this.partition(1000,0,0.5);
        // console.log(this.nBuffer.length);
        // console.log(this.vBuffer.length);
        // console.log(this.fBuffer.length);
        // console.log(this.div);
    }

    getMinZ()
    {
        return this.minZ;
    }

    getMaxZ() 
    {
        return this.maxZ;
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1) + j);
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid+1] = v[1];
        this.vBuffer[vid+2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1) + j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid+1];
        v[2] = this.vBuffer[vid+2];
    }

    /**
    * Set the x,y,z coords of a normal to a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of normals
    * @param {number} j the jth column of normals
    */
   setNormal(v,i,j)
   {
       //Your code here
       var vid = 3*(i*(this.div+1) + j);
       this.nBuffer[vid] = v[0];
       this.nBuffer[vid+1] = v[1];
       this.nBuffer[vid+2] = v[2];
   }
   
   /**
   * Return the x,y,z coordinates of a normal to a vertex at location (i,j)
   * @param {Object} v an an array of length 3 holding x,y,z coordinates
   * @param {number} i the ith row of normals
   * @param {number} j the jth column of normals
   */
   getNormal(v,i,j)
   {
       //Your code here
       var vid = 3*(i*(this.div+1) + j);
       v[0] = this.nBuffer[vid];
       v[1] = this.nBuffer[vid+1];
       v[2] = this.nBuffer[vid+2];
   }

    /**
     * returns a random number between min and max (both included):
     * https://www.w3schools.com/js/js_random.asp
     * @param {*} min the minimum of the interval
     * @param {*} max the maximum of the interval
     */
    randomInterval(min, max) {
        return (Math.random() * (max - min + 1) ) + min;
      }

    /**
     * Partitions the terrain into two halves then alters the z value of each vertex depending on the side
     * that the vertex lies on
     * @param {number} n the total number of iterations to perform
     * @param {number} minH the value for the minimum delta
     * @param {number} maxH the value for the maximum delta
     */
    partition(number_iter,minH,maxH)
    {
        var delta = 0.0030;
        // run n times
        // console.log(number_iter)
        for (var it = number_iter; it > 0; it--) {
            // console.log(number_iter)
            // console.log("it = " + it.toString());
            // var delta = this.randomInterval(minH,maxH);
            //console.log(delta);

            // find a random point p on the terrain
            var px = this.randomInterval(this.minX, this.maxX);
            var py = this.randomInterval(this.minY, this.maxY);

            // compute a random normal to the plane that lies on a unit circle with p at the centre
            var theta = (2 * Math.PI) * Math.random();
            var nx = Math.cos(theta);
            var ny = Math.sin(theta);

            // p is a random point on the terrain
            // n is some random normalized vector
            var p = glMatrix.vec3.fromValues(px,py,0);
            var n = glMatrix.vec3.fromValues(nx,ny,0);

            for (var i = 0; i <= this.div; i++) {
                for (var j = 0; j <= this.div; j++) {
                    // get the vertex at i,j
                    var vertex = glMatrix.vec3.create();
                    this.getVertex(vertex,i,j);
                    // console.log(vertex[2]);
                    // (vertex-p) . n

                    var subt = glMatrix.vec3.create();
                    glMatrix.vec3.subtract(subt,vertex,p);
                    var dotprod = glMatrix.vec3.dot(subt, n);
                    if (dotprod > 0) {
                        //console.log(dotprod)
                        // increase z by delta
                        vertex[2] += delta;
                        if (vertex[2] > 1) {
                            vertex[2] -= delta;
                        }

                        if (vertex[2] > this.maxZ) {
                            this.maxZ = vertex[2];
                        }
                    } else {
                        // decreaase z by delta
                        vertex[2] -= delta;
                        if (vertex[2] < -1) {
                            vertex[2] += delta;
                        }

                        if (vertex[2] < this.minZ) {
                            this.minZ = vertex[2];
                        }
                    }
                    this.setVertex(vertex,i,j);

                    // vertex[2] -= 0.0005;
                    // this.setVertex(vertex,i,j);
                }
            }
        }

        //CALCULATE NEW NORMAL per-vetex
        //every 3 elements in the face set is a triangle
        for (var i = 0; i < this.numFaces; i++) {
            // get the index of the three vertices that make 1 face
            var vid1 = this.fBuffer[i * 3];
            var vid2 = this.fBuffer[i * 3 + 1];
            var vid3 = this.fBuffer[i * 3 + 2];
      
            // get the x,y,z for all three vertices
            var v1 = glMatrix.vec3.fromValues(this.vBuffer[vid1 * 3], this.vBuffer[vid1 * 3 + 1], this.vBuffer[vid1 * 3 + 2]);
            var v2 = glMatrix.vec3.fromValues(this.vBuffer[vid2 * 3], this.vBuffer[vid2 * 3 + 1], this.vBuffer[vid2 * 3 + 2]);
            var v3 = glMatrix.vec3.fromValues(this.vBuffer[vid3 * 3], this.vBuffer[vid3 * 3 + 1], this.vBuffer[vid3 * 3 + 2]);

            // get the normals for all three vertices
            var n1 = glMatrix.vec3.fromValues(this.nBuffer[vid1 * 3], this.nBuffer[vid1 * 3 + 1], this.nBuffer[vid1 * 3 + 2]);
            var n2 = glMatrix.vec3.fromValues(this.nBuffer[vid2 * 3], this.nBuffer[vid2 * 3 + 1], this.nBuffer[vid2 * 3 + 2]);
            var n3 = glMatrix.vec3.fromValues(this.nBuffer[vid3 * 3], this.nBuffer[vid3 * 3 + 1], this.nBuffer[vid3 * 3 + 2]);
      
            // Compute the new Normal vector
            var subt1 = glMatrix.vec3.create();
            glMatrix.vec3.sub(subt1, v2, v1);
            var subt2 = glMatrix.vec3.create();
            glMatrix.vec3.sub(subt2, v3, v1);
            var crossprod = glMatrix.vec3.create();
            glMatrix.vec3.cross(crossprod, subt1, subt2);
      
            // Add with cross product
            glMatrix.vec3.add(n1, n1, crossprod);
            glMatrix.vec3.add(n2, n2, crossprod);
            glMatrix.vec3.add(n3, n3, crossprod);

            this.nBuffer[vid1 * 3] = n1[0];
            this.nBuffer[vid1 * 3 + 1] = n1[1];
            this.nBuffer[vid1 * 3 + 2] = n1[2];

            this.nBuffer[vid2 * 3] = n2[0];
            this.nBuffer[vid2 * 3 + 1] = n2[1];
            this.nBuffer[vid2 * 3 + 2] = n2[2];

            this.nBuffer[vid3 * 3] = n3[0];
            this.nBuffer[vid3 * 3 + 1] = n3[1];
            this.nBuffer[vid3 * 3 + 2] = n3[2];

            // normalize new normals
            this.normalizeI(vid1);
            this.normalizeI(vid2);
            this.normalizeI(vid3);
          }
    }
    
    /**
     * Normalizes the normal at a vertex at index i
     * @param {number} i the index of the normal
     */
    normalizeI(i) {
        var normal = glMatrix.vec3.fromValues(this.nBuffer[i * 3], this.nBuffer[i * 3 + 1], this.nBuffer[i * 3 + 2]);
        glMatrix.vec3.normalize(normal, normal);

        this.nBuffer[i * 3] = normal[0];
        this.nBuffer[i * 3 + 1] = normal[1];
        this.nBuffer[i * 3 + 2] = normal[2];
    }

    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and  triangle arrays 
 */    
generateTriangles()
{
    //Your code here
    var deltaX = (this.maxX - this.minX)/this.div;
    var deltaY = (this.maxY - this.minY)/this.div;
    
    for (var i = 0; i <= this.div; i++) {
        for (var j = 0; j <= this.div; j++) {
            this.vBuffer.push(this.minX + deltaX*j);
            this.vBuffer.push(this.minY + deltaY*i)
            this.vBuffer.push(0);

            this.nBuffer.push(0);
            this.nBuffer.push(0);
            this.nBuffer.push(1);
        }
    }

    for (var i = 0; i < this.div; i++) {
        for (var j = 0; j < this.div; j++) {
            var vid = i*(this.div+1) + j;
            this.fBuffer.push(vid);
            this.fBuffer.push(vid+1);
            this.fBuffer.push(vid+this.div+1);

            this.fBuffer.push(vid+1);
            this.fBuffer.push(vid+1+this.div+1);
            this.fBuffer.push(vid+this.div+1);
        }
    }

    for (var i = 0; i <= this.div; i++) {
        for (var j = 0; j <= this.div; j++) {
            var t = glMatrix.vec3.fromValues(this.minX + deltaX*j, this.minY + deltaY*i, 0);
            this.vertexList.push(t);

            var n = glMatrix.vec3.fromValues(0,0,1);
            this.normalList.push(n);
        }
    }

    for (var i = 0; i < this.div; i++) {
        for (var j = 0; j < this.div; j++) {
            var vid = i*(this.div+1) + j;
            var v1 = glMatrix.vec3.fromValues(vid, vid+1, vid+this.div + 1);
            this.faceList.push(v1);

            var v2 = glMatrix.vec3.fromValues(vid+1, vid+1+this.div+1, vid+this.div+1);
            this.faceList.push(v2);
        }
    }

    //
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
}
