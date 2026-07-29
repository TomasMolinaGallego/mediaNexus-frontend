import React, { useEffect, useRef, useState } from 'react';
import styles from './BulletHell.module.css';

const BulletHell = ({ onExit }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [showRescue, setShowRescue] = useState(false);
  const [isRescueMode, setIsRescueMode] = useState(false);
  const [messages, setMessages] = useState([]);

  const gameState = useRef({
    player: { x: 0, y: 0 },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    frame: 0,
    isGameOver: false,
    nextSpawn: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const createEnemy = () => {
      const names = ["SQUARE ENIX", "MARKETING", "LEGAL TEAM", "QA DEPT", "LOCALIZATION"];
      return {
        x: Math.random() * (canvas.width - 200) + 100,
        y: -50,
        targetY: Math.random() * (canvas.height * 0.4) + 50,
        text: names[Math.floor(Math.random() * names.length)],
        hp: isRescueMode ? 5 : 15,
        speed: 2, // VELOCIDAD FIJA
        hitTimer: 0
      };
    };

    const animate = () => {
      // Si el diálogo está visible, pausamos la actualización del juego 
      // para que nada se acelere ni se mueva por debajo
      if (showRescue) {
        requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const state = gameState.current;

      // 1. GENERACIÓN (Frecuencia constante)
      if (state.frame >= state.nextSpawn) {
        state.enemies.push(createEnemy());
        state.nextSpawn = state.frame + 100;
      }

      // 2. ENEMIGOS
      state.enemies.forEach((en, i) => {
        if (en.y < en.targetY) en.y += en.speed;

        // Disparo circular con VELOCIDAD FIJA (3)
        if (state.frame % 60 === 0) {
          const count = 8;
          for (let j = 0; j < count; j++) {
            const angle = (j * Math.PI * 2) / count + (state.frame * 0.02);
            state.enemyBullets.push({ 
              x: en.x, 
              y: en.y, 
              vx: Math.cos(angle) * 3, // Siempre 3
              vy: Math.sin(angle) * 3  // Siempre 3
            });
          }
        }

        // Animación de Golpe
        ctx.save();
        if (en.hitTimer > 0) {
          ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
          ctx.fillStyle = '#ffffff';
          en.hitTimer--;
        } else {
          ctx.fillStyle = '#000000';
        }
        ctx.font = 'bold 18px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(en.text, en.x, en.y);
        ctx.restore();

        // Colisión balas jugador
        state.bullets.forEach((b, bi) => {
          if (Math.hypot(b.x - en.x, b.y - en.y) < 30) {
            en.hp--;
            en.hitTimer = 3;
            state.bullets.splice(bi, 1);
            if (en.hp <= 0) {
              state.enemies.splice(i, 1);
              setScore(s => s + 1000);
              if (isRescueMode) triggerSupportMessage();
            }
          }
        });
      });

      // 3. BALAS ENEMIGAS (Velocidad constante)
      ctx.fillStyle = '#000';
      state.enemyBullets.forEach((eb, i) => {
        eb.x += eb.vx;
        eb.y += eb.vy;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Colisión con jugador
        if (Math.hypot(eb.x - state.player.x, eb.y - state.player.y) < 10) {
          if (!isRescueMode) {
            setShowRescue(true); // Abrir diálogo
          } else {
            state.enemyBullets.splice(i, 1); // Absorber bala
          }
        }
        if (eb.y > canvas.height || eb.x < 0 || eb.x > canvas.width) {
          state.enemyBullets.splice(i, 1);
        }
      });

      // 4. JUGADOR Y ALIADOS
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      
      // Dibujar Nave
      drawShip(ctx, state.player.x, state.player.y, 15);
      if (state.frame % 10 === 0) state.bullets.push({ x: state.player.x, y: state.player.y - 20 });

      if (isRescueMode) {
        const allies = 6;
        for (let i = 0; i < allies; i++) {
          const angle = (state.frame * 0.05) + (i * Math.PI * 2) / allies;
          const ax = state.player.x + Math.cos(angle) * 50;
          const ay = state.player.y + Math.sin(angle) * 50;
          drawShip(ctx, ax, ay, 8);
          if (state.frame % 15 === 0) state.bullets.push({ x: ax, y: ay - 10 });
        }
      }

      state.bullets.forEach((b, i) => {
        b.y -= 12;
        ctx.fillRect(b.x - 1, b.y, 2, 12);
        if (b.y < 0) state.bullets.splice(i, 1);
      });

      state.frame++;
      requestAnimationFrame(animate);
    };

    const drawShip = (c, x, y, s) => {
      c.beginPath();
      c.moveTo(x, y - s);
      c.lineTo(x - s, y + s);
      c.lineTo(x + s, y + s);
      c.closePath();
      c.stroke();
    };

    const triggerSupportMessage = () => {
      const users = ["2B", "9S", "A2", "Pascal", "Commander"];
      const msg = `Rescate: [${users[Math.floor(Math.random()*users.length)]}] protegiendo...`;
      setMessages(prev => [msg, ...prev].slice(0, 3));
    };

    const handleMove = (e) => {
      if (!showRescue) {
        gameState.current.player = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener('mousemove', handleMove);
    const loop = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(loop);
    };
  }, [isRescueMode, showRescue]);

  return (
    <div className={styles.gameContainer}>
      <canvas ref={canvasRef} />
      
      <div className={styles.uiOverlay}>
        <div className={styles.stats}>
          <p>HACKING_PROTOCOL: {isRescueMode ? 'E_END_ENHANCED' : 'INITIAL'}</p>
          <p>SCORE: {score.toLocaleString()}</p>
        </div>
        <div className={styles.messageLog}>
          {messages.map((m, i) => <div key={i} className={styles.msg}>{m}</div>)}
        </div>
      </div>

      {showRescue && (
        <div className={styles.dialogOverlay}>
          <div className={styles.yorhaDialog}>
            <div className={styles.innerBorder}>
              <p className={styles.dialogText}>
                POD 042: ERROR CRÍTICO. <br/>
                ¿Aceptar ayuda de otros usuarios?
              </p>
              <div className={styles.buttonGroup}>
                <button className={styles.yorhaButtonSecondary} onClick={onExit}>RENDIRSE</button>
                <button className={styles.yorhaButton} onClick={() => {
                  setIsRescueMode(true);
                  setShowRescue(false);
                }}>AFIRMATIVO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulletHell;