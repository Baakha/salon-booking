const API_URL = "https://salon-booking-ycq5.onrender.com/api";
let selTime = null;

// Установка даты по умолчанию
const today = new Date().toISOString().split('T')[0];
document.getElementById('dateInput').value = today;

// 1. ЗАГРУЗКА СЛОТОВ
async function load() {
    const d = document.getElementById('dateInput').value;
    const m = document.getElementById('master').value;
    const grid = document.getElementById('slots');
    
    grid.innerHTML = "Загрузка...";

    try {
        const res = await fetch(`${API_URL}/busy-slots?date=${d}&master=${m}`);
        const rawBusyTimes = await res.json();
        
        if (Array.isArray(rawBusyTimes)) {
            const cleanBusyTimes = rawBusyTimes.map(t => t.substring(0, 5));
            draw(cleanBusyTimes);
        }
    } catch (e) {
        grid.innerHTML = "Ошибка связи.";
    }
}

// 2. ОТРИСОВКА СЛОТОВ
function draw(busyTimes) {
    const grid = document.getElementById('slots');
    grid.innerHTML = "";
    const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

    times.forEach(t => {
        const isBusy = busyTimes.includes(t); 
        const div = document.createElement("div");
        div.className = "slot " + (isBusy ? "busy" : "free");
        div.innerText = t;

        if (!isBusy) {
            div.onclick = () => {
                document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
                div.classList.add("selected");
                selTime = t;
            };
        }
        grid.appendChild(div);
    });
}

// 3. ОТПРАВКА ЗАПИСИ
document.getElementById("bookBtn").onclick = async function () {
    const name = document.getElementById("userName").value;
    const phone = document.getElementById("userPhone").value;
    const date = document.getElementById("dateInput").value;
    const master = document.getElementById("master").value;
    const service = document.getElementById("service").value;

    if (!name || !phone || !selTime) {
        alert("Заполни все поля и выбери время!");
        return;
    }

    const payload = { name, phone, date, time: selTime, master, service };

    try {
        const res = await fetch(`${API_URL}/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.status === "SUCCESS") {
            alert("Вы успешно записались! ✅");
            // Сохраняем данные в браузер клиента
            localStorage.setItem('myBooking', JSON.stringify(result.data));
            checkMyBooking(); // Обновляем инфо внизу
            load(); // Обновляем слоты
        }
    } catch (e) {
        alert("Ошибка при записи.");
    }
};

// 4. ФУНКЦИЯ ОТОБРАЖЕНИЯ И ОТМЕНЫ ЗАПИСИ
function checkMyBooking() {
    const saved = localStorage.getItem('myBooking');
    const container = document.querySelector('.container');
    
    // Удаляем старую карточку если она была
    const oldCard = document.getElementById('myRecord');
    if (oldCard) oldCard.remove();

    if (saved) {
        const data = JSON.parse(saved);
        const html = `
            <div id="myRecord" class="card" style="margin-top: 20px; border: 2px solid var(--g);">
                <h4 style="margin:0; color: var(--g);">Вы записались ✅</h4>
                <p style="font-size: 14px; margin: 10px 0;">
                    <strong>Мастер:</strong> ${data.master}<br>
                    <strong>Дата:</strong> ${data.date}<br>
                    <strong>Время:</strong> ${data.time.substring(0,5)}<br>
                    <strong>Услуга:</strong> ${data.service}
                </p>
                <button onclick="cancelBooking(${data.id})" style="background: var(--r); color:white; border:none; padding:10px; border-radius:10px; width:100%; cursor:pointer;">
                    Отменить запись
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }
}

// 5. ОТМЕНА ЗАПИСИ (Нужно добавить DELETE маршрут на сервер или просто очистить)
async function cancelBooking(id) {
    if (!confirm("Вы уверены, что хотите отменить запись?")) return;
    
    // В идеале тут должен быть fetch(`${API_URL}/cancel/${id}`, {method: 'DELETE'})
    // Но пока просто очистим память клиента для примера
    localStorage.removeItem('myBooking');
    alert("Запись отменена");
    location.reload(); 
}

// При запуске
document.getElementById("dateInput").onchange = load;
document.getElementById("master").onchange = load;
load();
checkMyBooking(); // Проверяем, есть ли запись в памяти при входе на сайт
