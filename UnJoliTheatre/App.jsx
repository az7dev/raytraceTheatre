import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import studio from "@theatre/studio";
import { getProject } from "@theatre/core";
import { editable as e, SheetProvider } from "@theatre/r3f";
import extension from "@theatre/r3f/dist/extension";
import { PerspectiveCamera } from "@theatre/r3f";
import { Model } from "./Model";
import GLTFAnimStart from './GLTFAnimStart'
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";
import useCapture from "use-capture";
import projectstate from "./custom.json";
import {VRButton,RayGrab} from "@react-three/xr";
import {XR,Controllers,Hands} from "@react-three/xr";
import XRPlayer from "./xrplayer";
import XRSessionManager from "./XRsessionManager";
import * as THREE from "three";
import Controls from "./UnJoliTheatre/Controls";
import setRaycaster from "./UnJoliTheatre/Raycaster";
import AddToSheet from "./UnJoliTheatre/Theatre";
import UnJoliTheatre from "./UnJoliTheatre/main";
// initialize the studio
studio.initialize();
studio.extend(extension);

const raycaster = new THREE.Raycaster();
const chukSheet = getProject("Chuk Project",{state:projectstate}).sheet("Chuk Sheet");
const TestObject = chukSheet.object("box", { position: { x: 0, y: 0, z:5 } })
console.log("TestObject", TestObject);
const EditableCamera=e(OrthographicCamera,'orthographicCamera')


const saveFile = () => {
  const json = studio.createContentOfSaveFile("Chuk Project");
  const jsonString = JSON.stringify(json);
  const blob = new Blob([jsonString], {type: "application/json"});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'ChukProject.json';
  link.click();
};

const playSequence = () => {
  chukSheet.sequence.play();
};

