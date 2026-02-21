import React, { useEffect, useRef, useState } from "react";
import words from "./constants/words";
import characterImage from "./assets/chars/tori.png";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const currentWord = useRef<string>("");
  const inputIndexRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const imagePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameClear, setIsGameClear] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  const resetGame = () => {
    setIsGameOver(false);
    setIsGameClear(false);
    scoreRef.current = 0;
    inputIndexRef.current = 0;
    imagePos.current = { x: 0, y: 0 };
    currentWord.current = getRandomWord(0, new Set());
    setUsedWords(new Set());
    startTimeRef.current = Date.now();
    imageFallSpeedRef.current = 5;
  }

  useEffect(() => {
    currentWord.current = getRandomWord(0, new Set());
  }, []);

  const textMetricsRef = useRef<{ typedWidth: number; remainingWidth: number }>({
    typedWidth: 0,
    remainingWidth: 0,
  });

  const typedColorRef = useRef<string>("");
  const textColorRef = useRef<string>("");

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    typedColorRef.current = styles.getPropertyValue("--typed-color");
    textColorRef.current = styles.getPropertyValue("--text-color");
  }, []);

  const imageFallSpeedRef = useRef<number>(5);
  const imageSpeed = 10;
  const imageJumpSpeed = 100;
  const goalPosition = { x: 2000 - 100, y: 0 };

  function getRandomWord(score: number, usedWords: Set<string>): string {
    const minLength = Math.min(3 + Math.floor(score * 2), 15);
    console.log("minimum length: ", minLength)
    let filteredWords = [...words].filter((word) => word.length <= minLength && !usedWords.has(word));
    if (filteredWords.length === 0) {
      filteredWords = [...words].filter((word) => word.length <= minLength)
      console.info("Word not found. Allow usedWords.")
    }
    const result = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    return result;
  }

  useEffect(() => {
    const image = new Image();
    image.src = characterImage;
    image.width = 150;
    image.height = image.width * (image.naturalHeight / image.naturalWidth);
    imageRef.current = image;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      if ((isGameOver || isGameClear) && key === " ") {
        resetGame();
        return;
      }

      if (key === currentWord.current[inputIndexRef.current]) {
        inputIndexRef.current += 1;
        imagePos.current.x = Math.min(canvas!.width - 100, imagePos.current.x + imageSpeed);
        imagePos.current.y = Math.max(0, imagePos.current.y - imageJumpSpeed);

        if (inputIndexRef.current === currentWord.current.length) {
          scoreRef.current += 1;
          // NaN < score is always false
          if (parseInt(localStorage.getItem("high_score") ?? "") < scoreRef.current) {
            localStorage.setItem("high_score", scoreRef.current.toString());
            const ctx = canvasRef.current!.getContext("2d");
            if (!ctx) return;
            ctx.strokeText("High Score Updated!", 100, 100, 10)
          }
          if (localStorage.getItem("high_score") == undefined)
            localStorage.setItem("high_score", scoreRef.current.toString())
          currentWord.current = getRandomWord(scoreRef.current, usedWords);
          setUsedWords(prev => {
            const next = new Set(prev);
            next.add(currentWord.current);
            return next;
          });
          inputIndexRef.current = 0;
        }

        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.font = "200px Arial";

        const typedPart = currentWord.current.slice(0, inputIndexRef.current);
        const remainingPart = currentWord.current.slice(inputIndexRef.current);

        textMetricsRef.current = {
          typedWidth: ctx.measureText(typedPart).width,
          remainingWidth: ctx.measureText(remainingPart).width,
        };
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isGameClear, isGameOver, usedWords]);

  useEffect(() => {
    const root = document.documentElement;

    if (isGameOver) {
      root.style.setProperty("--canvas-border", "var(--canvas-border-gameover)");
      root.style.setProperty("--canvas-bg", "var(--canvas-bg-gameover)");
    } else if (isGameClear) {
      root.style.setProperty("--canvas-border", "var(--canvas-border-clear)");
      root.style.setProperty("--canvas-bg", "var(--canvas-bg-clear)");
    } else {
      root.style.setProperty("--canvas-border", "var(--canvas-border-default)");
      root.style.setProperty("--canvas-bg", "var(--canvas-bg-default)");
    }
  }, [isGameOver, isGameClear]);

  const loop = () => {
    imageFallSpeedRef.current = (Date.now() - startTimeRef.current) * 0.0002 + 5;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "gold";
    ctx.fillRect(goalPosition.x, goalPosition.y, 100, 100);

    ctx.font = "200px Arial";
    ctx.textAlign = "center";

    const typedPart = currentWord.current.slice(0, inputIndexRef.current);
    const remainingPart = currentWord.current.slice(inputIndexRef.current);
    // console.log(typedPart, remainingPart);

    const typedWidth = textMetricsRef.current.typedWidth;
    const remainingWidth = textMetricsRef.current.remainingWidth;

    ctx.fillStyle = typedColorRef.current;
    ctx.fillText(typedPart, canvas.width / 2 - remainingWidth / 2, canvas.height! / 2);

    ctx.fillStyle = textColorRef.current;
    ctx.fillText(remainingPart, canvas.width / 2 + typedWidth / 2, canvas.height! / 2);

    // キャラクターを描画
    const image = imageRef.current;
    if (image) {
      ctx.drawImage(
        image,
        imagePos.current.x,
        imagePos.current.y,
        image.width,
        image.height);
    }

    if (canvasRef.current && imagePos.current.y + imageFallSpeedRef.current > canvasRef.current.height) {
      setIsGameOver(true);
      console.log("Game Over")
    } else {
      imagePos.current.y += imageFallSpeedRef.current;
    }

    if (imagePos.current.x >= goalPosition.x && imagePos.current.y <= goalPosition.y + 100) {
      setIsGameClear(true);
    }

    if (isGameOver) {
      ctx.font = "100px Arial";
      ctx.fillStyle = "red";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 100);
    }

    if (isGameClear) {
      ctx.font = "100px Arial";
      ctx.fillStyle = "blue";
      ctx.fillText("Game Clear!", canvas.width / 2, canvas.height / 2 - 100);
    }
  };

  useEffect(() => {
    if (isGameOver || isGameClear) return;

    let frameId: number;

    const mainloop = () => {
      loop();
      frameId = requestAnimationFrame(mainloop);
    };

    frameId = requestAnimationFrame(mainloop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isGameOver, isGameClear]);

  return (
    <div style={{ textAlign: "center" }} className="container">
      <h1>Speeder</h1>
      <canvas ref={canvasRef} width={2000} height={1000} className="word-canvas" />
      <h2>Score: {scoreRef.current}</h2>
      <h2>HighScore: {localStorage.getItem("high_score") ?? "0"}</h2>
      {isGameOver && (
        <div>
          <h2 style={{ color: "red" }}>Game Over!</h2>
          <button
            onClick={() => {
              resetGame();
            }}
          >
            Restart Game
          </button>
        </div>
      )}
      {isGameClear && (
        <div>
          <h2 style={{ color: "blue" }}>Congratulations! Game Clear!</h2>
          <button
            onClick={() => {
              resetGame();
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
