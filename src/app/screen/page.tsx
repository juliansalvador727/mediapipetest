"use client";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
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

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let lastVideoTime = -1;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      handLandmarker = await HandLandmarker.createFromModelPath(
        vision,
        "/models/hand_landmarker.task"
      );

      await handLandmarker.setOptions({ runningMode: "VIDEO" });

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
      console.log(detections);
    }

    function renderLoop() {
      const video = videoRef.current;
      if (video === null) {
        console.log("video is null");
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
    <div className="flex flex-col items-center">
      <video
        ref={videoRef}
        id="video"
        style={{ width: "640px", height: "480px" }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        id="output_canvas"
        width="640"
        height="480"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}