function App() {
//play character animation

  
  const [isPlaying, setIsPlaying] = useState(false);
  const cameraRef = useRef(null);
  const [defaultCamera, setDefaultCamera] = useState("Camera");
  const [meshes, setMeshes] = useState([]);
  const [xr, setXR] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false); 

  if (window.UnJoliTheatre && window.UnJoliTheatre.raycaster) {
    // Access the Raycaster associated with UnJoliTheatre
    const unjolitheatreRaycaster = window.UnJoliTheatre.raycaster;

    // Ensure the Raycaster is available
    if (unjolitheatreRaycaster) {
      // Initialize the Raycaster with the necessary components
      const { camera, renderer, controls } = unjolitheatreRaycaster;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let intersected = undefined;


      // Use the Raycaster for raycasting and interaction
      // For example, you can call setRaycaster() to set up raycasting logic
      setRaycaster();
      
    }
  } else {
    console.error('UnJoliTheatre or UnJoliTheatre.raycaster is undefined');
  }
  useEffect(() => {
    console.log("Camera Position:", cameraPosition);
    if (cameraRef.current) {
      console.log("Camera Ref Position:", cameraRef.current.position);
    }
  }, [cameraPosition, cameraRef]);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };  

  const [bind,startRecording] = useCapture({
    duration: 5,
    fps: 60,
  });

  const addMesh = (type) => {
    setMeshes([...meshes, { type, id: Math.random() }]);
    setDefaultCamera(cameraRef.current);
    updateCameraPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  };

  const deleteMesh = () => {
    chukSheet.detachObject("character"); // Function to delete mesh in the sheet by selecting them
    //chukSheet.detachObject(); // Function to delete mesh in the sheet by selecting them
  };

  const updateCameraPosition = (x, y, z) => {
    setCameraPosition({ x, y, z });
  };

  const importModel = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const modelId = Math.random().toString();
      const modelMesh = {
        type: 'custom',
        id: modelId,
        url: url,
        theatreKey: `customModel-${modelId}`
      };
      setMeshes([...meshes, modelMesh]);
      chukSheet.AddToSheet(modelMesh.theatreKey, {object: modelMesh, type: 'Model'});
    }
  };

  return (
    <>
      <div
        className="h-full"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "20px",
        }}
      >
        <div style={{flex: 1,alignItems:"center"}} >
          <button onClick={saveFile}>💾 Save</button>
          <button onClick={playSequence}>▶️ Play</button>
          <button onClick={toggleAnimation}>
          {isPlaying ? 'Stop Animation' : 'Start Animation'}
          </button>       
          <button onClick={() => setDefaultCamera("Camera")}>📷 pers Camera</button>
          <button onClick={() => setDefaultCamera("Camera1")}>📷Pers Camera1</button>
          <button onClick={() => setDefaultCamera("Camera2")}>📷 Ortho Camera2</button>
          <button className="recording" onClick={startRecording}>
            {/* {isRecording ? "Recording..." : "Start Recording"} */}🔴 Record 
          </button>
          <button onClick={() => addMesh("cube")}>🔲 Add Cube</button>
          <button onClick={() => addMesh("sphere")}>🔵 Add Sphere</button>
          <button onClick={deleteMesh}>🗑️ Delete</button>
          <input type="file" accept=".glb" onChange={importModel} />
        </div>
        <VRButton/>
        <Canvas
          style={{
            backgroundColor: "#111a21",
            width: "80vw",
            height: "90vh",
            flex: 3
          }}
          gl={{
            preserveDrawingBuffer: true,
          }}
          onCreated = { bind }
        >

          <color attach="background" args={["#001"]} />
          <XR 
                  onSessionStart={()=>{
                  console.log("Session started")
                  setXR(true);
                  }} 
                  onSessionEnd={()=>{
                  console.log("Session ended")
                  setXR(false);
                  }}
          >
          <SheetProvider sheet={chukSheet}>
            <OrbitControls />
            <e.pointLight
              theatreKey="Light 1"
              color="green"
              intensity={2}
              position={[-1, 1, 4]}
            />
            <e.pointLight
              theatreKey="Light 2"
              color="yellow"
              intensity={1}
              position={[1, 0, -1]}
            />
            <e.mesh theatreKey="rectangle"  position={[1, 1, -3]} >
              <boxGeometry args={[1, 1, 4]} />
              <meshStandardMaterial color="#0c181f" />
            </e.mesh>
            {meshes.map(mesh => (
              <e.mesh key={mesh.id} theatreKey={mesh.type} position={[2, -2, -1]} config={{reconfigure: true}}>
                {mesh.type === "cube" && <boxGeometry args={[1, 1, 1]} />}
                {mesh.type === "sphere" && <sphereGeometry args={[1, 32, 32]} />}
                {mesh.type === "plane" && <planeGeometry args={[0, 0]} />}
                {mesh.type === "custom" && <Model url={mesh.url} />}
                {<meshStandardMaterial color="#DD5411" />}
              </e.mesh>
            ))}
            {xr && (
              <>
                  <XRPlayer />
                  <Controllers/>              
              </>
            )}
            <PerspectiveCamera
              theatreKey="Camera1"
              makeDefault={defaultCamera === "Camera1"}
              position={[0, 0, -5]}
              fov={75}
            />
           
            <PerspectiveCamera
              ref={cameraRef}
              theatreKey="Camera"
              makeDefault={defaultCamera === "Camera"}
              position={[5, 1, -5]}
              fov={75}
            />
            <EditableCamera
              theatreKey="Camera2"
              makeDefault={defaultCamera === "Camera2"}
              position={[0, 0, 5]}
              zoom={10}
            />
            <RayGrab>
            <e.mesh theatreKey="character" position={[-1, -0.9, 0]} rotation={[-10, -10, 10]}>
              <GLTFAnimStart isPlaying={isPlaying} />
            </e.mesh>
            <e.mesh theatreKey="rabbit1" position={[-1, -0.9, 0]}>
              {<Model url='LisaRabbit1.glb' />}
            </e.mesh>
            <e.mesh theatreKey="rabbit2" position={[-1, -0.5, 0]}>
              {<Model url='LisaRabbit2.glb' />}
            </e.mesh>
            <e.mesh theatreKey="rabbit3" position={[-1, -0.5, 0]}>
              {<Model url='LisaRabbit3.glb' />}
            </e.mesh>
            <e.mesh theatreKey="rabbit4" position={[-1, -0.5, 0]}>
              {<Model url='LisaRabbit4.glb' />}
            </e.mesh>
            <e.mesh theatreKey="rabbit5" position={[-1, -0.5, 0]}>
              {<Model url='LisaRabbit5.glb' />}
            </e.mesh>
            <e.mesh theatreKey="rabbit6" position={[-1, -0.5, 0]}>
              {<Model url='LisaRabbit6.glb' />}
            </e.mesh>
            <e.mesh theatreKey="moon" scale={[4, 4, 4]}>
              {<Model url='whitemoon.glb' />}
            </e.mesh>
            <e.mesh theatreKey="floor" position={[-1, -0.5, 0]} scale={[5, 5, 5]} >
              {<Model url='moon-crater.glb' />}
            </e.mesh>
            </RayGrab>
          </SheetProvider>
          {/* <Recorder
            duration={2}
            framerate={60}
            motionBlurFrames={1}
            filename={"my-recording"}
          /> */}
          </XR>
        </Canvas>
      </div>
    </>
  );
}

export default App;























































