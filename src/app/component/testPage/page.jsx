'use client'; 

import React, { memo, useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

const styles = {
    pageContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        minHeight: '100vh',
        background: '#1a1a2e', 
        color: 'white',
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        marginBottom: '2rem',
        borderRadius: '5px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
    },
    imageWrapper: {
        position: 'relative',
        width: '300px',  
        height: '375px', 
        backgroundColor: '#000B2E', 
        overflow: 'hidden',
        border: '1px solid #333',
    },
    pixelGrid: {
        display: 'grid',
        width: '100%',
        height: '100%',
        
        gridTemplateColumns: `repeat(17, 1fr)`,
        gridTemplateRows: `repeat(21, 1fr)`,
    },
    pixelDiv: {
        width: '100%',
        height: '100%',
        
    },
    generatedImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    }
};



const COL_NUM_TEST = 17;
const ROW_NUM_TEST = 21;
const PIXEL_COLORS = ['#000B2E', '#0963B3', '#2E9DFF', '#00084D'];



const PixelGrid = memo(() => (
    <div style={styles.pixelGrid}>
        {Array.from({ length: COL_NUM_TEST * ROW_NUM_TEST }).map((_, i) => (
            <div key={i} style={styles.pixelDiv} className="test-pixel-div" />
        ))}
    </div>
));
PixelGrid.displayName = 'PixelGrid';


function ImageRevealForTest({ status, imageUrl }) {
    const wrapperRef = useRef(null);
    
    
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const handleImageLoad = () => setIsImageLoaded(true);
    const imageRef = useRef()


    useEffect(() => {
        console.log("ImageReveal Test - Current Status:", status);
        if (!wrapperRef.current) {
            console.error("ImageReveal Test - wrapperRef.current IS NULL. Cannot proceed.");
            return;
        }
        console.log("ImageReveal Test - wrapperRef.current exists:", wrapperRef.current);

        const pixels = gsap.utils.toArray(".test-pixel-div", wrapperRef.current);
        console.log(`ImageReveal Test - Found ${pixels.length} pixel divs.`);
        const image = imageRef.current

        if (status === 'loading') {
            console.log("ImageReveal Test - Status is 'loading'. Attempting to make visible.");
            gsap.set(wrapperRef.current, { visibility: 'visible', opacity: 1 });

            const tl = gsap.timeline()

            if (pixels.length > 0) {
                tl.set(pixels, {
                    scale: 0.5,
                    backgroundColor: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
                    autoAlpha: 1
                }).to(pixels, {
                    duration: 0.1,
                    backgroundColor: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
                    stagger: {
                        from: 'random',
                        amount: 1,
                        ease: 'power1.inOut',
                        repeat: -1,
                        repeatRefresh: true
                    }
                })
                console.log("ImageReveal Test - Pixels set to RED and visible.");
            } else {
                console.log("ImageReveal Test - No pixels found to make red.");
            }
        } else if (status === 'revealing') {
            console.log("ImageReveal Test - Status is 'revealing'. Attempting to make visible.");
            gsap.set(wrapperRef.current, { visibility: 'visible', opacity: 1 });
            const image = imageRef.current

            if (pixels.length > 0) {
                const tl = gsap.timeline()
                tl.set(pixels, { autoAlpha: 1 })
                  .set(image, { opacity: 0 })
                
                .to(pixels, {
                    scale: 1,
                    ease: 'steps(2)',
                    duration: 0.01,
                    stagger: {
                        amount: 1,
                        ease: 'power2.out',
                        from: 'random'
                    }
                }).to(pixels, {
                    autoAlpha: 0,
                    duration: 0.1,
                    stagger: {
                        amount: 1,
                        ease: 'none',
                        from: 'random'
                    }
                },'+=0.1').to(image, {
                    opacity: 1,
                    duration: 0.1
                },'<')
                console.log("ImageReveal Test - Pixels set to BLUE and visible.");
            } else {
                console.log("ImageReveal Test - No pixels found to make blue.");
            }
        } else { 
            console.log("ImageReveal Test - Status is NOT 'loading' or 'revealing'. Setting wrapper to hidden.");
            gsap.set(wrapperRef.current, { visibility: 'hidden', opacity: 0 });
        }
    }, [status]);

    return (
        <div ref={wrapperRef} style={{ ...styles.imageWrapper, visibility: 'hidden' }}>
            {/* For this initial test, we don't strictly need the image, 
                but it's good to have the structure. You can provide a dummy URL. */}
            {imageUrl && <img ref={imageRef} src={imageUrl} alt="Test Image" onLoad={handleImageLoad} style={styles.generatedImage} />}
            <PixelGrid />
        </div>
    );
}


export default function TestImageRevealPage() {
    const [currentStatus, setCurrentStatus] = useState('idle'); 
    const [imageUrl, setImageUrl] = useState(null);

    const handleToggleStatus = () => {
        if (currentStatus === 'idle') {
            setCurrentStatus('loading');
            setImageUrl(null); 
        } else if (currentStatus === 'loading') {
            setCurrentStatus('revealing');
        } else { 
            setCurrentStatus('idle');
            setImageUrl(null);
        }
    };

    let buttonText = "Start Loading";
    if (currentStatus === 'loading') buttonText = "Switch to Reveal State";
    if (currentStatus === 'revealing') buttonText = "Reset to Idle";

    return (
        <div style={styles.pageContainer}>
            <h1>ImageReveal Isolation Test</h1>
            <button onClick={handleToggleStatus} style={styles.button}>
                {buttonText}
            </button>
            <p>Current Status for ImageReveal: <strong>{currentStatus}</strong></p>

            <ImageRevealForTest status={currentStatus} imageUrl={imageUrl} />
        </div>
    );
}