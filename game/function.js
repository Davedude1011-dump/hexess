import * as THREE from 'three';

import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.138.0/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'https://unpkg.com/three@0.138.3/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://unpkg.com/three@0.138.3/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.138.1/examples/jsm/loaders/GLTFLoader.js';


const firebaseConfig = {
    apiKey: "AIzaSyB0Ajt4HoWAs5BszqW0vhett0k4TZJZapc",
    authDomain: "chessaria2.firebaseapp.com",
    projectId: "chessaria2",
    storageBucket: "chessaria2.appspot.com",
    messagingSenderId: "275629869486",
    appId: "1:275629869486:web:cda4762d3ed45e6c22e03f",
    measurementId: "G-4HTVCH93BV"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database()
//db.ref("Turn").set("White")

//Get Game Code
var SearchParams = new URLSearchParams(window.location.search);
const GameCode = SearchParams.get("GameCode");
if (GameCode) { console.log("GameCode: " + GameCode); }

db.ref(`${GameCode}-Turn`).set("true")
db.ref(`${GameCode}-IsReady`).set(JSON.stringify([0,0]))

var TeamIsWhite = "ERROR"
function GetTeam() {
    return new Promise(function(resolve, reject) {
        db.ref(`${GameCode}-Team`).once("value").then(function(snapshot) {
            let Value = JSON.parse(snapshot.val());

            if (Value === null || Value[0] === 0) {
                TeamIsWhite = "true";
                db.ref(`${GameCode}-Team`).set(JSON.stringify([1, 0])).then(() => resolve());
            } else if (Value[1] === 0) {
                TeamIsWhite = "false";
                db.ref(`${GameCode}-Team`).set(JSON.stringify([1, 1])).then(() => resolve());
            } else if (Value[0] === 1 && Value[1] === 1) {
                TeamIsWhite = "ERROR";
                resolve();
            }
        });
    });
}

// Usage of the GetTeam function with a Promise
GetTeam().then(function() {
    console.log(TeamIsWhite);

// FROM THIS POINT TeamIsWhite IS A VALID VARIABLE: ----------------------------------------------------------------------------------------------------------------------

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 30000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var isBuildMode = true
var ManaCounterElement = document.getElementById("MANA")
var ManaMax = 150
var Mana = ManaMax
var ManaCost

function RefreshManaCounter() { ManaCounterElement.textContent = `${Mana} / ${ManaMax}` }
RefreshManaCounter()

function CheckIfSquareIsValid(SquareCoords) {
    let x = Number(SquareCoords.split(",")[0])
    let y = Number(SquareCoords.split(",")[1])

    if (TeamIsWhite == "true") {
        if (y-1 >= 0 && y-1 < 4) { return true }
        else { return false }
    }
    else {
        if (y-1 >= 6 && y-1 < 10) { return true }
        else { return false }
    }
}

// CUSTOM MODELS:

function loadGLTFModel(path, width, onLoad, onError) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();

        loader.load(path, function (gltf) {
            const model = gltf.scene;
            autoScaleModelToWidth(model, width);
            resolve(model);

            if (onLoad) {
                onLoad(model);
            }
        }, undefined, function (error) {
            reject(error);

            if (onError) {
                onError(error);
            }
        });
    });
}

//create asteroid:
loadGLTFModel("3d_models/asteroid.glb", 23, function (model) {
    model.position.x = -0.5
    model.position.z = -0.5
    model.position.y = -10.8

    model.rotation.y = (Math.PI*1.5)

    model.userData.ObjectType = "DoNotDelete"
    scene.add(model);
})

function autoScaleModelToWidth(model, desiredWidth) {
    // Calculate the current width of the model
    const objectBoundingBox = new THREE.Box3().setFromObject(model);
    const currentWidth = objectBoundingBox.max.x - objectBoundingBox.min.x;

    // Calculate the scaling factor
    const scaleFactor = desiredWidth / currentWidth;

    // Apply the scale to the model while maintaining proportions
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

function CreateText(Text, Values) {
    let FontSize = Values.FontSize;
    let FontThickness = Values.FontThickness;
    let PosX = Values.PosX;
    let PosY = Values.PosY;
    let PosZ = Values.PosZ;
    let RotX = Values.RotX;
    let RotY = Values.RotY;
    let RotZ = Values.RotZ;
    let Color = Values.Color;
    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.138.3/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const geometry = new TextGeometry(Text, {
            font: font,
            size: FontSize,
            height: FontThickness,
            curveSegments: 15,
            bevelEnabled: false,
            bevelThickness: 0.05,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 5
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: Color });
        const textMesh = new THREE.Mesh(geometry, textMaterial);

        textMesh.position.x = PosX;
        textMesh.position.y = PosY;
        textMesh.position.z = PosZ;

        textMesh.rotation.x = RotX;
        textMesh.rotation.y = RotY;
        textMesh.rotation.z = RotZ;

        // Add a userData attribute to the textMesh
        textMesh.userData.rotateToFaceScreen = true;

        scene.add(textMesh);

        // In your animation loop, add the following code to make the textMesh face the camera
        if (textMesh.userData.rotateToFaceScreen) {
            textMesh.lookAt(camera.position);
        }
    });
}

