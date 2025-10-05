import { MeshTransmissionMaterial, OrthographicCamera, useGLTF } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import * as THREE from 'three'

extend(THREE as any)

export default function Scene() {
   const { nodes } = useGLTF('/logo.glb')

   return (
      <Canvas
         style={{
            width: '100dvw',
            height: '100dvh',
            position: 'fixed',
            background: 'transparent'
         }}
      >
         <group
            rotation={[
               90 * (Math.PI / 180),
               0 * (Math.PI / 180),
               -20 * (Math.PI / 180)
            ]}
         >
            <mesh
               geometry={nodes.chloe.geometry}>
               <meshBasicMaterial />
            </mesh>
         </group>
         <OrthographicCamera
            makeDefault
            near={0}
            far={2000}
            position={[0, 0, 10]}
         />
      </Canvas>
   )
}