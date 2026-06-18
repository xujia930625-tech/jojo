window.onload = function() {
    // === 1. 請求瀏覽器通知權限 ===
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("使用者已允許通知");
            }
        });
    }

    // === 2. 彈出視窗並替換名字 ===
    let userInfo = prompt("請輸入學號與姓名 (例如：1236458王小明)：", "11135028蔡緒嘉");
    if (userInfo && userInfo.trim() !== "") {
        document.getElementById("logoText").textContent = userInfo;
        let name = userInfo.replace(/^[a-zA-Z0-9\s]+/, "");
        if (!name) name = userInfo;
        document.getElementById("dynamicName").textContent = name;
    }

    // === 3. 變換顏色功能 ===
    const colorBtn = document.getElementById("colorBtn");
    colorBtn.addEventListener("click", function() {
        document.getElementById("dynamicName").classList.toggle("color-red");
    });

    // === 4. 處理推播通知的函數 ===
    function notifyUser(task) {
        if (Notification.permission === "granted") {
            new Notification("AI助理提醒", { body: `時間到了！該去處理：${task}` });
        }
    }

    function scheduleReminder(task, time) {
        const now = new Date();
        const reminderTime = new Date(time);
        const delay = reminderTime - now;
        if (delay > 0) {
            setTimeout(() => notifyUser(task), delay);
        }
    }
// === 新增：更新進度條與文字的函數 ===
    function updateProgress() {
        // 抓取畫面上所有的代辦事項、以及被標記為 completed 的事項
        const totalTasks = document.querySelectorAll('.todo-item').length;
        const completedTasks = document.querySelectorAll('.todo-item.completed').length;
        
        const progressContainer = document.getElementById('progress-container');
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');

        if (totalTasks === 0) {
            // 如果清單空了，就隱藏整個進度條區塊
            progressContainer.style.display = 'none';
        } else {
            // 顯示進度條並計算百分比
            progressContainer.style.display = 'block';
            progressText.textContent = `目前進度：共 ${totalTasks} 項 / 已完成 ${completedTasks} 項`;
            
            const percentage = (completedTasks / totalTasks) * 100;
            progressFill.style.width = percentage + '%'; // 改變進度條寬度
        }
    }
    // === 5. 發送指令與代辦事項的整合核心邏輯 ===
    const sendBtn = document.getElementById("sendBtn");
    const commandInput = document.getElementById("commandInput");
    const timeInput = document.getElementById("todo-time");
    const aiResponse = document.getElementById("aiResponse");

    sendBtn.addEventListener("click", function() {
        const inputValue = commandInput.value.trim();
        const timeValue = timeInput.value;

        // 智慧判斷：如果輸入框以「代辦」開頭，或者有設定時間，就判定為代辦事項
        const isTodo = inputValue.startsWith("代辦") || timeValue !== "";

        if (inputValue === "") {
            aiResponse.textContent = "AI助理：請輸入指令或代辦事項";
        } else if (inputValue === "你好") {
            aiResponse.textContent = "AI助理：哈囉";
        } else if (inputValue === "淺色") {
            document.body.className = "theme-light";
            aiResponse.textContent = "AI助理：已為您切換至「淺色」主題！";
        } else if (inputValue === "駭客") {
            document.body.className = "theme-hacker";
            aiResponse.textContent = "AI助理：System Override... 已進入「駭客」模式！";
        } else if (inputValue === "深色") {
            document.body.className = "";
            aiResponse.textContent = "AI助理：已為您恢復預設的「深色」主題！";
        } else if (isTodo) {
            // 處理代辦事項邏輯
            let taskText = inputValue.replace(/^代辦\s*/, ""); // 過濾掉開頭的"代辦"字眼
            
            if (taskText === "") {
                aiResponse.textContent = "AI助理：請輸入代辦事項的具體內容！";
                return;
            }

            // ==========================================
            // 🌟 時間防呆機制 (阻擋設定過去的時間)
            // ==========================================
            if (timeValue) {
                const selectedTime = new Date(timeValue).getTime(); // 將選擇的時間轉為毫秒數
                const now = new Date().getTime(); // 取得目前的準確時間（毫秒數）
                
                if (selectedTime <= now) {
                    aiResponse.textContent = "AI助理：設定失敗！時光機還沒發明，請勿選擇過去的時間喔！";
                    return; // 關鍵：直接中斷程式，不執行下方的新增動作
                }
            }
            // ==========================================

            // 動態建立清單元素
            const li = document.createElement('li');
            li.className = 'todo-item';

            const textSpan = document.createElement('span');
            textSpan.textContent = taskText;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'todo-time-badge';
            timeSpan.textContent = timeValue ? new Date(timeValue).toLocaleString() : '未設定時間';

            li.appendChild(textSpan);
            li.appendChild(timeSpan);

            // 點擊完成、雙擊刪除的互動
            li.onclick = function() {
                this.classList.toggle('completed');
                updateProgress(); // 🌟 插入點 1：標記完成或取消完成時，更新進度！
            };
            li.ondblclick = function() {
                this.remove();
                updateProgress(); // 🌟 插入點 2：刪除項目後，更新進度！
            };

            document.getElementById('todo-list').appendChild(li);
            
            // 啟動排程推播
            if (timeValue) {
                scheduleReminder(taskText, timeValue);
            }

            aiResponse.textContent = `AI助理：已新增代辦「${taskText}」！${timeValue ? '並設定了推播提醒。' : '單擊標記完成，雙擊刪除。'}`;
            timeInput.value = ''; // 清空時間選擇器
            
            updateProgress(); // 🌟 插入點 3：成功新增項目到畫面上後，更新進度！
            
        } else {
            // 其他未定義的指令
            aiResponse.textContent = `AI助理：我收到你的訊息「${inputValue}」了！等下周接上雲端我就能完全理解囉！`;
        }

        commandInput.value = ""; // 清空輸入框
    });
};