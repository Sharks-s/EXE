import { useState, useEffect, useRef } from "react";

interface PetAnimationProps {
    code: string;
    activity: string;
    fps?: number;
}

export function PetAnimation({ code, activity, fps = 10 }: PetAnimationProps) {
    const [frame, setFrame] = useState(0);
    const [fallback, setFallback] = useState(false);
    const maxFramesRef = useRef<number | null>(null);

    // Reset when props change
    useEffect(() => {
        setFrame(0);
        setFallback(false);
        maxFramesRef.current = null;
    }, [code, activity]);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(prev => {
                if (maxFramesRef.current !== null) {
                    return (prev + 1) % maxFramesRef.current;
                }
                return prev + 1; // keep incrementing until onError
            });
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [fps]);

    const handleError = () => {
        if (frame === 0 && !fallback) {
            setFallback(true);
            return;
        }

        if (maxFramesRef.current === null && !fallback) {
            maxFramesRef.current = frame > 0 ? frame : 1;
            setFrame(0);
        }
    };

    const imgSrc = fallback 
        ? `/pet/${code}/working/bot_0.png` 
        : `/pet/${code}/${activity}/bot_${frame}.png`;

    return (
        <img 
            src={imgSrc} 
            alt={activity} 
            onError={handleError}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
    );
}
