"use client";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { drawConnectors } from "@mediapipe/drawing_utils";
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

      await handLandmarker.setOptions({ runningMode: "VIDEO" });

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

      const HAND_CONNECTIONS: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4], // Thumb
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8], // Index
        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12], // Middle
        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16], // Ring
        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20], // Pinky
      ];
      detections.landmarks.forEach((hand: any, handIndex: number) => {
        // hand.forEach((point: any) => {
        //   ctx.beginPath();
        //   ctx.arc(
        //     point.x * canvas.width,
        //     point.y * canvas.height,
        //     5,
        //     0,
        //     2 * Math.PI
        //   );
        //    ctx.fillStyle = handIndex === 0 ? "green" : "blue";
        //    ctx.fill();
        // });

        drawConnectors(ctx, hand, HAND_CONNECTIONS, {
          color: handIndex === 0 ? "#00FF00" : "#0000FF",
          lineWidth: 5,
        });
      });
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
        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg shadow-lg"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
