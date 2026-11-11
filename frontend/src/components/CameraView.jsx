import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

import "./CameraView.css";

export default function CameraView({
  shape = "face",
  children,
  onCapture,
  onReadyChange,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(true);

  const [checks, setChecks] = useState({
    lighting: "checking",
    face: "checking",
    position: "checking",
    size: "checking",
  });

  const [message, setMessage] = useState("Starting camera...");

  const isReady =
    checks.lighting === "good" &&
    checks.face === "good" &&
    checks.position === "good" &&
    checks.size === "good";

  useEffect(() => {
    onReadyChange?.(isReady);
  }, [isReady, onReadyChange]);

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      try {
        // 1. Load MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        );

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/" +
              "face_detector/blaze_face_short_range/" +
              "float16/1/blaze_face_short_range.tflite",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.7,
        });

        detectorRef.current = detector;

        // 2. Start real webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = resolve;
          });

          await videoRef.current.play();
        }

        if (!cancelled) {
          setLoading(false);
          setMessage("Looking for your face...");
          detectLoop();
        }
      } catch (error) {
        console.error("Camera initialisation error:", error);

        if (error.name === "NotAllowedError") {
          setCameraError(
            "Camera permission was denied. Please allow camera access.",
          );
        } else if (error.name === "NotFoundError") {
          setCameraError("No camera was found on this device.");
        } else {
          setCameraError("Unable to start the camera. Please try again.");
        }

        setLoading(false);
      }
    }

    initialise();

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (detectorRef.current) {
        detectorRef.current.close();
      }
    };
  }, []);

  function detectLoop() {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector) return;

    function processFrame() {
      if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const now = performance.now();

          const result = detector.detectForVideo(video, now);

          analyseFrame(result);
        } catch (error) {
          console.error("Face detection error:", error);
        }
      }

      animationRef.current = requestAnimationFrame(processFrame);
    }

    processFrame();
  }

  function analyseFrame(result) {
    const lighting = analyseLighting();

    const detections = result.detections || [];

    // No face
    if (detections.length === 0) {
      updateChecks({
        lighting,
        face: "missing",
        position: "checking",
        size: "checking",
      });

      setMessage(
        lighting === "low"
          ? "Low light detected. Move to a brighter area."
          : "We cannot detect your face. Position it inside the guide.",
      );

      return;
    }

    // Multiple faces
    if (detections.length > 1) {
      updateChecks({
        lighting,
        face: "multiple",
        position: "checking",
        size: "checking",
      });

      setMessage("Only one person should be visible in the camera.");

      return;
    }

    const detection = detections[0];
    const box = detection.boundingBox;

    const video = videoRef.current;

    if (!video) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Face centre
    const faceCenterX = box.originX + box.width / 2;

    const faceCenterY = box.originY + box.height / 2;

    const screenCenterX = videoWidth / 2;
    const screenCenterY = videoHeight / 2;

    const xOffset = Math.abs(faceCenterX - screenCenterX) / videoWidth;

    const yOffset = Math.abs(faceCenterY - screenCenterY) / videoHeight;

    const centred = xOffset < 0.12 && yOffset < 0.16;

    // Face size
    const faceArea = box.width * box.height;

    const videoArea = videoWidth * videoHeight;

    const faceRatio = faceArea / videoArea;

    const largeEnough = faceRatio > 0.08;
    const notTooLarge = faceRatio < 0.45;

    const sizeGood = largeEnough && notTooLarge;

    const newChecks = {
      lighting,
      face: "good",
      position: centred ? "good" : "bad",
      size: sizeGood ? "good" : "bad",
    };

    updateChecks(newChecks);

    // Priority order for user guidance

    if (lighting === "low") {
      setMessage("Low light detected. Move to a brighter area.");
    } else if (lighting === "bright") {
      setMessage("Lighting is too bright. Avoid strong backlighting.");
    } else if (!largeEnough) {
      setMessage("Move closer to the camera.");
    } else if (!notTooLarge) {
      setMessage("Move slightly further away from the camera.");
    } else if (!centred) {
      setMessage("Centre your face inside the guide.");
    } else {
      setMessage("Great. Your face is ready to scan.");
    }
  }

  function updateChecks(newChecks) {
    setChecks(newChecks);
  }

  // Analyse brightness locally from the video frame
  function analyseLighting() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return "checking";
    }

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    canvas.width = 80;
    canvas.height = 60;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const pixels = imageData.data;

    let brightnessTotal = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      brightnessTotal += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const average = brightnessTotal / (pixels.length / 4);

    if (average < 60) return "low";

    if (average > 220) return "bright";

    return "good";
  }

  function capturePhoto() {
    if (!isReady) return;

    const video = videoRef.current;

    if (!video) return;

    // Temporary in-memory canvas only
    const captureCanvas = document.createElement("canvas");

    captureCanvas.width = video.videoWidth;

    captureCanvas.height = video.videoHeight;

    const ctx = captureCanvas.getContext("2d");

    // Mirror correctly for captured selfie
    ctx.translate(captureCanvas.width, 0);

    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    captureCanvas.toBlob(
      (blob) => {
        if (!blob) return;

        // Send temporary Blob upward
        onCapture?.(blob);

        // Blob is not stored anywhere here
        // The canvas will become eligible for cleanup
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className={`camera camera--${shape}`}>
      <div className="camera__video-wrapper" data-guide="camera">
        {cameraError ? (
          <div className="camera__error">
            <strong>Camera unavailable</strong>
            <p>{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="camera__video"
              autoPlay
              playsInline
              muted
            />

            <div className="camera__overlay">
              <div
                className={`camera__frame ${
                  isReady ? "camera__frame--ready" : ""
                }`}
              />
            </div>

            {loading && (
              <div className="camera__loading">Starting camera...</div>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas used only for local lighting analysis */}
      <canvas ref={canvasRef} className="camera__canvas" />

      {!cameraError && (
        <>
          <div className="camera__status">
            <span
              className={
                isReady
                  ? "camera__status-dot camera__status-dot--ready"
                  : "camera__status-dot"
              }
            />

            {message}
          </div>

          <div className="camera__checks">
            <CheckItem
              good={checks.lighting === "good"}
              label={
                checks.lighting === "good"
                  ? "Lighting is suitable"
                  : "Checking lighting"
              }
            />

            <CheckItem
              good={checks.face === "good"}
              label={
                checks.face === "multiple"
                  ? "Only one face should be visible"
                  : checks.face === "missing"
                    ? "Face not detected"
                    : "Face detected"
              }
            />

            <CheckItem good={checks.position === "good"} label="Face centred" />
          </div>
        </>
      )}

      <p className="camera__hint">{children}</p>

      {shape === "face" && (
        <p className="camera__privacy">
          Your camera feed is processed locally for this verification and is not
          stored.
        </p>
      )}

      <button
        type="button"
        className="camera__capture"
        data-guide="capture"
        disabled={!isReady || loading || !!cameraError}
        onClick={capturePhoto}
      >
        {isReady ? "Capture and verify" : "Position your face to continue"}
      </button>
    </div>
  );
}

function CheckItem({ good, label }) {
  return (
    <div className={`camera__check ${good ? "is-good" : ""}`}>
      <span className="camera__check-icon">{good ? "✓" : "○"}</span>

      <span>{label}</span>
    </div>
  );
}
