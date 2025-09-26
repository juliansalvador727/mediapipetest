"use client";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { useRef, useEffect } from "react";
import * as Tone from "tone";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let lastVideoTime = -1;

    // piano
    const fingertipIndices = [4, 8, 12, 16, 20];
    const leftHandNotes = ["G4", "E4", "D4", "C4", "A3"];
    const rightHandNotes = ["G5", "E5", "D5", "C5", "A4"];

    const synth = new Tone.Sampler({
      urls: {
        A3: "A3.mp3",
        C4: "C4.mp3",
        D4: "D4.mp3",
        E4: "E4.mp3",
        G4: "G4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        D5: "D5.mp3",
        E5: "E5.mp3",
        G5: "G5.mp3",
      },
      baseUrl: "/samples/piano/",
    }).toDestination();

    let activeKeys = new Set<string>();
    function playNoteOnce(note: string, fingerId: number) {
      const keyId = `${fingerId}-${note}`;
      if (!activeKeys.has(keyId)) {
        activeKeys.add(keyId);
        synth.triggerAttackRelease(note, "8n");
        setTimeout(() => activeKeys.delete(keyId), 300);
      }
    }

    // vid / canvas
    async function init() {
      // load vision
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      // load model
      handLandmarker = await HandLandmarker.createFromModelPath(
        vision,
        "/models/hand_landmarker.task"
      );

      await handLandmarker.setOptions({ runningMode: "VIDEO", numHands: 2 });

      // load webcam
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        renderLoop();
      }
    }

    function processResults(detections: any) {
      const canvas = canvasRef.current;

      // if canvasRef.current doesn't exist return
      if (!canvas) {
        console.log("canvas DNE");
        return;
      }
      const ctx = canvas.getContext("2d");
      // if we cant getContext return
      if (!ctx) {
        return;
      }

      // clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // if we cant get landmarks return
      if (!detections?.landmarks) return;

      // draw landmarks
      const drawingUtils = new DrawingUtils(ctx);

      detections.landmarks.forEach((hand: any, handIndex: number) => {
        // draw full hand skeleton
        drawingUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {
          color: handIndex === 0 ? "red" : "blue",
          lineWidth: 3,
        });

        const thumb = hand[4];
        const fingertipIndices = [8, 12, 16, 20];
        fingertipIndices.forEach((idx, fingerOrder) => {
          const tip = hand[idx];

          // Euclidean distance (normalized coords)
          const dx = tip.x - thumb.x;
          const dy = tip.y - thumb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.05) {
            // assign note
            const note =
              handIndex === 0
                ? leftHandNotes[fingerOrder + 1] // skip thumb in leftHandNotes
                : rightHandNotes[fingerOrder + 1];
            playNoteOnce(note, idx + handIndex * 10);
          }

          // (Optional) draw a line between thumb and fingertip for debugging
          ctx.beginPath();
          ctx.moveTo(thumb.x * canvas.width, thumb.y * canvas.height);
          ctx.lineTo(tip.x * canvas.width, tip.y * canvas.height);
          ctx.strokeStyle = dist < 0.05 ? "lime" : "gray";
          ctx.stroke();
        });
      });
      console.log(detections);
    }

    function renderLoop() {
      const video = videoRef.current;

      // if there isnt a video return
      if (!video) {
        console.log("no video");
        return;
      }
      if (video.currentTime !== lastVideoTime) {
        const detections = handLandmarker.detectForVideo(
          video,
          performance.now()
        );
        processResults(detections);
        lastVideoTime = video.currentTime;
      }
      requestAnimationFrame(renderLoop);
    }
    init();
  }, []);

  return (
    <div className="relative w-[640px] h-[480px] mx-auto mt-8">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg shadow-lg transform -scale-x-100"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none transform -scale-x-100"
      />
    </div>
  );
}
