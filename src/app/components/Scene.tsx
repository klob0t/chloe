'use client'
import { OrthographicCamera, useGLTF, AsciiRenderer } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import React, { useRef } from 'react'
import * as THREE from 'three'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import styles from './scene.module.css'

function SafeAsciiRenderer(props: React.ComponentProps<typeof AsciiRenderer>) {
   const size = useThree(state => state.size)
   if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width === 0 || size.height === 0) {
      return null
   }
   return <AsciiRenderer {...props} />
}

interface GLTFData {
   nodes: {
      chloe001_1: THREE.Mesh
      chloe001_2: THREE.Mesh
      chloe002_1: THREE.Mesh
      chloe002_2: THREE.Mesh
      chloe003_1: THREE.Mesh
      chloe003_2: THREE.Mesh
      chloe004_1: THREE.Mesh
      chloe004_2: THREE.Mesh
      chloe005_1: THREE.Mesh
      chloe005_2: THREE.Mesh
   }
   materials: {
      ['Material.001']: THREE.MeshStandardMaterial
      Material: THREE.MeshStandardMaterial
   }
}

function AnimatedGroup({ children }: { children: React.ReactNode }) {
   return (
      <group
         scale={[2, 2, 3]}
         position={[0, 0, 0]}
         rotation={[
            0 * (Math.PI / 180),
            0 * (Math.PI / 180),
            0 * (Math.PI / 180),
         ]}>
         {children}
      </group>
   )
}

function AnimatedInnerGroups({ children }: { children: React.ReactNode }) {
   const groupRefs = [
      useRef<THREE.Group>(null),
      useRef<THREE.Group>(null),
      useRef<THREE.Group>(null),
      useRef<THREE.Group>(null),
      useRef<THREE.Group>(null),
   ]

   useGSAP(() => {
      const validGroups = groupRefs.map(ref => ref.current).filter(Boolean) as THREE.Group[]

      function createAnimationLoop() {
         validGroups.forEach((group, index) => {
            if (group) {
               gsap.to(group.position, {
                  y: 0.02,
                  duration: 0.2,
                  ease: 'power3.inOut',
                  delay: index * 0.06,
                  onComplete: () => {
                     gsap.to(group.position, {
                        y: 0,
                        duration: 0.1,
                        ease: "power3.inOut",
                        delay: 0
                     })
                  }
               })
            }
         })
      }

      createAnimationLoop()

      gsap.timeline({ repeat: -1 })
         .call(createAnimationLoop)
         .to({}, { duration: 1 })
   }, [])

   return (
      <>
         {React.Children.map(children, (child, index) => (
            <group ref={groupRefs[index]}>
               {child}
            </group>
         ))}
      </>
   )
}

export default function Scene() {
   const { nodes, materials } = useGLTF('/logo3.glb') as unknown as GLTFData

   return (
      <Canvas
         className={styles.canvas}
         shadows
         dpr={[0.6, 1]}
         gl={{
            antialias: false,
            powerPreference: 'high-performance'
         }}
         style={{
            width: '100vw',
            height: '20vh',
            background: 'transparent',
            left: '4%',
         }}>
         <AnimatedGroup>
            <AnimatedInnerGroups>
               <group>
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe001_1.geometry}
                     material={materials['Material.001']}
                  />
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe001_2.geometry}
                     material={materials.Material}
                  />
               </group>
               <group>
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe002_1.geometry}
                     material={materials['Material.001']}
                  />
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe002_2.geometry}
                     material={materials.Material}
                  />
               </group>
               <group>
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe003_1.geometry}
                     material={materials['Material.001']}
                  />
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe003_2.geometry}
                     material={materials.Material}
                  />
               </group>
               <group>
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe004_1.geometry}
                     material={materials['Material.001']}
                  />
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe004_2.geometry}
                     material={materials.Material}
                  />
               </group>
               <group>
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe005_1.geometry}
                     material={materials['Material.001']}
                  />
                  <mesh
                     castShadow
                     receiveShadow
                     geometry={nodes.chloe005_2.geometry}
                     material={materials.Material}
                  />
               </group>
            </AnimatedInnerGroups>
            <color attach="background" args={['black']} />
            <directionalLight
               position={[0, 3, 1]}
               intensity={100}
               color='white'
            />
            <ambientLight
               position={[0, 0, 0]}
               intensity={0}
            />
         </AnimatedGroup>
         <SafeAsciiRenderer
            characters=" X:>:0|/"
            bgColor="transparent"
            fgColor="#4893f5"
            invert={false}
            resolution={0.25}
         />
         <OrthographicCamera
            makeDefault
            near={0}
            zoom={200}
            far={700}
            position={[0, 0, 6]}
         />
      </Canvas>
   )
}

useGLTF.preload('/logo3.glb')