var StartingGrid = [
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
    {Character: "", ModelPath: "", isWhite: "", HP: undefined, hasPlayed: false},
]
db.ref(`${GameCode}-Grid`).set(JSON.stringify(StartingGrid))

let ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // The first parameter is the light color, and the second is the light intensity.
ambientLight.userData.ObjectType = "DoNotDelete"
scene.add(ambientLight);

let SkyboxType = "stars1"
let sphereGeometry = new THREE.SphereGeometry(10000, 32, 32);
let sphereTexture = new THREE.TextureLoader().load(`skyboxes/${SkyboxType}.png`);
let sphereMaterial = new THREE.MeshBasicMaterial({ map: sphereTexture })
sphereMaterial.side = THREE.BackSide
let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.userData.ObjectType = "DoNotDelete"
scene.add(sphere);

// Grid renderer
function RenderGrid(DontUpdate) {
    // delete old grid:
    let objectsToRemove = scene.children.slice()
    for (let i = 0; i < objectsToRemove.length; i++) {
        if (objectsToRemove[i].userData.ObjectType != "DoNotDelete") { scene.remove(objectsToRemove[i]);  }
    }

    // create new grid
    for (let z = 0; z < 10; z++) { //main grid
        let Color
        let ColorBright
        let ColorDark
    
        for (let x = 0; x < 10; x++) {
            if (z >= 0 && z < 4) { //top section
                ColorBright = 0xFFFFFF
                ColorDark = 0xE0E0E0
            }
            if (z >= 4 && z < 5) { //top-midde section
                ColorBright = 0x80B9FF
                ColorDark = 0x61A8FF
            }
            if (z >= 5 && z < 6) { //bottom-midde section
                ColorBright = 0xFF7C75
                ColorDark = 0xFF6961
            }
            if (z >= 6 && z < 10) { //bottom section
                ColorBright = 0x353535
                ColorDark = 0x292929
            }
            if (z % 2 == 0 && x % 2 == 0) { Color = ColorBright }
            else if (z % 2 != 0 && x % 2 != 0) { Color = ColorBright }
            else { Color = ColorDark }
        
            let geometry = new THREE.BoxGeometry(1, 0.2, 1);
            let material = new THREE.MeshBasicMaterial({ color: Color });
            let cube = new THREE.Mesh(geometry, material);
    
            //cube DATA
            cube.userData.isClicked = false
            cube.userData.OriginalColor = Color
            cube.userData.ObjectType = "Square"
            cube.userData.Coordinate = `${x+1},${z+1}`
        
            cube.position.x = x-5;
            cube.position.y = 0;
            cube.position.z = z-5;

            if (isBuildMode && !CheckIfSquareIsValid(`${x+1},${z+1}`)) {
                cube.material.wireframe = true
            }
            
            cube.userData.ModelPath = StartingGrid[x + (10*z)].ModelPath
            if (cube.userData.ModelPath != "") {
                loadGLTFModel(cube.userData.ModelPath, 1, function (model) {
                    model.position.x = cube.position.x
                    model.position.z = cube.position.z
                    model.position.y = 0.08
                    if (StartingGrid[x + (10*z)].isWhite == "true") {
                        model.rotation.y = (Math.PI*1.5)
                    }
                    else {
                        model.rotation.y = (Math.PI / 2)
                    }
                    model.userData.ObjectType = "Character"
                    model.userData.CharacterName = StartingGrid[x + (10*z)].Character
                    model.userData.CharacterCoordinate = `${x+1},${z+1}`
                    scene.add(model);
                })

                // Load Current HP above character
                CreateText(String(StartingGrid[x + (10*z)].HP), {
                    FontSize: 0.2,
                    FontThickness: 0.02,
                    PosX: cube.position.x,
                    PosY: 1.58,
                    PosZ: cube.position.z,
                    RotX: 0,
                    RotY: 0,
                    RotZ: 0,
                    Color: 0x7FFFD4
                })
            }
        
            scene.add(cube);
        }
    }
    for (let z = 0; z < 10; z++) {// backboard
        let Color
    
        for (let x = 0; x < 10; x++) {
            if (z < 5) { Color = 0x232323 }
            else { Color = 0xDCDCDC }
        
            let geometry = new THREE.BoxGeometry(1, 0.05, 1);
            let material = new THREE.MeshBasicMaterial({ color: Color });
            let cube = new THREE.Mesh(geometry, material);
    
            //cube DATA
        
            cube.position.x = x-5;
            cube.position.y = -0.125;
            cube.position.z = z-5;
        
            scene.add(cube);
        }
    }
    if (!DontUpdate || DontUpdate == undefined) { db.ref(`${GameCode}-Grid`).set(JSON.stringify(StartingGrid)) }
}
RenderGrid()

