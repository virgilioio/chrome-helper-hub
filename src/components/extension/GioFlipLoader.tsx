import React, { useState, useEffect } from 'react';
import { getSafeExtensionUrl } from '@/lib/chromeApi';

// All 5 Gio face images
const GIO_FACES = [
  'gio-face-1.png', // Yellow - front
  'gio-face-2.png', // Purple - slight turn
  'gio-face-3.png', // Blue - side
  'gio-face-4.png', // Pink - other side
  'gio-face-5.png', // Green - tilted
];

interface GioFlipLoaderProps {
  size?: number;
  className?: string;
}

/**
 * A cute animated loader that shows Gio's face doing a coin-flip rotation
 * with physics-like easing and pauses between flips.
 */
export const GioFlipLoader: React.FC<GioFlipLoaderProps> = ({ 
  size = 48,
  className = '' 
}) => {
  const [currentFace, setCurrentFace] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    // Animation cycle:
    // 1. Show face for 800ms
    // 2. Flip (300ms) while changing image
    // 3. Show next face for 800ms
    // 4. Repeat
    
    const flipDuration = 300;
    const pauseDuration = 800;
    
    const animate = () => {
      // Start flip
      setIsFlipping(true);
      
      // Mid-flip: change the face
      setTimeout(() => {
        setCurrentFace(prev => (prev + 1) % GIO_FACES.length);
      }, flipDuration / 2);
      
      // End flip
      setTimeout(() => {
        setIsFlipping(false);
      }, flipDuration);
    };

    // Initial pause before first flip
    const initialTimeout = setTimeout(animate, pauseDuration);
    
    // Set up the repeating animation
    const interval = setInterval(animate, flipDuration + pauseDuration);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const faceUrl = getSafeExtensionUrl(GIO_FACES[currentFace]) || `/${GIO_FACES[currentFace]}`;

  return (
    <div 
      className={`gio-flip-loader ${className}`}
      style={{
        width: size,
        height: size,
        perspective: '200px',
      }}
    >
      <img
        src={faceUrl}
        alt="Loading..."
        className="gio-flip-face"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
          transition: `transform 150ms ${isFlipping ? 'ease-in' : 'ease-out'}`,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  );
};
