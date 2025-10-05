'use client'
import { OrthographicCamera, useGLTF, AsciiRenderer, Environment, OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import React from 'react'
import * as THREE from 'three'

interface GLTFData {
   nodes: {
      chloe: THREE.Mesh
   }
}

export default function Scene() {
   const { nodes } = useGLTF('/logo.glb') as unknown as GLTFData

   return (
      <Canvas
         shadows
         dpr={[0.6, 0.8]}
         gl={{
            antialias: false,
            powerPreference: 'high-performance'
         }}
         style={{
            width: '100dvw',
            height: '100dvh',
            position: 'fixed',
            background: 'transparent',
            left: '0',
         }}
      >
         <spotLight
            castShadow
            position={[-0.2, -1, 0]}
            intensity={20}
         />
         
         <spotLight
            castShadow
            position={[0.2, 2, 0]}
            intensity={20}
         />
         {/* <pointLight
            position={[-1, 1, 1]}
            intensity={10}
         /> */}

         <ambientLight
            castShadow
            position={[0, 10, 0]}
            intensity={0}
         />

         <group
            rotation={[
               0 * (Math.PI / 180),
               -60 * (Math.PI / 180),
               0 * (Math.PI / 180),
            ]}
         >
            <mesh
               castShadow
               geometry={nodes.chloe.geometry}
            >
               <meshStandardMaterial />
            </mesh>
         </group>
         <AsciiRenderer
            characters=" ``-`.="
            bgColor="transparent"
            fgColor="#4893f5"
            invert={false}
            resolution={0.2}
         />
         <OrthographicCamera
            makeDefault
            near={0}
            zoom={400}
            far={2000}
            position={[-60, 10, 0]}
         />
         <OrbitControls />
      </Canvas>
   )
}

useGLTF.preload('/logo.glb')