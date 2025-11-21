document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMEN DOM & AUDIO ---
    const targetArea = document.getElementById('target-area');
    const draggableArea = document.getElementById('draggable-area');
    const feedbackElement = document.getElementById('feedback');
    const levelDisplay = document.getElementById('level-display');
    const nextLevelButton = document.getElementById('next-level-button');
    const toggleMusicButton = document.getElementById('toggle-music');
    
    const levelSelector = document.getElementById('level-selector');
    
    const bgm = document.getElementById('bgm');
    const sfxCorrect = document.getElementById('sfx-correct');
    const sfxWrong = document.getElementById('sfx-wrong');
    const sfxCheer = document.getElementById('sfx-cheer'); 
    
    let isMusicPlaying = true;
    bgm.volume = 0.3; 

    // --- FUNGSI AUDIO STABIL ---
    function playSFX(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0; 
            audioElement.play().catch(e => console.log("Gagal memutar SFX:", e));
        }
    }

    function playSFXCorrect() { playSFX(sfxCorrect); } 
    function playSFXWrong() { playSFX(sfxWrong); }
    function playSFXCheer() { playSFX(sfxCheer); } 

    // Mengatasi Kebijakan Autoplay Browser
    function handleFirstInteraction() {
        if (bgm && isMusicPlaying) {
            bgm.play().catch(error => {
                isMusicPlaying = false; 
                toggleMusicButton.textContent = '🔇 Nyalakan Musik';
            });
        }
        document.body.removeEventListener('click', handleFirstInteraction);
    }
    document.body.addEventListener('click', handleFirstInteraction, { once: true });


    // --- KONTROL MUSIK ---
    toggleMusicButton.addEventListener('click', () => {
        if (bgm) {
            if (isMusicPlaying) {
                bgm.pause();
                isMusicPlaying = false;
                toggleMusicButton.textContent = '🔇 Nyalakan Musik';
            } else {
                bgm.play().catch(e => console.log("Gagal menyalakan BGM:", e));
                isMusicPlaying = true;
                toggleMusicButton.textContent = '🎵 Matikan Musik';
            }
        }
    });
    
    // --- 3. DATA & VARIABEL GAME ---
    let currentLevel = 1;
    let draggedElement = null;
    let matchesCount = 0;
    let totalMatches = 0;
    let nextExpectedNumber = 1;

    const maxLevels = 20;
    const gameLevels = [];

    for (let i = 1; i <= maxLevels; i++) {
        let maxNum;
        if (i <= 4) maxNum = 3;   
        else if (i <= 8) maxNum = 5;  
        else if (i <= 12) maxNum = 7; 
        else if (i <= 16) maxNum = 8; 
        else maxNum = 10;           
        
        gameLevels.push({ min: 1, max: maxNum });
    }
    
    // --- INISIALISASI PEMILIHAN LEVEL ---
    function populateLevelSelector() {
        levelSelector.innerHTML = '';
        gameLevels.forEach((levelData, index) => {
            const levelNum = index + 1;
            const option = document.createElement('option');
            option.value = levelNum;
            option.textContent = `Level ${levelNum} (1 - ${levelData.max})`;
            levelSelector.appendChild(option);
        });
        levelSelector.value = currentLevel; 
    }
    
    levelSelector.addEventListener('change', (e) => {
        const selectedLevel = parseInt(e.target.value); 
        loadLevel(selectedLevel);
    });

    // --- 4. FUNGSI UTAMA MEMUAT LEVEL ---

    function loadLevel(levelIndex) {
        if (levelIndex > maxLevels) {
            setFeedback('🏆 LUAR BIASA! Kamu menyelesaikan SEMUA 20 LEVEL hingga 1-10! 🥳', 'gold');
            if (isMusicPlaying) bgm.pause();
            nextLevelButton.style.display = 'none';
            levelDisplay.textContent = 'Permainan Selesai!';
            targetArea.innerHTML = '';
            draggableArea.innerHTML = '';
            return;
        }
        
        currentLevel = levelIndex;
        levelSelector.value = currentLevel; 

        const levelData = gameLevels[levelIndex - 1];
        nextExpectedNumber = levelData.min;
        totalMatches = levelData.max - levelData.min + 1;
        matchesCount = 0;

        levelDisplay.textContent = `Level ${currentLevel} dari ${maxLevels} (Angka ${levelData.min} sampai ${levelData.max})`;
        nextLevelButton.style.display = 'none';
        setFeedback(`Ayo mulai! Taruh angka **${nextExpectedNumber}** dulu!`, '#3e2f5b');
        targetArea.innerHTML = ''; 
        draggableArea.innerHTML = ''; 
        
        let numbers = [];
        for (let i = levelData.min; i <= levelData.max; i++) {
            numbers.push(i);
            const target = document.createElement('div');
            target.className = `target`; 
            target.dataset.number = i;
            // Target tidak menampilkan angka sampai gerbong masuk
            targetArea.appendChild(target);
        }

        const shuffledNumbers = shuffleArray(numbers); 
        shuffledNumbers.forEach(num => {
            const draggable = document.createElement('div');
            draggable.className = `draggable`;
            draggable.textContent = num;
            draggable.dataset.number = num;
            draggable.setAttribute('draggable', 'true');
            draggableArea.appendChild(draggable);
        });

        attachDragEvents();
    }

    // --- 5. FUNGSI DRAG AND DROP (Logika Urutan) ---

    function attachDragEvents() {
        const draggables = document.querySelectorAll('.draggable');
        const targets = document.querySelectorAll('.target');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', (e) => {
                draggedElement = draggable;
            });
        });

        targets.forEach(target => {
            target.addEventListener('dragover', (e) => {
                e.preventDefault(); 
                target.classList.add('drag-over');
            });

            target.addEventListener('dragleave', () => {
                target.classList.remove('drag-over');
            });

            target.addEventListener('drop', (e) => {
                e.preventDefault();
                target.classList.remove('drag-over');

                if (!draggedElement || draggedElement.getAttribute('draggable') === 'false') return;

                const droppedNumber = parseInt(draggedElement.dataset.number);
                const targetNumber = parseInt(target.dataset.number);
                
                if (droppedNumber === targetNumber) { 
                    if (droppedNumber === nextExpectedNumber) { 
                        handleMatch(draggedElement, target);
                    } else {
                        handleMismatch(target, `❌ Ups! Sekarang giliran angka **${nextExpectedNumber}**.`);
                    }
                } else {
                    handleMismatch(target, `❌ Salah tempat! Angka **${droppedNumber}** tidak bisa ditaruh di situ.`);
                }
            });
        });
    }

    // --- 6. FUNGSI HANDLER ---

    function handleMatch(shape, box) {
        matchesCount++;
        playSFXCorrect(); 

        // Visual
        box.innerHTML = ''; 
        box.appendChild(shape);
        shape.style.margin = '0';
        shape.style.opacity = '1'; 
        shape.setAttribute('draggable', 'false'); 
        // Mengembalikan font-size agar angka terlihat di target
        shape.style.fontSize = '2.5em'; 
        box.style.border = '4px solid #00AA00'; 

        // Logika Urutan
        nextExpectedNumber++; 

        setFeedback(`✨ Hebat! Itu angka **${nextExpectedNumber - 1}**! Sekarang cari angka **${nextExpectedNumber}**! ✨`, '#79c99e');

        if (matchesCount === totalMatches) {
            playSFXCheer(); 
            setTimeout(() => {
                setFeedback(`🎉 Level ${currentLevel} SELESAI! 🎉`, 'gold');
                if (currentLevel < maxLevels) {
                    nextLevelButton.style.display = 'block';
                } else {
                    loadLevel(currentLevel + 1); 
                }
            }, 500);
        }
    }

    function handleMismatch(box, message) {
        playSFXWrong(); 
        setFeedback(message, '#ff6f61');
        
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 500);
    }

    function setFeedback(message, color) {
        feedbackElement.innerHTML = message;
        feedbackElement.style.color = color;
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- 7. INITIALISASI ---
    nextLevelButton.addEventListener('click', () => {
        loadLevel(currentLevel + 1);
    });

    populateLevelSelector();
    loadLevel(1); 
});