// Change grid on database change:
db.ref(`${GameCode}-Grid`).on("value", (snapshot) => {
    let NewGridValue = snapshot.val()
    StartingGrid = JSON.parse(NewGridValue)
    RenderGrid(false)
})


camera.position.z = 15;
camera.position.x = 0.5;
camera.position.y = 0.5;

// Add the OrbitControls for panning and zooming
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN, // Change to rotate if you dont want movement
};
// Set the center of rotation to (0, 0, 0)
controls.target.set(0, 0, 0);

// You can configure zoom and pan speed as needed
controls.zoomSpeed = 1.0; // Adjust the zoom speed
controls.panSpeed = 0.8;  // Adjust the pan speed

// Optionally, enable damping for smoother movement
controls.enableDamping = true;
controls.dampingFactor = 0.05;


// RAYCASTING:
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

function RemoveSelectedObjects() {
    scene.traverse(function (object) {
        if (object.userData.isClicked) {
            if (!isBuildMode || CheckIfSquareIsValid(object.userData.Coordinate)) {
                object.material.wireframe = false
            }
            object.userData.isClicked = false
            object.material.color.set(object.userData.OriginalColor)
        }
    })
}

var isHovering

const MouseMove = (event) => {
    // get pointer position in normalized coordinates
    // (-1 to +1) for both components
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children)

    //for (let i = 0; i < intersects.length; i++) {
    //    console.log(intersects)
    //    intersects[i].object.material.color.set(0xff0000)
    //}
    if (intersects.length > 0) {
        HoverObject(intersects[0].object)
        isHovering = true
    }
    else {
        if (isHovering && !isSelectingMove && !isSelectingAttack) {
            RemoveSelectedObjects()
        }
        isHovering = false
    }
}
const MouseClick = (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children)
    if (intersects.length > 0) {
        ClickObject(intersects[0].object)
    }
}
window.addEventListener("mousemove", MouseMove)
document.querySelector("canvas").addEventListener("click", MouseClick)

var isAttackSelected = false
var isMovementSelected = true

function HoverObject(ObjectSelected) {
    if (ObjectSelected.userData.ObjectType == "Square") {
        if (!isSelectingMove && !isSelectingAttack) {
            scene.traverse(function (object) {
                if (object.userData.isClicked) {
                    if (!isBuildMode || CheckIfSquareIsValid(object.userData.Coordinate)) {
                        object.material.wireframe = false
                    }
                    object.userData.isClicked = false
                    object.material.color.set(object.userData.OriginalColor)
                }
            })
    
            if (ObjectSelected.userData.isClicked == false) {
                ObjectSelected.material.color.set(0x3EB489)
                ObjectSelected.userData.isClicked = true
    
                if (SelectedCharacter != undefined) {
                    let Ranges
                    if (isAttackSelected) { Ranges = Characters[SelectedCharacter]["Range-attack"] }
                    else if (isMovementSelected) { Ranges = Characters[SelectedCharacter]["Range-movement"] }
                    
                    let ThisCoord = ObjectSelected.userData.Coordinate
                    let ThisX = Number(ThisCoord.split(",")[0])
                    let ThisY = Number(ThisCoord.split(",")[1])
    
                    for (let i = 0; i < Ranges.length; i++) {
                        let ShiftedX = ThisX + Ranges[i][0]
                        let ShiftedY = ThisY + Ranges[i][1]
    
                        if (ShiftedX > 0 && ShiftedX <= 10 && ShiftedY > 0 && ShiftedX <= 10) {
                            scene.traverse(function (object) {
                                if (object.userData.Coordinate == `${ShiftedX},${ShiftedY}`) {
                                    object.material.wireframe = true
                                    object.userData.isClicked = true
                                }
                            })
                        }
                    }
                }
            }
        }
    }
    //else if (ObjectSelected.userData.ObjectType == "Character") {
    //    console.log("ji")
    //}
    //else {
    //    ObjectSelected.material.wireframe = true
    //}
}

