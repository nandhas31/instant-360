import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";

import styles from "./EquirectPreview.module.css";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

export interface EquirectPreviewProps {
  readonly imageSrc: string;
  readonly lensFovDeg: number;
  readonly className?: string;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info ?? "unknown"}`);
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = nullable(gl.createProgram());
  if (!program) throw new Error("Failed to create program");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info ?? "unknown"}`);
  }

  return program;
}

/**
 * lib.dom types every WebGL2 "create*" call as always returning a non-null
 * object, but the spec allows null once the context is lost. Routing the
 * result through this function (rather than an `as` assertion, which
 * TypeScript's flow analysis sees straight through) is what makes the
 * nullability check on the other side of a "create" call a real,
 * non-redundant check.
 */
function nullable<T extends object>(value: T): T | null {
  return value;
}

const PITCH_LIMIT = Math.PI / 2 - 0.01;
const DRAG_SENSITIVITY = 0.005;

/**
 * Renders a side-by-side dual-fisheye source image reprojected to
 * equirectangular via a WebGL2 fragment shader, with drag-to-look. Falls
 * back to the raw source image when WebGL2 isn't available.
 */
export function EquirectPreview({ imageSrc, lensFovDeg, className }: EquirectPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let positionBuffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let disposed = false;

    const yaw = { current: 0 };
    const pitch = { current: 0 };

    try {
      program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    } catch (error) {
      console.error(error);
      setWebglSupported(false);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const sourceLocation = gl.getUniformLocation(program, "u_source");
    const yawLocation = gl.getUniformLocation(program, "u_yaw");
    const pitchLocation = gl.getUniformLocation(program, "u_pitch");
    const fovLocation = gl.getUniformLocation(program, "u_lensFovRad");

    vao = nullable(gl.createVertexArray());
    gl.bindVertexArray(vao);

    positionBuffer = nullable(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Full-screen triangle strip covering clip space [-1, 1].
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    texture = nullable(gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    function render(): void {
      if (!gl || !program || !canvas || disposed) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1i(sourceLocation, 0);
      gl.uniform1f(yawLocation, yaw.current);
      gl.uniform1f(pitchLocation, pitch.current);
      gl.uniform1f(fovLocation, (lensFovDeg * Math.PI) / 180);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function resize(): void {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      render();
    }

    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      resize();
    };
    image.src = imageSrc;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(event: PointerEvent): void {
      if (!canvas) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent): void {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      yaw.current -= dx * DRAG_SENSITIVITY;
      pitch.current = Math.max(
        -PITCH_LIMIT,
        Math.min(PITCH_LIMIT, pitch.current + dy * DRAG_SENSITIVITY),
      );
      render();
    }

    function onPointerUp(event: PointerEvent): void {
      if (!canvas) return;
      dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      disposed = true;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", resize);
      image.onload = null;

      if (texture) gl.deleteTexture(texture);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (vao) gl.deleteVertexArray(vao);
      // `program` is provably non-null here: the only path that could leave
      // it null (createProgram throwing) returns from the effect early,
      // before this cleanup closure is ever created.
      gl.deleteProgram(program);
    };
  }, [imageSrc, lensFovDeg]);

  if (!webglSupported) {
    return (
      <img className={cx(styles.fallbackImage, className)} src={imageSrc} alt="Clip preview" />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cx(styles.canvas, className)}
      role="img"
      aria-label="Interactive 360 preview. Drag to look around."
    />
  );
}
