"use client";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { useRef, useEffect } from "react";
// const vision = await FilesetResolver.forVisionTasks(
//   "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
// );

// const handLandmarker = await HandLandmarker.createFromModelPath(
//   vision,
//   "../shared/hand_landmarker.task"
// );

// await handLandmarker.setOptions({ runningMode: "VIDEO" });

// let lastVideoTime = -1;
// function renderLoop(): void {
//   const video = document.getElementById("video");

//   if (video.currentTime !== lastVideoTime) {
//     const detections = handLandmarker.detectForVideo(video);
//     processResults(detections);
//     lastVideoTime = video.currentTime;
//   }

//   requestAnimationFrame(() => {
//     renderLoop();
//   });
// }
export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let lastVideoTime = -1;

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

        // draw all landmarks as small points
        // drawingUtils.drawLandmarks(hand, {
        //   color: handIndex === 0 ? "green" : "cyan",
        //   radius: 3,
        // });

        // extra: highlight fingertips (landmarks 4, 8, 12, 16, 20)
        // const fingertipIndices = [4, 8, 12, 16, 20];
        // fingertipIndices.forEach((idx) => {
        //   const pt = hand[idx];
        //   ctx.beginPath();
        //   ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
        //   ctx.fillStyle = "yellow";
        //   ctx.fill();
        // });
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