var SelectedSquare
function ClickObject(ObjectSelected) {
    if (ObjectSelected.userData.ObjectType == "Square") {
        if (!isBuildMode) { SelectedCharacter = undefined }
        if (isBuildMode && CheckIfSquareIsValid(ObjectSelected.userData.Coordinate)) {
            if (SelectedCharacter != undefined) {
                if (SelectedCharacter == "DELETE") {
                    let Index = ((Number(ObjectSelected.userData.Coordinate.split(",")[0])-1) + ((Number(ObjectSelected.userData.Coordinate.split(",")[1])-1)*10))
                    StartingGrid[Index].Character = ""
                    StartingGrid[Index].ModelPath = ""
                    StartingGrid[Index].isWhite = ""
                    StartingGrid[Index].HP = undefined
                    RenderGrid()
                }
                else if (Mana != 0 && (Mana - ManaCost) >= 0) {
                    let Index = ((Number(ObjectSelected.userData.Coordinate.split(",")[0])-1) + ((Number(ObjectSelected.userData.Coordinate.split(",")[1])-1)*10))
                    let CharacterPath = Characters[SelectedCharacter]
                    let ModelPath = CharacterPath["Model"]
                    if (ModelPath != undefined) {
                        //loadGLTFModel(ModelPath, 1, function (model) {
                        //    model.position.x = ObjectSelected.position.x
                        //    model.position.z = ObjectSelected.position.z
                        //    model.position.y = 0.08
                        //    model.rotation.y = (Math.PI / 2)
                        //    scene.add(model);
                        //})
                        StartingGrid[Index].Character = CharacterPath["Name"]
                        StartingGrid[Index].ModelPath = CharacterPath["Model"]
                        StartingGrid[Index].isWhite = TeamIsWhite
                        StartingGrid[Index].HP = CharacterPath["Health"]
                        Mana -= ManaCost
                        RefreshManaCounter()
                        RenderGrid()
                    }
                }
            }
        }
        else {
            //let SharedCoordinate = ObjectSelected.userData.Coordinate
            //scene.traverse(function (object) {
            //    if (object.userData.CharacterCoordinate == SharedCoordinate) {
            //        console.log(object.userData.CharacterCoordinate)
            //        console.log(StartingGrid[((Number(object.userData.CharacterCoordinate.split(",")[0])-1) + ((Number(object.userData.CharacterCoordinate.split(",")[1])-1)*10))])
            //    }
            //})
        }

        
        if (!isBuildMode) { // during the actual game
            
            db.ref(`${GameCode}-Turn`).once('value').then(function(snapshot) {
                let Value = snapshot.val();
                if (Value == TeamIsWhite) {
                    if (!isSelectingMove && !isSelectingAttack) {
                        if (SelectedSquare == ObjectSelected.userData.Coordinate) {
                            document.querySelector(".options-menu").style.display = "none"
                            if (document.querySelector(".popup-menu") != undefined) {
                                document.querySelector(".popup-menu").style.display = "none"
                            }
                            SelectedSquare = undefined
                        }
                        else {
                            let SharedCoordinate = ObjectSelected.userData.Coordinate // check if character has movement options, if not disable button
                            let HasFoundCharacter = false
                            scene.traverse(function (object) {
                                if (object.userData.CharacterCoordinate == SharedCoordinate) {
        
                                    if (!StartingGrid[((Number(object.userData.CharacterCoordinate.split(",")[0])-1) + ((Number(object.userData.CharacterCoordinate.split(",")[1])-1)*10))].hasPlayed && StartingGrid[((Number(object.userData.CharacterCoordinate.split(",")[0])-1) + ((Number(object.userData.CharacterCoordinate.split(",")[1])-1)*10))].isWhite == TeamIsWhite) {
                                        document.querySelector(".options-menu").style.display = "flex"
                                        if (document.querySelector(".popup-menu") != undefined) {
                                            document.querySelector(".popup-menu").style.display = "block"
                                        }
                                        SelectedSquare = ObjectSelected.userData.Coordinate // this is only here so that you can only select a character when there is a character (nothing to do with options)
            
                                        if (Characters[object.userData.CharacterName]["Range-movement"].length == 0) {
                                            document.querySelector(".move-button").classList.add("disabled")
                                        }
                                        else if (document.querySelector(".move-button").classList.contains("disabled")) {
                                            document.querySelector(".move-button").classList.remove("disabled")
                                        }
            
                                        HasFoundCharacter = true
                                    }
        
                                }
                            })
                            if (!HasFoundCharacter) {
                                document.querySelector(".options-menu").style.display = "none"
                                if (document.querySelector(".popup-menu") != undefined) {
                                    document.querySelector(".popup-menu").style.display = "none"
                                }
                                SelectedSquare = undefined
                            }
                        }
                    }
                    else if (isSelectingAttack) {
                        if (SelectedAttackDamage == undefined) {
                            toastr.error("Please Select an Attack first!")
                        }
                        else {
                            let ClickedCoordinate = ObjectSelected.userData.Coordinate
                            if (isSelectingRange.includes(ClickedCoordinate)) { // attack square!
                                let StartingGridIndex = ((Number(ClickedCoordinate.split(",")[0])-1) + ((Number(ClickedCoordinate.split(",")[1])-1)*10))
            
                                console.log("### BEFORE: ###")
                                console.log(StartingGrid[StartingGridIndex].HP)
                                console.log(SelectedAttackDamage)
                                console.log(StartingGrid[isSelectingOriginalIndex])
                                
                                StartingGrid[StartingGridIndex].HP = StartingGrid[StartingGridIndex].HP - SelectedAttackDamage
                                StartingGrid[isSelectingOriginalIndex].hasPlayed = true
            
                                console.log(StartingGridIndex)
            
                                isSelectingAttack = false
                                document.querySelector(".attack-button").classList.remove("options-menu-selected")
        
                                document.querySelector(".options-menu").style.display = "none"
                                if (document.querySelector(".popup-menu") != undefined) {
                                    document.querySelector(".popup-menu").style.display = "none"
                                }
                                SelectedSquare = undefined
            
                                console.log("### AFTER: ###")
                                console.log(StartingGrid[StartingGridIndex].HP)
                                console.log(StartingGrid[isSelectingOriginalIndex])
            
                                SelectedAttackDamage = undefined
            
                                RenderGrid()
                            }
                        }
                    }
                    else {//(isSelectingMove)
                        let ClickedCoordinate = ObjectSelected.userData.Coordinate
                        console.log(isSelectingRange)
                        if (isSelectingRange.includes(ClickedCoordinate)) {
                            let StartingGridIndex = ((Number(ClickedCoordinate.split(",")[0])-1) + ((Number(ClickedCoordinate.split(",")[1])-1)*10))
                            if (StartingGrid[StartingGridIndex].Character == "" || StartingGrid[StartingGridIndex].Character == undefined) {
                                let StartingGridSquareCharacter = StartingGrid[isSelectingOriginalIndex].Character
                                let StartingGridSquareModelPath = StartingGrid[isSelectingOriginalIndex].ModelPath
                                let StartingGridSquareIsWhite = StartingGrid[isSelectingOriginalIndex].isWhite
                                let StartingGridSquareHP = StartingGrid[isSelectingOriginalIndex].HP
            
                                StartingGrid[StartingGridIndex].Character = StartingGridSquareCharacter
                                StartingGrid[StartingGridIndex].ModelPath = StartingGridSquareModelPath
                                StartingGrid[StartingGridIndex].isWhite = StartingGridSquareIsWhite
                                StartingGrid[StartingGridIndex].HP = StartingGridSquareHP
                                StartingGrid[StartingGridIndex].hasPlayed = true
            
                                StartingGrid[isSelectingOriginalIndex].Character = ""
                                StartingGrid[isSelectingOriginalIndex].ModelPath = ""
                                StartingGrid[isSelectingOriginalIndex].isWhite = ""
                                StartingGrid[isSelectingOriginalIndex].HP = undefined
                                StartingGrid[isSelectingOriginalIndex].hasPlayed = false
                                console.log(StartingGridIndex)
            
                                isSelectingMove = false
                                document.querySelector(".move-button").classList.remove("options-menu-selected")
                                document.querySelector(".options-menu").style.display = "none"
                                if (document.querySelector(".popup-menu") != undefined) {
                                    document.querySelector(".popup-menu").style.display = "none"
                                }
                                SelectedSquare = undefined
            
                                RenderGrid()
                            }
                            else {
                                toastr.error("You cant move onto other characters!")
                            }
                        }
                    }
                    console.log(SelectedSquare)
                }
            })
            
        }
    }
}


