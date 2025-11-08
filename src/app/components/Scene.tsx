'use client'
import { OrthographicCamera, useGLTF } from "@react-three/drei"
import type { AsciiRendererProps } from "@react-three/drei/core/AsciiRenderer"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import React, { createRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { AsciiEffect } from 'three-stdlib'
import styles from './scene.module.css'

type GroupChildElement = React.ReactElement<JSX.IntrinsicElements['group'] & { userData?: Record<string, unknown> }>

function SafeAsciiRenderer({
   renderIndex = 1,
   bgColor = 'black',
   fgColor = 'white',
   characters = ' .:-+*=%@#',
   invert = true,
   color = false,
   resolution = 0.15
}: AsciiRendererProps) {
   const { size, gl, scene, camera } = useThree()
   const hasValidSize = useRef(false)

   const effect = useMemo(() => {
      const ascii = new AsciiEffect(gl, characters, { invert, color, resolution })
      ascii.domElement.style.position = 'absolute'
      ascii.domElement.style.top = '0px'
      ascii.domElement.style.left = '0px'
      ascii.domElement.style.pointerEvents = 'none'
      return ascii
   }, [gl, characters, invert, color, resolution])

   useLayoutEffect(() => {
      effect.domElement.style.color = fgColor
      effect.domElement.style.backgroundColor = bgColor
   }, [effect, fgColor, bgColor])

   useEffect(() => {
      const parent = gl.domElement.parentNode
      if (!parent) {
         return
      }

      gl.domElement.style.opacity = '0'
      parent.appendChild(effect.domElement)

      return () => {
         gl.domElement.style.opacity = '1'
         parent.removeChild(effect.domElement)
      }
   }, [effect, gl.domElement])

   useEffect(() => {
      const width = Number.isFinite(size.width) ? Math.floor(size.width) : 0
      const height = Number.isFinite(size.height) ? Math.floor(size.height) : 0

      if (width <= 0 || height <= 0) {
         hasValidSize.current = false
         effect.domElement.style.display = 'none'
         return
      }

      effect.domElement.style.display = 'block'
      effect.setSize(width, height)
      hasValidSize.current = true
   }, [effect, size.width, size.height])

   useFrame(() => {
      if (!hasValidSize.current) {
         return
      }
      effect.render(scene, camera)
   }, renderIndex)

   return null
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
   const { width } = useThree(state => state.viewport)

   const responsiveScale = useMemo(() => {
      const factor = Math.min(Math.max(width / 6, 0.8), 1)
      return [2 * factor, 1 * factor, 2 * factor] as const
   }, [width])

   return (
      <group
         scale={responsiveScale}
         position={[0, 0, 0]}
         rotation={[
            90 * (Math.PI / 180),
            0 * (Math.PI / 180),
            -10 * (Math.PI / 180),
         ]}>
         {children}
      </group>
   )
}

function AnimatedInnerGroups({ children }: { children: React.ReactNode }) {
   const childArray = useMemo(() => React.Children.toArray(children), [children])
   const groupRefs = useMemo(
      () => childArray.map(() => createRef<THREE.Group>()),
      [childArray]
   )

   useGSAP(() => {
      const validGroups = groupRefs
         .map(ref => ref.current)
         .filter((group): group is THREE.Group => !!group)

      const positionTweens = validGroups.map((group, index) => {
         const initialZ = group.position.z
         return gsap.timeline({ repeat: -1, delay: index * 0.1 })
            .to(group.position, {
               z: initialZ - 0.02,
               duration: 0.4,
               ease: 'power3.out'
            })
            .to(group.position, {
               z: initialZ,
               duration: 1,
               ease: 'power3.inOut'
            }, '<0.2')
      })

      const rotationTweens = validGroups.map((group, index) =>
         gsap.timeline({ repeat: -1, delay: index * 0.15 })
            .to(group.rotation, {
               z: `+=-${(Math.PI * 2).toFixed(3)}`,
               duration: 2,
               ease: 'power4.inOut'
            })
            .to({}, { duration: 2 })
      )

      return () => {
         positionTweens.forEach(tween => tween.kill())
         rotationTweens.forEach(tween => tween.kill())
      }
   }, [groupRefs])

   return (
      <>
         {childArray.map((child, index) => {
            if (!React.isValidElement(child)) {
               return child
            }

            const existingUserData = (child.props as { userData?: Record<string, unknown> }).userData ?? {}

            const element = child as GroupChildElement

            return React.cloneElement(element, {
               ref: groupRefs[index],
               key: child.key ?? `inner-group-${index}`,
               userData: { ...existingUserData, slot: index }
            })
         })}
      </>
   )
}

export default function Scene() {
   const { nodes, materials } = useGLTF('/logo3.glb') as unknown as GLTFData

   return (
      <Canvas
         className={styles.canvas}
         shadows
         gl={{
            antialias: false,
            powerPreference: 'high-performance'
         }}
         style={{
            width: '100vw',
            height: '40vh',
            background: 'transparent',
         }}>
         <AnimatedGroup>
            <AnimatedInnerGroups>
               <group position={[-0.39, 0.09, 0.018]}>
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
               <group position={[-0.181, 0.09, 0.018]}>
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
               <group position={[-0.024, 0.09, 0.018]}>
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
               <group position={[0.192, 0.09, 0.018]}>
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
               <group position={[0.41, 0.09, 0.018]}>
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
               position={[-1, 4, -1]}
               intensity={26}
               castShadow
               color='white'
            />
            <ambientLight
               position={[0, 1, 0]}
               intensity={0}
            />
         </AnimatedGroup>
         <SafeAsciiRenderer
            characters=" 010!?X>!x<—"
            bgColor="transparent"
            fgColor="#4893f5"
            invert={false}
            resolution={0.15}
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