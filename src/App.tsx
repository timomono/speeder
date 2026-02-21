import React, { useEffect, useRef, useState } from "react";
import words from "./constants/words";
import characterImage from "./assets/chars/exports/neon.svg";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [usedWords,] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState<string>(getRandomWord(0));
  const [inputIndex, setInputIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [imageX, setImageX] = useState<number>(0); // キャラクターのX位置
  const [imageY, setImageY] = useState<number>(0); // キャラクターのY位置
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameClear, setIsGameClear] = useState<boolean>(false);

  const imageFallSpeed = 50;
  const imageSpeed = 70;
  const imageJumpSpeed = 100;
  const goalPosition = { x: 2000 - 100, y: 0 };

  function getRandomWord(score: number): string {
    const minLength = Math.min(3 + Math.floor(score / 5), 15);
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
    imageRef.current = image;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (isGameOver || isGameClear) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;

      if (key === currentWord[inputIndex]) {
        setInputIndex((prev) => prev + 1);
        setImageX((prev) => Math.min(canvas!.width - 100, prev + imageSpeed));
        setImageY((prev) => Math.max(0, prev - imageJumpSpeed));

        if (inputIndex + 1 === currentWord.length) {
          setScore((prev) => prev + 1);
          // NaN < score is always false
          if (parseInt(localStorage.getItem("high_score") ?? "") < score) {
            localStorage.setItem("high_score", (score + 1).toString());
            const ctx = canvasRef.current!.getContext("2d");
            if (!ctx) return;
            ctx.strokeText("High Score Updated!", 100, 100, 10)
          }
          if (localStorage.getItem("high_score") == undefined)
            localStorage.setItem("high_score", (score + 1).toString())
          setCurrentWord(getRandomWord(score + 1));
          usedWords.add(currentWord);
          setInputIndex(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentWord, inputIndex, score, isGameOver, isGameClear]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ゴール地点を描画
    ctx.fillStyle = "gold";
    ctx.fillRect(goalPosition.x, goalPosition.y, 100, 100);

    // 現在の単語を描画
    ctx.font = "200px Arial";
    ctx.textAlign = "center";

    const typedPart = currentWord.slice(0, inputIndex);
    const remainingPart = currentWord.slice(inputIndex);

    const typedWidth = ctx.measureText(typedPart).width;
    const remainingWidth = ctx.measureText(remainingPart).width;

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--typed-color");
    ctx.fillText(typedPart, canvas.width / 2 - remainingWidth / 2, canvas.height! / 2);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-color");
    ctx.fillText(remainingPart, canvas.width / 2 + typedWidth / 2, canvas.height! / 2);

    // キャラクターを描画
    const image = imageRef.current;
    if (image) {
      ctx.drawImage(image, imageX, imageY, image.width, image.height);
    }

    // ゴールに到達したか確認
    if (imageX >= goalPosition.x && imageY <= goalPosition.y + 100) {
      setIsGameClear(true);
    }

    // ゲームオーバーの表示
    if (isGameOver) {
      ctx.font = "100px Arial";
      ctx.fillStyle = "red";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 100);
    }

    // ゲームクリアの表示
    if (isGameClear) {
      ctx.font = "100px Arial";
      ctx.fillStyle = "blue";
      ctx.fillText("Game Clear!", canvas.width / 2, canvas.height / 2 - 100);
    }
  }, [currentWord, inputIndex, imageX, imageY, isGameOver, isGameClear, goalPosition.x, goalPosition.y]);

  useEffect(() => {
    if (isGameOver || isGameClear) return;

    const interval = setInterval(() => {
      setImageY((prev) => {
        if (canvasRef.current && prev + imageFallSpeed > canvasRef.current.height) {
          setIsGameOver(true);
          return prev;
        }
        return prev + 10;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isGameOver, isGameClear]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }} className="container">
      <h1>Speeder</h1>
      <canvas ref={canvasRef} width={2000} height={1000} className="word-canvas" />
      <h2>Score: {score}</h2>
      <h2>HighScore: {localStorage.getItem("high_score") ?? "0"}</h2>
      {isGameOver && (
        <div>
          <h2 style={{ color: "red" }}>Game Over!</h2>
          <button
            onClick={() => {
              setIsGameOver(false);
              setImageX(0);
              setImageY(0);
              setScore(0);
              setInputIndex(0);
              setCurrentWord(getRandomWord(0));
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
              setIsGameClear(false);
              setImageX(0);
              setImageY(500);
              setScore(0);
              setInputIndex(0);
              setCurrentWord(getRandomWord(0));
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