// Example usage:



function animate() {
    requestAnimationFrame(animate);

    // Update the controls in the animation loop
    controls.update();
    scene.children.forEach((object) => {
        if (object.userData.rotateToFaceScreen) {
            object.lookAt(camera.position);
        }
    });

    renderer.render(scene, camera);
}

animate();

// Character Menu:
var SelectedCharacter
const CharacterMenu = document.querySelector(".character-menu")

var Characters = {
    "Alpha":
    {
        "Range-movement":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Range-attack":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Attacks":
        [
            
        ],
        "Level": "★",
        "Name": "Alpha",
        "Health": 100,
        "Cost": 10,
        "Model": "3d_models/alpha.glb"
    },

    "Beta":
    {
        "Range-movement":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
                      [0,  1]
        ],
        "Range-attack":
        [
                      [0, -2],
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Attacks":
        [
            
        ],
        "Level": "★",
        "Name": "Beta",
        "Health": 250,
        "Cost": 20,
        "Model": "3d_models/beta.glb"
    },

    "Charlie":
    {
        "Range-movement":
        [
                      [0, -1],
            [-1,  0],          [ 1,  0],
                      [0,  1],
        ],
        "Range-attack":
        [
            [-1, -2], [0, -2], [ 1, -2],
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
                      [0,  1],
        ],
        "Attacks":
        [
            {"Name": "Shoot", "Damage": 15},
            {"Name": "Turret Shoot", "Damage": 10},
        ],
        "Level": "★",
        "Name": "Charlie",
        "Health": 250,
        "Cost": 20,
        "Model": "3d_models/charlie.glb"
    },

    "Lizard Mage":
    {
        "Range-movement":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Range-attack":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Attacks":
        [
            
        ],
        "Level": "★",
        "Name": "Lizard Mage",
        "Health": 75,
        "Cost": 20,
        "Model": "3d_models/lizard_mage.glb"
    },

    "M1 Aegis":
    {
        "Range-movement":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Range-attack":
        [
            [-1, -1], [0, -1], [ 1, -1],
            [-1,  0],          [ 1,  0],
            [-1,  1], [0,  1], [ 1,  1]
        ],
        "Attacks":
        [
            {"Name": "Shoot", "Damage": 15},
            {"Name": "Turret Shoot", "Damage": 10},
        ],
        "Level": "★",
        "Name": "M1 Aegis",
        "Health": 75,
        "Cost": 20,
        "Model": "3d_models/m1_aegis.glb"
    },

    "P1 Blaze":
    {
        "Range-movement":
        [],
        "Range-attack":
        [
            [0, -9],
            [0, -8],
            [0, -7],
            [0, -6],
            [0, -5],
            [0, -4],
            [0, -3],
            [0, -2],
            [0, -1],
        ],
        "Attacks":
        [
            {"Name": "Shoot", "Damage": 15},
            {"Name": "Turret Shoot", "Damage": 10},
        ],
        "Level": "★",
        "Name": "P1 Blaze",
        "Health": 75,
        "Cost": 20,
        "Model": "3d_models/p1_blaze.glb"
    },

    "P2 Cascade":
    {
        "Range-movement":
        [
            [-1,  0],          [ 1,  0],
        ],
        "Range-attack":
        [
            [0, -5],
            [0, -4],
            [0, -3],
            [0, -2],
            [0, -1],
        ],
        "Attacks":
        [
            {"Name": "Shoot", "Damage": 15},
            {"Name": "Turret Shoot", "Damage": 10},
        ],
        "Level": "★",
        "Name": "P2 Cascade",
        "Health": 75,
        "Cost": 20,
        "Model": "3d_models/p2_cascade.glb"
    },
}
if (TeamIsWhite == "true") {
    for (const character in Characters) {
        if (Characters.hasOwnProperty(character)) {
            const char = Characters[character];
            
            for (let i = 0; i < char["Range-movement"].length; i++) {
                const movement = char["Range-movement"][i];
                char["Range-movement"][i] = movement.map(val => -val);
            }
            for (let i = 0; i < char["Range-attack"].length; i++) {
                const attack = char["Range-attack"][i];
                char["Range-attack"][i] = attack.map(val => -val);
            }
        }
    }
}

