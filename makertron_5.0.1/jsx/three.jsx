/***************************************************************************
 *   Copyright (c) Damien Towning         (connolly.damien@gmail.com) 2017 *
 *                                                                         *
 *   This file is part of the Makertron CSG cad system.                    *
 *                                                                         *
 *   This library is free software; you can redistribute it and/or         *
 *   modify it under the terms of the GNU Library General Public           *
 *   License as published by the Free Software Foundation; either          *
 *   version 2 of the License, or (at your option) any later version.      *
 *                                                                         *
 *   This library  is distributed in the hope that it will be useful,      *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU Library General Public License for more details.                  *
 *                                                                         *
 *   You should have received a copy of the GNU Library General Public     *
 *   License along with this library; see the file COPYING.LIB. If not,    *
 *   write to the Free Software Foundation, Inc., 59 Temple Place,         *
 *   Suite 330, Boston, MA  02111-1307, USA                                *
 *                                                                         *
 ***************************************************************************/
// ------------------------------------------------------
// jsx module using Three for rendering geometry 
// ------------------------------------------------------
'use strict'

import React from 'react';
import ReactDOM from 'react-dom';
import THREE from '../js/three/three.js'
import OrbitControls from '../js/three/newOrbit.js'

var dark_primary_color = "#303F9F"
var primary_width = '95vw'
var secondary_width = '94vw'
var canvas_width = '93.2vw'

module.exports = class ThreeComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }
		// on move
    onMouseMove(event) {
        this.controls.onMouseMove(event)
        this.render_scene()
    }
		// on down 
    onMouseDown(event) {
        this.controls.onMouseDown(event)
    }
		// on up 
    onMouseUp(event) {
        this.controls.onMouseUp(event)
    }
		// on wheel 
    onMouseWheel(event) {
        this.controls.onMouseWheel(event)
    }
		// touch move
    onTouchMove(event) {
        this.controls.onTouchMove(event)
    }
		// touch start
    onTouchStart(event) {
        this.controls.onTouchStart(event)
    }
		// touch end 
    onTouchEnd(event) {
        this.controls.onTouchEnd(event)
    }
		// init the scene
    init_scene() {
        this.container = document.getElementById("three_canvas");
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.sortObjects = true;
        this.renderer.setClearColor(0xff0000, 0); // the default
        this.renderer.shadowMap.enabled = true;
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 10000);
        this.camera.position.set(400, 400, 400);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.controls = new OrbitControls(THREE, this.camera, this.container)
        this.scene = new THREE.Scene();
        this.container.appendChild(this.renderer.domElement); // bind to the container element 
    }
		// resize
    resize_scene() {
        var container = document.getElementById("three_canvas");
        var width = container.clientWidth;
        var height = container.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
		// render 
    render_scene() { // Render out to canvas 
        this.resize_scene();
        this.renderer.render(this.scene, this.camera);
    }
		// lights
    lights() {
        this.scene.add(new THREE.AmbientLight(0xffffff));
        var back_light = new THREE.SpotLight(0xefefef, 0.2);
        back_light.position.set(0, 0, -500);
        back_light.castShadow = true;
        back_light.shadow.camera.near = 200;
        back_light.shadow.camera.far = this.camera.far;
        back_light.shadow.camera.fov = 50;
        back_light.shadow.bias = -0.00022;
        back_light.shadow.darkness = 0.5;
        this.scene.add(back_light);
        var front_light = new THREE.SpotLight(0xefefef, 0.3);
        front_light.position.set(0, 0, 500);
        front_light.castShadow = true;
        front_light.shadow.camera.near = 200;
        front_light.shadow.camera.far = this.camera.far;
        front_light.shadow.camera.fov = 50;
        front_light.shadow.bias = -0.00022;
        front_light.shadow.darkness = 0.5;
        this.scene.add(front_light);
    }
		// deg return rad
    radians(deg) {
        return deg * (Math.PI / 180);
    }
		// objects to be rendered in to scene. Really want the offscreen canvas so this can go in worker!
    createObject(geoBuffer) {
        var i = 0,
            f = 0,
            vertices = [],
            normals = [],
            colors = [],
            data, data_length
        var geoBufferLength = geoBuffer.length - 1
        // No normals 
        //0,2,1,3,5,4,6,8,7
        //a,b,c,a,b,c,a,b,c
        for (i = 0; i < geoBufferLength; i += 9) {
            vertices.push(
                geoBuffer[i + 0], geoBuffer[i + 2], geoBuffer[i + 1],
                geoBuffer[i + 3], geoBuffer[i + 5], geoBuffer[i + 4],
                geoBuffer[i + 6], geoBuffer[i + 8], geoBuffer[i + 7]
            )
        }
        vertices = new Float32Array(vertices)
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeBoundingSphere()
        geometry.computeVertexNormals()
        var msh = []
        var material = new THREE.MeshPhongMaterial({
            color: 0x303F9F,
            specular: 0xffffff,
            shininess: 1,
            side: THREE.DoubleSide
        })
        msh.push(new THREE.Mesh(geometry, material))
        //var materials = [ new THREE.MeshPhongMaterial({ color: 0x48473e,specular: 0xffffff , shininess: 1, side: THREE.DoubleSide }),
        //								  new THREE.MeshBasicMaterial({ color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true } )]
        //var obj = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
        var edges = new THREE.EdgesGeometry(geometry);
        var lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2
        }));
        msh.push(lines)
        return msh
    }

    update_scene() {
        var _this = this
        var i = 0
        this.scene = new THREE.Scene();
				// lights
        this.lights();
				// geometry 
        var geometry = new THREE.PlaneGeometry(5000, 5000);
        var material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            color: 0x0000ff,
            transparent: true,
            opacity: 0.2
        });
				// lower scene plane
        var plane = new THREE.Mesh(geometry, material);
        plane.receiveShadow = true;
        plane.rotation.set(this.radians(90), 0, 0)
        plane.position.set(0, -500, 0);
        this.scene.add(plane);
				// grid
        var size = 400;
        var divisions = 5;
        var gridHelper_a = new THREE.GridHelper(size, divisions, 0x718EA4, 0x718EA4);
        this.scene.add(gridHelper_a);
        var size = 400;
        var divisions = 40;
        var gridHelper_b = new THREE.GridHelper(size, divisions, 0x123652, 0x123652);
        this.scene.add(gridHelper_b);
				// axis lines
        var axisHelper = new THREE.AxisHelper(400);
        this.scene.add(axisHelper);
        for (i = 0; i < this.props.data.length; i++) {
            var msh = this.createObject(JSON.parse(this.props.data[i]))
            this.scene.add(msh[0])
            this.scene.add(msh[1])
        }
    }

    componentWillMount() {}
    componentDidMount() {
        this.init_scene()
        this.update_scene()
        this.resize_scene()
    }
    componentDidUpdate() {
        this.update_scene()
        this.resize_scene()
    }
    render() {
        return ( <
            div id = "three_canvas"
            style = {{ 'width': canvas_width, 'height': '88vh', 'background': dark_primary_color }}
            onMouseMove = { this.onMouseMove }
            onMouseDown = { this.onMouseDown }
            onMouseUp =   { this.onMouseUp }
            onWheel = { this.onMouseWheel }
            onTouchMove = { this.onTouchMove }
            onTouchStart = { this.onTouchStart }
            onTouchEnd = { this.onTouchEnd
            }
            />
        );
    }
}