for (const characterName in Characters) {
    if (Characters.hasOwnProperty(characterName)) {
        let MenuItem = document.createElement("div");
        MenuItem.textContent = `${Characters[characterName]["Name"]} (${Characters[characterName]["Cost"]})`;
        MenuItem.classList.add("character-menu-inner");
        MenuItem.id = Characters[characterName]["Name"]
        MenuItem.setAttribute("ManaCost", Characters[characterName]["Cost"])

        MenuItem.onclick = function() {
            if (SelectedCharacter == this.id) {
                SelectedCharacter = undefined
                ManaCost = undefined

                this.classList.remove("selected")
            }
            else {
                SelectedCharacter = this.id
                ManaCost = Number(this.getAttribute("ManaCost"))
                console.log(SelectedCharacter)
    
                try {
                    document.querySelector(".selected").classList.remove("selected")
                }
                catch{}
                
                this.classList.add("selected")
            }
        }

        CharacterMenu.appendChild(MenuItem);
    }
}
document.getElementById("DELETE").addEventListener("click", function() {
    if (SelectedCharacter == "DELETE") {
        SelectedCharacter = undefined

        this.classList.remove("selected")
    }
    else {
        SelectedCharacter = "DELETE"
    
        try {
            document.querySelector(".selected").classList.remove("selected")
        }
        catch{}
        
        this.classList.add("selected")
    }
})

let isDragging = false;
let initialX, initialY;
let currentX, currentY;

const element = document.querySelector(".drag-bar");

element.addEventListener("mousedown", (e) => {
    isDragging = true;
    initialX = e.clientX - element.getBoundingClientRect().left;
    initialY = e.clientY - element.getBoundingClientRect().top;
});

element.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    e.preventDefault();

    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    element.parentElement.style.left = currentX + "px";
    element.parentElement.style.top = currentY + "px";
});

element.addEventListener("mouseup", () => {
    isDragging = false;
});

element.addEventListener("mouseleave", () => {
    isDragging = false;
});

var isSelectingMove = false
var isSelectingAttack = false
var isSelectingRange
var isSelectingOriginalIndex
var SelectedAttackDamage

function OpenAttackMenu() {
    RemoveSelectedObjects()
    if (isSelectingAttack == true) {
        if (document.querySelector(".popup-menu") != undefined) { document.querySelector(".popup-menu").remove() }
        isSelectingAttack = false
        document.querySelector(".attack-button").classList.remove("options-menu-selected")
    }
    else if (SelectedSquare != undefined) {
        if (document.querySelector(".popup-menu") != undefined) { document.querySelector(".popup-menu").remove() }
        let AttackMenu = document.createElement("div")
        AttackMenu.classList.add("popup-menu")

        scene.traverse(function (object) {// finding the character ontop to get name to plug into array
            if (object.userData.CharacterCoordinate == SelectedSquare) {
                let ListOfAttacks = Characters[object.userData.CharacterName]["Attacks"]
                console.log(ListOfAttacks)

                for (let i = 0; i < ListOfAttacks.length; i++) {
                    let CurrentAttack = ListOfAttacks[i]
                    let AttackName = CurrentAttack["Name"]
                    let AttackDamage = CurrentAttack["Damage"]

                    let MenuItem = document.createElement("div");
                    MenuItem.textContent = `${AttackName} (${AttackDamage})`;
                    MenuItem.classList.add("popup-menu-inner");
                    MenuItem.id = AttackDamage

                    MenuItem.addEventListener("click", function() {
                        SelectedAttackDamage = Number(this.id)
                    })

                    AttackMenu.appendChild(MenuItem)
                }
                
                let AttackRange = Characters[object.userData.CharacterName]["Range-attack"]
                console.log(AttackRange)

                let ThisCoord = object.userData.CharacterCoordinate
                let ThisX = Number(ThisCoord.split(",")[0])
                let ThisY = Number(ThisCoord.split(",")[1])

                var ArrayOfCoords = []

                for (let i = 0; i < AttackRange.length; i++) {
                    let ShiftedX = ThisX + AttackRange[i][0]
                    let ShiftedY = ThisY + AttackRange[i][1]

                    if (ShiftedX > 0 && ShiftedX <= 10 && ShiftedY > 0 && ShiftedX <= 10) {
                        scene.traverse(function (object) {
                            if (object.userData.Coordinate == `${ShiftedX},${ShiftedY}`) {
                                object.material.wireframe = true
                                object.userData.isClicked = true

                                ArrayOfCoords.push(`${ShiftedX},${ShiftedY}`)
                            }
                        })
                    }
                }
                isSelectingRange = ArrayOfCoords
                isSelectingMove = false
                document.querySelector(".move-button").classList.remove("options-menu-selected")
                isSelectingAttack = true
                document.querySelector(".attack-button").classList.add("options-menu-selected")

                isSelectingOriginalIndex = ((Number(object.userData.CharacterCoordinate.split(",")[0])-1) + ((Number(object.userData.CharacterCoordinate.split(",")[1])-1)*10))
            }
        })

        document.body.appendChild(AttackMenu)
    }
}
function OpenMoveMenu() {
    RemoveSelectedObjects()
    if (isSelectingMove == true) {
        isSelectingMove = false
        document.querySelector(".move-button").classList.remove("options-menu-selected")
    }
    else if (SelectedSquare != undefined) {
        if (document.querySelector(".popup-menu") != undefined) { document.querySelector(".popup-menu").remove() }
        scene.traverse(function (object) {
            if (object.userData.CharacterCoordinate == SelectedSquare) {
                let MoveRange = Characters[object.userData.CharacterName]["Range-movement"]
                console.log(MoveRange)

                let ThisCoord = object.userData.CharacterCoordinate
                let ThisX = Number(ThisCoord.split(",")[0])
                let ThisY = Number(ThisCoord.split(",")[1])

                var ArrayOfCoords = []

                for (let i = 0; i < MoveRange.length; i++) {
                    let ShiftedX = ThisX + MoveRange[i][0]
                    let ShiftedY = ThisY + MoveRange[i][1]

                    if (ShiftedX > 0 && ShiftedX <= 10 && ShiftedY > 0 && ShiftedX <= 10) {
                        scene.traverse(function (object) {
                            if (object.userData.Coordinate == `${ShiftedX},${ShiftedY}`) {
                                object.material.wireframe = true
                                object.userData.isClicked = true

                                ArrayOfCoords.push(`${ShiftedX},${ShiftedY}`)
                            }
                        })
                    }
                }
                isSelectingRange = ArrayOfCoords
                isSelectingMove = true
                document.querySelector(".move-button").classList.add("options-menu-selected")
                isSelectingAttack = false
                document.querySelector(".attack-button").classList.remove("options-menu-selected")

                isSelectingOriginalIndex = ((Number(object.userData.CharacterCoordinate.split(",")[0])-1) + ((Number(object.userData.CharacterCoordinate.split(",")[1])-1)*10))
            }
        })
    }
}

var isReady = false

function StartGameTest() {
    if (isReady) { isReady = false }
    else { isReady = true }
    db.ref(`${GameCode}-IsReady`).once('value').then(function(snapshot) {
        let Value = JSON.parse(snapshot.val());
        console.log("VALUE: " + Value)
        if (Value == "0,0") {
            if (isReady) { db.ref(`${GameCode}-IsReady`).set(JSON.stringify([1,0])) }
        }
        else if (Value == "1,0") {
            if (isReady) { db.ref(`${GameCode}-IsReady`).set(JSON.stringify([1,1])) }
            else { db.ref(`${GameCode}-IsReady`).set(JSON.stringify([0,0])) }
        }
        else if (Value == "0,1") {
            if (isReady) { db.ref(`${GameCode}-IsReady`).set(JSON.stringify([1,1])) }
            else { db.ref(`${GameCode}-IsReady`).set(JSON.stringify([0,0])) }
        }
        else {
            if (!isReady) { db.ref(`${GameCode}-IsReady`).set(JSON.stringify([1,0])) }
        }
    })
}
document.querySelector(".start-button").addEventListener("click", StartGameTest)

db.ref(`${GameCode}-IsReady`).on("value", (snapshot) => {
    let Value = JSON.parse(snapshot.val());

    if (Value == "0,0") {
        document.querySelector(".start-button").innerHTML = `Start Game <br> (0 / 2)`
    }
    else if (Value == "1,0") {
        document.querySelector(".start-button").innerHTML = `Start Game <br> (1 / 2)`
    }
    else if (Value == "0,1") {
        document.querySelector(".start-button").innerHTML = `Start Game <br> (1 / 2)`
    }
    else {
        document.querySelector(".start-button").remove()
        scene.traverse(function (object) {
            if (object.userData.ObjectType == "Square") {
                object.material.wireframe = false
            }
        })
    
        SelectedCharacter = undefined
    
        document.querySelector(".character-menu").remove()
        isBuildMode = false
    
        let OptionsMenu = document.createElement("div")
        let AttackButton = document.createElement("button")
        let MoveButton = document.createElement("button")
    
        let NextButton = document.createElement("button")
    
        OptionsMenu.classList.add("options-menu")
        AttackButton.classList.add("attack-button")
        MoveButton.classList.add("move-button")
    
        NextButton.classList.add("next-button")
        if (TeamIsWhite == "false") { NextButton.style.display = "none" }
    
        AttackButton.addEventListener("click", OpenAttackMenu)
        MoveButton.addEventListener("click", OpenMoveMenu)
    
        NextButton.addEventListener("click", function() {
            //Check if its your turn:
            db.ref(`${GameCode}-Turn`).once('value').then(function(snapshot) {
                let Value = snapshot.val();
                if (Value == TeamIsWhite) {
                    for (let i = 0; i < StartingGrid.length; i++) {
                        StartingGrid[i].hasPlayed = false
                    }
                    RenderGrid()
                    if (TeamIsWhite == "true") { db.ref(`${GameCode}-Turn`).set("false") }
                    else { db.ref(`${GameCode}-Turn`).set("true") }
                }
            })
        })
    
        OptionsMenu.appendChild(AttackButton)
        OptionsMenu.appendChild(MoveButton)
    
        document.body.appendChild(OptionsMenu)
        document.body.appendChild(NextButton)
    }
})

db.ref(`${GameCode}-Turn`).on("value", (snapshot) => {
    try {
        let Value = snapshot.val()
        if (Value == TeamIsWhite) { document.querySelector(".next-button").style.display = "block" }
        else { document.querySelector(".next-button").style.display = "none" }
    }
    catch{}
})


});